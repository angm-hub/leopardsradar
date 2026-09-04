import{c as u,r as t,s as d}from"./index-D-KZy5iQ.js";/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const f=u("ArrowRightLeft",[["path",{d:"m16 3 4 4-4 4",key:"1x1c3m"}],["path",{d:"M20 7H4",key:"zbl0bi"}],["path",{d:"m8 21-4-4 4-4",key:"h9nckh"}],["path",{d:"M4 17h16",key:"g4d7ey"}]]);function h(a){const[o,s]=t.useState(null),[l,c]=t.useState(!0);return t.useEffect(()=>{if(!a)return;let e=!1;return c(!0),(async()=>{try{const{data:r,error:n}=await d.rpc("get_player_gradebars",{p_slug:a});if(n)throw n;e||s(r??null)}catch(r){console.error("[usePlayerGradebars]",r),e||s(null)}finally{e||c(!1)}})(),()=>{e=!0}},[a]),{gradebars:o,loading:l}}export{f as A,h as u};
