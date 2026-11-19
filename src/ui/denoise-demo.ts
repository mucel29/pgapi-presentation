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
/** Weights of the 5×5 taps around pixel (x, y) for one à-trous pass. */
export function tapWeights(signal:DenoiseSignal,source:number[],x:number,y:number,step:number,guided=true,strength=.8){
 const i=y*signal.width+x,c=source[i],g=signal.guides[i],taps:{x:number;y:number;w:number}[]=[];
 for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){
  const qx=x+dx*step,qy=y+dy*step;if(qx<0||qy<0||qx>=signal.width||qy>=signal.height)continue;
  const j=qy*signal.width+qx,q=signal.guides[j];let w=kernel[dx+2]*kernel[dy+2];
  if(guided){const dot=g.normal.reduce((v,n,k)=>v+n*q.normal[k],0),da=Math.hypot(...g.albedo.map((v,k)=>v-q.albedo[k]));w*=Math.max(0,dot)**32*Math.exp(-Math.abs(g.depth-q.depth)/(Math.max(.015,g.depth*.015)*step))*Math.exp(-da*8)*Math.exp(-Math.abs(c-source[j])/(Math.max(.12,c*.5)*Math.max(strength,.01)));}
  taps.push({x:qx,y:qy,w});
 }
 const max=Math.max(...taps.map(t=>t.w));return taps.map(t=>({...t,w:t.w/max}));
}
export const denoiseProbe={x:10,y:6};
/** pass 0 = noisy input; pass k shows the input of pass k and its taps (step 2^(k-1)). */
export function denoiseStepSvg(pass:number,guided=true){
 const signal=syntheticDenoiseSignal(),before=pass<=1?signal.raw:spatialFilter(signal,guided,pass-1),after=pass===0?signal.raw:spatialFilter(signal,guided,pass),step=2**Math.max(0,pass-1),cell=10;
 const grid=(data:number[],offset:number)=>data.map((v,i)=>`<rect x="${offset+i%signal.width*cell}" y="${40+Math.floor(i/signal.width)*cell}" width="${cell+.1}" height="${cell+.1}" fill="rgb(${Math.round(v*220)},${Math.round(v*245)},${Math.round(v*225)})"/>`).join('');
 const taps=pass===0?[]:tapWeights(signal,before,denoiseProbe.x,denoiseProbe.y,step,guided);
 const circles=taps.map(t=>`<circle cx="${10+t.x*cell+cell/2}" cy="${40+t.y*cell+cell/2}" r="${1.5+t.w*4.5}" fill="${t.w>.05?'#ffd091':'none'}" stroke="#ffd091" stroke-width="1" opacity="${t.w>.05?.95:.6}"/>`).join('');
 const probe=`<rect x="${10+denoiseProbe.x*cell-1}" y="${40+denoiseProbe.y*cell-1}" width="${cell+2}" height="${cell+2}" fill="none" stroke="#ff70b8" stroke-width="2"/>`;
 const label=pass===0?'Intrare zgomotoasă':`Trecerea ${pass} · pas ${step}`;
 return `<svg viewBox="0 0 520 195" role="img" aria-label="${label}: vecinii pixelului marcat și ponderile lor"><text x="10" y="25">${label}</text><text x="270" y="25">${pass===0?'Fără filtru':guided?'Rezultat ghidat':'Rezultat fără ghidaje'}</text>${grid(before,10)}${circles}${probe}${grid(after,270)}<path d="M130 40V160M390 40V160" stroke="#ffd091" stroke-dasharray="4 4" opacity=".7"/><text x="10" y="187">RMSE ${demoRMSE(before,signal.truth).toFixed(3)}</text><text x="270" y="187">RMSE ${demoRMSE(after,signal.truth).toFixed(3)}</text></svg>`;
}
/** SVGF-style pipeline. NRD and OIDN are listed below it as variants. */
export function denoisePipelineSvg(){
 const box=(x:number,y:number,w:number,title:string,sub:string,color='#244f51')=>`<rect x="${x}" y="${y}" width="${w}" height="58" rx="4" fill="${color}" stroke="#8bc5c1"/><text x="${x+w/2}" y="${y+25}" text-anchor="middle">${title}</text><text x="${x+w/2}" y="${y+46}" text-anchor="middle" class="tree-small">${sub}</text>`;
 const arrow=(x1:number,x2:number,y:number)=>`<path d="M${x1} ${y}H${x2}" stroke="#ffd091" stroke-width="2" marker-end="url(#pipe-arrow)"/>`;
 return `<svg viewBox="0 0 664 190" role="img" aria-label="Pipeline de denoising: path tracer, acumulare temporală, varianță, à-trous"><defs><marker id="pipe-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="#ffd091"/></marker></defs>
 ${box(4,30,118,'Path tracer','1 spp / cadru','#3a2f22')}${arrow(122,140,59)}
 ${box(142,30,150,'Temporal','reproiecție')}${arrow(292,310,59)}
 ${box(312,30,120,'Varianță','per pixel')}${arrow(432,450,59)}
 ${box(452,30,120,'À-trous ×5','pas 1…16')}${arrow(572,590,59)}
 <rect x="592" y="30" width="68" height="58" rx="4" fill="#4f8273" stroke="#8bc5c1"/><text x="626" y="64" text-anchor="middle" class="tree-small">ieșire</text>
 <rect x="142" y="130" width="430" height="52" rx="4" fill="#16333b" stroke="#476468" stroke-dasharray="4 4"/><text x="357" y="152" text-anchor="middle">G-buffer</text><text x="357" y="173" text-anchor="middle" class="tree-small">normală · adâncime · albedo · mișcare</text>
 <path d="M217 130V90M372 130V90M512 130V90" stroke="#8bc5c1" stroke-dasharray="3 4"/></svg>`;
}

/** Enlarges the existing guided synthetic experiment, with identical raw input in both views. */
export function drawDenoiseComparison(left:HTMLCanvasElement,right:HTMLCanvasElement,passes=3,guided=true,strength=.8){
 const signal=syntheticDenoiseSignal(),filtered=spatialFilter(signal,guided,passes,strength);
 for(const [canvas,values] of [[left,signal.raw],[right,filtered]] as const){
  canvas.width=signal.width;canvas.height=signal.height;
  const ctx=canvas.getContext('2d');if(!ctx)continue;
  const image=ctx.createImageData(signal.width,signal.height);
  for(let i=0;i<values.length;i++)image.data.set([values[i]*220,values[i]*245,values[i]*225,255],i*4);
  ctx.putImageData(image,0,0);
 }
}
