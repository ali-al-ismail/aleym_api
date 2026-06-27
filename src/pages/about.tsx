import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Bug, CircleUserRound, Code } from "lucide-react";
import { useAppInfo } from "@/hooks/use-appinfo";

export function AboutPage() {
  const { data: appInfo } = useAppInfo();
  return (
    <div className="p-6 flex justify-center">
      <div className="max-w-3xl space-y-6 ">
        <Card className="shadow-sm border-l border-primary">
          <CardHeader>
            <CardTitle className="text-3xl">Aleym</CardTitle>

            <CardDescription className="text-base">
              News Aggregation System and Knowledge Base
            </CardDescription>
          </CardHeader>

          <Separator />

          <CardContent className="pt-6 space-y-6">
            <p className="text-muted-foreground leading-relaxed">
              Aleym collects, organizes, categorizes and preserves information
              from multiple sources into a searchable local knowledge base.
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l border-primary">
          <CardHeader>
            <CardTitle>Version Information</CardTitle>
            <p className="text-sm text-muted-foreground">
              Current build details.
            </p>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4">
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-1.5 border-b border-dashed border-muted">
                <dt className="text-muted-foreground">Version</dt>
                <dd className="font-mono font-medium">
                  {appInfo?.version ?? "..."}
                </dd>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-dashed border-muted">
                <dt className="text-muted-foreground">Build Date</dt>
                <dd className="font-mono font-medium">
                  {appInfo?.buildDate ?? "..."}
                </dd>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <dt className="text-muted-foreground">Commit</dt>
                <dd>
                  <a
                    href={`https://github.com/ali-al-ismail/aleym_api/commit/${appInfo?.hash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-primary hover:underline"
                  >
                    {appInfo?.hash ?? "..."}
                  </a>
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l border-primary">
          <CardHeader>
            <CardTitle>Credits</CardTitle>
            <p className="text-sm text-muted-foreground"></p>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4 space-y-3">
            <a
              href="https://github.com/ali-al-ismail"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors group"
            >
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                <CircleUserRound className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <p className="text-sm font-medium group-hover:text-primary transition-colors">
                      ali-al-ismail
                    </p>
                    <p className="text-xs text-muted-foreground">
                      github.com/ali-al-ismail
                    </p>
                  </div>
                </TooltipTrigger>

                <TooltipContent>
                  <p>Tauri application development</p>
                </TooltipContent>
              </Tooltip>
            </a>

            <a
              href="https://github.com/zefr0x"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors group"
            >
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                <CircleUserRound className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <p className="text-sm font-medium group-hover:text-primary transition-colors">
                      zefr0x
                    </p>
                    <p className="text-xs text-muted-foreground">
                      github.com/zefr0x
                    </p>
                  </div>
                </TooltipTrigger>

                <TooltipContent>
                  <p>aleym_core development</p>
                </TooltipContent>
              </Tooltip>
            </a>
          </CardContent>

          <CardFooter className="pt-4">
            <p className="text-xs text-muted-foreground">
              Built with Rust, Tauri, and React.
            </p>
          </CardFooter>
        </Card>

        <Card className="shadow-sm border-l border-primary">
          <CardHeader>
            <CardTitle>Resources</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4 space-y-1">
            <a
              href="https://github.com/ali-al-ismail/aleym_api"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors group"
            >
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                <Code className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
              <div>
                <p className="text-sm font-medium group-hover:text-primary transition-colors">
                  Source Code
                </p>
                <p className="text-xs text-muted-foreground">
                  github.com/ali-al-ismail/aleym_api
                </p>
              </div>
            </a>

            <a
              href="https://github.com/ali-al-ismail/aleym_api/issues"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors group"
            >
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                <Bug className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
              <div>
                <p className="text-sm font-medium group-hover:text-primary transition-colors">
                  Report an Issue
                </p>
                <p className="text-xs text-muted-foreground">
                  github.com/ali-al-ismail/aleym_api/issues
                </p>
              </div>
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
