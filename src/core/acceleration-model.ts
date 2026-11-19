import * as T from 'three';
import bunny from '../assets/stanford-bunny-res4.json' with {type:'json'};
import {buildSAH,traceSAH,type Triangle} from './bvh.ts';
import {sub,add,mul,type Vec3} from './math.ts';
import {glassExit,outsideGlass} from './route.ts';
export const probeScale=.6;
// The selected physical segment passes beside the rabbit, through its AABB.
const passage:Vec3=[0,1.3,1.9];
export const probePosition=sub(add(glassExit,mul(outsideGlass,32)),mul(passage,probeScale));

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
