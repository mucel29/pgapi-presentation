import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {presentationLayout,rasterSize,projectedPosition} from '../src/ui/layout.ts';
import {beats} from '../src/content/chapters.ts';
import {shotPose,routePoint} from '../src/core/cinematics.ts';
import {route,origin,throughput,metalNormal} from '../src/core/route.ts';
import {materialPalette,linearRGB,weightDisplay} from '../src/core/transport.ts';
import {emissionProgress,reflectionSamples,bvhInk} from '../src/core/visual-sequence.ts';
import {illustratedSamples} from '../src/core/sampling.ts';
import {createCourtyard} from '../src/engine/courtyard.ts';
import {JourneyVisuals} from '../src/engine/visuals.ts';

const cameraAt=(id:string,t:number,aspect:number)=>{
 const i=beats.findIndex(b=>b.id===id),pose=shotPose(beats[i],beats[Math.max(0,i-1)],t,aspect);
 const camera=new T.PerspectiveCamera(43,aspect,.05,400);
 camera.position.set(...pose.position);camera.lookAt(...pose.target);camera.updateMatrixWorld();
 return {camera,pose};
};
const inFrame=(p:T.Vector3)=>p.z> -1&&p.z<1&&Math.abs(p.x)<1&&Math.abs(p.y)<1;

test('actual lesson and travel viewports preserve framing and pixel-square coordinates',()=>{
 for(const [w,h] of [[1280,720],[390,844]]){
  const lesson=presentationLayout(w,h),rect=lesson.scene,size=rasterSize(rect);
  assert.ok(Math.abs(size.width/size.height-rect.width/rect.height)<.005);
  assert.ok(size.width<=960);
  assert.deepEqual(projectedPosition({x:0,y:0,z:0},rect),{x:rect.left+rect.width/2,y:rect.top+rect.height/2,visible:true});
  assert.equal(projectedPosition({x:0,y:0,z:2},rect).visible,false);
  const {camera}=cameraAt('ray',1,rect.width/rect.height),point=new T.Vector3(...origin).project(camera);
  const marker=projectedPosition(point,rect);
  assert.ok(marker.visible&&marker.x>rect.left+8&&marker.x<rect.left+rect.width-8);
  assert.ok(marker.y>rect.top+8&&marker.y<rect.top+rect.height-8);
  const travel=presentationLayout(w,h,'travel').scene;
  for(let i=0;i<=100;i++){
   const t=i/100,{camera,pose}=cameraAt('to-glass',t,travel.width/travel.height);
   for(const p of [routePoint(pose.ray),...(t>=.5&&t<=.82?[route[3],route[4]]:[])])
    assert.ok(inFrame(new T.Vector3(...p).project(camera)),`${w}×${h}, glass at ${t}`);
  }
 }
});

test('canyon focal objects and primary sample paths remain visible in full-scene desktop and phone views',()=>{
 const court=createCourtyard(),ray=new T.Raycaster();
 for(const [w,h] of [[1280,720],[390,844]]){
  const rect=presentationLayout(w,h).scene,aspect=rect.width/rect.height;
  const bridge=cameraAt('bvh',1,aspect).camera;
  for(const p of court.triangles[court.traversal.triangle]){
   const target=new T.Vector3(...p);assert.ok(inFrame(target.clone().project(bridge)));
   const direction=target.clone().sub(bridge.position),distance=direction.length();ray.set(bridge.position,direction.normalize());ray.far=distance+.01;
   const first=ray.intersectObject(court.world,true)[0];
   assert.ok(!first||first.object===court.teaching||first.distance>=distance-.02,'the selected bridge triangle is not hidden behind another structure');
  }
  const material=cameraAt('materials',1,aspect).camera;
  assert.ok(material.position.clone().sub(new T.Vector3(...route[2])).dot(new T.Vector3(...metalNormal))>0);
  assert.ok(inFrame(new T.Vector3(...route[2]).project(material)));
  assert.equal(reflectionSamples(new T.Vector3(...route[2]).sub(new T.Vector3(...route[1])).normalize().toArray(),metalNormal).length,12);
  const sample=cameraAt('samples',1,aspect).camera;
  for(const path of illustratedSamples())for(const fraction of [0,.1,.5,1]){
   const point=new T.Vector3(...path.origin).lerp(new T.Vector3(...path.end),fraction);
   assert.ok(inFrame(point.clone().project(sample)),'primary launch and first hit stay visible');
   const direction=point.clone().sub(sample.position),distance=direction.length();ray.set(sample.position,direction.normalize());ray.far=distance-.12;
   const opaque=ray.intersectObject(court.world,true).filter(h=>h.object.visible&&!(h.object.material as T.MeshPhysicalMaterial).transmission);
   assert.equal(opaque.length,0,'primary launch is not hidden by scene geometry');
  }
 }
});

test('samples keep all actual architecture, visibility and materials unchanged through revisit and replay',()=>{
 const court=createCourtyard(),visuals=new JourneyVisuals(court),original=court.sphere.material;
 const meshes:T.Mesh[]=[];court.world.traverse(o=>{if(o instanceof T.Mesh)meshes.push(o);});
 meshes[0].visible=false;const visibility=meshes.map(o=>o.visible);visuals.rasterOnly.visible=false;
 for(let visit=0;visit<2;visit++){
  visuals.apply(beats.find(b=>b.id==='samples')!);visuals.update(1,4.18);
  assert.deepEqual(meshes.map(o=>o.visible),visibility);
  assert.ok(court.sphere.material===original);assert.equal(visuals.rasterOnly.visible,false);
  visuals.apply(beats.find(b=>b.id==='samples')!);
  assert.deepEqual(meshes.map(o=>o.visible),visibility);
  visuals.apply(beats.find(b=>b.id==='loop')!);
  assert.ok(court.sphere.material===original);assert.deepEqual(meshes.map(o=>o.visible),visibility);
 }
});

test('ray weights use the actual material linear RGB and display hue without increasing energy',()=>{
 const court=createCourtyard(),diffuse=linearRGB(materialPalette.diffuse),metal=linearRGB(materialPalette.metal);
 assert.deepEqual(throughput[1],diffuse);
 for(let i=0;i<3;i++){
  assert.ok(Math.abs((court.sphere.material as T.MeshStandardMaterial).color.toArray()[i]-diffuse[i])<1e-6);
  assert.ok(Math.abs((court.reflector.material as T.MeshStandardMaterial).color.toArray()[i]-metal[i])<1e-6);
  assert.ok(Math.abs(throughput[2][i]-diffuse[i]*metal[i])<1e-12);
 }
 assert.deepEqual(weightDisplay(throughput[0]).hue,[1,1,1]);
 assert.ok(throughput[1][2]>throughput[1][1]&&throughput[1][1]>throughput[1][0]);
 assert.ok(throughput[2][1]>throughput[2][0]&&throughput[2][1]>throughput[2][2]);
 assert.ok(weightDisplay(throughput[2]).magnitude<weightDisplay(throughput[1]).magnitude);
});

test('sample additions start new launches after earlier rays have finished; replay resets the same set',()=>{
 const visuals=new JourneyVisuals(createCourtyard()),b=beats.find(b=>b.id==='samples')!;
 visuals.apply(b);visuals.update(8,b.rayTo);
 assert.equal(visuals.samples.children.filter(o=>o.visible).length,24);
 visuals.setSampleCount(24);visuals.update(8,b.rayTo);
 assert.equal(visuals.illustratedSampleCount,24);
 assert.equal(visuals.samples.children.filter(o=>o.visible).length,24,'new batch starts hidden');
 assert.ok(visuals.isEmitting);
 visuals.update(8.75,b.rayTo);
 assert.ok(visuals.samples.children.filter(o=>o.visible).length>24);
 visuals.update(14,b.rayTo);assert.equal(visuals.isEmitting,false);
 visuals.apply(b);visuals.update(0,b.rayTo);
 assert.equal(visuals.illustratedSampleCount,24);assert.equal(visuals.samples.children.filter(o=>o.visible).length,0);
});

test('mirror emissions retain visible ordering and BVH gives active bounds priority',()=>{
 assert.equal(emissionProgress(0,0),0);assert.ok(emissionProgress(1,0)>emissionProgress(1,4));
 const visuals=new JourneyVisuals(createCourtyard()),b=beats.find(b=>b.id==='materials')!;
 visuals.apply(b);visuals.update(0,b.rayTo);
 const before=visuals.materialRays.children.filter(o=>o.visible).length;
 visuals.update(1,b.rayTo);assert.ok(visuals.materialRays.children.filter(o=>o.visible).length>before);
 visuals.setResolution(794,568);
 for(const box of visuals.boxObjects.values()){
  assert.deepEqual(box.ink.resolution.toArray(),[794,568]);
  assert.ok(box.ink.opacity>0&&box.ink.opacity<=1);assert.equal(box.ink.depthTest,false);
  assert.ok(box.outline.linewidth>box.ink.linewidth);
 }
 assert.notEqual(bvhInk.active,bvhInk.child);assert.notEqual(bvhInk.child,bvhInk.rejected);
});
