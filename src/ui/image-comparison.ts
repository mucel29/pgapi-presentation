import {rng} from '../core/math.ts';
import type {CaptureCamera} from '../core/capture-camera';

/** A repeatable illustration of averaging independent noise, not path tracing. */
export class NoiseAverage {
 count=0;
 sum:Float32Array;
 first:Float32Array;
 private random:()=>number;
 length:number;private seed:number;
 constructor(length:number,seed=4279){this.length=length;this.seed=seed;this.sum=new Float32Array(length);this.first=new Float32Array(length);this.random=rng(seed);}
 reset(){this.count=0;this.sum.fill(0);this.first.fill(0);this.random=rng(this.seed);}
 setSamples(n:number){
  n=Math.max(0,Math.min(256,Math.floor(n)));
  if(n<this.count)this.reset();
  while(this.count<n){
   for(let i=0;i<this.length;i++){const value=(this.random()-.5)*2;if(!this.count)this.first[i]=value;this.sum[i]+=value;}
   this.count++;
  }
 }
}

export interface CaptureManifest {
 width:number;height:number;samples:{spp:number;url:string}[];
 denoise:{spp:number;raw:string;guided:string[]};
 camera:CaptureCamera;
}

/** Prepared integrator captures share one camera and one full-frame image rectangle. */
export class ImageComparison {
 readonly ready:Promise<CaptureManifest>;
 manifest:CaptureManifest|null=null;
 private images=new Map<string,Promise<HTMLImageElement>>();
 private revision=0;
 constructor(private left:HTMLImageElement,private right:HTMLImageElement,private stage:HTMLElement){
  this.ready=this.preload();
  // Keep a rejected preload observed even before the first capture slide opens.
  void this.ready.catch(()=>{});
 }
 private async preload(){
  const base=new URL(import.meta.env.BASE_URL,location.href);
  const manifestUrl=new URL('assets/pathtraced/manifest.json',base);
  const response=await fetch(manifestUrl);
  if(!response.ok)throw new Error('Capturile nu sunt disponibile');
  const manifest=await response.json() as CaptureManifest;
  const resolve=(url:string)=>new URL(url.startsWith('/assets/')?url.slice(1):url.startsWith('assets/')?url:new URL(url,manifestUrl).href,base).href;
  manifest.samples=manifest.samples.map(frame=>({...frame,url:resolve(frame.url)}));
  manifest.denoise.raw=resolve(manifest.denoise.raw);
  manifest.denoise.guided=manifest.denoise.guided.map(resolve);
  if(!manifest.samples.some(frame=>frame.spp===1)||!manifest.denoise.guided.length)throw new Error('Capturi incomplete');
  await Promise.all([...new Set([manifest.samples.find(frame=>frame.spp===1)!.url,manifest.denoise.raw,manifest.denoise.guided[1]??manifest.denoise.raw])].map(url=>this.image(url,manifest)));
  this.manifest=manifest;return manifest;
 }
 get sampleCounts(){return this.manifest?.samples.map(frame=>frame.spp).sort((a,b)=>a-b)??[1];}
 private image(url:string,manifest=this.manifest!){
  const cached=this.images.get(url);if(cached){this.images.delete(url);this.images.set(url,cached);return cached;}
  const loading=(async()=>{const image=new Image();image.src=url;await image.decode();
   if(image.naturalWidth!==manifest.width||image.naturalHeight!==manifest.height)throw new Error('Dimensiuni de captură diferite');
   return image;
  })();
  this.images.set(url,loading);
  while(this.images.size>6)this.images.delete(this.images.keys().next().value!);
  return loading;
 }
 private async pair(left:string,right:string,revision:number,baselineLabel:string,frameLabel:string){
  await this.ready;
  const [baseline,frame]=await Promise.all([this.image(left),this.image(right)]);
  if(revision!==this.revision)return;
  this.left.src=baseline.src;this.right.src=frame.src;
  this.stage.querySelector('#comparison-low-label')!.textContent=baselineLabel;
  this.stage.querySelector('#comparison-label')!.textContent=frameLabel;
  this.left.alt=`Cadru brut · ${baselineLabel}`;this.right.alt=`Același cadru · ${frameLabel}`;
  this.stage.dataset.ready='true';
 }
 async draw(samples:number,label=`${samples} spp`){
  const revision=++this.revision,manifest=await this.ready;
  const baseline=manifest.samples.find(frame=>frame.spp===1)!;
  const frame=manifest.samples.find(frame=>frame.spp===samples);
  if(!frame)throw new Error(`Captură lipsă: ${samples} spp`);
  await this.pair(baseline.url,frame.url,revision,'1 spp',label);
  const next=manifest.samples[manifest.samples.indexOf(frame)+1];
  if(next&&revision===this.revision)void this.image(next.url).catch(()=>{});
 }
 async denoise(pass:number){
  const revision=++this.revision,{denoise}=await this.ready;
  await this.pair(denoise.raw,denoise.guided[pass],revision,`${denoise.spp} spp`,pass?`Ghidat · ${pass}`:'Brut');
  if(denoise.guided[pass+1]&&revision===this.revision)void this.image(denoise.guided[pass+1]).catch(()=>{});
 }
}
