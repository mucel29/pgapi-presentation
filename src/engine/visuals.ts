import * as T from 'three';
import {LineSegments2} from 'three/addons/lines/LineSegments2.js';
import {LineSegmentsGeometry} from 'three/addons/lines/LineSegmentsGeometry.js';
import {LineMaterial} from 'three/addons/lines/LineMaterial.js';
import {emissionProgress,reflectionSamples,bvhInk} from '../core/visual-sequence.ts';
import {surfaceRotation} from '../core/surface-frame.ts';
import {cameraPixel,illustratedSamples} from '../core/sampling.ts';
import {Reflector} from 'three/addons/objects/Reflector.js';
import {cosineHemisphere,normalize,sub,add,mul,rng,reflect,type Vec3} from '../core/math.ts';
import {route,diffuseNormal,metalNormal,glassNormal,origin,throughput} from '../core/route.ts';
import {traceSAH,type Node} from '../core/bvh.ts';
import {createAccelerationData} from '../core/acceleration-model.ts';
import {materialPalette} from '../core/transport.ts';
import {primaryHit} from '../core/sphere-mesh.ts';
import {slabIntervals} from '../core/experiments.ts';
import type {Beat} from '../content/chapters.ts';
import type {Courtyard} from './courtyard.ts';
const GOLD=0xffdf98,IVORY=0xfff3cd,NORMAL=0xf3f5e7,CANDIDATE=0x74d9ec;
const TRAVERSAL_SECONDS=.85,TRAVERSAL_HOLD=1.7;
const sampleColors=[0xffd294,0xa4d5bf,0xc7b1e8,0xf0b0bc];
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
 root=new T.Group();rasterOnly=new T.Group();path=new T.Group();hemisphere=new T.Group();normals=new T.Group();boxes=new T.Group();wire=new T.Group();materialRays=new T.Group();
 sampleRays=new T.Group();private sampleCount=2;private sampleDepth=3;private samplePaths:{points:Vec3[];segments:T.Mesh[];head:T.Mesh;pixel:T.Mesh;started:number}[]=[];private playbackStarted=0;
 packet=marker(0xfff3cd,.2);private headHalo=marker(GOLD,.42);private tail=beam(0xffedbb,.13);private tailHalo=beam(GOLD,.26,.16);private contact=new T.Mesh(new T.TorusGeometry(.58,.045,6,32),new T.MeshBasicMaterial({color:GOLD,transparent:true,opacity:.7,depthWrite:false,toneMapped:false}));segments:T.Mesh[]=[];boxObjects=new Map<number,{group:T.Group;ink:LineMaterial;outline:LineMaterial}>();nodes:Node[]=[];selected:Node;lastStep=-1;manualStep:number|null=null;beat:Beat|null=null;progress=0;revision=0;
 testRayOrigin:Vec3=[0,0,0];testRayDirection:Vec3=[0,0,-1];rayCase='hit';primaryTriangle!:LineSegments2;private primaryInk!:LineMaterial;private traceResult:ReturnType<typeof traceSAH>;private testBeam:T.Mesh;private hitMesh:T.Mesh;private hitOutline:LineSegments2;private hitCorners=[marker(0xffedf6,.1),marker(0xffedf6,.1),marker(0xffedf6,.1)];private hitLabel=textLabel('closest-hit','#ff96ce');private hitPoint=marker(0xff70b8,.13);private hitId=-2;private highlightKey='';
 private fans:{mesh:T.Mesh;a:Vec3;b:Vec3;tip:T.Mesh}[]=[];private mirrorFans:{mesh:T.Mesh;a:Vec3;b:Vec3;tip:T.Mesh}[]=[];private highlight:T.Mesh;private triangleInk:LineMaterial;private triangleOutline:LineMaterial;private selectedEdges:LineSegments2;private selectedInk:LineMaterial;private hitInk:LineMaterial;private elapsed=0;private userSelected=false;private splitPlane:T.Mesh;candidateIndex=0;
 room:Courtyard;
 accelerationData:ReturnType<typeof createAccelerationData>;accelerationScene=new T.Scene();accelerationModel!:T.Mesh;
 get accelerationActive(){return ['cost','bvh','sah','aabb','traversal'].includes(this.beat?.visual??'');}
 get triangleCount(){return this.accelerationData.triangles.length;}
 private splitLabel=textLabel('plan X','#ffc576');
 private queryLabel=textLabel('raza traseului · Stanford Bunny','#ffdf98');
 cameraRig=new T.Group();glassRig=new T.Group();selection=new T.Group();slabContacts=new T.Group();sahVolumes=new T.Group();
 private normalEvents:T.Group[]=[];private reflectionProof=new T.Group();private mirrorSelected:T.Mesh;private selectedDirection=textLabel('direcția aleasă','#ffdf98');
 private slabNear=marker(0x8cdbb4,.35);private slabFar=marker(0xffc576,.35);
 get guideAnchors(){
  const anchors:{id:string;text:string;color:string;point:Vec3}[]=[];
  this.root.updateMatrixWorld(true);this.root.traverseVisible(o=>{
   const guide=o.userData.guide as {text:string;color:string}|undefined;
   if(guide)anchors.push({id:o.uuid,...guide,point:o.getWorldPosition(new T.Vector3()).toArray() as Vec3});
  });return anchors;
 }
 constructor(room:Courtyard){
  this.room=room;this.accelerationData=room;
  this.testRayOrigin=[...this.accelerationData.rayOrigin];this.testRayDirection=[...this.accelerationData.rayDirection];this.traceResult=this.accelerationData.traversal;
  this.accelerationScene.background=new T.Color('#14232e');
  this.accelerationModel=new T.Mesh(this.accelerationData.geometry,new T.MeshStandardMaterial({vertexColors:true,roughness:.65,metalness:.15,side:T.DoubleSide,flatShading:true}));this.accelerationModel.name='Stanford Bunny — BVH triangle mesh';this.accelerationScene.add(this.accelerationModel,new T.HemisphereLight(0xd9eef8,0x27323e,2.2));const modelLight=new T.DirectionalLight(0xffdfb0,3);modelLight.position.set(-8,14,16);this.accelerationScene.add(modelLight);
  this.root.name='Illustrations — excluded from path tracing';room.scene.add(this.root);const mirror=new Reflector(new T.PlaneGeometry(9,10),{textureWidth:256,textureHeight:256,color:materialPalette.metal,clipBias:.003,multisample:0});mirror.position.set(...route[2]).addScaledVector(new T.Vector3(...metalNormal),.025);mirror.quaternion.copy(surfaceRotation(metalNormal));const renderMirror=mirror.onBeforeRender.bind(mirror);mirror.onBeforeRender=(renderer,scene,camera,geometry,material,group)=>{const rv=room.reflector.visible,fv=room.reflectorFrame.visible,iv=this.root.visible;room.reflector.visible=false;room.reflectorFrame.visible=false;this.root.visible=false;try{renderMirror(renderer,scene,camera,geometry,material,group);}finally{room.reflector.visible=rv;room.reflectorFrame.visible=fv;this.root.visible=iv;}};mirror.name='Raster planar reflection — excluded from tracer';this.rasterOnly.name='Raster reflections';room.scene.add(this.rasterOnly);this.rasterOnly.add(mirror);
  (this.headHalo.material as T.MeshBasicMaterial).opacity=.15;this.headHalo.renderOrder=13;this.packet.renderOrder=15;this.contact.renderOrder=14;
  this.root.add(this.headHalo,this.tail,this.tailHalo,this.contact);
  this.root.add(this.sampleRays,this.path,this.hemisphere,this.normals,this.boxes,this.wire,this.materialRays,this.packet,this.cameraRig,this.glassRig,this.selection,this.slabContacts,this.sahVolumes,this.reflectionProof,this.splitLabel);
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
  // The sample bundle is the same original world-space camera and cell.
  // Primary hits are analytic; subsequent endpoints are real CPU mesh queries.
  // This illustration never imports, prepares or starts the GPU path tracer.
  const sampleRandom=rng(186),sampleQuery=new T.Raycaster();
  for(const [index,sample] of illustratedSamples(4).entries()){
   const points:Vec3[]=[[...sample.origin],sample.end],weights:Vec3[]=[[1,1,1]];
   let point=sample.end,direction=sample.outgoing!,weight=[...throughput[1]] as Vec3;
   for(let bounce=1;bounce<3;bounce++){
    sampleQuery.set(new T.Vector3(...point).addScaledVector(new T.Vector3(...direction),.035),new T.Vector3(...direction));sampleQuery.far=180;
    const hit=sampleQuery.intersectObject(room.world,true).find(h=>h.distance>.05);
    const end=hit?hit.point.toArray() as Vec3:add(point,mul(direction,75));points.push(end);weights.push([...weight]);
    if(!hit)break;
    const normal=hit.face!.normal.clone().applyNormalMatrix(new T.Matrix3().getNormalMatrix(hit.object.matrixWorld));if(normal.dot(new T.Vector3(...direction))>0)normal.negate();
    const object=hit.object as T.Mesh,material=(Array.isArray(object.material)?object.material[hit.face!.materialIndex]:object.material) as T.MeshStandardMaterial;
    weight=weight.map((v,i)=>v*(material.color?.toArray()[i]??1)) as Vec3;
    direction=object===room.reflector?reflect(direction,normal.toArray()):cosineHemisphere(sampleRandom(),sampleRandom(),normal.toArray());point=end;
    // Transmission is already taught by the selected optical path. Stop this
    // illustrative sample at glass rather than inventing an opaque scatter.
    if(object===room.pane||object===room.lamp)break;
   }
   const group=new T.Group();group.name=`Original-camera sample ${index}`;
   const segments=weights.map((weight,i)=>{const mesh=beam(0xffffff,.04,.8);mesh.name=`Sample ${index} segment ${i}`;(mesh.material as T.MeshBasicMaterial).color.setRGB(...weight);group.add(mesh);return mesh;});
   const head=marker(0xffffff,.14);head.name=`Sample head ${index}`;head.renderOrder=15;group.add(head);
   const pixel=marker(sampleColors[index],.065);pixel.position.set(...sample.pixel);group.add(pixel);this.sampleRays.add(group);
   this.samplePaths.push({points,segments,head,pixel,started:index*.28});
  }
  this.slabContacts.add(this.slabNear,this.slabFar);
  const nearLabel=textLabel('tNear','#8cdbb4',1.2),farLabel=textLabel('tFar','#ffc576',1.2);nearLabel.position.y=1.5;farLabel.position.y=-1.5;this.slabNear.add(nearLabel);this.slabFar.add(farLabel);
  this.mirrorSelected=beam(0xffdf70,.06,.95);stretch(this.mirrorSelected,route[2],add(route[2],mul(normalize(sub(route[3],route[2])),8)));this.selection.add(this.mirrorSelected);
  for(const [index,point] of [route[3],route[4]].entries()){
   const face=new T.Group(),color=index?0xffc576:0x74d9ec;
   const corners=[[-5.5,-6],[5.5,-6],[5.5,6],[-5.5,6]].map(([x,y])=>add(point,[x,y,0]));
   corners.forEach((a,i)=>{const line=beam(color,.035,.8);stretch(line,a,corners[(i+1)%4]);face.add(line);});
   const contact=marker(color,.2);contact.position.set(...point);face.add(contact);
   const label=textLabel(index?'ieșire · aer':'intrare · aer → sticlă',index?'#ffc576':'#9ce7ed',1.25);label.position.set(...add(point,[0,index?-5.2:5.2,0]));face.add(label);this.glassRig.add(face);
  }
  // Macro-normal reflection is exact. The narrow fan uses the same .055 roughness as the mirror.
  const inDir=normalize(sub(route[1],route[2])),outDir=normalize(sub(route[3],route[2])),n=new T.Vector3(...metalNormal);
  for(const d of [inDir,outDir]){
   const dv=new T.Vector3(...d),points=Array.from({length:17},(_,i)=>n.clone().lerp(dv,i/16).normalize().multiplyScalar(3).add(new T.Vector3(...route[2])));
   this.reflectionProof.add(new T.Line(new T.BufferGeometry().setFromPoints(points),new T.LineBasicMaterial({color:0xffdf70,depthTest:false,toneMapped:false})));
  }
  const equal=textLabel('θi = θr · α = 0.055²','#ffdf70',1.1);equal.position.set(...add(route[2],[0,6,0]));this.reflectionProof.add(equal);
  route.slice(0,-1).forEach(()=>{const segment=beam(IVORY,.07,.5);this.path.add(segment);this.segments.push(segment);});
  for(const [index,[p,n]] of ([[route[1],diffuseNormal],[route[2],metalNormal],[route[3],glassNormal],[route[4],mul(glassNormal,-1)]] as [Vec3,Vec3][]).entries()){
   const group=new T.Group(),b=beam(NORMAL,.045);stretch(b,p,add(p,mul(n,4.8)));group.add(b);const tip=marker(NORMAL,.14);tip.position.set(...add(p,mul(n,4.8)));group.add(tip);
   const label=textLabel(index>1?`n${index-1}`:'n · normală','#f4f1d9',index>1?.9:1.1);label.position.set(...add(p,mul(n,6)));group.add(label);this.normalEvents.push(group);this.normals.add(group);
  }
  // Six independent cosine-weighted candidates and the valid direction
  // selected for the story. All are alternatives, never split energy paths.
  const random=rng(529),directions=Array.from({length:6},()=>cosineHemisphere(random(),random(),diffuseNormal));
  directions.push(normalize(sub(route[2],route[1])));
  for(const [index,d] of directions.entries()){
   const end=add(route[1],mul(d,10.5)),mesh=beam(CANDIDATE,.055,.72),tip=arrowTip(CANDIDATE);
   mesh.name=`Diffuse candidate ${index}`;tip.name=`Diffuse candidate tip ${index}`;
   this.fans.push({mesh,a:route[1],b:end,tip});this.hemisphere.add(mesh,tip);
  }
  this.selectedDirection.position.set(...add(this.fans[6].b,[0,1.1,0]));this.hemisphere.add(this.selectedDirection);
  const dome=new T.Mesh(new T.SphereGeometry(10.5,16,8,0,Math.PI*2,0,Math.PI/2),new T.MeshBasicMaterial({color:NORMAL,wireframe:true,transparent:true,opacity:.12,depthWrite:false}));dome.position.set(...route[1]);dome.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),new T.Vector3(...diffuseNormal));this.hemisphere.add(dome);
  for(const [index,out] of reflectionSamples(normalize(sub(route[2],route[1])),metalNormal,5).entries()){
   const end=add(route[2],mul(out,6+index%2)),fan=beam(GOLD,.024,.24),tip=arrowTip(GOLD);for(const mesh of [fan,tip])(mesh.material as T.MeshBasicMaterial).color.setRGB(...throughput[2]);this.mirrorFans.push({mesh:fan,a:route[2],b:end,tip});this.materialRays.add(fan,tip);
  }
  const collect=(n:Node)=>{
   this.nodes.push(n);const corners=Array.from({length:8},(_,i)=>new T.Vector3(i&1?n.max[0]:n.min[0],i&2?n.max[1]:n.min[1],i&4?n.max[2]:n.min[2]));const positions:number[]=[];
   for(let corner=0;corner<8;corner++)for(const bit of [1,2,4])if(!(corner&bit))positions.push(...corners[corner].toArray(),...corners[corner|bit].toArray());
   const geometry=new LineSegmentsGeometry().setPositions(positions),outline=new LineMaterial({color:bvhInk.outline,linewidth:8,worldUnits:false,depthTest:false,depthWrite:false,toneMapped:false}),ink=new LineMaterial({color:bvhInk.child,linewidth:3.5,worldUnits:false,depthTest:false,depthWrite:false,toneMapped:false});
   const darkLine=new LineSegments2(geometry,outline),colorLine=new LineSegments2(geometry,ink);darkLine.renderOrder=22;colorLine.renderOrder=23;colorLine.computeLineDistances();const group=new T.Group();group.add(darkLine,colorLine);this.boxObjects.set(n.id,{group,ink,outline});this.boxes.add(group);n.children?.forEach(collect);
  };collect(this.tree);this.selected=this.tree;
  // WireframeGeometry retains every coplanar diagonal: these are the same
  // Wireframe of the same probe triangles used by the BVH.
  const rawEdges=new T.WireframeGeometry(this.accelerationData.geometry),edgeGeometry=new LineSegmentsGeometry().setPositions(rawEdges.attributes.position.array as Float32Array);rawEdges.dispose();
  this.triangleInk=new LineMaterial({color:0xe1f5ff,linewidth:1,transparent:true,opacity:.1,depthTest:false,depthWrite:false,toneMapped:false});
  this.triangleOutline=new LineMaterial({color:0x16252e,linewidth:2.5,transparent:true,opacity:.25,depthTest:false,depthWrite:false,toneMapped:false});
  const darkEdges=new LineSegments2(edgeGeometry,this.triangleOutline),edges=new LineSegments2(edgeGeometry,this.triangleInk);darkEdges.renderOrder=16;edges.renderOrder=17;this.wire.add(darkEdges,edges);
  this.highlight=new T.Mesh(new T.BufferGeometry(),new T.MeshBasicMaterial({color:0x27c5ed,side:T.DoubleSide,transparent:true,opacity:.16,depthTest:false,depthWrite:false}));this.highlight.renderOrder=15;
  this.selectedInk=new LineMaterial({color:0x65e5ff,linewidth:1.2,transparent:true,opacity:.5,depthTest:false,depthWrite:false,toneMapped:false});this.selectedEdges=new LineSegments2(new LineSegmentsGeometry(),this.selectedInk);this.selectedEdges.renderOrder=18;
  this.root.add(this.highlight,this.selectedEdges);this.splitPlane=new T.Mesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({color:0xffbf78,side:T.DoubleSide,transparent:true,opacity:.13,depthWrite:false}));this.root.add(this.splitPlane);const split=this.tree.split!;const size=new T.Vector3(...this.tree.max).sub(new T.Vector3(...this.tree.min));this.splitPlane.position.set(...this.tree.min).addScaledVector(size,.5);this.splitPlane.position.setComponent(split.axis,split.plane);this.splitPlane.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),new T.Vector3().setComponent(split.axis,1));this.splitPlane.scale.set(split.axis===0?size.z:size.x,split.axis===1?size.z:size.y,1);
  this.hitMesh=new T.Mesh(new T.BufferGeometry(),new T.MeshBasicMaterial({color:0xff70b8,side:T.DoubleSide,transparent:true,opacity:.72,depthTest:false,depthWrite:false,toneMapped:false}));this.hitMesh.renderOrder=30;
  this.hitInk=new LineMaterial({color:0xffedf6,linewidth:1.4,depthTest:false,depthWrite:false,toneMapped:false});this.hitOutline=new LineSegments2(new LineSegmentsGeometry(),this.hitInk);this.hitOutline.renderOrder=31;
  this.hitCorners.forEach((corner,i)=>{corner.name=`Closest triangle vertex ${i}`;corner.renderOrder=32;(corner.material as T.MeshBasicMaterial).depthTest=false;});
  this.root.add(this.hitMesh,this.hitOutline,this.hitPoint,...this.hitCorners,this.hitLabel);
  // The sphere triangle that the primary ray hits, the same one as in the panel.
  {const tri=primaryHit().triangle,edges=[0,1,1,2,2,0].flatMap(i=>tri[i]);this.primaryInk=new LineMaterial({color:0xffffff,linewidth:2.2,depthTest:false,depthWrite:false,toneMapped:false});this.primaryTriangle=new LineSegments2(new LineSegmentsGeometry().setPositions(edges),this.primaryInk);this.primaryTriangle.renderOrder=40;this.primaryTriangle.visible=false;this.root.add(this.primaryTriangle);}
  const test=beam(0xffdf98,.14);this.testBeam=test;stretch(test,this.accelerationData.rayOrigin,add(this.accelerationData.rayOrigin,mul(this.accelerationData.rayDirection,Number.isFinite(this.accelerationData.traversal.closest)?this.accelerationData.traversal.closest:28)));this.wire.add(test,this.queryLabel);
 }
 setResolution(width:number,height:number){for(const ink of [this.primaryInk,this.triangleInk,this.triangleOutline,this.selectedInk,this.hitInk])ink.resolution.set(width,height);for(const box of this.boxObjects.values()){box.ink.resolution.set(width,height);box.outline.resolution.set(width,height);box.ink.linewidth=1;box.outline.linewidth=2.4;}}
 get diffusePhase(){return this.beat?.id==='diffuse-chosen'?'selected':'candidates';}
 get traversalActive(){return ['traversal'].includes(this.beat?.visual??'');}
 get isEmitting(){
  if(this.beat?.visual==='diffuse')return this.diffusePhase==='candidates'&&this.elapsed<1.6;
  if(this.beat?.visual==='samples')return this.samplePaths.some((sample,i)=>i<this.sampleCount&&this.elapsed<sample.started+Math.min(this.sampleDepth,sample.segments.length)*.85);
  if(this.beat?.visual==='materials'&&!this.beat.travel)return this.mirrorFans.some((_,i)=>emissionProgress(this.elapsed,i)<1);
  return false;
 }
 fitHead(camera:T.PerspectiveCamera,height:number){
  const pixelScale=(position:T.Vector3,radius:number,pixels:number)=>Math.max(.6,2*Math.tan(T.MathUtils.degToRad(camera.fov)/2)*camera.position.distanceTo(position)/Math.max(1,height)*pixels/radius);
  const scale=pixelScale(this.packet.position,.2,2.6);this.packet.scale.setScalar(scale);this.headHalo.scale.setScalar(scale);
  this.hitCorners.forEach(corner=>corner.scale.setScalar(pixelScale(corner.position,.1,2.2)));
  for(const fan of this.fans){const selected=this.diffusePhase==='selected'&&fan===this.fans[6],size=pixelScale(fan.mesh.position,.055,selected?2:1.3);fan.mesh.scale.x=fan.mesh.scale.z=size;fan.tip.scale.setScalar(pixelScale(fan.tip.position,.18,selected?4.5:3.3));}
  for(const sample of this.samplePaths){sample.head.scale.setScalar(pixelScale(sample.head.position,.14,2.6));for(const mesh of sample.segments){const width=pixelScale(mesh.position,.04,1.4);mesh.scale.x=mesh.scale.z=width;}}
 }
 get splitCandidates(){const candidates=[...this.tree.candidates].sort((a,b)=>a.cost-b.cost);return [candidates[0],candidates[Math.floor(candidates.length/3)],candidates[Math.floor(candidates.length*2/3)]];}
 setSplitCandidate(index:number){this.candidateIndex=Math.max(0,Math.min(2,index));this.revision++;this.updateBoxes();}
 get tree(){return this.accelerationData.tree;}get traversal(){return this.traceResult;}
 apply(beat:Beat){this.revision++;this.candidateIndex=0;this.beat=beat;(this.accelerationActive?this.accelerationScene:this.room.scene).add(this.root);this.elapsed=0;this.lastStep=-1;this.manualStep=null;this.selected=this.tree;this.userSelected=false;this.progress=beat.rayFrom;this.setCase('hit');this.manualStep=null;this.playbackStarted=0;this.samplePaths.forEach((sample,i)=>sample.started=i*.28);this.update(0,beat.rayFrom);}
 select(id:number){this.revision++;this.userSelected=true;const step=this.traversal.events.findIndex(e=>e.node.id===id);if(this.traversalActive&&step>=0){this.manualStep=step;this.lastStep=step;}this.selected=this.nodes.find(n=>n.id===id)??this.tree;this.updateBoxes();}
 step(delta:number){this.userSelected=false;this.manualStep=Math.max(0,Math.min(this.traversal.events.length-1,(this.manualStep??Math.max(0,this.lastStep))+delta));this.update(this.elapsed,this.progress);}
 setCase(kind:string){
  const o=this.accelerationData.rayOrigin;
  if(kind==='miss')this.setRay(o,normalize([.7,1,0]),kind);
  else if(kind==='other'){const tri=this.accelerationData.triangles[70],p=tri.reduce((a,v)=>a.map((x,k)=>x+v[k]/3) as Vec3,[0,0,0] as Vec3);this.setRay(o,normalize(sub(p,o)),kind);}
  else this.setRay(o,this.accelerationData.rayDirection,'hit');
 }
 setRay(o:Vec3,d:Vec3,label='custom'){
  this.testRayOrigin=[...o];this.testRayDirection=normalize(d);this.rayCase=label;this.traceResult=traceSAH(this.tree,this.accelerationData.triangles,this.testRayOrigin,this.testRayDirection);this.manualStep=null;this.lastStep=0;this.playbackStarted=this.elapsed;this.userSelected=false;this.selected=this.tree;this.revision++;
  stretch(this.testBeam,this.testRayOrigin,add(this.testRayOrigin,mul(this.testRayDirection,Math.min(100,this.traceResult.closest+8)||36)));
  this.queryLabel.position.set(...add(this.testRayOrigin,[0,2,0]));
  this.updateBoxes();
 }
 traversalPlayback(play:boolean){this.userSelected=false;this.playbackStarted=this.elapsed-Math.max(0,this.lastStep)*TRAVERSAL_SECONDS;this.manualStep=play?null:Math.max(0,this.lastStep);this.revision++;}
 get currentHit(){return this.traversalActive?this.event:this.traceResult;}
 get event(){return this.traversal.events[Math.max(0,this.lastStep)];}
 get displayRoot(){return this.tree;}
 get bvhStage(){return Math.max(...this.nodes.map(n=>n.depth));}
 visibleNodes(){return this.nodes;}
 private updateBoxes(){
  const c=this.beat?.visual??'',event=this.event;const active=this.traversalActive?event?.node:this.selected;
  for(const node of this.nodes){
   const box=this.boxObjects.get(node.id)!;const isActive=node===active;
   box.group.visible=this.boxes.visible;
   box.ink.color.set(isActive?0xffd68b:0x9db4bf);box.ink.transparent=true;box.ink.opacity=isActive?1:.045;box.ink.linewidth=isActive?2.6:.65;box.ink.dashed=false;
   box.outline.transparent=true;box.outline.opacity=isActive?.7:0;box.outline.linewidth=isActive?4.5:1;

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
  const indices=c==='sah'&&split?this.tree.indices.filter(i=>{const tri=this.accelerationData.triangles[i],values=tri.map(p=>p[split.axis]);return (Math.min(...values)+Math.max(...values))/2<split.plane;}):this.traversalActive&&event?.status==='leaf'?(event.testedTriangle===undefined?event.node.indices:[event.testedTriangle]):active?.indices??[];// Only the currently tested leaf triangle receives a filled overlay.
  this.highlight.visible=this.boxes.visible&&event?.status==='leaf'&&this.traversalActive&&indices.length>0;
  this.selectedEdges.visible=this.highlight.visible;
  const key=indices.join(',');if(key!==this.highlightKey){
   this.highlightKey=key;const positions=indices.flatMap(i=>this.accelerationData.triangles[i].flat());this.highlight.geometry.dispose();this.highlight.geometry=new T.BufferGeometry();this.highlight.geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));
   const edges=indices.flatMap(i=>{const t=this.accelerationData.triangles[i];return [...t[0],...t[1],...t[1],...t[2],...t[2],...t[0]];});this.selectedEdges.geometry.dispose();this.selectedEdges.geometry=new LineSegmentsGeometry().setPositions(edges);
  }
  const hit=this.currentHit,id=hit?.triangle??-1,showHit=['cost','bvh','sah','aabb','traversal'].includes(c)&&id>=0;
  this.hitMesh.visible=this.hitOutline.visible=this.hitPoint.visible=this.hitLabel.visible=showHit;this.hitCorners.forEach(corner=>corner.visible=showHit);
  if(id>=0){const tri=this.accelerationData.triangles[id];if(id!==this.hitId){
   this.hitId=id;this.hitMesh.geometry.dispose();this.hitMesh.geometry=new T.BufferGeometry().setFromPoints(tri.map(p=>new T.Vector3(...p)));
   this.hitOutline.geometry.dispose();this.hitOutline.geometry=new LineSegmentsGeometry().setPositions([...tri[0],...tri[1],...tri[1],...tri[2],...tri[2],...tri[0]]);
   this.hitCorners.forEach((corner,i)=>corner.position.set(...tri[i]));
   this.hitLabel.userData.guide.text=`closest-hit · Bunny · T${id}`;this.hitLabel.position.set(...tri[0]).add(new T.Vector3(0,1.5,0));
  }this.hitPoint.position.set(...this.testRayOrigin).addScaledVector(new T.Vector3(...this.testRayDirection),hit!.closest);}


 }
 setLessonSamples(count:number,depth:number){
  const next=Math.max(0,Math.min(this.samplePaths.length,Math.floor(count))),nextDepth=depth<=1?1:3;
  if(next!==this.sampleCount||nextDepth!==this.sampleDepth){
   this.samplePaths.forEach((sample,i)=>{if(i>=this.sampleCount&&i<next)sample.started=this.elapsed;});
   this.sampleCount=next;this.sampleDepth=nextDepth;this.revision++;this.updateSampleRays();
  }
 }
 private updateSampleRays(){
  for(const [index,sample] of this.samplePaths.entries()){
   const active=index<this.sampleCount,limit=Math.min(this.sampleDepth,sample.segments.length),time=Math.max(0,this.elapsed-sample.started),progress=Math.min(limit,time/.85);
   sample.head.parent!.visible=active;sample.pixel.visible=active;
   for(const [i,mesh] of sample.segments.entries()){stretch(mesh,sample.points[i],sample.points[i+1],Math.max(0,Math.min(1,progress-i)));mesh.visible=active&&i<limit&&progress>i;}
   const leg=Math.min(limit-1,Math.floor(progress)),fraction=Math.min(1,progress-leg);
   sample.head.visible=active;sample.head.position.lerpVectors(new T.Vector3(...sample.points[leg]),new T.Vector3(...sample.points[leg+1]),fraction);
   const material=sample.segments[leg].material as T.MeshBasicMaterial;(sample.head.material as T.MeshBasicMaterial).color.copy(material.color);
  }
 }
 update(elapsed:number,progress:number){
  this.elapsed=elapsed;this.progress=progress;const c=this.beat?.visual??'';const bvh=['cost','bvh','sah','aabb','traversal'].includes(c);
  // Selected and sampled paths keep their real world coordinates and scale.
  this.path.visible=c!=='room'&&!bvh;
  this.primaryTriangle.visible=c==='hit';
  this.packet.visible=!bvh&&!['room','samples','loop'].includes(c);
  this.segments.forEach((segment,i)=>{
   stretch(segment,route[i],route[i+1],Math.max(0,Math.min(1,progress-i)));
   const material=segment.material as T.MeshBasicMaterial;material.color.setRGB(...throughput[Math.min(i,throughput.length-1)]);material.opacity=bvh?.18:c==='samples'?.18:.72;
  });
  this.cameraRig.visible=c==='ray'||c==='samples';this.sampleRays.visible=c==='samples';this.updateSampleRays();
  this.glassRig.visible=this.beat?.motion==='glass';
  this.selection.visible=c==='materials';
  this.mirrorSelected.visible=c==='materials'&&!this.beat?.travel;
  this.reflectionProof.visible=this.mirrorSelected.visible;
  this.hemisphere.visible=c==='diffuse';
  this.normals.visible=['diffuse','materials'].includes(c)||this.beat?.motion==='glass';
  this.normalEvents.forEach((group,i)=>group.visible=c==='diffuse'?i===0:this.beat?.motion==='glass'?i>=2:i===1);
  this.materialRays.visible=c==='materials'&&!this.beat?.travel&&progress>=2;
  this.wire.visible=bvh;this.boxes.visible=['bvh','sah','aabb','traversal'].includes(c);
  this.splitLabel.visible=this.splitPlane.visible=this.sahVolumes.visible=c==='sah';
  this.slabContacts.visible=c==='aabb';
  if(c==='aabb'){
   const interval=slabIntervals(this.testRayOrigin,this.testRayDirection,this.tree.min,this.tree.max);
   this.slabNear.visible=this.slabFar.visible=interval.hit;
   if(interval.hit){this.slabNear.position.set(...add(this.testRayOrigin,mul(this.testRayDirection,interval.near)));this.slabFar.position.set(...add(this.testRayOrigin,mul(this.testRayDirection,interval.far)));}
  }
  const leg=Math.min(route.length-2,Math.max(0,Math.ceil(progress)-1)),f=Math.min(1,progress-leg);this.packet.position.lerpVectors(new T.Vector3(...route[leg]),new T.Vector3(...route[leg+1]),f);
  // Linear RGB is the actual accumulated material weight. No hue normalization:
  // the diffuse surface changes hue, and the neutral mirror only reduces energy.
  const weight=throughput[Math.min(throughput.length-1,Math.max(0,Math.floor(progress)))];
  for(const mesh of [this.packet,this.headHalo,this.tail,this.tailHalo,this.contact])(mesh.material as T.MeshBasicMaterial).color.setRGB(...weight);
  this.headHalo.visible=this.tail.visible=this.tailHalo.visible=this.packet.visible;this.headHalo.position.copy(this.packet.position);
  const legStart=new T.Vector3(...route[leg]),legEnd=new T.Vector3(...route[leg+1]),direction=legEnd.clone().sub(legStart).normalize(),tailLength=Math.min(4.5,legStart.distanceTo(this.packet.position));const tailStart=this.packet.position.clone().addScaledVector(direction,-tailLength).toArray() as Vec3;stretch(this.tail,tailStart,this.packet.position.toArray() as Vec3);stretch(this.tailHalo,tailStart,this.packet.position.toArray() as Vec3);this.tail.visible=this.tailHalo.visible=this.packet.visible&&tailLength>.02;
  const contactIndex=Math.min(5,Math.round(progress)),contactPoint=route[contactIndex],normal=contactIndex===1?diffuseNormal:contactIndex===2?metalNormal:glassNormal;this.contact.visible=this.packet.visible&&contactIndex>0&&Math.abs(progress-contactIndex)<.025;this.contact.position.set(...contactPoint).addScaledVector(new T.Vector3(...normal),.035);this.contact.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),new T.Vector3(...normal));
  this.fans.forEach((fan,i)=>{
   const fraction=this.diffusePhase==='selected'?1:emissionProgress(elapsed,i,.08,.7),selected=this.diffusePhase==='selected'&&i===6,opacity=this.diffusePhase==='selected'?(selected?1:.14):.85;
   reveal(fan,fraction);fan.mesh.visible=c==='diffuse'&&fraction>0;fan.tip.visible=c==='diffuse'&&fraction>.08;
   for(const mesh of [fan.mesh,fan.tip]){const material=mesh.material as T.MeshBasicMaterial;material.opacity=opacity;if(selected)material.color.setRGB(...throughput[1]);else material.color.set(CANDIDATE);}
  });
  this.selectedDirection.visible=c==='diffuse'&&this.diffusePhase==='selected';
  this.mirrorFans.forEach((v,i)=>{reveal(v,emissionProgress(elapsed,i,.3,1.8));v.tip!.scale.setScalar(.45);(v.tip!.material as T.MeshBasicMaterial).opacity=.3;});
  if(this.traversalActive){const duration=this.traversal.events.length*TRAVERSAL_SECONDS+TRAVERSAL_HOLD,local=((elapsed-this.playbackStarted)%duration+duration)%duration;this.lastStep=this.manualStep??Math.min(this.traversal.events.length-1,Math.floor(local/TRAVERSAL_SECONDS));}
  if(bvh)this.updateBoxes();else{this.hitMesh.visible=this.hitOutline.visible=this.hitPoint.visible=this.hitLabel.visible=false;this.hitCorners.forEach(corner=>corner.visible=false);this.highlight.visible=this.selectedEdges.visible=false;}
 }
}
