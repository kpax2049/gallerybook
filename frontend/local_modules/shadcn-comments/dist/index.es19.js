import { __exports as m } from "./index.es21.js";
import ir from "react";
/**
 * @license React
 * react-jsx-runtime.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Ee;
function sr() {
  return Ee ? m : (Ee = 1, process.env.NODE_ENV !== "production" && function() {
    var ye = ir, k = Symbol.for("react.element"), Re = Symbol.for("react.portal"), T = Symbol.for("react.fragment"), U = Symbol.for("react.strict_mode"), B = Symbol.for("react.profiler"), K = Symbol.for("react.provider"), N = Symbol.for("react.context"), C = Symbol.for("react.forward_ref"), x = Symbol.for("react.suspense"), D = Symbol.for("react.suspense_list"), O = Symbol.for("react.memo"), F = Symbol.for("react.lazy"), _e = Symbol.for("react.offscreen"), G = Symbol.iterator, me = "@@iterator";
    function Te(e) {
      if (e === null || typeof e != "object")
        return null;
      var r = G && e[G] || e[me];
      return typeof r == "function" ? r : null;
    }
    var h = ye.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
    function f(e) {
      {
        for (var r = arguments.length, t = new Array(r > 1 ? r - 1 : 0), n = 1; n < r; n++)
          t[n - 1] = arguments[n];
        Ce("error", e, t);
      }
    }
    function Ce(e, r, t) {
      {
        var n = h.ReactDebugCurrentFrame, o = n.getStackAddendum();
        o !== "" && (r += "%s", t = t.concat([o]));
        var u = t.map(function(i) {
          return String(i);
        });
        u.unshift("Warning: " + r), Function.prototype.apply.call(console[e], console, u);
      }
    }
    var Oe = !1, Pe = !1, Se = !1, we = !1, je = !1, J;
    J = Symbol.for("react.module.reference");
    function ke(e) {
      return !!(typeof e == "string" || typeof e == "function" || e === T || e === B || je || e === U || e === x || e === D || we || e === _e || Oe || Pe || Se || typeof e == "object" && e !== null && (e.$$typeof === F || e.$$typeof === O || e.$$typeof === K || e.$$typeof === N || e.$$typeof === C || // This needs to include all possible module reference object
      // types supported by any Flight configuration anywhere since
      // we don't know which Flight build this will end up being used
      // with.
      e.$$typeof === J || e.getModuleId !== void 0));
    }
    function xe(e, r, t) {
      var n = e.displayName;
      if (n)
        return n;
      var o = r.displayName || r.name || "";
      return o !== "" ? t + "(" + o + ")" : t;
    }
    function q(e) {
      return e.displayName || "Context";
    }
    function p(e) {
      if (e == null)
        return null;
      if (typeof e.tag == "number" && f("Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."), typeof e == "function")
        return e.displayName || e.name || null;
      if (typeof e == "string")
        return e;
      switch (e) {
        case T:
          return "Fragment";
        case Re:
          return "Portal";
        case B:
          return "Profiler";
        case U:
          return "StrictMode";
        case x:
          return "Suspense";
        case D:
          return "SuspenseList";
      }
      if (typeof e == "object")
        switch (e.$$typeof) {
          case N:
            var r = e;
            return q(r) + ".Consumer";
          case K:
            var t = e;
            return q(t._context) + ".Provider";
          case C:
            return xe(e, e.render, "ForwardRef");
          case O:
            var n = e.displayName || null;
            return n !== null ? n : p(e.type) || "Memo";
          case F: {
            var o = e, u = o._payload, i = o._init;
            try {
              return p(i(u));
            } catch {
              return null;
            }
          }
        }
      return null;
    }
    var g = Object.assign, R = 0, z, X, H, Z, Q, ee, re;
    function te() {
    }
    te.__reactDisabledLog = !0;
    function De() {
      {
        if (R === 0) {
          z = console.log, X = console.info, H = console.warn, Z = console.error, Q = console.group, ee = console.groupCollapsed, re = console.groupEnd;
          var e = {
            configurable: !0,
            enumerable: !0,
            value: te,
            writable: !0
          };
          Object.defineProperties(console, {
            info: e,
            log: e,
            warn: e,
            error: e,
            group: e,
            groupCollapsed: e,
            groupEnd: e
          });
        }
        R++;
      }
    }
    function Fe() {
      {
        if (R--, R === 0) {
          var e = {
            configurable: !0,
            enumerable: !0,
            writable: !0
          };
          Object.defineProperties(console, {
            log: g({}, e, {
              value: z
            }),
            info: g({}, e, {
              value: X
            }),
            warn: g({}, e, {
              value: H
            }),
            error: g({}, e, {
              value: Z
            }),
            group: g({}, e, {
              value: Q
            }),
            groupCollapsed: g({}, e, {
              value: ee
            }),
            groupEnd: g({}, e, {
              value: re
            })
          });
        }
        R < 0 && f("disabledDepth fell below zero. This is a bug in React. Please file an issue.");
      }
    }
    var A = h.ReactCurrentDispatcher, I;
    function P(e, r, t) {
      {
        if (I === void 0)
          try {
            throw Error();
          } catch (o) {
            var n = o.stack.trim().match(/\n( *(at )?)/);
            I = n && n[1] || "";
          }
        return `
` + I + e;
      }
    }
    var W = !1, S;
    {
      var Ae = typeof WeakMap == "function" ? WeakMap : Map;
      S = new Ae();
    }
    function ne(e, r) {
      if (!e || W)
        return "";
      {
        var t = S.get(e);
        if (t !== void 0)
          return t;
      }
      var n;
      W = !0;
      var o = Error.prepareStackTrace;
      Error.prepareStackTrace = void 0;
      var u;
      u = A.current, A.current = null, De();
      try {
        if (r) {
          var i = function() {
            throw Error();
          };
          if (Object.defineProperty(i.prototype, "props", {
            set: function() {
              throw Error();
            }
          }), typeof Reflect == "object" && Reflect.construct) {
            try {
              Reflect.construct(i, []);
            } catch (v) {
              n = v;
            }
            Reflect.construct(e, [], i);
          } else {
            try {
              i.call();
            } catch (v) {
              n = v;
            }
            e.call(i.prototype);
          }
        } else {
          try {
            throw Error();
          } catch (v) {
            n = v;
          }
          e();
        }
      } catch (v) {
        if (v && n && typeof v.stack == "string") {
          for (var a = v.stack.split(`
`), c = n.stack.split(`
`), s = a.length - 1, l = c.length - 1; s >= 1 && l >= 0 && a[s] !== c[l]; )
            l--;
          for (; s >= 1 && l >= 0; s--, l--)
            if (a[s] !== c[l]) {
              if (s !== 1 || l !== 1)
                do
                  if (s--, l--, l < 0 || a[s] !== c[l]) {
                    var d = `
` + a[s].replace(" at new ", " at ");
                    return e.displayName && d.includes("<anonymous>") && (d = d.replace("<anonymous>", e.displayName)), typeof e == "function" && S.set(e, d), d;
                  }
                while (s >= 1 && l >= 0);
              break;
            }
        }
      } finally {
        W = !1, A.current = u, Fe(), Error.prepareStackTrace = o;
      }
      var y = e ? e.displayName || e.name : "", b = y ? P(y) : "";
      return typeof e == "function" && S.set(e, b), b;
    }
    function Ie(e, r, t) {
      return ne(e, !1);
    }
    function We(e) {
      var r = e.prototype;
      return !!(r && r.isReactComponent);
    }
    function w(e, r, t) {
      if (e == null)
        return "";
      if (typeof e == "function")
        return ne(e, We(e));
      if (typeof e == "string")
        return P(e);
      switch (e) {
        case x:
          return P("Suspense");
        case D:
          return P("SuspenseList");
      }
      if (typeof e == "object")
        switch (e.$$typeof) {
          case C:
            return Ie(e.render);
          case O:
            return w(e.type, r, t);
          case F: {
            var n = e, o = n._payload, u = n._init;
            try {
              return w(u(o), r, t);
            } catch {
            }
          }
        }
      return "";
    }
    var _ = Object.prototype.hasOwnProperty, ae = {}, ie = h.ReactDebugCurrentFrame;
    function j(e) {
      if (e) {
        var r = e._owner, t = w(e.type, e._source, r ? r.type : null);
        ie.setExtraStackFrame(t);
      } else
        ie.setExtraStackFrame(null);
    }
    function Ye(e, r, t, n, o) {
      {
        var u = Function.call.bind(_);
        for (var i in e)
          if (u(e, i)) {
            var a = void 0;
            try {
              if (typeof e[i] != "function") {
                var c = Error((n || "React class") + ": " + t + " type `" + i + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + typeof e[i] + "`.This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`.");
                throw c.name = "Invariant Violation", c;
              }
              a = e[i](r, i, n, t, null, "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED");
            } catch (s) {
              a = s;
            }
            a && !(a instanceof Error) && (j(o), f("%s: type specification of %s `%s` is invalid; the type checker function must return `null` or an `Error` but returned a %s. You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument).", n || "React class", t, i, typeof a), j(null)), a instanceof Error && !(a.message in ae) && (ae[a.message] = !0, j(o), f("Failed %s type: %s", t, a.message), j(null));
          }
      }
    }
    var $e = Array.isArray;
    function Y(e) {
      return $e(e);
    }
    function Me(e) {
      {
        var r = typeof Symbol == "function" && Symbol.toStringTag, t = r && e[Symbol.toStringTag] || e.constructor.name || "Object";
        return t;
      }
    }
    function Ve(e) {
      try {
        return oe(e), !1;
      } catch {
        return !0;
      }
    }
    function oe(e) {
      return "" + e;
    }
    function ue(e) {
      if (Ve(e))
        return f("The provided key is an unsupported type %s. This value must be coerced to a string before before using it here.", Me(e)), oe(e);
    }
    var se = h.ReactCurrentOwner, Le = {
      key: !0,
      ref: !0,
      __self: !0,
      __source: !0
    }, le, fe;
    function Ue(e) {
      if (_.call(e, "ref")) {
        var r = Object.getOwnPropertyDescriptor(e, "ref").get;
        if (r && r.isReactWarning)
          return !1;
      }
      return e.ref !== void 0;
    }
    function Be(e) {
      if (_.call(e, "key")) {
        var r = Object.getOwnPropertyDescriptor(e, "key").get;
        if (r && r.isReactWarning)
          return !1;
      }
      return e.key !== void 0;
    }
    function Ke(e, r) {
      typeof e.ref == "string" && se.current;
    }
    function Ne(e, r) {
      {
        var t = function() {
          le || (le = !0, f("%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://reactjs.org/link/special-props)", r));
        };
        t.isReactWarning = !0, Object.defineProperty(e, "key", {
          get: t,
          configurable: !0
        });
      }
    }
    function Ge(e, r) {
      {
        var t = function() {
          fe || (fe = !0, f("%s: `ref` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://reactjs.org/link/special-props)", r));
        };
        t.isReactWarning = !0, Object.defineProperty(e, "ref", {
          get: t,
          configurable: !0
        });
      }
    }
    var Je = function(e, r, t, n, o, u, i) {
      var a = {
        // This tag allows us to uniquely identify this as a React Element
        $$typeof: k,
        // Built-in properties that belong on the element
        type: e,
        key: r,
        ref: t,
        props: i,
        // Record the component responsible for creating this element.
        _owner: u
      };
      return a._store = {}, Object.defineProperty(a._store, "validated", {
        configurable: !1,
        enumerable: !1,
        writable: !0,
        value: !1
      }), Object.defineProperty(a, "_self", {
        configurable: !1,
        enumerable: !1,
        writable: !1,
        value: n
      }), Object.defineProperty(a, "_source", {
        configurable: !1,
        enumerable: !1,
        writable: !1,
        value: o
      }), Object.freeze && (Object.freeze(a.props), Object.freeze(a)), a;
    };
    function qe(e, r, t, n, o) {
      {
        var u, i = {}, a = null, c = null;
        t !== void 0 && (ue(t), a = "" + t), Be(r) && (ue(r.key), a = "" + r.key), Ue(r) && (c = r.ref, Ke(r, o));
        for (u in r)
          _.call(r, u) && !Le.hasOwnProperty(u) && (i[u] = r[u]);
        if (e && e.defaultProps) {
          var s = e.defaultProps;
          for (u in s)
            i[u] === void 0 && (i[u] = s[u]);
        }
        if (a || c) {
          var l = typeof e == "function" ? e.displayName || e.name || "Unknown" : e;
          a && Ne(i, l), c && Ge(i, l);
        }
        return Je(e, a, c, o, n, se.current, i);
      }
    }
    var $ = h.ReactCurrentOwner, ce = h.ReactDebugCurrentFrame;
    function E(e) {
      if (e) {
        var r = e._owner, t = w(e.type, e._source, r ? r.type : null);
        ce.setExtraStackFrame(t);
      } else
        ce.setExtraStackFrame(null);
    }
    var M;
    M = !1;
    function V(e) {
      return typeof e == "object" && e !== null && e.$$typeof === k;
    }
    function ve() {
      {
        if ($.current) {
          var e = p($.current.type);
          if (e)
            return `

Check the render method of \`` + e + "`.";
        }
        return "";
      }
    }
    function ze(e) {
      return "";
    }
    var de = {};
    function Xe(e) {
      {
        var r = ve();
        if (!r) {
          var t = typeof e == "string" ? e : e.displayName || e.name;
          t && (r = `

Check the top-level render call using <` + t + ">.");
        }
        return r;
      }
    }
    function pe(e, r) {
      {
        if (!e._store || e._store.validated || e.key != null)
          return;
        e._store.validated = !0;
        var t = Xe(r);
        if (de[t])
          return;
        de[t] = !0;
        var n = "";
        e && e._owner && e._owner !== $.current && (n = " It was passed a child from " + p(e._owner.type) + "."), E(e), f('Each child in a list should have a unique "key" prop.%s%s See https://reactjs.org/link/warning-keys for more information.', t, n), E(null);
      }
    }
    function ge(e, r) {
      {
        if (typeof e != "object")
          return;
        if (Y(e))
          for (var t = 0; t < e.length; t++) {
            var n = e[t];
            V(n) && pe(n, r);
          }
        else if (V(e))
          e._store && (e._store.validated = !0);
        else if (e) {
          var o = Te(e);
          if (typeof o == "function" && o !== e.entries)
            for (var u = o.call(e), i; !(i = u.next()).done; )
              V(i.value) && pe(i.value, r);
        }
      }
    }
    function He(e) {
      {
        var r = e.type;
        if (r == null || typeof r == "string")
          return;
        var t;
        if (typeof r == "function")
          t = r.propTypes;
        else if (typeof r == "object" && (r.$$typeof === C || // Note: Memo only checks outer props here.
        // Inner props are checked in the reconciler.
        r.$$typeof === O))
          t = r.propTypes;
        else
          return;
        if (t) {
          var n = p(r);
          Ye(t, e.props, "prop", n, e);
        } else if (r.PropTypes !== void 0 && !M) {
          M = !0;
          var o = p(r);
          f("Component %s declared `PropTypes` instead of `propTypes`. Did you misspell the property assignment?", o || "Unknown");
        }
        typeof r.getDefaultProps == "function" && !r.getDefaultProps.isReactClassApproved && f("getDefaultProps is only used on classic React.createClass definitions. Use a static property named `defaultProps` instead.");
      }
    }
    function Ze(e) {
      {
        for (var r = Object.keys(e.props), t = 0; t < r.length; t++) {
          var n = r[t];
          if (n !== "children" && n !== "key") {
            E(e), f("Invalid prop `%s` supplied to `React.Fragment`. React.Fragment can only have `key` and `children` props.", n), E(null);
            break;
          }
        }
        e.ref !== null && (E(e), f("Invalid attribute `ref` supplied to `React.Fragment`."), E(null));
      }
    }
    var be = {};
    function he(e, r, t, n, o, u) {
      {
        var i = ke(e);
        if (!i) {
          var a = "";
          (e === void 0 || typeof e == "object" && e !== null && Object.keys(e).length === 0) && (a += " You likely forgot to export your component from the file it's defined in, or you might have mixed up default and named imports.");
          var c = ze();
          c ? a += c : a += ve();
          var s;
          e === null ? s = "null" : Y(e) ? s = "array" : e !== void 0 && e.$$typeof === k ? (s = "<" + (p(e.type) || "Unknown") + " />", a = " Did you accidentally export a JSX literal instead of a component?") : s = typeof e, f("React.jsx: type is invalid -- expected a string (for built-in components) or a class/function (for composite components) but got: %s.%s", s, a);
        }
        var l = qe(e, r, t, o, u);
        if (l == null)
          return l;
        if (i) {
          var d = r.children;
          if (d !== void 0)
            if (n)
              if (Y(d)) {
                for (var y = 0; y < d.length; y++)
                  ge(d[y], e);
                Object.freeze && Object.freeze(d);
              } else
                f("React.jsx: Static children should always be an array. You are likely explicitly calling React.jsxs or React.jsxDEV. Use the Babel transform instead.");
            else
              ge(d, e);
        }
        if (_.call(r, "key")) {
          var b = p(e), v = Object.keys(r).filter(function(ar) {
            return ar !== "key";
          }), L = v.length > 0 ? "{key: someKey, " + v.join(": ..., ") + ": ...}" : "{key: someKey}";
          if (!be[b + L]) {
            var nr = v.length > 0 ? "{" + v.join(": ..., ") + ": ...}" : "{}";
            f(`A props object containing a "key" prop is being spread into JSX:
  let props = %s;
  <%s {...props} />
React keys must be passed directly to JSX without using spread:
  let props = %s;
  <%s key={someKey} {...props} />`, L, b, nr, b), be[b + L] = !0;
          }
        }
        return e === T ? Ze(l) : He(l), l;
      }
    }
    function Qe(e, r, t) {
      return he(e, r, t, !0);
    }
    function er(e, r, t) {
      return he(e, r, t, !1);
    }
    var rr = er, tr = Qe;
    m.Fragment = T, m.jsx = rr, m.jsxs = tr;
  }(), m);
}
export {
  sr as __require
};
//# sourceMappingURL=index.es19.js.map
