import * as T from 'three';
import type {Vec3} from './math.ts';
// Preserve architectural up when a plane faces almost -Z. A shortest-arc
// quaternion alone can introduce an arbitrary large roll around that normal.
export function surfaceRotation(normal:Vec3){
 const z=new T.Vector3(...normal).normalize(),x=new T.Vector3().crossVectors(new T.Vector3(0,1,0),z).normalize(),y=new T.Vector3().crossVectors(z,x).normalize();
 return new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(x,y,z));
}
