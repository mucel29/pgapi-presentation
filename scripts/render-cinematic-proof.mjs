// Offline CPU RASTERIZATION of the real Three.js scene and shot rails.
// This is geometry/framing evidence, NOT a browser/WebGL screenshot, lighting,
// reflection, transmission or performance validation. No path tracer is loaded.
import * as T from 'three';
import {writeFileSync,mkdirSync} from 'node:fs';
const commands=[];const shellQuote=s=>"'"+String(s).replaceAll("'","'\"'\"'")+"'";const execFileSync=(file,args)=>commands.push([file,...args].map(shellQuote).join(' '));
import {createCourtyard} from '../src/engine/courtyard.ts';
import {createRoom} from '../src/engine/room.ts';
import {beats} from '../src/content/chapters.ts';
import {shotPose,shotFraming,portalWorldPose,roomApproachPose,routePoint} from '../src/core/cinematics.ts';
import {monitor,portalLens,portalCut} from '../src/core/portal.ts';
import {route} from '../src/core/route.ts';
const dir='.build/cinematic-review';mkdirSync(dir,{recursive:true});
const court=createCourtyard(),room=createRoom(),sun=new T.Vector3(-.7,.6,.4).normalize();room.scene.updateMatrixWorld(true);
const p=new T.Vector3(),normal=new T.Vector3(),edge1=new T.Vector3(),edge2=new T.Vector3();
function render(world,camera,width,height,texture){
 const pixels=new Uint8Array(width*height*3),depth=new Float64Array(width*height);depth.fill(Infinity);
 const bg=world===court.world?[111,135,136]:[15,29,35];for(let i=0;i<width*height;i++)pixels.set(bg,i*3);
 camera.updateMatrixWorld();const inverse=camera.matrixWorldInverse,proj=camera.projectionMatrix;
 const clip=polygon=>{const result=[];for(let i=0;i<polygon.length;i++){const a=polygon[i],b=polygon[(i+1)%polygon.length],insideA=a.z<-.06,insideB=b.z<-.06;if(insideA)result.push(a);if(insideA!==insideB){const f=(-.06-a.z)/(b.z-a.z);result.push({x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f,z:-.06,u:a.u+(b.u-a.u)*f,v:a.v+(b.v-a.v)*f});}}return result;};
 world.traverse(o=>{
  if(!(o instanceof T.Mesh)||!o.visible)return;const geometry=o.geometry,positions=geometry.attributes.position,uv=geometry.attributes.uv,index=geometry.index,material=Array.isArray(o.material)?o.material[0]:o.material;if(!material?.color)return;
  const count=index?.count??positions.count;
  for(let triangle=0;triangle<count;triangle+=3){
   const vertices=[];
   for(let k=0;k<3;k++){const i=index?index.getX(triangle+k):triangle+k;p.fromBufferAttribute(positions,i).applyMatrix4(o.matrixWorld);vertices.push(p.clone());}
   normal.crossVectors(edge1.subVectors(vertices[1],vertices[0]),edge2.subVectors(vertices[2],vertices[0])).normalize();
   const view=camera.position.clone().sub(vertices[0]);if(material.side!==T.DoubleSide&&normal.dot(view)<=0)continue;
   const brightness=.32+.66*Math.max(0,normal.dot(sun))+.12*Math.max(0,normal.y),distance=camera.position.distanceTo(vertices[0]),fog=world===court.world?Math.max(0,Math.min(.8,(distance-85)/160)):0;
   const color=material.color.clone();if(material.emissiveIntensity>1)color.lerp(new T.Color('#ffe0ad'),.8);else color.multiplyScalar(brightness);color.lerp(new T.Color('#657875'),fog);
   const c=color.convertLinearToSRGB(),rgb=[c.r,c.g,c.b].map(x=>Math.max(0,Math.min(255,Math.round(x*255))));
   const poly=clip(vertices.map((v,k)=>{const i=index?index.getX(triangle+k):triangle+k;v.applyMatrix4(inverse);return {x:v.x,y:v.y,z:v.z,u:uv?.getX(i)??0,v:uv?.getY(i)??0};}));
   for(let fan=1;fan<poly.length-1;fan++){
    const points=[poly[0],poly[fan],poly[fan+1]].map(v=>{p.set(v.x,v.y,v.z).applyMatrix4(proj);return {x:(p.x+1)*width/2,y:(1-p.y)*height/2,z:-v.z,u:v.u,v:v.v};});
    const [a,b,c]=points,area=(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);if(Math.abs(area)<1e-8)continue;
    const x0=Math.max(0,Math.floor(Math.min(a.x,b.x,c.x))),x1=Math.min(width-1,Math.ceil(Math.max(a.x,b.x,c.x))),y0=Math.max(0,Math.floor(Math.min(a.y,b.y,c.y))),y1=Math.min(height-1,Math.ceil(Math.max(a.y,b.y,c.y)));
    for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
     const w1=((x+.5-a.x)*(c.y-a.y)-(y+.5-a.y)*(c.x-a.x))/area,w2=((b.x-a.x)*(y+.5-a.y)-(b.y-a.y)*(x+.5-a.x))/area,w0=1-w1-w2;if(w0<0||w1<0||w2<0)continue;
     const inverseZ=w0/a.z+w1/b.z+w2/c.z,z=1/inverseZ,at=y*width+x;if(z>=depth[at])continue;
     let shaded=rgb;if(texture&&material===room.display){const u=(w0*a.u/a.z+w1*b.u/b.z+w2*c.u/c.z)/inverseZ,v=(w0*a.v/a.z+w1*b.v/b.z+w2*c.v/c.z)/inverseZ,tx=Math.max(0,Math.min(texture.width-1,Math.floor(u*texture.width))),ty=Math.max(0,Math.min(texture.height-1,Math.floor((1-v)*texture.height)));shaded=texture.pixels.subarray((ty*texture.width+tx)*3,(ty*texture.width+tx)*3+3);}
     const opacity=material.transmission? .19:material.transparent?material.opacity:1;
     for(let channel=0;channel<3;channel++)pixels[at*3+channel]=opacity*shaded[channel]+(1-opacity)*pixels[at*3+channel];if(!material.transmission)depth[at]=z;
    }
   }
  }
 });
 return {pixels,width,height,depth};
}
function save(name,buffer,label){
 const ppm=`${dir}/${name}.ppm`,out=`${dir}/${name}.png`;writeFileSync(ppm,Buffer.concat([Buffer.from(`P6\n${buffer.width} ${buffer.height}\n255\n`),buffer.pixels]));
 execFileSync('magick',[ppm,'-fill','#061a1ccc','-draw',`rectangle 0,${buffer.height-27} ${buffer.width},${buffer.height}`,'-font','DejaVu-Sans-Mono','-pointsize','11','-fill','#e6e8d9','-annotate',`+10+${buffer.height-10}`,label,out]);return out;
}
function drawRay(buffer,camera,progress){
 const project=v=>{p.set(...v).project(camera);return {x:(p.x+1)*buffer.width/2,y:(1-p.y)*buffer.height/2,z:p.z};};
 const dot=(x,y,r,color)=>{for(let yy=Math.max(0,Math.floor(y-r));yy<Math.min(buffer.height,y+r);yy++)for(let xx=Math.max(0,Math.floor(x-r));xx<Math.min(buffer.width,x+r);xx++)if((xx-x)**2+(yy-y)**2<r*r)buffer.pixels.set(color,(yy*buffer.width+xx)*3);};
 for(let leg=0;leg<Math.ceil(progress);leg++){const a=project(route[leg]),b=project(routePoint(Math.min(leg+1,progress)));if(a.z>1||a.z< -1||b.z>1||b.z< -1)continue;const length=Math.hypot(b.x-a.x,b.y-a.y);for(let step=0;step<=length;step++){const f=step/Math.max(1,length);dot(a.x+(b.x-a.x)*f,a.y+(b.y-a.y)*f,1,[205,155,81]);}}
 const head=project(routePoint(progress));if(head.z<1&&head.z> -1)dot(head.x,head.y,3.4,[255,241,192]);
}
const camera=new T.PerspectiveCamera(43,16/9,.05,400),files=[];
for(const id of ['ray','diffuse','materials','to-glass','bvh','to-light','light']){
 const i=beats.findIndex(b=>b.id===id),b=beats[i],pose=shotPose(b,beats[Math.max(0,i-1)],1);camera.aspect=16/9;camera.updateProjectionMatrix();camera.position.set(...pose.position);camera.lookAt(...pose.target);const framing=shotFraming(b,camera.aspect);camera.setViewOffset(640,360,640*framing[0],360*framing[1],640,360);const buffer=render(court.world,camera,640,360);if(!['bvh'].includes(id))drawRay(buffer,camera,pose.ray);files.push(save(`arrival-${id}`,buffer,`${id} - CPU geometry raster; no WebGL lighting/reflections`));camera.clearViewOffset();
}
for(const id of ['portal','to-metal','to-glass','to-light']){
 const i=beats.findIndex(b=>b.id===id),b=beats[i],strip=[];
 for(let frame=0;frame<5;frame++){
  const t=frame/4,pose=shotPose(b,beats[i-1],t);camera.aspect=16/9;camera.updateProjectionMatrix();camera.position.set(...pose.position);camera.lookAt(...pose.target);let buffer;
  if(id==='portal'&&t<portalCut){const view=new T.PerspectiveCamera(portalLens(16/9).textureFov,monitor.width/monitor.height,.05,400),world=portalWorldPose(t);view.position.set(...world.position);view.lookAt(...world.target);const texture=render(court.world,view,400,Math.round(400/monitor.width*monitor.height));const approach=roomApproachPose(t,16/9,beats[0].camera,beats[0].target);camera.position.set(...approach.position);camera.lookAt(...approach.target);buffer=render(room.world,camera,640,360,texture);}else{buffer=render(court.world,camera,640,360);if(id!=='portal')drawRay(buffer,camera,pose.ray);}
  strip.push(save(`${id}-${frame}`,buffer,`${id} t=${t.toFixed(2)} - CPU geometry raster, not browser capture`));
 }
 execFileSync('magick',[...strip,'+append',`${dir}/${id}-strip.png`]);
}
execFileSync('magick',[...files,'-background','#102a2e','-gravity','center','-append',`${dir}/arrivals.png`]);

const glassIndex=beats.findIndex(b=>b.id==='to-glass'),glass=beats[glassIndex],portrait=[];
for(let frame=0;frame<5;frame++){
 const t=frame/4,pose=shotPose(glass,beats[glassIndex-1],t,9/16);camera.aspect=9/16;camera.updateProjectionMatrix();camera.position.set(...pose.position);camera.lookAt(...pose.target);const buffer=render(court.world,camera,390,693);drawRay(buffer,camera,pose.ray);portrait.push(save(`to-glass-portrait-${frame}`,buffer,`glass t=${t.toFixed(2)} - CPU geometry only`));
}
execFileSync('magick',[...portrait,'+append',`${dir}/to-glass-portrait-strip.png`]);

writeFileSync(`${dir}/convert-proof.sh`,'set -e\n'+commands.join('\n')+'\n');
console.log(`Generated ${files.length} arrivals and four five-frame travel strips in ${dir}. No WebGL/path tracer used.`);
