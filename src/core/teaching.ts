import * as T from 'three';
import {buildSAH,traceSAH,type Triangle} from './bvh.ts';
import type {Vec3} from './math.ts';
import {observatory} from './world.ts';
import {glassExit,outsideGlass,lightHit} from './route.ts';
// The bridge truss and the beacon aperture form the BVH primitive set.
// The query ray is the real path segment from the glass exit to the beacon.
export const beamSides=8;
export function beaconTriangles():Triangle[]{
 const g=new T.PlaneGeometry(10,9).toNonIndexed();g.translate(0,0,.05);
 g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,1),new T.Vector3(...outsideGlass).negate()));g.translate(...lightHit);
 const p=g.attributes.position,out:Triangle[]=[];for(let i=0;i<p.count;i+=3)out.push([0,1,2].map(k=>[p.getX(i+k),p.getY(i+k),p.getZ(i+k)]) as Triangle);g.dispose();return out;
}
export function createTeachingData(){
 const {center,span,height,width,panels}=observatory.bridge,positions:number[]=[],normals:number[]=[],panel=span/panels;
 const at=(x:number,y:number,z:number)=>new T.Vector3(center[0]+x,center[1]+y,center[2]+z);
 const beam=(a:T.Vector3,b:T.Vector3,radius=.24)=>{
  const vector=b.clone().sub(a),g=new T.CylinderGeometry(radius,radius,vector.length(),beamSides,1).toNonIndexed();
  g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),vector.normalize()));g.translate(...a.clone().add(b).multiplyScalar(.5).toArray());
  positions.push(...g.attributes.position.array);normals.push(...g.attributes.normal.array);g.dispose();
 };
 const left=-span/2,top=height/2,bottom=-height/2;
 for(const z of [-width/2,width/2]){
  // Two chords and a Warren pattern of diagonals on each side.
  for(const y of [bottom,top])beam(at(left,y,z),at(-left,y,z),.32);
  for(let i=0;i<panels;i++)beam(at(left+i*panel,i%2?top:bottom,z),at(left+(i+1)*panel,i%2?bottom:top,z));
 }
 for(let i=0;i<=panels;i++){beam(at(left+i*panel,bottom,-width/2),at(left+i*panel,bottom,width/2),.2);beam(at(left+i*panel,top,-width/2),at(left+i*panel,top,width/2),.2);}
 for(let i=0;i<panels;i++)beam(at(left+i*panel,top,i%2?width/2:-width/2),at(left+(i+1)*panel,top,i%2?-width/2:width/2),.16);
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('normal',new T.Float32BufferAttribute(normals,3));
 const position=geometry.attributes.position,bridgeTriangles:Triangle[]=[];
 for(let i=0;i<position.count;i+=3)bridgeTriangles.push([0,1,2].map(k=>new T.Vector3().fromBufferAttribute(position,i+k).toArray()) as Triangle);
 const triangles=[...bridgeTriangles,...beaconTriangles()],tree=buildSAH(triangles),rayOrigin:Vec3=[...glassExit],rayDirection:Vec3=[...outsideGlass];
 return {geometry,triangles,bridgeTriangleCount:bridgeTriangles.length,tree,rayOrigin,rayDirection,traversal:traceSAH(tree,triangles,rayOrigin,rayDirection)};
}
