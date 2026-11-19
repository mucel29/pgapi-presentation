import * as T from 'three';
import {observatory} from './world.ts';
import {sub,normalize,triangleIntersection,type Vec3} from './math.ts';
import type {Triangle} from './bvh.ts';

// The cyan receiver is a triangle mesh. The primary ray hits one of its triangles.
export const sphereSegments={width:20,height:12};
// A small tilt keeps the primary hit inside one triangle, not on a row edge.
export function sphereGeometry(){const g=new T.SphereGeometry(observatory.sphereRadius,sphereSegments.width,sphereSegments.height);g.rotateX(.1);g.rotateY(.05);return g;}
export function sphereTriangles():Triangle[]{
 const g=sphereGeometry().toNonIndexed(),p=g.attributes.position,c=observatory.sphere,out:Triangle[]=[];
 for(let i=0;i<p.count;i+=3){
  const tri=[0,1,2].map(k=>[p.getX(i+k)+c[0],p.getY(i+k)+c[1],p.getZ(i+k)+c[2]] as Vec3) as Triangle;
  // Pole rows contain degenerate triangles with two equal vertices.
  const [a,b,d]=tri,e1=sub(b,a),e2=sub(d,a),n=[e1[1]*e2[2]-e1[2]*e2[1],e1[2]*e2[0]-e1[0]*e2[2],e1[0]*e2[1]-e1[1]*e2[0]];
  if(Math.hypot(...n)>1e-9)out.push(tri);
 }
 g.dispose();return out;
}
/** The triangle hit by the primary ray from the camera origin towards the sphere center. */
export function primaryHit(){
 const o:Vec3=[...observatory.origin],d=normalize(sub(observatory.sphere,o)),triangles=sphereTriangles();
 let best={t:Infinity,u:0,v:0,index:-1};
 triangles.forEach((tri,index)=>{const r=triangleIntersection(o,d,...tri);if(r?.hit&&r.t>1e-4&&r.t<best.t)best={t:r.t,u:r.u,v:r.v,index};});
 if(best.index<0)throw Error('primary ray misses the sphere mesh');
 return {o,d,triangle:triangles[best.index],count:triangles.length,...best};
}
