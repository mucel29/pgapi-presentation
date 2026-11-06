import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cosineHemisphere, dot, intersectAABB, intersectSphere, intersectTriangle, normalize, reflect, refract, rng, buildBVH, visitBVH, type Vec3 } from '../src/core/math.ts';

const close=(a:number,b:number,e=1e-7)=>assert.ok(Math.abs(a-b)<e,`${a} ≈ ${b}`);
test('sphere selects the closest positive root, including inside and tangent rays',()=>{
  close(intersectSphere([0,0,3],[0,0,-1],[0,0,0],1)!,2);
  close(intersectSphere([0,0,0],[1,0,0],[0,0,0],1)!,1);
  close(intersectSphere([1,0,3],[0,0,-1],[0,0,0],1)!,3);
  assert.equal(intersectSphere([2,0,3],[0,0,-1],[0,0,0],1),null);
  assert.equal(intersectSphere([0,0,3],[0,0,1],[0,0,0],1),null);
});
test('Möller–Trumbore rejects outside, behind, and parallel intersections',()=>{
  const tri: [Vec3,Vec3,Vec3]=[[-1,-1,0],[1,-1,0],[0,1,0]];
  close(intersectTriangle([0,0,2],[0,0,-1],...tri)!,2);
  assert.equal(intersectTriangle([2,0,2],[0,0,-1],...tri),null);
  assert.equal(intersectTriangle([0,0,2],[0,0,1],...tri),null);
  assert.equal(intersectTriangle([0,0,2],[1,0,0],...tri),null);
});
test('slabs handle parallel directions and origins exactly on the boundary without NaN',()=>{
  const min:Vec3=[-1,-1,-1],max:Vec3=[1,1,1];
  close(intersectAABB([1,0,3],[0,0,-1],min,max)!,2);
  close(intersectAABB([0,0,0],[0,1,0],min,max)!,0);
  assert.equal(intersectAABB([2,0,3],[0,0,-1],min,max),null);
  assert.equal(intersectAABB([0,0,3],[0,0,-1],min,max,1),null);
});
test('reflection and refraction preserve direction length; total internal reflection is explicit',()=>{
  const d=normalize([1,-1,0]),r=reflect(d,[0,1,0]);close(r[0],d[0]);close(r[1],-d[1]);close(dot(r,r),1);
  const transmitted=refract(normalize([.5,-1,0]),[0,1,0],1/1.5)!;close(dot(transmitted,transmitted),1);assert.ok(transmitted[1]<0);
  assert.equal(refract(normalize([.9,-.3,0]),[0,1,0],1.5),null);
});
test('seeded cosine sampling stays in the requested hemisphere and has the expected cosine mean',()=>{
  const random=rng(529),normal=normalize([.3,.7,-.2]);let sum=0;
  for(let i=0;i<20000;i++){const v=cosineHemisphere(random(),random(),normal);close(dot(v,v),1);const cosine=dot(v,normal);assert.ok(cosine>=-1e-9);sum+=cosine;}
  close(sum/20000,2/3,.01);assert.equal(rng(42)(),rng(42)());
});
test('BVH candidate traversal never drops a sphere hit across seeded rays',()=>{
  const centers:Vec3[]=[[-2,0,0],[0,0,0],[2,0,0],[1,2,1],[-1,1,-2],[0,-2,1]];
  const bounds=centers.map(c=>({min:c.map(x=>x-.5) as Vec3,max:c.map(x=>x+.5) as Vec3}));
  const root=buildBVH(bounds,1),random=rng(991);
  for(let i=0;i<500;i++){
    const o:Vec3=[(random()-.5)*8,(random()-.5)*8,6],d=normalize([(random()-.5)*4,(random()-.5)*4,-6]);
    const candidates=new Set(visitBVH(root,o,d).candidates);
    centers.forEach((c,j)=>{if(intersectSphere(o,d,c,.5)!==null)assert.ok(candidates.has(j));});
  }
});
