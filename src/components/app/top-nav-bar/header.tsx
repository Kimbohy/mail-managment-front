import UserDropdownMenu from "../user-dropdown-menue";
import SearchBarDesktop from "../top-nav-bar/search-bar-desktop";
import { Mail, RefreshCw, Edit3, Menu, X, Search, Filter } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { ThemeToggle } from "@/components/ui/theme-toggle";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState } from "react";
import type { SessionInfo } from "@/api/auth";
import { parseAsBoolean, parseAsString, useQueryState } from "nuqs";

export default function Header({
  onLogout,
  sidebarOpen,
  setSidebarOpen,
  session,
  listLoading,
  refreshMessages,
  setComposeOpen,
  onTrashClick,
}: {
  onLogout: () => Promise<void>;
  sidebarOpen: boolean;
  setSidebarOpen: any;
  session: SessionInfo;
  listLoading: boolean;
  refreshMessages: () => Promise<void>;
  setComposeOpen: any;
  onTrashClick?: () => void;
}) {
  const [searchQuery, setSearchQuery] = useQueryState(
    "search",
    parseAsString.withDefault("")
  );
  const [showUnreadOnly, setShowUnreadOnly] = useQueryState(
    "unread",
    parseAsBoolean.withDefault(false)
  );
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  useEffect(() => {
    if (mobileSearchOpen) {
      setSidebarOpen(true);
    } else {
      setSidebarOpen(false);
    }
  }, [mobileSearchOpen]);
  return (
    <header className="flex flex-col border-b">
      <div className="flex h-14 items-center justify-between px-4">
        {/* Mobile: Expandable Search UI */}
        {mobileSearchOpen ? (
          <div className="flex items-center gap-2 w-full md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setMobileSearchOpen(false);
                setSearchQuery("");
              }}
            >
              <X className="size-5" />
            </Button>
            <InputGroup className="flex-1">
              <InputGroupAddon>
                <Search className="size-4" />
              </InputGroupAddon>
              <InputGroupInput
                type="text"
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </InputGroup>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Filter className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filter Options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={showUnreadOnly}
                  onCheckedChange={setShowUnreadOnly}
                >
                  Unread only
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <>
            {/* Mobile: Normal Layout (collapsed search) */}
            <div className="flex items-center gap-2 md:gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                {sidebarOpen ? (
                  <X className="size-5" />
                ) : (
                  <Menu className="size-5" />
                )}
              </Button>

              <Mail className="size-5 md:size-6 text-primary" />
              <h1 className="text-base md:text-lg font-semibold">
                Mail Manager
              </h1>
              <Separator
                orientation="vertical"
                className="hidden md:block h-6"
              />
              <span className="hidden md:inline text-sm text-muted-foreground">
                {session.email}
              </span>
            </div>

            {/* Desktop: Full Search Bar */}
            <SearchBarDesktop
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              showUnreadOnly={showUnreadOnly}
              setShowUnreadOnly={setShowUnreadOnly}
            />

            {/* Action Buttons */}
            <div className="flex items-center gap-1 md:gap-2 shrink-0">
              {/* Mobile search button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileSearchOpen(true)}
              >
                <Search className="size-5" />
              </Button>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => void refreshMessages()}
                    disabled={listLoading}
                  >
                    <RefreshCw
                      className={cn("size-4", listLoading && "animate-spin")}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh inbox</TooltipContent>
              </Tooltip>

              <div className="hidden md:block">
                <ThemeToggle />
              </div>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setComposeOpen(true)}
                    className="gap-2"
                  >
                    <Edit3 className="size-4" />
                    <span className="hidden sm:inline">Compose</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Compose new email</TooltipContent>
              </Tooltip>

              <UserDropdownMenu
                onLogout={onLogout}
                session={session}
                onTrashClick={onTrashClick}
              />
            </div>
          </>
        )}
      </div>
    </header>
  );
}
