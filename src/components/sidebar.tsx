import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Separator } from "./ui/separator";
import {
  CircleQuestionMark,
  Eye,
  Heart,
  LibraryBig,
  Settings,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { Page } from "@/App";

type NavItem = {
  title: string;
  page: Page;
  icon?: LucideIcon;
};

const mainNavPoints: NavItem[] = [
  { title: "Feed", icon: LibraryBig, page: "news" },
  { title: "Recommended", icon: Heart, page: "recommend" },
  { title: "Manage", icon: Wrench, page: "manage" },
];

const secondayNavPoints: NavItem[] = [
  { title: "Settings", icon: Settings, page: "settings" },
  { title: "About", icon: CircleQuestionMark, page: "about" },
];

function NavSection({
  items,
  page,
  setPage,
}: {
  items: {
    title: string;
    page: Page;
    icon?: LucideIcon;
  }[];
  page: Page;
  setPage: (page: Page) => void;
}) {
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                onClick={() => setPage(item.page)}
                isActive={page === item.page}
                tooltip={item.title}
                className="[&>svg]:size-5 group-data-[collapsible=icon]:[&>svg]:mr-1"
              >
                {item.icon && <item.icon />}
                <span className="text-lg">{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar({
  page,
  setPage,
  ...props
}: {
  page: Page;
  setPage: (page: Page) => void;
} & React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="items-center">
        <Eye />
      </SidebarHeader>

      <SidebarContent>
        <NavSection items={mainNavPoints} page={page} setPage={setPage} />
        <Separator />
      </SidebarContent>
      <Separator />
      <SidebarFooter className="px-0 bg-background-muted">
        <NavSection items={secondayNavPoints} page={page} setPage={setPage} />
      </SidebarFooter>
    </Sidebar>
  );
}
