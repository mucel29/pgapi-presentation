import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PerspectiveCamera,Vector3} from 'three';
import {restoreCaptureCamera,fitCaptureProjection,type CaptureCamera} from '../src/core/capture-camera.ts';

const pose=JSON.parse(readFileSync(new URL('../public/assets/pathtraced/manifest.json',import.meta.url),'utf8')).camera as CaptureCamera;

test('exploration reset preserves the recorded camera after synchronizing the orbit target',()=>{
 const camera=new PerspectiveCamera(60,1,.1,500),controls={target:new Vector3(99,99,99),enableDamping:true,update(){camera.lookAt(this.target);}};
 for(let visit=0;visit<2;visit++){
  camera.position.set(94,62,-59);camera.quaternion.identity();camera.fov=60;
  restoreCaptureCamera(camera,controls,pose);
  assert.deepEqual(camera.position.toArray(),pose.position);assert.deepEqual(camera.quaternion.toArray(),pose.quaternion);
  assert.deepEqual(controls.target.toArray(),pose.target);assert.equal(controls.enableDamping,true);
  assert.equal(camera.fov,pose.fov);assert.equal(camera.aspect,pose.aspect);assert.equal(camera.near,pose.near);assert.equal(camera.far,pose.far);
 }
});

test('responsive exploration matches the prepared capture cover crop without changing its pose',()=>{
 const camera=new PerspectiveCamera(),controls={target:new Vector3(),enableDamping:false,update(){}};
 restoreCaptureCamera(camera,controls,pose);
 for(const aspect of [pose.aspect,9/16,21/9]){
  fitCaptureProjection(camera,pose,aspect);
  assert.equal(camera.aspect,aspect);assert.deepEqual(camera.position.toArray(),pose.position);assert.deepEqual(camera.quaternion.toArray(),pose.quaternion);
  const expected=Math.tan(pose.fov*Math.PI/360)*Math.min(1,pose.aspect/aspect);
  assert.ok(Math.abs(Math.tan(camera.fov*Math.PI/360)-expected)<1e-14);
 }
});
