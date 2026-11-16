import * as T from 'three';
import type { WebGLPathTracer } from 'three-gpu-pathtracer';
import { Denoiser, GeometryGuides } from './denoiser';
import {RetryablePreparation} from '../core/preparation.ts';
import {CameraMotionGate} from '../core/motion';
import type { SceneWorld } from './room';

// The vendor handles these extra transmission events separately from principal bounces.
export const EXTRA_TRANSMISSIVE_BOUNCES=8;
export interface RenderSettings { scale:number;samplesPerUpdate:number;bounces:number;denoise:boolean;strength:number;passes:number;motionThreshold:number; }
export class Finale {
  tracer:WebGLPathTracer|null=null;
  ready=false;error='';active=false;lastMotion=0;mode='';revision=0;resets=0;
  settings:RenderSettings={scale:1,samplesPerUpdate:1,bounces:8,denoise:true,strength:.8,passes:3,motionThreshold:.35};
  focusDistance=60;guides:GeometryGuides;denoiser:Denoiser;
  private preparation=new RetryablePreparation<WebGLPathTracer>();
  private motion=new CameraMotionGate();private displayTarget=new T.WebGLRenderTarget(1,1,{depthBuffer:false});private hasFrame=false;private guideDirty=true;private viewport=[0,0];
  constructor(public renderer:T.WebGLRenderer,public room:SceneWorld,public camera:T.PerspectiveCamera) {
    this.guides=new GeometryGuides(renderer);this.denoiser=new Denoiser(renderer);
  }
  get preparationStatus(){return this.preparation.status;}
  async prepare(isCurrent:()=>boolean=()=>true) {
    if(this.ready)return;
    this.error='';
    // This factory is reached only after Journey's explicit Start request.
    await this.preparation.prepare(async()=>{
      const {WebGLPathTracer}=await import('three-gpu-pathtracer');
      return ()=>new WebGLPathTracer(this.renderer);
    },tracer=>{
      this.room.setBeauty(true);
      tracer.renderToCanvas=false;tracer.renderDelay=0;tracer.minSamples=1;tracer.fadeDuration=0;
      tracer.bounces=this.settings.bounces;tracer.transmissiveBounces=EXTRA_TRANSMISSIVE_BOUNCES;tracer.textureSize.set(512,512);
      tracer.tiles.set(1,1);
      // v0.0.23 exposes this property at runtime but omits it from index.d.ts.
      (tracer as WebGLPathTracer & {stableNoise:boolean}).stableNoise=true;
      tracer.setScene(this.room.scene,this.camera);
    },isCurrent);
    this.room.setBeauty(false);
    this.tracer=this.preparation.resource;this.ready=this.preparation.status==='ready';this.error=this.preparation.error;
  }
  start(){this.active=true;this.mode='';this.motion.reset();this.hasFrame=false;this.lastMotion=-Infinity;this.room.setBeauty(true);this.tracer?.updateMaterials();this.invalidate();}
  stop(){this.active=false;this.room.setBeauty(false);}
  invalidate(){this.revision++;this.resets++;this.guideDirty=true;this.tracer?.reset();}
  setSettings(patch:Partial<RenderSettings>){
    const estimatorChanged=patch.scale!==undefined||patch.bounces!==undefined;
    Object.assign(this.settings,patch);this.motion.tolerancePixels=this.settings.motionThreshold;if(estimatorChanged){this.mode='';this.invalidate();}
  }
  // The raw accumulation target belongs to the tracer. Filtered targets are never used as history.
  render(now:number,forceSize?:[number,number],forceBounces?:number){
    const tracer=this.tracer;if(!tracer||!this.ready)return;
    this.camera.updateMatrixWorld();
    const visibleHeight=Math.max(180,Math.min(720,window.innerHeight)),radiansPerPixel=2*Math.tan(T.MathUtils.degToRad(this.camera.fov)/2)/visibleHeight;
    const focusDistance=this.focusDistance;
    const motion=this.motion.observe({position:this.camera.position.toArray(),quaternion:this.camera.quaternion.toArray(),projection:this.camera.projectionMatrix.elements},now,focusDistance*radiansPerPixel,radiansPerPixel);
    if(motion.changed){tracer.updateCamera();this.guideDirty=true;this.resets++;if(motion.moving)this.lastMotion=now;}
    const moving=!forceSize&&motion.moving;
    const aspect=this.camera.aspect;
    const maxWidth=Math.min(1280,window.innerWidth,720*aspect),width=forceSize?.[0]??(moving?Math.min(320,Math.round(180*aspect)):Math.max(64,Math.round(maxWidth*this.settings.scale)));
    const height=forceSize?.[1]??Math.round(width/aspect);
    const bounces=forceBounces??(moving?2:this.settings.bounces),mode=`${width}/${height}/${bounces}`;
    if(mode!==this.mode){
      this.mode=mode;this.renderer.setSize(width,height,false);tracer.renderScale=1;tracer.bounces=bounces;
      tracer.reset();this.guides.resize(width,height);this.denoiser.resize(width,height);this.guideDirty=true;this.resets++;
    }
    if(this.guideDirty){this.guides.render(this.room.scene,this.camera);this.guideDirty=false;}
    for(let i=0;i<(forceSize?1:this.settings.samplesPerUpdate);i++)tracer.renderSample();
    const raw=tracer.target.texture;
    if(tracer.samples>0){
      const filtered=this.settings.denoise?this.denoiser.run(raw,this.guides.normalDepth.texture,this.guides.albedo.texture,this.settings.strength,this.settings.passes):raw;
      const displayWidth=Math.max(width,Math.round(Math.min(1280,window.innerWidth,720*aspect))),displayHeight=Math.round(displayWidth/aspect);
      if(this.displayTarget.width!==displayWidth||this.displayTarget.height!==displayHeight){this.displayTarget.setSize(displayWidth,displayHeight);this.hasFrame=false;}
      if(moving||tracer.samples>=2||!this.hasFrame){this.denoiser.present(raw,filtered,this.guides.normalDepth.texture,this.guides.albedo.texture,this.settings.denoise?1:0,this.displayTarget);this.hasFrame=true;}
      this.denoiser.blit(this.displayTarget.texture);
    }else if(this.hasFrame)this.denoiser.blit(this.displayTarget.texture);
    else this.renderer.render(this.room.scene,this.camera);
    this.viewport=[width,height];return {samples:tracer.samples,moving,width,height,bounces,resets:this.resets};
  }
  get size(){return this.viewport;}
}

export interface PreparedData {width:number;height:number;samples:number[];colors:Float32Array[];normalDepth:Float32Array;albedo:Float32Array;}
export function encodePreparedData(data:PreparedData){
  const {width,height,samples,colors,normalDepth,albedo}=data;
  const header=new Uint32Array([0x4c554d4e,1,width,height,samples.length,...samples]);
  const buffers=[new Uint8Array(header.buffer),...colors.map(c=>new Uint8Array(c.buffer,c.byteOffset,c.byteLength)),new Uint8Array(normalDepth.buffer),new Uint8Array(albedo.buffer)];
  return new Blob(buffers as BlobPart[],{type:'application/octet-stream'});
}
export function decodePreparedData(buffer:ArrayBuffer):PreparedData {
  const head=new Uint32Array(buffer,0,5);if(head[0]!==0x4c554d4e||head[1]!==1)throw Error('Format de comparație necunoscut');
  const width=head[2],height=head[3],count=head[4];if(width>2048||height>2048||count>10)throw Error('Dimensiuni invalide');
  const length=width*height*4,samples=Array.from(new Uint32Array(buffer,20,count));let offset=(5+count)*4;
  const take=()=>{const a=new Float32Array(buffer,offset,length);offset+=length*4;return a;};
  const colors=Array.from({length:count},take),normalDepth=take(),albedo=take();
  if(offset!==buffer.byteLength)throw Error('Date incomplete');return {width,height,samples,colors,normalDepth,albedo};
}
