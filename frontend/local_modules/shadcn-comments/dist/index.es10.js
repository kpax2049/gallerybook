import e, { useState as c } from "react";
import { Avatar as i, AvatarImage as p, AvatarFallback as f } from "./index.es3.js";
import { Input as u } from "./index.es5.js";
const d = (m, s) => {
  const a = (m?.fullName || m?.username || s).trim().split(/\s+/).filter(Boolean).slice(0, 2).map((n) => n[0]?.toUpperCase() || "").join("");
  if (a) return a;
  const l = (s ?? "").trim();
  return l ? l.slice(0, 2).toUpperCase() : "?";
}, g = ({
  value: m = "",
  onChange: s = () => {
  },
  currentUser: t
}) => {
  const [r, a] = c(""), l = t?.fullName || t?.username || "You", n = d(t, l);
  return /* @__PURE__ */ e.createElement("div", { className: "flex gap-2 w-full items-center" }, /* @__PURE__ */ e.createElement(i, { className: "w-[28px] h-[28px]" }, /* @__PURE__ */ e.createElement(p, { src: t?.profile?.avatarUrl }), /* @__PURE__ */ e.createElement(f, { className: "bg-[linear-gradient(to_bottom,#4967ff,#2ecaff)] text-white text-xs font-medium uppercase" }, n)), /* @__PURE__ */ e.createElement("div", { className: "w-full flex-1" }, /* @__PURE__ */ e.createElement(
    u,
    {
      className: "rounded-md",
      placeholder: `Reply as ${l}`,
      value: r,
      onChange: (o) => a(o.target.value),
      onKeyDown: (o) => {
        o.code === "Enter" && (s(r), a(""));
      }
    }
  )));
};
export {
  g as EditorCommentStyle2
};
//# sourceMappingURL=index.es10.js.map
