import * as e from "react";
import { Slot as d } from "@radix-ui/react-slot";
import { cva as c } from "class-variance-authority";
import { cn as u } from "./index.es9.js";
const f = c(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "underline-offset-4 hover:underline text-primary"
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
), l = e.forwardRef(
  ({ className: t, variant: r, size: o, asChild: n = !1, ...i }, s) => {
    const a = n ? d : "button";
    return /* @__PURE__ */ e.createElement(
      a,
      {
        className: u(f({ variant: r, size: o, className: t })),
        ref: s,
        ...i
      }
    );
  }
);
l.displayName = "Button";
export {
  l as Button,
  f as buttonVariants
};
//# sourceMappingURL=index.es2.js.map
