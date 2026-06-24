import { useTheme } from "next-themes";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ThemeSelector() {
  const { setTheme, theme } = useTheme();

  const currentTheme = theme ?? "system";

  return (
    <Select value={currentTheme} onValueChange={setTheme}>
      <SelectTrigger className="w-[160px]">
        <SelectValue placeholder="Select theme" />
      </SelectTrigger>

      <SelectContent>
        <SelectItem value="light">Light</SelectItem>
        <SelectItem value="dark">Dark</SelectItem>
        <SelectItem value="system">System</SelectItem>
      </SelectContent>
    </Select>
  );
}
