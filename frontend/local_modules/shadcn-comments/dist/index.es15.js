import e, { useState as c } from "react";
import { MDXEditor as s, toolbarPlugin as d, headingsPlugin as u, listsPlugin as g, quotePlugin as E, thematicBreakPlugin as p, markdownShortcutPlugin as f, tablePlugin as h, imagePlugin as k, linkPlugin as x, linkDialogPlugin as N, UndoRedo as P, ListsToggle as v, Separator as w, InsertImage as C, BoldItalicUnderlineToggles as b, BlockTypeSelect as y, CreateLink as T, InsertTable as U } from "@mdxeditor/editor";
import { Button as r } from "./index.es2.js";
const L = ({
  value: l = "",
  onChange: a = () => {
  },
  placeholder: m = "Add your comment here...",
  onUpload: o,
  theme: i,
  currentUser: B
}) => {
  const [t, n] = c(l);
  return /* @__PURE__ */ e.createElement("div", { className: "flex flex-col gap-2 w-full editor-content-container" }, /* @__PURE__ */ e.createElement("div", { className: "flex gap-4 w-full" }, /* @__PURE__ */ e.createElement("div", { className: "w-full flex-1" }, /* @__PURE__ */ e.createElement(
    s,
    {
      markdown: t,
      onChange: n,
      placeholder: m,
      className: `border rounded-md prose-sm md:prose max-w-full editor-content ${i === "dark" ? "dark-theme" : "light-theme"}`,
      contentEditableClassName: "overflow-y-auto py-2 whitespace-normal text-start",
      plugins: [
        d({
          toolbarContents: () => /* @__PURE__ */ e.createElement("div", { className: "flex gap-1" }, " ", /* @__PURE__ */ e.createElement(P, null), /* @__PURE__ */ e.createElement(v, null), /* @__PURE__ */ e.createElement(w, null), /* @__PURE__ */ e.createElement(C, null), /* @__PURE__ */ e.createElement("div", { className: "hidden md:flex gap-1" }, /* @__PURE__ */ e.createElement(b, null), /* @__PURE__ */ e.createElement(y, null), /* @__PURE__ */ e.createElement(T, null), /* @__PURE__ */ e.createElement(U, null)))
        }),
        u(),
        g(),
        E(),
        p(),
        f(),
        h(),
        k({
          imageUploadHandler: o
        }),
        x(),
        N()
      ]
    }
  ))), /* @__PURE__ */ e.createElement("div", { className: "flex justify-end items-center gap-2" }, /* @__PURE__ */ e.createElement(
    r,
    {
      onClick: () => {
        a(l);
      },
      variant: "destructive",
      className: "h-8"
    },
    "Cancel"
  ), /* @__PURE__ */ e.createElement(
    r,
    {
      disabled: !t,
      onClick: () => {
        a(t), n("");
      },
      className: "h-8"
    },
    "Update Comment"
  )));
};
export {
  L as EditingEditorComment
};
//# sourceMappingURL=index.es15.js.map
