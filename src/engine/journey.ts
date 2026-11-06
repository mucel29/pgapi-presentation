import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {beats,finalView,type Beat} from '../content/chapters';
import {createRoom} from './room';
import {createCourtyard} from './courtyard';
import {JourneyVisuals} from './visuals';
import type {Finale,RenderSettings} from './finale';
import {RequestGeneration} from '../core/request-generation';
import {monitor,portalLens,portalCut} from '../core/portal';

export class Journey{
 renderer:T.WebGLRenderer;camera=new T.PerspectiveCamera(43,1,.05,400);room=createRoom();courtyard=createCourtyard();visuals:JourneyVisuals;
 pendingSettings:Partial<RenderSettings>={};controls:OrbitControls;finale:Finale|null=null;exploring=false;pathTracing=false;paused=false;supported:boolean;index=0;fps=0;elapsed=0;transition=1;
 private offset=new T.Vector2();private fromOffset=new T.Vector2();private toOffset=new T.Vector2();private keys=new Set<string>();private previous=0;private active=true;private from=new T.Vector3();private fromTarget=new T.Vector3();private target=new T.Vector3();private curve:T.CatmullRomCurve3|null=null;
 private tracingRequests=new RequestGeneration();private drawKey='';private portalAspect=-1;private portalCamera=new T.PerspectiveCamera(43,1.66/1.06,.05,400);private portalTarget=new T.WebGLRenderTarget(480,306);
 onFrame:((stats:{samples:number;moving:boolean;width:number;height:number;bounces:number;resets:number}|undefined)=>void)|null=null;
 constructor(public canvas:HTMLCanvasElement){
  this.renderer=new T.WebGLRenderer({canvas,antialias:false,powerPreference:'default',preserveDrawingBuffer:true});this.renderer.setPixelRatio(1);this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFShadowMap;this.renderer.shadowMap.autoUpdate=false;
  this.renderer.toneMapping=T.ACESFilmicToneMapping;this.supported=Boolean(this.renderer.extensions.get('EXT_color_buffer_float'));
  if(!this.supported)for(const s of [this.room,this.courtyard]){s.scene.environment=null;for(const m of s.materials)if(m instanceof T.MeshPhysicalMaterial){m.transmission=0;m.transparent=true;m.opacity=.35;}}
  this.visuals=new JourneyVisuals(this.courtyard);if(!this.supported){this.visuals.rasterOnly.visible=false;const material=this.courtyard.reflector.material as T.MeshStandardMaterial;material.metalness=.2;material.roughness=.35;}this.portalTarget.texture.minFilter=T.NearestFilter;this.portalTarget.texture.magFilter=T.NearestFilter;this.room.display.map=this.portalTarget.texture;this.room.display.toneMapped=true;
  this.portalCamera.position.set(-34,9,33);this.portalCamera.lookAt(-24,4,18);
  this.controls=new OrbitControls(this.camera,canvas);this.controls.enabled=false;this.controls.enableDamping=true;this.controls.dampingFactor=.12;this.controls.minDistance=.8;this.controls.maxDistance=130;this.controls.maxPolarAngle=Math.PI*.93;
  this.resize();this.setBeat(0,true);this.renderer.shadowMap.needsUpdate=true;
  window.addEventListener('resize',()=>this.resize());window.addEventListener('keydown',e=>{if(this.exploring&&!(e.target instanceof HTMLInputElement)&&!(e.target instanceof HTMLSelectElement))this.keys.add(e.key.toLowerCase());});window.addEventListener('keyup',e=>this.keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>this.keys.clear());
  document.addEventListener('visibilitychange',()=>{this.active=!document.hidden;this.previous=0;});requestAnimationFrame(this.frame);
 }
 get beat(){return beats[this.index];}get isMoving(){return this.transition<1;}
 invalidateRaster(){this.drawKey='';}
 replayVisuals(){this.elapsed=0;this.visuals.apply(this.beat);this.invalidateRaster();}
 private applyFraming(){if(!this.exploring)this.camera.setViewOffset(innerWidth,innerHeight,innerWidth*this.offset.x,innerHeight*this.offset.y,innerWidth,innerHeight);}
 resize(){this.applyFraming();this.camera.aspect=innerWidth/innerHeight;this.camera.updateProjectionMatrix();if(this.pathTracing)this.finale?.invalidate();else this.renderer.setSize(this.exploring?Math.round(Math.min(1280,innerWidth,720*this.camera.aspect)):480,this.exploring?Math.round(Math.min(1280,innerWidth,720*this.camera.aspect)/this.camera.aspect):Math.round(480/this.camera.aspect),false);}
 setBeat(index:number,immediate=false){
  this.invalidateRaster();this.index=Math.max(0,Math.min(beats.length-1,index));const b=this.beat;this.elapsed=0;this.transition=immediate?1:0;this.from.copy(this.camera.position);this.fromTarget.copy(this.target);
  if(b.scene==='portal'){this.from.set(...beats[0].camera);this.fromTarget.set(...beats[0].target);}
  const points=[this.from.clone(),...(b.via??[]).map(p=>new T.Vector3(...p)),new T.Vector3(...b.camera)];this.curve=new T.CatmullRomCurve3(points,false,'centripetal');
  this.fromOffset.copy(this.offset);this.toOffset.set(b.layout==='travel'?0:-.17,['cost','bvh','sah','aabb','traversal'].includes(b.visual)?.21:0);this.visuals.apply(b);if(immediate||b.seconds===0||matchMedia('(prefers-reduced-motion: reduce)').matches){this.finish();}this.renderer.shadowMap.needsUpdate=true;
 }
 finish(){const b=this.beat;this.transition=1;this.elapsed=b.travel?b.seconds:0;this.camera.position.set(...b.camera);this.target.set(...b.target);this.offset.copy(this.toOffset);this.applyFraming();this.camera.lookAt(this.target);this.visuals.update(this.elapsed,b.rayTo);}
 async exploreRaster(){this.exploring=true;this.camera.clearViewOffset();this.visuals.root.visible=false;this.courtyard.setBeauty(true);this.camera.position.set(...finalView.camera);this.controls.target.set(...finalView.target);this.controls.enabled=true;this.controls.update();this.renderer.shadowMap.needsUpdate=true;this.resize();}
 async startTracing(){
  const isCurrent=this.tracingRequests.begin(),active=()=>isCurrent()&&this.exploring;
  if(!active())return false;
  if(!this.supported)throw Error('Path tracing necesită floating-point render targets. Explorarea rasterizată rămâne disponibilă.');
  // Every awaited boundary checks the exploration session before creating or starting GPU work.
  const {Finale}=await import('./finale');if(!active())return false;
  if(!this.finale){this.finale=new Finale(this.renderer,this.courtyard,this.camera);this.finale.setSettings(this.pendingSettings);}
  this.visuals.rasterOnly.visible=false;
  await this.finale.prepare(active);if(!active())return false;
  if(!this.finale.ready){this.visuals.rasterOnly.visible=this.supported;throw Error(this.finale.error||'Path tracer indisponibil');}
  this.finale.start();this.pathTracing=true;return true;
 }
 stopTracing(){this.tracingRequests.invalidate();this.pathTracing=false;this.visuals.rasterOnly.visible=this.supported;this.finale?.stop();this.courtyard.setBeauty(true);this.resize();}
 setSettings(patch:Partial<RenderSettings>){Object.assign(this.pendingSettings,patch);this.finale?.setSettings(patch);}
 returnToJourney(){this.stopTracing();this.exploring=false;this.controls.enabled=false;this.keys.clear();this.courtyard.setBeauty(false);this.visuals.root.visible=true;this.resize();this.setBeat(this.index,true);}
 pickBVH(clientX:number,clientY:number){const rect=this.canvas.getBoundingClientRect(),raycaster=new T.Raycaster();raycaster.setFromCamera(new T.Vector2((clientX-rect.left)/rect.width*2-1,1-(clientY-rect.top)/rect.height*2),this.camera);const hit=raycaster.intersectObject(this.courtyard.teaching,false)[0];if(!hit)return false;this.visuals.setRay(this.camera.position.toArray(),hit.point.clone().sub(this.camera.position).normalize().toArray());this.invalidateRaster();return true;}
 resetView(){this.camera.position.set(...finalView.camera);this.controls.target.set(...finalView.target);this.controls.update();this.finale?.invalidate();}
 private renderPortal(){
  const aspect=this.camera.aspect;if(Math.abs(aspect-this.portalAspect)<1e-6)return;
  this.portalAspect=aspect;this.portalCamera.fov=portalLens(aspect).textureFov;this.portalCamera.updateProjectionMatrix();
  const visible=this.visuals.root.visible;this.visuals.root.visible=false;this.renderer.setRenderTarget(this.portalTarget);this.renderer.render(this.courtyard.scene,this.portalCamera);this.renderer.setRenderTarget(null);this.visuals.root.visible=visible;
 }
 private updateTransition(t:number){
  const b=this.beat,s=t*t*(3-2*t);
  this.offset.lerpVectors(this.fromOffset,this.toOffset,s);
  if(b.scene==='portal'){
   if(t<portalCut){
    const u=t/portalCut,e=u*u*(3-2*u),center=new T.Vector3(...monitor.center),end=center.clone().add(new T.Vector3(0,0,portalLens(this.camera.aspect).distance));
    // Align with the monitor before filling the viewport. No texture stretch or camera crossfade.
    const curve=new T.CubicBezierCurve3(this.from,new T.Vector3(-1.02,3.2,5),new T.Vector3(-1.02,2.16,2.6),end);
    this.camera.position.copy(curve.getPoint(e));this.target.lerpVectors(this.fromTarget,center,Math.min(1,u/.6));this.offset.multiplyScalar(1-Math.min(1,u/.6));
   }else {this.camera.position.set(...b.camera);this.target.set(...b.target);this.offset.set(0,0);}
  }else {this.camera.position.copy(this.curve!.getPoint(s));this.target.lerpVectors(this.fromTarget,new T.Vector3(...b.target),s);}
  this.applyFraming();this.camera.lookAt(this.target);
 }
 captureAt(t:number){this.transition=Math.max(0,Math.min(1,t));this.elapsed=this.beat.seconds*this.transition;this.updateTransition(this.transition);this.visuals.update(this.elapsed,this.beat.rayFrom+(this.beat.rayTo-this.beat.rayFrom)*this.transition);this.paused=true;this.invalidateRaster();}
 private frame=(now:number)=>{
  requestAnimationFrame(this.frame);if(!this.active)return;const measured=this.previous?(now-this.previous)/1000:0;if(measured&&measured<1/32)return;this.previous=now;if(measured>0)this.fps=this.fps*.9+(1/measured)*.1;const dt=Math.min(.06,measured);
  if(this.exploring){
    if(!this.paused){const forward=new T.Vector3();this.camera.getWorldDirection(forward);forward.y=0;forward.normalize();const right=new T.Vector3().crossVectors(forward,new T.Vector3(0,1,0)),v=new T.Vector3();if(this.keys.has('w'))v.add(forward);if(this.keys.has('s'))v.sub(forward);if(this.keys.has('d'))v.add(right);if(this.keys.has('a'))v.sub(right);if(this.keys.has('e'))v.y++;if(this.keys.has('q'))v.y--;v.normalize().multiplyScalar(dt*(this.keys.has('shift')?16:6));this.camera.position.add(v);this.controls.target.add(v);const p=this.camera.position.clone(),q=this.camera.quaternion.clone(),t=this.controls.target.clone();if(!this.controls.update(dt)){this.camera.position.copy(p);this.camera.quaternion.copy(q);this.controls.target.copy(t);}}
    if(this.pathTracing&&!this.paused){if(this.finale)this.finale.focusDistance=this.controls.getDistance();this.onFrame?.(this.finale?.render(now));}else {this.renderer.setRenderTarget(null);this.renderer.render(this.courtyard.scene,this.camera);}return;
  }
  const b=this.beat;if(!this.paused){this.elapsed+=dt;if(this.transition<1){this.transition=Math.min(1,this.elapsed/Math.max(.01,b.seconds));this.updateTransition(this.transition);
   }this.visuals.update(this.elapsed,b.rayFrom+(b.rayTo-b.rayFrom)*this.transition);}
  const animated=!this.paused&&(this.transition<1||b.visual==='diffuse'&&this.elapsed<4.5||b.visual==='samples'&&this.elapsed<5||b.visual==='bvh'&&this.elapsed<3.6||b.visual==='traversal'&&this.visuals.manualStep===null&&this.elapsed<this.visuals.traversal.events.length*.85);
  const drawKey=[this.index,this.transition,this.visuals.selected.id,this.visuals.lastStep,this.visuals.revision,innerWidth,innerHeight].join('/');
  if(!animated&&drawKey===this.drawKey)return;this.drawKey=drawKey;
  if(b.scene==='room'||b.scene==='portal'&&this.transition<portalCut){this.renderPortal();if(!this.room.scene.children.some(o=>o instanceof T.DirectionalLight&&o.shadow.map))this.renderer.shadowMap.needsUpdate=true;this.renderer.render(this.room.scene,this.camera);

  }else this.renderer.render(this.courtyard.scene,this.camera);
 };
}
