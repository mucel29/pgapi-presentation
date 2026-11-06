import * as T from 'three';
import {buildSAH,traceSAH,type Triangle} from './bvh.ts';
import type {Vec3} from './math.ts';
// Shared by the courtyard, geometry checks and the PPTX exporter. No GPU work.
export function createTeachingData(){
 const geometry=new T.TorusGeometry(5,1.05,4,12,Math.PI);geometry.translate(-12,3,-38);
 const position=geometry.attributes.position,index=geometry.index!,triangles:Triangle[]=[];
 for(let i=0;i<index.count;i+=3)triangles.push([0,1,2].map(k=>new T.Vector3().fromBufferAttribute(position,index.getX(i+k)).toArray()) as Triangle);
 const tree=buildSAH(triangles),target=triangles[30].reduce((a,p)=>a.map((v,i)=>v+p[i]/3) as Vec3,[0,0,0] as Vec3),rayOrigin:Vec3=[target[0]+2,target[1]+1,target[2]+25],rayDirection=new T.Vector3(...target).sub(new T.Vector3(...rayOrigin)).normalize().toArray() as Vec3;
 return {geometry,triangles,tree,rayOrigin,rayDirection,traversal:traceSAH(tree,triangles,rayOrigin,rayDirection)};
}
