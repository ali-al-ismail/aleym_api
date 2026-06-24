import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { SearchBar } from "./search-bar";

// split into 3 divs left, center, right
export function Header() {
  return (
    <header className="bg-background/80 z-10 backdrop-blur sticky top-0 flex h-(--header-height) shrink-0 items-center gap-2 px-4 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      {/*left div*/}
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
      </div>
      {/*center div*/}
      <div className="flex min-w-0 flex-1 justify-center">
        <SearchBar className="w-full max-w-md" />
      </div>
      {/*right div*/}
      <div className="flex items-center gap-2"></div>
    </header>
  );
}
