import {test} from 'node:test';
import assert from 'node:assert/strict';
import {sampleLessonState} from '../src/ui/path-lesson.ts';

test('opening lesson contains two completed estimates and their exact mean',()=>{
 const state=sampleLessonState();
 assert.equal(state.count,2);assert.equal(state.samples.length,2);
 assert.ok(state.samples.every(s=>s.complete));
 const expected=[.46,.48,.42];
 assert.ok(state.mean.every((value,i)=>Math.abs(value-expected[i])<1e-12));
 assert.notDeepEqual(state.samples[0].rgb,state.samples[1].rgb);
});

test('replay and added samples keep the mean synchronized to completed estimates',()=>{
 const empty=sampleLessonState(0);assert.equal(empty.count,0);assert.deepEqual(empty.mean,[0,0,0]);
 assert.deepEqual(sampleLessonState(1).mean,[.8,.4,.12]);
 const four=sampleLessonState(4),expected=[.49,.34,.45];
 assert.equal(four.samples.length,4);assert.ok(four.mean.every((value,i)=>Math.abs(value-expected[i])<1e-12));
 assert.equal(sampleLessonState(99).count,4);
});

test('depth changes transport included in the same samples, not their count',()=>{
 const short=sampleLessonState(4,1),long=sampleLessonState(4,3);
 assert.equal(short.count,long.count);assert.deepEqual(short.samples.map(s=>s.id),long.samples.map(s=>s.id));
 assert.deepEqual(short.samples[0].rgb,[0,0,0]);assert.deepEqual(short.samples[2].rgb,[.4,.16,.64]);
 assert.deepEqual(short.mean,[.1,.04,.16]);assert.ok(long.samples.every(s=>s.complete));
});
