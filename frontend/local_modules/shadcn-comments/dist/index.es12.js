import * as e from "react";
import * as t from "@radix-ui/react-popover";
import { cn as i } from "./index.es9.js";
const p = t.Root, l = t.Trigger, s = e.forwardRef(({ className: o, align: a = "center", sideOffset: r = 4, ...d }, n) => /* @__PURE__ */ e.createElement(t.Portal, null, /* @__PURE__ */ e.createElement(
  t.Content,
  {
    ref: n,
    align: a,
    sideOffset: r,
    className: i(
      "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      o
    ),
    ...d
  }
)));
s.displayName = t.Content.displayName;
export {
  p as Popover,
  s as PopoverContent,
  l as PopoverTrigger
};
//# sourceMappingURL=index.es12.js.map
