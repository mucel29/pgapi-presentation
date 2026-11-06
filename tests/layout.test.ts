import {test} from 'node:test';
import assert from 'node:assert/strict';
import {presentationLayout} from '../src/ui/layout.ts';
for(const [w,h] of [[1920,1080],[1280,720],[1050,700],[960,540],[844,390],[390,844],[320,568]])test(`world remains full size through all teaching modes at ${w}×${h}`,()=>{
 for(const mode of ['lesson','travel','explorer','capture'] as const){
  const l=presentationLayout(w,h,mode);assert.deepEqual(l.scene,{left:0,top:0,width:w,height:h});
  if(mode==='lesson'){assert.ok(l.rail);const r=l.rail!;assert.ok(r.width>0&&r.height>0);assert.ok(r.left>=0&&r.top>=l.headerHeight);assert.ok(r.left+r.width<=w);assert.ok(r.top+r.height<=h-l.footerHeight);assert.ok(r.width<=410);}
  else assert.equal(l.rail,null);
 }
});
