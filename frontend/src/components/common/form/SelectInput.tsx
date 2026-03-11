import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Control, FieldValues, Path } from "react-hook-form";

interface Options {
  label: string;
  value: string;
}
interface props<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  disabled?: boolean;
  option: Options[];
  classname?: string;
  placeholder: string;

}

export function SelectInput<T extends FieldValues>({
  classname,
  control,
  label,
  name,
  option,
  disabled,
  placeholder,

}: props<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel
            className={"text-base font-semibold text-gray-900 block"}
          >
            {label}
          </FormLabel>
          <Select
            value={field.value || ""}
            disabled={disabled}
            onValueChange={(v) => field.onChange(v)}
          >
            <FormControl>
              <SelectTrigger className={classname}>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>

            <SelectContent>
              {option.map((item, _indx) => (
                <SelectItem key={_indx} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
