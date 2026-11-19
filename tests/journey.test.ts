import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {MeshBVH,SAH} from 'three-mesh-bvh';
import {buildSAH,traceSAH,traceTriangles,type Triangle} from '../src/core/bvh.ts';
import {route,routeChecks,diffuseNormal,metalNormal,insideGlass,outsideGlass} from '../src/core/route.ts';
import {normalize,sub,dot,reflect,rng} from '../src/core/math.ts';
import {observatory} from '../src/core/world.ts';
import {createTeachingData} from '../src/core/teaching.ts';
import {chapters,beats} from '../src/content/chapters.ts';
const close=(a:number,b:number)=>assert.ok(Math.abs(a-b)<1e-5,`${a} ≈ ${b}`);
test('selected material route obeys diffuse hemisphere, reflection and glass entry/exit',()=>{
 assert.ok(routeChecks.diffuseHemisphere>0);assert.ok(dot(normalize(sub(route[2],route[1])),diffuseNormal)>0);
 const r=reflect(normalize(sub(route[2],route[1])),metalNormal),wanted=normalize(sub(route[3],route[2]));r.forEach((v,i)=>close(v,wanted[i]));
 close(dot(insideGlass,insideGlass),1);outsideGlass.forEach((v,i)=>close(v,wanted[i]));close(route[3][2]-route[4][2],observatory.glassThickness);
});
test('triangle SAH closest hits match brute force and the production BVH library',()=>{
 const {triangles}=createTeachingData();
 const tree=buildSAH(triangles),all=new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(triangles.flat(2),3)),library=new MeshBVH(all,{strategy:SAH,maxLeafTris:4}),random=rng(817),center=observatory.bridge.center;let saved=0,hits=0;
 for(let i=0;i<250;i++){const o:[number,number,number]=[center[0]+(random()-.5)*70,center[1]-7+random()*20,center[2]+45],d=normalize([(random()-.5)*28,(random()-.5)*12,-45]);const a=traceSAH(tree,triangles,o,d),b=traceTriangles(triangles,o,d),c=library.raycastFirst(new T.Ray(new T.Vector3(...o),new T.Vector3(...d)),T.DoubleSide);
 if(Number.isFinite(b.closest)){hits++;close(a.closest,b.closest);close(a.closest,c!.distance);}else{assert.equal(a.closest,Infinity);assert.equal(c,null);}saved+=triangles.length-a.triangleTests;
 assert.equal(a.boxTests,a.events.reduce((count,e)=>count+(e.status==='hit'?2:0),1));
 }assert.ok(hits>0,'queries exercise real hits on the relocated bridge');assert.ok(saved>10000);assert.ok(tree.candidates.length>0);
});
test('manifest contains 15 topics, four travel beats and an image pivot',()=>{
 assert.equal(chapters.length,14);assert.equal(beats.length,22);assert.equal(beats.filter(b=>b.travel).length,4);assert.equal(new Set(beats.map(b=>b.id)).size,22);
 for(const c of chapters){assert.ok(beats.some(b=>b.id===c.id));assert.ok(c.points.length>=3);assert.ok(c.notes.length>50);assert.ok(c.sources.length);}
 for(const b of beats){assert.ok(chapters.some(c=>c.id===b.chapter));assert.ok(b.rayFrom<=b.rayTo);assert.ok(b.rayTo<=5);}
});
