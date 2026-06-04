import e, { useState as u, useEffect as d } from "react";
import { MDXEditor as g, toolbarPlugin as p, headingsPlugin as f, listsPlugin as E, quotePlugin as x, thematicBreakPlugin as b, markdownShortcutPlugin as h, tablePlugin as w, imagePlugin as N, linkPlugin as k, linkDialogPlugin as v, UndoRedo as P, ListsToggle as C, Separator as y, InsertImage as I, BoldItalicUnderlineToggles as B, BlockTypeSelect as T, CreateLink as A, InsertTable as S } from "@mdxeditor/editor";
import { Button as U } from "./index.es2.js";
import { Avatar as _, AvatarImage as j, AvatarFallback as D } from "./index.es3.js";
import { cn as L } from "./index.es9.js";
const R = (l, n) => {
  const r = (l?.fullName || l?.username || n).trim().split(/\s+/).filter(Boolean).slice(0, 2).map((a) => a[0]?.toUpperCase() || "").join("");
  if (r) return r;
  const t = (n ?? "").trim();
  return t ? t.slice(0, 2).toUpperCase() : "?";
}, X = ({
  value: l = "",
  onChange: n = () => {
  },
  placeholder: m = "Add your comment here...",
  onUpload: i,
  theme: r,
  currentUser: t
}) => {
  const [a, o] = u("");
  d(() => {
    o(l);
  }, [l]);
  const s = t?.fullName || t?.username || "You", c = R(t, s);
  return /* @__PURE__ */ e.createElement("div", { className: "editor-content-container flex w-full flex-col gap-2" }, /* @__PURE__ */ e.createElement("div", { className: "flex w-full gap-3" }, /* @__PURE__ */ e.createElement(_, { className: "h-8 w-8 ring-1 ring-border/60" }, /* @__PURE__ */ e.createElement(j, { src: t?.profile?.avatarUrl }), /* @__PURE__ */ e.createElement(D, { className: "bg-[linear-gradient(to_bottom,#4967ff,#2ecaff)] text-white text-xs font-medium uppercase" }, c)), /* @__PURE__ */ e.createElement("div", { className: "w-full flex-1" }, /* @__PURE__ */ e.createElement(
    g,
    {
      markdown: a,
      onChange: o,
      placeholder: m,
      className: L(
        "editor-content prose-sm md:prose max-w-full rounded-xl border border-border/60 bg-background/80",
        "focus-within:ring-2 focus-within:ring-primary/40",
        r === "dark" ? "dark-theme" : "light-theme"
      ),
      contentEditableClassName: "overflow-y-auto whitespace-normal text-start py-2 px-3",
      plugins: [
        p({
          toolbarContents: () => /* @__PURE__ */ e.createElement("div", { className: "flex flex-wrap items-center gap-1 p-1" }, /* @__PURE__ */ e.createElement(P, null), /* @__PURE__ */ e.createElement(C, null), /* @__PURE__ */ e.createElement(y, null), /* @__PURE__ */ e.createElement(I, null), /* @__PURE__ */ e.createElement("div", { className: "hidden gap-1 md:flex" }, /* @__PURE__ */ e.createElement(B, null), /* @__PURE__ */ e.createElement(T, null), /* @__PURE__ */ e.createElement(A, null), /* @__PURE__ */ e.createElement(S, null)))
        }),
        f(),
        E(),
        x(),
        b(),
        h(),
        w(),
        N({ imageUploadHandler: i }),
        k(),
        v()
      ]
    }
  ))), /* @__PURE__ */ e.createElement("div", { className: "flex justify-end" }, /* @__PURE__ */ e.createElement(
    U,
    {
      disabled: !a,
      onClick: () => {
        n(a), o("");
      },
      className: "h-8"
    },
    "Comment"
  )));
};
export {
  X as EditorComment
};
//# sourceMappingURL=index.es6.js.map
