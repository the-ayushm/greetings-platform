(() => {
  "use strict";
  (globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([
    "object" == typeof document ? document.currentScript : void 0,
    88653,
    (e) => {
      var t = e.i(43476),
        r = e.i(71645),
        n = e.i(31178),
        o = e.i(47414),
        i = e.i(74008),
        a = e.i(21476),
        l = e.i(72846),
        s = r,
        u = e.i(37806);
      function c(e, t) {
        if ("function" == typeof e) return e(t);
        null != e && (e.current = t);
      }
      class f extends s.Component {
        getSnapshotBeforeUpdate(e) {
          let t = this.props.childRef.current;
          if (
            (0, l.f)(t) &&
            e.isPresent &&
            !this.props.isPresent &&
            !1 !== this.props.pop
          ) {
            let e = t.offsetParent,
              r = ((0, l.f)(e) && e.offsetWidth) || 0,
              n = ((0, l.f)(e) && e.offsetHeight) || 0,
              o = getComputedStyle(t),
              i = this.props.sizeRef.current;
            (i.height = parseFloat(o.height)),
              (i.width = parseFloat(o.width)),
              (i.top = t.offsetTop),
              (i.left = t.offsetLeft),
              (i.right = r - i.width - i.left),
              (i.bottom = n - i.height - i.top),
              (i.direction = o.direction);
          }
          return null;
        }
        componentDidUpdate() {}
        render() {
          return this.props.children;
        }
      }
      function d({
        children: e,
        isPresent: n,
        anchorX: o,
        anchorY: i,
        root: a,
        pop: l,
      }) {
        let p = (0, s.useId)(),
          h = (0, s.useRef)(null),
          g = (0, s.useRef)({
            width: 0,
            height: 0,
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            direction: "ltr",
          }),
          { nonce: m } = (0, s.useContext)(u.f),
          y = (function (...e) {
            return r.useCallback(
              (function (...e) {
                return (t) => {
                  let r = !1,
                    n = e.map((e) => {
                      let n = c(e, t);
                      return r || "function" != typeof n || (r = !0), n;
                    });
                  if (r)
                    return () => {
                      for (let t = 0; t < n.length; t++) {
                        let r = n[t];
                        "function" == typeof r ? r() : c(e[t], null);
                      }
                    };
                };
              })(...e),
              e,
            );
          })(h, !1 !== l ? (e.props?.ref ?? e?.ref) : void 0);
        return (
          (0, s.useInsertionEffect)(() => {
            let {
              width: e,
              height: t,
              top: r,
              left: s,
              right: u,
              bottom: c,
              direction: f,
            } = g.current;
            if (n || !1 === l || !h.current || !e || !t) return;
            let d = "rtl" === f,
              y =
                "left" === o
                  ? d
                    ? `right: ${u}`
                    : `left: ${s}`
                  : d
                    ? `left: ${s}`
                    : `right: ${u}`,
              v = "bottom" === i ? `bottom: ${c}` : `top: ${r}`,
              b = h.current;
            b.dataset.motionPopId = p;
            let w = b.ownerDocument,
              P = w.createElement("style");
            m && (P.nonce = m);
            let _ = a ?? w.head;
            return (
              _.appendChild(P),
              P.sheet &&
                P.sheet.insertRule(`
          [data-motion-pop-id="${p}"] {
            position: absolute !important;
            width: ${e}px !important;
            height: ${t}px !important;
            ${y}px !important;
            ${v}px !important;
          }
        `),
              () => {
                h.current?.removeAttribute("data-motion-pop-id"),
                  _.contains(P) && _.removeChild(P);
              }
            );
          }, [n]),
          (0, t.jsx)(f, {
            isPresent: n,
            childRef: h,
            sizeRef: g,
            pop: l,
            children: !1 === l ? e : s.cloneElement(e, { ref: y }),
          })
        );
      }
      let p = ({
        children: e,
        initial: n,
        isPresent: l,
        onExitComplete: s,
        custom: u,
        presenceAffectsLayout: c,
        mode: f,
        anchorX: p,
        anchorY: g,
        root: m,
      }) => {
        let y = (0, o.f)(h),
          v = (0, r.useId)(),
          b = (0, r.useRef)(l),
          w = (0, r.useRef)(s);
        (0, i.f)(() => {
          (b.current = l), (w.current = s);
        });
        let P = !0,
          _ = (0, r.useMemo)(
            () => (
              (P = !1),
              {
                id: v,
                initial: n,
                isPresent: l,
                custom: u,
                onExitComplete: (e) => {
                  for (let t of (y.set(e, !0), y.values())) if (!t) return;
                  s && s();
                },
                register: (e) => (
                  y.set(e, !1),
                  () => {
                    y.delete(e), b.current || y.size || w.current?.();
                  }
                ),
              }
            ),
            [l, y, s],
          );
        return (
          c && P && (_ = { ..._ }),
          (0, r.useMemo)(() => {
            y.forEach((e, t) => y.set(t, !1));
          }, [l]),
          r.useEffect(() => {
            l || y.size || !s || s();
          }, [l]),
          (e = (0, t.jsx)(d, {
            pop: "popLayout" === f,
            isPresent: l,
            anchorX: p,
            anchorY: g,
            root: m,
            children: e,
          })),
          (0, t.jsx)(a.f.Provider, { value: _, children: e })
        );
      };
      function h() {
        return new Map();
      }
      var g = e.i(64978);
      let m = (e) => e.key || "";
      function y(e) {
        let t = [];
        return (
          r.Children.forEach(e, (e) => {
            (0, r.isValidElement)(e) && t.push(e);
          }),
          t
        );
      }
      e.s(
        [
          "f",
          0,
          ({
            children: e,
            custom: a,
            initial: l = !0,
            onExitComplete: s,
            presenceAffectsLayout: u = !0,
            mode: c = "sync",
            propagate: f = !1,
            anchorX: d = "left",
            anchorY: h = "top",
            root: v,
          }) => {
            let [b, w] = (0, g.f)(f),
              P = (0, r.useMemo)(() => y(e), [e]),
              _ = f && !b ? [] : P.map(m),
              x = (0, r.useRef)(!0),
              S = (0, o.f)(() => new Map()),
              C = (0, r.useRef)(new Set()),
              [j, E] = (0, r.useState)(P),
              [O, R] = (0, r.useState)(P);
            (0, i.f)(() => {
              !f || b || O.length || w?.();
            }, [b, f, O.length, w]),
              (0, i.f)(() => {
                x.current = !1;
                for (let e = 0; e < O.length; e++) {
                  let t = m(O[e]);
                  _.includes(t)
                    ? (S.delete(t), C.current.delete(t))
                    : !0 !== S.get(t) && S.set(t, !1);
                }
              }, [O, _.length, _.join("-")]);
            let $ = [];
            if (P !== j) {
              let e = [...P],
                t = 0;
              for (let r of O) {
                let n = _.indexOf(m(r));
                -1 === n
                  ? (e.splice(t++, 0, r), $.push(r))
                  : (t = n + $.length + 1);
              }
              return (
                $.every((e) => S.get(m(e))) ? (e = P) : "wait" === c && (e = $),
                R(y(e)),
                E(P),
                null
              );
            }
            let { forceRender: I } = (0, r.useContext)(n.f);
            return (0, t.jsx)(t.Fragment, {
              children: O.map((e) => {
                let r = m(e),
                  n = (!f || !!b) && (P === O || _.includes(r));
                return (0, t.jsx)(
                  p,
                  {
                    isPresent: n,
                    initial: (!x.current || !!l) && void 0,
                    custom: a,
                    presenceAffectsLayout: u,
                    mode: c,
                    root: v,
                    onExitComplete: n
                      ? void 0
                      : () => {
                          if (C.current.has(r) || !S.has(r)) return;
                          C.current.add(r), S.set(r, !0);
                          let e = !0;
                          S.forEach((t) => {
                            t || (e = !1);
                          }),
                            e && (I?.(), E([]), f && w?.(), s && s());
                        },
                    anchorX: d,
                    anchorY: h,
                    children: e,
                  },
                  r,
                );
              }),
            });
          },
        ],
        88653,
      );
    },
    22016,
    (e, t, r) => {
      e.i(47167), Object.defineProperty(r, "__esModule", { value: !0 });
      var n = {
        default: function () {
          return y;
        },
        useLinkStatus: function () {
          return b;
        },
      };
      for (var o in n)
        Object.defineProperty(r, o, { enumerable: !0, get: n[o] });
      let i = e.r(90809),
        a = e.r(43476),
        l = i._(e.r(71645)),
        s = e.r(95057),
        u = e.r(8372),
        c = e.r(18581),
        f = e.r(18967),
        d = e.r(5550),
        p = e.r(88540),
        h = e.r(91949),
        g = e.r(73668),
        m = e.r(9396);
      function y(t) {
        var r;
        let n,
          o,
          i,
          [y, b] = (0, l.useOptimistic)(h.IDLE_LINK_STATUS),
          w = (0, l.useRef)(null),
          {
            href: P,
            as: _,
            children: x,
            prefetch: S = null,
            passHref: C,
            replace: j,
            shallow: E,
            scroll: O,
            onClick: R,
            onMouseEnter: $,
            onTouchStart: I,
            legacyBehavior: M = !1,
            onNavigate: z,
            transitionTypes: A,
            ref: T,
            unstable_dynamicOnHover: L,
            ...k
          } = t;
        (n = x),
          M &&
            ("string" == typeof n || "number" == typeof n) &&
            (n = (0, a.jsx)("a", { children: n }));
        let U = l.default.useContext(u.AppRouterContext),
          D = !1 !== S,
          F = !1 === S ? "none" : !0 === S ? "full" : "auto",
          N =
            "none" !== F && "full" === F
              ? m.FetchStrategy.Full
              : m.FetchStrategy.PPR,
          B = "string" == typeof (r = _ || P) ? r : (0, s.formatUrl)(r);
        if (M) {
          if (n?.$$typeof === Symbol.for("react.lazy"))
            throw Error(
              "`<Link legacyBehavior>` received a direct child that is either a Server Component, or JSX that was loaded with React.lazy(). This is not supported. Either remove legacyBehavior, or make the direct child a Client Component that renders the Link's `<a>` tag.",
            );
          o = l.default.Children.only(n);
        }
        let W = M ? o && "object" == typeof o && o.ref : T,
          q,
          G = l.default.useCallback(
            (e) => (
              null !== U &&
                (w.current = (0, h.mountLinkInstance)(e, B, U, N, D, b, q)),
              () => {
                w.current &&
                  ((0, h.unmountLinkForCurrentNavigation)(w.current),
                  (w.current = null)),
                  (0, h.unmountPrefetchableInstance)(e);
              }
            ),
            [D, B, U, N, b, q],
          ),
          K = {
            ref: (0, c.useMergedRef)(G, W),
            onClick(t) {
              M || "function" != typeof R || R(t),
                M &&
                  o.props &&
                  "function" == typeof o.props.onClick &&
                  o.props.onClick(t),
                !U ||
                  t.defaultPrevented ||
                  (function (t, r, n, o, i, a, l, s = "none") {
                    if ("u" > typeof window) {
                      let u,
                        { nodeName: c } = t.currentTarget;
                      if (
                        ("A" === c.toUpperCase() &&
                          (((u = t.currentTarget.getAttribute("target")) &&
                            "_self" !== u) ||
                            t.metaKey ||
                            t.ctrlKey ||
                            t.shiftKey ||
                            t.altKey ||
                            (t.nativeEvent && 2 === t.nativeEvent.which))) ||
                        t.currentTarget.hasAttribute("download")
                      )
                        return;
                      if (!(0, g.isLocalURL)(r)) {
                        o && (t.preventDefault(), location.replace(r));
                        return;
                      }
                      if ((t.preventDefault(), a)) {
                        let e = !1;
                        if (
                          (a({
                            preventDefault: () => {
                              e = !0;
                            },
                          }),
                          e)
                        )
                          return;
                      }
                      let { navigate: f } = e.r(32916);
                      f(
                        r,
                        o ? "replace" : "push",
                        !1 === i
                          ? p.ScrollBehavior.NoScroll
                          : p.ScrollBehavior.Default,
                        n.current,
                        l,
                        s,
                      );
                    }
                  })(t, B, w, j, O, z, A, F);
            },
            onMouseEnter(e) {
              M || "function" != typeof $ || $(e),
                M &&
                  o.props &&
                  "function" == typeof o.props.onMouseEnter &&
                  o.props.onMouseEnter(e),
                U && D && (0, h.onNavigationIntent)(e.currentTarget, !0 === L);
            },
            onTouchStart: function (e) {
              M || "function" != typeof I || I(e),
                M &&
                  o.props &&
                  "function" == typeof o.props.onTouchStart &&
                  o.props.onTouchStart(e),
                U && D && (0, h.onNavigationIntent)(e.currentTarget, !0 === L);
            },
          };
        return (
          (0, f.isAbsoluteUrl)(B)
            ? (K.href = B)
            : (M && !C && ("a" !== o.type || "href" in o.props)) ||
              (K.href = (0, d.addBasePath)(B)),
          (i = M
            ? l.default.cloneElement(o, K)
            : (0, a.jsx)("a", { ...k, ...K, children: n })),
          (0, a.jsx)(v.Provider, { value: y, children: i })
        );
      }
      let v = (0, l.createContext)(h.IDLE_LINK_STATUS),
        b = () => (0, l.useContext)(v);
      ("function" == typeof r.default ||
        ("object" == typeof r.default && null !== r.default)) &&
        void 0 === r.default.__esModule &&
        (Object.defineProperty(r.default, "__esModule", { value: !0 }),
        Object.assign(r.default, r),
        (t.exports = r.default));
    },
    85437,
    (e, t, r) => {
      e.i(47167),
        Object.defineProperty(r, "__esModule", { value: !0 }),
        Object.defineProperty(r, "Image", {
          enumerable: !0,
          get: function () {
            return b;
          },
        });
      let n = e.r(55682),
        o = e.r(90809),
        i = e.r(43476),
        a = o._(e.r(71645)),
        l = n._(e.r(74080)),
        s = n._(e.r(25633)),
        u = e.r(8927),
        c = e.r(65856),
        f = e.r(49381),
        d = n._(e.r(1948)),
        p = e.r(18581);
      function h(e, t, r, n, o, i, a) {
        let l = e?.src;
        e &&
          e["data-loaded-src"] !== l &&
          ((e["data-loaded-src"] = l),
          ("decode" in e ? e.decode() : Promise.resolve())
            .catch(() => {})
            .then(() => {
              if (e.parentElement && e.isConnected) {
                if (("empty" !== t && o(!0), r?.current)) {
                  let t = new Event("load");
                  Object.defineProperty(t, "target", {
                    writable: !1,
                    value: e,
                  });
                  let n = !1,
                    o = !1;
                  r.current({
                    ...t,
                    nativeEvent: t,
                    currentTarget: e,
                    target: e,
                    isDefaultPrevented: () => n,
                    isPropagationStopped: () => o,
                    persist: () => {},
                    preventDefault: () => {
                      (n = !0), t.preventDefault();
                    },
                    stopPropagation: () => {
                      (o = !0), t.stopPropagation();
                    },
                  });
                }
                n?.current && n.current(e);
              }
            }));
      }
      function g(e) {
        return a.use ? { fetchPriority: e } : { fetchpriority: e };
      }
      "u" < typeof window && (globalThis.__NEXT_IMAGE_IMPORTED = !0);
      let m = "u" < typeof window ? a.useEffect : a.useLayoutEffect,
        y = (0, a.forwardRef)(
          (
            {
              src: e,
              srcSet: t,
              sizes: r,
              height: n,
              width: o,
              decoding: l,
              className: s,
              style: u,
              fetchPriority: c,
              placeholder: f,
              loading: d,
              unoptimized: y,
              fill: v,
              onLoadRef: b,
              onLoadingCompleteRef: w,
              setBlurComplete: P,
              setShowAltText: _,
              sizesInput: x,
              onLoad: S,
              onError: C,
              ...j
            },
            E,
          ) => {
            let O = (0, a.useRef)(!1),
              R = (0, a.useRef)(null);
            m(() => {
              let { current: e } = O,
                { current: t } = R;
              e ||
                null === t ||
                (C && (t.src = t.src),
                t.complete && h(t, f, b, w, P, y, x),
                (O.current = !0));
            }, [e, f, b, w, C, y, x]);
            let $ = (0, p.useMergedRef)(E, R);
            return (0, i.jsx)("img", {
              ...j,
              ...g(c),
              loading: d,
              width: o,
              height: n,
              decoding: l,
              "data-nimg": v ? "fill" : "1",
              className: s,
              style: u,
              sizes: r,
              srcSet: t,
              src: e,
              ref: $,
              onLoad: (e) => {
                h(e.currentTarget, f, b, w, P, y, x);
              },
              onError: (e) => {
                _(!0), "empty" !== f && P(!0), C && C(e);
              },
            });
          },
        );
      function v({ isAppRouter: e, imgAttributes: t }) {
        let r = {
          as: "image",
          imageSrcSet: t.srcSet,
          imageSizes: t.sizes,
          crossOrigin: t.crossOrigin,
          referrerPolicy: t.referrerPolicy,
          ...g(t.fetchPriority),
        };
        return e && l.default.preload
          ? (l.default.preload(t.src, r), null)
          : (0, i.jsx)(s.default, {
              children: (0, i.jsx)(
                "link",
                { rel: "preload", href: t.srcSet ? void 0 : t.src, ...r },
                "__nimg-" + t.src + t.srcSet + t.sizes,
              ),
            });
      }
      let b = (0, a.forwardRef)((e, t) => {
        let r = (0, a.useContext)(c.RouterContext),
          n = (0, f.useImageConfig)(),
          { onLoad: o, onLoadingComplete: l } = e,
          s = (0, a.useRef)(o);
        (0, a.useEffect)(() => {
          s.current = o;
        }, [o]);
        let p = (0, a.useRef)(l);
        (0, a.useEffect)(() => {
          p.current = l;
        }, [l]);
        let [h, g] = (0, a.useState)(!1),
          [m, b] = (0, a.useState)(!1),
          { props: w, meta: P } = (0, u.getImgProps)(e, {
            defaultLoader: d.default,
            imgConf: n,
            blurComplete: h,
            showAltText: m,
          });
        return (0, i.jsxs)(i.Fragment, {
          children: [
            (0, i.jsx)(y, {
              ...w,
              unoptimized: P.unoptimized,
              placeholder: P.placeholder,
              fill: P.fill,
              onLoadRef: s,
              onLoadingCompleteRef: p,
              setBlurComplete: g,
              setShowAltText: b,
              sizesInput: e.sizes,
              ref: t,
            }),
            P.preload
              ? (0, i.jsx)(v, { isAppRouter: !r, imgAttributes: w })
              : null,
          ],
        });
      });
      ("function" == typeof r.default ||
        ("object" == typeof r.default && null !== r.default)) &&
        void 0 === r.default.__esModule &&
        (Object.defineProperty(r.default, "__esModule", { value: !0 }),
        Object.assign(r.default, r),
        (t.exports = r.default));
    },
    98194,
    (e) => {
      var t = e.i(85437);
      e.s(["default", () => t.Image]);
    },
    49381,
    (e, t, r) => {
      e.i(47167),
        Object.defineProperty(r, "__esModule", { value: !0 }),
        Object.defineProperty(r, "useImageConfig", {
          enumerable: !0,
          get: function () {
            return l;
          },
        });
      let n = e.r(71645),
        o = e.r(87690),
        i = e.r(18556),
        a = {
          deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
          imageSizes: [32, 48, 64, 96, 128, 256, 384],
          qualities: [75],
          path: "/_next/image",
          loader: "default",
          dangerouslyAllowSVG: !1,
          unoptimized: !1,
        };
      function l() {
        let e = (0, n.useContext)(i.ImageConfigContext);
        return (0, o.prepareImageConfig)(a, e);
      }
      ("function" == typeof r.default ||
        ("object" == typeof r.default && null !== r.default)) &&
        void 0 === r.default.__esModule &&
        (Object.defineProperty(r.default, "__esModule", { value: !0 }),
        Object.assign(r.default, r),
        (t.exports = r.default));
    },
    70965,
    (e, t, r) => {
      function n(e, t) {
        let r = e || 75;
        return t?.qualities?.length
          ? t.qualities.reduce(
              (e, t) => (Math.abs(t - r) < Math.abs(e - r) ? t : e),
              t.qualities[0],
            )
          : r;
      }
      Object.defineProperty(r, "__esModule", { value: !0 }),
        Object.defineProperty(r, "findClosestQuality", {
          enumerable: !0,
          get: function () {
            return n;
          },
        });
    },
    8927,
    (e, t, r) => {
      e.i(47167),
        Object.defineProperty(r, "__esModule", { value: !0 }),
        Object.defineProperty(r, "getImgProps", {
          enumerable: !0,
          get: function () {
            return s;
          },
        });
      let n = e.r(43369),
        o = e.r(67423),
        i = ["-moz-initial", "fill", "none", "scale-down", void 0];
      function a(e) {
        return void 0 !== e.default;
      }
      function l(e) {
        return void 0 === e
          ? e
          : "number" == typeof e
            ? Number.isFinite(e)
              ? e
              : 0 / 0
            : "string" == typeof e && /^[0-9]+$/.test(e)
              ? parseInt(e, 10)
              : 0 / 0;
      }
      function s(
        {
          src: e,
          sizes: t,
          unoptimized: r = !1,
          priority: u = !1,
          preload: c = !1,
          loading: f,
          className: d,
          quality: p,
          width: h,
          height: g,
          fill: m = !1,
          style: y,
          overrideSrc: v,
          onLoad: b,
          onLoadingComplete: w,
          placeholder: P = "empty",
          blurDataURL: _,
          fetchPriority: x,
          decoding: S = "async",
          layout: C,
          objectFit: j,
          objectPosition: E,
          lazyBoundary: O,
          lazyRoot: R,
          ...$
        },
        I,
      ) {
        var M;
        let z,
          A,
          { imgConf: T, showAltText: L, blurComplete: k, defaultLoader: U } = I;
        if (void 0 === U)
          throw Error(
            "images.loaderFile detected but the file is missing default export.\nRead more: https://nextjs.org/docs/messages/invalid-images-config",
          );
        let D = $.loader || U;
        delete $.loader, delete $.srcSet;
        let F = "__next_img_default" in D;
        if (F) {
          if ("custom" === T.loader)
            throw Error(`Image with src "${e}" is missing "loader" prop.
Read more: https://nextjs.org/docs/messages/next-image-missing-loader`);
        } else {
          let e = D;
          D = (t) => {
            let { config: r, ...n } = t;
            return e(n);
          };
        }
        if (C) {
          "fill" === C && (m = !0);
          let e = {
            intrinsic: { maxWidth: "100%", height: "auto" },
            responsive: { width: "100%", height: "auto" },
          }[C];
          e && (y = { ...y, ...e });
          let r = { responsive: "100vw", fill: "100vw" }[C];
          r && !t && (t = r);
        }
        let N = "",
          B = l(h),
          W = l(g);
        if ((M = e) && "object" == typeof M && (a(M) || void 0 !== M.src)) {
          let t = a(e) ? e.default : e;
          if (!t.src)
            throw Error(
              `An object should only be passed to the image component src parameter if it comes from a static image import. It must include src. Received ${JSON.stringify(t)}`,
            );
          if (!t.height || !t.width)
            throw Error(
              `An object should only be passed to the image component src parameter if it comes from a static image import. It must include height and width. Received ${JSON.stringify(t)}`,
            );
          if (
            ((z = t.blurWidth),
            (A = t.blurHeight),
            (_ = _ || t.blurDataURL),
            (N = t.src),
            !m)
          )
            if (B || W) {
              if (B && !W) {
                let e = B / t.width;
                W = Math.round(t.height * e);
              } else if (!B && W) {
                let e = W / t.height;
                B = Math.round(t.width * e);
              }
            } else (B = t.width), (W = t.height);
        }
        let q = !u && !c && ("lazy" === f || void 0 === f);
        (!(e = "string" == typeof e ? e : N) ||
          e.startsWith("data:") ||
          e.startsWith("blob:")) &&
          ((r = !0), (q = !1)),
          T.unoptimized && (r = !0),
          F &&
            !T.dangerouslyAllowSVG &&
            e.split("?", 1)[0].endsWith(".svg") &&
            (r = !0);
        let G = l(p),
          K = Object.assign(
            m
              ? {
                  position: "absolute",
                  height: "100%",
                  width: "100%",
                  left: 0,
                  top: 0,
                  right: 0,
                  bottom: 0,
                  objectFit: j,
                  objectPosition: E,
                }
              : {},
            L ? {} : { color: "transparent" },
            y,
          ),
          V =
            k || "empty" === P
              ? null
              : "blur" === P
                ? `url("data:image/svg+xml;charset=utf-8,${(0, o.getImageBlurSvg)({ widthInt: B, heightInt: W, blurWidth: z, blurHeight: A, blurDataURL: _ || "", objectFit: K.objectFit })}")`
                : `url("${P}")`,
          H = i.includes(K.objectFit)
            ? "fill" === K.objectFit
              ? "100% 100%"
              : "cover"
            : K.objectFit,
          J = V
            ? {
                backgroundSize: H,
                backgroundPosition: K.objectPosition || "50% 50%",
                backgroundRepeat: "no-repeat",
                backgroundImage: V,
              }
            : {},
          X = (function ({
            config: e,
            src: t,
            unoptimized: r,
            width: o,
            quality: i,
            sizes: a,
            loader: l,
          }) {
            if (r) {
              if (t.startsWith("/") && !t.startsWith("//")) {
                let e = (0, n.getDeploymentId)();
                if (
                  t.includes("/_next/static/immutable") &&
                  !(0, n.getAssetToken)()
                )
                  e = void 0;
                else if (e) {
                  let r = t.indexOf("?");
                  if (-1 !== r) {
                    let n = new URLSearchParams(t.slice(r + 1));
                    n.get("dpl") ||
                      (n.append("dpl", e),
                      (t = t.slice(0, r) + "?" + n.toString()));
                  } else t += `?dpl=${e}`;
                }
              }
              return { src: t, srcSet: void 0, sizes: void 0 };
            }
            let { widths: s, kind: u } = (function (
                { deviceSizes: e, allSizes: t },
                r,
                n,
              ) {
                if (n) {
                  let r = /(^|\s)(1?\d?\d)vw/g,
                    o = [];
                  for (let e; (e = r.exec(n)); ) o.push(parseInt(e[2]));
                  if (o.length) {
                    let r = 0.01 * Math.min(...o);
                    return {
                      widths: t.filter((t) => t >= e[0] * r),
                      kind: "w",
                    };
                  }
                  return { widths: t, kind: "w" };
                }
                return "number" != typeof r
                  ? { widths: e, kind: "w" }
                  : {
                      widths: [
                        ...new Set(
                          [r, 2 * r].map(
                            (e) => t.find((t) => t >= e) || t[t.length - 1],
                          ),
                        ),
                      ],
                      kind: "x",
                    };
              })(e, o, a),
              c = s.length - 1;
            return {
              sizes: a || "w" !== u ? a : "100vw",
              srcSet: s
                .map(
                  (r, n) =>
                    `${l({ config: e, src: t, quality: i, width: r })} ${"w" === u ? r : n + 1}${u}`,
                )
                .join(", "),
              src: l({ config: e, src: t, quality: i, width: s[c] }),
            };
          })({
            config: T,
            src: e,
            unoptimized: r,
            width: B,
            quality: G,
            sizes: t,
            loader: D,
          }),
          Y = q ? "lazy" : f;
        return {
          props: {
            ...$,
            loading: Y,
            fetchPriority: x,
            width: B,
            height: W,
            decoding: S,
            className: d,
            style: { ...K, ...J },
            sizes: X.sizes,
            srcSet: X.srcSet,
            src: v || X.src,
          },
          meta: { unoptimized: r, preload: c || u, placeholder: P, fill: m },
        };
      }
    },
    25633,
    (e, t, r) => {
      e.i(47167), Object.defineProperty(r, "__esModule", { value: !0 });
      var n = {
        default: function () {
          return g;
        },
        defaultHead: function () {
          return f;
        },
      };
      for (var o in n)
        Object.defineProperty(r, o, { enumerable: !0, get: n[o] });
      let i = e.r(55682),
        a = e.r(90809),
        l = e.r(43476),
        s = a._(e.r(71645)),
        u = i._(e.r(98879)),
        c = e.r(42732);
      function f() {
        return [
          (0, l.jsx)("meta", { charSet: "utf-8" }, "charset"),
          (0, l.jsx)(
            "meta",
            { name: "viewport", content: "width=device-width" },
            "viewport",
          ),
        ];
      }
      function d(e, t) {
        return "string" == typeof t || "number" == typeof t
          ? e
          : t.type === s.default.Fragment
            ? e.concat(
                s.default.Children.toArray(t.props.children).reduce(
                  (e, t) =>
                    "string" == typeof t || "number" == typeof t
                      ? e
                      : e.concat(t),
                  [],
                ),
              )
            : e.concat(t);
      }
      let p = ["name", "httpEquiv", "charSet", "itemProp"];
      function h(e) {
        let t, r, n, o;
        return e
          .reduce(d, [])
          .reverse()
          .concat(f().reverse())
          .filter(
            ((t = new Set()),
            (r = new Set()),
            (n = new Set()),
            (o = {}),
            (e) => {
              let i = !0,
                a = !1;
              if (e.key && "number" != typeof e.key && e.key.indexOf("$") > 0) {
                a = !0;
                let r = e.key.slice(e.key.indexOf("$") + 1);
                t.has(r) ? (i = !1) : t.add(r);
              }
              switch (e.type) {
                case "title":
                case "base":
                  r.has(e.type) ? (i = !1) : r.add(e.type);
                  break;
                case "meta":
                  for (let t = 0, r = p.length; t < r; t++) {
                    let r = p[t];
                    if (e.props.hasOwnProperty(r))
                      if ("charSet" === r) n.has(r) ? (i = !1) : n.add(r);
                      else {
                        let t = e.props[r],
                          n = o[r] || new Set();
                        ("name" !== r || !a) && n.has(t)
                          ? (i = !1)
                          : (n.add(t), (o[r] = n));
                      }
                  }
              }
              return i;
            }),
          )
          .reverse()
          .map((e, t) => {
            let r = e.key || t;
            return s.default.cloneElement(e, { key: r });
          });
      }
      let g = function ({ children: e }) {
        let t = (0, s.useContext)(c.HeadManagerContext);
        return (0, l.jsx)(u.default, {
          reduceComponentsToState: h,
          headManager: t,
          children: e,
        });
      };
      ("function" == typeof r.default ||
        ("object" == typeof r.default && null !== r.default)) &&
        void 0 === r.default.__esModule &&
        (Object.defineProperty(r.default, "__esModule", { value: !0 }),
        Object.assign(r.default, r),
        (t.exports = r.default));
    },
    67423,
    (e, t, r) => {
      function n({
        widthInt: e,
        heightInt: t,
        blurWidth: r,
        blurHeight: o,
        blurDataURL: i,
        objectFit: a,
      }) {
        let l = r ? 40 * r : e,
          s = o ? 40 * o : t,
          u = l && s ? `viewBox='0 0 ${l} ${s}'` : "";
        return `%3Csvg xmlns='http://www.w3.org/2000/svg' ${u}%3E%3Cfilter id='b' color-interpolation-filters='sRGB'%3E%3CfeGaussianBlur stdDeviation='20'/%3E%3CfeColorMatrix values='1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 100 -1' result='s'/%3E%3CfeFlood x='0' y='0' width='100%25' height='100%25'/%3E%3CfeComposite operator='out' in='s'/%3E%3CfeComposite in2='SourceGraphic'/%3E%3CfeGaussianBlur stdDeviation='20'/%3E%3C/filter%3E%3Cimage width='100%25' height='100%25' x='0' y='0' preserveAspectRatio='${u ? "none" : "contain" === a ? "xMidYMid" : "cover" === a ? "xMidYMid slice" : "none"}' style='filter: url(%23b);' href='${i}'/%3E%3C/svg%3E`;
      }
      Object.defineProperty(r, "__esModule", { value: !0 }),
        Object.defineProperty(r, "getImageBlurSvg", {
          enumerable: !0,
          get: function () {
            return n;
          },
        });
    },
    18556,
    (e, t, r) => {
      e.i(47167),
        Object.defineProperty(r, "__esModule", { value: !0 }),
        Object.defineProperty(r, "ImageConfigContext", {
          enumerable: !0,
          get: function () {
            return i;
          },
        });
      let n = e.r(55682)._(e.r(71645)),
        o = e.r(87690),
        i = n.default.createContext(o.imageConfigDefault);
    },
    87690,
    (e, t, r) => {
      Object.defineProperty(r, "__esModule", { value: !0 });
      var n = {
        VALID_LOADERS: function () {
          return i;
        },
        imageConfigDefault: function () {
          return u;
        },
        prepareImageConfig: function () {
          return s;
        },
      };
      for (var o in n)
        Object.defineProperty(r, o, { enumerable: !0, get: n[o] });
      let i = ["default", "imgix", "cloudinary", "akamai", "custom"],
        a = {},
        l = new WeakMap();
      function s(e, t) {
        let r = e ?? a,
          n = t ?? a,
          o = l.get(r);
        if (o) {
          let e = o.get(n);
          if (e) return e;
        }
        let i = e || t || u,
          s = [...i.deviceSizes].sort((e, t) => e - t),
          c = [...i.imageSizes],
          f = {
            deviceSizes: s,
            imageSizes: c,
            allSizes: [...s, ...c].sort((e, t) => e - t),
            qualities:
              void 0 === i.qualities
                ? void 0
                : [...i.qualities].sort((e, t) => e - t),
            path: i.path,
            loader: i.loader,
            dangerouslyAllowSVG: i.dangerouslyAllowSVG,
            unoptimized: i.unoptimized,
            domains: i.domains,
            remotePatterns: i.remotePatterns,
            localPatterns:
              "u" < typeof window && void 0 !== t
                ? t.localPatterns
                : i.localPatterns,
            output: i.output,
          };
        return o || ((o = new WeakMap()), l.set(r, o)), o.set(n, f), f;
      }
      let u = {
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
        imageSizes: [32, 48, 64, 96, 128, 256, 384],
        path: "/_next/image",
        loader: "default",
        loaderFile: "",
        domains: [],
        disableStaticImages: !1,
        minimumCacheTTL: 14400,
        formats: ["image/webp"],
        maximumDiskCacheSize: void 0,
        maximumRedirects: 3,
        maximumResponseBody: 5e7,
        dangerouslyAllowLocalIP: !1,
        dangerouslyAllowSVG: !1,
        contentSecurityPolicy: "script-src 'none'; frame-src 'none'; sandbox;",
        contentDispositionType: "attachment",
        localPatterns: void 0,
        remotePatterns: [],
        qualities: [75],
        unoptimized: !1,
        customCacheHandler: !1,
      };
    },
    1948,
    (e, t, r) => {
      e.i(47167),
        Object.defineProperty(r, "__esModule", { value: !0 }),
        Object.defineProperty(r, "default", {
          enumerable: !0,
          get: function () {
            return a;
          },
        });
      let n = e.r(70965),
        o = e.r(43369);
      function i({ config: e, src: t, width: r, quality: a }) {
        let l = (0, o.getDeploymentId)();
        if (t.startsWith("/") && !t.startsWith("//"))
          if (t.includes("/_next/static/immutable") && !(0, o.getAssetToken)())
            l = void 0;
          else {
            let e = t.indexOf("?");
            if (-1 !== e) {
              let r = new URLSearchParams(t.slice(e + 1)),
                n = r.get("dpl");
              if (n) {
                (l = n), r.delete("dpl");
                let o = r.toString();
                t = t.slice(0, e) + (o ? "?" + o : "");
              }
            }
          }
        if (
          t.startsWith("/") &&
          t.includes("?") &&
          e.localPatterns?.length === 1 &&
          "**" === e.localPatterns[0].pathname &&
          "" === e.localPatterns[0].search
        )
          throw Error(`Image with src "${t}" is using a query string which is not configured in images.localPatterns.
Read more: https://nextjs.org/docs/messages/next-image-unconfigured-localpatterns`);
        let s = (0, n.findClosestQuality)(a, e);
        return `${e.path}?url=${encodeURIComponent(t)}&w=${r}&q=${s}${t.startsWith("/") && l ? `&dpl=${l}` : ""}`;
      }
      i.__next_img_default = !0;
      let a = i;
    },
    65856,
    (e, t, r) => {
      e.i(47167),
        Object.defineProperty(r, "__esModule", { value: !0 }),
        Object.defineProperty(r, "RouterContext", {
          enumerable: !0,
          get: function () {
            return n;
          },
        });
      let n = e.r(55682)._(e.r(71645)).default.createContext(null);
    },
    95057,
    (e, t, r) => {
      e.i(47167), Object.defineProperty(r, "__esModule", { value: !0 });
      var n = {
        formatUrl: function () {
          return l;
        },
        formatWithValidation: function () {
          return u;
        },
        urlObjectKeys: function () {
          return s;
        },
      };
      for (var o in n)
        Object.defineProperty(r, o, { enumerable: !0, get: n[o] });
      let i = e.r(90809)._(e.r(98183)),
        a = /https?|ftp|gopher|file/;
      function l(e) {
        let { auth: t, hostname: r } = e,
          n = e.protocol || "",
          o = e.pathname || "",
          l = e.hash || "",
          s = e.query || "",
          u = !1;
        (t = t ? encodeURIComponent(t).replace(/%3A/i, ":") + "@" : ""),
          e.host
            ? (u = t + e.host)
            : r &&
              ((u = t + (~r.indexOf(":") ? `[${r}]` : r)),
              e.port && (u += ":" + e.port)),
          s &&
            "object" == typeof s &&
            (s = String(i.urlQueryToSearchParams(s)));
        let c = e.search || (s && `?${s}`) || "";
        return (
          n && !n.endsWith(":") && (n += ":"),
          e.slashes || ((!n || a.test(n)) && !1 !== u)
            ? ((u = "//" + (u || "")), o && "/" !== o[0] && (o = "/" + o))
            : u || (u = ""),
          l && "#" !== l[0] && (l = "#" + l),
          c && "?" !== c[0] && (c = "?" + c),
          (o = o.replace(/[?#]/g, encodeURIComponent)),
          (c = c.replace("#", "%23")),
          `${n}${u}${o}${c}${l}`
        );
      }
      let s = [
        "auth",
        "hash",
        "host",
        "hostname",
        "href",
        "path",
        "pathname",
        "port",
        "protocol",
        "query",
        "search",
        "slashes",
      ];
      function u(e) {
        return l(e);
      }
    },
    73668,
    (e, t, r) => {
      Object.defineProperty(r, "__esModule", { value: !0 }),
        Object.defineProperty(r, "isLocalURL", {
          enumerable: !0,
          get: function () {
            return i;
          },
        });
      let n = e.r(18967),
        o = e.r(52817);
      function i(e) {
        if (!(0, n.isAbsoluteUrl)(e)) return !0;
        try {
          let t = (0, n.getLocationOrigin)(),
            r = new URL(e, t);
          return r.origin === t && (0, o.hasBasePath)(r.pathname);
        } catch (e) {
          return !1;
        }
      }
    },
    98879,
    (e, t, r) => {
      Object.defineProperty(r, "__esModule", { value: !0 }),
        Object.defineProperty(r, "default", {
          enumerable: !0,
          get: function () {
            return l;
          },
        });
      let n = e.r(71645),
        o = "u" < typeof window,
        i = o ? () => {} : n.useLayoutEffect,
        a = o ? () => {} : n.useEffect;
      function l(e) {
        let { headManager: t, reduceComponentsToState: r } = e;
        function l() {
          if (t && t.mountedInstances) {
            let e = n.Children.toArray(
              Array.from(t.mountedInstances).filter(Boolean),
            );
            t.updateHead(r(e));
          }
        }
        return (
          o && (t?.mountedInstances?.add(e.children), l()),
          i(
            () => (
              t?.mountedInstances?.add(e.children),
              () => {
                t?.mountedInstances?.delete(e.children);
              }
            ),
          ),
          i(
            () => (
              t && (t._pendingUpdate = l),
              () => {
                t && (t._pendingUpdate = l);
              }
            ),
          ),
          a(
            () => (
              t &&
                t._pendingUpdate &&
                (t._pendingUpdate(), (t._pendingUpdate = null)),
              () => {
                t &&
                  t._pendingUpdate &&
                  (t._pendingUpdate(), (t._pendingUpdate = null));
              }
            ),
          ),
          null
        );
      }
    },
    18967,
    (e, t, r) => {
      e.i(47167), Object.defineProperty(r, "__esModule", { value: !0 });
      var n = {
        DecodeError: function () {
          return y;
        },
        MiddlewareNotFoundError: function () {
          return P;
        },
        MissingStaticPage: function () {
          return w;
        },
        NormalizeError: function () {
          return v;
        },
        PageNotFoundError: function () {
          return b;
        },
        SP: function () {
          return g;
        },
        ST: function () {
          return m;
        },
        WEB_VITALS: function () {
          return i;
        },
        execOnce: function () {
          return a;
        },
        getDisplayName: function () {
          return f;
        },
        getLocationOrigin: function () {
          return u;
        },
        getURL: function () {
          return c;
        },
        isAbsoluteUrl: function () {
          return s;
        },
        isResSent: function () {
          return d;
        },
        loadGetInitialProps: function () {
          return h;
        },
        normalizeRepeatedSlashes: function () {
          return p;
        },
        stringifyError: function () {
          return _;
        },
      };
      for (var o in n)
        Object.defineProperty(r, o, { enumerable: !0, get: n[o] });
      let i = ["CLS", "FCP", "INP", "LCP", "TTFB"];
      function a(e) {
        let t,
          r = !1;
        return (...n) => (r || ((r = !0), (t = e(...n))), t);
      }
      let l = /^[a-zA-Z][a-zA-Z\d+\-.]*?:/,
        s = (e) => {
          let t = e.charCodeAt(0);
          return !!((t >= 65 && t <= 90) || (t >= 97 && t <= 122)) && l.test(e);
        };
      function u() {
        let { protocol: e, hostname: t, port: r } = window.location;
        return `${e}//${t}${r ? ":" + r : ""}`;
      }
      function c() {
        let { href: e } = window.location,
          t = u();
        return e.substring(t.length);
      }
      function f(e) {
        return "string" == typeof e ? e : e.displayName || e.name || "Unknown";
      }
      function d(e) {
        return e.finished || e.headersSent;
      }
      function p(e) {
        let t = e.split("?");
        return (
          t[0].replace(/\\/g, "/").replace(/\/\/+/g, "/") +
          (t[1] ? `?${t.slice(1).join("?")}` : "")
        );
      }
      async function h(e, t) {
        let r = t.res || (t.ctx && t.ctx.res);
        if (!e.getInitialProps)
          return t.ctx && t.Component
            ? { pageProps: await h(t.Component, t.ctx) }
            : {};
        let n = await e.getInitialProps(t);
        if (r && d(r)) return n;
        if (!n)
          throw Error(
            `"${f(e)}.getInitialProps()" should resolve to an object. But found "${n}" instead.`,
          );
        return n;
      }
      let g = "u" > typeof performance,
        m =
          g &&
          ["mark", "measure", "getEntriesByName"].every(
            (e) => "function" == typeof performance[e],
          );
      class y extends Error {}
      class v extends Error {}
      class b extends Error {
        constructor(e) {
          super(),
            (this.code = "ENOENT"),
            (this.name = "PageNotFoundError"),
            (this.message = `Cannot find module for page: ${e}`);
        }
      }
      class w extends Error {
        constructor(e, t) {
          super(),
            (this.message = `Failed to load static file for page: ${e} ${t}`);
        }
      }
      class P extends Error {
        constructor() {
          super(),
            (this.code = "ENOENT"),
            (this.message = "Cannot find the middleware module");
        }
      }
      function _(e) {
        return JSON.stringify({ message: e.message, stack: e.stack });
      }
    },
  ]);
})();
