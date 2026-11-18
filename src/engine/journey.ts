import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {beats,finalView,type Beat} from '../content/chapters';
import {createRoom} from './room';
import {createCourtyard} from './courtyard';
import {JourneyVisuals} from './visuals';
import type {Finale,RenderSettings} from './finale';
import {RequestGeneration} from '../core/request-generation';
import {shotPose,shotState,portalWorldPose,portalStart,roomApproachPose} from '../core/cinematics';
import {origin,throughput} from '../core/route';
import {weightDisplay} from '../core/transport.ts';
import {type Vec3} from '../core/math';
import {projectedPosition} from '../ui/layout';
import {monitor,portalLens,portalCut} from '../core/portal';
import {cameraPixel} from '../core/sampling.ts';
import {retroRaster,explorerRaster} from '../core/raster';

export class Journey{
 renderer:T.WebGLRenderer;camera=new T.PerspectiveCamera(43,1,.05,1000);room=createRoom();courtyard=createCourtyard();visuals:JourneyVisuals;
 pendingSettings:Partial<RenderSettings>={};controls:OrbitControls;finale:Finale|null=null;exploring=false;pathTracing=false;paused=false;supported:boolean;index=0;fps=0;elapsed=0;transition=1;
 private sceneViewport={left:0,top:0,width:1,height:1};private keys=new Set<string>();private previous=0;private active=true;private from=new T.Vector3();private fromTarget=new T.Vector3();private target=new T.Vector3();private portalFrom:[number,number,number]=[...portalStart];private monitorPosition:[number,number,number]=[...portalStart];
 private tracingRequests=new RequestGeneration();private drawKey='';private portalAspect=-1;private portalFrame=-1;private portalCamera=new T.PerspectiveCamera(43,1.66/1.06,.05,400);private portalTarget=new T.WebGLRenderTarget(480,306);
 private transitionFrom:Beat|null=null;private transitionShot:Beat|null=null;
 onFrame:((stats:{samples:number;moving:boolean;width:number;height:number;bounces:number;resets:number}|undefined)=>void)|null=null;
 constructor(public canvas:HTMLCanvasElement){
  this.renderer=new T.WebGLRenderer({canvas,antialias:false,powerPreference:'default',preserveDrawingBuffer:true});this.renderer.setPixelRatio(1);this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFShadowMap;this.renderer.shadowMap.autoUpdate=false;
  this.renderer.toneMapping=T.ACESFilmicToneMapping;this.supported=Boolean(this.renderer.extensions.get('EXT_color_buffer_float'));
  if(!this.supported)for(const s of [this.room,this.courtyard]){s.scene.environment=null;for(const m of s.materials)if(m instanceof T.MeshPhysicalMaterial){m.transmission=0;m.transparent=true;m.opacity=.35;}}
  this.visuals=new JourneyVisuals(this.courtyard);if(!this.supported){this.visuals.rasterOnly.visible=false;const material=this.courtyard.reflector.material as T.MeshStandardMaterial;material.metalness=.2;material.roughness=.35;}this.portalTarget.texture.minFilter=T.NearestFilter;this.portalTarget.texture.magFilter=T.NearestFilter;this.room.display.map=this.portalTarget.texture;this.room.display.toneMapped=true;
  const preview=portalWorldPose(0);this.portalCamera.position.set(...preview.position);this.portalCamera.lookAt(...preview.target);
  this.controls=new OrbitControls(this.camera,canvas);this.controls.enabled=false;this.controls.enableDamping=true;this.controls.dampingFactor=.12;this.controls.minDistance=.8;this.controls.maxDistance=230;this.controls.maxPolarAngle=Math.PI*.93;
  this.resize();this.setBeat(0,true);this.renderer.shadowMap.needsUpdate=true;
  window.addEventListener('resize',()=>this.resize());window.addEventListener('keydown',e=>{if(this.exploring&&!(e.target instanceof HTMLInputElement)&&!(e.target instanceof HTMLSelectElement))this.keys.add(e.key.toLowerCase());});window.addEventListener('keyup',e=>this.keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>this.keys.clear());
  document.addEventListener('visibilitychange',()=>{this.active=!document.hidden;this.previous=0;});requestAnimationFrame(this.frame);
 }
 get beat(){return beats[this.index];}get isMoving(){return this.transition<1;}
 invalidateRaster(){this.drawKey='';}
 replayVisuals(){this.elapsed=0;this.visuals.apply(this.beat);this.invalidateRaster();}
 replayShot(){this.setBeat(this.index,false,true);}
 setSceneViewport(rect:{left:number;top:number;width:number;height:number}){this.sceneViewport={...rect};this.resize();}
 projectPoint(point:Vec3){this.camera.updateMatrixWorld();const rect=this.canvas.getBoundingClientRect(),viewport=rect.width&&rect.height?rect:this.sceneViewport;return projectedPosition(new T.Vector3(...point).project(this.camera),viewport);}
 get primaryPixel(){return this.projectPoint(cameraPixel.center);}
 get cameraLabels(){return {origin:this.projectPoint(origin),pixel:this.primaryPixel,sample:this.primaryPixel,direction:this.projectPoint(cameraPixel.center.map((v,i)=>v+cameraPixel.forward[i]*4) as Vec3)};}
 get guideLabels(){return this.visuals.guideAnchors.map(({point,...label})=>({...label,...this.projectPoint(point)}));}
 get graphicsStatus(){return this.supported?'raster':'raster-only';}
 get rayWeight(){return weightDisplay(throughput[Math.min(4,Math.max(0,Math.floor(this.visuals.progress)))]);}
 resize(){const rect=this.canvas.getBoundingClientRect(),width=Math.max(1,rect.width||this.sceneViewport.width),height=Math.max(1,rect.height||this.sceneViewport.height);this.camera.aspect=width/height;this.camera.clearViewOffset();this.camera.updateProjectionMatrix();if(this.pathTracing)this.finale?.invalidate();else{const size=this.exploring?explorerRaster(width,height,this.pendingSettings.scale??1):retroRaster(width,height);this.renderer.setSize(size.width,size.height,false);}if(!this.exploring){this.updateTransition(this.transition);this.visuals.fitHead(this.camera,this.canvas.height);this.visuals.setResolution(this.canvas.width,this.canvas.height);}this.invalidateRaster();}
 setBeat(index:number,immediate=false,replay=false){
  const currentPosition=this.camera.position.toArray() as Vec3,currentTarget=this.target.toArray() as Vec3;
  this.invalidateRaster();this.portalFrame=-1;this.index=Math.max(0,Math.min(beats.length-1,index));const b=this.beat,previous=beats[Math.max(0,this.index-1)];this.elapsed=0;this.transition=immediate?1:0;
  // Normal forward travel shares the canonical endpoint. Back/skip and an
  // interrupted rail start at the actual observer pose, never teleport to a
  // predecessor. Direct links and explicit replays retain their canonical rail.
  this.transitionFrom=immediate||replay?previous:{...previous,camera:currentPosition,target:currentTarget,portraitCamera:currentPosition,portraitTarget:currentTarget,compactCamera:currentPosition,compactTarget:currentTarget};
  const destination=shotPose(b,previous,1,this.camera.aspect,this.sceneViewport.width);
  this.transitionShot=!immediate&&!replay&&b.motion==='hold'&&this.camera.position.distanceTo(new T.Vector3(...destination.position))>1?{...b,motion:'arrive',seconds:2}:b;
  this.from.set(...this.transitionFrom.camera);this.fromTarget.set(...this.transitionFrom.target);
  if(b.scene==='portal'&&!replay)this.portalFrom=immediate?[...portalStart]:[...this.monitorPosition];
  this.visuals.root.visible=!['image','samples','loop','noise','denoise'].includes(b.id);
  this.visuals.apply(b);if(immediate||this.transitionShot.seconds===0||matchMedia('(prefers-reduced-motion: reduce)').matches)this.finish();else this.updateTransition(0);
 }
 finish(){const b=this.beat;this.transition=1;this.elapsed=b.travel?b.seconds:0;this.updateTransition(1);this.visuals.update(this.elapsed,b.rayTo);this.visuals.fitHead(this.camera,this.canvas.height);this.invalidateRaster();}
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
 setSettings(patch:Partial<RenderSettings>){Object.assign(this.pendingSettings,patch);this.finale?.setSettings(patch);if(patch.scale!==undefined&&this.exploring&&!this.pathTracing)this.resize();}
 returnToJourney(){this.stopTracing();this.exploring=false;this.controls.enabled=false;this.keys.clear();this.courtyard.setBeauty(false);this.visuals.root.visible=true;this.resize();this.setBeat(this.index,true);}
 pickBVH(clientX:number,clientY:number){const rect=this.canvas.getBoundingClientRect(),raycaster=new T.Raycaster();raycaster.setFromCamera(new T.Vector2((clientX-rect.left)/rect.width*2-1,1-(clientY-rect.top)/rect.height*2),this.camera);const hit=raycaster.intersectObject(this.courtyard.teaching,false)[0];if(!hit)return false;this.visuals.setRay(this.camera.position.toArray(),hit.point.clone().sub(this.camera.position).normalize().toArray());this.invalidateRaster();return true;}
 resetView(){this.camera.position.set(...finalView.camera);this.controls.target.set(...finalView.target);this.controls.update();this.finale?.invalidate();}
 private renderPortal(){
  const b=this.beat,aspect=this.camera.aspect,frame=Math.floor(this.elapsed*16);if(frame===this.portalFrame&&Math.abs(aspect-this.portalAspect)<1e-6)return;
  this.portalFrame=frame;this.portalAspect=aspect;this.portalCamera.fov=portalLens(aspect).textureFov;this.portalCamera.updateProjectionMatrix();
  const start=b.scene==='room'?[portalStart[0]+Math.sin(this.elapsed*.18)*.7,portalStart[1],portalStart[2]+Math.sin(this.elapsed*.13)*.9] as [number,number,number]:this.portalFrom;
  const pose=portalWorldPose(b.scene==='portal'?this.transition:0,start);if(b.scene==='room')this.monitorPosition=[...pose.position];this.portalCamera.position.set(...pose.position);this.portalCamera.lookAt(...pose.target);
  const visible=this.visuals.root.visible;this.visuals.root.visible=false;this.renderer.setRenderTarget(this.portalTarget);this.renderer.render(this.courtyard.scene,this.portalCamera);this.renderer.setRenderTarget(null);this.visuals.root.visible=visible;
 }
 private updateTransition(t:number){
  const b=this.transitionShot??this.beat,previous=this.transitionFrom??beats[Math.max(0,this.index-1)],state=shotPose(b,previous,t,this.camera.aspect,this.canvas.getBoundingClientRect().width||this.sceneViewport.width);
  if(b.scene==='portal'){
   if(t<portalCut){
    const pose=roomApproachPose(t,this.camera.aspect,this.from.toArray(),this.fromTarget.toArray());this.camera.position.set(...pose.position);this.target.set(...pose.target);
   }else {const pose=portalWorldPose(t,this.portalFrom);this.camera.position.set(...pose.position);this.target.set(...pose.target);}

  }else {this.camera.position.set(...state.position);this.target.set(...state.target);}
  this.camera.clearViewOffset();this.camera.lookAt(this.target);
 }
 captureAt(t:number){this.transition=Math.max(0,Math.min(1,t));this.elapsed=this.beat.seconds*this.transition;this.updateTransition(this.transition);const state=shotState(this.beat.motion??'arrive',this.transition,this.beat.rayFrom,this.beat.rayTo);this.visuals.update(this.elapsed,state.ray);this.visuals.fitHead(this.camera,this.canvas.height);this.paused=true;this.invalidateRaster();}
 private frame=(now:number)=>{
  requestAnimationFrame(this.frame);if(!this.active)return;const measured=this.previous?(now-this.previous)/1000:0;if(measured&&measured<1/32)return;this.previous=now;if(measured>0)this.fps=this.fps*.9+(1/measured)*.1;const dt=Math.min(.06,measured);
  if(this.exploring){
    if(!this.paused){const forward=new T.Vector3();this.camera.getWorldDirection(forward);forward.y=0;forward.normalize();const right=new T.Vector3().crossVectors(forward,new T.Vector3(0,1,0)),v=new T.Vector3();if(this.keys.has('w'))v.add(forward);if(this.keys.has('s'))v.sub(forward);if(this.keys.has('d'))v.add(right);if(this.keys.has('a'))v.sub(right);if(this.keys.has('e'))v.y++;if(this.keys.has('q'))v.y--;v.normalize().multiplyScalar(dt*(this.keys.has('shift')?16:6));this.camera.position.add(v);this.controls.target.add(v);const p=this.camera.position.clone(),q=this.camera.quaternion.clone(),t=this.controls.target.clone();if(!this.controls.update(dt)){this.camera.position.copy(p);this.camera.quaternion.copy(q);this.controls.target.copy(t);}}
    if(this.pathTracing&&!this.paused){if(this.finale)this.finale.focusDistance=this.controls.getDistance();this.onFrame?.(this.finale?.render(now));}else {this.renderer.setRenderTarget(null);this.renderer.render(this.courtyard.scene,this.camera);}return;
  }
  const b=this.beat;if(!this.paused){this.elapsed+=dt;if(this.transition<1){this.transition=Math.min(1,this.elapsed/Math.max(.01,this.transitionShot?.seconds??b.seconds));this.updateTransition(this.transition);
   }const state=shotState(b.motion??'arrive',this.transition,b.rayFrom,b.rayTo);this.visuals.update(this.elapsed,state.ray);this.visuals.fitHead(this.camera,this.canvas.height);}
  const animated=!this.paused&&(b.scene==='room'||this.transition<1||this.visuals.isEmitting||b.visual==='diffuse'&&this.elapsed<4.5||b.visual==='bvh'&&this.elapsed<3.6||b.visual==='traversal'&&this.visuals.manualStep===null&&this.elapsed<this.visuals.traversal.events.length*.85);
  const drawKey=[this.index,this.transition,this.visuals.selected.id,this.visuals.lastStep,this.visuals.revision,innerWidth,innerHeight].join('/');
  if(!animated&&drawKey===this.drawKey)return;this.drawKey=drawKey;
  if(b.scene==='room'||b.scene==='portal'&&this.transition<portalCut){this.renderPortal();if(!this.room.scene.children.some(o=>o instanceof T.DirectionalLight&&o.shadow.map))this.renderer.shadowMap.needsUpdate=true;this.renderer.render(this.room.scene,this.camera);

  }else {if(!this.courtyard.scene.children.some(o=>o instanceof T.DirectionalLight&&o.shadow.map))this.renderer.shadowMap.needsUpdate=true;this.renderer.render(this.courtyard.scene,this.camera);}
 };
}
