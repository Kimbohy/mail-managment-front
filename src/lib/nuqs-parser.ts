import { createParser } from "nuqs";

export type BoxType = "INBOX" | "SENT" | "TRASH";

export const mailBoxTypeParser = createParser({
  parse(value): BoxType {
    return value as BoxType;
  },
  serialize(value) {
    return value;
  },
});
