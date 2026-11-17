import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {beats} from '../src/content/chapters.ts';
import {route,metalNormal} from '../src/core/route.ts';
import {shotPose,shotState,routePoint,routeDistance,progressAtDistance,portalWorldPose,roomApproachPose} from '../src/core/cinematics.ts';
import {monitor,portalCut} from '../src/core/portal.ts';
import {surfaceRotation} from '../src/core/surface-frame.ts';
import {createCourtyard} from '../src/engine/courtyard.ts';
import {createRoom} from '../src/engine/room.ts';
const close=(a:number,b:number,tolerance=1e-7)=>assert.ok(Math.abs(a-b)<tolerance,`${a} ≈ ${b}`);

test('air travel follows world arc length; glass interfaces have explicit separate holds',()=>{
 const total=routeDistance(2,4.18),half=progressAtDistance(2,4.18,total/2);close(routeDistance(2,half),total/2);assert.ok(half<3);
 for(const t of [.5,.54,.59,.6])close(shotState('glass',t,2,4.18).ray,3);
 for(const t of [.74,.78,.82])close(shotState('glass',t,2,4.18).ray,4);
 assert.ok(shotState('travel',.2,1,2).ray>1);assert.ok(shotState('travel',.2,1,2).camera<.02);
 for(const b of beats){let previous=b.rayFrom;for(let i=0;i<=100;i++){const state=shotState(b.motion??'arrive',i/100,b.rayFrom,b.rayTo);assert.ok(state.ray>=previous-1e-10&&state.ray<=b.rayTo+1e-10);previous=state.ray;}}
});
test('glass head stays in frame throughout flight, with both interfaces readable during holds on desktop and phone',()=>{
 const i=beats.findIndex(b=>b.id==='to-glass'),b=beats[i];
 for(const aspect of [16/9,9/16]){const camera=new T.PerspectiveCamera(43,aspect,.05,400);
  for(let k=0;k<=100;k++){const t=k/100,pose=shotPose(b,beats[i-1],t,aspect);camera.position.set(...pose.position);camera.lookAt(...pose.target);camera.updateMatrixWorld();
   assert.ok(camera.position.distanceTo(new T.Vector3(...pose.target))>8);
   const points=[routePoint(pose.ray),...(t>=.5&&t<=.82?[route[3],route[4]]:[])];
   for(const point of points){const p=new T.Vector3(...point).project(camera);assert.ok(Math.abs(p.x)<.91&&Math.abs(p.y)<.91&&p.z<1&&p.z> -1,`${aspect} at ${t}: ${p.toArray()}`);}
  }
 }
});
test('bronze architectural frame keeps world-up and the exact reflection normal',()=>{
 const q=surfaceRotation(metalNormal),up=new T.Vector3(0,1,0).applyQuaternion(q),normal=new T.Vector3(0,0,1).applyQuaternion(q);
 assert.ok(up.dot(new T.Vector3(0,1,0))>.999);normal.toArray().forEach((v,i)=>close(v,metalNormal[i]));
});
test('portal uses one continuous world rail with substantial post-cut travel',()=>{
 const before=portalWorldPose(portalCut-1e-6),cut=portalWorldPose(portalCut),after=portalWorldPose(portalCut+1e-6),end=portalWorldPose(1);
 for(let axis=0;axis<3;axis++)close((cut.position[axis]-before.position[axis])/1e-6,(after.position[axis]-cut.position[axis])/1e-6,1e-3);
 assert.ok(new T.Vector3(...cut.position).distanceTo(new T.Vector3(...end.position))>6);
 const b=beats.find(b=>b.id==='portal')!;assert.deepEqual(shotPose(b,beats[0],1).position,b.camera);
});
test('the curved monitor approach has no physical occluders at screen edges/corners in three aspect ratios',()=>{
 const room=createRoom();room.scene.updateMatrixWorld(true);const ray=new T.Raycaster();let checked=0;
 // Avoid exactly the shared screen-triangle diagonal: Three's CPU ray/triangle
 // rounding can miss both triangles at identical barycentrics, unlike raster coverage.
 for(const aspect of [16/9,4/3,9/16])for(let sample=0;sample<=30;sample++){
  const pose=roomApproachPose(portalCut*sample/30,aspect,beats[0].camera,beats[0].target),o=new T.Vector3(...pose.position);
  for(const x of [-.98,0,.98])for(const y of [-.97,.013,.97]){
   const target=new T.Vector3(monitor.center[0]+x*monitor.width/2,monitor.center[1]+y*monitor.height/2,monitor.center[2]);ray.set(o,target.sub(o).normalize());
   assert.equal(ray.intersectObject(room.world,true)[0]?.object,room.screen);checked++;
  }
 }assert.equal(checked,837);
});
test('long selected air legs reach their intended material without newly introduced architecture intercepting them',()=>{
 const court=createCourtyard(),ray=new T.Raycaster();assert.equal(court.triangles.length,144);
 for(const leg of [0,1,2,4]){
  const from=new T.Vector3(...route[leg]),to=new T.Vector3(...route[leg+1]),direction=to.clone().sub(from).normalize(),length=from.distanceTo(to);
  ray.set(from.clone().addScaledVector(direction,.1),direction);ray.far=length-.2;
  assert.equal(ray.intersectObject(court.world,true).length,0,`unintended contact on leg ${leg}`);assert.ok(length>=40);
 }
});
test('forward observer rails after glass do not cross physical canyon architecture',()=>{
 const court=createCourtyard(),ray=new T.Raycaster();
 for(const aspect of [16/9,9/16])for(const id of ['samples','cost','noise','to-light']){
  const i=beats.findIndex(b=>b.id===id),b=beats[i];let previous=new T.Vector3(...shotPose(b,beats[i-1],0,aspect).position);
  for(let k=1;k<=80;k++){
   const point=new T.Vector3(...shotPose(b,beats[i-1],k/80,aspect).position),direction=point.clone().sub(previous),distance=direction.length();
   if(distance>.00001){ray.set(previous,direction.normalize());ray.far=distance;assert.equal(ray.intersectObject(court.world,true).length,0,`${id}: camera meets architecture at ${k/80}`);}
   previous=point;
  }
 }
});
