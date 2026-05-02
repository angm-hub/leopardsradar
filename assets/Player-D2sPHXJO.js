import{c as F,j as n,a as C,k as me,C as Re,M as Oe,r as y,s as fe,L as N,P as ge,f as xe,g as pe,l as Ae,e as be,n as Fe,N as Y,m as qe,b as He,d as We,B as E,o as Be,p as $e,E as ae,F as K}from"./index-ObsPvfI8.js";import{T as ze}from"./twitter-DK8B-gt4.js";import{M as Ve,L as Qe}from"./message-circle-CK2_BWbW.js";import{A as ve}from"./arrow-left-MEDRgVKo.js";/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ue=F("Briefcase",[["path",{d:"M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16",key:"jecpp"}],["rect",{width:"20",height:"14",x:"2",y:"6",rx:"2",key:"i6l2r4"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ge=F("ExternalLink",[["path",{d:"M15 3h6v6",key:"1q9fwt"}],["path",{d:"M10 14 21 3",key:"gplh6r"}],["path",{d:"M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6",key:"a6xqqp"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ze=F("Footprints",[["path",{d:"M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0Z",key:"1dudjm"}],["path",{d:"M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0Z",key:"l2t8xc"}],["path",{d:"M16 17h4",key:"1dejxt"}],["path",{d:"M4 13h4",key:"1bwh8b"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Je=F("Ruler",[["path",{d:"M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z",key:"icamh8"}],["path",{d:"m14.5 12.5 2-2",key:"inckbg"}],["path",{d:"m11.5 9.5 2-2",key:"fmmyf7"}],["path",{d:"m8.5 6.5 2-2",key:"vc6u1g"}],["path",{d:"m17.5 15.5 2-2",key:"wo5hmg"}]]);function ne({label:t,value:e,change:r,className:a}){const s=r==null?void 0:r.trim().startsWith("+");return n.jsxs("div",{className:C("flex flex-col gap-2",a),children:[n.jsx("span",{className:"text-xs uppercase tracking-[0.2em] text-muted",children:t}),n.jsx("span",{className:"font-mono text-4xl md:text-5xl font-semibold text-foreground leading-none",children:e}),r?n.jsx("span",{className:C("text-sm font-medium",s?"text-success":"text-alert"),children:r}):null]})}function Ye(t){var r;const e=(r=t.eligibilityNote)==null?void 0:r.trim();return e||(t.category==="roster"?t.capsRdc>0?`Membre du roster Léopards. ${t.capsRdc} sélection${t.capsRdc>1?"s":""} déjà avec la RDC.`:"Joueur du roster Léopards en route vers ses premières sélections.":t.category==="heritage"?"Profil héritage RDC : ascendance ou attaches familiales fortes avec le pays, à suivre dans la durée.":`Profil suivi par notre radar — statut : ${me(t.eligibilityStatus).toLowerCase()}.`)}function Ke({text:t,className:e,variant:r="compact"}){return t?r==="full"?n.jsxs("div",{className:e,children:[n.jsx("p",{className:"text-[10px] uppercase tracking-[0.3em] text-primary/85 font-mono mb-4",children:"Pourquoi il est sur notre radar"}),n.jsx("blockquote",{className:"border-l-2 border-primary/60 pl-5 md:pl-6",children:n.jsx("p",{className:"font-serif text-xl md:text-2xl italic leading-relaxed text-foreground/90",children:t})})]}):n.jsx("blockquote",{className:`border-l-2 border-primary/60 pl-4 ${e??""}`,children:n.jsx("p",{className:"font-serif text-base md:text-lg italic leading-snug text-foreground/85",children:t})}):null}function Xe({dateOfBirth:t,placeOfBirth:e,countryOfBirth:r,foot:a,heightCm:s}){const o=t?et(t):"—",i=[e,r].filter(Boolean).join(", ")||"—",l=a?a==="left"?"Gauche":a==="right"?"Droit":"Ambidextre":"—";return n.jsxs("div",{className:"grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4",children:[n.jsx(P,{icon:n.jsx(Re,{className:"h-3.5 w-3.5"}),label:"Né le",value:o}),n.jsx(P,{icon:n.jsx(Oe,{className:"h-3.5 w-3.5"}),label:"Lieu de naissance",value:i}),n.jsx(P,{icon:n.jsx(Ze,{className:"h-3.5 w-3.5"}),label:"Pied fort",value:l}),n.jsx(P,{icon:n.jsx(Je,{className:"h-3.5 w-3.5"}),label:"Taille",value:s?`${s} cm`:"—"})]})}function et(t){const e=new Date(t);return Number.isNaN(e.getTime())?"—":e.toLocaleDateString("fr-FR",{day:"2-digit",month:"long",year:"numeric"})}function P({icon:t,label:e,value:r}){return n.jsxs("div",{className:"rounded-card border border-border bg-card p-4",children:[n.jsxs("div",{className:"flex items-center gap-1.5 text-muted",children:[t,n.jsx("span",{className:"text-[9px] uppercase tracking-[0.25em] font-mono",children:e})]}),n.jsx("p",{className:"mt-2 font-serif text-base md:text-lg text-foreground leading-tight",children:r})]})}function tt({currentClub:t,contractExpires:e,agent:r,onLoanFrom:a}){if(!t&&!e&&!r&&!a)return null;const s=e?new Date(e).getFullYear():null;return n.jsxs("div",{className:"rounded-card border border-border bg-card p-5 md:p-6",children:[n.jsxs("div",{className:"flex items-center gap-2 text-muted mb-4",children:[n.jsx(Ue,{className:"h-3.5 w-3.5"}),n.jsx("span",{className:"text-[9px] uppercase tracking-[0.25em] font-mono",children:"Carrière en cours"})]}),n.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4",children:[n.jsx(D,{label:"Club",value:t??"Sans club",primary:!0}),n.jsx(D,{label:"Fin de contrat",value:s?`Juin ${s}`:"Non renseignée"}),n.jsx(D,{label:"Agent",value:r??"Non renseigné"}),a?n.jsx(D,{label:"Prêté par",value:a,highlight:!0}):null]})]})}function D({label:t,value:e,primary:r,highlight:a}){return n.jsxs("div",{children:[n.jsx("dt",{className:"text-[10px] uppercase tracking-[0.2em] text-muted font-mono",children:t}),n.jsx("dd",{className:r?"mt-1 font-serif text-lg md:text-xl text-foreground":a?"mt-1 text-sm text-primary":"mt-1 text-sm text-foreground/85",children:e})]})}function rt({position:t,excludeSlug:e,limit:r=4}){const[a,s]=y.useState([]),[o,i]=y.useState(!0);return y.useEffect(()=>{if(!t){s([]),i(!1);return}let l=!1;return(async()=>{i(!0);try{let u=fe.from("players").select("*").eq("position",t).neq("eligibility_status","ineligible").order("market_value_eur",{ascending:!1,nullsFirst:!1}).limit(r+1);e&&(u=u.neq("slug",e));const{data:d,error:c}=await u;if(c)throw c;if(l)return;s((d??[]).slice(0,r))}catch(u){console.error("[useRelatedPlayers]",u),l||s([])}finally{l||i(!1)}})(),()=>{l=!0}},[t,e,r]),{players:a,loading:o}}function at({position:t,positionLabelOverride:e,excludeSlug:r}){const{players:a,loading:s}=rt({position:t,excludeSlug:r,limit:4});if(!t||!s&&a.length===0)return null;const o=e??be[t]??t;return n.jsxs("section",{className:"container-site py-16 border-t border-border",children:[n.jsxs("div",{className:"flex items-baseline justify-between flex-wrap gap-2 mb-6",children:[n.jsx("h2",{className:"font-serif text-3xl text-foreground",children:"Plus de Léopards."}),n.jsxs("p",{className:"text-sm text-muted-light font-mono",children:["Autres ",o.toLowerCase(),"s suivis"]})]}),n.jsx("div",{className:"grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4",children:s?Array.from({length:4}).map((i,l)=>n.jsx("div",{className:"aspect-[3/4] rounded-card border border-border bg-card animate-pulse"},l)):a.map(i=>{const l=i.other_nationalities[0]??i.nationalities[0];return n.jsxs(N,{to:`/player/${i.slug}`,className:"group block rounded-card border border-border bg-card overflow-hidden transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10",children:[n.jsxs("div",{className:"relative aspect-[3/4]",children:[n.jsx(ge,{name:i.name,src:i.image_url,className:"absolute inset-0 h-full w-full",initialsClassName:"text-5xl"}),n.jsx("div",{className:"pointer-events-none absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-background to-transparent"}),l?n.jsx("span",{className:"absolute top-2 right-2 text-base leading-none",children:xe(l)}):null]}),n.jsxs("div",{className:"p-3",children:[n.jsx("p",{className:"font-serif text-sm text-foreground truncate group-hover:text-primary transition-colors",children:i.name}),n.jsxs("div",{className:"mt-1 flex items-center justify-between text-[10px] font-mono",children:[n.jsx("span",{className:"text-muted truncate",children:i.current_club??"—"}),i.market_value_eur&&i.market_value_eur>0?n.jsx("span",{className:"text-primary/85 shrink-0 ml-2",children:pe(i.market_value_eur)}):null]})]})]},i.slug)})}),n.jsx("div",{className:"mt-6 text-center",children:n.jsxs(N,{to:"/roster",className:"inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary-hover font-mono",children:["Voir tout le Roster ",n.jsx(Ae,{className:"h-3.5 w-3.5"})]})})]})}function se(t){if(Array.isArray(t))return t.filter(e=>typeof e=="string");if(typeof t=="string")try{const e=JSON.parse(t);return Array.isArray(e)?e.filter(r=>typeof r=="string"):[]}catch{return[]}return[]}function nt(t){const[e,r]=y.useState(null),[a,s]=y.useState(!0),[o,i]=y.useState(null);return y.useEffect(()=>{if(!t){s(!1);return}let l=!1;return(async()=>{s(!0),i(null);try{const{data:u,error:d}=await fe.from("players").select("*").eq("slug",t).maybeSingle();if(d)throw d;if(l)return;if(!u)r(null);else{const c=u;r({...c,nationalities:se(c.nationalities),other_nationalities:se(c.other_nationalities)})}}catch(u){if(l)return;const d=u instanceof Error?u.message:"Erreur inconnue";console.error("[usePlayer]",d),i(d),r(null)}finally{l||s(!1)}})(),()=>{l=!0}},[t]),{player:e,loading:a,error:o}}var st=Object.defineProperty,ot=Object.getOwnPropertyNames,S=(t,e)=>function(){return t&&(e=(0,t[ot(t)[0]])(t=0)),e},X=(t,e)=>{for(var r in e)st(t,r,{get:e[r],enumerable:!0})};function z(t){const e=t/255;return e<=.04045?e/12.92:Math.pow((e+.055)/1.055,2.4)}function V(t){const e=t<=.0031308?12.92*t:1.055*Math.pow(t,.4166666666666667)-.055;return Math.round(Math.max(0,Math.min(255,e*255)))}function we(t,e,r){const a=z(t),s=z(e),o=z(r),i=.4122214708*a+.5363325363*s+.0514459929*o,l=.2119034982*a+.6806995451*s+.1073969566*o,u=.0883024619*a+.2817188376*s+.6299787005*o,d=Math.cbrt(i),c=Math.cbrt(l),h=Math.cbrt(u),m=.2104542553*d+.793617785*c-.0040720468*h,f=1.9779984951*d-2.428592205*c+.4505937099*h,g=.0259040371*d+.7827717662*c-.808675766*h,b=Math.sqrt(f*f+g*g);let v=Math.atan2(g,f)*(180/Math.PI);return v<0&&(v+=360),{l:m,c:b,h:v}}function it(t,e,r){const a=r*(Math.PI/180),s=e*Math.cos(a),o=e*Math.sin(a),i=t+.3963377774*s+.2158037573*o,l=t-.1055613458*s-.0638541728*o,u=t-.0894841775*s-1.291485548*o,d=i*i*i,c=l*l*l,h=u*u*u,m=4.0767416621*d-3.3077115913*c+.2309699292*h,f=-1.2684380046*d+2.6097574011*c-.3413193965*h,g=-.0041960863*d-.7034186147*c+1.707614701*h;return[V(m),V(f),V(g)]}function lt(t){const e=new Array(t.length);for(let r=0;r<t.length;r++){const[a,s,o]=t[r],{l:i,c:l,h:u}=we(a,s,o);e[r]=[Math.round(i*255),Math.round(l/.4*255),Math.round(u/360*255)]}return e}function ct(t){return t.map(({color:[e,r,a],population:s})=>{const o=e/255,i=r/255*.4,l=a/255*360;return{color:it(o,i,l),population:s}})}var ye=S({"src/color-space.ts"(){}});function dt(t,e,r){const a=t/255,s=e/255,o=r/255,i=Math.max(a,s,o),l=Math.min(a,s,o),u=(i+l)/2;let d=0,c=0;if(i!==l){const h=i-l;c=u>.5?h/(2-i-l):h/(i+l),i===a?d=((s-o)/h+(s<o?6:0))/6:i===s?d=((o-a)/h+2)/6:d=((a-s)/h+4)/6}return{h:Math.round(d*360),s:Math.round(c*100),l:Math.round(u*100)}}function ut(t,e,r){const a=s=>{const o=s/255;return o<=.04045?o/12.92:Math.pow((o+.055)/1.055,2.4)};return .2126*a(t)+.7152*a(e)+.0722*a(r)}function oe(t,e){const r=Math.max(t,e),a=Math.min(t,e);return(r+.05)/(a+.05)}function k(t,e,r,a,s=0){return new je(t,e,r,a,s)}var je,q=S({"src/color.ts"(){ye(),je=class{constructor(t,e,r,a,s){this._r=t,this._g=e,this._b=r,this.population=a,this.proportion=s}rgb(){return{r:this._r,g:this._g,b:this._b}}hex(){const t=e=>e.toString(16).padStart(2,"0");return`#${t(this._r)}${t(this._g)}${t(this._b)}`}hsl(){return this._hsl||(this._hsl=dt(this._r,this._g,this._b)),this._hsl}oklch(){return this._oklch||(this._oklch=we(this._r,this._g,this._b)),this._oklch}css(t="rgb"){switch(t){case"hsl":{const{h:e,s:r,l:a}=this.hsl();return`hsl(${e}, ${r}%, ${a}%)`}case"oklch":{const{l:e,c:r,h:a}=this.oklch();return`oklch(${e.toFixed(3)} ${r.toFixed(3)} ${a.toFixed(1)})`}case"rgb":default:return`rgb(${this._r}, ${this._g}, ${this._b})`}}array(){return[this._r,this._g,this._b]}toString(){return this.hex()}get textColor(){return this.isDark?"#ffffff":"#000000"}get luminance(){return this._luminance===void 0&&(this._luminance=ut(this._r,this._g,this._b)),this._luminance}get isDark(){return this.luminance<=.179}get isLight(){return!this.isDark}get contrast(){if(!this._contrast){const t=this.luminance,e=oe(t,1),r=oe(t,0),a=this.isDark?k(255,255,255,0,0):k(0,0,0,0,0);this._contrast={white:Math.round(e*100)/100,black:Math.round(r*100)/100,foreground:a}}return this._contrast}}}}),_e={};X(_e,{computeFallbackColor:()=>ke,createPixelArray:()=>R,extractPalette:()=>W,validateOptions:()=>H});function H(t){let{colorCount:e,quality:r}=t;if(typeof e>"u"||!Number.isInteger(e))e=10;else{if(e===1)throw new Error("colorCount should be between 2 and 20. To get one color, call getColor() instead of getPalette()");e=Math.max(e,2),e=Math.min(e,20)}(typeof r>"u"||!Number.isInteger(r)||r<1)&&(r=10);const a=t.ignoreWhite!==void 0?!!t.ignoreWhite:!0,s=typeof t.whiteThreshold=="number"?t.whiteThreshold:250,o=typeof t.alphaThreshold=="number"?t.alphaThreshold:125,i=typeof t.minSaturation=="number"?Math.max(0,Math.min(1,t.minSaturation)):0,l=t.colorSpace??"oklch";return{colorCount:e,quality:r,ignoreWhite:a,whiteThreshold:s,alphaThreshold:o,minSaturation:i,colorSpace:l}}function R(t,e,r,a){const{ignoreWhite:s=!0,whiteThreshold:o=250,alphaThreshold:i=125,minSaturation:l=0}=a,u=[];for(let d=0;d<e;d+=r){const c=d*4,h=t[c],m=t[c+1],f=t[c+2],g=t[c+3];if(!(g!==void 0&&g<i)&&!(s&&h>o&&m>o&&f>o)){if(l>0){const b=Math.max(h,m,f);if(b===0||(b-Math.min(h,m,f))/b<l)continue}u.push([h,m,f])}}return u}function ke(t,e,r){let a=0,s=0,o=0,i=0;for(let l=0;l<e;l+=r){const u=l*4;a+=t[u],s+=t[u+1],o+=t[u+2],i++}return i===0?null:[Math.round(a/i),Math.round(s/i),Math.round(o/i)]}function W(t,e,r,a,s){const o=e*r,i={ignoreWhite:a.ignoreWhite,whiteThreshold:a.whiteThreshold,alphaThreshold:a.alphaThreshold,minSaturation:a.minSaturation};let l=R(t,o,a.quality,i);l.length===0&&(l=R(t,o,a.quality,{...i,ignoreWhite:!1})),l.length===0&&(l=R(t,o,a.quality,{...i,ignoreWhite:!1,alphaThreshold:0}));let u;if(a.colorSpace==="oklch"){const c=lt(l);u=ct(s.quantize(c,a.colorCount))}else u=s.quantize(l,a.colorCount);if(u.length>0){const c=u.reduce((h,m)=>h+m.population,0);return u.map(({color:[h,m,f],population:g})=>k(h,m,f,g,c>0?g/c:0))}const d=ke(t,o,a.quality);return d?[k(d[0],d[1],d[2],1,1)]:null}var B=S({"src/pipeline.ts"(){q(),ye()}}),Ne={};X(Ne,{BrowserPixelLoader:()=>ee});var ee,Ce=S({"src/loaders/browser.ts"(){ee=class{async load(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement)return this.loadFromImage(t);if(typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement)return this.loadFromCanvas(t);if(typeof ImageData<"u"&&t instanceof ImageData)return{data:t.data,width:t.width,height:t.height};if(typeof HTMLVideoElement<"u"&&t instanceof HTMLVideoElement)return this.loadFromVideo(t);if(typeof ImageBitmap<"u"&&t instanceof ImageBitmap)return this.loadFromImageBitmap(t);if(typeof OffscreenCanvas<"u"&&t instanceof OffscreenCanvas)return this.loadFromOffscreenCanvas(t);throw new Error("Unsupported source type. Expected HTMLImageElement, HTMLCanvasElement, HTMLVideoElement, ImageData, ImageBitmap, or OffscreenCanvas.")}loadFromImage(t){if(!t.complete)throw new Error('Image has not finished loading. Wait for the "load" event before calling getColor/getPalette.');if(!t.naturalWidth)throw new Error("Image has no dimensions. It may not have loaded successfully.");const e=document.createElement("canvas"),r=e.getContext("2d"),a=e.width=t.naturalWidth,s=e.height=t.naturalHeight;r.drawImage(t,0,0,a,s);try{return{data:r.getImageData(0,0,a,s).data,width:a,height:s}}catch(o){if(o instanceof DOMException&&o.name==="SecurityError"){const i=new Error('Image is tainted by cross-origin data. Add crossorigin="anonymous" to the <img> tag and ensure the server sends appropriate CORS headers.');throw i.cause=o,i}throw o}}loadFromCanvas(t){const e=t.getContext("2d"),{width:r,height:a}=t;return{data:e.getImageData(0,0,r,a).data,width:r,height:a}}loadFromVideo(t){if(t.readyState<2)throw new Error('Video is not ready. Wait for the "loadeddata" or "canplay" event before calling getColor/getPalette.');const e=t.videoWidth,r=t.videoHeight;if(!e||!r)throw new Error("Video has no dimensions. It may not have loaded successfully.");const a=document.createElement("canvas"),s=a.getContext("2d");return a.width=e,a.height=r,s.drawImage(t,0,0,e,r),{data:s.getImageData(0,0,e,r).data,width:e,height:r}}loadFromOffscreenCanvas(t){const e=t.getContext("2d");if(!e)throw new Error("Could not get 2D context from OffscreenCanvas.");const{width:r,height:a}=t;return{data:e.getImageData(0,0,r,a).data,width:r,height:a}}loadFromImageBitmap(t){const e=document.createElement("canvas"),r=e.getContext("2d");return e.width=t.width,e.height=t.height,r.drawImage(t,0,0),{data:r.getImageData(0,0,t.width,t.height).data,width:t.width,height:t.height}}}}}),Ie,ht=S({"src/worker/worker-script.ts"(){Ie=`
'use strict';

// -------------------------------------------------------------------------
// Inlined MMCQ (Modified Median Cut Quantization)
// -------------------------------------------------------------------------

var SIGBITS = 5;
var RSHIFT = 3;
var MAX_ITER = 1000;
var FRACT_POP = 0.75;
var HISTO_SIZE = 32768;

function colorIndex(r, g, b) {
    return (r << 10) + (g << 5) + b;
}

function getHisto(pixels) {
    var h = new Uint32Array(HISTO_SIZE);
    for (var i = 0; i < pixels.length; i++) {
        var p = pixels[i];
        h[colorIndex(p[0] >> RSHIFT, p[1] >> RSHIFT, p[2] >> RSHIFT)]++;
    }
    return h;
}

function VBox(r1, r2, g1, g2, b1, b2, histo) {
    this.r1 = r1; this.r2 = r2;
    this.g1 = g1; this.g2 = g2;
    this.b1 = b1; this.b2 = b2;
    this.histo = histo;
    this._count = -1;
    this._volume = -1;
    this._avg = null;
}

VBox.prototype.volume = function(force) {
    if (this._volume < 0 || force) {
        this._volume = (this.r2 - this.r1 + 1) * (this.g2 - this.g1 + 1) * (this.b2 - this.b1 + 1);
    }
    return this._volume;
};

VBox.prototype.count = function(force) {
    if (this._count < 0 || force) {
        var n = 0;
        for (var i = this.r1; i <= this.r2; i++)
            for (var j = this.g1; j <= this.g2; j++)
                for (var k = this.b1; k <= this.b2; k++)
                    n += this.histo[colorIndex(i, j, k)] || 0;
        this._count = n;
    }
    return this._count;
};

VBox.prototype.copy = function() {
    return new VBox(this.r1, this.r2, this.g1, this.g2, this.b1, this.b2, this.histo);
};

VBox.prototype.avg = function(force) {
    if (!this._avg || force) {
        var mult = 1 << RSHIFT;
        if (this.r1 === this.r2 && this.g1 === this.g2 && this.b1 === this.b2) {
            this._avg = [this.r1 << RSHIFT, this.g1 << RSHIFT, this.b1 << RSHIFT];
        } else {
            var ntot = 0, rsum = 0, gsum = 0, bsum = 0;
            for (var i = this.r1; i <= this.r2; i++)
                for (var j = this.g1; j <= this.g2; j++)
                    for (var k = this.b1; k <= this.b2; k++) {
                        var hval = this.histo[colorIndex(i, j, k)] || 0;
                        ntot += hval;
                        rsum += hval * (i + 0.5) * mult;
                        gsum += hval * (j + 0.5) * mult;
                        bsum += hval * (k + 0.5) * mult;
                    }
            this._avg = ntot
                ? [~~(rsum / ntot), ~~(gsum / ntot), ~~(bsum / ntot)]
                : [~~(mult * (this.r1 + this.r2 + 1) / 2), ~~(mult * (this.g1 + this.g2 + 1) / 2), ~~(mult * (this.b1 + this.b2 + 1) / 2)];
        }
    }
    return this._avg;
};

function PQueue(comparator) {
    this.contents = [];
    this.sorted = false;
    this.comparator = comparator;
}

PQueue.prototype.push = function(item) { this.contents.push(item); this.sorted = false; };
PQueue.prototype.pop = function() {
    if (!this.sorted) { this.contents.sort(this.comparator); this.sorted = true; }
    return this.contents.pop();
};
PQueue.prototype.size = function() { return this.contents.length; };

function vboxFromPixels(pixels, histo) {
    var rmin = 1e6, rmax = 0, gmin = 1e6, gmax = 0, bmin = 1e6, bmax = 0;
    for (var i = 0; i < pixels.length; i++) {
        var p = pixels[i];
        var rv = p[0] >> RSHIFT, gv = p[1] >> RSHIFT, bv = p[2] >> RSHIFT;
        if (rv < rmin) rmin = rv; if (rv > rmax) rmax = rv;
        if (gv < gmin) gmin = gv; if (gv > gmax) gmax = gv;
        if (bv < bmin) bmin = bv; if (bv > bmax) bmax = bv;
    }
    return new VBox(rmin, rmax, gmin, gmax, bmin, bmax, histo);
}

function medianCutApply(histo, vbox) {
    if (!vbox.count()) return undefined;
    if (vbox.count() === 1) return [vbox.copy(), null];

    var rw = vbox.r2 - vbox.r1 + 1;
    var gw = vbox.g2 - vbox.g1 + 1;
    var bw = vbox.b2 - vbox.b1 + 1;
    var maxw = Math.max(rw, gw, bw);
    var total = 0;
    var partialsum = [];
    var lookaheadsum = [];
    var i, j, k, sum;

    if (maxw === rw) {
        for (i = vbox.r1; i <= vbox.r2; i++) {
            sum = 0;
            for (j = vbox.g1; j <= vbox.g2; j++)
                for (k = vbox.b1; k <= vbox.b2; k++)
                    sum += histo[colorIndex(i, j, k)] || 0;
            total += sum; partialsum[i] = total;
        }
    } else if (maxw === gw) {
        for (i = vbox.g1; i <= vbox.g2; i++) {
            sum = 0;
            for (j = vbox.r1; j <= vbox.r2; j++)
                for (k = vbox.b1; k <= vbox.b2; k++)
                    sum += histo[colorIndex(j, i, k)] || 0;
            total += sum; partialsum[i] = total;
        }
    } else {
        for (i = vbox.b1; i <= vbox.b2; i++) {
            sum = 0;
            for (j = vbox.r1; j <= vbox.r2; j++)
                for (k = vbox.g1; k <= vbox.g2; k++)
                    sum += histo[colorIndex(j, k, i)] || 0;
            total += sum; partialsum[i] = total;
        }
    }

    partialsum.forEach(function(d, idx) { lookaheadsum[idx] = total - d; });

    function doCut(color) {
        var dim1 = color + '1', dim2 = color + '2';
        for (var i = vbox[dim1]; i <= vbox[dim2]; i++) {
            if (partialsum[i] > total / 2) {
                var vbox1 = vbox.copy(), vbox2 = vbox.copy();
                var left = i - vbox[dim1], right = vbox[dim2] - i;
                var d2 = left <= right
                    ? Math.min(vbox[dim2] - 1, ~~(i + right / 2))
                    : Math.max(vbox[dim1], ~~(i - 1 - left / 2));
                while (!partialsum[d2]) d2++;
                var count2 = lookaheadsum[d2];
                while (!count2 && partialsum[d2 - 1]) count2 = lookaheadsum[--d2];
                vbox1[dim2] = d2;
                vbox2[dim1] = d2 + 1;
                return [vbox1, vbox2];
            }
        }
    }

    if (maxw === rw) return doCut('r');
    if (maxw === gw) return doCut('g');
    return doCut('b');
}

function iterate(pq, target, histo) {
    var ncolors = pq.size(), niters = 0;
    while (niters < MAX_ITER) {
        if (ncolors >= target) return;
        niters++;
        var vbox = pq.pop();
        if (!vbox.count()) { pq.push(vbox); continue; }
        var result = medianCutApply(histo, vbox);
        if (!result || !result[0]) return;
        pq.push(result[0]);
        if (result[1]) { pq.push(result[1]); ncolors++; }
    }
}

function quantize(pixels, maxColors) {
    if (!pixels.length || maxColors < 2 || maxColors > 256) return [];

    var histo = getHisto(pixels);
    var vbox = vboxFromPixels(pixels, histo);
    var pq = new PQueue(function(a, b) { return a.count() - b.count(); });
    pq.push(vbox);
    iterate(pq, FRACT_POP * maxColors, histo);

    var pq2 = new PQueue(function(a, b) { return a.count() * a.volume() - b.count() * b.volume(); });
    while (pq.size()) pq2.push(pq.pop());
    iterate(pq2, maxColors, histo);

    var results = [];
    while (pq2.size()) {
        var box = pq2.pop();
        results.push({ color: box.avg(), population: box.count() });
    }
    return results;
}

// -------------------------------------------------------------------------
// Worker message handler
// -------------------------------------------------------------------------

self.onmessage = function (e) {
    var data = e.data;
    var id = data.id;
    try {
        var palette = quantize(data.pixels, data.maxColors);
        self.postMessage({ id: id, palette: palette });
    } catch (err) {
        self.postMessage({ id: id, error: err.message || 'Unknown worker error' });
    }
};
`}}),Me={};X(Me,{extractInWorker:()=>ft,isWorkerSupported:()=>Se,terminateWorker:()=>gt});function Se(){return typeof Worker<"u"}function mt(){if(w)return w;if(!Se())throw new Error("Web Workers are not supported in this environment.");return I=URL.createObjectURL(new Blob([Ie],{type:"application/javascript"})),w=new Worker(I),w.onmessage=t=>{const{id:e,palette:r,error:a}=t.data,s=j.get(e);if(s)if(j.delete(e),a)s.reject(new Error(a));else{const o=r,i=o.reduce((u,d)=>u+d.population,0),l=o.map(({color:[u,d,c],population:h})=>k(u,d,c,h,i>0?h/i:0));s.resolve(l)}},w.onerror=t=>{for(const[,e]of j)e.reject(new Error(t.message));j.clear()},w}function ft(t,e,r){return new Promise((a,s)=>{if(r!=null&&r.aborted){s(r.reason??new DOMException("Aborted","AbortError"));return}const o=Te++;j.set(o,{resolve:a,reject:s});const i=()=>{j.delete(o),s(r.reason??new DOMException("Aborted","AbortError"))};r==null||r.addEventListener("abort",i,{once:!0});try{mt().postMessage({id:o,pixels:t,maxColors:e})}catch(l){j.delete(o),r==null||r.removeEventListener("abort",i),s(l)}})}function gt(){w&&(w.terminate(),w=null),I&&(URL.revokeObjectURL(I),I=null);for(const[,t]of j)t.reject(new Error("Worker terminated"));j.clear()}var w,I,Te,j,xt=S({"src/worker/manager.ts"(){q(),ht(),w=null,I=null,Te=0,j=new Map}});B();B();var Q=[{divisor:16,progress:.06},{divisor:4,progress:.25},{divisor:1,progress:1}];function pt(){return new Promise(t=>setTimeout(t,0))}async function*bt(t,e,r,a,s,o){for(let i=0;i<Q.length;i++){if(o!=null&&o.aborted)throw o.reason??new DOMException("Aborted","AbortError");const l=Q[i],u={...a,quality:a.quality*l.divisor},d=W(t,e,r,u,s),c=i===Q.length-1;yield{palette:d??[],progress:l.progress,done:c},c||await pt()}}q();var U=[{role:"Vibrant",targetL:.65,minL:.4,maxL:.85,targetC:.2,minC:.08},{role:"Muted",targetL:.65,minL:.4,maxL:.85,targetC:.04,minC:0},{role:"DarkVibrant",targetL:.3,minL:0,maxL:.45,targetC:.2,minC:.08},{role:"DarkMuted",targetL:.3,minL:0,maxL:.45,targetC:.04,minC:0},{role:"LightVibrant",targetL:.85,minL:.7,maxL:1,targetC:.2,minC:.08},{role:"LightMuted",targetL:.85,minL:.7,maxL:1,targetC:.04,minC:0}],vt=6,wt=3,yt=1;function ie(t,e,r){const{l:a,c:s}=t.oklch();if(a<e.minL||a>e.maxL||s<e.minC)return-1/0;const o=1-Math.abs(a-e.targetL),i=1-Math.min(Math.abs(s-e.targetC)/.2,1),l=r>0?t.population/r:0;return o*vt+i*wt+l*yt}var le=k(255,255,255,0),ce=k(0,0,0,0);function de(t){return{title:t.isDark?le:ce,body:t.isDark?le:ce}}function Ee(t){const e=Math.max(...t.map(o=>o.population),1),r=[];for(const o of U){let i=null,l=-1/0;for(const u of t){const d=ie(u,o,e);d>l&&(l=d,i=u)}i&&l>-1/0&&r.push({role:o.role,color:i,score:l})}const a=new Set,s={};r.sort((o,i)=>i.score-o.score);for(const o of r)if(a.has(o.color)){const i=U.find(d=>d.role===o.role);let l=null,u=-1/0;for(const d of t){if(a.has(d))continue;const c=ie(d,i,e);c>u&&(u=c,l=d)}if(l&&u>-1/0){a.add(l);const{title:d,body:c}=de(l);s[o.role]={color:l,role:o.role,titleTextColor:d,bodyTextColor:c}}else s[o.role]=null}else{a.add(o.color);const{title:i,body:l}=de(o.color);s[o.role]={color:o.color,role:o.role,titleTextColor:i,bodyTextColor:l}}for(const o of U)o.role in s||(s[o.role]=null);return s}var A=5,_=8-A,jt=1e3,_t=.75,kt=1<<3*A;function M(t,e,r){return(t<<2*A)+(e<<A)+r}var Nt=class Le{constructor(e,r,a,s,o,i,l){this.r1=e,this.r2=r,this.g1=a,this.g2=s,this.b1=o,this.b2=i,this.histo=l}volume(e=!1){return(this._volume===void 0||e)&&(this._volume=(this.r2-this.r1+1)*(this.g2-this.g1+1)*(this.b2-this.b1+1)),this._volume}count(e=!1){if(this._count===void 0||e){let r=0;for(let a=this.r1;a<=this.r2;a++)for(let s=this.g1;s<=this.g2;s++)for(let o=this.b1;o<=this.b2;o++)r+=this.histo[M(a,s,o)]||0;this._count=r}return this._count}copy(){return new Le(this.r1,this.r2,this.g1,this.g2,this.b1,this.b2,this.histo)}avg(e=!1){if(this._avg===void 0||e){const r=1<<_;if(this.r1===this.r2&&this.g1===this.g2&&this.b1===this.b2)this._avg=[this.r1<<_,this.g1<<_,this.b1<<_];else{let a=0,s=0,o=0,i=0;for(let l=this.r1;l<=this.r2;l++)for(let u=this.g1;u<=this.g2;u++)for(let d=this.b1;d<=this.b2;d++){const c=this.histo[M(l,u,d)]||0;a+=c,s+=c*(l+.5)*r,o+=c*(u+.5)*r,i+=c*(d+.5)*r}a?this._avg=[~~(s/a),~~(o/a),~~(i/a)]:this._avg=[~~(r*(this.r1+this.r2+1)/2),~~(r*(this.g1+this.g2+1)/2),~~(r*(this.b1+this.b2+1)/2)]}}return this._avg}},ue=class{constructor(t){this.comparator=t,this.contents=[],this.sorted=!1}sort(){this.contents.sort(this.comparator),this.sorted=!0}push(t){this.contents.push(t),this.sorted=!1}peek(t){return this.sorted||this.sort(),this.contents[t??this.contents.length-1]}pop(){return this.sorted||this.sort(),this.contents.pop()}size(){return this.contents.length}map(t){return this.contents.map(t)}};function Ct(t){const e=new Uint32Array(kt);for(const r of t){const a=r[0]>>_,s=r[1]>>_,o=r[2]>>_;e[M(a,s,o)]++}return e}function It(t,e){let r=1e6,a=0,s=1e6,o=0,i=1e6,l=0;for(const u of t){const d=u[0]>>_,c=u[1]>>_,h=u[2]>>_;d<r?r=d:d>a&&(a=d),c<s?s=c:c>o&&(o=c),h<i?i=h:h>l&&(l=h)}return new Nt(r,a,s,o,i,l,e)}function Mt(t,e){if(!e.count())return;if(e.count()===1)return[e.copy(),null];const r=e.r2-e.r1+1,a=e.g2-e.g1+1,s=e.b2-e.b1+1,o=Math.max(r,a,s);let i=0;const l=[],u=[];if(o===r)for(let c=e.r1;c<=e.r2;c++){let h=0;for(let m=e.g1;m<=e.g2;m++)for(let f=e.b1;f<=e.b2;f++)h+=t[M(c,m,f)]||0;i+=h,l[c]=i}else if(o===a)for(let c=e.g1;c<=e.g2;c++){let h=0;for(let m=e.r1;m<=e.r2;m++)for(let f=e.b1;f<=e.b2;f++)h+=t[M(m,c,f)]||0;i+=h,l[c]=i}else for(let c=e.b1;c<=e.b2;c++){let h=0;for(let m=e.r1;m<=e.r2;m++)for(let f=e.g1;f<=e.g2;f++)h+=t[M(m,f,c)]||0;i+=h,l[c]=i}l.forEach((c,h)=>{u[h]=i-c});function d(c){const h=c+"1",m=c+"2";for(let f=e[h];f<=e[m];f++)if(l[f]>i/2){const g=e.copy(),b=e.copy(),v=f-e[h],x=e[m]-f;let p;for(v<=x?p=Math.min(e[m]-1,~~(f+x/2)):p=Math.max(e[h],~~(f-1-v/2));!l[p];)p++;let T=u[p];for(;!T&&l[p-1];)T=u[--p];return g[m]=p,b[h]=g[m]+1,[g,b]}}return d(o===r?"r":o===a?"g":"b")}function he(t,e,r){let a=t.size(),s=0;for(;s<jt;){if(a>=e)return;s++;const o=t.pop();if(!o.count()){t.push(o);continue}const i=Mt(r,o);if(!i||!i[0])return;t.push(i[0]),i[1]&&(t.push(i[1]),a++)}}function St(t,e){if(!t.length||e<2||e>256)return[];const r=new Set,a=[];for(const d of t){const c=d.join(",");r.has(c)||(r.add(c),a.push(d))}if(a.length<=e){const d=new Map;for(const c of t){const h=c.join(",");d.set(h,(d.get(h)||0)+1)}return a.map(c=>({color:c,population:d.get(c.join(","))}))}const s=Ct(t),o=It(t,s),i=new ue((d,c)=>d.count()-c.count());i.push(o),he(i,_t*e,s);const l=new ue((d,c)=>d.count()*d.volume()-c.count()*c.volume());for(;i.size();)l.push(i.pop());he(l,e,s);const u=[];for(;l.size();){const d=l.pop();u.push({color:d.avg(),population:d.count()})}return u}var Pe=class{async init(){}quantize(t,e){return St(t,e)}};async function Tt(){const{BrowserPixelLoader:t}=await Promise.resolve().then(()=>(Ce(),Ne));return new t}var L=null,O=null;function Et(t){t.loader&&(L=t.loader),t.quantizer&&(O=t.quantizer)}async function Lt(t){return t||L||(L=await Tt(),L)}async function De(t){if(t)return await t.init(),t;if(O)return O;const e=new Pe;return await e.init(),O=e,e}function Z(t){if(t!=null&&t.aborted)throw t.reason??new DOMException("Aborted","AbortError")}async function J(t,e){return Z(e==null?void 0:e.signal),(await Lt(e==null?void 0:e.loader)).load(t,e==null?void 0:e.signal)}async function Pt(t,e){const r=await te(t,{colorCount:5,...e});return r?r[0]:null}async function te(t,e){const r=H(e??{});if(Z(e==null?void 0:e.signal),e!=null&&e.worker){const{isWorkerSupported:o,extractInWorker:i}=await Promise.resolve().then(()=>(xt(),Me));if(o()){const{data:l,width:u,height:d}=await J(t,e),{createPixelArray:c}=await Promise.resolve().then(()=>(B(),_e)),h=c(l,u*d,r.quality,{ignoreWhite:r.ignoreWhite,whiteThreshold:r.whiteThreshold,alphaThreshold:r.alphaThreshold,minSaturation:r.minSaturation});return i(h,r.colorCount,e==null?void 0:e.signal)}}const[a,s]=await Promise.all([J(t,e),De(e==null?void 0:e.quantizer)]);return Z(e==null?void 0:e.signal),W(a.data,a.width,a.height,r,s)}async function Dt(t,e){const r=await te(t,{colorCount:16,...e});return Ee(r??[])}async function*Rt(t,e){const r=H(e??{}),[a,s]=await Promise.all([J(t,e),De(e==null?void 0:e.quantizer)]);yield*bt(a.data,a.width,a.height,r,s,e==null?void 0:e.signal)}Ce();B();new ee;var Ot=new Pe;function At(t,e){const r=$(t,{colorCount:5,...e});return r?r[0]:null}function $(t,e){const r=H(e??{}),a=(e==null?void 0:e.quantizer)??Ot,s=qt(t);return W(s.data,s.width,s.height,r,a)}function Ft(t,e){const r=$(t,{colorCount:16,...e});return Ee(r??[])}function qt(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement)return Ht(t);if(typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement)return Wt(t);if(typeof ImageData<"u"&&t instanceof ImageData)return{data:t.data,width:t.width,height:t.height};if(typeof HTMLVideoElement<"u"&&t instanceof HTMLVideoElement)return Bt(t);if(typeof ImageBitmap<"u"&&t instanceof ImageBitmap)return zt(t);if(typeof OffscreenCanvas<"u"&&t instanceof OffscreenCanvas)return $t(t);throw new Error("Unsupported source type. Expected HTMLImageElement, HTMLCanvasElement, HTMLVideoElement, ImageData, ImageBitmap, or OffscreenCanvas.")}function Ht(t){if(!t.complete)throw new Error('Image has not finished loading. Wait for the "load" event before calling getColorSync/getPaletteSync.');if(!t.naturalWidth)throw new Error("Image has no dimensions. It may not have loaded successfully.");const e=document.createElement("canvas"),r=e.getContext("2d"),a=e.width=t.naturalWidth,s=e.height=t.naturalHeight;r.drawImage(t,0,0,a,s);try{return{data:r.getImageData(0,0,a,s).data,width:a,height:s}}catch(o){if(o instanceof DOMException&&o.name==="SecurityError"){const i=new Error('Image is tainted by cross-origin data. Add crossorigin="anonymous" to the <img> tag and ensure the server sends appropriate CORS headers.');throw i.cause=o,i}throw o}}function Wt(t){const e=t.getContext("2d"),{width:r,height:a}=t;return{data:e.getImageData(0,0,r,a).data,width:r,height:a}}function Bt(t){if(t.readyState<2)throw new Error('Video is not ready. Wait for the "loadeddata" or "canplay" event before calling getColorSync/getPaletteSync.');const e=t.videoWidth,r=t.videoHeight;if(!e||!r)throw new Error("Video has no dimensions. It may not have loaded successfully.");const a=document.createElement("canvas"),s=a.getContext("2d");return a.width=e,a.height=r,s.drawImage(t,0,0,e,r),{data:s.getImageData(0,0,e,r).data,width:e,height:r}}function $t(t){const e=t.getContext("2d");if(!e)throw new Error("Could not get 2D context from OffscreenCanvas.");const{width:r,height:a}=t;return{data:e.getImageData(0,0,r,a).data,width:r,height:a}}function zt(t){const e=document.createElement("canvas"),r=e.getContext("2d");return e.width=t.width,e.height=t.height,r.drawImage(t,0,0),{data:r.getImageData(0,0,t.width,t.height).data,width:t.width,height:t.height}}function Vt(t,e){const{throttle:r=200,onChange:a,...s}=e;let o=!1,i=null,l=null,u=0;const d=[];function c(){try{const m=$(t,s);m&&m.length>0&&a(m)}catch{}}function h(){if(o)return;const m=performance.now();m-u>=r&&(t instanceof HTMLVideoElement?t.readyState>=2&&!t.paused&&!t.ended&&(c(),u=m):(c(),u=m)),i=requestAnimationFrame(h)}if(t instanceof HTMLImageElement){if(t.complete&&t.naturalWidth)c();else{const m=()=>{c(),t.removeEventListener("load",m)};t.addEventListener("load",m),d.push(()=>t.removeEventListener("load",m))}l=new MutationObserver(()=>{if(t.complete&&t.naturalWidth)c();else{const m=()=>{c(),t.removeEventListener("load",m)};t.addEventListener("load",m)}}),l.observe(t,{attributes:!0,attributeFilter:["src","srcset"]})}else if(t instanceof HTMLVideoElement){i=requestAnimationFrame(h);const m=()=>{o||c()};t.addEventListener("seeked",m),d.push(()=>t.removeEventListener("seeked",m))}else i=requestAnimationFrame(h);return{stop(){o=!0,i!==null&&(cancelAnimationFrame(i),i=null),l&&(l.disconnect(),l=null);for(const m of d)m();d.length=0}}}q();const Qt=Object.freeze(Object.defineProperty({__proto__:null,configure:Et,createColor:k,getColor:Pt,getColorSync:At,getPalette:te,getPaletteProgressive:Rt,getPaletteSync:$,getSwatches:Dt,getSwatchesSync:Ft,observe:Vt},Symbol.toStringTag,{value:"Module"})),Ut=Qt;function Gt(t){const[e,r]=y.useState(null);return y.useEffect(()=>{if(!t){r(null);return}let a=!1;const s=new Image;return s.crossOrigin="Anonymous",s.src=t,s.onload=()=>{if(!a)try{const i=new Ut().getColor(s);i&&!a&&r(i)}catch{a||r(null)}},s.onerror=()=>{a||r(null)},()=>{a=!0}},[t]),e}const Zt="data:image/svg+xml;utf8,"+encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.6 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>");function Jt(){return n.jsxs("div",{className:"min-h-screen bg-background",children:[n.jsx(Y,{}),n.jsxs("main",{className:"container-site flex min-h-[70vh] flex-col items-center justify-center py-32 text-center",children:[n.jsx("h1",{className:"font-serif text-5xl text-foreground",children:"Joueur introuvable."}),n.jsx("p",{className:"mt-4 text-muted",children:"Ce profil n'existe pas (encore)."}),n.jsxs(N,{to:"/roster",className:"mt-8 inline-flex items-center gap-2 text-primary hover:text-primary-hover",children:[n.jsx(ve,{className:"h-4 w-4"})," Retour au Roster"]})]}),n.jsx(K,{})]})}function Yt(){return n.jsxs("div",{className:"min-h-screen bg-background",children:[n.jsx(Y,{}),n.jsx("main",{className:"container-site pt-32 pb-20",children:n.jsxs("div",{className:"grid grid-cols-1 gap-12 md:grid-cols-5",children:[n.jsx("div",{className:"aspect-[3/4] w-full rounded-card border border-border bg-gradient-to-r from-card via-card-hover to-card animate-shimmer md:col-span-2",style:{backgroundSize:"200% 100%"}}),n.jsxs("div",{className:"md:col-span-3 flex flex-col gap-4",children:[n.jsx("div",{className:"h-16 w-3/4 rounded bg-card animate-shimmer",style:{backgroundSize:"200% 100%"}}),n.jsx("div",{className:"h-6 w-1/2 rounded bg-card animate-shimmer",style:{backgroundSize:"200% 100%"}})]})]})}),n.jsx(K,{})]})}function rr(){const{slug:t}=Fe(),{player:e,loading:r}=nt(t),[a,s]=y.useState(!1),o=Gt((e==null?void 0:e.image_url)??void 0),[i,l,u]=o??[60,60,70],d=`linear-gradient(180deg, rgba(${i}, ${l}, ${u}, 0.42) 0%, rgba(${i}, ${l}, ${u}, 0.18) 45%, #0A0A0B 100%)`,c=o?`0 20px 80px rgba(${i}, ${l}, ${u}, 0.35), 0 8px 24px rgba(0,0,0,0.5)`:"0 20px 80px rgba(0,0,0,0.5)";if(r)return n.jsx(Yt,{});if(!e)return n.jsx(Jt,{});const h=e.player_category==="roster",m=h?"/roster":"/radar",f=h?"Roster":"Radar",g=e.player_category==="roster"?"Roster · Sélection":e.player_category==="heritage"?"Héritage RDC":`Radar · ${e.tier==="tier1"?"Tier 1":e.tier==="tier2"?"Tier 2":"Tier libre"}`,b=!e.season_games&&!e.season_goals&&!e.season_assists&&!e.season_minutes&&!e.season_rating,v=x=>{var re;const p=typeof window<"u"?window.location.href:"",T=`${e.name} — ${e.current_club??"profil RDC"} sur Léopards Radar`;x==="twitter"?window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(T)}&url=${encodeURIComponent(p)}`,"_blank","noopener,noreferrer"):x==="whatsapp"?window.open(`https://wa.me/?text=${encodeURIComponent(`${T} ${p}`)}`,"_blank","noopener,noreferrer"):x==="copy"&&((re=navigator.clipboard)==null||re.writeText(p),s(!0),setTimeout(()=>s(!1),2e3))};return n.jsxs("div",{className:"min-h-screen bg-background",children:[n.jsx(Y,{}),n.jsxs("main",{children:[n.jsxs("section",{className:"relative overflow-hidden bg-background",children:[n.jsx(qe.div,{"aria-hidden":!0,className:"absolute inset-0",style:{background:d},initial:{opacity:0},animate:{opacity:1},transition:{duration:.8,ease:"easeOut"}},o?`${i}-${l}-${u}`:"fallback"),n.jsx("div",{"aria-hidden":!0,className:"absolute inset-0 pointer-events-none mix-blend-overlay",style:{backgroundImage:`url("${Zt}")`,opacity:.03}}),n.jsx("div",{"aria-hidden":!0,className:"absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-transparent to-background"}),n.jsxs("div",{className:"container-site relative z-10 pt-28 pb-20",children:[n.jsxs("nav",{className:"mb-8 text-sm text-muted",children:[n.jsx(N,{to:"/",className:"hover:text-foreground",children:"Home"}),n.jsx("span",{className:"mx-2 opacity-50",children:"/"}),n.jsx(N,{to:m,className:"hover:text-foreground",children:f}),n.jsx("span",{className:"mx-2 opacity-50",children:"/"}),n.jsx("span",{className:"text-foreground/80",children:e.name})]}),n.jsxs("div",{className:"grid grid-cols-1 gap-12 md:grid-cols-5",children:[n.jsxs("div",{className:"md:col-span-2",children:[n.jsx(ge,{name:e.name,src:e.image_url,className:"aspect-[3/4] w-full rounded-card transition-shadow duration-700",initialsClassName:"text-9xl"}),n.jsx("div",{"aria-hidden":!0,className:"pointer-events-none -mt-[100%] aspect-[3/4] w-full rounded-card",style:{boxShadow:c}})]}),n.jsxs("div",{className:"flex flex-col gap-6 md:col-span-3",children:[n.jsx("p",{className:"text-[10px] uppercase tracking-[0.3em] text-primary/85 font-mono",children:g}),n.jsx("h1",{className:"-mt-3 font-serif text-5xl md:text-7xl font-semibold leading-[1.05] text-balance text-foreground",children:e.name}),n.jsxs("div",{className:"flex flex-wrap gap-2",children:[e.position?n.jsxs("span",{className:C("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs uppercase tracking-wider",He[e.position]),children:[n.jsx("span",{"aria-hidden":!0,className:C("inline-block h-1.5 w-1.5 rounded-full",We[e.position])}),be[e.position]]}):null,e.foot?n.jsxs("span",{className:"rounded-full border border-border bg-card/60 px-3 py-1 text-xs uppercase tracking-wider text-muted-light backdrop-blur-sm",children:["Pied ",e.foot==="left"?"gauche":e.foot==="right"?"droit":"ambidextre"]}):null,e.age?n.jsxs("span",{className:"rounded-full border border-border bg-card/60 px-3 py-1 text-xs uppercase tracking-wider text-muted-light backdrop-blur-sm",children:[e.age," ans"]}):null,e.height_cm?n.jsxs("span",{className:"rounded-full border border-border bg-card/60 px-3 py-1 text-xs uppercase tracking-wider text-muted-light backdrop-blur-sm",children:[e.height_cm," cm"]}):null]}),e.current_club?n.jsxs("div",{className:"flex flex-wrap items-center gap-3",children:[n.jsx("span",{className:"text-lg font-semibold text-foreground",children:e.current_club}),e.contract_expires?n.jsxs(n.Fragment,{children:[n.jsx("span",{className:"text-muted",children:"·"}),n.jsxs("span",{className:"text-sm text-muted",children:["Contrat jusqu'en ",new Date(e.contract_expires).getFullYear()]})]}):null]}):null,e.nationalities.length>0?n.jsx("div",{className:"flex items-center gap-2 flex-wrap",children:e.nationalities.map(x=>n.jsxs("span",{className:"inline-flex items-center gap-1.5 text-sm text-muted-light",children:[n.jsx("span",{className:"text-2xl leading-none",children:xe(x)}),x]},x))}):null,n.jsxs("div",{className:"grid grid-cols-3 gap-px overflow-hidden rounded-card border border-border bg-border",children:[n.jsx(G,{label:"Caps RDC",value:e.caps_rdc??0}),n.jsx(G,{label:"Valeur marché",value:pe(e.market_value_eur),muted:!e.market_value_eur}),n.jsx(G,{label:"Buts saison",value:e.season_goals??"—",muted:!e.season_goals})]}),n.jsx(Ke,{text:Ye({eligibilityNote:e.eligibility_note,eligibilityStatus:e.eligibility_status,category:e.player_category,capsRdc:e.caps_rdc})}),n.jsxs("div",{className:"flex flex-wrap gap-2 pt-1",children:[n.jsx(N,{to:"/ma-liste",children:n.jsxs(E,{size:"sm",children:[n.jsx(Be,{className:"h-4 w-4"})," Ajouter à ma liste"]})}),e.transfermarkt_id?n.jsx("a",{href:`https://www.transfermarkt.com/profil/spieler/${e.transfermarkt_id}`,target:"_blank",rel:"noopener noreferrer",children:n.jsxs(E,{variant:"outline",size:"sm",type:"button",children:[n.jsx(Ge,{className:"h-4 w-4"})," Transfermarkt"]})}):null,n.jsx("span",{className:"mx-1 hidden sm:inline-block self-center h-5 w-px bg-border"}),n.jsx(E,{variant:"outline",size:"sm",onClick:()=>v("twitter"),"aria-label":"Partager sur Twitter",children:n.jsx(ze,{className:"h-4 w-4"})}),n.jsx(E,{variant:"outline",size:"sm",onClick:()=>v("whatsapp"),"aria-label":"Partager sur WhatsApp",children:n.jsx(Ve,{className:"h-4 w-4"})}),n.jsx(E,{variant:"outline",size:"sm",onClick:()=>v("copy"),"aria-label":"Copier le lien",children:a?n.jsx($e,{className:"h-4 w-4"}):n.jsx(Qe,{className:"h-4 w-4"})})]})]})]})]})]}),n.jsxs("section",{className:"container-site py-12 border-t border-border",children:[n.jsx("h2",{className:"font-serif text-3xl text-foreground mb-6",children:"Identité."}),n.jsx(Xe,{dateOfBirth:e.date_of_birth,placeOfBirth:e.place_of_birth,countryOfBirth:e.country_of_birth,foot:e.foot,heightCm:e.height_cm}),n.jsx("div",{className:"mt-6",children:n.jsx(tt,{currentClub:e.current_club,contractExpires:e.contract_expires,agent:e.agent,onLoanFrom:e.on_loan_from})})]}),n.jsxs("section",{className:"container-site py-12 border-t border-border",children:[n.jsx("h2",{className:"font-serif text-3xl text-foreground",children:"En sélection RDC."}),n.jsxs("div",{className:"mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6",children:[n.jsx("div",{className:"rounded-card border border-border bg-card p-6 md:p-8",children:n.jsx(ne,{label:"Sélections (caps)",value:e.caps_rdc})}),n.jsxs("div",{className:"rounded-card border border-border bg-card p-6 md:p-8 md:col-span-2",children:[n.jsx("span",{className:"text-[10px] uppercase tracking-[0.25em] text-muted font-mono",children:"Statut d'éligibilité"}),n.jsx("div",{className:"mt-2.5",children:n.jsx("span",{className:C("inline-flex items-center rounded-full border px-3 py-1 text-xs uppercase tracking-wider",ae[e.eligibility_status??"unknown"]??ae.unknown),children:me(e.eligibility_status)})})]})]})]}),n.jsxs("section",{className:"container-site py-12 border-t border-border",children:[n.jsx("h2",{className:"font-serif text-3xl text-foreground",children:"Saison 2025/26 — Club."}),b?n.jsx("div",{className:"mt-6 rounded-card border border-dashed border-border bg-card/30 p-8 text-center",children:n.jsx("p",{className:"text-muted-light text-sm",children:"Statistiques de saison non encore disponibles pour ce profil."})}):n.jsx("div",{className:"mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6",children:[{label:"Matchs",value:e.season_games},{label:"Buts",value:e.season_goals},{label:"Passes décisives",value:e.season_assists},{label:"Note moyenne",value:e.season_rating?e.season_rating.toFixed(2):"—"}].map(x=>n.jsx("div",{className:"rounded-card border border-border bg-card p-6 md:p-8",children:n.jsx(ne,{label:x.label,value:x.value})},x.label))})]}),n.jsx(at,{position:e.position,excludeSlug:e.slug}),n.jsx("div",{className:"container-site py-12",children:n.jsxs(N,{to:m,className:"inline-flex items-center gap-2 text-primary hover:text-primary-hover",children:[n.jsx(ve,{className:"h-4 w-4"})," Retour au ",f]})})]}),n.jsx(K,{})]})}function G({label:t,value:e,muted:r=!1}){return n.jsxs("div",{className:"bg-card px-3 py-3 sm:px-4",children:[n.jsx("div",{className:C("font-serif text-2xl md:text-3xl leading-none",r?"text-muted-light italic":"text-foreground"),children:e}),n.jsx("div",{className:"mt-1 text-[10px] font-mono uppercase tracking-[0.18em] text-muted",children:t})]})}export{rr as default};
