import { LogOut, User, Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

import { useTheme } from "@/components/theme-provider";
import { useState } from "react";
import type { SessionInfo } from "@/api/auth";

export default function UserDropdownMenu({
  onLogout,
  session,
}: {
  onLogout: () => Promise<void>;
  session: SessionInfo;
}) {
  const [logoutPending, setLogoutPending] = useState(false);
  const { theme, setTheme } = useTheme();
  const handleLogoutClick = async () => {
    setLogoutPending(true);
    await onLogout();
    setLogoutPending(false);
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <User className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{session.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            const newTheme =
              theme === "system"
                ? window.matchMedia("(prefers-color-scheme: dark)").matches
                  ? "light"
                  : "dark"
                : theme === "dark"
                ? "light"
                : "dark";
            setTheme(newTheme);
          }}
          className="md:hidden"
        >
          {theme === "dark" ||
          (theme === "system" &&
            window.matchMedia("(prefers-color-scheme: dark)").matches) ? (
            <>
              <Sun className="mr-2 size-4" />
              Light mode
            </>
          ) : (
            <>
              <Moon className="mr-2 size-4" />
              Dark mode
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator className="md:hidden" />
        <DropdownMenuItem
          onClick={() => void handleLogoutClick()}
          disabled={logoutPending}
        >
          <LogOut className="mr-2 size-4" />
          {logoutPending ? "Logging out..." : "Logout"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
