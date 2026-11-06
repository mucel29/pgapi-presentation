import * as T from 'three';
// A proper equirectangular environment for raster IBL and the optional path tracer.
export function daylightEnvironment(warm=false){
 const width=128,height=64,pixels=new Float32Array(width*height*4),sky=new T.Color(warm?'#aecbd2':'#a9c8d5'),horizon=new T.Color('#f7d5a4'),ground=new T.Color('#576d69');
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const v=y/(height-1),c=v<.5?sky.clone().lerp(horizon,Math.pow(v*2,3)):horizon.clone().lerp(ground,Math.min(1,(v-.5)*3));
  const dx=Math.min(Math.abs(x/width-.2),1-Math.abs(x/width-.2)),dy=v-.28,sun=Math.exp(-(dx*dx+dy*dy)/.0012)*2.5,i=(y*width+x)*4;
  pixels[i]=c.r+sun;pixels[i+1]=c.g+sun*.85;pixels[i+2]=c.b+sun*.62;pixels[i+3]=1;
 }
 const t=new T.DataTexture(pixels,width,height,T.RGBAFormat,T.FloatType);t.mapping=T.EquirectangularReflectionMapping;t.needsUpdate=true;return t;
}
