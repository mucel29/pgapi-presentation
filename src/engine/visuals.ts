import * as T from 'three';
import {LineSegments2} from 'three/addons/lines/LineSegments2.js';
import {LineSegmentsGeometry} from 'three/addons/lines/LineSegmentsGeometry.js';
import {LineMaterial} from 'three/addons/lines/LineMaterial.js';
import {emissionProgress,reflectionSamples,bvhInk} from '../core/visual-sequence.ts';
import {weightDisplay} from '../core/transport.ts';
import {surfaceRotation} from '../core/surface-frame.ts';
import {cameraPixel,illustratedSamples} from '../core/sampling.ts';
import {Reflector} from 'three/addons/objects/Reflector.js';
import {cosineHemisphere,normalize,sub,add,mul,reflect,rng,type Vec3} from '../core/math.ts';
import {route,throughput,diffuseNormal,metalNormal,glassNormal,origin} from '../core/route.ts';
import {traceSAH,type Node} from '../core/bvh.ts';
import {loopStageState,selectedPathEstimate} from '../core/lesson-state.ts';
import {lessonScale,lessonOffset,lessonPoint} from '../core/lesson-space.ts';
import {slabIntervals} from '../core/experiments.ts';
import type {Beat} from '../content/chapters.ts';
import type {Courtyard} from './courtyard.ts';
const GOLD=0xffc576,CYAN=0xf3f5e7;
function beam(color:number,r=.045,opacity=1){const o=new T.Mesh(new T.CylinderGeometry(r,r,1,6),new T.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false,toneMapped:false}));o.renderOrder=12;return o;}
function stretch(o:T.Mesh,a:Vec3,b:Vec3,f=1){const av=new T.Vector3(...a),bv=new T.Vector3(...b).sub(av).multiplyScalar(f),l=bv.length();o.visible=l>.001;o.scale.y=l;o.position.copy(av).addScaledVector(bv,.5);if(l>.001)o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),bv.normalize());}
function marker(color:number,r=.14){return new T.Mesh(new T.IcosahedronGeometry(r,1),new T.MeshBasicMaterial({color,toneMapped:false,transparent:true,depthWrite:false}));}
function arrowTip(color:number){const tip=new T.Mesh(new T.ConeGeometry(.18,.6,6),new T.MeshBasicMaterial({color,toneMapped:false,transparent:true,depthWrite:false}));tip.renderOrder=13;return tip;}
function reveal(v:{mesh:T.Mesh;a:Vec3;b:Vec3;tip?:T.Mesh},fraction:number){const f=Math.max(0,Math.min(1,fraction));stretch(v.mesh,v.a,v.b,f);if(v.tip){v.tip.visible=f>.08;v.tip.position.lerpVectors(new T.Vector3(...v.a),new T.Vector3(...v.b),f);v.tip.quaternion.copy(v.mesh.quaternion);}}
// Text is rendered as crisp DOM after projection; these invisible anchors
// remain attached to the exact world feature that the label describes.
function textLabel(text:string,color='#f4f1d9',_scale=3){
 const anchor=new T.Object3D();anchor.userData.guide={text,color};return anchor;
}
function boundWire(bounds:{min:Vec3;max:Vec3},color:number){
 const min=new T.Vector3(...bounds.min),max=new T.Vector3(...bounds.max),box=new T.Box3(min,max),helper=new T.Box3Helper(box,color);
 const material=helper.material as T.LineBasicMaterial;material.transparent=true;material.opacity=.6;material.depthTest=false;material.depthWrite=false;helper.renderOrder=21;return helper;
}
export class JourneyVisuals{
 root=new T.Group();rasterOnly=new T.Group();path=new T.Group();hemisphere=new T.Group();samples=new T.Group();normals=new T.Group();boxes=new T.Group();wire=new T.Group();materialRays=new T.Group();shadow=new T.Group();
 packet=marker(0xfff3cd,.2);private headHalo=marker(GOLD,.42);private tail=beam(0xffedbb,.13);private tailHalo=beam(GOLD,.26,.16);private contact=new T.Mesh(new T.TorusGeometry(.58,.045,6,32),new T.MeshBasicMaterial({color:GOLD,transparent:true,opacity:.7,depthWrite:false,toneMapped:false}));segments:T.Mesh[]=[];boxObjects=new Map<number,{group:T.Group;ink:LineMaterial;outline:LineMaterial}>();nodes:Node[]=[];selected:Node;lastStep=-1;manualStep:number|null=null;beat:Beat|null=null;progress=0;revision=0;
 testRayOrigin:Vec3=[0,0,0];testRayDirection:Vec3=[0,0,-1];rayCase='hit';private traceResult:ReturnType<typeof traceSAH>;private testBeam:T.Mesh;private hitMesh:T.Mesh;private hitOutline:T.LineLoop;private hitPoint=marker(0xff70b8,.13);private hitId=-2;private highlightKey='';
 private fans:{mesh:T.Mesh;a:Vec3;b:Vec3;tip:T.Mesh}[]=[];private sampleLines:{mesh:T.Mesh;a:Vec3;b:Vec3;index:number;startedAt:number;tip:T.Mesh}[]=[];private mirrorFans:{mesh:T.Mesh;a:Vec3;b:Vec3;tip:T.Mesh}[]=[];private highlight:T.Mesh;private elapsed=0;private userSelected=false;private splitPlane:T.Mesh;candidateIndex=0;
 room:Courtyard;
 sampleStations=new T.Group();private sampleMarkers:T.Mesh[]=[];private splitLabel=textLabel('plan X','#ffc576');
 lesson=new T.Group();private lessonSurfaces=new T.Group();private lessonCamera=new T.Group();private lessonLabel=textLabel('model · același pixel','#eef4df');
 cameraRig=new T.Group();glassRig=new T.Group();selection=new T.Group();slabContacts=new T.Group();sahVolumes=new T.Group();
 private normalEvents:T.Group[]=[];private reflectionProof=new T.Group();private diffuseSelected:T.Mesh;private mirrorSelected:T.Mesh;
 illustrativeDepth=8;loopStage=0;
 private loopVertex=marker(0xffdf38,.38);private returnMarker=marker(0xffc576,.22);private slabNear=marker(0x8cdbb4,.35);private slabFar=marker(0xffc576,.35);
 get returnedPixelPoint():Vec3{return add(route[5],[-3,5,0]);}
 get guideAnchors(){
  const anchors:{id:string;text:string;color:string;point:Vec3}[]=[];
  this.root.updateMatrixWorld(true);this.root.traverseVisible(o=>{
   const guide=o.userData.guide as {text:string;color:string}|undefined;
   if(guide)anchors.push({id:o.uuid,...guide,point:o.getWorldPosition(new T.Vector3()).toArray() as Vec3});
  });return anchors;
 }
 get loopState(){return loopStageState(this.loopStage);}
 setLoopStage(index:number){this.loopStage=Math.max(0,Math.min(6,Math.floor(index)));this.revision++;this.update(this.elapsed,this.progress);}
 setFlowStage(index:number){this.setLoopStage(index);}
 setIllustrativeDepth(depth:number){this.illustrativeDepth=depth<=2?2:depth<=4?4:8;this.revision++;this.update(this.elapsed,this.progress);}
 setDepth(depth:number){this.setIllustrativeDepth(depth);}
 setPrimarySampleCount(count:number){this.setSampleCount(count);}
 constructor(room:Courtyard){
  this.room=room;
  this.testRayOrigin=[...room.rayOrigin];this.testRayDirection=[...room.rayDirection];this.traceResult=room.traversal;this.root.name='Illustrations — excluded from path tracing';room.scene.add(this.root);const mirror=new Reflector(new T.PlaneGeometry(9,10),{textureWidth:256,textureHeight:256,color:0xb4a68c,clipBias:.003,multisample:0});mirror.position.set(...route[2]).addScaledVector(new T.Vector3(...metalNormal),.025);mirror.quaternion.copy(surfaceRotation(metalNormal));const renderMirror=mirror.onBeforeRender.bind(mirror);mirror.onBeforeRender=(renderer,scene,camera,geometry,material,group)=>{const rv=room.reflector.visible,fv=room.reflectorFrame.visible,iv=this.root.visible;room.reflector.visible=false;room.reflectorFrame.visible=false;this.root.visible=false;try{renderMirror(renderer,scene,camera,geometry,material,group);}finally{room.reflector.visible=rv;room.reflectorFrame.visible=fv;this.root.visible=iv;}};mirror.name='Raster planar reflection — excluded from tracer';this.rasterOnly.name='Raster reflections';room.scene.add(this.rasterOnly);this.rasterOnly.add(mirror);
  (this.headHalo.material as T.MeshBasicMaterial).opacity=.15;this.headHalo.renderOrder=13;this.packet.renderOrder=15;this.contact.renderOrder=14;
  this.root.add(this.headHalo,this.tail,this.tailHalo,this.contact);
  this.root.add(this.path,this.hemisphere,this.samples,this.normals,this.boxes,this.wire,this.materialRays,this.shadow,this.packet,this.cameraRig,this.glassRig,this.selection,this.slabContacts,this.sahVolumes,this.loopVertex,this.returnMarker,this.reflectionProof,this.sampleStations,this.splitLabel);
  const {center,right,up,footprint}=cameraPixel;
  // A flat image plane, never a 3D frustum. All cells and q share the sampler basis.
  const pixelGrid=new T.Group();this.cameraRig.add(pixelGrid);
  for(let k=-2;k<=2;k++)for(const vertical of [true,false]){
   const a=add(center,add(mul(right,(vertical?k:-2)*footprint),mul(up,(vertical?-2:k)*footprint))),b=add(center,add(mul(right,(vertical?k:2)*footprint),mul(up,(vertical?2:k)*footprint)));
   const line=beam(0x69acbd,.018,.5);stretch(line,a,b);pixelGrid.add(line);
  }
  cameraPixel.corners.forEach((a,i)=>{const line=beam(0xffdf70,.035);stretch(line,a,cameraPixel.corners[(i+1)%4]);pixelGrid.add(line);});
  const pinhole=marker(0xffffff,.19);pinhole.position.set(...origin);this.cameraRig.add(pinhole);
  const body=new T.Mesh(new T.BoxGeometry(1.7,1.3,1.4),new T.MeshBasicMaterial({color:0x36525b,wireframe:true}));body.position.set(...add(origin,mul(cameraPixel.forward,-.85)));body.quaternion.copy(surfaceRotation(cameraPixel.forward));this.cameraRig.add(body);
  const q=marker(0xffdf70,.08);q.position.set(...center);this.cameraRig.add(q);
  const direction=beam(0xffdf70,.035);stretch(direction,origin,add(center,mul(cameraPixel.forward,2)));this.cameraRig.add(direction);
  this.returnMarker.position.set(...center);this.returnMarker.material=new T.MeshBasicMaterial({color:new T.Color(...selectedPathEstimate().contribution),toneMapped:true});
  const returnedPixel=textLabel('ΔL → pixel q · RGB','#ffc576');returnedPixel.position.set(0,1,0);this.returnMarker.add(returnedPixel);
  // This is a miniature of the original camera/path, not a second camera
  // origin in the canyon. Uniform scale preserves sampled directions/hits.
  this.lessonCamera=this.cameraRig.clone(true);
  this.lesson.add(this.path,this.samples,this.sampleStations,this.shadow,this.selection,this.loopVertex,this.lessonCamera,this.lessonSurfaces);
  this.root.add(this.lesson,this.lessonLabel);
  this.lessonLabel.position.set(...add(lessonPoint(origin),[3,3,0]));
  for(const [geometry,point,color,normal] of [
   [new T.SphereGeometry(3.6,12,8),this.room.sphere.position.toArray(),0x43bdd9,null],
   [new T.PlaneGeometry(9,10),route[2],0xa8b88c,metalNormal],
   [new T.BoxGeometry(11,12,3),add(route[3],[0,0,-1.5]),0x74d9ec,null],
   [new T.PlaneGeometry(10,9),route[5],0xffdf70,normalize(sub(route[4],route[5]))],
  ] as [T.BufferGeometry,Vec3,number,Vec3|null][]){
   const surface=new T.Mesh(geometry,new T.MeshBasicMaterial({color,transparent:true,opacity:.4,side:T.DoubleSide,wireframe:true,depthWrite:false}));surface.position.set(...point);if(normal)surface.quaternion.copy(surfaceRotation(normal));this.lessonSurfaces.add(surface);
  }
  this.slabContacts.add(this.slabNear,this.slabFar);
  const nearLabel=textLabel('tNear','#8cdbb4',1.2),farLabel=textLabel('tFar','#ffc576',1.2);nearLabel.position.y=1.5;farLabel.position.y=-1.5;this.slabNear.add(nearLabel);this.slabFar.add(farLabel);
  this.diffuseSelected=beam(0xffdf70,.065,.95);stretch(this.diffuseSelected,route[1],add(route[1],mul(normalize(sub(route[2],route[1])),8)));this.selection.add(this.diffuseSelected);
  this.mirrorSelected=beam(0xffdf70,.06,.95);stretch(this.mirrorSelected,route[2],add(route[2],mul(normalize(sub(route[3],route[2])),8)));this.selection.add(this.mirrorSelected);
  for(const [index,point] of [route[3],route[4]].entries()){
   const face=new T.Group(),color=index?0xffc576:0x74d9ec;
   const corners=[[-5.5,-6],[5.5,-6],[5.5,6],[-5.5,6]].map(([x,y])=>add(point,[x,y,0]));
   corners.forEach((a,i)=>{const line=beam(color,.035,.8);stretch(line,a,corners[(i+1)%4]);face.add(line);});
   const contact=marker(color,.2);contact.position.set(...point);face.add(contact);
   const label=textLabel(index?'ieșire · aer':'intrare · aer → sticlă',index?'#ffc576':'#9ce7ed',1.25);label.position.set(...add(point,[0,index?-5.2:5.2,0]));face.add(label);this.glassRig.add(face);
  }
  for(const [index,point] of route.entries()){
   const mark=marker(index===5?0xffdf70:0xffffff,.18);mark.position.set(...point);(mark.material as T.MeshBasicMaterial).depthTest=false;mark.renderOrder=18;this.sampleMarkers.push(mark);this.sampleStations.add(mark);
   if(index===4)continue;
   const text=['o · cameră','difuz','oglindă','sticlă','','sursă'][index],label=textLabel(text,index===5?'#ffdf70':'#eef4df');label.position.set(...point);this.sampleStations.add(label);
  }
  // Macro-normal reflection is exact. The narrow fan uses the same .055 roughness as the mirror.
  const inDir=normalize(sub(route[1],route[2])),outDir=normalize(sub(route[3],route[2])),n=new T.Vector3(...metalNormal);
  for(const d of [inDir,outDir]){
   const dv=new T.Vector3(...d),points=Array.from({length:17},(_,i)=>n.clone().lerp(dv,i/16).normalize().multiplyScalar(3).add(new T.Vector3(...route[2])));
   this.reflectionProof.add(new T.Line(new T.BufferGeometry().setFromPoints(points),new T.LineBasicMaterial({color:0xffdf70,depthTest:false,toneMapped:false})));
  }
  const equal=textLabel('θi = θr · α = 0.055²','#ffdf70',1.1);equal.position.set(...add(route[2],[0,6,0]));this.reflectionProof.add(equal);
  route.slice(0,-1).forEach((_,i)=>{const beta=throughput[i],c=new T.Color(...beta).multiplyScalar(1/Math.max(...beta));const segment=beam(c.getHex(),.07,.4);this.path.add(segment);this.segments.push(segment);});
  for(const [index,[p,n]] of ([[route[1],diffuseNormal],[route[2],metalNormal],[route[3],glassNormal],[route[4],mul(glassNormal,-1)]] as [Vec3,Vec3][]).entries()){
   const group=new T.Group(),b=beam(CYAN,.035);stretch(b,p,add(p,mul(n,4.8)));group.add(b);const tip=marker(CYAN,.12);tip.position.set(...add(p,mul(n,4.8)));group.add(tip);
   const label=textLabel(index>1?`n${index-1}`:'n · normală','#f4f1d9',index>1?.9:1.1);label.position.set(...add(p,mul(n,6)));group.add(label);this.normalEvents.push(group);this.normals.add(group);
  }
  const random=rng(529);for(let i=0;i<6;i++){
   const d=cosineHemisphere(random(),random(),diffuseNormal),length=4+random()*2,color=new T.Color(...weightDisplay(throughput[1]).hue).getHex(),b=beam(color,.025,.3),end=add(route[1],mul(d,length));
   const tip=arrowTip(color);this.fans.push({mesh:b,a:route[1],b:end,tip});this.hemisphere.add(b,tip);
  }
  const dome=new T.Mesh(new T.SphereGeometry(5.5,12,6,0,Math.PI*2,0,Math.PI/2),new T.MeshBasicMaterial({color:CYAN,wireframe:true,transparent:true,opacity:.035,depthWrite:false}));dome.position.set(...route[1]);dome.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),new T.Vector3(...diffuseNormal));this.hemisphere.add(dome);
  // Independent PRIMARY paths: every ray starts at the original camera and
  // passes through a distinct point of the same pixel. No BSDF branch fan here.
  this.setSampleCount(12);
  const reflectedColor=new T.Color(...weightDisplay(throughput[2]).hue).getHex();
  for(const [index,out] of reflectionSamples(normalize(sub(route[2],route[1])),metalNormal,5).entries()){
   const end=add(route[2],mul(out,6+index%2)),fan=beam(reflectedColor,.024,.24),tip=arrowTip(reflectedColor);this.mirrorFans.push({mesh:fan,a:route[2],b:end,tip});this.materialRays.add(fan,tip);
  }
  const reflection=reflect(normalize(sub(route[3],route[2])),glassNormal),ref=beam(0xec8c7a,.04,.55);stretch(ref,route[3],add(route[3],mul(reflection,7)));ref.visible=false;
  const shadow=beam(0xff6654,.035,.8);stretch(shadow,route[1],route[5]);this.shadow.add(shadow);
  const collect=(n:Node)=>{
   this.nodes.push(n);const corners=Array.from({length:8},(_,i)=>new T.Vector3(i&1?n.max[0]:n.min[0],i&2?n.max[1]:n.min[1],i&4?n.max[2]:n.min[2]));const positions:number[]=[];
   for(let corner=0;corner<8;corner++)for(const bit of [1,2,4])if(!(corner&bit))positions.push(...corners[corner].toArray(),...corners[corner|bit].toArray());
   const geometry=new LineSegmentsGeometry().setPositions(positions),outline=new LineMaterial({color:bvhInk.outline,linewidth:8,worldUnits:false,depthTest:false,depthWrite:false,toneMapped:false}),ink=new LineMaterial({color:bvhInk.child,linewidth:3.5,worldUnits:false,depthTest:false,depthWrite:false,toneMapped:false});
   const darkLine=new LineSegments2(geometry,outline),colorLine=new LineSegments2(geometry,ink);darkLine.renderOrder=22;colorLine.renderOrder=23;colorLine.computeLineDistances();const group=new T.Group();group.add(darkLine,colorLine);this.boxObjects.set(n.id,{group,ink,outline});this.boxes.add(group);n.children?.forEach(collect);
  };collect(room.tree);this.selected=room.tree;
  const edges=new T.LineSegments(new T.WireframeGeometry(room.teaching.geometry),new T.LineBasicMaterial({color:0xb9dfd3,transparent:true,opacity:.16}));edges.matrixAutoUpdate=false;edges.matrix.copy(room.teaching.matrixWorld);this.wire.add(edges);
  this.highlight=new T.Mesh(new T.BufferGeometry(),new T.MeshBasicMaterial({color:0xffbc69,side:T.DoubleSide,transparent:true,opacity:.11,depthWrite:false}));this.root.add(this.highlight);this.splitPlane=new T.Mesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({color:0xffbf78,side:T.DoubleSide,transparent:true,opacity:.13,depthWrite:false}));this.root.add(this.splitPlane);const split=room.tree.split!;const size=new T.Vector3(...room.tree.max).sub(new T.Vector3(...room.tree.min));this.splitPlane.position.set(...room.tree.min).addScaledVector(size,.5);this.splitPlane.position.setComponent(split.axis,split.plane);this.splitPlane.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),new T.Vector3().setComponent(split.axis,1));this.splitPlane.scale.set(split.axis===0?size.z:size.x,split.axis===1?size.z:size.y,1);
  this.hitMesh=new T.Mesh(new T.BufferGeometry(),new T.MeshBasicMaterial({color:0xff70b8,side:T.DoubleSide,transparent:true,opacity:.95,depthTest:false,depthWrite:false,toneMapped:false}));this.hitMesh.renderOrder=30;this.hitOutline=new T.LineLoop(new T.BufferGeometry(),new T.LineBasicMaterial({color:0xffedf6,depthTest:false,toneMapped:false}));this.hitOutline.renderOrder=31;this.root.add(this.hitMesh,this.hitOutline,this.hitPoint);
  const test=beam(0xffdf98,.05);this.testBeam=test;stretch(test,room.rayOrigin,add(room.rayOrigin,mul(room.rayDirection,36)));this.wire.add(test);
 }
 setResolution(width:number,height:number){for(const box of this.boxObjects.values()){box.ink.resolution.set(width,height);box.outline.resolution.set(width,height);box.ink.linewidth=1;box.outline.linewidth=2.4;}}
 get illustratedSampleCount(){return this.sampleLines.length;}
 setSampleCount(count:number){
  const wanted=Math.max(1,Math.min(48,Math.floor(count))),previous=this.sampleLines.length;
  while(this.sampleLines.length>wanted){const line=this.sampleLines.pop()!;this.samples.remove(line.mesh,line.tip);for(const mesh of [line.mesh,line.tip]){mesh.geometry.dispose();(mesh.material as T.Material).dispose();}}
  if(wanted>previous)for(const [index,sample] of illustratedSamples(wanted).entries()){
   if(index<previous)continue;
   const mesh=beam(0xf7f5dc,.065,.6),tip=marker(0xffffff,.19);(mesh.material as T.MeshBasicMaterial).depthTest=false;(tip.material as T.MeshBasicMaterial).depthTest=false;tip.renderOrder=15;mesh.visible=tip.visible=false;
   this.sampleLines.push({mesh,a:sample.origin,b:sample.end,index:index-previous,startedAt:this.elapsed,tip});this.samples.add(mesh,tip);
  }
  if(wanted!==previous)this.revision++;
 }
 get isEmitting(){
  if(this.beat?.visual==='samples')return this.sampleLines.some(line=>emissionProgress(this.elapsed-line.startedAt,line.index,.25,2)<1);
  if(this.beat?.visual==='materials'&&!this.beat.travel)return this.mirrorFans.some((_,i)=>emissionProgress(this.elapsed,i)<1);
  return false;
 }
 fitHead(camera:T.PerspectiveCamera,height:number){
  const pixelScale=(position:T.Vector3,radius:number,pixels:number)=>Math.max(.6,2*Math.tan(T.MathUtils.degToRad(camera.fov)/2)*camera.position.distanceTo(position)/Math.max(1,height)*pixels/radius);
  const scale=pixelScale(this.packet.position,.2,2.6);this.packet.scale.setScalar(scale);this.headHalo.scale.setScalar(scale);
  const overview=this.beat?.visual==='samples'||this.beat?.visual==='loop',world=(point:T.Vector3)=>overview?new T.Vector3(...lessonPoint(point.toArray() as Vec3)):point;
  for(const segment of this.segments){const size=overview?pixelScale(world(segment.position),.07*lessonScale,.55):1;segment.scale.x=segment.scale.z=size;}
  for(const mark of this.sampleMarkers)mark.scale.setScalar(pixelScale(world(mark.position),.18*(overview?lessonScale:1),1.25));
  for(const line of this.sampleLines){line.tip.scale.setScalar(pixelScale(world(line.tip.position),.19*(overview?lessonScale:1),overview?1.1:2.1));const size=overview?pixelScale(world(line.mesh.position),.065*lessonScale,.25):1;line.mesh.scale.x=line.mesh.scale.z=size;}

 }
 get splitCandidates(){const candidates=[...this.tree.candidates].sort((a,b)=>a.cost-b.cost);return [candidates[0],candidates[Math.floor(candidates.length/3)],candidates[Math.floor(candidates.length*2/3)]];}
 setSplitCandidate(index:number){this.candidateIndex=Math.max(0,Math.min(2,index));this.revision++;this.updateBoxes();}
 get tree(){return this.room.tree;}get traversal(){return this.traceResult;}
 apply(beat:Beat){this.revision++;this.candidateIndex=0;this.beat=beat;this.elapsed=0;this.sampleLines.forEach((line,index)=>{line.startedAt=0;line.index=index;});this.lastStep=-1;this.manualStep=null;this.selected=this.tree;this.userSelected=false;this.progress=beat.rayFrom;this.loopStage=0;this.setCase('hit');this.update(0,beat.rayFrom);}
 select(id:number){this.revision++;this.userSelected=true;const step=this.traversal.events.findIndex(e=>e.node.id===id);if(this.beat?.visual==='traversal'&&step>=0){this.manualStep=step;this.lastStep=step;}this.selected=this.nodes.find(n=>n.id===id)??this.tree;this.updateBoxes();}
 step(delta:number){this.userSelected=false;this.manualStep=Math.max(0,Math.min(this.traversal.events.length-1,(this.manualStep??Math.max(0,this.lastStep))+delta));this.update(this.elapsed,this.progress);}
 setCase(kind:string){
  const o=this.room.rayOrigin;
  if(kind==='miss')this.setRay(o,normalize([.7,1,0]),kind);
  else if(kind==='other'){const tri=this.room.triangles[70],p=tri.reduce((a,v)=>a.map((x,k)=>x+v[k]/3) as Vec3,[0,0,0] as Vec3);this.setRay(o,normalize(sub(p,o)),kind);}
  else this.setRay(o,this.room.rayDirection,'hit');
 }
 setRay(o:Vec3,d:Vec3,label='custom'){
  this.testRayOrigin=[...o];this.testRayDirection=normalize(d);this.rayCase=label;this.traceResult=traceSAH(this.tree,this.room.triangles,this.testRayOrigin,this.testRayDirection);this.manualStep=0;this.lastStep=0;this.userSelected=false;this.selected=this.tree;this.revision++;
  stretch(this.testBeam,this.testRayOrigin,add(this.testRayOrigin,mul(this.testRayDirection,Math.min(100,this.traceResult.closest+8)||36)));
  this.updateBoxes();
 }
 traversalPlayback(play:boolean){this.userSelected=false;this.manualStep=play?null:Math.max(0,this.lastStep);this.revision++;}
 get currentHit(){return this.beat?.visual==='traversal'?this.event:this.traceResult;}
 get event(){return this.traversal.events[Math.max(0,this.lastStep)];}
 get displayRoot(){if(this.userSelected)return this.selected.depth>0?this.selected:this.tree;const active=this.beat?.visual==='traversal'?this.event?.node:this.selected;if(!active||active.depth<2)return this.tree;const depth=Math.max(0,active.depth-2);return this.nodes.find(n=>n.depth===depth&&active.indices.every(i=>n.indices.includes(i)))??this.tree;}
 get bvhStage(){return this.beat?.visual==='bvh'&&!this.userSelected?(this.elapsed<1.6?0:1):2;}
 visibleNodes(){const root=this.displayRoot;return this.nodes.filter(n=>n.depth>=root.depth&&n.depth<=root.depth+this.bvhStage&&n.indices.every(i=>root.indices.includes(i)));}
 private updateBoxes(){
  const c=this.beat?.visual??'',event=this.event;const active=c==='traversal'?event?.node:this.selected;
  for(const node of this.nodes){
   const box=this.boxObjects.get(node.id)!,child=active?.children?.includes(node),recent=c==='traversal'?this.traversal.events.slice(Math.max(0,this.lastStep-3),this.lastStep+1).find(e=>e.node.id===node.id):undefined,rejected=recent?.status==='miss'||recent?.status==='pruned';
   box.group.visible=this.boxes.visible&&(c==='aabb'?node===this.tree:c==='sah'?node===this.tree:c==='bvh'&&!this.userSelected?(this.elapsed<1.6?node===this.tree:Boolean(this.tree.children?.includes(node))):Boolean(node===active||child||rejected));
   const isActive=node===active,isRejected=isActive&&(event?.status==='miss'||event?.status==='pruned')||rejected;box.ink.color.set(isRejected?bvhInk.rejected:isActive?bvhInk.active:child?bvhInk.child:bvhInk.ancestor);box.ink.transparent=true;box.ink.opacity=isRejected?.22:isActive?1:child?.45:.2;box.outline.transparent=true;box.outline.opacity=isActive?.85:.35;box.ink.linewidth=isActive?1.3:.65;box.outline.linewidth=isActive?2.7:1.7;box.ink.dashed=Boolean(isRejected);box.ink.dashSize=.35;box.ink.gapSize=.18;
  }

  const split=this.splitCandidates[this.candidateIndex];
  const splitKey=`${this.candidateIndex}/${c}`;if(this.sahVolumes.userData.key!==splitKey){
   this.sahVolumes.traverse(o=>{if(o instanceof T.LineSegments||o instanceof T.Sprite){if('geometry' in o)(o.geometry as T.BufferGeometry).dispose();(o.material as T.Material).dispose();}});this.sahVolumes.clear();this.sahVolumes.userData.key=splitKey;
   if(c==='sah'&&split)for(const [index,bounds] of [split.leftBounds,split.rightBounds].entries()){
    this.sahVolumes.add(boundWire(bounds,index?0xffc576:0x74d9ec));
    const label=textLabel(index?'R':'L',index?'#ffc576':'#9ce7ed',1.3);label.position.set(...bounds.max);this.sahVolumes.add(label);
   }
  }
  this.splitLabel.visible=c==='sah';if(c==='sah'&&split){this.splitLabel.userData.guide.text=`plan ${'XYZ'[split.axis]}`;this.splitLabel.position.copy(this.splitPlane.position);}
  if(c==='sah'&&split){const size=new T.Vector3(...this.tree.max).sub(new T.Vector3(...this.tree.min));this.splitPlane.position.set(...this.tree.min).addScaledVector(size,.5);this.splitPlane.position.setComponent(split.axis,split.plane);this.splitPlane.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),new T.Vector3().setComponent(split.axis,1));this.splitPlane.scale.set(split.axis===0?size.z:size.x,split.axis===1?size.z:size.y,1);this.splitLabel.position.copy(this.splitPlane.position);}
  const indices=c==='sah'&&split?this.tree.indices.filter(i=>{const tri=this.room.triangles[i],values=tri.map(p=>p[split.axis]);return (Math.min(...values)+Math.max(...values))/2<split.plane;}):c==='traversal'&&event?.status==='leaf'?event.node.indices:active?.indices??[];this.highlight.visible=this.boxes.visible&&indices.length>0;
  const key=indices.join(',');if(key!==this.highlightKey){this.highlightKey=key;const positions=indices.flatMap(i=>this.room.triangles[i].flat());this.highlight.geometry.dispose();this.highlight.geometry=new T.BufferGeometry();this.highlight.geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));}
  const hit=this.currentHit,id=hit?.triangle??-1;this.hitMesh.visible=this.hitOutline.visible=this.hitPoint.visible=['cost','bvh','sah','aabb','traversal'].includes(c)&&id>=0;
  if(id>=0){const tri=this.room.triangles[id];if(id!==this.hitId){this.hitId=id;this.hitMesh.geometry.dispose();this.hitMesh.geometry=new T.BufferGeometry().setFromPoints(tri.map(p=>new T.Vector3(...p)));this.hitOutline.geometry.dispose();this.hitOutline.geometry=this.hitMesh.geometry.clone();}this.hitPoint.position.set(...this.testRayOrigin).addScaledVector(new T.Vector3(...this.testRayDirection),hit!.closest);}

 }
 update(elapsed:number,progress:number){
  this.elapsed=elapsed;this.progress=progress;const c=this.beat?.visual??'';const bvh=['cost','bvh','sah','aabb','traversal'].includes(c);
  const local=c==='samples'||c==='loop';this.lesson.scale.setScalar(local?lessonScale:1);this.lesson.position.set(...(local?lessonOffset:[0,0,0] as Vec3));this.lessonSurfaces.visible=this.lessonCamera.visible=this.lessonLabel.visible=local;
  this.cameraRig.visible=['ray','samples','light'].includes(c);this.returnMarker.visible=c==='light'&&!this.beat?.travel;
  this.glassRig.visible=this.beat?.motion==='glass';this.selection.visible=['diffuse','materials','loop'].includes(c);
  this.diffuseSelected.visible=c==='diffuse'||c==='loop'&&this.loopStage>=4;this.mirrorSelected.visible=c==='materials';
  this.reflectionProof.visible=c==='materials'&&!this.beat?.travel;
  this.loopVertex.visible=c==='loop'&&this.loopStage>=1;this.loopVertex.position.set(...route[1]);
  this.slabContacts.visible=c==='aabb';this.sahVolumes.visible=c==='sah';
  if(c==='aabb'){const interval=slabIntervals(this.testRayOrigin,this.testRayDirection,this.tree.min,this.tree.max);this.slabNear.visible=this.slabFar.visible=interval.hit;if(interval.hit){this.slabNear.position.set(...add(this.testRayOrigin,mul(this.testRayDirection,interval.near)));this.slabFar.position.set(...add(this.testRayOrigin,mul(this.testRayDirection,interval.far)));}}
  this.splitLabel.visible=c==='sah';this.splitPlane.visible=c==='sah';this.path.visible=!bvh;this.packet.visible=!bvh&&c!=='room'&&c!=='samples';this.hemisphere.visible=c==='diffuse';this.samples.visible=c==='samples';this.normals.visible=['diffuse','materials'].includes(c)||this.beat?.motion==='glass';this.normalEvents.forEach((group,i)=>group.visible=c==='diffuse'?i===0:this.beat?.motion==='glass'?i>=2:i===1);this.materialRays.visible=c==='materials'&&!this.beat?.travel&&progress>=2;this.shadow.visible=c==='loop'&&this.loopStage===3;this.wire.visible=bvh;this.boxes.visible=['bvh','sah','aabb','traversal'].includes(c);
  const shownProgress=c==='samples'?selectedPathEstimate(this.illustrativeDepth).segments:c==='loop'?(this.loopStage===0?.2:this.loopStage<6?1:1.3):progress;
  this.sampleStations.visible=c==='samples';this.sampleMarkers.forEach((mark,i)=>mark.visible=i<=shownProgress);
  this.segments.forEach((m,i)=>{(m.material as T.MeshBasicMaterial).depthTest=c!=='samples';(m.material as T.MeshBasicMaterial).fog=c!=='samples';stretch(m,route[i],route[i+1],Math.max(0,Math.min(1,shownProgress-i)));(m.material as T.MeshBasicMaterial).opacity=c==='loop'?.7:c==='samples'?.9:.4;});
  this.cameraRig.visible=c==='ray';
  this.glassRig.visible=this.beat?.motion==='glass';this.selection.visible=['diffuse','materials','loop'].includes(c);
  this.diffuseSelected.visible=c==='diffuse'||c==='loop'&&this.loopStage>=4;this.mirrorSelected.visible=c==='materials'&&!this.beat?.travel;this.reflectionProof.visible=this.mirrorSelected.visible;
  this.returnMarker.visible=c==='light'&&!this.beat?.travel;
  // Keep the accumulated pixel beside the source, rather than flying the
  // observer back across the canyon to the original image plane.
  this.returnMarker.position.set(...this.returnedPixelPoint);
  this.loopVertex.visible=c==='loop'&&this.loopStage>=1;this.loopVertex.position.set(...route[1]);(this.loopVertex.material as T.MeshBasicMaterial).color.set(this.loopStage===3?0xff6654:this.loopStage>=5?0x43bdd9:0xffdf38);
  this.slabContacts.visible=c==='aabb';this.sahVolumes.visible=c==='sah';
  if(c==='aabb'){
   const interval=slabIntervals(this.testRayOrigin,this.testRayDirection,this.tree.min,this.tree.max);
   this.slabNear.visible=this.slabFar.visible=interval.hit;
   if(interval.hit){this.slabNear.position.set(...add(this.testRayOrigin,mul(this.testRayDirection,interval.near)));this.slabFar.position.set(...add(this.testRayOrigin,mul(this.testRayDirection,interval.far)));}
  }
  const leg=Math.min(route.length-2,Math.max(0,Math.ceil(progress)-1)),f=Math.min(1,progress-leg);this.packet.position.lerpVectors(new T.Vector3(...route[leg]),new T.Vector3(...route[leg+1]),f);
  const beta=throughput[Math.min(throughput.length-1,Math.floor(progress))],hue=weightDisplay(beta).hue;for(const mesh of [this.packet,this.headHalo,this.tail,this.tailHalo,this.contact])(mesh.material as T.MeshBasicMaterial).color.setRGB(...hue);
  this.headHalo.visible=this.tail.visible=this.tailHalo.visible=this.packet.visible;this.headHalo.position.copy(this.packet.position);
  const legStart=new T.Vector3(...route[leg]),legEnd=new T.Vector3(...route[leg+1]),direction=legEnd.clone().sub(legStart).normalize(),tailLength=Math.min(4.5,legStart.distanceTo(this.packet.position));const tailStart=this.packet.position.clone().addScaledVector(direction,-tailLength).toArray() as Vec3;stretch(this.tail,tailStart,this.packet.position.toArray() as Vec3);stretch(this.tailHalo,tailStart,this.packet.position.toArray() as Vec3);this.tail.visible=this.tailHalo.visible=this.packet.visible&&tailLength>.02;
  const contactIndex=Math.min(5,Math.round(progress)),contactPoint=route[contactIndex],normal=contactIndex===1?diffuseNormal:contactIndex===2?metalNormal:glassNormal;this.contact.visible=this.packet.visible&&contactIndex>0&&Math.abs(progress-contactIndex)<.025;this.contact.position.set(...contactPoint).addScaledVector(new T.Vector3(...normal),.035);this.contact.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),new T.Vector3(...normal));
  this.fans.forEach((v,i)=>{reveal(v,emissionProgress(elapsed,i,.27,1.8));(v.mesh.material as T.MeshBasicMaterial).opacity=.19;(v.tip!.material as T.MeshBasicMaterial).opacity=.24;v.tip!.scale.setScalar(.5);});
  this.mirrorFans.forEach((v,i)=>{reveal(v,emissionProgress(elapsed,i,.3,1.8));v.tip!.scale.setScalar(.45);(v.tip!.material as T.MeshBasicMaterial).opacity=.3;});
  this.sampleLines.forEach(v=>{const f=emissionProgress(elapsed-v.startedAt,v.index,.25,2);reveal(v,f);v.tip.visible=f>0;v.tip.position.lerpVectors(new T.Vector3(...v.a),new T.Vector3(...v.b),f);(v.tip.material as T.MeshBasicMaterial).color.setRGB(...(f===1?weightDisplay(throughput[1]).hue:[1,1,1] as Vec3));});
  if(c==='traversal'){this.lastStep=this.manualStep??Math.min(this.traversal.events.length-1,Math.floor(elapsed/.85));if(this.lastStep===this.traversal.events.length-1)this.manualStep=this.lastStep;}
  if(bvh)this.updateBoxes();else this.hitMesh.visible=this.hitOutline.visible=this.hitPoint.visible=false;
 }
}
