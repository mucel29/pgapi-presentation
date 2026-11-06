export interface CameraPose {position:readonly number[];quaternion:readonly number[];projection:readonly number[];}
export interface MotionResult {changed:boolean;moving:boolean;settled:boolean;}
// Compare with the last accepted pose, so many small deliberate moves still count.
export class CameraMotionGate {
 private anchor:CameraPose|null=null;private lastMotion=-Infinity;private wasMoving=false;
 tolerancePixels:number;settleMs:number;
 constructor(tolerancePixels=.35,settleMs=400){this.tolerancePixels=tolerancePixels;this.settleMs=settleMs;}
 reset(){this.anchor=null;this.lastMotion=-Infinity;this.wasMoving=false;}
 observe(pose:CameraPose,now:number,worldPerPixel:number,radiansPerPixel:number):MotionResult{
  const copy=()=>{this.anchor={position:[...pose.position],quaternion:[...pose.quaternion],projection:[...pose.projection]};};
  if(!this.anchor){copy();return {changed:true,moving:false,settled:false};}
  const position=Math.hypot(...pose.position.map((v,i)=>v-this.anchor!.position[i]));
  const qdot=Math.min(1,Math.abs(pose.quaternion.reduce((s,v,i)=>s+v*this.anchor!.quaternion[i],0)));
  const angle=2*Math.acos(qdot),projection=pose.projection.some((v,i)=>Math.abs(v-this.anchor!.projection[i])>1e-6);
  let changed=projection||position>Math.max(1e-5,worldPerPixel*this.tolerancePixels)||angle>Math.max(1e-6,radiansPerPixel*this.tolerancePixels);
  if(changed){copy();this.lastMotion=now;}
  const moving=now-this.lastMotion<this.settleMs,settled=this.wasMoving&&!moving;
  // Adopt the exact final pose once. Guides and traced rays then share that pose.
  if(settled){copy();changed=true;}
  this.wasMoving=moving;return {changed,moving,settled};
 }
}
