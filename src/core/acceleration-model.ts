import * as T from 'three';
import bunny from '../assets/stanford-bunny-res4.json' with {type:'json'};
import {buildSAH,traceSAH,type Triangle} from './bvh.ts';
import {sub,add,mul,type Vec3} from './math.ts';
import {glassExit,outsideGlass} from './route.ts';
export const probeScale=.6;
// The selected physical segment passes beside the rabbit, through its AABB.
const passage:Vec3=[0,1.3,1.9];
export const probePosition=sub(add(glassExit,mul(outsideGlass,32)),mul(passage,probeScale));
// Exact closest clearance between the selected ray and a Bunny triangle edge.
// A ray missing a nonparallel triangle has its closest point on the boundary.
export const probeClearance=(()=>{
 const ray=new T.Ray(new T.Vector3(...sub(passage,mul(outsideGlass,13))),new T.Vector3(...outsideGlass));let distance=Infinity,triangle=0;const rayPoint=new T.Vector3(),meshPoint=new T.Vector3();
 bunny.faces.forEach((face,index)=>face.forEach((vertex,edge)=>{
  const a=new T.Vector3().fromArray(bunny.vertices[vertex]),b=new T.Vector3().fromArray(bunny.vertices[face[(edge+1)%3]]),onRay=new T.Vector3(),onMesh=new T.Vector3(),squared=ray.distanceSqToSegment(a,b,onRay,onMesh);
  if(squared<distance){distance=squared;triangle=index;rayPoint.copy(onRay);meshPoint.copy(onMesh);}
 }));
 const world=(p:T.Vector3)=>p.multiplyScalar(probeScale).add(new T.Vector3(...probePosition)).toArray() as Vec3;
 const point=world(rayPoint),surface=world(meshPoint),progress=4+new T.Vector3(...point).distanceTo(new T.Vector3(...glassExit))/70;
 return {point,surface,progress,triangle,distance:Math.sqrt(distance)*probeScale,vertices:bunny.faces[triangle].map(i=>world(new T.Vector3().fromArray(bunny.vertices[i])))};
})();

// Genuine Stanford Bunny res4, bundled locally; rendered faces and CPU queries
// use the identical 948 triangles. See assets/STANFORD-BUNNY-CREDITS.md.
export function createAccelerationData(){
 const positions:number[]=[],colors:number[]=[];
 const triangles=bunny.faces.map(face=>face.map(i=>[...bunny.vertices[i]] as Vec3) as Triangle);
 for(const tri of triangles)for(const vertex of tri){positions.push(...vertex);colors.push(.72,.54,.32);}
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));geometry.computeVertexNormals();
 const tree=buildSAH(triangles,12),rayDirection:Vec3=[...outsideGlass],rayOrigin=sub(passage,mul(rayDirection,13));
 return {geometry,triangles,tree,rayOrigin,rayDirection,traversal:traceSAH(tree,triangles,rayOrigin,rayDirection)};
}
