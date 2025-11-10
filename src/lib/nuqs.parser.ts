import { createParser } from "nuqs";

export type BoxType = "INBOX" | "SENT";

export const mailBoxTypeParser = createParser({
  parse(value): BoxType {
    return value as BoxType;
  },
  serialize(value) {
    return value;
  },
});
