"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
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
import {
  Leaf,
  CheckCircle2,
  MapPin,
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
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import {
  BuyerAccountForm,
  buyerAccountSchema,
} from "@/components/types/zod/buyerAccount.zod";
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

export default function CreateAccount() {
  const { user, isLoaded, isSignedIn } = useUser();
  const t = useTranslations("profile.buyer.CreateAccount");
  const router = useRouter();
  const Address: AddressType = addressJson;

  const [createProfile, { isLoading }] = useCreateProfileMutation();

  const methods = useForm<BuyerAccountForm>({
    resolver: zodResolver(buyerAccountSchema),
    defaultValues: {
      aadharnumber: "",
      phone: "",
      state: "",
      district: "",
      taluka: "",
      village: "",
      houseBuildingName: "",
      roadarealandmarkName: "",
      aadhar: undefined,
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
    if (role === "farmer") {
      router.replace(`/create-account/farmer`);
    }
  }, [role, router]);

  const uploadToImageKit = async (file: File, folder: string) => {
    return uploadImage(file, folder);
  };

  const onSubmit = async (data: BuyerAccountForm) => {
    let aadharUrl = "";
    if (data.aadhar) {
      toast.loading("Uploading Aadhaar...");
      aadharUrl = await uploadToImageKit(data.aadhar, "aadhar");
    }

    const payload = {
      buyerId: user!.id,
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
      aadharUrl,
    };

    createProfile({ role, data: payload }).then(() => {
      toast.success("suceess");
      toast.dismiss();
      router.push("/");
    });
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
              {t("authRequiredTitle")}
            </h2>
            <p className="text-gray-600">{t("authRequiredDesc")}</p>
            <Button
              onClick={() => router.push("/sign-up?role=buyer")}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {t("goToSignIn")}
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 py-8 px-4 flex items-center justify-center">
      <Card className="w-full max-w-3xl shadow-2xl border-0 overflow-hidden animate-in fade-in duration-500">
        <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white pb-10 pt-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm">
              <Leaf className="w-8 h-8" />
            </div>
            <div className="text-center">
              <CardTitle className="text-3xl font-bold">{t("title")}</CardTitle>
              <CardDescription className="text-green-50 text-sm mt-1">
                {t("welcome", { name: user.firstName ?? "" })}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 sm:p-8">
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
            <div className="space-y-6">
              {/* Identity Verification */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                  <CreditCard className="h-4 w-4 text-green-600" />
                  <h3 className="font-semibold text-gray-900">
                    Identity Verification
                  </h3>
                </div>

                <div className="space-y-2">
                  <FormInput
                    control={control}
                    name="aadharnumber"
                    label="Aadhaar Number *"
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
                    Aadhaar Card Photo <span className="text-red-500">*</span>
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
                    Contact Information
                  </h3>
                </div>

                <div className="space-y-2">
                  <FormInput
                    control={control}
                    name="phone"
                    label="Phone Number *"
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
                    Location Details
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* State */}
                  <div>
                    <SelectInput
                      control={control}
                      name="state"
                      label="State *"
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
                      label="District *"
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
                      label="Taluka *"
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
                      label="Village / City *"
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
                    Address Details{" "}
                    <span className="text-xs text-gray-500 font-normal">
                      (Optional)
                    </span>
                  </h3>
                </div>

                <div className="space-y-2">
                  <FormInput
                    control={control}
                    name="houseBuildingName"
                    label="House Number / Building Name"
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
                    label="Road, Area, Landmark"
                    type="text"
                    placeholder="e.g., Near Town Hall, MG Road"
                    classname={`h-12 ${
                      errors.roadarealandmarkName ? "border-red-500" : ""
                    }`}
                  />
                </div>
              </div>

              <div className="text-center pb-4 pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting || isLoading}
                  className="w-full sm:w-1/2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white h-14 text-base font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting || isLoading ? (
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

              <p className="text-center text-xs text-gray-500">
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
            </form>
          </FormProvider>
        </CardContent>
      </Card>
    </div>
  );
}
