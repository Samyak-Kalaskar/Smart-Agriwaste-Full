"use client";

import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import {
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import axios from "axios";
import { toast } from "sonner";
import { useLazyGetProfileQuery } from "@/redux/api/authApi";
import { FormInput } from "@/components/common/form/FormInput";
import { SelectInput } from "@/components/common/form/SelectInput";

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
  const t = useTranslations("profile.farmer.Profile");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {},
  });

  const { control, handleSubmit } = form;

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

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setPreview: React.Dispatch<React.SetStateAction<string | null>>,
    field: { onChange: (value: string | ArrayBuffer | null) => void },
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFiles({ ...files, [e.target.name]: file });

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
      field.onChange(reader.result);
    };
    reader.readAsDataURL(file);
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
      const payload = form.getValues();

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
            <FormProvider {...form}>
              <form
                onSubmit={handleSubmit(onSubmit)}
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
                      control={control}
                      name="phone"
                      label={t("fields.phone")}
                      type="tel"
                      placeholder={t("placeholders.phone")}
                      classname="h-10"
                    />
                    <FormInput
                      control={control}
                      name="aadharnumber"
                      label={t("fields.aadharnumber")}
                      type="text"
                      placeholder={t("placeholders.aadharnumber")}
                      classname="h-10"
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
                    <FormInput
                      control={control}
                      name="state"
                      label={t("fields.state")}
                      type="text"
                      placeholder={t("placeholders.state")}
                      classname="h-10"
                    />
                    <FormInput
                      control={control}
                      name="district"
                      label={t("fields.district")}
                      type="text"
                      placeholder={t("placeholders.district")}
                      classname="h-10"
                    />
                    <FormInput
                      control={control}
                      name="taluka"
                      label={t("fields.taluka")}
                      type="text"
                      placeholder={t("placeholders.taluka")}
                      classname="h-10"
                    />
                    <FormInput
                      control={control}
                      name="village"
                      label={t("fields.village")}
                      type="text"
                      placeholder={t("placeholders.village")}
                      classname="h-10"
                    />
                    <FormInput
                      control={control}
                      name="houseBuildingName"
                      label={t("fields.houseBuildingName")}
                      type="text"
                      placeholder={t("placeholders.houseBuildingName")}
                      classname="h-10"
                    />
                    <FormInput
                      control={control}
                      name="roadarealandmarkName"
                      label={t("fields.roadarealandmarkName")}
                      type="text"
                      placeholder={t("placeholders.roadarealandmarkName")}
                      classname="h-10"
                    />
                  </div>
                </div>

                <hr className="border-gray-200" />

                {/* Farm Details */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    {t("farm.heading")}
                  </h3>
                  <div className="grid md:grid-cols-3 gap-6">
                    <FormInput
                      control={control}
                      name="farmNumber"
                      label={t("fields.farmNumber")}
                      type="text"
                      placeholder={`Enter ${fieldLabels["farmNumber"].toLowerCase()}`}
                      classname="h-10"
                    />
                    <FormInput
                      control={control}
                      name="farmArea"
                      label={t("fields.farmArea")}
                      type="number"
                      placeholder={`Enter ${fieldLabels["farmArea"].toLowerCase()}`}
                      classname="h-10"
                    />
                    <SelectInput
                      control={control}
                      name="farmUnit"
                      label={t("fields.farmUnit")}
                      option={[
                        { label: "Hectare", value: "hectare" },
                        { label: "Acre", value: "acre" },
                      ]}
                      placeholder="Select unit"
                      classname="h-10"
                    />
                  </div>
                </div>

                <hr className="border-gray-200" />

                {/* Documents */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    {t("documents.heading")}
                  </h3>
                  <div className="grid md:grid-cols-2 gap-8">
                    <FormField
                      control={control}
                      name="aadharUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">
                            {t("documents.aadhar")}
                          </FormLabel>
                          <Input
                            type="file"
                            accept="image/*"
                            name="aadharFile"
                            onChange={(e) =>
                              handleFileChange(e, setAadharPreview, field)
                            }
                          />
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

                    <FormField
                      control={control}
                      name="farmDocUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">
                            {t("documents.farm")}
                          </FormLabel>
                          <Input
                            type="file"
                            accept="image/*"
                            name="farmdocFile"
                            onChange={(e) =>
                              handleFileChange(e, setFarmDocPreview, field)
                            }
                          />
                          {farmDocPreview && (
                            <div className="mt-3">
                              <Image
                                src={farmDocPreview}
                                alt="Farm document preview"
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
                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-base font-semibold"
                  >
                    {t("saveChanges")}
                  </Button>
                </div>
              </form>
            </FormProvider>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
