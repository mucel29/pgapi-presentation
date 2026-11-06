import {add,mul,reflect,normalize,cross,rng,dot,type Vec3} from './math.ts';
export function emissionProgress(time:number,index:number,delay=.16,duration=1.45){return Math.max(0,Math.min(1,(time-.25-index*delay)/duration));}
// GGX half-vector sampling around the geometric normal. The illustrated fan
// compares rough reflection directions; it is not a set of extra pixel samples.
export function reflectionSamples(incoming:Vec3,normal:Vec3,count=12,roughness=.28){
 const n=normalize(normal),tangent=normalize(cross(n,Math.abs(n[1])<.95?[0,1,0]:[1,0,0])),bitangent=cross(n,tangent),random=rng(817),alpha=roughness*roughness;
 const samples:Vec3[]=[];for(let tries=0;samples.length<count&&tries<count*10;tries++){
  const u=random(),phi=random()*Math.PI*2,cos=Math.sqrt((1-u)/(1+(alpha*alpha-1)*u)),sin=Math.sqrt(1-cos*cos),half=add(mul(n,cos),add(mul(tangent,sin*Math.cos(phi)),mul(bitangent,sin*Math.sin(phi)))),out=reflect(incoming,half);
  if(dot(out,n)>0)samples.push(out);
 }return samples;
}
export const bvhInk={outline:0x061218,active:0xffdf38,child:0x4ddcff,ancestor:0xf3f6e7,rejected:0xff6654};
