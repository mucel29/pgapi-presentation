import {rng,type Vec3} from './math.ts';

// Bernoulli samples of a known scalar signal. This is an estimator experiment,
// deliberately independent of the WebGL scene and the optional path tracer.
export function accumulationExperiment(samples:number,width=20,height=12){
 const n=Math.max(1,Math.min(256,Math.floor(samples))),random=rng(4279),truth:number[]=[],estimate:number[]=[];
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const dx=(x+.5-width*.48)/(width*.34),dy=(y+.5-height*.48)/(height*.4),radius=dx*dx+dy*dy;
  const signal=radius<1?.18+.62*Math.max(0,1-(dx*.45+dy*.3+.35)):.12+.18*x/width;
  const p=Math.max(.05,Math.min(.95,signal));let sum=0;
  // Every N uses the same prefix for this pixel; increasing N adds observations.
  const sequence=Array.from({length:256},()=>random());
  for(let s=0;s<n;s++)sum+=sequence[s%256]<p?1:0;
  truth.push(p);estimate.push(sum/n);
 }
 const rmse=Math.sqrt(estimate.reduce((sum,v,i)=>sum+(v-truth[i])**2,0)/estimate.length);
 const expectedRMSE=Math.sqrt(truth.reduce((sum,p)=>sum+p*(1-p)/n,0)/truth.length);
 return {width,height,samples:n,truth,estimate,rmse,expectedRMSE};
}

export function slabIntervals(o:Vec3,d:Vec3,min:Vec3,max:Vec3){
 const axes=[0,1,2].map(a=>{
  if(Math.abs(d[a])<1e-10)return {near:-Infinity,far:Infinity,parallel:true,inside:o[a]>=min[a]&&o[a]<=max[a]};
  const p=(min[a]-o[a])/d[a],q=(max[a]-o[a])/d[a];return {near:Math.min(p,q),far:Math.max(p,q),parallel:false,inside:true};
 });
 const near=Math.max(0,...axes.map(a=>a.near)),far=Math.min(...axes.map(a=>a.far));
 return {axes,near,far,hit:axes.every(a=>a.inside)&&near<=far};
}
