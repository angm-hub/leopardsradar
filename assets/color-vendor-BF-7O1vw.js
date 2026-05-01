var dt=Object.defineProperty,mt=Object.getOwnPropertyNames,C=(t,e)=>function(){return t&&(e=(0,t[mt(t)[0]])(t=0)),e},R=(t,e)=>{for(var r in e)dt(t,r,{get:e[r],enumerable:!0})};function O(t){const e=t/255;return e<=.04045?e/12.92:Math.pow((e+.055)/1.055,2.4)}function W(t){const e=t<=.0031308?12.92*t:1.055*Math.pow(t,.4166666666666667)-.055;return Math.round(Math.max(0,Math.min(255,e*255)))}function Y(t,e,r){const n=O(t),a=O(e),o=O(r),i=.4122214708*n+.5363325363*a+.0514459929*o,s=.2119034982*n+.6806995451*a+.1073969566*o,h=.0883024619*n+.2817188376*a+.6299787005*o,c=Math.cbrt(i),l=Math.cbrt(s),u=Math.cbrt(h),f=.2104542553*c+.793617785*l-.0040720468*u,d=1.9779984951*c-2.428592205*l+.4505937099*u,m=.0259040371*c+.7827717662*l-.808675766*u,p=Math.sqrt(d*d+m*m);let y=Math.atan2(m,d)*(180/Math.PI);return y<0&&(y+=360),{l:f,c:p,h:y}}function gt(t,e,r){const n=r*(Math.PI/180),a=e*Math.cos(n),o=e*Math.sin(n),i=t+.3963377774*a+.2158037573*o,s=t-.1055613458*a-.0638541728*o,h=t-.0894841775*a-1.291485548*o,c=i*i*i,l=s*s*s,u=h*h*h,f=4.0767416621*c-3.3077115913*l+.2309699292*u,d=-1.2684380046*c+2.6097574011*l-.3413193965*u,m=-.0041960863*c-.7034186147*l+1.707614701*u;return[W(f),W(d),W(m)]}function vt(t){const e=new Array(t.length);for(let r=0;r<t.length;r++){const[n,a,o]=t[r],{l:i,c:s,h}=Y(n,a,o);e[r]=[Math.round(i*255),Math.round(s/.4*255),Math.round(h/360*255)]}return e}function bt(t){return t.map(({color:[e,r,n],population:a})=>{const o=e/255,i=r/255*.4,s=n/255*360;return{color:gt(o,i,s),population:a}})}var J=C({"src/color-space.ts"(){}});function pt(t,e,r){const n=t/255,a=e/255,o=r/255,i=Math.max(n,a,o),s=Math.min(n,a,o),h=(i+s)/2;let c=0,l=0;if(i!==s){const u=i-s;l=h>.5?u/(2-i-s):u/(i+s),i===n?c=((a-o)/u+(a<o?6:0))/6:i===a?c=((o-n)/u+2)/6:c=((n-a)/u+4)/6}return{h:Math.round(c*360),s:Math.round(l*100),l:Math.round(h*100)}}function wt(t,e,r){const n=a=>{const o=a/255;return o<=.04045?o/12.92:Math.pow((o+.055)/1.055,2.4)};return .2126*n(t)+.7152*n(e)+.0722*n(r)}function U(t,e){const r=Math.max(t,e),n=Math.min(t,e);return(r+.05)/(n+.05)}function x(t,e,r,n,a=0){return new tt(t,e,r,n,a)}var tt,L=C({"src/color.ts"(){J(),tt=class{constructor(t,e,r,n,a){this._r=t,this._g=e,this._b=r,this.population=n,this.proportion=a}rgb(){return{r:this._r,g:this._g,b:this._b}}hex(){const t=e=>e.toString(16).padStart(2,"0");return`#${t(this._r)}${t(this._g)}${t(this._b)}`}hsl(){return this._hsl||(this._hsl=pt(this._r,this._g,this._b)),this._hsl}oklch(){return this._oklch||(this._oklch=Y(this._r,this._g,this._b)),this._oklch}css(t="rgb"){switch(t){case"hsl":{const{h:e,s:r,l:n}=this.hsl();return`hsl(${e}, ${r}%, ${n}%)`}case"oklch":{const{l:e,c:r,h:n}=this.oklch();return`oklch(${e.toFixed(3)} ${r.toFixed(3)} ${n.toFixed(1)})`}case"rgb":default:return`rgb(${this._r}, ${this._g}, ${this._b})`}}array(){return[this._r,this._g,this._b]}toString(){return this.hex()}get textColor(){return this.isDark?"#ffffff":"#000000"}get luminance(){return this._luminance===void 0&&(this._luminance=wt(this._r,this._g,this._b)),this._luminance}get isDark(){return this.luminance<=.179}get isLight(){return!this.isDark}get contrast(){if(!this._contrast){const t=this.luminance,e=U(t,1),r=U(t,0),n=this.isDark?x(255,255,255,0,0):x(0,0,0,0,0);this._contrast={white:Math.round(e*100)/100,black:Math.round(r*100)/100,foreground:n}}return this._contrast}}}}),et={};R(et,{computeFallbackColor:()=>rt,createPixelArray:()=>M,extractPalette:()=>P,validateOptions:()=>S});function S(t){let{colorCount:e,quality:r}=t;if(typeof e>"u"||!Number.isInteger(e))e=10;else{if(e===1)throw new Error("colorCount should be between 2 and 20. To get one color, call getColor() instead of getPalette()");e=Math.max(e,2),e=Math.min(e,20)}(typeof r>"u"||!Number.isInteger(r)||r<1)&&(r=10);const n=t.ignoreWhite!==void 0?!!t.ignoreWhite:!0,a=typeof t.whiteThreshold=="number"?t.whiteThreshold:250,o=typeof t.alphaThreshold=="number"?t.alphaThreshold:125,i=typeof t.minSaturation=="number"?Math.max(0,Math.min(1,t.minSaturation)):0,s=t.colorSpace??"oklch";return{colorCount:e,quality:r,ignoreWhite:n,whiteThreshold:a,alphaThreshold:o,minSaturation:i,colorSpace:s}}function M(t,e,r,n){const{ignoreWhite:a=!0,whiteThreshold:o=250,alphaThreshold:i=125,minSaturation:s=0}=n,h=[];for(let c=0;c<e;c+=r){const l=c*4,u=t[l],f=t[l+1],d=t[l+2],m=t[l+3];if(!(m!==void 0&&m<i)&&!(a&&u>o&&f>o&&d>o)){if(s>0){const p=Math.max(u,f,d);if(p===0||(p-Math.min(u,f,d))/p<s)continue}h.push([u,f,d])}}return h}function rt(t,e,r){let n=0,a=0,o=0,i=0;for(let s=0;s<e;s+=r){const h=s*4;n+=t[h],a+=t[h+1],o+=t[h+2],i++}return i===0?null:[Math.round(n/i),Math.round(a/i),Math.round(o/i)]}function P(t,e,r,n,a){const o=e*r,i={ignoreWhite:n.ignoreWhite,whiteThreshold:n.whiteThreshold,alphaThreshold:n.alphaThreshold,minSaturation:n.minSaturation};let s=M(t,o,n.quality,i);s.length===0&&(s=M(t,o,n.quality,{...i,ignoreWhite:!1})),s.length===0&&(s=M(t,o,n.quality,{...i,ignoreWhite:!1,alphaThreshold:0}));let h;if(n.colorSpace==="oklch"){const l=vt(s);h=bt(a.quantize(l,n.colorCount))}else h=a.quantize(s,n.colorCount);if(h.length>0){const l=h.reduce((u,f)=>u+f.population,0);return h.map(({color:[u,f,d],population:m})=>x(u,f,d,m,l>0?m/l:0))}const c=rt(t,o,n.quality);return c?[x(c[0],c[1],c[2],1,1)]:null}var D=C({"src/pipeline.ts"(){L(),J()}}),nt={};R(nt,{BrowserPixelLoader:()=>z});var z,ot=C({"src/loaders/browser.ts"(){z=class{async load(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement)return this.loadFromImage(t);if(typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement)return this.loadFromCanvas(t);if(typeof ImageData<"u"&&t instanceof ImageData)return{data:t.data,width:t.width,height:t.height};if(typeof HTMLVideoElement<"u"&&t instanceof HTMLVideoElement)return this.loadFromVideo(t);if(typeof ImageBitmap<"u"&&t instanceof ImageBitmap)return this.loadFromImageBitmap(t);if(typeof OffscreenCanvas<"u"&&t instanceof OffscreenCanvas)return this.loadFromOffscreenCanvas(t);throw new Error("Unsupported source type. Expected HTMLImageElement, HTMLCanvasElement, HTMLVideoElement, ImageData, ImageBitmap, or OffscreenCanvas.")}loadFromImage(t){if(!t.complete)throw new Error('Image has not finished loading. Wait for the "load" event before calling getColor/getPalette.');if(!t.naturalWidth)throw new Error("Image has no dimensions. It may not have loaded successfully.");const e=document.createElement("canvas"),r=e.getContext("2d"),n=e.width=t.naturalWidth,a=e.height=t.naturalHeight;r.drawImage(t,0,0,n,a);try{return{data:r.getImageData(0,0,n,a).data,width:n,height:a}}catch(o){if(o instanceof DOMException&&o.name==="SecurityError"){const i=new Error('Image is tainted by cross-origin data. Add crossorigin="anonymous" to the <img> tag and ensure the server sends appropriate CORS headers.');throw i.cause=o,i}throw o}}loadFromCanvas(t){const e=t.getContext("2d"),{width:r,height:n}=t;return{data:e.getImageData(0,0,r,n).data,width:r,height:n}}loadFromVideo(t){if(t.readyState<2)throw new Error('Video is not ready. Wait for the "loadeddata" or "canplay" event before calling getColor/getPalette.');const e=t.videoWidth,r=t.videoHeight;if(!e||!r)throw new Error("Video has no dimensions. It may not have loaded successfully.");const n=document.createElement("canvas"),a=n.getContext("2d");return n.width=e,n.height=r,a.drawImage(t,0,0,e,r),{data:a.getImageData(0,0,e,r).data,width:e,height:r}}loadFromOffscreenCanvas(t){const e=t.getContext("2d");if(!e)throw new Error("Could not get 2D context from OffscreenCanvas.");const{width:r,height:n}=t;return{data:e.getImageData(0,0,r,n).data,width:r,height:n}}loadFromImageBitmap(t){const e=document.createElement("canvas"),r=e.getContext("2d");return e.width=t.width,e.height=t.height,r.drawImage(t,0,0),{data:r.getImageData(0,0,t.width,t.height).data,width:t.width,height:t.height}}}}}),at,xt=C({"src/worker/worker-script.ts"(){at=`
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
`}}),it={};R(it,{extractInWorker:()=>It,isWorkerSupported:()=>st,terminateWorker:()=>_t});function st(){return typeof Worker<"u"}function yt(){if(g)return g;if(!st())throw new Error("Web Workers are not supported in this environment.");return I=URL.createObjectURL(new Blob([at],{type:"application/javascript"})),g=new Worker(I),g.onmessage=t=>{const{id:e,palette:r,error:n}=t.data,a=v.get(e);if(a)if(v.delete(e),n)a.reject(new Error(n));else{const o=r,i=o.reduce((h,c)=>h+c.population,0),s=o.map(({color:[h,c,l],population:u})=>x(h,c,l,u,i>0?u/i:0));a.resolve(s)}},g.onerror=t=>{for(const[,e]of v)e.reject(new Error(t.message));v.clear()},g}function It(t,e,r){return new Promise((n,a)=>{if(r!=null&&r.aborted){a(r.reason??new DOMException("Aborted","AbortError"));return}const o=lt++;v.set(o,{resolve:n,reject:a});const i=()=>{v.delete(o),a(r.reason??new DOMException("Aborted","AbortError"))};r==null||r.addEventListener("abort",i,{once:!0});try{yt().postMessage({id:o,pixels:t,maxColors:e})}catch(s){v.delete(o),r==null||r.removeEventListener("abort",i),a(s)}})}function _t(){g&&(g.terminate(),g=null),I&&(URL.revokeObjectURL(I),I=null);for(const[,t]of v)t.reject(new Error("Worker terminated"));v.clear()}var g,I,lt,v,Ct=C({"src/worker/manager.ts"(){L(),xt(),g=null,I=null,lt=0,v=new Map}});D();D();var q=[{divisor:16,progress:.06},{divisor:4,progress:.25},{divisor:1,progress:1}];function kt(){return new Promise(t=>setTimeout(t,0))}async function*Mt(t,e,r,n,a,o){for(let i=0;i<q.length;i++){if(o!=null&&o.aborted)throw o.reason??new DOMException("Aborted","AbortError");const s=q[i],h={...n,quality:n.quality*s.divisor},c=P(t,e,r,h,a),l=i===q.length-1;yield{palette:c??[],progress:s.progress,done:l},l||await kt()}}L();var F=[{role:"Vibrant",targetL:.65,minL:.4,maxL:.85,targetC:.2,minC:.08},{role:"Muted",targetL:.65,minL:.4,maxL:.85,targetC:.04,minC:0},{role:"DarkVibrant",targetL:.3,minL:0,maxL:.45,targetC:.2,minC:.08},{role:"DarkMuted",targetL:.3,minL:0,maxL:.45,targetC:.04,minC:0},{role:"LightVibrant",targetL:.85,minL:.7,maxL:1,targetC:.2,minC:.08},{role:"LightMuted",targetL:.85,minL:.7,maxL:1,targetC:.04,minC:0}],Tt=6,Et=3,Lt=1;function $(t,e,r){const{l:n,c:a}=t.oklch();if(n<e.minL||n>e.maxL||a<e.minC)return-1/0;const o=1-Math.abs(n-e.targetL),i=1-Math.min(Math.abs(a-e.targetC)/.2,1),s=r>0?t.population/r:0;return o*Tt+i*Et+s*Lt}var G=x(255,255,255,0),N=x(0,0,0,0);function X(t){return{title:t.isDark?G:N,body:t.isDark?G:N}}function ct(t){const e=Math.max(...t.map(o=>o.population),1),r=[];for(const o of F){let i=null,s=-1/0;for(const h of t){const c=$(h,o,e);c>s&&(s=c,i=h)}i&&s>-1/0&&r.push({role:o.role,color:i,score:s})}const n=new Set,a={};r.sort((o,i)=>i.score-o.score);for(const o of r)if(n.has(o.color)){const i=F.find(c=>c.role===o.role);let s=null,h=-1/0;for(const c of t){if(n.has(c))continue;const l=$(c,i,e);l>h&&(h=l,s=c)}if(s&&h>-1/0){n.add(s);const{title:c,body:l}=X(s);a[o.role]={color:s,role:o.role,titleTextColor:c,bodyTextColor:l}}else a[o.role]=null}else{n.add(o.color);const{title:i,body:s}=X(o.color);a[o.role]={color:o.color,role:o.role,titleTextColor:i,bodyTextColor:s}}for(const o of F)o.role in a||(a[o.role]=null);return a}var E=5,b=8-E,St=1e3,Pt=.75,Dt=1<<3*E;function _(t,e,r){return(t<<2*E)+(e<<E)+r}var Ht=class ht{constructor(e,r,n,a,o,i,s){this.r1=e,this.r2=r,this.g1=n,this.g2=a,this.b1=o,this.b2=i,this.histo=s}volume(e=!1){return(this._volume===void 0||e)&&(this._volume=(this.r2-this.r1+1)*(this.g2-this.g1+1)*(this.b2-this.b1+1)),this._volume}count(e=!1){if(this._count===void 0||e){let r=0;for(let n=this.r1;n<=this.r2;n++)for(let a=this.g1;a<=this.g2;a++)for(let o=this.b1;o<=this.b2;o++)r+=this.histo[_(n,a,o)]||0;this._count=r}return this._count}copy(){return new ht(this.r1,this.r2,this.g1,this.g2,this.b1,this.b2,this.histo)}avg(e=!1){if(this._avg===void 0||e){const r=1<<b;if(this.r1===this.r2&&this.g1===this.g2&&this.b1===this.b2)this._avg=[this.r1<<b,this.g1<<b,this.b1<<b];else{let n=0,a=0,o=0,i=0;for(let s=this.r1;s<=this.r2;s++)for(let h=this.g1;h<=this.g2;h++)for(let c=this.b1;c<=this.b2;c++){const l=this.histo[_(s,h,c)]||0;n+=l,a+=l*(s+.5)*r,o+=l*(h+.5)*r,i+=l*(c+.5)*r}n?this._avg=[~~(a/n),~~(o/n),~~(i/n)]:this._avg=[~~(r*(this.r1+this.r2+1)/2),~~(r*(this.g1+this.g2+1)/2),~~(r*(this.b1+this.b2+1)/2)]}}return this._avg}},Z=class{constructor(t){this.comparator=t,this.contents=[],this.sorted=!1}sort(){this.contents.sort(this.comparator),this.sorted=!0}push(t){this.contents.push(t),this.sorted=!1}peek(t){return this.sorted||this.sort(),this.contents[t??this.contents.length-1]}pop(){return this.sorted||this.sort(),this.contents.pop()}size(){return this.contents.length}map(t){return this.contents.map(t)}};function Ot(t){const e=new Uint32Array(Dt);for(const r of t){const n=r[0]>>b,a=r[1]>>b,o=r[2]>>b;e[_(n,a,o)]++}return e}function Wt(t,e){let r=1e6,n=0,a=1e6,o=0,i=1e6,s=0;for(const h of t){const c=h[0]>>b,l=h[1]>>b,u=h[2]>>b;c<r?r=c:c>n&&(n=c),l<a?a=l:l>o&&(o=l),u<i?i=u:u>s&&(s=u)}return new Ht(r,n,a,o,i,s,e)}function qt(t,e){if(!e.count())return;if(e.count()===1)return[e.copy(),null];const r=e.r2-e.r1+1,n=e.g2-e.g1+1,a=e.b2-e.b1+1,o=Math.max(r,n,a);let i=0;const s=[],h=[];if(o===r)for(let l=e.r1;l<=e.r2;l++){let u=0;for(let f=e.g1;f<=e.g2;f++)for(let d=e.b1;d<=e.b2;d++)u+=t[_(l,f,d)]||0;i+=u,s[l]=i}else if(o===n)for(let l=e.g1;l<=e.g2;l++){let u=0;for(let f=e.r1;f<=e.r2;f++)for(let d=e.b1;d<=e.b2;d++)u+=t[_(f,l,d)]||0;i+=u,s[l]=i}else for(let l=e.b1;l<=e.b2;l++){let u=0;for(let f=e.r1;f<=e.r2;f++)for(let d=e.g1;d<=e.g2;d++)u+=t[_(f,d,l)]||0;i+=u,s[l]=i}s.forEach((l,u)=>{h[u]=i-l});function c(l){const u=l+"1",f=l+"2";for(let d=e[u];d<=e[f];d++)if(s[d]>i/2){const m=e.copy(),p=e.copy(),y=d-e[u],V=e[f]-d;let w;for(y<=V?w=Math.min(e[f]-1,~~(d+V/2)):w=Math.max(e[u],~~(d-1-y/2));!s[w];)w++;let Q=h[w];for(;!Q&&s[w-1];)Q=h[--w];return m[f]=w,p[u]=m[f]+1,[m,p]}}return c(o===r?"r":o===n?"g":"b")}function K(t,e,r){let n=t.size(),a=0;for(;a<St;){if(n>=e)return;a++;const o=t.pop();if(!o.count()){t.push(o);continue}const i=qt(r,o);if(!i||!i[0])return;t.push(i[0]),i[1]&&(t.push(i[1]),n++)}}function Ft(t,e){if(!t.length||e<2||e>256)return[];const r=new Set,n=[];for(const c of t){const l=c.join(",");r.has(l)||(r.add(l),n.push(c))}if(n.length<=e){const c=new Map;for(const l of t){const u=l.join(",");c.set(u,(c.get(u)||0)+1)}return n.map(l=>({color:l,population:c.get(l.join(","))}))}const a=Ot(t),o=Wt(t,a),i=new Z((c,l)=>c.count()-l.count());i.push(o),K(i,Pt*e,a);const s=new Z((c,l)=>c.count()*c.volume()-l.count()*l.volume());for(;i.size();)s.push(i.pop());K(s,e,a);const h=[];for(;s.size();){const c=s.pop();h.push({color:c.avg(),population:c.count()})}return h}var ut=class{async init(){}quantize(t,e){return Ft(t,e)}};async function At(){const{BrowserPixelLoader:t}=await Promise.resolve().then(()=>(ot(),nt));return new t}var k=null,T=null;function jt(t){t.loader&&(k=t.loader),t.quantizer&&(T=t.quantizer)}async function Rt(t){return t||k||(k=await At(),k)}async function ft(t){if(t)return await t.init(),t;if(T)return T;const e=new ut;return await e.init(),T=e,e}function A(t){if(t!=null&&t.aborted)throw t.reason??new DOMException("Aborted","AbortError")}async function j(t,e){return A(e==null?void 0:e.signal),(await Rt(e==null?void 0:e.loader)).load(t,e==null?void 0:e.signal)}async function zt(t,e){const r=await B(t,{colorCount:5,...e});return r?r[0]:null}async function B(t,e){const r=S(e??{});if(A(e==null?void 0:e.signal),e!=null&&e.worker){const{isWorkerSupported:o,extractInWorker:i}=await Promise.resolve().then(()=>(Ct(),it));if(o()){const{data:s,width:h,height:c}=await j(t,e),{createPixelArray:l}=await Promise.resolve().then(()=>(D(),et)),u=l(s,h*c,r.quality,{ignoreWhite:r.ignoreWhite,whiteThreshold:r.whiteThreshold,alphaThreshold:r.alphaThreshold,minSaturation:r.minSaturation});return i(u,r.colorCount,e==null?void 0:e.signal)}}const[n,a]=await Promise.all([j(t,e),ft(e==null?void 0:e.quantizer)]);return A(e==null?void 0:e.signal),P(n.data,n.width,n.height,r,a)}async function Bt(t,e){const r=await B(t,{colorCount:16,...e});return ct(r??[])}async function*Vt(t,e){const r=S(e??{}),[n,a]=await Promise.all([j(t,e),ft(e==null?void 0:e.quantizer)]);yield*Mt(n.data,n.width,n.height,r,a,e==null?void 0:e.signal)}ot();D();new z;var Qt=new ut;function Ut(t,e){const r=H(t,{colorCount:5,...e});return r?r[0]:null}function H(t,e){const r=S(e??{}),n=(e==null?void 0:e.quantizer)??Qt,a=Gt(t);return P(a.data,a.width,a.height,r,n)}function $t(t,e){const r=H(t,{colorCount:16,...e});return ct(r??[])}function Gt(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement)return Nt(t);if(typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement)return Xt(t);if(typeof ImageData<"u"&&t instanceof ImageData)return{data:t.data,width:t.width,height:t.height};if(typeof HTMLVideoElement<"u"&&t instanceof HTMLVideoElement)return Zt(t);if(typeof ImageBitmap<"u"&&t instanceof ImageBitmap)return Yt(t);if(typeof OffscreenCanvas<"u"&&t instanceof OffscreenCanvas)return Kt(t);throw new Error("Unsupported source type. Expected HTMLImageElement, HTMLCanvasElement, HTMLVideoElement, ImageData, ImageBitmap, or OffscreenCanvas.")}function Nt(t){if(!t.complete)throw new Error('Image has not finished loading. Wait for the "load" event before calling getColorSync/getPaletteSync.');if(!t.naturalWidth)throw new Error("Image has no dimensions. It may not have loaded successfully.");const e=document.createElement("canvas"),r=e.getContext("2d"),n=e.width=t.naturalWidth,a=e.height=t.naturalHeight;r.drawImage(t,0,0,n,a);try{return{data:r.getImageData(0,0,n,a).data,width:n,height:a}}catch(o){if(o instanceof DOMException&&o.name==="SecurityError"){const i=new Error('Image is tainted by cross-origin data. Add crossorigin="anonymous" to the <img> tag and ensure the server sends appropriate CORS headers.');throw i.cause=o,i}throw o}}function Xt(t){const e=t.getContext("2d"),{width:r,height:n}=t;return{data:e.getImageData(0,0,r,n).data,width:r,height:n}}function Zt(t){if(t.readyState<2)throw new Error('Video is not ready. Wait for the "loadeddata" or "canplay" event before calling getColorSync/getPaletteSync.');const e=t.videoWidth,r=t.videoHeight;if(!e||!r)throw new Error("Video has no dimensions. It may not have loaded successfully.");const n=document.createElement("canvas"),a=n.getContext("2d");return n.width=e,n.height=r,a.drawImage(t,0,0,e,r),{data:a.getImageData(0,0,e,r).data,width:e,height:r}}function Kt(t){const e=t.getContext("2d");if(!e)throw new Error("Could not get 2D context from OffscreenCanvas.");const{width:r,height:n}=t;return{data:e.getImageData(0,0,r,n).data,width:r,height:n}}function Yt(t){const e=document.createElement("canvas"),r=e.getContext("2d");return e.width=t.width,e.height=t.height,r.drawImage(t,0,0),{data:r.getImageData(0,0,t.width,t.height).data,width:t.width,height:t.height}}function Jt(t,e){const{throttle:r=200,onChange:n,...a}=e;let o=!1,i=null,s=null,h=0;const c=[];function l(){try{const f=H(t,a);f&&f.length>0&&n(f)}catch{}}function u(){if(o)return;const f=performance.now();f-h>=r&&(t instanceof HTMLVideoElement?t.readyState>=2&&!t.paused&&!t.ended&&(l(),h=f):(l(),h=f)),i=requestAnimationFrame(u)}if(t instanceof HTMLImageElement){if(t.complete&&t.naturalWidth)l();else{const f=()=>{l(),t.removeEventListener("load",f)};t.addEventListener("load",f),c.push(()=>t.removeEventListener("load",f))}s=new MutationObserver(()=>{if(t.complete&&t.naturalWidth)l();else{const f=()=>{l(),t.removeEventListener("load",f)};t.addEventListener("load",f)}}),s.observe(t,{attributes:!0,attributeFilter:["src","srcset"]})}else if(t instanceof HTMLVideoElement){i=requestAnimationFrame(u);const f=()=>{o||l()};t.addEventListener("seeked",f),c.push(()=>t.removeEventListener("seeked",f))}else i=requestAnimationFrame(u);return{stop(){o=!0,i!==null&&(cancelAnimationFrame(i),i=null),s&&(s.disconnect(),s=null);for(const f of c)f();c.length=0}}}L();const te=Object.freeze(Object.defineProperty({__proto__:null,configure:jt,createColor:x,getColor:zt,getColorSync:Ut,getPalette:B,getPaletteProgressive:Vt,getPaletteSync:H,getSwatches:Bt,getSwatchesSync:$t,observe:Jt},Symbol.toStringTag,{value:"Module"}));export{te as C};
