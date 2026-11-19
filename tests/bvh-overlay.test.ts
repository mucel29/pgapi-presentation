import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {JourneyVisuals} from '../src/engine/visuals.ts';
import {createCourtyard} from '../src/engine/courtyard.ts';
import {probeClearance} from '../src/core/acceleration-model.ts';
import {shotPose,shotState} from '../src/core/cinematics.ts';
import {beats} from '../src/content/chapters.ts';

test('BVH helpers use a distinct overlay and the query draws over the active box',()=>{
 const visuals=new JourneyVisuals(createCourtyard());visuals.apply(beats.find(b=>b.id==='traversal')!);visuals.setResolution(1440,900);
 assert.ok(visuals.root.parent===visuals.accelerationOverlay);assert.ok(visuals.accelerationModel.parent===visuals.accelerationScene);
 const ray=visuals.wire.getObjectByName('BVH query ray')!,tip=visuals.wire.getObjectByName('BVH query direction')!;
 let boxOrder=0;visuals.boxes.traverse(o=>boxOrder=Math.max(boxOrder,o.renderOrder));assert.ok(ray.renderOrder>boxOrder&&tip.renderOrder>ray.renderOrder);
 assert.ok(!(ray as T.Mesh).material.depthTest);assert.ok(visuals.accelerationScene.getObjectByName('Stanford Bunny pedestal')!==undefined);
 const active=visuals.boxObjects.get(visuals.tree.id)!;assert.ok(active.ink.linewidth<2);assert.ok([...visuals.boxObjects.values()].filter(b=>b.ink.opacity>.1).length===1);
 visuals.setCase('other');assert.ok(Number.isFinite(visuals.traversal.closest));assert.ok(visuals.traversal.triangle>=0);
});

test('source flight pauses at the real Bunny clearance and then reaches the source',()=>{
 const i=beats.findIndex(b=>b.id==='to-light'),beat=beats[i];assert.ok(beat.motion==='beacon');assert.ok(!beats.some(b=>b.id==='near-bunny'));
 const a=shotPose(beat,beats[i-1],.4),b=shotPose(beat,beats[i-1],.52);assert.ok(new T.Vector3(...a.position).distanceTo(new T.Vector3(...b.position))<1e-8);
 assert.ok(Math.abs(a.ray-probeClearance.progress)<1e-8);assert.ok(probeClearance.distance>0&&probeClearance.distance<1);
 assert.ok(new T.Vector3(...a.target).distanceTo(new T.Vector3(...probeClearance.point))<1e-8);
 let previous=beat.rayFrom;for(let sample=0;sample<=100;sample++){const ray=shotState('beacon',sample/100,beat.rayFrom,beat.rayTo).ray;assert.ok(ray>=previous-1e-10);previous=ray;}assert.equal(previous,5);
});
