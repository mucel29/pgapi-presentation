import * as T from 'three';
import {surfaceRotation} from '../core/surface-frame.ts';
import {illustratedSamples} from '../core/sampling';
import {Reflector} from 'three/addons/objects/Reflector.js';
import {cosineHemisphere,intersectSphere,normalize,sub,add,mul,reflect,rng,type Vec3} from '../core/math';
import {route,throughput,diffuseNormal,metalNormal,glassNormal,origin,sphereCenter,sphereRadius} from '../core/route';
import {traceSAH,type Node} from '../core/bvh';
import type {Beat} from '../content/chapters';
import type {Courtyard} from './courtyard';
const GOLD=0xffc576,CYAN=0x74e9ec;
function beam(color:number,r=.045,opacity=1){const o=new T.Mesh(new T.CylinderGeometry(r,r,1,6),new T.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false,toneMapped:false}));o.renderOrder=12;return o;}
function stretch(o:T.Mesh,a:Vec3,b:Vec3,f=1){const av=new T.Vector3(...a),bv=new T.Vector3(...b).sub(av).multiplyScalar(f),l=bv.length();o.visible=l>.001;o.scale.y=l;o.position.copy(av).addScaledVector(bv,.5);if(l>.001)o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),bv.normalize());}
function marker(color:number,r=.14){return new T.Mesh(new T.IcosahedronGeometry(r,1),new T.MeshBasicMaterial({color,toneMapped:false,transparent:true,depthWrite:false}));}
function arrowTip(color:number){const tip=new T.Mesh(new T.ConeGeometry(.18,.6,6),new T.MeshBasicMaterial({color,toneMapped:false,transparent:true,depthWrite:false}));tip.renderOrder=13;return tip;}
function reveal(v:{mesh:T.Mesh;a:Vec3;b:Vec3;tip?:T.Mesh},fraction:number){const f=Math.max(0,Math.min(1,fraction));stretch(v.mesh,v.a,v.b,f);if(v.tip){v.tip.visible=f>.08;v.tip.position.lerpVectors(new T.Vector3(...v.a),new T.Vector3(...v.b),f);v.tip.quaternion.copy(v.mesh.quaternion);}}
export class JourneyVisuals{
 root=new T.Group();rasterOnly=new T.Group();path=new T.Group();hemisphere=new T.Group();samples=new T.Group();normals=new T.Group();boxes=new T.Group();wire=new T.Group();pixel=new T.Group();materialRays=new T.Group();shadow=new T.Group();
 packet=marker(0xfff3cd,.2);private headHalo=marker(GOLD,.42);private tail=beam(0xffedbb,.13);private tailHalo=beam(GOLD,.26,.16);private contact=new T.Mesh(new T.TorusGeometry(.58,.045,6,32),new T.MeshBasicMaterial({color:GOLD,transparent:true,opacity:.7,depthWrite:false,toneMapped:false}));segments:T.Mesh[]=[];boxObjects=new Map<number,T.Box3Helper>();nodes:Node[]=[];selected:Node;lastStep=-1;manualStep:number|null=null;beat:Beat|null=null;progress=0;revision=0;
 testRayOrigin:Vec3=[0,0,0];testRayDirection:Vec3=[0,0,-1];rayCase='hit';private traceResult:ReturnType<typeof traceSAH>;private testBeam:T.Mesh;private hitMesh:T.Mesh;private hitOutline:T.LineLoop;private hitPoint=marker(0xff70b8,.13);private hitId=-2;private highlightKey='';
 private fans:{mesh:T.Mesh;a:Vec3;b:Vec3;tip:T.Mesh}[]=[];private sampleLines:{mesh:T.Mesh;a:Vec3;b:Vec3;delay:number;tip?:T.Mesh}[]=[];private highlight:T.Mesh;private elapsed=0;private userSelected=false;private splitPlane:T.Mesh;candidateIndex=0;
 constructor(public room:Courtyard){
  this.testRayOrigin=[...room.rayOrigin];this.testRayDirection=[...room.rayDirection];this.traceResult=room.traversal;this.root.name='Illustrations — excluded from path tracing';room.scene.add(this.root);const mirror=new Reflector(new T.PlaneGeometry(10,13),{textureWidth:256,textureHeight:256,color:0xb4a68c,clipBias:.003,multisample:0});mirror.position.set(...route[2]).addScaledVector(new T.Vector3(...metalNormal),.025);mirror.quaternion.copy(surfaceRotation(metalNormal));const renderMirror=mirror.onBeforeRender.bind(mirror);mirror.onBeforeRender=(renderer,scene,camera,geometry,material,group)=>{const rv=room.reflector.visible,fv=room.reflectorFrame.visible,iv=this.root.visible;room.reflector.visible=false;room.reflectorFrame.visible=false;this.root.visible=false;try{renderMirror(renderer,scene,camera,geometry,material,group);}finally{room.reflector.visible=rv;room.reflectorFrame.visible=fv;this.root.visible=iv;}};mirror.name='Raster planar reflection — excluded from tracer';this.rasterOnly.name='Raster reflections';room.scene.add(this.rasterOnly);this.rasterOnly.add(mirror);
  (this.headHalo.material as T.MeshBasicMaterial).opacity=.15;this.headHalo.renderOrder=13;this.packet.renderOrder=15;this.contact.renderOrder=14;
  this.root.add(this.headHalo,this.tail,this.tailHalo,this.contact);
  this.root.add(this.path,this.hemisphere,this.samples,this.normals,this.boxes,this.wire,this.pixel,this.materialRays,this.shadow,this.packet);
  route.slice(0,-1).forEach((_,i)=>{const beta=throughput[i],c=new T.Color(...beta).multiplyScalar(1/Math.max(...beta));const segment=beam(c.getHex(),.07,.4);this.path.add(segment);this.segments.push(segment);});
  for(const [p,n] of [[route[1],diffuseNormal],[route[2],metalNormal],[route[3],glassNormal],[route[4],mul(glassNormal,-1)]] as [Vec3,Vec3][]){const b=beam(CYAN,.045);stretch(b,p,add(p,mul(n,3.8)));this.normals.add(b);const tip=marker(CYAN,.12);tip.position.set(...add(p,mul(n,3.8)));this.normals.add(tip);}
  const random=rng(529);for(let i=0;i<20;i++){
   const d=cosineHemisphere(random(),random(),diffuseNormal),length=9+random()*6,b=beam(i%3===0?0xffe3a3:0xffaa68,.085,.85),end=add(route[1],mul(d,length));
   const tip=arrowTip(i%3===0?0xffe3a3:0xffaa68);this.fans.push({mesh:b,a:route[1],b:end,tip});this.hemisphere.add(b,tip);
  }
  const dome=new T.Mesh(new T.SphereGeometry(7,16,8,0,Math.PI*2,0,Math.PI/2),new T.MeshBasicMaterial({color:CYAN,wireframe:true,transparent:true,opacity:.07,depthWrite:false}));dome.position.set(...route[1]);dome.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),new T.Vector3(...diffuseNormal));this.hemisphere.add(dome);
  const direct=normalize(sub(route[1],origin)),right=new T.Vector3().crossVectors(new T.Vector3(...direct),new T.Vector3(0,1,0)).normalize(),up=new T.Vector3().crossVectors(right,new T.Vector3(...direct)).normalize();
  const pixelCenter=new T.Vector3(...origin).addScaledVector(new T.Vector3(...direct),6);
  const outline=new T.LineLoop(new T.BufferGeometry().setFromPoints([[-.4,-.4],[.4,-.4],[.4,.4],[-.4,.4]].map(([x,y])=>pixelCenter.clone().addScaledVector(right,x).addScaledVector(up,y))),new T.LineBasicMaterial({color:CYAN}));this.pixel.add(outline);
  const corners=[[-.4,-.4],[.4,-.4],[.4,.4],[-.4,.4]].map(([x,y])=>pixelCenter.clone().addScaledVector(right,x).addScaledVector(up,y));
  const frustum=new T.LineSegments(new T.BufferGeometry().setFromPoints(corners.flatMap(p=>[new T.Vector3(...origin),p])),new T.LineBasicMaterial({color:CYAN,transparent:true,opacity:.6}));this.pixel.add(frustum);
  const cameraBody=new T.Mesh(new T.BoxGeometry(.9,.65,.6),new T.MeshBasicMaterial({color:0x60b6bd,wireframe:true}));cameraBody.position.set(...origin);cameraBody.lookAt(pixelCenter);this.pixel.add(cameraBody);
  const camera=marker(CYAN,.35);camera.position.set(...origin);this.pixel.add(camera);
  for(const [i,sample] of illustratedSamples().entries()){
   const line=beam(i%2?0xffdb8a:0xfff3c6,.075,.78);this.sampleLines.push({mesh:line,a:sample.origin,b:sample.end,delay:i*.1});this.samples.add(line);
   if(sample.hit&&sample.outgoing){const outgoing=beam(i%2?0xffa66c:0xffd09c,.09,.9),end=add(sample.hit,mul(sample.outgoing,16));const tip=arrowTip(0xffbf83);this.sampleLines.push({mesh:outgoing,a:sample.hit,b:end,delay:1.1+i*.1,tip});this.samples.add(outgoing,tip);
    const dot=marker(0xffe1a3,.17);dot.position.set(...sample.hit);this.samples.add(dot);
   }
  }
  const metalIn=normalize(sub(route[2],route[1])),n=new T.Vector3(...metalNormal),tangent=new T.Vector3().crossVectors(n,new T.Vector3(0,1,0)).normalize(),bitangent=new T.Vector3().crossVectors(n,tangent),rr=rng(817);for(let i=0;i<10;i++){const u=rr(),phi=rr()*Math.PI*2,alpha=.2*.2,cos=Math.sqrt((1-u)/(1+(alpha*alpha-1)*u)),sin=Math.sqrt(1-cos*cos),half=n.clone().multiplyScalar(cos).addScaledVector(tangent,sin*Math.cos(phi)).addScaledVector(bitangent,sin*Math.sin(phi));const out=reflect(metalIn,half.toArray() as Vec3),fan=beam(0xffd18f,.025,.18);stretch(fan,route[2],add(route[2],mul(out,8)));this.materialRays.add(fan);}
  const reflection=reflect(normalize(sub(route[3],route[2])),glassNormal),ref=beam(0xec8c7a,.04,.55);stretch(ref,route[3],add(route[3],mul(reflection,7)));this.materialRays.add(ref);
  const shadow=beam(0xe5efb4,.03,.7);stretch(shadow,route[1],route[5]);this.shadow.add(shadow);
  const collect=(n:Node)=>{this.nodes.push(n);const box=new T.Box3Helper(new T.Box3(new T.Vector3(...n.min),new T.Vector3(...n.max)),CYAN);box.material=new T.LineBasicMaterial({color:CYAN,transparent:true,opacity:.6,depthTest:true});this.boxObjects.set(n.id,box);this.boxes.add(box);n.children?.forEach(collect);};collect(room.tree);this.selected=room.tree;
  const edges=new T.LineSegments(new T.WireframeGeometry(room.teaching.geometry),new T.LineBasicMaterial({color:0xb9dfd3,transparent:true,opacity:.65}));edges.matrixAutoUpdate=false;edges.matrix.copy(room.teaching.matrixWorld);this.wire.add(edges);
  this.highlight=new T.Mesh(new T.BufferGeometry(),new T.MeshBasicMaterial({color:0xffbc69,side:T.DoubleSide,transparent:true,opacity:.16,depthWrite:false}));this.root.add(this.highlight);this.splitPlane=new T.Mesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({color:0xffbf78,side:T.DoubleSide,transparent:true,opacity:.2,depthWrite:false}));this.root.add(this.splitPlane);const split=room.tree.split!;const size=new T.Vector3(...room.tree.max).sub(new T.Vector3(...room.tree.min));this.splitPlane.position.set(...room.tree.min).addScaledVector(size,.5);this.splitPlane.position.setComponent(split.axis,split.plane);this.splitPlane.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),new T.Vector3().setComponent(split.axis,1));this.splitPlane.scale.set(split.axis===0?size.z:size.x,split.axis===1?size.z:size.y,1);
  this.hitMesh=new T.Mesh(new T.BufferGeometry(),new T.MeshBasicMaterial({color:0xff70b8,side:T.DoubleSide,transparent:true,opacity:.95,depthTest:false,depthWrite:false,toneMapped:false}));this.hitMesh.renderOrder=30;this.hitOutline=new T.LineLoop(new T.BufferGeometry(),new T.LineBasicMaterial({color:0xffedf6,depthTest:false,toneMapped:false}));this.hitOutline.renderOrder=31;this.root.add(this.hitMesh,this.hitOutline,this.hitPoint);
  const test=beam(0xffdf98,.05);this.testBeam=test;stretch(test,room.rayOrigin,add(room.rayOrigin,mul(room.rayDirection,36)));this.wire.add(test);
 }
 fitHead(camera:T.PerspectiveCamera,height:number){const distance=camera.position.distanceTo(this.packet.position),worldPerPixel=2*Math.tan(T.MathUtils.degToRad(camera.fov)/2)*distance/Math.max(1,height),scale=Math.max(.6,worldPerPixel*2.6/.2);this.packet.scale.setScalar(scale);this.headHalo.scale.setScalar(scale);}
 get splitCandidates(){const candidates=[...this.tree.candidates].sort((a,b)=>a.cost-b.cost);return [candidates[0],candidates[Math.floor(candidates.length/3)],candidates[Math.floor(candidates.length*2/3)]];}
 setSplitCandidate(index:number){this.candidateIndex=Math.max(0,Math.min(2,index));this.revision++;this.updateBoxes();}
 get tree(){return this.room.tree;}get traversal(){return this.traceResult;}
 apply(beat:Beat){this.revision++;this.candidateIndex=0;this.beat=beat;this.elapsed=0;this.lastStep=-1;this.manualStep=null;this.selected=this.tree;this.userSelected=false;this.progress=beat.rayFrom;this.setCase('hit');this.update(0,beat.rayFrom);}
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
 visibleNodes(){const root=this.displayRoot;return this.nodes.filter(n=>n.depth>=root.depth&&n.depth<=root.depth+2&&n.indices.every(i=>root.indices.includes(i)));}
 private updateBoxes(){
  const c=this.beat?.visual??'',event=this.event;const active=c==='traversal'?event?.node:this.selected;
  for(const node of this.nodes){const o=this.boxObjects.get(node.id)!;const ancestor=active?.indices.every(i=>node.indices.includes(i));const child=active?.children?.includes(node);o.visible=this.boxes.visible&&(c==='sah'?node===this.tree:c==='bvh'&&!this.userSelected?node.depth<=Math.min(2,Math.floor(this.elapsed/1.2)):Boolean(node===active||ancestor||child));const m=o.material as T.LineBasicMaterial;m.color.set(node===active?(event?.status==='miss'||event?.status==='pruned'?0xe78172:0xffc576):child?0x80d7da:0x5a8990);m.opacity=node===active?1:child?.8:.25;}
  const split=this.splitCandidates[this.candidateIndex];if(c==='sah'&&split){const size=new T.Vector3(...this.tree.max).sub(new T.Vector3(...this.tree.min));this.splitPlane.position.set(...this.tree.min).addScaledVector(size,.5);this.splitPlane.position.setComponent(split.axis,split.plane);this.splitPlane.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),new T.Vector3().setComponent(split.axis,1));this.splitPlane.scale.set(split.axis===0?size.z:size.x,split.axis===1?size.z:size.y,1);}
  const indices=c==='sah'&&split?this.tree.indices.filter(i=>{const tri=this.room.triangles[i],values=tri.map(p=>p[split.axis]);return (Math.min(...values)+Math.max(...values))/2<split.plane;}):c==='traversal'&&event?.status==='leaf'?event.node.indices:active?.indices??[];this.highlight.visible=this.boxes.visible&&indices.length>0;
  const key=indices.join(',');if(key!==this.highlightKey){this.highlightKey=key;const positions=indices.flatMap(i=>this.room.triangles[i].flat());this.highlight.geometry.dispose();this.highlight.geometry=new T.BufferGeometry();this.highlight.geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));}
  const hit=this.currentHit,id=hit?.triangle??-1;this.hitMesh.visible=this.hitOutline.visible=this.hitPoint.visible=['cost','bvh','sah','aabb','traversal'].includes(c)&&id>=0;
  if(id>=0){const tri=this.room.triangles[id];if(id!==this.hitId){this.hitId=id;this.hitMesh.geometry.dispose();this.hitMesh.geometry=new T.BufferGeometry().setFromPoints(tri.map(p=>new T.Vector3(...p)));this.hitOutline.geometry.dispose();this.hitOutline.geometry=this.hitMesh.geometry.clone();}this.hitPoint.position.set(...this.testRayOrigin).addScaledVector(new T.Vector3(...this.testRayDirection),hit!.closest);}

 }
 update(elapsed:number,progress:number){
  this.elapsed=elapsed;this.progress=progress;const c=this.beat?.visual??'';const bvh=['cost','bvh','sah','aabb','traversal'].includes(c);
  this.splitPlane.visible=c==='sah';this.path.visible=!bvh;this.packet.visible=!bvh&&c!=='room';this.hemisphere.visible=c==='diffuse';this.samples.visible=c==='samples';this.pixel.visible=['ray','samples'].includes(c);this.normals.visible=['diffuse','materials'].includes(c);this.materialRays.visible=c==='materials'&&progress>=2;this.shadow.visible=c==='loop';this.wire.visible=bvh;this.boxes.visible=['bvh','sah','aabb','traversal'].includes(c);
  this.segments.forEach((m,i)=>stretch(m,route[i],route[i+1],Math.max(0,Math.min(1,progress-i))));
  const leg=Math.min(route.length-2,Math.floor(progress)),f=Math.min(1,progress-leg);this.packet.position.lerpVectors(new T.Vector3(...route[leg]),new T.Vector3(...route[leg+1]),f);
  const beta=throughput[Math.min(throughput.length-1,leg)];(this.packet.material as T.MeshBasicMaterial).color.setRGB(...beta).multiplyScalar(1/Math.max(...beta)).lerp(new T.Color(0xfff3cd),.7);
  this.headHalo.visible=this.tail.visible=this.tailHalo.visible=this.packet.visible;this.headHalo.position.copy(this.packet.position);
  const legStart=new T.Vector3(...route[leg]),legEnd=new T.Vector3(...route[leg+1]),direction=legEnd.clone().sub(legStart).normalize(),tailLength=Math.min(4.5,legStart.distanceTo(this.packet.position));const tailStart=this.packet.position.clone().addScaledVector(direction,-tailLength).toArray() as Vec3;stretch(this.tail,tailStart,this.packet.position.toArray() as Vec3);stretch(this.tailHalo,tailStart,this.packet.position.toArray() as Vec3);this.tail.visible=this.tailHalo.visible=this.packet.visible&&tailLength>.02;
  const contactIndex=Math.min(5,Math.round(progress)),contactPoint=route[contactIndex],normal=contactIndex===1?diffuseNormal:contactIndex===2?metalNormal:glassNormal;this.contact.visible=this.packet.visible&&contactIndex>0&&Math.abs(progress-contactIndex)<.025;this.contact.position.set(...contactPoint).addScaledVector(new T.Vector3(...normal),.035);this.contact.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),new T.Vector3(...normal));
  this.fans.forEach((v,i)=>reveal(v,(elapsed-i*.045)/.65));
  this.sampleLines.forEach(v=>reveal(v,(elapsed-v.delay)/1.2));
  if(c==='traversal'){this.lastStep=this.manualStep??Math.min(this.traversal.events.length-1,Math.floor(elapsed/.85));if(this.lastStep===this.traversal.events.length-1)this.manualStep=this.lastStep;}
  if(bvh)this.updateBoxes();else this.hitMesh.visible=this.hitOutline.visible=this.hitPoint.visible=false;
 }
}
