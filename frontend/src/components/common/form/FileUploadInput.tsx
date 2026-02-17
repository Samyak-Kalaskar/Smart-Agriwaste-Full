import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Control, FieldValues, Path } from "react-hook-form";
import Image from "next/image";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface props<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  disabled?: boolean;
  accept?: string;
  preview?: string | null;
  onPreviewChange?: (preview: string | null) => void;
  onFileChange?: (file: File | null) => void;
  classname?: string;
  maxSize?: number; // in MB
}

export function FileUploadInput<T extends FieldValues>({
  control,
  label,
  name,
  disabled,
  accept = "image/*",
  preview,
  onPreviewChange,
  onFileChange,
  classname,
  maxSize = 5,
}: props<T>) {
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: any,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // File size validation
    if (maxSize && file.size > maxSize * 1024 * 1024) {
      alert(`File size must be less than ${maxSize}MB`);
      return;
    }

    onFileChange?.(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      onPreviewChange?.(result);
      field.onChange(result);
    };
    reader.readAsDataURL(file);
  };

  const handleClearPreview = () => {
    onPreviewChange?.(null);
    onFileChange?.(null);
  };

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-base font-semibold text-gray-900 block">
            {label}
          </FormLabel>
          <FormControl>
            <div className="space-y-4">
              <div className={`relative ${classname}`}>
                <Input
                  type="file"
                  accept={accept}
                  disabled={disabled}
                  onChange={(e) => handleChange(e, field)}
                  className={`cursor-pointer h-12 file:cursor-pointer ${
                    classname || "border-2 border-dashed border-gray-300"
                  }`}
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <Upload className="w-5 h-5 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-500">
                    Choose or drag file
                  </span>
                </div>
              </div>

              {preview && (
                <div className="relative inline-block">
                  <Image
                    src={preview}
                    alt="Preview"
                    className="rounded-lg border-2 border-gray-200 shadow-sm"
                    width={250}
                    height={150}
                    objectFit="cover"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={handleClearPreview}
                    className="absolute -top-2 -right-2 rounded-full p-1 h-8 w-8"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
