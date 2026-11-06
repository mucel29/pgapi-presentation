import {test} from 'node:test';
import assert from 'node:assert/strict';
import {presentationLayout,type Rect} from '../src/ui/layout.ts';
const overlap=(a:Rect,b:Rect)=>Math.min(a.left+a.width,b.left+b.width)>Math.max(a.left,b.left)&&Math.min(a.top+a.height,b.top+b.height)>Math.max(a.top,b.top);
for(const [w,h] of [[1920,1080],[1280,720],[1050,700],[960,540],[844,390],[390,844],[320,568]])test(`lesson reserves a clear scene and scrollable rail at ${w}×${h}`,()=>{
 const l=presentationLayout(w,h,'lesson');assert.ok(l.rail);assert.equal(overlap(l.scene,l.rail!),false);
 for(const r of [l.scene,l.rail!]){assert.ok(r.width>0&&r.height>0);assert.ok(r.left>=0&&r.top>=l.headerHeight);assert.ok(r.left+r.width<=w);assert.ok(r.top+r.height<=h-l.footerHeight);}
 if(w>=1050){assert.ok(l.rail!.width>=400&&l.rail!.width<=520);assert.equal(l.scene.height,l.rail!.height);}else{assert.equal(l.scene.width,w);assert.equal(l.rail!.top,l.scene.top+l.scene.height);}
});
test('travel/explorer/capture release the interactive rail',()=>{
 for(const mode of ['travel','explorer','capture'] as const){const l=presentationLayout(1280,720,mode);assert.equal(l.rail,null);assert.equal(l.scene.width,1280);}
 const c=presentationLayout(390,844,'capture');assert.deepEqual(c.scene,{left:0,top:0,width:390,height:844});
});
