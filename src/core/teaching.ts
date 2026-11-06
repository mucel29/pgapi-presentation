import * as T from 'three';
import {buildSAH,traceSAH,type Triangle} from './bvh.ts';
import type {Vec3} from './math.ts';
import {observatory} from './world.ts';
// These are the actual twelve structural beams visible in the canyon bridge.
// No GPU work: the BVH and all lesson queries use this exact geometry.
export function createTeachingData(){
 const {center,span,height,width}=observatory.bridge,positions:number[]=[],normals:number[]=[];
 const beam=(a:T.Vector3,b:T.Vector3,radius=.32)=>{
  const vector=b.clone().sub(a),g=new T.BoxGeometry(radius,vector.length(),radius).toNonIndexed();
  g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),vector.normalize()));g.translate(...a.clone().add(b).multiplyScalar(.5).toArray());
  positions.push(...g.attributes.position.array);normals.push(...g.attributes.normal.array);g.dispose();
 };
 for(const z of [-width/2,width/2]){
  for(const y of [-height/2,height/2])beam(new T.Vector3(center[0]-span/2,center[1]+y,center[2]+z),new T.Vector3(center[0]+span/2,center[1]+y,center[2]+z),.42);
  for(let i=0;i<4;i++)beam(new T.Vector3(center[0]-span/2+i*span/4,center[1]+(i%2?height/2:-height/2),center[2]+z),new T.Vector3(center[0]-span/2+(i+1)*span/4,center[1]+(i%2?-height/2:height/2),center[2]+z),.48);
 }
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('normal',new T.Float32BufferAttribute(normals,3));
 const position=geometry.attributes.position,triangles:Triangle[]=[];
 for(let i=0;i<position.count;i+=3)triangles.push([0,1,2].map(k=>new T.Vector3().fromBufferAttribute(position,i+k).toArray()) as Triangle);
 const tree=buildSAH(triangles),target=triangles[98].reduce((a,p)=>a.map((v,i)=>v+p[i]/3) as Vec3,[0,0,0] as Vec3),rayOrigin:Vec3=[target[0]-12,target[1]+4,target[2]+34],rayDirection=new T.Vector3(...target).sub(new T.Vector3(...rayOrigin)).normalize().toArray() as Vec3;
 return {geometry,triangles,tree,rayOrigin,rayDirection,traversal:traceSAH(tree,triangles,rayOrigin,rayDirection)};
}
