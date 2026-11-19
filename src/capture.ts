import * as T from 'three';
import {Finale,EXTRA_TRANSMISSIVE_BOUNCES} from './engine/finale';
import {createCourtyard} from './engine/courtyard';
import {cameraPixel} from './core/sampling';
import {beats} from './content/chapters';
import {shotPose} from './core/cinematics';

const canvas=document.querySelector<HTMLCanvasElement>('#capture')!;
const status=document.querySelector<HTMLElement>('#status')!;
const start=document.querySelector<HTMLButtonElement>('#start')!;
const stop=document.querySelector<HTMLButtonElement>('#stop')!;
const params=new URLSearchParams(location.search),width=params.get('width')==='640'?640:1280,height=width*9/16;
let stopped=false;
const frame=()=>new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));
const upload=async(name:string,body:Blob)=>{const response=await fetch(`/__capture?name=${encodeURIComponent(name)}`,{method:'POST',body});if(!response.ok)throw Error(`Export ${name}: ${await response.text()}`);};
const image=()=>new Promise<Blob>((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('Canvas encoding failed')),'image/webp',.94));
stop.onclick=()=>{stopped=true;stop.disabled=true;};
start.onclick=async()=>{
 start.disabled=true;stop.disabled=false;stopped=false;
 try{
  status.textContent=`Preparing existing WebGLPathTracer at ${width} × ${height}…`;
  const renderer=new T.WebGLRenderer({canvas,antialias:false,powerPreference:'default',preserveDrawingBuffer:true});
  renderer.setPixelRatio(1);renderer.setSize(width,height,false);renderer.toneMapping=T.ACESFilmicToneMapping;
  if(!renderer.extensions.get('EXT_color_buffer_float'))throw Error('Floating-point render targets unavailable');
  const room=createCourtyard(),camera=new T.PerspectiveCamera(43,16/9,.05,1000);
  const beatIndex=beats.findIndex(beat=>beat.id==='noise'),pose=shotPose(beats[beatIndex],beats[beatIndex-1],1,16/9,1280);
  camera.position.set(...pose.position);camera.lookAt(...pose.target);camera.updateMatrixWorld();camera.updateProjectionMatrix();
  if(camera.position.distanceTo(new T.Vector3(...cameraPixel.origin))>1e-9)throw Error('Camera differs from canonical image shot');
  const finale=new Finale(renderer,room,camera);finale.setSettings({denoise:false,samplesPerUpdate:1,bounces:8,strength:.8,passes:3});
  await finale.prepare();if(!finale.ready||!finale.tracer)throw Error(finale.error||'Tracer preparation failed');finale.start();
  const samples:{spp:number;url:string}[]=[];let previous=0,iterations=0;
  while(previous<100&&!stopped){
   await frame();const result=finale.render(performance.now(),[width,height],8);iterations++;
   if(iterations>2000)throw Error('Tracer did not reach 100 samples within bounded iteration budget');
   const count=result?.samples??0;if(count===previous)continue;
   if(!Number.isInteger(count)||count!==previous+1)throw Error(`Nonsequential sample count ${previous} → ${count}`);
   const name=`raw-${String(count).padStart(3,'0')}.webp`;await upload(name,await image());samples.push({spp:count,url:`/assets/pathtraced/${name}`});
   if(count===4){
    const tracer=finale.tracer,raw=tracer.target.texture,guides=finale.guides,denoiser=finale.denoiser;
    for(let passes=1;passes<=3;passes++){const filtered=denoiser.run(raw,guides.normalDepth.texture,guides.albedo.texture,.8,passes);denoiser.present(raw,filtered,guides.normalDepth.texture,guides.albedo.texture,1);await upload(`guided-${passes}-004.webp`,await image());}
    for(const [label,mode] of [['normal',4],['depth',5],['albedo',6]] as const){denoiser.present(raw,raw,guides.normalDepth.texture,guides.albedo.texture,mode);await upload(`guide-${label}.webp`,await image());}
   }
   previous=count;status.textContent=`Actual ${count} spp exported · ${width} × ${height} · fixed camera · maximum 100 spp`;
  }
  if(stopped)throw Error(`Stopped after ${previous} spp; manifest was not published`);
  const raw4='/assets/pathtraced/raw-004.webp';
  const manifest={version:1,width,height,samples,denoise:{spp:4,raw:raw4,guided:[raw4,...[1,2,3].map(pass=>`/assets/pathtraced/guided-${pass}-004.webp`)],strength:.8,passes:[0,1,2,3],guides:{normal:'/assets/pathtraced/guide-normal.webp',depth:'/assets/pathtraced/guide-depth.webp',albedo:'/assets/pathtraced/guide-albedo.webp'}},camera:{position:camera.position.toArray(),target:pose.target,quaternion:camera.quaternion.toArray(),fov:camera.fov,aspect:camera.aspect,near:camera.near,far:camera.far,projection:camera.projectionMatrix.toArray(),source:'world-shots imageHold / Journey settled noise camera'},renderer:{name:'three-gpu-pathtracer WebGLPathTracer',version:'0.0.23',three:'0.184.0',principalBounces:8,transmissiveBounces:EXTRA_TRANSMISSIVE_BOUNCES,stableNoise:true,tiles:[1,1],pixelRatio:1,textureSize:[512,512],display:'existing Denoiser.present ACES + gamma 1/2.2',encoding:'image/webp quality .94'},provenance:{capturedAt:new Date().toISOString(),scene:'createCourtyard, including Stanford Bunny support column',accumulation:'One uninterrupted true progressive accumulation, every raw N is the first N genuine path tracer samples; no synthesized noise or blended intermediate frames.',guides:'Existing GeometryGuides rendered from the same scene and exact camera, used by existing Denoiser.run.',overlays:'No JourneyVisuals, helper rays, UI pixels or labels in exported canvas.',captureEntry:'/capture.html',credits:'See /assets/pathtraced/CREDITS.md'}};
  await upload('manifest.json',new Blob([JSON.stringify(manifest,null,2)],{type:'application/json'}));
  // Vendor 0.0.23 dispose() refers to a missing _renderQuad property. Releasing
  // this dedicated renderer's context frees all capture GPU resources together.
  finale.stop();renderer.dispose();renderer.forceContextLoss();
  status.textContent=`Complete: ${samples.length} actual frames, 3 matched guide-aware filtered outputs, 3 geometry guide views. Manifest saved.`;
  document.body.dataset.captureComplete='true';stop.disabled=true;
 }catch(error){status.textContent=`Capture failed: ${String(error)}`;document.body.dataset.captureError=String(error);stop.disabled=true;}
};
