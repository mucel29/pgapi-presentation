import {test} from 'node:test';import assert from 'node:assert/strict';import * as T from 'three';
import {beats} from '../src/content/chapters.ts';import {route} from '../src/core/route.ts';
import {shotPose} from '../src/core/cinematics.ts';import {createCourtyard} from '../src/engine/courtyard.ts';import {JourneyVisuals} from '../src/engine/visuals.ts';
import {lessonRoute,lessonScale,lessonOffset} from '../src/core/lesson-space.ts';
test('local sampling model fits every selected vertex clear of actual desktop and phone cards',()=>{
 const index=beats.findIndex(b=>b.id==='samples'),shot=beats[index];
 for(const [w,h,bounds] of [[1280,720,[420,1240,85,630]],[390,844,[20,370,85,355]],[740,390,[365,725,70,315]],[844,390,[365,825,70,315]]] as const){
  const pose=shotPose(shot,beats[index-1],1,w/h,w),camera=new T.PerspectiveCamera(43,w/h,.05,1000);camera.position.set(...pose.position);camera.lookAt(...pose.target);camera.updateMatrixWorld();
  for(const point of lessonRoute){const p=new T.Vector3(...point).project(camera),x=(p.x+1)*w/2,y=(1-p.y)*h/2;
   assert.ok(p.z> -1&&p.z<1&&x>bounds[0]&&x<bounds[1]&&y>bounds[2]&&y<bounds[3],`${w}x${h} route point ${point}: ${x},${y}`);
  }
 }
});
test('lessons continue beyond glass without a global camera return',()=>{
 for(const aspect of [16/9,9/16])for(const id of ['samples','loop','cost','noise','light']){
  const i=beats.findIndex(b=>b.id===id),a=shotPose(beats[i-1],beats[Math.max(0,i-2)],1,aspect),b=shotPose(beats[i],beats[i-1],1,aspect);
  assert.ok(Math.hypot(...a.position.map((v,k)=>v-b.position[k]))<65,id);
  assert.ok(b.position[0]>=a.position[0]-1,id);
 }
});
test('sample and loop model restore their transform and labels after source/back/revisit',()=>{
 const visuals=new JourneyVisuals(createCourtyard());
 for(const id of ['samples','loop','light','samples','bvh','loop']){
  const beat=beats.find(b=>b.id===id)!;visuals.apply(beat);visuals.update(8,beat.rayTo);
  const local=['samples','loop'].includes(id);assert.equal(visuals.lesson.scale.x,local?lessonScale:1);assert.deepEqual(visuals.lesson.position.toArray(),local?lessonOffset:[0,0,0]);
  assert.equal(visuals.guideAnchors.some(a=>a.text==='model · același pixel'),local);
 }
});
test('depth controls reveal more selected segments without mutating the overview camera definition',()=>{
 const visuals=new JourneyVisuals(createCourtyard()),beat=beats.find(b=>b.id==='samples')!,definition=JSON.stringify(beat);
 visuals.apply(beat);visuals.update(8,beat.rayTo);visuals.setDepth(2);assert.equal(visuals.segments.filter(o=>o.visible).length,2);
 visuals.setDepth(8);assert.equal(visuals.segments.filter(o=>o.visible).length,5);assert.equal(JSON.stringify(beat),definition);
});
test('essential guide labels are visible projected anchors rather than raster text sprites',()=>{
 const visuals=new JourneyVisuals(createCourtyard());
 for(const id of ['diffuse','materials','to-glass','sah','aabb']){
  const beat=beats.find(b=>b.id===id)!;visuals.apply(beat);visuals.update(8,beat.rayTo);
  const labels=visuals.guideAnchors;assert.ok(labels.length>0,id);assert.ok(labels.every(o=>o.text.length>0&&o.point.every(Number.isFinite)));
 }
});
