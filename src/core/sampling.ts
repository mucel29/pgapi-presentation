import {add,sub,mul,cross,normalize,intersectSphere,cosineHemisphere,rng,type Vec3} from './math.ts';
import {origin,sphereCenter,sphereRadius} from './route.ts';
// One virtual image-plane cell shared by the world rig and primary samples.
const forward=normalize(sub(sphereCenter,origin)),right=normalize(cross(forward,[0,1,0])),up=normalize(cross(right,forward));
const footprint=Math.min(.78,.9*sphereRadius*6/Math.hypot(...sub(sphereCenter,origin))*Math.SQRT2),center=add(origin,mul(forward,6));
export const cameraPixel={origin:[...origin] as Vec3,center,forward,right,up,footprint,
 corners:[[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,y])=>add(center,add(mul(right,x*footprint/2),mul(up,y*footprint/2))))};
// Jitter stays within this cell; the pinhole never moves.
export function illustratedSamples(count=12){
 const random=rng(88);
 return Array.from({length:count},()=>{
  const p=add(center,add(mul(right,(random()-.5)*footprint),mul(up,(random()-.5)*footprint))),direction=normalize(sub(p,origin)),t=intersectSphere(origin,direction,sphereCenter,sphereRadius);
  const hit=t===null?null:add(origin,mul(direction,t)),normal=hit?normalize(sub(hit,sphereCenter)):null;
  const outgoing=normal?cosineHemisphere(random(),random(),normal):null;
  return {origin:[...origin] as Vec3,pixel:p,direction,hit,normal,outgoing,end:hit??add(origin,mul(direction,60))};
 });
}
