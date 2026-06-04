import { __exports as t } from "./index.es20.js";
import R from "react";
/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var p;
function v() {
  if (p) return t;
  p = 1;
  var s = R, m = Symbol.for("react.element"), l = Symbol.for("react.fragment"), c = Object.prototype.hasOwnProperty, a = s.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner, d = { key: !0, ref: !0, __self: !0, __source: !0 };
  function u(o, r, i) {
    var e, n = {}, _ = null, f = null;
    i !== void 0 && (_ = "" + i), r.key !== void 0 && (_ = "" + r.key), r.ref !== void 0 && (f = r.ref);
    for (e in r) c.call(r, e) && !d.hasOwnProperty(e) && (n[e] = r[e]);
    if (o && o.defaultProps) for (e in r = o.defaultProps, r) n[e] === void 0 && (n[e] = r[e]);
    return { $$typeof: m, type: o, key: _, ref: f, props: n, _owner: a.current };
  }
  return t.Fragment = l, t.jsx = u, t.jsxs = u, t;
}
export {
  v as __require
};
//# sourceMappingURL=index.es18.js.map
