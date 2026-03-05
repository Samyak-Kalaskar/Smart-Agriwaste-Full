"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations, useLocale } from "next-intl";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import { useLazyGetProfileQuery } from "@/redux/api/authApi";
import { FormInput } from "@/components/common/form/FormInput";
import { FileUploadInput } from "@/components/common/form/FileUploadInput";

const formSchema = z.object({
  phone: z.string().optional(),
  aadharnumber: z.string().optional(),
  state: z.string().optional(),
  district: z.string().optional(),
  taluka: z.string().optional(),
  village: z.string().optional(),
  houseBuildingName: z.string().optional(),
  roadarealandmarkName: z.string().optional(),
  farmNumber: z.string().optional(),
  farmArea: z.string().optional(),
  farmUnit: z.string().optional(),
  aadharUrl: z.string().optional(),
  farmDocUrl: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

// Field labels mapping
const fieldLabels: Record<string, string> = {
  phone: "Phone Number",
  aadharnumber: "Aadhar Number",
  state: "State",
  district: "District",
  taluka: "Taluka",
  village: "Village",
  houseBuildingName: "House/Building Name",
  roadarealandmarkName: "Road, Area, Landmark Name",
  farmNumber: "Farm Number",
  farmArea: "Farm Area",
  farmUnit: "Farm Unit",
};

export default function Profile() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const t = useTranslations("profile.farmer.Profile");
  const locale = useLocale();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {},
  });

  const [aadharPreview, setAadharPreview] = useState<string | null>(null);
  const [farmDocPreview, setFarmDocPreview] = useState<string | null>(null);

  const [files, setFiles] = useState<{
    aadharFile: File | null;
    farmdocFile: File | null;
  }>({
    aadharFile: null,
    farmdocFile: null,
  });

  const farmerId = user ? user.id : "";

  const role = user ? user.unsafeMetadata.role : "";
  const [getProfile, { data: profiledata, isFetching, isLoading, isSuccess }] =
    useLazyGetProfileQuery();

  // Fetch data from API when component mounts

  useEffect(() => {
    if (isLoaded && user?.id) {
      getProfile({
        id: farmerId || user.id,
        role: role as string,
      });
    }
  }, [user?.id, isLoaded]);
  useEffect(() => {
    if (!farmerId) return;

    const data = profiledata?.accountdata;

    if (data) {
      form.reset({
        phone: data.phone || "",
        aadharnumber: data.aadharnumber || "",
        state: data.state || "",
        district: data.district || "",
        taluka: data.taluka || "",
        village: data.village || "",
        houseBuildingName: data.houseBuildingName || "",
        roadarealandmarkName: data.roadarealandmarkName || "",
        farmNumber: data.farmNumber || "",
        farmArea: data.farmArea || "",
        farmUnit: data.farmUnit || "",
        aadharUrl: data.aadharUrl || "",
        farmDocUrl: data.farmDocUrl || "",
      });

      if (data.aadharUrl) setAadharPreview(data.aadharUrl);
      if (data.farmDocUrl) setFarmDocPreview(data.farmDocUrl);
    }
  }, [farmerId, form, profiledata]);

  const handleAadharFileChange = (file: File | null) => {
    setFiles({ ...files, aadharFile: file });
  };

  const handleFarmDocFileChange = (file: File | null) => {
    setFiles({ ...files, farmdocFile: file });
  };

  const uploadToImageKit = async (file: File, folder: string) => {
    const formdata = new FormData();
    formdata.append("file", file);
    formdata.append("id", farmerId);
    formdata.append("folder", folder);

    const res = await axios.post("/api/upload", formdata);

    if (!res.data || !res.data.url) {
      toast.error(t("uploadFailed"));
    }

    const url: string = res.data.url;

    return url;
  };

  const onSubmit = async () => {
    try {
      // Upload Aadhar if present and update the form
      if (files.aadharFile) {
        const aadharUrl = await uploadToImageKit(files.aadharFile, "aadhar");
        form.setValue("aadharUrl", aadharUrl);
      }

      // Upload farm doc if present and update the form
      if (files.farmdocFile) {
        const farmDocUrl = await uploadToImageKit(files.farmdocFile, "farmdoc");
        form.setValue("farmDocUrl", farmDocUrl);
      }

      // IMPORTANT: read the latest form values (includes urls we set above)
      const payload = form.getValues; // or: { ...values, aadharUrl: ..., farmDocUrl: ... }

      // Optional: validate farmerId
      if (!farmerId) throw new Error("Missing farmerId");

      const res = await axios.put(
        `/api/profile/farmer/update/${farmerId}`,
        payload,
      );

      if (res.status >= 200 && res.status < 300) {
        toast.success(t("profileUpdated"));
        // do any post-success actions (navigate/refresh)
      } else {
        toast.error(t("profileUpdateFailed"));
      }
    } catch {
      toast.error(t("somethingWentWrong"));
    }
  };

  if (!user) return <p className="text-center py-10">{t("loadingUser")}</p>;
  if (isFetching && isLoading)
    return <p className="text-center py-10">{t("loadingData")}</p>;

  return (
    <div className="container py-10">
      <Card className="max-w-4xl mx-auto border-gray-200 shadow-lg">
        <CardHeader className="bg-green-50">
          <CardTitle className="text-2xl font-bold text-green-700">
            {t("title")}
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">{t("subtitle")}</p>
        </CardHeader>
        {isSuccess && (
          <CardContent className="pt-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-8"
              >
                {/* Farmer ID */}
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <p className="text-sm">
                    <span className="font-semibold text-green-700">
                      {t("farmerIdLabel")}
                    </span>
                    {"   "}
                    <span className="text-gray-700">
                      {farmerId.replace("user_", "fam_")}
                    </span>
                  </p>
                </div>

                {/* Account Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    {t("account.heading")}
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <FormLabel className="text-gray-700">
                        {t("account.firstName")}
                      </FormLabel>
                      <Input
                        value={user?.firstName || ""}
                        disabled
                        className="bg-gray-50"
                      />
                    </div>
                    <div>
                      <FormLabel className="text-gray-700">
                        {t("account.lastName")}
                      </FormLabel>
                      <Input
                        value={user?.lastName || ""}
                        disabled
                        className="bg-gray-50"
                      />
                    </div>
                    <div>
                      <FormLabel className="text-gray-700">
                        {t("account.username")}
                      </FormLabel>
                      <Input
                        value={user?.username || ""}
                        disabled
                        className="bg-gray-50"
                      />
                    </div>
                    <div>
                      <FormLabel className="text-gray-700">
                        {t("account.emailAddress")}
                      </FormLabel>
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
                    {t("contact.heading")}
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <FormInput
                      control={form.control}
                      name="phone"
                      label={t("fields.phone")}
                      placeholder={t("placeholders.phone")}
                      type="text"
                      classname="h-12 border-2 border-gray-200 rounded-lg"
                    />
                    <FormInput
                      control={form.control}
                      name="aadharnumber"
                      label={t("fields.aadharnumber")}
                      placeholder={t("placeholders.aadharnumber")}
                      type="text"
                      classname="h-12 border-2 border-gray-200 rounded-lg"
                    />
                  </div>
                </div>

                <hr className="border-gray-200" />

                {/* Address Details */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    {t("address.heading")}
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    {[
                      "state",
                      "district",
                      "taluka",
                      "village",
                      "houseBuildingName",
                      "roadarealandmarkName",
                    ].map((key) => (
                      <FormInput
                        key={key}
                        control={form.control}
                        name={key as keyof FormValues}
                        label={t(`fields.${key}`)}
                        placeholder={t(`placeholders.${key}`)}
                        type="text"
                        classname="h-12 border-2 border-gray-200 rounded-lg"
                      />
                    ))}
                  </div>
                </div>

                <hr className="border-gray-200" />

                {/* Farm Details */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    {t("farm.heading")}
                  </h3>
                  <div className="grid md:grid-cols-3 gap-6">
                    {["farmNumber", "farmArea", "farmUnit"].map((key) => (
                      <FormInput
                        key={key}
                        control={form.control}
                        name={key as keyof FormValues}
                        label={t(`fields.${key}`)}
                        placeholder={`Enter ${fieldLabels[
                          key
                        ].toLowerCase()}`}
                        type="text"
                        classname="h-12 border-2 border-gray-200 rounded-lg"
                      />
                    ))}
                  </div>
                </div>

                <hr className="border-gray-200" />

                {/* Documents */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    {t("documents.heading")}
                  </h3>
                  <div className="grid md:grid-cols-2 gap-8">
                    <FileUploadInput
                      control={form.control}
                      name="aadharUrl"
                      label={t("documents.aadhar")}
                      accept="image/*"
                      preview={aadharPreview}
                      onPreviewChange={setAadharPreview}
                      onFileChange={handleAadharFileChange}
                      classname="border-2 border-dashed border-gray-300 rounded-lg"
                      maxSize={5}
                    />

                    <FileUploadInput
                      control={form.control}
                      name="farmDocUrl"
                      label={t("documents.farm")}
                      accept="image/*"
                      preview={farmDocPreview}
                      onPreviewChange={setFarmDocPreview}
                      onFileChange={handleFarmDocFileChange}
                      classname="border-2 border-dashed border-gray-300 rounded-lg"
                      maxSize={5}
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end pt-4">
                  <Button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-base font-semibold"
                  >
                    {t("saveChanges")}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
