import type {PerspectiveCamera,Vector3} from 'three';

export interface CaptureCamera {
 position:[number,number,number];target:[number,number,number];quaternion:[number,number,number,number];
 fov:number;aspect:number;near:number;far:number;
}

/** Match the prepared image's object-fit: cover crop on other viewport shapes. */
export function fitCaptureProjection(camera:PerspectiveCamera,pose:CaptureCamera,aspect:number){
 camera.aspect=aspect;
 camera.fov=2*Math.atan(Math.tan(pose.fov*Math.PI/360)*Math.min(1,pose.aspect/aspect))*180/Math.PI;
 camera.updateProjectionMatrix();
}

/** Synchronize OrbitControls first, then preserve the recorded pose exactly. */
export function restoreCaptureCamera(camera:PerspectiveCamera,controls:{target:Vector3;enableDamping:boolean;update():unknown},pose:CaptureCamera){
 camera.position.fromArray(pose.position);camera.quaternion.fromArray(pose.quaternion);
 camera.fov=pose.fov;camera.aspect=pose.aspect;camera.near=pose.near;camera.far=pose.far;camera.zoom=1;camera.clearViewOffset();
 controls.target.fromArray(pose.target);
 const damping=controls.enableDamping;controls.enableDamping=false;controls.update();controls.enableDamping=damping;
 controls.target.fromArray(pose.target);camera.position.fromArray(pose.position);camera.quaternion.fromArray(pose.quaternion);camera.updateProjectionMatrix();camera.updateMatrixWorld();
}
