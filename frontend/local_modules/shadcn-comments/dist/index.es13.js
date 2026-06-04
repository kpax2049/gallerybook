import * as r from "react";
import { ACTIONS as c } from "./index.es8.js";
function s({ className: t = "", value: e, onSelect: d, onUnSelect: m }) {
  return /* @__PURE__ */ r.createElement("div", { className: `inline-flex gap-1 ${t}` }, c.map((i) => /* @__PURE__ */ r.createElement(
    "div",
    {
      key: i.id,
      className: `p-1 h-7 w-7 flex justify-center items-center rounded-lg cursor-pointer ${e?.includes(i.id) ? "bg-primary" : "hover:bg-primary/90"}`,
      onClick: () => {
        e?.includes(i.id) ? m(e?.filter((n) => n != i.id), i.id) : d(e ? [...e, i.id] : [i.id], i.id);
      }
    },
    i.emoji
  )));
}
export {
  s as default
};
//# sourceMappingURL=index.es13.js.map
