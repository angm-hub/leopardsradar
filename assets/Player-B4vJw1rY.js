import{e as ct,j as l,c as N,r as k,s as Ct,g as Et,N as V,m as Mt,L as M,P as St,a as Tt,b as Nt,f as Lt,h as Pt,B as Y,E as Z,i as Dt,F as $}from"./index-Cp6dqr8t.js";import{A as ht}from"./arrow-left-BL7XX12W.js";/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ot=ct("ExternalLink",[["path",{d:"M15 3h6v6",key:"1q9fwt"}],["path",{d:"M10 14 21 3",key:"gplh6r"}],["path",{d:"M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6",key:"a6xqqp"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const At=ct("Share2",[["circle",{cx:"18",cy:"5",r:"3",key:"gq8acd"}],["circle",{cx:"6",cy:"12",r:"3",key:"w7nqdw"}],["circle",{cx:"18",cy:"19",r:"3",key:"1xt0gg"}],["line",{x1:"8.59",x2:"15.42",y1:"13.51",y2:"17.49",key:"47mynk"}],["line",{x1:"15.41",x2:"8.59",y1:"6.51",y2:"10.49",key:"1n3mei"}]]);function K({label:e,value:t,change:r,className:n}){const o=r==null?void 0:r.trim().startsWith("+");return l.jsxs("div",{className:N("flex flex-col gap-2",n),children:[l.jsx("span",{className:"text-xs uppercase tracking-[0.2em] text-muted",children:e}),l.jsx("span",{className:"font-mono text-4xl md:text-5xl font-semibold text-foreground leading-none",children:t}),r?l.jsx("span",{className:N("text-sm font-medium",o?"text-success":"text-alert"),children:r}):null]})}function tt(e){if(Array.isArray(e))return e.filter(t=>typeof t=="string");if(typeof e=="string")try{const t=JSON.parse(e);return Array.isArray(t)?t.filter(r=>typeof r=="string"):[]}catch{return[]}return[]}function Ft(e){const[t,r]=k.useState(null),[n,o]=k.useState(!0),[a,i]=k.useState(null);return k.useEffect(()=>{if(!e){o(!1);return}let s=!1;return(async()=>{o(!0),i(null);try{const{data:d,error:h}=await Ct.from("players").select("*").eq("slug",e).maybeSingle();if(h)throw h;if(s)return;if(!d)r(null);else{const c=d;r({...c,nationalities:tt(c.nationalities),other_nationalities:tt(c.other_nationalities)})}}catch(d){if(s)return;const h=d instanceof Error?d.message:"Erreur inconnue";console.error("[usePlayer]",h),i(h),r(null)}finally{s||o(!1)}})(),()=>{s=!0}},[e]),{player:t,loading:n,error:a}}var Ht=Object.defineProperty,qt=Object.getOwnPropertyNames,C=(e,t)=>function(){return e&&(t=(0,e[qt(e)[0]])(e=0)),t},Q=(e,t)=>{for(var r in t)Ht(e,r,{get:t[r],enumerable:!0})};function H(e){const t=e/255;return t<=.04045?t/12.92:Math.pow((t+.055)/1.055,2.4)}function q(e){const t=e<=.0031308?12.92*e:1.055*Math.pow(e,.4166666666666667)-.055;return Math.round(Math.max(0,Math.min(255,t*255)))}function dt(e,t,r){const n=H(e),o=H(t),a=H(r),i=.4122214708*n+.5363325363*o+.0514459929*a,s=.2119034982*n+.6806995451*o+.1073969566*a,d=.0883024619*n+.2817188376*o+.6299787005*a,h=Math.cbrt(i),c=Math.cbrt(s),u=Math.cbrt(d),m=.2104542553*h+.793617785*c-.0040720468*u,f=1.9779984951*h-2.428592205*c+.4505937099*u,g=.0259040371*h+.7827717662*c-.808675766*u,v=Math.sqrt(f*f+g*g);let _=Math.atan2(g,f)*(180/Math.PI);return _<0&&(_+=360),{l:m,c:v,h:_}}function Wt(e,t,r){const n=r*(Math.PI/180),o=t*Math.cos(n),a=t*Math.sin(n),i=e+.3963377774*o+.2158037573*a,s=e-.1055613458*o-.0638541728*a,d=e-.0894841775*o-1.291485548*a,h=i*i*i,c=s*s*s,u=d*d*d,m=4.0767416621*h-3.3077115913*c+.2309699292*u,f=-1.2684380046*h+2.6097574011*c-.3413193965*u,g=-.0041960863*h-.7034186147*c+1.707614701*u;return[q(m),q(f),q(g)]}function Rt(e){const t=new Array(e.length);for(let r=0;r<e.length;r++){const[n,o,a]=e[r],{l:i,c:s,h:d}=dt(n,o,a);t[r]=[Math.round(i*255),Math.round(s/.4*255),Math.round(d/360*255)]}return t}function Bt(e){return e.map(({color:[t,r,n],population:o})=>{const a=t/255,i=r/255*.4,s=n/255*360;return{color:Wt(a,i,s),population:o}})}var ut=C({"src/color-space.ts"(){}});function zt(e,t,r){const n=e/255,o=t/255,a=r/255,i=Math.max(n,o,a),s=Math.min(n,o,a),d=(i+s)/2;let h=0,c=0;if(i!==s){const u=i-s;c=d>.5?u/(2-i-s):u/(i+s),i===n?h=((o-a)/u+(o<a?6:0))/6:i===o?h=((a-n)/u+2)/6:h=((n-o)/u+4)/6}return{h:Math.round(h*360),s:Math.round(c*100),l:Math.round(d*100)}}function Vt(e,t,r){const n=o=>{const a=o/255;return a<=.04045?a/12.92:Math.pow((a+.055)/1.055,2.4)};return .2126*n(e)+.7152*n(t)+.0722*n(r)}function et(e,t){const r=Math.max(e,t),n=Math.min(e,t);return(r+.05)/(n+.05)}function y(e,t,r,n,o=0){return new mt(e,t,r,n,o)}var mt,P=C({"src/color.ts"(){ut(),mt=class{constructor(e,t,r,n,o){this._r=e,this._g=t,this._b=r,this.population=n,this.proportion=o}rgb(){return{r:this._r,g:this._g,b:this._b}}hex(){const e=t=>t.toString(16).padStart(2,"0");return`#${e(this._r)}${e(this._g)}${e(this._b)}`}hsl(){return this._hsl||(this._hsl=zt(this._r,this._g,this._b)),this._hsl}oklch(){return this._oklch||(this._oklch=dt(this._r,this._g,this._b)),this._oklch}css(e="rgb"){switch(e){case"hsl":{const{h:t,s:r,l:n}=this.hsl();return`hsl(${t}, ${r}%, ${n}%)`}case"oklch":{const{l:t,c:r,h:n}=this.oklch();return`oklch(${t.toFixed(3)} ${r.toFixed(3)} ${n.toFixed(1)})`}case"rgb":default:return`rgb(${this._r}, ${this._g}, ${this._b})`}}array(){return[this._r,this._g,this._b]}toString(){return this.hex()}get textColor(){return this.isDark?"#ffffff":"#000000"}get luminance(){return this._luminance===void 0&&(this._luminance=Vt(this._r,this._g,this._b)),this._luminance}get isDark(){return this.luminance<=.179}get isLight(){return!this.isDark}get contrast(){if(!this._contrast){const e=this.luminance,t=et(e,1),r=et(e,0),n=this.isDark?y(255,255,255,0,0):y(0,0,0,0,0);this._contrast={white:Math.round(t*100)/100,black:Math.round(r*100)/100,foreground:n}}return this._contrast}}}}),ft={};Q(ft,{computeFallbackColor:()=>gt,createPixelArray:()=>S,extractPalette:()=>O,validateOptions:()=>D});function D(e){let{colorCount:t,quality:r}=e;if(typeof t>"u"||!Number.isInteger(t))t=10;else{if(t===1)throw new Error("colorCount should be between 2 and 20. To get one color, call getColor() instead of getPalette()");t=Math.max(t,2),t=Math.min(t,20)}(typeof r>"u"||!Number.isInteger(r)||r<1)&&(r=10);const n=e.ignoreWhite!==void 0?!!e.ignoreWhite:!0,o=typeof e.whiteThreshold=="number"?e.whiteThreshold:250,a=typeof e.alphaThreshold=="number"?e.alphaThreshold:125,i=typeof e.minSaturation=="number"?Math.max(0,Math.min(1,e.minSaturation)):0,s=e.colorSpace??"oklch";return{colorCount:t,quality:r,ignoreWhite:n,whiteThreshold:o,alphaThreshold:a,minSaturation:i,colorSpace:s}}function S(e,t,r,n){const{ignoreWhite:o=!0,whiteThreshold:a=250,alphaThreshold:i=125,minSaturation:s=0}=n,d=[];for(let h=0;h<t;h+=r){const c=h*4,u=e[c],m=e[c+1],f=e[c+2],g=e[c+3];if(!(g!==void 0&&g<i)&&!(o&&u>a&&m>a&&f>a)){if(s>0){const v=Math.max(u,m,f);if(v===0||(v-Math.min(u,m,f))/v<s)continue}d.push([u,m,f])}}return d}function gt(e,t,r){let n=0,o=0,a=0,i=0;for(let s=0;s<t;s+=r){const d=s*4;n+=e[d],o+=e[d+1],a+=e[d+2],i++}return i===0?null:[Math.round(n/i),Math.round(o/i),Math.round(a/i)]}function O(e,t,r,n,o){const a=t*r,i={ignoreWhite:n.ignoreWhite,whiteThreshold:n.whiteThreshold,alphaThreshold:n.alphaThreshold,minSaturation:n.minSaturation};let s=S(e,a,n.quality,i);s.length===0&&(s=S(e,a,n.quality,{...i,ignoreWhite:!1})),s.length===0&&(s=S(e,a,n.quality,{...i,ignoreWhite:!1,alphaThreshold:0}));let d;if(n.colorSpace==="oklch"){const c=Rt(s);d=Bt(o.quantize(c,n.colorCount))}else d=o.quantize(s,n.colorCount);if(d.length>0){const c=d.reduce((u,m)=>u+m.population,0);return d.map(({color:[u,m,f],population:g})=>y(u,m,f,g,c>0?g/c:0))}const h=gt(e,a,n.quality);return h?[y(h[0],h[1],h[2],1,1)]:null}var A=C({"src/pipeline.ts"(){P(),ut()}}),xt={};Q(xt,{BrowserPixelLoader:()=>G});var G,pt=C({"src/loaders/browser.ts"(){G=class{async load(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement)return this.loadFromImage(e);if(typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement)return this.loadFromCanvas(e);if(typeof ImageData<"u"&&e instanceof ImageData)return{data:e.data,width:e.width,height:e.height};if(typeof HTMLVideoElement<"u"&&e instanceof HTMLVideoElement)return this.loadFromVideo(e);if(typeof ImageBitmap<"u"&&e instanceof ImageBitmap)return this.loadFromImageBitmap(e);if(typeof OffscreenCanvas<"u"&&e instanceof OffscreenCanvas)return this.loadFromOffscreenCanvas(e);throw new Error("Unsupported source type. Expected HTMLImageElement, HTMLCanvasElement, HTMLVideoElement, ImageData, ImageBitmap, or OffscreenCanvas.")}loadFromImage(e){if(!e.complete)throw new Error('Image has not finished loading. Wait for the "load" event before calling getColor/getPalette.');if(!e.naturalWidth)throw new Error("Image has no dimensions. It may not have loaded successfully.");const t=document.createElement("canvas"),r=t.getContext("2d"),n=t.width=e.naturalWidth,o=t.height=e.naturalHeight;r.drawImage(e,0,0,n,o);try{return{data:r.getImageData(0,0,n,o).data,width:n,height:o}}catch(a){if(a instanceof DOMException&&a.name==="SecurityError"){const i=new Error('Image is tainted by cross-origin data. Add crossorigin="anonymous" to the <img> tag and ensure the server sends appropriate CORS headers.');throw i.cause=a,i}throw a}}loadFromCanvas(e){const t=e.getContext("2d"),{width:r,height:n}=e;return{data:t.getImageData(0,0,r,n).data,width:r,height:n}}loadFromVideo(e){if(e.readyState<2)throw new Error('Video is not ready. Wait for the "loadeddata" or "canplay" event before calling getColor/getPalette.');const t=e.videoWidth,r=e.videoHeight;if(!t||!r)throw new Error("Video has no dimensions. It may not have loaded successfully.");const n=document.createElement("canvas"),o=n.getContext("2d");return n.width=t,n.height=r,o.drawImage(e,0,0,t,r),{data:o.getImageData(0,0,t,r).data,width:t,height:r}}loadFromOffscreenCanvas(e){const t=e.getContext("2d");if(!t)throw new Error("Could not get 2D context from OffscreenCanvas.");const{width:r,height:n}=e;return{data:t.getImageData(0,0,r,n).data,width:r,height:n}}loadFromImageBitmap(e){const t=document.createElement("canvas"),r=t.getContext("2d");return t.width=e.width,t.height=e.height,r.drawImage(e,0,0),{data:r.getImageData(0,0,e.width,e.height).data,width:e.width,height:e.height}}}}}),bt,$t=C({"src/worker/worker-script.ts"(){bt=`
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
`}}),vt={};Q(vt,{extractInWorker:()=>Gt,isWorkerSupported:()=>wt,terminateWorker:()=>Ut});function wt(){return typeof Worker<"u"}function Qt(){if(x)return x;if(!wt())throw new Error("Web Workers are not supported in this environment.");return j=URL.createObjectURL(new Blob([bt],{type:"application/javascript"})),x=new Worker(j),x.onmessage=e=>{const{id:t,palette:r,error:n}=e.data,o=p.get(t);if(o)if(p.delete(t),n)o.reject(new Error(n));else{const a=r,i=a.reduce((d,h)=>d+h.population,0),s=a.map(({color:[d,h,c],population:u})=>y(d,h,c,u,i>0?u/i:0));o.resolve(s)}},x.onerror=e=>{for(const[,t]of p)t.reject(new Error(e.message));p.clear()},x}function Gt(e,t,r){return new Promise((n,o)=>{if(r!=null&&r.aborted){o(r.reason??new DOMException("Aborted","AbortError"));return}const a=yt++;p.set(a,{resolve:n,reject:o});const i=()=>{p.delete(a),o(r.reason??new DOMException("Aborted","AbortError"))};r==null||r.addEventListener("abort",i,{once:!0});try{Qt().postMessage({id:a,pixels:e,maxColors:t})}catch(s){p.delete(a),r==null||r.removeEventListener("abort",i),o(s)}})}function Ut(){x&&(x.terminate(),x=null),j&&(URL.revokeObjectURL(j),j=null);for(const[,e]of p)e.reject(new Error("Worker terminated"));p.clear()}var x,j,yt,p,Jt=C({"src/worker/manager.ts"(){P(),$t(),x=null,j=null,yt=0,p=new Map}});A();A();var W=[{divisor:16,progress:.06},{divisor:4,progress:.25},{divisor:1,progress:1}];function Xt(){return new Promise(e=>setTimeout(e,0))}async function*Yt(e,t,r,n,o,a){for(let i=0;i<W.length;i++){if(a!=null&&a.aborted)throw a.reason??new DOMException("Aborted","AbortError");const s=W[i],d={...n,quality:n.quality*s.divisor},h=O(e,t,r,d,o),c=i===W.length-1;yield{palette:h??[],progress:s.progress,done:c},c||await Xt()}}P();var R=[{role:"Vibrant",targetL:.65,minL:.4,maxL:.85,targetC:.2,minC:.08},{role:"Muted",targetL:.65,minL:.4,maxL:.85,targetC:.04,minC:0},{role:"DarkVibrant",targetL:.3,minL:0,maxL:.45,targetC:.2,minC:.08},{role:"DarkMuted",targetL:.3,minL:0,maxL:.45,targetC:.04,minC:0},{role:"LightVibrant",targetL:.85,minL:.7,maxL:1,targetC:.2,minC:.08},{role:"LightMuted",targetL:.85,minL:.7,maxL:1,targetC:.04,minC:0}],Zt=6,Kt=3,te=1;function rt(e,t,r){const{l:n,c:o}=e.oklch();if(n<t.minL||n>t.maxL||o<t.minC)return-1/0;const a=1-Math.abs(n-t.targetL),i=1-Math.min(Math.abs(o-t.targetC)/.2,1),s=r>0?e.population/r:0;return a*Zt+i*Kt+s*te}var nt=y(255,255,255,0),at=y(0,0,0,0);function ot(e){return{title:e.isDark?nt:at,body:e.isDark?nt:at}}function _t(e){const t=Math.max(...e.map(a=>a.population),1),r=[];for(const a of R){let i=null,s=-1/0;for(const d of e){const h=rt(d,a,t);h>s&&(s=h,i=d)}i&&s>-1/0&&r.push({role:a.role,color:i,score:s})}const n=new Set,o={};r.sort((a,i)=>i.score-a.score);for(const a of r)if(n.has(a.color)){const i=R.find(h=>h.role===a.role);let s=null,d=-1/0;for(const h of e){if(n.has(h))continue;const c=rt(h,i,t);c>d&&(d=c,s=h)}if(s&&d>-1/0){n.add(s);const{title:h,body:c}=ot(s);o[a.role]={color:s,role:a.role,titleTextColor:h,bodyTextColor:c}}else o[a.role]=null}else{n.add(a.color);const{title:i,body:s}=ot(a.color);o[a.role]={color:a.color,role:a.role,titleTextColor:i,bodyTextColor:s}}for(const a of R)a.role in o||(o[a.role]=null);return o}var L=5,b=8-L,ee=1e3,re=.75,ne=1<<3*L;function I(e,t,r){return(e<<2*L)+(t<<L)+r}var ae=class kt{constructor(t,r,n,o,a,i,s){this.r1=t,this.r2=r,this.g1=n,this.g2=o,this.b1=a,this.b2=i,this.histo=s}volume(t=!1){return(this._volume===void 0||t)&&(this._volume=(this.r2-this.r1+1)*(this.g2-this.g1+1)*(this.b2-this.b1+1)),this._volume}count(t=!1){if(this._count===void 0||t){let r=0;for(let n=this.r1;n<=this.r2;n++)for(let o=this.g1;o<=this.g2;o++)for(let a=this.b1;a<=this.b2;a++)r+=this.histo[I(n,o,a)]||0;this._count=r}return this._count}copy(){return new kt(this.r1,this.r2,this.g1,this.g2,this.b1,this.b2,this.histo)}avg(t=!1){if(this._avg===void 0||t){const r=1<<b;if(this.r1===this.r2&&this.g1===this.g2&&this.b1===this.b2)this._avg=[this.r1<<b,this.g1<<b,this.b1<<b];else{let n=0,o=0,a=0,i=0;for(let s=this.r1;s<=this.r2;s++)for(let d=this.g1;d<=this.g2;d++)for(let h=this.b1;h<=this.b2;h++){const c=this.histo[I(s,d,h)]||0;n+=c,o+=c*(s+.5)*r,a+=c*(d+.5)*r,i+=c*(h+.5)*r}n?this._avg=[~~(o/n),~~(a/n),~~(i/n)]:this._avg=[~~(r*(this.r1+this.r2+1)/2),~~(r*(this.g1+this.g2+1)/2),~~(r*(this.b1+this.b2+1)/2)]}}return this._avg}},it=class{constructor(e){this.comparator=e,this.contents=[],this.sorted=!1}sort(){this.contents.sort(this.comparator),this.sorted=!0}push(e){this.contents.push(e),this.sorted=!1}peek(e){return this.sorted||this.sort(),this.contents[e??this.contents.length-1]}pop(){return this.sorted||this.sort(),this.contents.pop()}size(){return this.contents.length}map(e){return this.contents.map(e)}};function oe(e){const t=new Uint32Array(ne);for(const r of e){const n=r[0]>>b,o=r[1]>>b,a=r[2]>>b;t[I(n,o,a)]++}return t}function ie(e,t){let r=1e6,n=0,o=1e6,a=0,i=1e6,s=0;for(const d of e){const h=d[0]>>b,c=d[1]>>b,u=d[2]>>b;h<r?r=h:h>n&&(n=h),c<o?o=c:c>a&&(a=c),u<i?i=u:u>s&&(s=u)}return new ae(r,n,o,a,i,s,t)}function se(e,t){if(!t.count())return;if(t.count()===1)return[t.copy(),null];const r=t.r2-t.r1+1,n=t.g2-t.g1+1,o=t.b2-t.b1+1,a=Math.max(r,n,o);let i=0;const s=[],d=[];if(a===r)for(let c=t.r1;c<=t.r2;c++){let u=0;for(let m=t.g1;m<=t.g2;m++)for(let f=t.b1;f<=t.b2;f++)u+=e[I(c,m,f)]||0;i+=u,s[c]=i}else if(a===n)for(let c=t.g1;c<=t.g2;c++){let u=0;for(let m=t.r1;m<=t.r2;m++)for(let f=t.b1;f<=t.b2;f++)u+=e[I(m,c,f)]||0;i+=u,s[c]=i}else for(let c=t.b1;c<=t.b2;c++){let u=0;for(let m=t.r1;m<=t.r2;m++)for(let f=t.g1;f<=t.g2;f++)u+=e[I(m,f,c)]||0;i+=u,s[c]=i}s.forEach((c,u)=>{d[u]=i-c});function h(c){const u=c+"1",m=c+"2";for(let f=t[u];f<=t[m];f++)if(s[f]>i/2){const g=t.copy(),v=t.copy(),_=f-t[u],J=t[m]-f;let w;for(_<=J?w=Math.min(t[m]-1,~~(f+J/2)):w=Math.max(t[u],~~(f-1-_/2));!s[w];)w++;let X=d[w];for(;!X&&s[w-1];)X=d[--w];return g[m]=w,v[u]=g[m]+1,[g,v]}}return h(a===r?"r":a===n?"g":"b")}function st(e,t,r){let n=e.size(),o=0;for(;o<ee;){if(n>=t)return;o++;const a=e.pop();if(!a.count()){e.push(a);continue}const i=se(r,a);if(!i||!i[0])return;e.push(i[0]),i[1]&&(e.push(i[1]),n++)}}function le(e,t){if(!e.length||t<2||t>256)return[];const r=new Set,n=[];for(const h of e){const c=h.join(",");r.has(c)||(r.add(c),n.push(h))}if(n.length<=t){const h=new Map;for(const c of e){const u=c.join(",");h.set(u,(h.get(u)||0)+1)}return n.map(c=>({color:c,population:h.get(c.join(","))}))}const o=oe(e),a=ie(e,o),i=new it((h,c)=>h.count()-c.count());i.push(a),st(i,re*t,o);const s=new it((h,c)=>h.count()*h.volume()-c.count()*c.volume());for(;i.size();)s.push(i.pop());st(s,t,o);const d=[];for(;s.size();){const h=s.pop();d.push({color:h.avg(),population:h.count()})}return d}var jt=class{async init(){}quantize(e,t){return le(e,t)}};async function ce(){const{BrowserPixelLoader:e}=await Promise.resolve().then(()=>(pt(),xt));return new e}var E=null,T=null;function he(e){e.loader&&(E=e.loader),e.quantizer&&(T=e.quantizer)}async function de(e){return e||E||(E=await ce(),E)}async function It(e){if(e)return await e.init(),e;if(T)return T;const t=new jt;return await t.init(),T=t,t}function B(e){if(e!=null&&e.aborted)throw e.reason??new DOMException("Aborted","AbortError")}async function z(e,t){return B(t==null?void 0:t.signal),(await de(t==null?void 0:t.loader)).load(e,t==null?void 0:t.signal)}async function ue(e,t){const r=await U(e,{colorCount:5,...t});return r?r[0]:null}async function U(e,t){const r=D(t??{});if(B(t==null?void 0:t.signal),t!=null&&t.worker){const{isWorkerSupported:a,extractInWorker:i}=await Promise.resolve().then(()=>(Jt(),vt));if(a()){const{data:s,width:d,height:h}=await z(e,t),{createPixelArray:c}=await Promise.resolve().then(()=>(A(),ft)),u=c(s,d*h,r.quality,{ignoreWhite:r.ignoreWhite,whiteThreshold:r.whiteThreshold,alphaThreshold:r.alphaThreshold,minSaturation:r.minSaturation});return i(u,r.colorCount,t==null?void 0:t.signal)}}const[n,o]=await Promise.all([z(e,t),It(t==null?void 0:t.quantizer)]);return B(t==null?void 0:t.signal),O(n.data,n.width,n.height,r,o)}async function me(e,t){const r=await U(e,{colorCount:16,...t});return _t(r??[])}async function*fe(e,t){const r=D(t??{}),[n,o]=await Promise.all([z(e,t),It(t==null?void 0:t.quantizer)]);yield*Yt(n.data,n.width,n.height,r,o,t==null?void 0:t.signal)}pt();A();new G;var ge=new jt;function xe(e,t){const r=F(e,{colorCount:5,...t});return r?r[0]:null}function F(e,t){const r=D(t??{}),n=(t==null?void 0:t.quantizer)??ge,o=be(e);return O(o.data,o.width,o.height,r,n)}function pe(e,t){const r=F(e,{colorCount:16,...t});return _t(r??[])}function be(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement)return ve(e);if(typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement)return we(e);if(typeof ImageData<"u"&&e instanceof ImageData)return{data:e.data,width:e.width,height:e.height};if(typeof HTMLVideoElement<"u"&&e instanceof HTMLVideoElement)return ye(e);if(typeof ImageBitmap<"u"&&e instanceof ImageBitmap)return ke(e);if(typeof OffscreenCanvas<"u"&&e instanceof OffscreenCanvas)return _e(e);throw new Error("Unsupported source type. Expected HTMLImageElement, HTMLCanvasElement, HTMLVideoElement, ImageData, ImageBitmap, or OffscreenCanvas.")}function ve(e){if(!e.complete)throw new Error('Image has not finished loading. Wait for the "load" event before calling getColorSync/getPaletteSync.');if(!e.naturalWidth)throw new Error("Image has no dimensions. It may not have loaded successfully.");const t=document.createElement("canvas"),r=t.getContext("2d"),n=t.width=e.naturalWidth,o=t.height=e.naturalHeight;r.drawImage(e,0,0,n,o);try{return{data:r.getImageData(0,0,n,o).data,width:n,height:o}}catch(a){if(a instanceof DOMException&&a.name==="SecurityError"){const i=new Error('Image is tainted by cross-origin data. Add crossorigin="anonymous" to the <img> tag and ensure the server sends appropriate CORS headers.');throw i.cause=a,i}throw a}}function we(e){const t=e.getContext("2d"),{width:r,height:n}=e;return{data:t.getImageData(0,0,r,n).data,width:r,height:n}}function ye(e){if(e.readyState<2)throw new Error('Video is not ready. Wait for the "loadeddata" or "canplay" event before calling getColorSync/getPaletteSync.');const t=e.videoWidth,r=e.videoHeight;if(!t||!r)throw new Error("Video has no dimensions. It may not have loaded successfully.");const n=document.createElement("canvas"),o=n.getContext("2d");return n.width=t,n.height=r,o.drawImage(e,0,0,t,r),{data:o.getImageData(0,0,t,r).data,width:t,height:r}}function _e(e){const t=e.getContext("2d");if(!t)throw new Error("Could not get 2D context from OffscreenCanvas.");const{width:r,height:n}=e;return{data:t.getImageData(0,0,r,n).data,width:r,height:n}}function ke(e){const t=document.createElement("canvas"),r=t.getContext("2d");return t.width=e.width,t.height=e.height,r.drawImage(e,0,0),{data:r.getImageData(0,0,e.width,e.height).data,width:e.width,height:e.height}}function je(e,t){const{throttle:r=200,onChange:n,...o}=t;let a=!1,i=null,s=null,d=0;const h=[];function c(){try{const m=F(e,o);m&&m.length>0&&n(m)}catch{}}function u(){if(a)return;const m=performance.now();m-d>=r&&(e instanceof HTMLVideoElement?e.readyState>=2&&!e.paused&&!e.ended&&(c(),d=m):(c(),d=m)),i=requestAnimationFrame(u)}if(e instanceof HTMLImageElement){if(e.complete&&e.naturalWidth)c();else{const m=()=>{c(),e.removeEventListener("load",m)};e.addEventListener("load",m),h.push(()=>e.removeEventListener("load",m))}s=new MutationObserver(()=>{if(e.complete&&e.naturalWidth)c();else{const m=()=>{c(),e.removeEventListener("load",m)};e.addEventListener("load",m)}}),s.observe(e,{attributes:!0,attributeFilter:["src","srcset"]})}else if(e instanceof HTMLVideoElement){i=requestAnimationFrame(u);const m=()=>{a||c()};e.addEventListener("seeked",m),h.push(()=>e.removeEventListener("seeked",m))}else i=requestAnimationFrame(u);return{stop(){a=!0,i!==null&&(cancelAnimationFrame(i),i=null),s&&(s.disconnect(),s=null);for(const m of h)m();h.length=0}}}P();const Ie=Object.freeze(Object.defineProperty({__proto__:null,configure:he,createColor:y,getColor:ue,getColorSync:xe,getPalette:U,getPaletteProgressive:fe,getPaletteSync:F,getSwatches:me,getSwatchesSync:pe,observe:je},Symbol.toStringTag,{value:"Module"})),Ce=Ie;function Ee(e){const[t,r]=k.useState(null);return k.useEffect(()=>{if(!e){r(null);return}let n=!1;const o=new Image;return o.crossOrigin="Anonymous",o.src=e,o.onload=()=>{if(!n)try{const i=new Ce().getColor(o);i&&!n&&r(i)}catch{n||r(null)}},o.onerror=()=>{n||r(null)},()=>{n=!0}},[e]),t}const Me="data:image/svg+xml;utf8,"+encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.6 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>");function Se(){return l.jsxs("div",{className:"min-h-screen bg-background",children:[l.jsx(V,{}),l.jsxs("main",{className:"container-site flex min-h-[70vh] flex-col items-center justify-center py-32 text-center",children:[l.jsx("h1",{className:"font-serif text-5xl text-foreground",children:"Joueur introuvable."}),l.jsx("p",{className:"mt-4 text-muted",children:"Ce profil n'existe pas (encore)."}),l.jsxs(M,{to:"/roster",className:"mt-8 inline-flex items-center gap-2 text-primary hover:text-primary-hover",children:[l.jsx(ht,{className:"h-4 w-4"})," Retour au Roster"]})]}),l.jsx($,{})]})}function Te(){return l.jsxs("div",{className:"min-h-screen bg-background",children:[l.jsx(V,{}),l.jsx("main",{className:"container-site pt-32 pb-20",children:l.jsxs("div",{className:"grid grid-cols-1 gap-12 md:grid-cols-5",children:[l.jsx("div",{className:"aspect-[3/4] w-full rounded-card border border-border bg-gradient-to-r from-card via-card-hover to-card animate-shimmer md:col-span-2",style:{backgroundSize:"200% 100%"}}),l.jsxs("div",{className:"md:col-span-3 flex flex-col gap-4",children:[l.jsx("div",{className:"h-16 w-3/4 rounded bg-card animate-shimmer",style:{backgroundSize:"200% 100%"}}),l.jsx("div",{className:"h-6 w-1/2 rounded bg-card animate-shimmer",style:{backgroundSize:"200% 100%"}})]})]})}),l.jsx($,{})]})}function lt(e){if(!e)return"—";const t=new Date(e);return Number.isNaN(t.getTime())?"—":t.toLocaleDateString("fr-FR",{day:"2-digit",month:"long",year:"numeric"})}function Pe(){const{slug:e}=Et(),{player:t,loading:r}=Ft(e),n=Ee((t==null?void 0:t.image_url)??void 0),[o,a,i]=n??[60,60,70],s=`linear-gradient(180deg, rgba(${o}, ${a}, ${i}, 0.42) 0%, rgba(${o}, ${a}, ${i}, 0.18) 45%, #0A0A0B 100%)`,d=n?`0 20px 80px rgba(${o}, ${a}, ${i}, 0.35), 0 8px 24px rgba(0,0,0,0.5)`:"0 20px 80px rgba(0,0,0,0.5)";if(r)return l.jsx(Te,{});if(!t)return l.jsx(Se,{});const h=t.player_category==="roster",c=h?"/roster":"/radar",u=h?"Roster":"Radar",m=!t.season_games&&!t.season_goals&&!t.season_assists&&!t.season_minutes&&!t.season_rating;return l.jsxs("div",{className:"min-h-screen bg-background",children:[l.jsx(V,{}),l.jsxs("main",{children:[l.jsxs("section",{className:"relative overflow-hidden bg-background",children:[l.jsx(Mt.div,{"aria-hidden":!0,className:"absolute inset-0",style:{background:s},initial:{opacity:0},animate:{opacity:1},transition:{duration:.8,ease:"easeOut"}},n?`${o}-${a}-${i}`:"fallback"),l.jsx("div",{"aria-hidden":!0,className:"absolute inset-0 pointer-events-none mix-blend-overlay",style:{backgroundImage:`url("${Me}")`,opacity:.03}}),l.jsx("div",{"aria-hidden":!0,className:"absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-transparent to-background"}),l.jsxs("div",{className:"container-site relative z-10 pt-28 pb-20",children:[l.jsxs("nav",{className:"mb-8 text-sm text-muted",children:[l.jsx(M,{to:"/",className:"hover:text-foreground",children:"Home"}),l.jsx("span",{className:"mx-2 opacity-50",children:"/"}),l.jsx(M,{to:c,className:"hover:text-foreground",children:u}),l.jsx("span",{className:"mx-2 opacity-50",children:"/"}),l.jsx("span",{className:"text-foreground/80",children:t.name})]}),l.jsxs("div",{className:"grid grid-cols-1 gap-12 md:grid-cols-5",children:[l.jsxs("div",{className:"md:col-span-2",children:[l.jsx(St,{name:t.name,src:t.image_url,className:"aspect-[3/4] w-full rounded-card transition-shadow duration-700",initialsClassName:"text-9xl"}),l.jsx("div",{"aria-hidden":!0,className:"pointer-events-none -mt-[100%] aspect-[3/4] w-full rounded-card",style:{boxShadow:d}})]}),l.jsxs("div",{className:"flex flex-col gap-6 md:col-span-3",children:[l.jsx("h1",{className:"font-serif text-5xl md:text-7xl font-semibold leading-[1.05] text-balance text-foreground",children:t.name}),l.jsxs("div",{className:"flex flex-wrap gap-2",children:[t.position?l.jsx("span",{className:N("inline-flex items-center rounded-full border px-3 py-1 text-xs uppercase tracking-wider",Tt[t.position]),children:Nt[t.position]}):null,t.foot?l.jsxs("span",{className:"rounded-full border border-border bg-card/60 px-3 py-1 text-xs uppercase tracking-wider text-muted-light backdrop-blur-sm",children:["Pied ",t.foot==="left"?"gauche":t.foot==="right"?"droit":"ambidextre"]}):null,t.age?l.jsxs("span",{className:"rounded-full border border-border bg-card/60 px-3 py-1 text-xs uppercase tracking-wider text-muted-light backdrop-blur-sm",children:[t.age," ans"]}):null,t.height_cm?l.jsxs("span",{className:"rounded-full border border-border bg-card/60 px-3 py-1 text-xs uppercase tracking-wider text-muted-light backdrop-blur-sm",children:[t.height_cm," cm"]}):null]}),t.current_club?l.jsxs("div",{className:"flex flex-wrap items-center gap-3",children:[l.jsx("span",{className:"text-lg font-semibold text-foreground",children:t.current_club}),t.contract_expires?l.jsxs(l.Fragment,{children:[l.jsx("span",{className:"text-muted",children:"·"}),l.jsxs("span",{className:"text-sm text-muted",children:["Contrat jusqu'en ",new Date(t.contract_expires).getFullYear()]})]}):null]}):null,t.nationalities.length>0?l.jsx("div",{className:"flex items-center gap-2 flex-wrap",children:t.nationalities.map(f=>l.jsxs("span",{className:"inline-flex items-center gap-1.5 text-sm text-muted-light",children:[l.jsx("span",{className:"text-2xl leading-none",children:Lt(f)}),f]},f))}):null,l.jsxs("p",{className:"text-sm text-muted-light",children:[l.jsx("span",{className:"text-muted",children:"Valeur marchande · "}),l.jsx("span",{className:t.market_value_eur?"text-foreground font-semibold":"text-muted italic",children:Pt(t.market_value_eur)})]}),l.jsxs("div",{className:"flex flex-wrap gap-3",children:[t.transfermarkt_id?l.jsx("a",{href:`https://www.transfermarkt.com/profil/spieler/${t.transfermarkt_id}`,target:"_blank",rel:"noopener noreferrer",children:l.jsxs(Y,{variant:"outline",size:"sm",type:"button",children:[l.jsx(Ot,{className:"h-4 w-4"})," Transfermarkt"]})}):null,l.jsxs(Y,{variant:"outline",size:"sm",children:[l.jsx(At,{className:"h-4 w-4"})," Partager"]})]})]})]})]})]}),l.jsxs("section",{className:"container-site py-16",children:[l.jsx("h2",{className:"font-serif text-3xl text-foreground",children:"Infos."}),l.jsx("dl",{className:"mt-8 grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-6",children:[["Date de naissance",lt(t.date_of_birth)],["Lieu de naissance",t.place_of_birth??"—"],["Pays de naissance",t.country_of_birth??"—"],["Taille",t.height_cm?`${t.height_cm} cm`:"—"],["Pied fort",t.foot?t.foot==="left"?"Gauche":t.foot==="right"?"Droit":"Ambidextre":"—"],["Agent",t.agent??"—"],["Fin de contrat",lt(t.contract_expires)],["Prêté par",t.on_loan_from??"—"]].map(([f,g])=>l.jsxs("div",{children:[l.jsx("dt",{className:"text-xs uppercase tracking-[0.2em] text-muted",children:f}),l.jsx("dd",{className:"mt-1 text-foreground",children:g})]},f))})]}),l.jsxs("section",{className:"container-site py-16 border-t border-border",children:[l.jsx("h2",{className:"font-serif text-3xl text-foreground",children:"En sélection RDC."}),l.jsxs("div",{className:"mt-8 grid grid-cols-1 md:grid-cols-3 gap-6",children:[l.jsx("div",{className:"rounded-card border border-border bg-card p-8",children:l.jsx(K,{label:"Sélections (caps)",value:t.caps_rdc})}),l.jsxs("div",{className:"rounded-card border border-border bg-card p-8 md:col-span-2",children:[l.jsx("span",{className:"text-xs uppercase tracking-[0.2em] text-muted",children:"Statut d'éligibilité"}),l.jsx("div",{className:"mt-2",children:l.jsx("span",{className:N("inline-flex items-center rounded-full border px-3 py-1 text-xs uppercase tracking-wider",Z[t.eligibility_status??"unknown"]??Z.unknown),children:Dt(t.eligibility_status)})}),t.eligibility_note?l.jsx("p",{className:"mt-4 text-foreground/80 leading-relaxed",children:t.eligibility_note}):null]})]})]}),l.jsxs("section",{className:"container-site py-16 border-t border-border",children:[l.jsx("h2",{className:"font-serif text-3xl text-foreground",children:"Saison 2025/26 — Club."}),m?l.jsx("p",{className:"mt-6 text-muted italic",children:"Pas encore disponible."}):l.jsx("div",{className:"mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6",children:[{label:"Matchs",value:t.season_games},{label:"Buts",value:t.season_goals},{label:"Passes décisives",value:t.season_assists},{label:"Note moyenne",value:t.season_rating?t.season_rating.toFixed(2):"—"}].map(f=>l.jsx("div",{className:"rounded-card border border-border bg-card p-8",children:l.jsx(K,{label:f.label,value:f.value})},f.label))})]}),l.jsx("div",{className:"container-site py-12",children:l.jsxs(M,{to:c,className:"inline-flex items-center gap-2 text-primary hover:text-primary-hover",children:[l.jsx(ht,{className:"h-4 w-4"})," Retour au ",u]})})]}),l.jsx($,{})]})}export{Pe as default};
