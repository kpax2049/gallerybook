import * as e from "react";
import { cn as n } from "./index.es9.js";
const s = e.forwardRef(
  ({ className: r, type: t, ...o }, i) => /* @__PURE__ */ e.createElement(
    "input",
    {
      type: t,
      className: n(
        "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        r
      ),
      ref: i,
      ...o
    }
  )
);
s.displayName = "Input";
export {
  s as Input
};
//# sourceMappingURL=index.es5.js.map
