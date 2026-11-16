import {test} from 'node:test';import assert from 'node:assert/strict';
import {RetryablePreparation} from '../src/core/preparation.ts';
test('failed scene setup disposes staged resources and a fresh explicit attempt succeeds',async()=>{
 const preparation=new RetryablePreparation<{dispose():void;id:number}>();let constructed=0,disposed=0;
 const load=async()=>()=>({id:++constructed,dispose(){disposed++;}});
 await preparation.prepare(load,()=>{throw Error('setScene failed');});
 assert.equal(preparation.status,'error');assert.equal(preparation.resource,null);assert.equal(disposed,1);assert.match(preparation.error,/setScene/);
 await preparation.prepare(load,()=>{});
 assert.equal(preparation.status,'ready');assert.equal(preparation.error,'');assert.equal(preparation.resource?.id,2);assert.equal(disposed,1);
 await preparation.prepare(load,()=>{});assert.equal(constructed,2,'successful resource is reused');
});
test('cancel during lazy loading creates no resource; cancel during setup disposes the orphan',async()=>{
 const preparation=new RetryablePreparation<{dispose():void}>();let current=true,created=0,disposed=0;
 const create=()=>{created++;return {dispose(){disposed++;}};};
 await preparation.prepare(async()=>{current=false;return create;},()=>{},()=>current);
 assert.equal(created,0);assert.equal(preparation.status,'cancelled');
 current=true;await preparation.prepare(async()=>create,()=>{current=false;},()=>current);
 assert.equal(created,1);assert.equal(disposed,1);assert.equal(preparation.resource,null);assert.equal(preparation.status,'cancelled');
});
