import e, { useRef as m, useState as p, useEffect as f } from "react";
import { EllipsisVertical as v } from "lucide-react";
function x({
  comment: i,
  openEditor: s,
  currentUser: l,
  deleteComment: a
}) {
  const o = m(null), [n, t] = p(!1), c = async () => {
    const r = window.location.host + `#comment-${i.id}`;
    navigator.clipboard && window.isSecureContext && (await navigator.clipboard.writeText(r ?? ""), t(!1));
  }, d = () => {
    t(!1), confirm("Are you sure you want to delete this?") && a();
  };
  return f(() => {
    function r(u) {
      o.current && !o.current.contains(u.target) && n && t(!1);
    }
    return document.addEventListener("mousedown", r), () => {
      document.removeEventListener("mousedown", r);
    };
  }, [n, o]), /* @__PURE__ */ e.createElement("div", { className: "dropdown" }, /* @__PURE__ */ e.createElement(
    "div",
    {
      onClick: () => t(!n),
      className: "w-8 h-8 flex justify-center items-center cursor-pointer dropbtn"
    },
    /* @__PURE__ */ e.createElement(v, { size: 18 })
  ), /* @__PURE__ */ e.createElement(
    "div",
    {
      ref: o,
      className: `dropdown-content border rounded-lg overflow-hidden cursor-pointer ${n ? "!block" : ""}`
    },
    /* @__PURE__ */ e.createElement(
      "div",
      {
        className: "px-3 py-2 text-sm hover:bg-blue-500 hover:text-white",
        onClick: c
      },
      /* @__PURE__ */ e.createElement("div", null, "Copy link")
    ),
    l?.id === i.user?.id && /* @__PURE__ */ e.createElement(
      "div",
      {
        onClick: () => {
          s(), t(!1);
        },
        className: "px-3 py-2 text-sm hover:bg-blue-500 hover:text-white"
      },
      /* @__PURE__ */ e.createElement("div", null, "Edit")
    ),
    l?.id === i.user?.id && /* @__PURE__ */ e.createElement(
      "div",
      {
        className: "px-3 py-2 text-sm text-red-600 hover:bg-blue-500",
        onClick: d
      },
      /* @__PURE__ */ e.createElement("div", null, "Delete")
    )
  ));
}
export {
  x as DropdownMenu
};
//# sourceMappingURL=index.es14.js.map
