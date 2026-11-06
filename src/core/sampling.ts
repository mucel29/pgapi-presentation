import {add,sub,mul,cross,normalize,intersectSphere,cosineHemisphere,rng,type Vec3} from './math.ts';
import {origin,sphereCenter,sphereRadius} from './route.ts';
// Jitter stays within one virtual pixel. Large divergence comes from BSDF sampling at the hit.
export function illustratedSamples(count=12){
 const forward=normalize(sub(sphereCenter,origin)),right=normalize(cross(forward,[0,1,0])),up=normalize(cross(right,forward)),pixel=add(origin,mul(forward,6)),random=rng(88);
 return Array.from({length:count},()=>{
  const p=add(pixel,add(mul(right,(random()-.5)*.78),mul(up,(random()-.5)*.78))),direction=normalize(sub(p,origin)),t=intersectSphere(origin,direction,sphereCenter,sphereRadius);
  const hit=t===null?null:add(origin,mul(direction,t)),normal=hit?normalize(sub(hit,sphereCenter)):null;
  const outgoing=normal?cosineHemisphere(random(),random(),normal):null;
  return {origin:[...origin] as Vec3,pixel:p,direction,hit,normal,outgoing,end:hit??add(origin,mul(direction,34))};
 });
}
