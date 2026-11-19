import {rng} from '../core/math.ts';

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

/** Both views use the exact same raster image and prefix of synthetic noise. */
export class ImageComparison {
 private base:ImageData|null=null;
 noise=new NoiseAverage(0);
 private left:HTMLCanvasElement;private right:HTMLCanvasElement;
 constructor(left:HTMLCanvasElement,right:HTMLCanvasElement){this.left=left;this.right=right;}
 capture(source:HTMLCanvasElement){
  const width=Math.min(480,source.width),height=Math.max(1,Math.round(width*source.height/source.width));
  const scratch=document.createElement('canvas');scratch.width=width;scratch.height=height;
  const ctx=scratch.getContext('2d');if(!ctx)return;
  ctx.drawImage(source,0,0,width,height);this.base=ctx.getImageData(0,0,width,height);
  for(const canvas of [this.left,this.right]){canvas.width=width;canvas.height=height;}
  this.noise=new NoiseAverage(width*height);this.noise.setSamples(1);
 }
 draw(samples:number){
  if(!this.base)return;
  this.noise.setSamples(Math.max(1,samples));
  for(const [canvas,baseline] of [[this.left,true],[this.right,false]] as const){
   const ctx=canvas.getContext('2d');if(!ctx)continue;
   const output=ctx.createImageData(this.base.width,this.base.height);
   for(let i=0;i<this.noise.length;i++){
    const value=baseline?this.noise.first[i]:this.noise.sum[i]/this.noise.count;
    for(let c=0;c<3;c++)output.data[i*4+c]=samples||baseline?this.base.data[i*4+c]*(1+value*.85)+value*75:0;
    output.data[i*4+3]=255;
   }
   ctx.putImageData(output,0,0);
  }
 }
}
