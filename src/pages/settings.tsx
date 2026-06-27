import { BaseColorSwitcher } from "@/components/base-color-switcher";
import { ThemeColorSwitcher } from "@/components/theme-color-switcher";
import { ThemeSelector } from "@/components/theme-selector";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Cable, Palette } from "lucide-react";
import { getConfig, updateConfig } from "@/commands/cfg";
import { useEffect, useState } from "react";
import { Config } from "@/types/cfg";
import {
  MINUTE,
  HOUR,
  DAY,
  WEEK,
  SteppedSlider,
  MONTH,
} from "@/components/stepped-slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { save } from "@tauri-apps/plugin-dialog";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AlertDescription } from "@/components/ui/alert";

const MIN_FETCH_MARKERS = [
  MINUTE,
  5 * MINUTE,
  15 * MINUTE,
  30 * MINUTE,
  HOUR,
  6 * HOUR,
  DAY,
  WEEK,
];
const MAX_FETCH_MARKERS = [
  HOUR,
  2 * HOUR,
  4 * HOUR,
  6 * HOUR,
  12 * HOUR,
  DAY,
  2 * DAY,
  4 * DAY,
  WEEK,
];
const SHORT_TERM_MARKERS = [12 * HOUR, DAY, 2 * DAY, 4 * DAY, 6 * DAY, WEEK];
const LONG_TERM_MARKERS = [15 * DAY, 20 * DAY, 30 * DAY, 60 * DAY];

function AppearancePage() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    () => localStorage.getItem("notifications") === "true",
  );
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
          <Separator />
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-muted-foreground tracking-wide mb-5">
              Notifications
            </h3>

            <div className="flex items-center justify-between min-h-10">
              <div className="space-y-2">
                <Label className="text-lg">Receive notifications</Label>
                <p className="text-s text-muted-foreground">
                  Shown as toasts when application is focused, and as system
                  notifications when not
                </p>
              </div>
              <Switch
                checked={notificationsEnabled}
                onCheckedChange={(checked) => {
                  setNotificationsEnabled(checked);
                  localStorage.setItem("notifications", String(checked));
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
function ConfigRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between min-h-10 gap-4">
      <div className="space-y-0.5 shrink-0">
        <Label className="text-lg">{label}</Label>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

function SliderRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-0.5">
        <Label className="text-lg">{label}</Label>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

// this function is large compared to the rest, might refactor it later.
export function AdvancedPage() {
  const [config, setConfig] = useState<Config | null>(null);
  const [draft, setDraft] = useState<Config | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const dirty =
    config !== null && JSON.stringify(config) !== JSON.stringify(draft);

  useEffect(() => {
    getConfig()
      .then((cfg) => {
        setConfig(cfg);
        setDraft(cfg);
      })
      .catch((e) => setError(String(e)));
  }, []);

  function updateDraft(section: keyof Config, field: string, value: unknown) {
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            [section]: {
              ...prev[section],
              [field]: value,
            },
          }
        : prev,
    );
  }

  async function handleSave() {
    if (!draft) return;
    setSaving(true);

    try {
      await updateConfig(draft);
      setConfig(draft);
      toast.success("Successfully saved configuration", {
        position: "top-right",
      });
    } catch (e) {
      toast.error("Failed to save configuration", {
        position: "top-right",
      });
    } finally {
      setSaving(false);
    }
  }

  if (error)
    return (
      <div className="max-w-2xl ml-5 text-destructive">
        Failed to load config: {error}
      </div>
    );
  if (!draft)
    return (
      <div className="max-w-2xl ml-5 text-muted-foreground">Loading...</div>
    );

  return (
    <div className="max-w-2xl ml-5 mb-5">
      <Card className="shadow-sm border-l border-primary">
        <CardHeader>
          <CardTitle className="text-xl">Advanced</CardTitle>
          <p className="text-sm text-muted-foreground">
            Current application configuration. Only takes effect after restart.
          </p>
        </CardHeader>

        <Separator />

        <CardContent className="space-y-6 pt-4">
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-muted-foreground tracking-wide">
              Network
            </h3>
            <ConfigRow
              label="Tor Proxy Port"
              description="Port used for the SOCKS5 Tor proxy"
            >
              <Input
                type="number"
                min={1}
                max={65535}
                value={draft.network.tor_proxy_port}
                onChange={(e) =>
                  updateDraft(
                    "network",
                    "tor_proxy_port",
                    parseInt(e.target.value) as any,
                  )
                }
                className="w-32 text-right"
              />
            </ConfigRow>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-medium text-muted-foreground tracking-wide">
              Paths
            </h3>
            <ConfigRow
              label="Database File"
              description="Path to the SQLite database file"
            >
              <Input value={draft.paths.db_file} readOnly className="w-96" />
              <Button
                variant="outline"
                onClick={async () => {
                  const selected = await save({
                    defaultPath: draft.paths.db_file,
                    filters: [
                      {
                        name: "SQLite Database",
                        extensions: ["db", "sqlite", "sqlite3"],
                      },
                    ],
                  });

                  if (selected) {
                    updateDraft("paths", "db_file", selected);
                  }
                }}
              >
                Browse...
              </Button>
            </ConfigRow>
          </div>

          <Separator />

          <div className="space-y-6">
            <h3 className="text-lg font-medium text-muted-foreground tracking-wide">
              Scheduler
            </h3>

            <SliderRow
              label="Min Fetch Interval"
              description="Minimum time between fetches"
            >
              <SteppedSlider
                value={draft.scheduler.min_fetch_interval}
                onChange={(v) =>
                  updateDraft("scheduler", "min_fetch_interval", v as any)
                }
                min={MINUTE}
                max={WEEK}
                markers={MIN_FETCH_MARKERS}
              />
            </SliderRow>

            <SliderRow
              label="Max Fetch Interval"
              description="All sources will be fetched at least once before max interval"
            >
              <SteppedSlider
                value={draft.scheduler.max_fetch_interval}
                onChange={(v) =>
                  updateDraft("scheduler", "max_fetch_interval", v as any)
                }
                min={HOUR}
                max={WEEK}
                markers={MAX_FETCH_MARKERS}
              />
            </SliderRow>

            <SliderRow
              label="Short Term Cutoff"
              description="Short time window for analyzing signals"
            >
              <SteppedSlider
                value={draft.scheduler.short_term_cutoff_time}
                onChange={(v) =>
                  updateDraft("scheduler", "short_term_cutoff_time", v as any)
                }
                min={12 * HOUR}
                max={WEEK}
                markers={SHORT_TERM_MARKERS}
              />
            </SliderRow>

            <SliderRow
              label="Long Term Cutoff"
              description="Long time window for analyzing signals"
            >
              <SteppedSlider
                value={draft.scheduler.long_term_cutoff_time}
                onChange={(v) =>
                  updateDraft("scheduler", "long_term_cutoff_time", v as any)
                }
                min={15 * DAY}
                max={2 * MONTH}
                markers={LONG_TERM_MARKERS}
              />
            </SliderRow>

            <SliderRow
              label="Fetch Freshness Bias"
              description="How much to prefer recent feedback signals (0.0 — 1.0)"
            >
              <SteppedSlider
                value={draft.scheduler.fetch_freshness_bias}
                onChange={(v) =>
                  updateDraft("scheduler", "fetch_freshness_bias", v as any)
                }
                min={0}
                max={1}
                logarithmic={false}
                format={(v) => v.toFixed(2)}
                markers={[0, 0.2, 0.4, 0.5, 0.6, 0.75, 0.8, 0.9, 1]}
              />
            </SliderRow>

            <ConfigRow
              label="Signals Count Limit"
              description="Cut-off count of signals included in calculations"
            >
              <Input
                type="number"
                min={0}
                value={draft.scheduler.signals_count_limit}
                onChange={(e) =>
                  updateDraft(
                    "scheduler",
                    "signals_count_limit",
                    parseInt(e.target.value) as any,
                  )
                }
                className="w-32 text-right"
              />
            </ConfigRow>

            <ConfigRow
              label="Publication Window Threshold"
              description="Threshold new items count to consider a signal in average publication window calculation"
            >
              <Input
                type="number"
                min={0}
                value={
                  draft.scheduler.publication_window_new_items_count_threshold
                }
                onChange={(e) =>
                  updateDraft(
                    "scheduler",
                    "publication_window_new_items_count_threshold",
                    parseInt(e.target.value) as any,
                  )
                }
                className="w-32 text-right"
              />
            </ConfigRow>
          </div>
        </CardContent>

        <CardFooter className="flex items-center justify-between pt-4">
          <Button
            variant="outline"
            disabled={!config || !dirty}
            onClick={() => setDraft(config)}
          >
            Reset
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={saving || !dirty}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Are you sure you want to save?
                </AlertDialogTitle>
                <AlertDescription>
                  This action can not be reversed and effects will take place on
                  next app start.
                </AlertDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleSave}>Save</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      </Card>
    </div>
  );
}

export function SettingsPage() {
  return (
    <Tabs defaultValue="appearance" className="w-full">
      <div className="flex justify-center sticky top-0 bg-background/80 w-full z-10 backdrop-blur">
        <TabsList variant="line" className="mx-auto w-fit">
          <TabsTrigger value="appearance">
            <Palette />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="advanced">
            <Cable />
            Advanced
          </TabsTrigger>
        </TabsList>
      </div>

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
