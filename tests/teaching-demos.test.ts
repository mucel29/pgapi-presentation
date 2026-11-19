import {test} from 'node:test';import assert from 'node:assert/strict';
import {mollerTrumboreSteps,triangleScene} from '../src/ui/illustrations.ts';
import {triangleIntersection} from '../src/core/math.ts';
import {TemporalDemo} from '../src/ui/temporal-demo.ts';
import {syntheticDenoiseSignal,tapWeights,denoiseProbe} from '../src/ui/denoise-demo.ts';
test('Möller–Trumbore steps end with the same verdict and t as the real intersection',()=>{
 for(const [u,v,parallel] of [[.25,.35,false],[.5,0,false],[.8,.65,false],[-.2,.3,false],[.3,.3,true]] as const){
  const steps=mollerTrumboreSteps(u,v,parallel),last=steps.at(-1)!,{a,b,c,o,d}=triangleScene(u,v,parallel),r=triangleIntersection(o,d,a,b,c);
  assert.ok(last.exit,'the last step decides');assert.equal(last.exit==='hit',Boolean(r?.hit));
  if(last.exit==='hit')assert.equal(Number(last.value),Number(r!.t.toFixed(3)));
 }
 assert.ok(mollerTrumboreSteps(-.2,.3).length<mollerTrumboreSteps(.25,.35).length,'u outside [0,1] exits early');
});
test('reprojection keeps less error than no reprojection or reset, and resets only disoccluded pixels',()=>{
 const run=(mode:'none'|'reset'|'reproject')=>{const d=new TemporalDemo();d.mode=mode;d.restart();for(let i=0;i<20;i++)d.step(false);let sum=0;for(let i=0;i<30;i++){d.step();sum+=d.rmse();}return {rmse:sum/30,resets:d.resetPixels};};
 const none=run('none'),reset=run('reset'),re=run('reproject');
 assert.ok(re.rmse<none.rmse,`reproject ${re.rmse} < none ${none.rmse}`);assert.ok(re.rmse<reset.rmse,`reproject ${re.rmse} < reset ${reset.rmse}`);
 assert.ok(re.resets>0&&re.resets<=12*2,'only a thin disoccluded strip resets');
});
test('guided à-trous gives near-zero weight across the edge',()=>{
 const s=syntheticDenoiseSignal(),taps=tapWeights(s,s.raw,denoiseProbe.x,denoiseProbe.y,1,true),across=taps.filter(t=>t.x>=s.width/2);
 assert.ok(across.length>0);assert.ok(across.every(t=>t.w<1e-3));
 const plain=tapWeights(s,s.raw,denoiseProbe.x,denoiseProbe.y,1,false);assert.ok(plain.filter(t=>t.x>=s.width/2).some(t=>t.w>.1));
});
