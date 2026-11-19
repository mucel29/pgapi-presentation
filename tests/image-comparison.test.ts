import {test} from 'node:test';
import assert from 'node:assert/strict';
import {NoiseAverage} from '../src/ui/image-comparison.ts';

test('main-image noise uses the same sample prefix and converges under averaging',()=>{
 const noise=new NoiseAverage(4096);noise.setSamples(1);
 const first=Array.from(noise.first),low=first.reduce((s,v)=>s+v*v,0)/first.length;
 noise.setSamples(64);
 const high=noise.sum.reduce((s,v)=>s+(v/64)**2,0)/noise.length;
 assert.ok(high<low/32);assert.equal(noise.count,64);
 assert.deepEqual(Array.from(noise.first),first);
 const prefix=Array.from(noise.sum);noise.setSamples(4);noise.setSamples(64);
 assert.deepEqual(Array.from(noise.sum),prefix);
 noise.reset();assert.equal(noise.count,0);assert.equal(noise.sum.every(v=>v===0),true);
});
