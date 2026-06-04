import r, { useState as m, useEffect as a } from "react";
import { j as t } from "./index.es16.js";
import { evaluate as l } from "@mdx-js/mdx";
const u = { jsx: t.jsx, jsxs: t.jsxs, Fragment: t.Fragment }, j = ({ source: e = "hêlo" }) => {
  const [n, s] = m(() => () => null);
  return a(() => {
    l(e, u).then((o) => {
      s(() => o.default);
    });
  }, [e]), /* @__PURE__ */ r.createElement(n, null);
};
export {
  j as default
};
//# sourceMappingURL=index.es11.js.map
