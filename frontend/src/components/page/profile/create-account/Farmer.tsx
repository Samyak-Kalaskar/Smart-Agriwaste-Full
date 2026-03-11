"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Leaf,
  CheckCircle2,
  User,
  MapPin,
  FileText,
  Upload,
  Phone,
  CreditCard,
  Home,
  Loader2,
  AlertCircle,
} from "lucide-react";
import addressJson from "@/../public/Address.json";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";
import { useForm } from "react-hook-form";
import { FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  FarmerAccountForm,
  farmerAccountSchema,
} from "@/components/types/zod/farmerAccount.zod";
import { uploadImage } from "@/utils/imagekit";
import { useCreateProfileMutation } from "@/redux/api/authApi";
import { FormInput } from "@/components/common/form/FormInput";
import { SelectInput } from "@/components/common/form/SelectInput";

interface AddressType {
  states: string[];
  districts: { [key: string]: string[] };
  talukas: { [key: string]: string[] };
  villages: { [key: string]: string[] };
}

export default function CreateAccountFarmer() {
  const { user, isLoaded, isSignedIn } = useUser();
  const t = useTranslations("profile.farmer.CreateAccount");
  const router = useRouter();
  const Address: AddressType = addressJson;

  const [step, setStep] = useState(1);

  const methods = useForm({
    resolver: zodResolver(farmerAccountSchema),
    defaultValues: {
      aadharnumber: "",
      phone: "",
      state: "",
      district: "",
      taluka: "",
      village: "",
      houseBuildingName: "",
      roadarealandmarkName: "",
      farmNumber: "",
      farmArea: "",
      farmUnit: "hectare",
    },
    mode: "onBlur",
  });

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors, isSubmitting },
  } = methods;

  const role = user?.unsafeMetadata.role;

  useEffect(() => {
    if (role === "buyer") {
      router.replace(`/create-account/buyer`);
    }
  }, [role, router]);

  const [createProfile, { isLoading }] = useCreateProfileMutation();

  const uploadToImageKit = async (file: File, folder: string) => {
    return uploadImage(file, folder);
  };

  const step1Fields: (keyof FarmerAccountForm)[] = [
    "aadharnumber",
    "aadhar",
    "phone",
    "state",
    "district",
    "taluka",
    "village",
    "houseBuildingName",
    "roadarealandmarkName",
  ];

  const handleNextStep = async () => {
    const ok = await trigger(step1Fields);
    if (ok) setStep(2);
  };

  const onSubmit = async (data: FarmerAccountForm) => {
    try {
      let aadharUrl = "";
      let farmDocUrl = "";

      if (data.aadhar) {
        toast.loading("Uploading Aadhaar...");
        aadharUrl = await uploadToImageKit(data.aadhar, "aadhar");
      }

      if (data.farmdoc) {
        toast.loading("Uploading Farm Document...");
        farmDocUrl = await uploadToImageKit(data.farmdoc, "farmdoc");
      }

      const payload = {
        farmerId: user!.id,
        firstName: user!.firstName || "",
        lastName: user!.lastName || "",
        username: user!.username || "",
        email: user!.primaryEmailAddress?.emailAddress || "",

        phone: data.phone.replace(/\D/g, ""),
        aadharnumber: data.aadharnumber.replace(/\s/g, ""),
        state: data.state,
        district: data.district,
        taluka: data.taluka,
        village: data.village,
        houseBuildingName: data.houseBuildingName,
        roadarealandmarkName: data.roadarealandmarkName,

        farmNumber: data.farmNumber,
        farmArea: data.farmArea,
        farmUnit: data.farmUnit,

        aadharUrl,
        farmDocUrl,
      };

      createProfile({ role, data: payload }).then(() => {
        toast.success("suceess");
        toast.dismiss();
        router.push("/");
      });
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-green-600" />
          <span className="text-green-600 text-lg font-medium">
            {t("loading")}
          </span>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <Card className="p-8 shadow-xl max-w-md">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Authentication Required
            </h2>
            <p className="text-gray-600">
              You must be signed in to access this page
            </p>
            <Button
              onClick={() => router.push("/sign-up?role=farmer")}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Go to Sign Up
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const selectedState = watch("state");
  const selectedDistrict = watch("district");
  const selectedTaluka = watch("taluka");
  const aadharFile = watch("aadhar");
  const farmDocFile = watch("farmdoc");

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 py-8 px-4 flex items-center justify-center">
      <Card className="w-full max-w-3xl shadow-2xl border-0 overflow-hidden animate-in fade-in duration-500">
        {/* Header */}
        <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white pb-10 pt-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm">
              <Leaf className="w-8 h-8" />
            </div>
            <div className="text-center">
              <CardTitle className="text-3xl font-bold">
                {t("header.title")}
              </CardTitle>
              <CardDescription className="text-green-50 text-sm mt-1">
                {t("header.description", { firstName: user.firstName || "" })}
              </CardDescription>
            </div>
          </div>

          {/* Progress indicator */}
          <div className="mt-8 max-w-md mx-auto">
            <div className="flex items-center justify-between relative">
              <div className="absolute top-1/2 left-0 w-full h-1 bg-white/20 -translate-y-1/2 -z-0" />
              <div
                className="absolute top-1/2 left-0 h-1 bg-white -translate-y-1/2 transition-all duration-500 -z-0"
                style={{ width: step === 2 ? "100%" : "50%" }}
              />
              {/* Step 1 */}
              <div className="flex flex-col pr-10 items-center gap-2 z-10 relative">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
                    step >= 1
                      ? "bg-white text-green-600 scale-110 shadow-lg"
                      : "bg-white/30 text-white scale-100"
                  }`}
                >
                  {step === 2 ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                </div>
                <span
                  className={`text-xs font-medium ${
                    step >= 1 ? "text-white" : "text-green-200"
                  }`}
                >
                  Personal Info
                </span>
              </div>
              {/* Step 2 */}
              <div className="flex flex-col pl-10 items-center gap-2 z-10 relative">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
                    step === 2
                      ? "bg-white text-green-600 scale-110 shadow-lg"
                      : "bg-white/30 text-white scale-100"
                  }`}
                >
                  <FileText className="w-5 h-5" />
                </div>
                <span
                  className={`text-xs font-medium ${
                    step === 2 ? "text-white" : "text-green-200"
                  }`}
                >
                  Farm Details
                </span>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 sm:p-8">
          {/* User Info Card */}
          <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {user.firstName?.[0]}
                {user.lastName?.[0]}
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-sm text-gray-600">
                  {user.primaryEmailAddress?.emailAddress}
                </p>
              </div>
            </div>
          </div>

          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)}>
            <div className="overflow-hidden">
              <div
                className="flex transition-transform duration-500 ease-in-out"
                style={{
                  transform: `translateX(-${(step - 1) * 100}%)`,
                }}
              >
                {/* STEP 1 - PERSONAL DETAILS */}
                <div className="w-full flex-shrink-0 space-y-6">
                  {/* Identity Verification */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                      <CreditCard className="h-4 w-4 text-green-600" />
                      <h3 className="font-semibold text-gray-900">
                        {t("sections.identity.title")}
                      </h3>
                    </div>

                    <div className="space-y-2">
                      <FormInput
                        control={control}
                        name="aadharnumber"
                        label={`${t("fields.aadhaarNumber")} *`}
                        type="text"
                        placeholder="XXXX XXXX XXXX"
                        classname={`h-12 ${
                          errors.aadharnumber ? "border-red-500" : ""
                        }`}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Upload className="h-3.5 w-3.5" />
                        Aadhaar Card Photo{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          type="file"
                          accept="image/*"
                          className={`h-12 ${
                            errors.aadhar ? "border-red-500" : ""
                          }`}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            setValue("aadhar", file as File, {
                              shouldValidate: true,
                            });
                            await trigger("aadhar");
                          }}
                        />
                        {aadharFile && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span className="text-green-600 text-sm font-medium">
                              {aadharFile.name.slice(0, 20)}...
                            </span>
                          </div>
                        )}
                      </div>
                      {errors.aadhar && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.aadhar.message as string}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        Max size: 1MB | Formats: JPG, PNG
                      </p>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                      <Phone className="h-4 w-4 text-green-600" />
                      <h3 className="font-semibold text-gray-900">
                        {t("sections.contact.title")}
                      </h3>
                    </div>

                    <div className="space-y-2">
                      <FormInput
                        control={control}
                        name="phone"
                        label={`${t("fields.phone")} *`}
                        type="tel"
                        placeholder="+91 XXXXX XXXXX"
                        classname={`h-12 ${
                          errors.phone ? "border-red-500" : ""
                        }`}
                      />
                    </div>
                  </div>

                  {/* Location Details */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                      <MapPin className="h-4 w-4 text-green-600" />
                      <h3 className="font-semibold text-gray-900">
                        {t("sections.location.title")}
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* State */}
                      <div>
                        <SelectInput
                          control={control}
                          name="state"
                          label={`${t("fields.state")} *`}
                          option={Address.states.map((s) => ({
                            label: s,
                            value: s,
                          }))}
                          placeholder="Select State"
                          classname={`h-12 ${
                            errors.state ? "border-red-500" : ""
                          }`}
                        />
                      </div>

                      {/* District */}
                      <div>
                        <SelectInput
                          control={control}
                          name="district"
                          label={`${t("fields.district")} *`}
                          option={
                            selectedState
                              ? (Address.districts[selectedState] || []).map(
                                  (d) => ({
                                    label: d,
                                    value: d,
                                  }),
                                )
                              : []
                          }
                          placeholder={
                            selectedState ? "Select District" : "Select State first"
                          }
                          disabled={!selectedState}
                          classname={`h-12 ${
                            !selectedState
                              ? "opacity-50"
                              : errors.district
                                ? "border-red-500"
                                : ""
                          }`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Taluka */}
                      <div>
                        <SelectInput
                          control={control}
                          name="taluka"
                          label={`${t("fields.taluka")} *`}
                          option={
                            selectedDistrict
                              ? (Address.talukas[selectedDistrict] || []).map(
                                  (t) => ({
                                    label: t,
                                    value: t,
                                  }),
                                )
                              : []
                          }
                          placeholder={
                            selectedDistrict ? "Select Taluka" : "Select District first"
                          }
                          disabled={!selectedDistrict}
                          classname={`h-12 ${
                            !selectedDistrict
                              ? "opacity-50"
                              : errors.taluka
                                ? "border-red-500"
                                : ""
                          }`}
                        />
                      </div>

                      {/* Village */}
                      <div>
                        <SelectInput
                          control={control}
                          name="village"
                          label={`${t("fields.village")} *`}
                          option={
                            selectedTaluka
                              ? (Address.villages[selectedTaluka] || []).map(
                                  (v) => ({
                                    label: v,
                                    value: v,
                                  }),
                                )
                              : []
                          }
                          placeholder={
                            selectedTaluka ? "Select Village/City" : "Select Taluka first"
                          }
                          disabled={!selectedTaluka}
                          classname={`h-12 ${
                            !selectedTaluka
                              ? "opacity-50"
                              : errors.village
                                ? "border-red-500"
                                : ""
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Address Details */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                      <Home className="h-4 w-4 text-green-600" />
                      <h3 className="font-semibold text-gray-900">
                        {t("sections.address.title")}
                      </h3>
                    </div>

                    <div className="space-y-2">
                      <FormInput
                        control={control}
                        name="houseBuildingName"
                        label={`${t("fields.houseNumber")} *`}
                        type="text"
                        placeholder="e.g., House No. 123, Residential Complex"
                        classname={`h-12 ${
                          errors.houseBuildingName ? "border-red-500" : ""
                        }`}
                      />
                    </div>

                    <div className="space-y-2">
                      <FormInput
                        control={control}
                        name="roadarealandmarkName"
                        label={`${t("fields.road")} *`}
                        type="text"
                        placeholder="e.g., Near Town Hall, MG Road"
                        classname={`h-12 ${
                          errors.roadarealandmarkName ? "border-red-500" : ""
                        }`}
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button
                      type="button"
                      onClick={handleNextStep}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white h-14 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
                    >
                      Continue to Farm Details
                      <CheckCircle2 className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                </div>

                {/* STEP 2 - FARM DETAILS */}
                <div className="w-full flex-shrink-0 space-y-6 pl-4">
                  {/* Farm Documentation */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                      <FileText className="h-4 w-4 text-green-600" />
                      <h3 className="font-semibold text-gray-900">
                        {t("sections.farmDocs.title")}
                      </h3>
                    </div>

                    <div className="space-y-2">
                      <FormInput
                        control={control}
                        name="farmNumber"
                        label={`${t("fields.farmNumber")} *`}
                        type="text"
                        placeholder="Enter your land document number"
                        classname={`h-12 ${
                          errors.farmNumber ? "border-red-500" : ""
                        }`}
                      />
                      <p className="text-xs text-gray-500">
                        {t("hints.farmNumber")}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Upload className="h-3.5 w-3.5" />
                        Upload Farm Document{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          type="file"
                          accept="image/*,application/pdf"
                          className={`h-12 ${
                            errors.farmdoc ? "border-red-500" : ""
                          }`}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            setValue("farmdoc", file as File, {
                              shouldValidate: true,
                            });
                            await trigger("farmdoc");
                          }}
                        />
                        {farmDocFile && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span className="text-green-600 text-sm font-medium">
                              {farmDocFile.name.slice(0, 15)}...
                            </span>
                          </div>
                        )}
                      </div>
                      {errors.farmdoc && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.farmdoc.message as string}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        {t("hints.farmDoc")}
                      </p>
                    </div>
                  </div>

                  {/* Farm Area */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                      <Leaf className="h-4 w-4 text-green-600" />
                      <h3 className="font-semibold text-gray-900">
                        {t("sections.farmArea.title")}
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <FormInput
                          control={control}
                          name="farmArea"
                          label={`${t("fields.totalArea")} *`}
                          type="number"
                          placeholder="e.g., 5.5"
                          classname={`h-12 ${
                            errors.farmArea ? "border-red-500" : ""
                          }`}
                        />
                      </div>

                      <div>
                        <SelectInput
                          control={control}
                          name="farmUnit"
                          label={`${t("fields.unit")} *`}
                          option={[
                            { label: t("units.hectare"), value: "hectare" },
                            { label: t("units.acre"), value: "acre" },
                          ]}
                          placeholder="Select unit"
                          classname="h-12 border-green-300 bg-green-50/30"
                        />
                      </div>
                    </div>

                    {watch("farmArea") && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-900">
                          <span className="font-semibold">
                            Total Farm Area:
                          </span>{" "}
                          {watch("farmArea")}{" "}
                          {watch("farmUnit") === "hectare"
                            ? "hectares"
                            : "acres"}
                          {watch("farmArea") &&
                            watch("farmUnit") === "hectare" && (
                              <>
                                {" "}
                                (
                                <span className="text-blue-600">
                                  {(
                                    parseFloat(watch("farmArea")) * 2.471
                                  ).toFixed(2)}{" "}
                                  acres
                                </span>
                                )
                              </>
                            )}
                          {watch("farmArea") &&
                            watch("farmUnit") === "acre" && (
                              <>
                                {" "}
                                (
                                <span className="text-blue-600">
                                  {(
                                    parseFloat(watch("farmArea")) / 2.471
                                  ).toFixed(2)}{" "}
                                  hectares
                                </span>
                                )
                              </>
                            )}
                        </p>
                      </div>
                    )}
                  </div>

                  {errors.root && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {errors.root.message as string}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(1)}
                      disabled={isLoading || isSubmitting}
                      className="w-full sm:w-1/2 border-2 border-green-600 text-green-600 hover:bg-green-50 h-14 text-base font-semibold"
                    >
                      <CheckCircle2 className="mr-2 h-5 w-5 rotate-180" />
                      {t("actions.back")}
                    </Button>
                    <Button
                      type="submit"
                      disabled={isLoading || isSubmitting}
                      className="w-full sm:w-1/2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white h-14 text-base font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading || isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Creating Profile...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="mr-2 h-5 w-5" />
                          Complete Registration
                        </>
                      )}
                    </Button>
                  </div>

                  <p className="text-center text-xs text-gray-500 pt-2">
                    By completing registration, you agree to our{" "}
                    <span className="text-green-600 underline cursor-pointer">
                      Terms of Service
                    </span>{" "}
                    and{" "}
                    <span className="text-green-600 underline cursor-pointer">
                      Privacy Policy
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </form>
          </FormProvider>
        </CardContent>
      </Card>
    </div>
  );
}
