import {test} from 'node:test';import assert from 'node:assert/strict';
import {triangleIntersection,type Vec3} from '../src/core/math.ts';
import {triangleIllustration} from '../src/ui/illustrations.ts';
test('Möller–Trumbore exposes correct barycentrics and preserves plane misses',()=>{
 const a:Vec3=[0,0,0],b:Vec3=[4,0,0],c:Vec3=[0,4,0],r=triangleIntersection([1,1,4],[0,0,-1],a,b,c)!;
 assert.equal(r.hit,true);assert.equal(r.t,4);assert.equal(r.u,.25);assert.equal(r.v,.25);assert.deepEqual(r.point,[1,1,0]);
 const miss=triangleIntersection([5,5,4],[0,0,-1],a,b,c)!;assert.equal(miss.hit,false);assert.ok(miss.u+miss.v>1);assert.equal(miss.t,4);
 assert.equal(triangleIntersection([1,1,4],[1,0,0],a,b,c),null);
});
test('interactive presets use the actual intersection result',()=>{assert.equal(triangleIllustration(.25,.35).result?.hit,true);assert.equal(triangleIllustration(.8,.65).result?.hit,false);assert.equal(triangleIllustration(.25,.35,true).result,null);});

test('sample paths keep subpixel jitter and scatter into the hit hemisphere',async()=>{
 const {illustratedSamples}=await import('../src/core/sampling.ts'),{dot,sub,normalize}=await import('../src/core/math.ts');
 const samples=illustratedSamples();assert.deepEqual(samples,illustratedSamples());assert.equal(samples.length,12);
 for(const s of samples){assert.ok(s.hit&&s.outgoing&&s.normal);assert.ok(dot(s.outgoing,s.normal)>0);assert.ok(dot(normalize(sub(s.pixel,s.origin)),s.direction)>1-1e-9);}
 assert.ok(samples.some((s,i)=>i>0&&dot(s.outgoing!,samples[0].outgoing!)<.4));
});
