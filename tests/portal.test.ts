import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {portalLens,monitor} from '../src/core/portal.ts';
test('monitor fills the viewport at the cut and its visible rays match the world camera',()=>{
 for(const aspect of [16/9,4/3,9/16]){
  const lens=portalLens(aspect),observer=new T.PerspectiveCamera(43,aspect,.05,400),view=new T.PerspectiveCamera(lens.textureFov,monitor.width/monitor.height,.05,400),world=new T.PerspectiveCamera(43,aspect,.05,400);
  observer.position.set(0,0,lens.distance);observer.lookAt(0,0,0);observer.updateMatrixWorld();view.updateMatrixWorld();world.updateMatrixWorld();
  const edge=new T.Vector3(monitor.width/2,monitor.height/2,0).project(observer);
  assert.ok(edge.x>=1-1e-10&&edge.y>=1-1e-10);assert.ok(Math.abs(Math.min(edge.x,edge.y)-1)<1e-10);
  for(const x of [-1,0,.6])for(const y of [-1,.3,1]){
   const sampled=new T.Vector3(x/edge.x,y/edge.y,.5).unproject(view).normalize(),direct=new T.Vector3(x,y,.5).unproject(world).normalize();
   assert.ok(sampled.distanceTo(direct)<1e-10);
  }
 }
});
