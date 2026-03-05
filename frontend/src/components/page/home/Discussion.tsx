"use client";

import React, { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useUser } from "@clerk/nextjs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Loader2, WifiOff, Wifi } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Chats } from "../../types/chats";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:5000";

export default function Discussion() {
  const t = useTranslations("community");
  const { user, isLoaded } = useUser();
  const [messages, setMessages] = useState<Chats[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [loading, setLoading] = useState(true); // initial loading for history
  const [isConnected, setIsConnected] = useState(false);
  const [reconnects, setReconnects] = useState(0);

  const socketRef = useRef<Socket | null>(null);
  const scrollAnchorRef = useRef<HTMLDivElement | null>(null);
  const mountedRef = useRef(true);

  const userid = user?.id;
  const username =
    user?.fullName ||
    user?.username ||
    user?.primaryEmailAddress?.emailAddress ||
    "User";

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Connect socket once Clerk user loader is ready. We guard so we only attempt once.
  useEffect(() => {
    if (!isLoaded) return;

    setLoading(true);

    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    const onConnect = () => {
      setIsConnected(true);
      setReconnects(0);
      socket.emit("join-room");
    };
    const onDisconnect = () => {
      setIsConnected(false);
      if (mountedRef.current) toast.error(t("errors.disconnected"));
    };

    const onReconnectAttempt = (attempt: number) => {
      setReconnects(attempt);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("reconnect_attempt", onReconnectAttempt);

    socket.on("history", (history: Chats[]) => {
      if (!mountedRef.current) return;

      if (Array.isArray(history)) {
        setMessages(history.map(normalizeServerMessage));
        setTimeout(() => scrollToBottom(true), 60);
      }
      setLoading(false);
    });

    // NEW: dedupe/replace temp when receiving server message
    socket.on("receive-message", (msg: Chats) => {
      if (!mountedRef.current) return;
      const normalized = normalizeServerMessage(msg);
      replaceTempOrAppend(normalized);
      setTimeout(() => scrollToBottom(), 40);
    });

    socket.on("history-error", () => {
      console.error("History load failed");
      if (mountedRef.current) {
        setLoading(false);
        toast.error(t("errors.historyFailed"));
      }
    });

    socket.on("send-error", () => {
      console.error("Send failed");
      if (mountedRef.current) toast.error(t("errors.sendFailed"));
    });

    socket.on("connect_error", () => {
      console.error("connect_error");
      if (mountedRef.current) toast.error(t("errors.connectFailed"));
    });

    return () => {
      try {
        socket.off();
        socket.disconnect();
      } catch {
        // ignore
      }
      socketRef.current = null;
    };
  }, [isLoaded, t]);

  // helper to normalize message shape from server -> Chats
  function normalizeServerMessage(msg: Chats): Chats {
    return {
      _id: msg._id ?? String(Math.random()),
      message: msg.message,
      username: msg.username,
      userid: msg.userid,
      createdAt: msg.createdAt ?? new Date().toISOString(),
    } as Chats;
  }

  // Replace a matching temp message (by userid + text + nearby time) OR append
  function replaceTempOrAppend(incoming: Chats) {
    setMessages((prev) => {
      // try to find a temp message that looks like this incoming message
      const now = new Date(incoming.createdAt).getTime();
      const tempIndex = prev.findIndex((m) => {
        // temp ids are those we create client-side starting with "temp-"
        const isTemp = typeof m._id === "string" && m._id.startsWith("temp-");
        if (!isTemp) return false;
        if (m.userid !== incoming.userid) return false;
        if (String(m.message).trim() !== String(incoming.message).trim())
          return false;

        // if temp has createdAt, compare closeness
        const tempTime = new Date(m.createdAt ?? Date.now()).getTime();
        const delta = Math.abs(now - tempTime);
        // within 7 seconds -> consider same message
        return delta < 7000;
      });

      if (tempIndex !== -1) {
        // replace the temp with the incoming saved message
        const copy = [...prev];
        copy[tempIndex] = incoming;
        return copy;
      }

      // no temp found -> check for duplicates by server _id (rare) or message+user+time
      const alreadyExists = prev.some((m) => {
        if (m._id && incoming._id && m._id === incoming._id) return true;
        if (
          m.userid === incoming.userid &&
          String(m.message).trim() === String(incoming.message).trim()
        ) {
          const mTime = new Date(m.createdAt ?? 0).getTime();
          const inTime = new Date(incoming.createdAt ?? 0).getTime();
          return Math.abs(mTime - inTime) < 7000;
        }
        return false;
      });

      if (alreadyExists) {
        // don't append duplicate
        return prev;
      }

      return [...prev, incoming];
    });
  }

  function scrollToBottom(immediate = false) {
    if (scrollAnchorRef.current) {
      scrollAnchorRef.current.scrollIntoView({
        behavior: immediate ? "auto" : "smooth",
        block: "end",
      });
    }
  }

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || isSending) return;

    if (!isConnected) {
      toast.error(t("errors.offlineSend"));
      return;
    }

    setIsSending(true);
    const messageText = newMessage.trim();
    setNewMessage("");

    const payload = {
      message: messageText,
      username: username,
      userid: userid,
    };

    try {
      // optimistic UI: push a temporary message to show immediate feedback
      socketRef.current?.emit(
        "send-message",
        payload,
        (ack: { saved?: Chats } | undefined) => {
          // If server responds with an ack containing the saved message, replace temp with saved.
          if (ack && ack.saved) {
            const saved = normalizeServerMessage(ack.saved);
            replaceTempOrAppend(saved);
          }
        }
      );
    } catch (err) {
      console.error("emit error", err);
      toast.error("Failed to send message.");
    } finally {
      setTimeout(() => setIsSending(false), 150);
    }
  };

  // small helper to format time
  const formatTime = () => {
    try {
      return new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "--:--";
    }
  };

  return (
    <main className="h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl h-[90vh] flex flex-col">
        <Card className="flex-1 flex flex-col shadow-2xl border-0 bg-white/95 backdrop-blur-md overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-6 py-3 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl">
                  ðŸŒ¾
                </div>
                <span
                  className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${
                    isConnected ? "bg-green-400" : "bg-yellow-400"
                  }`}
                ></span>
              </div>
              <div>
                <h1 className="text-white font-bold text-xl">
                  {t("discussion.chatTitle")}
                </h1>
                <p className="text-emerald-100 text-sm flex items-center gap-2">
                  {isConnected ? (
                    <span className="inline-flex items-center gap-2">
                      <Wifi className="h-4 w-4" /> Connected
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      <WifiOff className="h-4 w-4" /> Offline{" "}
                      {reconnects ? ` (trying ${reconnects})` : ""}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="">
              <div className="text-white text-sm mr-2">
                {user
                  ? t("discussion.signedInAs", { username })
                  : t("discussion.guest")}
              </div>
            </div>
          </div>

          <div
            className="flex-1 overflow-y-auto bg-[#f7faf9] px-6 py-4"
            style={{ scrollBehavior: "smooth", overflowAnchor: "none" }}
          >
            {loading ? (
              <div className="space-y-4">
                {/* simple skeleton */}
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex items-start gap-3 animate-pulse">
                    <div className="w-10 h-10 rounded-full bg-gray-200" />
                    <div className="flex-1">
                      <div className="h-3 w-32 bg-gray-200 rounded mb-2" />
                      <div className="h-8 bg-gray-200 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center mb-4">
                  <span className="text-5xl">ðŸ’­</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  {t("discussion.noMessages")}
                </h3>
                <p className="text-gray-500">{t("discussion.beFirst")}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {messages.map((msg, index) => {
                  const isOwn = msg.userid === userid;
                  const showAvatar =
                    index === 0 || messages[index - 1].userid !== msg.userid;
                  const showName = !isOwn && showAvatar;

                  return (
                    <div
                      key={msg._id}
                      className={`flex items-end gap-2 ${
                        isOwn ? "flex-row-reverse" : "flex-row"
                      } ${showAvatar ? "mt-4" : "mt-1"}`}
                    >
                      {showAvatar && !isOwn ? (
                        <Avatar className="h-9 w-9 ring-2 ring-white shadow-md">
                          <AvatarImage />
                          <AvatarFallback className="bg-gradient-to-br from-emerld-500 to-teal-500 text-white text-xs font-semibold">
                            {msg.username?.charAt(0)?.toUpperCase() ?? "U"}
                          </AvatarFallback>
                        </Avatar>
                      ) : !isOwn ? (
                        <div className="h-9 w-9" />
                      ) : null}

                      <div
                        className={`flex flex-col max-w-[70%] ${
                          isOwn ? "items-end" : "items-start"
                        }`}
                      >
                        {showName && (
                          <span className="text-xs font-semibold text-gray-600 mb-1 px-3">
                            {msg.username}
                          </span>
                        )}
                        <div
                          className={`px-4 py-2.5 rounded-2xl shadow-md transition-all hover:shadow-lg ${
                            isOwn
                              ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-br-sm"
                              : "bg-white text-gray-800 rounded-bl-sm"
                          }`}
                        >
                          <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                            {msg.message}
                          </p>
                        </div>
                        <span className="text-[10px] text-gray-500 mt-1 px-3">
                          {formatTime()}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={scrollAnchorRef} />
              </div>
            )}
          </div>

          <div className="bg-white border-t border-gray-200 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder={
                    isConnected
                      ? t("discussion.placeholder")
                      : t("discussion.offlinePlaceholder")
                  }
                  disabled={isSending || !isConnected}
                  className="w-full bg-gray-100 border-0 focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-full px-6 py-3 h-12 text-sm placeholder:text-gray-500"
                />
              </div>

              {!user ? (
                <Link href="/sign-in">
                  <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-full h-12 px-6 shadow-lg hover:shadow-xl transition-all">
                    {t("discussion.signInToChat")}
                  </Button>
                </Link>
              ) : (
                <Button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || isSending || !isConnected}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-full h-12 w-12 p-0 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                  aria-label={t("discussion.sendAria")}
                >
                  {isSending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}

