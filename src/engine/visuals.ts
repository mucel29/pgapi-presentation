import * as T from 'three';
import {LineSegments2} from 'three/addons/lines/LineSegments2.js';
import {LineSegmentsGeometry} from 'three/addons/lines/LineSegmentsGeometry.js';
import {LineMaterial} from 'three/addons/lines/LineMaterial.js';
import {emissionProgress,reflectionSamples,bvhInk} from '../core/visual-sequence.ts';
import {weightDisplay} from '../core/transport.ts';
import {surfaceRotation} from '../core/surface-frame.ts';
import {illustratedSamples} from '../core/sampling.ts';
import {Reflector} from 'three/addons/objects/Reflector.js';
import {cosineHemisphere,normalize,sub,add,mul,reflect,rng,type Vec3} from '../core/math.ts';
import {route,throughput,diffuseNormal,metalNormal,glassNormal,origin} from '../core/route.ts';
import {traceSAH,type Node} from '../core/bvh.ts';
import type {Beat} from '../content/chapters.ts';
import type {Courtyard} from './courtyard.ts';
const GOLD=0xffc576,CYAN=0xf3f5e7;
function beam(color:number,r=.045,opacity=1){const o=new T.Mesh(new T.CylinderGeometry(r,r,1,6),new T.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false,toneMapped:false}));o.renderOrder=12;return o;}
function stretch(o:T.Mesh,a:Vec3,b:Vec3,f=1){const av=new T.Vector3(...a),bv=new T.Vector3(...b).sub(av).multiplyScalar(f),l=bv.length();o.visible=l>.001;o.scale.y=l;o.position.copy(av).addScaledVector(bv,.5);if(l>.001)o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),bv.normalize());}
function marker(color:number,r=.14){return new T.Mesh(new T.IcosahedronGeometry(r,1),new T.MeshBasicMaterial({color,toneMapped:false,transparent:true,depthWrite:false}));}
function arrowTip(color:number){const tip=new T.Mesh(new T.ConeGeometry(.18,.6,6),new T.MeshBasicMaterial({color,toneMapped:false,transparent:true,depthWrite:false}));tip.renderOrder=13;return tip;}
function reveal(v:{mesh:T.Mesh;a:Vec3;b:Vec3;tip?:T.Mesh},fraction:number){const f=Math.max(0,Math.min(1,fraction));stretch(v.mesh,v.a,v.b,f);if(v.tip){v.tip.visible=f>.08;v.tip.position.lerpVectors(new T.Vector3(...v.a),new T.Vector3(...v.b),f);v.tip.quaternion.copy(v.mesh.quaternion);}}
export class JourneyVisuals{
 root=new T.Group();rasterOnly=new T.Group();path=new T.Group();hemisphere=new T.Group();samples=new T.Group();normals=new T.Group();boxes=new T.Group();wire=new T.Group();materialRays=new T.Group();shadow=new T.Group();
 packet=marker(0xfff3cd,.2);private headHalo=marker(GOLD,.42);private tail=beam(0xffedbb,.13);private tailHalo=beam(GOLD,.26,.16);private contact=new T.Mesh(new T.TorusGeometry(.58,.045,6,32),new T.MeshBasicMaterial({color:GOLD,transparent:true,opacity:.7,depthWrite:false,toneMapped:false}));segments:T.Mesh[]=[];boxObjects=new Map<number,{group:T.Group;ink:LineMaterial;outline:LineMaterial}>();nodes:Node[]=[];selected:Node;lastStep=-1;manualStep:number|null=null;beat:Beat|null=null;progress=0;revision=0;
 testRayOrigin:Vec3=[0,0,0];testRayDirection:Vec3=[0,0,-1];rayCase='hit';private traceResult:ReturnType<typeof traceSAH>;private testBeam:T.Mesh;private hitMesh:T.Mesh;private hitOutline:T.LineLoop;private hitPoint=marker(0xff70b8,.13);private hitId=-2;private highlightKey='';
 private fans:{mesh:T.Mesh;a:Vec3;b:Vec3;tip:T.Mesh}[]=[];private sampleLines:{mesh:T.Mesh;a:Vec3;b:Vec3;index:number;startedAt:number;tip:T.Mesh}[]=[];private mirrorFans:{mesh:T.Mesh;a:Vec3;b:Vec3;tip:T.Mesh}[]=[];private highlight:T.Mesh;private elapsed=0;private userSelected=false;private splitPlane:T.Mesh;candidateIndex=0;
 room:Courtyard;
 constructor(room:Courtyard){
  this.room=room;
  this.testRayOrigin=[...room.rayOrigin];this.testRayDirection=[...room.rayDirection];this.traceResult=room.traversal;this.root.name='Illustrations — excluded from path tracing';room.scene.add(this.root);const mirror=new Reflector(new T.PlaneGeometry(9,10),{textureWidth:256,textureHeight:256,color:0xb4a68c,clipBias:.003,multisample:0});mirror.position.set(...route[2]).addScaledVector(new T.Vector3(...metalNormal),.025);mirror.quaternion.copy(surfaceRotation(metalNormal));const renderMirror=mirror.onBeforeRender.bind(mirror);mirror.onBeforeRender=(renderer,scene,camera,geometry,material,group)=>{const rv=room.reflector.visible,fv=room.reflectorFrame.visible,iv=this.root.visible;room.reflector.visible=false;room.reflectorFrame.visible=false;this.root.visible=false;try{renderMirror(renderer,scene,camera,geometry,material,group);}finally{room.reflector.visible=rv;room.reflectorFrame.visible=fv;this.root.visible=iv;}};mirror.name='Raster planar reflection — excluded from tracer';this.rasterOnly.name='Raster reflections';room.scene.add(this.rasterOnly);this.rasterOnly.add(mirror);
  (this.headHalo.material as T.MeshBasicMaterial).opacity=.15;this.headHalo.renderOrder=13;this.packet.renderOrder=15;this.contact.renderOrder=14;
  this.root.add(this.headHalo,this.tail,this.tailHalo,this.contact);
  this.root.add(this.path,this.hemisphere,this.samples,this.normals,this.boxes,this.wire,this.materialRays,this.shadow,this.packet);
  route.slice(0,-1).forEach((_,i)=>{const beta=throughput[i],c=new T.Color(...beta).multiplyScalar(1/Math.max(...beta));const segment=beam(c.getHex(),.07,.4);this.path.add(segment);this.segments.push(segment);});
  for(const [p,n] of [[route[1],diffuseNormal],[route[2],metalNormal],[route[3],glassNormal],[route[4],mul(glassNormal,-1)]] as [Vec3,Vec3][]){const b=beam(CYAN,.045);stretch(b,p,add(p,mul(n,3.8)));this.normals.add(b);const tip=marker(CYAN,.12);tip.position.set(...add(p,mul(n,3.8)));this.normals.add(tip);}
  const random=rng(529);for(let i=0;i<20;i++){
   const d=cosineHemisphere(random(),random(),diffuseNormal),length=9+random()*6,color=new T.Color(...weightDisplay(throughput[1]).hue).getHex(),b=beam(color,.085,.85),end=add(route[1],mul(d,length));
   const tip=arrowTip(color);this.fans.push({mesh:b,a:route[1],b:end,tip});this.hemisphere.add(b,tip);
  }
  const dome=new T.Mesh(new T.SphereGeometry(7,16,8,0,Math.PI*2,0,Math.PI/2),new T.MeshBasicMaterial({color:CYAN,wireframe:true,transparent:true,opacity:.07,depthWrite:false}));dome.position.set(...route[1]);dome.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),new T.Vector3(...diffuseNormal));this.hemisphere.add(dome);
  // Independent PRIMARY paths: every ray starts at the original camera and
  // passes through a distinct point of the same pixel. No BSDF branch fan here.
  this.setSampleCount(12);
  const reflectedColor=new T.Color(...weightDisplay(throughput[2]).hue).getHex();
  for(const [index,out] of reflectionSamples(normalize(sub(route[2],route[1])),metalNormal).entries()){
   const end=add(route[2],mul(out,13+index%3)),fan=beam(reflectedColor,.075,.85),tip=arrowTip(reflectedColor);this.mirrorFans.push({mesh:fan,a:route[2],b:end,tip});this.materialRays.add(fan,tip);
  }
  const reflection=reflect(normalize(sub(route[3],route[2])),glassNormal),ref=beam(0xec8c7a,.04,.55);stretch(ref,route[3],add(route[3],mul(reflection,7)));this.materialRays.add(ref);
  const shadow=beam(0xe5efb4,.03,.7);stretch(shadow,route[1],route[5]);this.shadow.add(shadow);
  const collect=(n:Node)=>{
   this.nodes.push(n);const corners=Array.from({length:8},(_,i)=>new T.Vector3(i&1?n.max[0]:n.min[0],i&2?n.max[1]:n.min[1],i&4?n.max[2]:n.min[2]));const positions:number[]=[];
   for(let corner=0;corner<8;corner++)for(const bit of [1,2,4])if(!(corner&bit))positions.push(...corners[corner].toArray(),...corners[corner|bit].toArray());
   const geometry=new LineSegmentsGeometry().setPositions(positions),outline=new LineMaterial({color:bvhInk.outline,linewidth:8,worldUnits:false,depthTest:false,depthWrite:false,toneMapped:false}),ink=new LineMaterial({color:bvhInk.child,linewidth:3.5,worldUnits:false,depthTest:false,depthWrite:false,toneMapped:false});
   const darkLine=new LineSegments2(geometry,outline),colorLine=new LineSegments2(geometry,ink);darkLine.renderOrder=22;colorLine.renderOrder=23;colorLine.computeLineDistances();const group=new T.Group();group.add(darkLine,colorLine);this.boxObjects.set(n.id,{group,ink,outline});this.boxes.add(group);n.children?.forEach(collect);
  };collect(room.tree);this.selected=room.tree;
  const edges=new T.LineSegments(new T.WireframeGeometry(room.teaching.geometry),new T.LineBasicMaterial({color:0xb9dfd3,transparent:true,opacity:.65}));edges.matrixAutoUpdate=false;edges.matrix.copy(room.teaching.matrixWorld);this.wire.add(edges);
  this.highlight=new T.Mesh(new T.BufferGeometry(),new T.MeshBasicMaterial({color:0xffbc69,side:T.DoubleSide,transparent:true,opacity:.22,depthWrite:false}));this.root.add(this.highlight);this.splitPlane=new T.Mesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({color:0xffbf78,side:T.DoubleSide,transparent:true,opacity:.28,depthWrite:false}));this.root.add(this.splitPlane);const split=room.tree.split!;const size=new T.Vector3(...room.tree.max).sub(new T.Vector3(...room.tree.min));this.splitPlane.position.set(...room.tree.min).addScaledVector(size,.5);this.splitPlane.position.setComponent(split.axis,split.plane);this.splitPlane.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),new T.Vector3().setComponent(split.axis,1));this.splitPlane.scale.set(split.axis===0?size.z:size.x,split.axis===1?size.z:size.y,1);
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
  for(const line of this.sampleLines)line.tip.scale.setScalar(pixelScale(line.tip.position,.19,2.1));
 }
 get splitCandidates(){const candidates=[...this.tree.candidates].sort((a,b)=>a.cost-b.cost);return [candidates[0],candidates[Math.floor(candidates.length/3)],candidates[Math.floor(candidates.length*2/3)]];}
 setSplitCandidate(index:number){this.candidateIndex=Math.max(0,Math.min(2,index));this.revision++;this.updateBoxes();}
 get tree(){return this.room.tree;}get traversal(){return this.traceResult;}
 apply(beat:Beat){this.revision++;this.candidateIndex=0;this.beat=beat;this.elapsed=0;this.sampleLines.forEach((line,index)=>{line.startedAt=0;line.index=index;});this.lastStep=-1;this.manualStep=null;this.selected=this.tree;this.userSelected=false;this.progress=beat.rayFrom;this.setCase('hit');this.update(0,beat.rayFrom);}
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
   box.group.visible=this.boxes.visible&&(c==='sah'?node===this.tree:c==='bvh'&&!this.userSelected?(this.elapsed<1.6?node===this.tree:Boolean(this.tree.children?.includes(node))):Boolean(node===active||child||rejected));
   const isActive=node===active,isRejected=isActive&&(event?.status==='miss'||event?.status==='pruned')||rejected;box.ink.color.set(isRejected?bvhInk.rejected:isActive?bvhInk.active:child?bvhInk.child:bvhInk.ancestor);box.ink.linewidth=isActive?1.3:1;box.outline.linewidth=isActive?2.7:2.3;box.ink.dashed=Boolean(isRejected);box.ink.dashSize=.35;box.ink.gapSize=.18;
  }

  const split=this.splitCandidates[this.candidateIndex];if(c==='sah'&&split){const size=new T.Vector3(...this.tree.max).sub(new T.Vector3(...this.tree.min));this.splitPlane.position.set(...this.tree.min).addScaledVector(size,.5);this.splitPlane.position.setComponent(split.axis,split.plane);this.splitPlane.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),new T.Vector3().setComponent(split.axis,1));this.splitPlane.scale.set(split.axis===0?size.z:size.x,split.axis===1?size.z:size.y,1);}
  const indices=c==='sah'&&split?this.tree.indices.filter(i=>{const tri=this.room.triangles[i],values=tri.map(p=>p[split.axis]);return (Math.min(...values)+Math.max(...values))/2<split.plane;}):c==='traversal'&&event?.status==='leaf'?event.node.indices:active?.indices??[];this.highlight.visible=this.boxes.visible&&indices.length>0;
  const key=indices.join(',');if(key!==this.highlightKey){this.highlightKey=key;const positions=indices.flatMap(i=>this.room.triangles[i].flat());this.highlight.geometry.dispose();this.highlight.geometry=new T.BufferGeometry();this.highlight.geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));}
  const hit=this.currentHit,id=hit?.triangle??-1;this.hitMesh.visible=this.hitOutline.visible=this.hitPoint.visible=['cost','bvh','sah','aabb','traversal'].includes(c)&&id>=0;
  if(id>=0){const tri=this.room.triangles[id];if(id!==this.hitId){this.hitId=id;this.hitMesh.geometry.dispose();this.hitMesh.geometry=new T.BufferGeometry().setFromPoints(tri.map(p=>new T.Vector3(...p)));this.hitOutline.geometry.dispose();this.hitOutline.geometry=this.hitMesh.geometry.clone();}this.hitPoint.position.set(...this.testRayOrigin).addScaledVector(new T.Vector3(...this.testRayDirection),hit!.closest);}

 }
 update(elapsed:number,progress:number){
  this.elapsed=elapsed;this.progress=progress;const c=this.beat?.visual??'';const bvh=['cost','bvh','sah','aabb','traversal'].includes(c);
  this.splitPlane.visible=c==='sah';this.path.visible=!bvh&&c!=='samples';this.packet.visible=!bvh&&c!=='room'&&c!=='samples';this.hemisphere.visible=c==='diffuse';this.samples.visible=c==='samples';this.normals.visible=['diffuse','materials'].includes(c);this.materialRays.visible=c==='materials'&&!this.beat?.travel&&progress>=2;this.shadow.visible=c==='loop';this.wire.visible=bvh;this.boxes.visible=['bvh','sah','aabb','traversal'].includes(c);
  this.segments.forEach((m,i)=>stretch(m,route[i],route[i+1],Math.max(0,Math.min(1,progress-i))));
  const leg=Math.min(route.length-2,Math.max(0,Math.ceil(progress)-1)),f=Math.min(1,progress-leg);this.packet.position.lerpVectors(new T.Vector3(...route[leg]),new T.Vector3(...route[leg+1]),f);
  const beta=throughput[Math.min(throughput.length-1,Math.floor(progress))],hue=weightDisplay(beta).hue;for(const mesh of [this.packet,this.headHalo,this.tail,this.tailHalo,this.contact])(mesh.material as T.MeshBasicMaterial).color.setRGB(...hue);
  this.headHalo.visible=this.tail.visible=this.tailHalo.visible=this.packet.visible;this.headHalo.position.copy(this.packet.position);
  const legStart=new T.Vector3(...route[leg]),legEnd=new T.Vector3(...route[leg+1]),direction=legEnd.clone().sub(legStart).normalize(),tailLength=Math.min(4.5,legStart.distanceTo(this.packet.position));const tailStart=this.packet.position.clone().addScaledVector(direction,-tailLength).toArray() as Vec3;stretch(this.tail,tailStart,this.packet.position.toArray() as Vec3);stretch(this.tailHalo,tailStart,this.packet.position.toArray() as Vec3);this.tail.visible=this.tailHalo.visible=this.packet.visible&&tailLength>.02;
  const contactIndex=Math.min(5,Math.round(progress)),contactPoint=route[contactIndex],normal=contactIndex===1?diffuseNormal:contactIndex===2?metalNormal:glassNormal;this.contact.visible=this.packet.visible&&contactIndex>0&&Math.abs(progress-contactIndex)<.025;this.contact.position.set(...contactPoint).addScaledVector(new T.Vector3(...normal),.035);this.contact.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),new T.Vector3(...normal));
  this.fans.forEach((v,i)=>reveal(v,(elapsed-i*.045)/.65));
  this.mirrorFans.forEach((v,i)=>reveal(v,emissionProgress(elapsed,i)));
  this.sampleLines.forEach(v=>{const f=emissionProgress(elapsed-v.startedAt,v.index,.25,2);reveal(v,f);v.tip.visible=f>0;v.tip.position.lerpVectors(new T.Vector3(...v.a),new T.Vector3(...v.b),f);(v.tip.material as T.MeshBasicMaterial).color.setRGB(...(f===1?weightDisplay(throughput[1]).hue:[1,1,1] as Vec3));});
  if(c==='traversal'){this.lastStep=this.manualStep??Math.min(this.traversal.events.length-1,Math.floor(elapsed/.85));if(this.lastStep===this.traversal.events.length-1)this.manualStep=this.lastStep;}
  if(bvh)this.updateBoxes();else this.hitMesh.visible=this.hitOutline.visible=this.hitPoint.visible=false;
 }
}
