import {test} from 'node:test';
import assert from 'node:assert/strict';
import {accumulationExperiment,slabIntervals} from '../src/core/experiments.ts';
import {intersectAABB,type Vec3} from '../src/core/math.ts';
import {glassIllustration,slabIllustration} from '../src/ui/experiments.ts';

test('Monte Carlo teaching signal is deterministic, bounded and converges across the field',()=>{
 const one=accumulationExperiment(1),many=accumulationExperiment(256),four=accumulationExperiment(4);
 assert.deepEqual(many,accumulationExperiment(256));assert.deepEqual(one.truth,many.truth);
 assert.ok(one.estimate.every(v=>v===0||v===1));assert.ok(many.estimate.every(v=>v>=0&&v<=1));
 assert.ok(many.rmse<one.rmse/8);assert.ok(Math.abs(four.expectedRMSE-one.expectedRMSE/2)<1e-12);
 assert.equal(many.estimate.length,many.width*many.height);
});
test('visible slab intervals agree with the actual box test, including parallel outside rays',()=>{
 const min:Vec3=[-1,-2,-3],max:Vec3=[1,2,3];
 for(const [o,d] of [[[0,0,8],[0,0,-1]],[[5,0,8],[0,0,-1]],[[0,0,8],[1,0,-1]],[[0,0,0],[0,1,0]],[[0,0,8],[0,0,1]]] as [Vec3,Vec3][]){
  const shown=slabIntervals(o,d,min,max),actual=intersectAABB(o,d,min,max);
  assert.equal(shown.hit,actual!==null);if(shown.hit)assert.equal(shown.near,actual);
  assert.ok(!slabIllustration(o,d,min,max).includes('NaN'));
 }
});
test('glass prediction hides the answer until reveal and derives the equal exterior angles',()=>{
 const question=glassIllustration(false),answer=glassIllustration(true);
 assert.ok(question.includes('Ce direcție urmează'));assert.ok(!question.includes('Aceeași direcție'));
 assert.ok(answer.includes('Aceeași direcție. Altă poziție.'));
 const match=answer.match(/unghiul de intrare ([\d.]+) grade.*unghiul la ieșire ([\d.]+) grade/);
 assert.ok(match);assert.equal(match[1],match[2]);
});
