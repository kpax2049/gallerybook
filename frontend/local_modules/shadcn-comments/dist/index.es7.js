import e, { useState as C } from "react";
import { Avatar as P, AvatarImage as k, AvatarFallback as U } from "./index.es3.js";
import { ArrowUpIcon as D, SmileIcon as j, CircleIcon as _ } from "lucide-react";
import { EditorComment as M } from "./index.es6.js";
import { ACTIONS as z, ACTIONS_TYPE as c } from "./index.es8.js";
import { EditorCommentStyle2 as R } from "./index.es10.js";
import { MDXProvider as V } from "@mdx-js/react";
import $ from "./index.es11.js";
import { formatDistance as A } from "date-fns";
import { Popover as B, PopoverTrigger as F, PopoverContent as X } from "./index.es12.js";
import Y from "./index.es13.js";
import { DropdownMenu as q } from "./index.es14.js";
import { EditingEditorComment as G } from "./index.es15.js";
const S = (t, f) => {
  const n = (t?.fullName || t?.username || f || "").trim().split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() || "").join("");
  if (n) return n;
  const i = (f ?? "").trim();
  return i ? i.slice(0, 2).toUpperCase() : "?";
}, H = ({
  comment: t,
  onReply: f = () => {
  },
  currentUser: m,
  allowUpVote: o,
  onChange: n,
  onReact: i,
  theme: p,
  onDelete: u
}) => {
  const [g, N] = C(!1), [v, l] = C(!1), s = t.actions ?? void 0, d = z.filter((r) => (s?.[r.id] ?? 0) > 0), b = t.user, y = b?.fullName || b?.username || "Unknown user", T = b?.profile?.avatarUrl, I = S(b, y), O = (t.actions ?? {})[c.UPVOTE], w = t.selectedActions?.includes(c.UPVOTE);
  return /* @__PURE__ */ e.createElement("div", { className: "flex flex-col gap-1", id: `comment-${t.id}` }, /* @__PURE__ */ e.createElement("div", { className: "flex gap-4" }, /* @__PURE__ */ e.createElement(P, { className: "w-[32px] h-[32px] ring-1 ring-border/60 overflow-hidden" }, /* @__PURE__ */ e.createElement(k, { src: T }), /* @__PURE__ */ e.createElement(U, { className: "bg-[linear-gradient(to_bottom,#4967ff,#2ecaff)] text-white font-medium" }, I)), /* @__PURE__ */ e.createElement("div", { className: "flex flex-col w-full" }, /* @__PURE__ */ e.createElement("div", { className: "relative min-h-[30px] rounded-md border border-border/70 bg-card/70 shadow-sm hover:shadow-md transition-shadow" }, /* @__PURE__ */ e.createElement("div", { className: "relative h-10 w-full rounded-t-md flex items-center justify-between px-3 bg-background/40" }, /* @__PURE__ */ e.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ e.createElement("span", { className: "inline-block font-semibold tracking-tight" }, y), t.createdAt && /* @__PURE__ */ e.createElement("span", { className: "text-xs text-muted-foreground/80" }, A(Date.now(), t.createdAt, {
    addSuffix: !0
  }))), /* @__PURE__ */ e.createElement(
    q,
    {
      comment: t,
      currentUser: m,
      openEditor: () => l(!0),
      deleteComment: u
    }
  ), /* @__PURE__ */ e.createElement("div", { className: "pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-[#4967ff]/30 to-[#2ecaff]/30" })), /* @__PURE__ */ e.createElement("div", { className: "px-4 py-3" }, v ? /* @__PURE__ */ e.createElement(
    G,
    {
      currentUser: m,
      theme: p,
      value: t.text,
      onChange: (r) => {
        n({ text: r }), l(!1);
      }
    }
  ) : /* @__PURE__ */ e.createElement($, { source: t.text })), o && !v && /* @__PURE__ */ e.createElement("div", { className: "flex flex-wrap items-center gap-2 md:gap-3 text-sm px-3 pb-3" }, /* @__PURE__ */ e.createElement(
    "div",
    {
      onClick: () => {
        const r = (t.actions || {})[c.UPVOTE];
        i(
          c.UPVOTE,
          !w
        ), w ? r && n({
          selectedActions: t.selectedActions?.filter(
            (a) => a !== c.UPVOTE
          ),
          actions: {
            ...t.actions || {},
            [c.UPVOTE]: r - 1
          }
        }) : n({
          selectedActions: [
            ...t.selectedActions ?? [],
            c.UPVOTE
          ],
          actions: {
            ...t.actions || {},
            [c.UPVOTE]: r ? r + 1 : 1
          }
        });
      },
      className: [
        "inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-sm cursor-pointer",
        "active:scale-[0.98] transition-all",
        w ? (
          // Gradient only when active
          "text-white border-transparent ring-0 shadow bg-[linear-gradient(to_bottom,rgba(73,103,255,.85),rgba(46,202,255,.85))]"
        ) : "border-border/70 hover:bg-accent"
      ].join(" ")
    },
    /* @__PURE__ */ e.createElement(D, { size: 16 }),
    /* @__PURE__ */ e.createElement("span", null, O ?? 0)
  ), /* @__PURE__ */ e.createElement(B, null, /* @__PURE__ */ e.createElement(F, { asChild: !0 }, /* @__PURE__ */ e.createElement(
    "div",
    {
      className: [
        "inline-flex h-8 w-8 items-center justify-center",
        "rounded-md border border-border/70 hover:bg-accent cursor-pointer",
        "active:scale-[0.98] transition-all"
      ].join(" ")
    },
    /* @__PURE__ */ e.createElement(j, { size: 16 })
  )), /* @__PURE__ */ e.createElement(X, { className: "p-0.5", align: "start" }, /* @__PURE__ */ e.createElement(
    Y,
    {
      value: t.selectedActions,
      onSelect: (r, a) => {
        const E = r, x = (t.actions || {})[a] ?? 0;
        i(a, !0), n({
          selectedActions: E,
          actions: {
            ...t.actions || {},
            [a]: x + 1
          }
        });
      },
      onUnSelect: (r, a) => {
        const E = r.filter(
          (h) => h !== a
        ), x = (t.actions || {})[a] ?? 0;
        i(a, !1), n({
          selectedActions: E,
          actions: {
            ...t.actions || {},
            [a]: Math.max(0, x - 1)
          }
        });
      },
      className: ""
    }
  ))), d?.map((r) => /* @__PURE__ */ e.createElement(
    "div",
    {
      key: r.id,
      className: "inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-sm border-border/60"
    },
    /* @__PURE__ */ e.createElement("span", null, r.emoji),
    /* @__PURE__ */ e.createElement("span", null, (t.actions ?? {})[r.id])
  )))), /* @__PURE__ */ e.createElement("div", { className: "ml-1 mt-1 flex items-center gap-2 text-sm text-muted-foreground" }, /* @__PURE__ */ e.createElement(
    "span",
    {
      className: "cursor-pointer font-semibold text-[#4967ff] hover:underline",
      onClick: () => N(!0)
    },
    "Reply"
  ), /* @__PURE__ */ e.createElement(_, { size: 3 }), /* @__PURE__ */ e.createElement("span", { className: "opacity-80" }, t.createdAt && A(Date.now(), t.createdAt, {
    addSuffix: !0
  }))))), g ? /* @__PURE__ */ e.createElement("div", { className: "ml-[48px]" }, /* @__PURE__ */ e.createElement(R, { onChange: f, currentUser: m })) : null, t.replies && t.replies.length > 0 ? /* @__PURE__ */ e.createElement("div", { className: "ml-[48px] flex flex-col gap-3 border-l-2 border-dashed border-border/60 pl-3 md:pl-4" }, t.replies.map((r) => {
    const a = r.user, E = a?.profile?.avatarUrl, x = a?.fullName || a?.username || "Unknown user", h = S(a, x);
    return /* @__PURE__ */ e.createElement("div", { className: "w-full flex gap-2 relative", key: r.id }, /* @__PURE__ */ e.createElement("span", { className: "absolute -left-[9px] top-3 hidden h-2 w-2 rounded-full bg-border md:block" }), /* @__PURE__ */ e.createElement(P, { className: "w-[28px] h-[28px] text-sm ring-1 ring-border/60 overflow-hidden" }, /* @__PURE__ */ e.createElement(k, { src: E }), /* @__PURE__ */ e.createElement(U, { className: "bg-[linear-gradient(to_bottom,#4967ff,#2ecaff)] text-white font-medium" }, h)), /* @__PURE__ */ e.createElement("div", { className: "flex flex-col" }, /* @__PURE__ */ e.createElement("div", { className: "prose prose-sm dark:prose-invert max-w-none" }, r.text), /* @__PURE__ */ e.createElement("div", { className: "inline-flex gap-2 text-xs text-muted-foreground" }, /* @__PURE__ */ e.createElement("div", { className: "font-medium text-foreground/90" }, r.user?.fullName || r.user?.username), /* @__PURE__ */ e.createElement("div", { className: "opacity-80" }, r.createdAt && A(Date.now(), r.createdAt, {
      addSuffix: !0
    })))));
  })) : null);
}, oe = ({
  className: t = "",
  formatDate: f,
  isMdxEditor: m = !0,
  value: o,
  onChange: n = () => {
  },
  onReply: i = () => {
  },
  theme: p = "light",
  currentUser: u,
  galleryId: g,
  allowUpVote: N = !1,
  onReact: v = () => {
  }
}) => /* @__PURE__ */ e.createElement(
  V,
  {
    components: {
      wrapper(l) {
        return /* @__PURE__ */ e.createElement(
          "div",
          {
            className: "rounded-md border border-border/60 bg-card/60 p-2",
            ...l
          }
        );
      }
    }
  },
  /* @__PURE__ */ e.createElement(
    "div",
    {
      className: `max-w-screen-md flex flex-col gap-4 w-full ${t}`
    },
    m && /* @__PURE__ */ e.createElement(
      M,
      {
        currentUser: u,
        theme: p,
        onChange: (l) => {
        }
      }
    ),
    o.map((l) => /* @__PURE__ */ e.createElement(
      H,
      {
        currentUser: u,
        onReply: (s) => {
          o && i({
            parentId: l.id,
            userId: u?.id,
            text: s,
            galleryId: g
          });
        },
        onChange: (s) => {
          o && n(
            o.map((d) => d.id === l.id ? { ...d, ...s } : d)
          );
        },
        onDelete: () => {
          n(o.filter((s) => s.id !== l.id));
        },
        comment: l,
        key: l.id,
        allowUpVote: N,
        theme: p,
        onReact: (s, d) => v(l.id, s, d)
      }
    ))
  )
);
export {
  H as CommentCard,
  oe as CommentSection
};
//# sourceMappingURL=index.es7.js.map
