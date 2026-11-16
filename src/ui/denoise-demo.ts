/** CPU reference of the local spatial à-trous weights. Synthetic signal, never a scene render. */
export interface Guide {normal:[number,number,number];depth:number;albedo:[number,number,number]}
export interface DenoiseSignal {width:number;height:number;raw:number[];truth:number[];guides:Guide[]}
const kernel=[1,4,6,4,1];
export function syntheticDenoiseSignal():DenoiseSignal{
 const width=24,height=12,truth:number[]=[],raw:number[]=[],guides:Guide[]=[];
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const right=x>=width/2,t=right?.72:.22;
  truth.push(t);raw.push(Math.max(0,Math.min(1,t+Math.sin(x*27.1+y*91.7)*.18)));
  guides.push({normal:right?[.8,0,.6]:[0,0,1],depth:right?8:4,albedo:right?[.75,.7,.5]:[.25,.5,.35]});
 }
 return {width,height,raw,truth,guides};
}
export function spatialFilter(signal:DenoiseSignal,guided=true,passes=3,strength=.8){
 let source=[...signal.raw];
 for(let pass=0;pass<passes;pass++){
  const step=2**pass,dest:number[]=[];
  for(let y=0;y<signal.height;y++)for(let x=0;x<signal.width;x++){
   const i=y*signal.width+x,c=source[i],g=signal.guides[i];let sum=0,weights=0;
   for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){
    const qx=x+dx*step,qy=y+dy*step;if(qx<0||qy<0||qx>=signal.width||qy>=signal.height)continue;
    const j=qy*signal.width+qx,q=signal.guides[j];let w=kernel[dx+2]*kernel[dy+2];
    if(guided){const dot=g.normal.reduce((v,n,k)=>v+n*q.normal[k],0),da=Math.hypot(...g.albedo.map((v,k)=>v-q.albedo[k]));w*=Math.max(0,dot)**32*Math.exp(-Math.abs(g.depth-q.depth)/(Math.max(.015,g.depth*.015)*step))*Math.exp(-da*8)*Math.exp(-Math.abs(c-source[j])/(Math.max(.12,c*.5)*Math.max(strength,.01)));}
    sum+=w*source[j];weights+=w;
   }
   dest.push(c*(1-strength)+sum/Math.max(weights,.00001)*strength);
  }
  source=dest;
 }
 return source;
}
export function demoRMSE(values:number[],truth:number[]){return Math.sqrt(values.reduce((sum,v,i)=>sum+(v-truth[i])**2,0)/values.length);}
export function denoiseDemoSvg(guided=true){
 const signal=syntheticDenoiseSignal(),filtered=spatialFilter(signal,guided),grid=(data:number[],offset:number)=>data.map((v,i)=>`<rect x="${offset+i%signal.width*10}" y="${40+Math.floor(i/signal.width)*10}" width="10.1" height="10.1" fill="rgb(${Math.round(v*220)},${Math.round(v*245)},${Math.round(v*225)})"/>`).join('');
 return `<svg viewBox="0 0 520 195" role="img" aria-label="Semnal sintetic zgomotos lângă rezultatul a trei treceri de filtrare ${guided?'ghidată':'fără ghidaje'}"><text x="10" y="25">Zgomotos</text><text x="270" y="25">${guided?'Ghidat':'Medie simplă'}</text>${grid(signal.raw,10)}${grid(filtered,270)}<path d="M130 40V160M390 40V160" stroke="#ffd091" stroke-dasharray="4 4"/><text x="10" y="187">RMSE ${demoRMSE(signal.raw,signal.truth).toFixed(3)}</text><text x="270" y="187">RMSE ${demoRMSE(filtered,signal.truth).toFixed(3)}</text></svg>`;
}
