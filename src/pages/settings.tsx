import { BaseColorSwitcher } from "@/components/base-color-switcher";
import { ThemeColorSwitcher } from "@/components/theme-color-switcher";
import { ThemeSelector } from "@/components/theme-selector";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Cable, Palette } from "lucide-react";

function AppearancePage() {
  return (
    <div className="max-w-2xl ml-5">
      <Card className="shadow-sm border-l border-primary">
        <CardHeader className="">
          <CardTitle className="text-xl">Appearance</CardTitle>
          <p className="text-sm text-muted-foreground">
            Customize the appearance of Aleym:
          </p>
        </CardHeader>
        <Separator />
        <CardContent className="space-y-3">
          <div className="space-y-5">
            <h3 className="text-lg font-medium text-muted-foreground tracking-wide mb-5">
              Colors
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between min-h-10">
                <div className="space-y-0.5">
                  <Label className="text-lg">Theme Color</Label>
                  <p className="text-s text-primary">
                    Accent color used across UI
                  </p>
                </div>
                <ThemeColorSwitcher />
              </div>

              <div className="flex items-center justify-between min-h-10">
                <div className="space-y-0.5">
                  <Label className="text-lg">Base Color</Label>
                  <p className="text-s text-muted-foreground">
                    Base background theme
                  </p>
                </div>
                <BaseColorSwitcher />
              </div>
            </div>
          </div>

          <Separator />
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-muted-foreground tracking-wide mb-5">
              Theme
            </h3>

            <div className="flex items-center justify-between min-h-10">
              <div className="space-y-2">
                <Label className="text-lg">Appearance</Label>
                <p className="text-s text-muted-foreground">
                  Light, dark, or system
                </p>
              </div>
              <ThemeSelector />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AdvancedPage() {
  return <div></div>;
}

export function SettingsPage() {
  return (
    <Tabs defaultValue="appearance" className="">
      <TabsList variant="line" className="flex mx-auto w-fit">
        <TabsTrigger value="appearance">
          <Palette />
          Appearance
        </TabsTrigger>
        <TabsTrigger value="advanced">
          <Cable />
          Advanced
        </TabsTrigger>
      </TabsList>

      <TabsContent value="appearance" className="flex justify-center">
        <div className="w-full max-w-3xl">
          <AppearancePage />
        </div>
      </TabsContent>

      <TabsContent value="advanced" className="flex justify-center">
        <div className="w-full max-w-3xl">
          <AdvancedPage />
        </div>
      </TabsContent>
    </Tabs>
  );
}
