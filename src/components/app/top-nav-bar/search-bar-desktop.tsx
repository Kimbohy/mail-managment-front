import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Filter, Search } from "lucide-react";

const SearchBarDesktop = ({
  searchQuery,
  setSearchQuery,
  showUnreadOnly,
  setShowUnreadOnly,
}: {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  showUnreadOnly: boolean;
  setShowUnreadOnly: (show: boolean) => void;
}) => {
  return (
    <div className="hidden md:flex items-center gap-2 flex-1 justify-center px-4 max-w-2xl">
      <InputGroup className="w-full max-w-md">
        <InputGroupAddon>
          <Search className="size-4" />
        </InputGroupAddon>
        <InputGroupInput
          type="text"
          placeholder="Search messages..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </InputGroup>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 shrink-0">
            <Filter className="size-4" />
            <span className="hidden sm:inline">Filter</span>
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

      {(searchQuery || showUnreadOnly) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSearchQuery("");
            setShowUnreadOnly(false);
          }}
          className="text-xs shrink-0"
        >
          Clear
        </Button>
      )}
    </div>
  );
};

export default SearchBarDesktop;
