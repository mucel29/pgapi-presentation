import {test} from 'node:test';
import assert from 'node:assert/strict';
import {RequestGeneration} from '../src/core/request-generation.ts';
const deferred=()=>{let resolve!:()=>void;const promise=new Promise<void>(r=>resolve=r);return {promise,resolve};};
// Fake the import/prepare boundaries. No engine, GPU resources or tracer is loaded.
async function attempt(requests:RequestGeneration,load:Promise<void>,prepare:Promise<void>,effects:string[]){
 const isCurrent=requests.begin();await load;if(!isCurrent())return false;
 effects.push('construct');await prepare;if(!isCurrent())return false;
 effects.push('start');return true;
}
test('leaving before the module loads prevents construction and start',async()=>{
 const requests=new RequestGeneration(),load=deferred(),prepare=deferred(),effects:string[]=[];
 const pending=attempt(requests,load.promise,prepare.promise,effects);requests.invalidate();load.resolve();prepare.resolve();
 assert.equal(await pending,false);assert.deepEqual(effects,[]);
});
test('leaving during preparation prevents a late start',async()=>{
 const requests=new RequestGeneration(),load=deferred(),prepare=deferred(),effects:string[]=[];
 const pending=attempt(requests,load.promise,prepare.promise,effects);load.resolve();await Promise.resolve();requests.invalidate();prepare.resolve();
 assert.equal(await pending,false);assert.deepEqual(effects,['construct']);
});
test('a new explicit start supersedes an older pending start',async()=>{
 const requests=new RequestGeneration(),first=deferred(),second=deferred(),effects:string[]=[];
 const a=attempt(requests,first.promise,Promise.resolve(),effects),b=attempt(requests,second.promise,Promise.resolve(),effects);first.resolve();second.resolve();
 assert.deepEqual(await Promise.all([a,b]),[false,true]);assert.deepEqual(effects,['construct','start']);
});
