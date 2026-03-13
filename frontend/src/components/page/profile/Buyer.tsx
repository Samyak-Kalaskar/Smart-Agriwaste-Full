"use client";

import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// reusable form components
import { FormInput } from "@/components/common/form/FormInput";
import { SelectInput } from "@/components/common/form/SelectInput";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";

const formSchema = z.object({
  phone: z.string().optional(),
  aadharnumber: z.string().optional(),
  state: z.string().optional(),
  district: z.string().optional(),
  taluka: z.string().optional(),
  village: z.string().optional(),
  houseBuildingName: z.string().optional(),
  roadarealandmarkName: z.string().optional(),
  aadharUrl: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

// Field labels mapping (localized via `t`)
const getFieldLabels = (t: (key: string) => string): Record<string, string> => ({
  phone: t("fields.phone"),
  aadharnumber: t("fields.aadharnumber"),
  state: t("fields.state"),
  district: t("fields.district"),
  taluka: t("fields.taluka"),
  village: t("fields.village"),
  houseBuildingName: t("fields.houseBuildingName"),
  roadarealandmarkName: t("fields.roadarealandmarkName"),
  firstName: t("fields.firstName"),
  lastName: t("fields.lastName"),
  username: t("fields.username"),
  emailAddress: t("fields.emailAddress"),
});

export default function Profile() {
  const { user } = useUser();
  const router = useRouter();
  const t = useTranslations("profile.buyer.Profile");

  const fieldLabels = getFieldLabels(t);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {},
  });

  // example options for dropdowns
  const stateOptions = [
    { label: t("states.maharashtra"), value: "maharashtra" },
    { label: t("states.karnataka"), value: "karnataka" },
    { label: t("states.gujarat"), value: "gujarat" },
  ];

  const [aadharPreview, setAadharPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const buyerId = user ? user.id.replace("user_", "buy_") : "";

  const [aadharFile, setAadharFile] = useState<File | null>(null);

  // Fetch data from API when component mounts
  useEffect(() => {
    if (!buyerId) return;

    async function fetchBuyerData() {
      try {
        const response = await axios.get(`/api/profile/buyer/get/${buyerId}`);

        const data = response.data?.accountdata;

        // If no profile → redirect to create page
        if (!data) {
          router.push("/create-account/buyer");
          return; // stop execution
        }

        form.reset({
          phone: data.phone || "",
          aadharnumber: data.aadharnumber || "",
          state: data.state || "",
          district: data.district || "",
          taluka: data.taluka || "",
          village: data.village || "",
          houseBuildingName: data.houseBuildingName || "",
          roadarealandmarkName: data.roadarealandmarkName || "",
          aadharUrl: data.aadharUrl || "",
        });

        if (data.aadharUrl) setAadharPreview(data.aadharUrl);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchBuyerData();
  }, [buyerId, form, router]);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setPreview: React.Dispatch<React.SetStateAction<string | null>>,
    field: { onChange: (value: string | ArrayBuffer | null) => void }
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAadharFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
      field.onChange(reader.result);
    };
    reader.readAsDataURL(file);
  };
  const uploadToImageKit = async (file: File, folder: string) => {
    try {
      const formdata = new FormData();
      formdata.append("file", file);
      formdata.append("id", buyerId);
      formdata.append("folder", folder);

      const res = await axios.post("/api/upload", formdata);

      if (!res.data || !res.data.url) {
        throw new Error(`Upload failed for folder "${folder}"`);
      }

      return res.data.url;
    } catch (err) {
      console.error("Image upload failed:", err);
      throw err; // allow onSubmit() to catch it
    }
  };

  const onSubmit = async (values: FormValues) => {
    try {
      // Upload Aadhar if selected
      if (aadharFile) {
        const url = await uploadToImageKit(aadharFile, "aadhar");
        form.setValue("aadharUrl", url);
        values.aadharUrl = url;
      }

      console.log("Updated buyer profile:", values);

      const res = await axios.put(
        `/api/profile/buyer/update/${buyerId}`,
        values
      );

      if (res.status >= 200 && res.status < 300) {
        toast.success(t("toasts.updated"));
        // optional: navigate to dashboard
        // router.push("/profile/buyer");
      } else {
        toast.error(t("toasts.updateFailed"));
      }
    } catch (err) {
      console.error("Profile update failed:", err);
      toast.error(t("toasts.genericError"));
    }
  };

  if (!user) return <p className="text-center py-10">{t("loadingUser")}</p>;
  if (isLoading) return <p className="text-center py-10">{t("loadingBuyerData")}</p>;

  return (
    <div className="container py-10">
      <Card className="max-w-4xl mx-auto border-gray-200 shadow-lg">
        <CardHeader className="bg-blue-50">
          <CardTitle className="text-2xl font-bold text-blue-700">
            {t("title")}
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">{t("description")}</p>
        </CardHeader>

        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Buyer ID */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm">
                  <span className="font-semibold text-blue-700">{t("buyerIdLabel")}</span>{" "}
                  <span className="text-gray-700">{buyerId}</span>
                </p>
              </div>

              {/* Account Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  {t("accountInformation")}
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <FormLabel className="text-gray-700">{fieldLabels.firstName}</FormLabel>
                    <Input
                      value={user?.firstName || ""}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                  <div>
                    <FormLabel className="text-gray-700">{fieldLabels.lastName}</FormLabel>
                    <Input
                      value={user?.lastName || ""}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                  <div>
                    <FormLabel className="text-gray-700">{fieldLabels.username}</FormLabel>
                    <Input
                      value={user?.username || ""}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                  <div>
                    <FormLabel className="text-gray-700">{fieldLabels.emailAddress}</FormLabel>
                    <Input
                      value={user?.primaryEmailAddress?.emailAddress || ""}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                </div>
              </div>

              <hr className="border-gray-200" />

              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  {t("contactPersonalDetails")}
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* use reusable FormInput to reduce boilerplate */}
                  <FormInput
                    control={form.control}
                    name="phone"
                    label={fieldLabels.phone}
                    placeholder={t("enterField", { field: fieldLabels.phone })}
                    type="text"
                    classname="w-full"
                  />
                  <FormInput
                    control={form.control}
                    name="aadharnumber"
                    label={fieldLabels.aadharnumber}
                    placeholder={t("enterField", { field: fieldLabels.aadharnumber })}
                    type="text"
                    classname="w-full"
                  />
                </div>
              </div>

              <hr className="border-gray-200" />

              {/* Address Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">{t("addressDetails")}</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* state dropdown uses SelectInput, others remain text fields */}
                  <SelectInput
                    control={form.control}
                    name="state"
                    label={fieldLabels.state}
                    option={stateOptions}
                    placeholder={t("selectField", { field: fieldLabels.state })}
                    classname="w-full"
                  />

                  {["district", "taluka", "village", "houseBuildingName", "roadarealandmarkName"].map(
                    (key) => (
                      <FormInput
                        key={key}
                        control={form.control}
                        name={key as keyof FormValues}
                        label={fieldLabels[key]}
                        placeholder={t("enterField", { field: fieldLabels[key] })}
                        type="text"
                        classname="w-full"
                      />
                    )
                  )}
                </div>
              </div>

              <hr className="border-gray-200" />

              {/* Document */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">{t("document")}</h3>
                <div className="grid md:grid-cols-2 gap-8">
                  <FormField
                    control={form.control}
                    name="aadharUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">{t("aadharDocument")}</FormLabel>
                        <FormControl>
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                              handleFileChange(e, setAadharPreview, field)
                            }
                          />
                        </FormControl>
                        {aadharPreview && (
                          <div className="mt-3">
                            <Image
                              src={aadharPreview}
                              alt="Aadhar preview"
                              className="rounded-lg border-2 border-gray-200 shadow-sm"
                              width={200}
                              height={120}
                            />
                          </div>
                        )}
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-base font-semibold"
                >
                  {t("saveChanges")}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

