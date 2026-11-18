import {test} from 'node:test';import assert from 'node:assert/strict';import * as T from 'three';
import {beats} from '../src/content/chapters.ts';import {route} from '../src/core/route.ts';
import {shotPose} from '../src/core/cinematics.ts';import {createCourtyard} from '../src/engine/courtyard.ts';import {JourneyVisuals} from '../src/engine/visuals.ts';
test('lessons continue beyond glass without a global camera return',()=>{
 for(const aspect of [16/9,9/16])for(const id of ['cost','bvh','to-light','light']){
  const i=beats.findIndex(b=>b.id===id),a=shotPose(beats[i-1],beats[Math.max(0,i-2)],1,aspect),b=shotPose(beats[i],beats[i-1],1,aspect);
  assert.ok(Math.hypot(...a.position.map((v,k)=>v-b.position[k]))<65,id);
  assert.ok(b.position[0]>=a.position[0]-1,id);
 }
});
test('sampling and loop keep only the unscaled physical path after source/back/revisit',()=>{
 const visuals=new JourneyVisuals(createCourtyard());
 for(const id of ['samples','loop','light','samples','bvh','loop']){
  const beat=beats.find(b=>b.id===id)!;visuals.apply(beat);visuals.update(8,beat.rayTo);
  assert.ok(visuals.path.parent===visuals.root,'physical path belongs directly to the world illustration root');assert.deepEqual(visuals.path.scale.toArray(),[1,1,1]);
  assert.deepEqual(visuals.path.position.toArray(),[0,0,0]);
  assert.equal(visuals.guideAnchors.some(a=>/model|cameră|difuz|oglindă|sticlă|pixel/.test(a.text)),false);
  if(['samples','loop'].includes(id)){
   assert.equal(visuals.packet.visible,false);assert.equal(visuals.selection.visible,false);
   assert.equal(visuals.segments.filter(o=>o.visible).length,5);
   const transmitted=visuals.segments[4],expected=new T.Vector3(...route[4]).lerp(new T.Vector3(...route[5]),(beat.rayTo-4)/2);
   assert.ok(transmitted.position.distanceTo(expected)<1e-8,'transmitted segment remains in the actual world');
  }
 }
});
test('bridge query remains a separate actual-mesh test while the optical path stays as context',()=>{
 const room=createCourtyard(),visuals=new JourneyVisuals(room),beat=beats.find(b=>b.id==='cost')!;
 visuals.apply(beat);visuals.update(8,beat.rayTo);
 assert.equal(visuals.path.visible,true);assert.equal(visuals.packet.visible,false);
 assert.ok(visuals.guideAnchors.some(a=>a.text==='intersectScene · rază de test'));
 assert.deepEqual(visuals.testRayOrigin,room.rayOrigin);assert.ok(visuals.testRayDirection.every((v,i)=>Math.abs(v-room.rayDirection[i])<1e-12));
 assert.equal(visuals.traversal.triangle,room.traversal.triangle);assert.ok(visuals.traversal.triangle>=0);
});
test('essential guide labels are visible projected anchors rather than raster text sprites',()=>{
 const visuals=new JourneyVisuals(createCourtyard());
 for(const id of ['diffuse','materials','to-glass','sah','aabb']){
  const beat=beats.find(b=>b.id===id)!;visuals.apply(beat);visuals.update(8,beat.rayTo);
  const labels=visuals.guideAnchors;assert.ok(labels.length>0,id);assert.ok(labels.every(o=>o.text.length>0&&o.point.every(Number.isFinite)));
 }
});

test('diffuse selection requires the next beat and replay restores the same explicit phase',()=>{
 const visuals=new JourneyVisuals(createCourtyard()),candidate=beats.find(b=>b.id==='diffuse')!,chosen=beats.find(b=>b.id==='diffuse-chosen')!;
 assert.ok(chosen);assert.deepEqual(chosen.camera,candidate.camera);assert.equal(chosen.rayFrom,1);assert.equal(chosen.rayTo,1);
 visuals.apply(candidate);visuals.update(20,candidate.rayTo);assert.equal(visuals.diffusePhase,'candidates');
 assert.equal(visuals.hemisphere.children.filter(o=>o.name.startsWith('Diffuse candidate tip')&&o.visible).length,7);
 assert.equal(visuals.guideAnchors.some(a=>a.text==='direcția aleasă'),false);
 visuals.apply(chosen);assert.equal(visuals.diffusePhase,'selected');
 assert.equal(visuals.guideAnchors.some(a=>a.text==='direcția aleasă'),true);
 const selected=visuals.hemisphere.getObjectByName('Diffuse candidate tip 6')!;
 const actual=new T.Vector3(...route[2]).sub(new T.Vector3(...route[1])).normalize(),shown=selected.position.clone().sub(new T.Vector3(...route[1])).normalize();
 assert.ok(actual.dot(shown)>1-1e-10);
 visuals.apply(candidate);assert.equal(visuals.diffusePhase,'candidates');
 visuals.apply(chosen);assert.equal(visuals.diffusePhase,'selected');
});
test('BVH and traversal automatically descend actual boxes and triangle tests then repeat',()=>{
 const visuals=new JourneyVisuals(createCourtyard());
 for(const id of ['bvh','traversal']){
  const beat=beats.find(b=>b.id===id)!;visuals.apply(beat);assert.equal(visuals.manualStep,null);assert.equal(visuals.currentHit?.triangle,-1);
  visuals.update(1.8,beat.rayTo);assert.ok(visuals.lastStep>0);assert.ok(visuals.event.node.depth>0);
  const leafStep=visuals.traversal.events.findIndex(e=>e.testedTriangle!==undefined);assert.ok(leafStep>0);
  visuals.step(leafStep-visuals.lastStep);assert.equal(visuals.event.testedTriangle,visuals.event.node.indices[0]);
  visuals.traversalPlayback(true);visuals.update(visuals.traversal.events.length*.85+1.7+.01,beat.rayTo);assert.equal(visuals.manualStep,null);
  assert.ok(visuals.lastStep<visuals.traversal.events.length-1);
 }
});
test('traversal never exposes a future hit and miss clears all hit vertices',()=>{
 const visuals=new JourneyVisuals(createCourtyard()),beat=beats.find(b=>b.id==='traversal')!;visuals.apply(beat);
 assert.equal(visuals.currentHit?.triangle,-1);assert.equal(visuals.root.children.filter(o=>o.name.startsWith('Closest triangle vertex')&&o.visible).length,0);
 const firstHit=visuals.traversal.events.findIndex(e=>e.triangle>=0);assert.ok(firstHit>0);visuals.step(firstHit);
 assert.equal(visuals.root.children.filter(o=>o.name.startsWith('Closest triangle vertex')&&o.visible).length,3);
 visuals.setCase('miss');visuals.update(0,beat.rayTo);assert.equal(visuals.currentHit?.triangle,-1);
 assert.equal(visuals.root.children.filter(o=>o.name.startsWith('Closest triangle vertex')&&o.visible).length,0);
});
