/**
 * Temporal accumulation on a small synthetic image.
 * A near block moves 1 px per frame over a still background, so the
 * background behind its trailing edge is disoccluded every frame.
 */
export type TemporalMode='none'|'reset'|'reproject';
export const temporalWidth=48,temporalHeight=24;
const blockWidth=12,blockHeight=12,blockTop=6;

function hash(n:number){n=(n^61)^(n>>>16);n=Math.imul(n,9);n^=n>>>4;n=Math.imul(n,0x27d4eb2d);n^=n>>>15;return (n>>>0)/4294967296;}
/** Block position in frame f: it moves right, then left, inside the image. */
export function blockLeft(frame:number){const span=temporalWidth-blockWidth-4,p=frame%(2*span);return 2+(p<span?p:2*span-p);}
function blockVelocity(frame:number){return blockLeft(frame)-blockLeft(frame-1);}
function surface(x:number,y:number,frame:number){const l=blockLeft(frame);return x>=l&&x<l+blockWidth&&y>=blockTop&&y<blockTop+blockHeight?1:0;}
/** Ground truth radiance. The block carries a texture in its own space. */
export function truth(x:number,y:number,frame:number){
 if(surface(x,y,frame)){const lx=x-blockLeft(frame),ly=y-blockTop;return ((lx>>2)+(ly>>2))%2?.92:.62;}
 return .14+.18*(y/temporalHeight)+((x>>3)%2?.05:0);
}

export class TemporalDemo{
 frame=0;mode:TemporalMode='reproject';alpha=.1;
 color=new Float32Array(temporalWidth*temporalHeight);count=new Float32Array(temporalWidth*temporalHeight);
 resetPixels=0;
 constructor(){this.restart();}
 restart(){this.frame=0;this.color.fill(0);this.count.fill(0);this.resetPixels=0;this.step(false);}
 sample(x:number,y:number){const t=truth(x,y,this.frame),r=hash(x*7919+y*104729+this.frame*15485863+1);return Math.max(0,t+(r-.5)*1.1);}
 /** Advance one frame. With move=false the camera and block stay still. */
 step(move=true){
  if(move)this.frame++;
  const prevColor=this.color.slice(),prevCount=this.count.slice(),moved=move&&blockVelocity(this.frame)!==0;
  let resets=0;
  for(let y=0;y<temporalHeight;y++)for(let x=0;x<temporalWidth;x++){
   const i=y*temporalWidth+x,s=this.sample(x,y);let hx=x,valid=true;
   if(this.mode==='reset'&&moved)valid=false;
   if(this.mode==='reproject'&&move){
    const onBlock=surface(x,y,this.frame)===1;hx=onBlock?x-blockVelocity(this.frame):x;
    // History is valid only when the same surface was visible there.
    valid=hx>=0&&hx<temporalWidth&&surface(hx,y,this.frame-1)===(onBlock?1:0);
   }
   const j=y*temporalWidth+hx,n=valid?prevCount[j]+1:1;if(!valid&&prevCount[i]>0)resets++;
   const a=Math.max(1/n,this.alpha);
   this.color[i]=valid&&n>1?prevColor[j]*(1-a)+s*a:s;this.count[i]=n;
  }
  this.resetPixels=resets;
 }
 rmse(){let sum=0;for(let y=0;y<temporalHeight;y++)for(let x=0;x<temporalWidth;x++){const d=this.color[y*temporalWidth+x]-truth(x,y,this.frame);sum+=d*d;}return Math.sqrt(sum/(temporalWidth*temporalHeight));}
 draw(image:HTMLCanvasElement,history:HTMLCanvasElement){
  for(const [canvas,kind] of [[image,'color'],[history,'count']] as const){
   canvas.width=temporalWidth;canvas.height=temporalHeight;const ctx=canvas.getContext('2d');if(!ctx)continue;
   const data=ctx.createImageData(temporalWidth,temporalHeight);
   for(let i=0;i<temporalWidth*temporalHeight;i++){
    let r:number,g:number,b:number;
    if(kind==='color'){const v=Math.min(1,this.color[i]);r=v*235;g=v*226;b=v*196;}
    else{const h=Math.min(1,Math.log2(this.count[i])/5);r=20+h*235;g=40+h*170;b=50+h*60;if(this.count[i]<=1){r=210;g=70;b=80;}}
    data.data.set([r,g,b,255],i*4);
   }
   ctx.putImageData(data,0,0);
  }
 }
}
export const temporalModes:[TemporalMode,string][]=[['none','Fără reproiecție'],['reset','Reset la mișcare'],['reproject','Reproiecție']];
export const temporalModeNote:Record<TemporalMode,string>={
 none:'Istoricul rămâne pe loc. Cubul se mișcă, dar media păstrează pozițiile vechi: ghosting.',
 reset:'Orice mișcare șterge istoricul. Fiecare cadru are 1 sample: imaginea rămâne zgomotoasă.',
 reproject:'Istoricul urmează vectorii de mișcare. Fâșia roșie din spatele cubului este fundal abia descoperit: disocclusion.'
};
