import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {MeshBVH,SAH} from 'three-mesh-bvh';
import {buildSAH,traceSAH,traceTriangles,type Triangle} from '../src/core/bvh.ts';
import {route,routeChecks,diffuseNormal,metalNormal,insideGlass,outsideGlass} from '../src/core/route.ts';
import {normalize,sub,dot,reflect,rng} from '../src/core/math.ts';
import {chapters,beats} from '../src/content/chapters.ts';
const close=(a:number,b:number)=>assert.ok(Math.abs(a-b)<1e-5,`${a} ≈ ${b}`);
test('selected material route obeys diffuse hemisphere, reflection and glass entry/exit',()=>{
 assert.ok(routeChecks.diffuseHemisphere>0);assert.ok(dot(normalize(sub(route[2],route[1])),diffuseNormal)>0);
 const r=reflect(normalize(sub(route[2],route[1])),metalNormal),wanted=normalize(sub(route[3],route[2]));r.forEach((v,i)=>close(v,wanted[i]));
 close(dot(insideGlass,insideGlass),1);outsideGlass.forEach((v,i)=>close(v,wanted[i]));close(route[3][2]-route[4][2],2);
});
test('triangle SAH closest hits match brute force and the production BVH library',()=>{
 const geo=new T.TorusGeometry(5,1.05,4,12,Math.PI),pos=geo.attributes.position,idx=geo.index!,triangles:Triangle[]=[];
 for(let i=0;i<idx.count;i+=3)triangles.push([0,1,2].map(k=>new T.Vector3().fromBufferAttribute(pos,idx.getX(i+k)).toArray()) as Triangle);
 const tree=buildSAH(triangles),library=new MeshBVH(geo.clone(),{strategy:SAH,maxLeafTris:4}),random=rng(817);let saved=0;
 for(let i=0;i<250;i++){const o:[number,number,number]=[(random()-.5)*16,random()*10,15],d=normalize([(random()-.5)*2,(random()-.5)*2,-15]);const a=traceSAH(tree,triangles,o,d),b=traceTriangles(triangles,o,d),c=library.raycastFirst(new T.Ray(new T.Vector3(...o),new T.Vector3(...d)),T.DoubleSide);
 if(Number.isFinite(b.closest)){close(a.closest,b.closest);close(a.closest,c.distance);}else{assert.equal(a.closest,Infinity);assert.equal(c,null);}saved+=triangles.length-a.triangleTests;
 assert.equal(a.boxTests,a.events.reduce((count,e)=>count+(e.status==='hit'?2:0),1));
 }assert.ok(saved>10000);assert.ok(tree.candidates.length>0);
});
test('manifest contains 15 independent topics and four extra travel beats',()=>{
 assert.equal(chapters.length,15);assert.equal(beats.length,19);assert.equal(beats.filter(b=>b.travel).length,4);assert.equal(new Set(beats.map(b=>b.id)).size,19);
 for(const c of chapters){assert.ok(beats.some(b=>b.id===c.id));assert.ok(c.points.length>=3);assert.ok(c.notes.length>50);assert.ok(c.sources.length);}
 for(const b of beats){assert.ok(chapters.some(c=>c.id===b.chapter));assert.ok(b.rayFrom<=b.rayTo);assert.ok(b.rayTo<=5);}
});
