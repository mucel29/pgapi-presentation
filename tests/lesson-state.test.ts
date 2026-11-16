import {test} from 'node:test';
import assert from 'node:assert/strict';
import {cameraPixel,illustratedSamples} from '../src/core/sampling.ts';
import {selectedPathEstimate,loopStageState} from '../src/core/lesson-state.ts';
import {explorerRaster} from '../src/core/raster.ts';
import {dot,sub} from '../src/core/math.ts';
import {throughput} from '../src/core/route.ts';
import {buildSAH} from '../src/core/bvh.ts';
import {createTeachingData} from '../src/core/teaching.ts';
test('camera image cell and all jitter use the same pinhole basis and footprint',()=>{
 for(const sample of illustratedSamples(64)){
  assert.deepEqual(sample.origin,cameraPixel.origin);
  const offset=sub(sample.pixel,cameraPixel.center);
  assert.ok(Math.abs(dot(offset,cameraPixel.forward))<1e-10);
  assert.ok(Math.abs(dot(offset,cameraPixel.right))<=cameraPixel.footprint/2);
  assert.ok(Math.abs(dot(offset,cameraPixel.up))<=cameraPixel.footprint/2);
  const ray=sub(sample.pixel,sample.origin);assert.ok(dot(ray,sample.direction)>0);
 }
 assert.notDeepEqual(cameraPixel.center,cameraPixel.origin);
});
test('illustrative depth changes actual selected segments and includes emission only on arrival',()=>{
 const short=selectedPathEstimate(2),full=selectedPathEstimate(8);
 assert.equal(short.segments,2);assert.equal(short.reachesLight,false);assert.deepEqual(short.contribution,[0,0,0]);
 assert.equal(full.segments,5);assert.equal(full.reachesLight,true);
 assert.deepEqual(full.beta,throughput[4]);
 assert.deepEqual(full.contribution,full.beta.map((v,i)=>v*full.emission[i]));
 assert.deepEqual(loopStageState(2).radiance,[0,0,0]);
 assert.deepEqual(loopStageState(5).beta,throughput[1]);
});
test('explorer raster resolution responds to scale and preserves aspect within bounded 720p',()=>{
 const full=explorerRaster(1920,1080,1),half=explorerRaster(1920,1080,.5);
 assert.deepEqual(full,{width:1280,height:720});assert.deepEqual(half,{width:640,height:360});
 assert.ok(explorerRaster(390,844,1).height<=720);
});
test('every SAH candidate carries the actual bound areas used in its recomputed cost',()=>{
 const tree=buildSAH(createTeachingData().triangles);
 for(const c of tree.candidates){assert.ok(c.leftArea>0&&c.rightArea>0);assert.ok(Math.abs(c.cost-(1+(c.leftArea*c.left+c.rightArea*c.right)/c.parentArea))<1e-10);}
});
