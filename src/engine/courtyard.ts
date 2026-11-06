import * as T from 'three';
import {daylightEnvironment} from './lighting';
import {RectAreaLightUniformsLib} from 'three/addons/lights/RectAreaLightUniformsLib.js';
import {sphereCenter,sphereRadius,metalHit,metalNormal,glassEntry,lightHit,outsideGlass} from '../core/route';
import {rng,type Vec3} from '../core/math';
import {createTeachingData} from '../core/teaching';

function stoneTexture(){
 const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d')!,random=rng(231);
 ctx.fillStyle='#cab79a';ctx.fillRect(0,0,256,256);
 for(let i=0;i<15000;i++){const v=100+random()*120;ctx.fillStyle=`rgba(${v},${v*.9},${v*.75},${random()*.3})`;ctx.fillRect(random()*256,random()*256,1+random()*3,1+random()*2);}
 for(let y=0;y<256;y+=64){ctx.fillStyle='#8c8171';ctx.fillRect(0,y,256,2);for(let x=(y%128?32:0);x<256;x+=64)ctx.fillRect(x,y,2,64);}
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(2,2);return t;
}
export function createCourtyard(){
 RectAreaLightUniformsLib.init();const scene=new T.Scene();scene.background=new T.Color('#698a90');scene.fog=new T.Fog('#698a90',100,220);
 const world=new T.Group();world.name='architectural-courtyard';scene.add(world);const materials:T.MeshStandardMaterial[]=[];
 const mat=(color:T.ColorRepresentation,roughness=.8,metalness=0)=>{const m=new T.MeshStandardMaterial({color,roughness,metalness,flatShading:true});materials.push(m);return m;};
 const stone=mat('#ded0b4'),darkStone=mat('#999783'),edge=mat('#f1dfba'),floor=mat('#b9b5a3'),red=mat('#db8957'),teal=mat('#387d7c'),dark=mat('#243e42'),metal=mat('#e5c694',.06,1);
 stone.map=stoneTexture();stone.bumpMap=stone.map;stone.bumpScale=.045;floor.map=stone.map;
 const glass=new T.MeshPhysicalMaterial({color:'#f4fffd',roughness:0,transmission:1,ior:1.5,thickness:2,attenuationColor:'#b5e6dc',attenuationDistance:35,side:T.FrontSide,depthWrite:false});materials.push(glass);
 const water=new T.MeshPhysicalMaterial({color:'#27545c',roughness:.08,metalness:.25,clearcoat:1,ior:1.33});materials.push(water);
 const mesh=(g:T.BufferGeometry,m:T.Material,p:Vec3)=>{const o=new T.Mesh(g,m);o.position.set(...p);o.castShadow=true;o.receiveShadow=true;world.add(o);return o;};
 const box=(size:Vec3,p:Vec3,m:T.Material)=>mesh(new T.BoxGeometry(...size),m,p);
 const cylinder=(r:number,h:number,p:Vec3,m:T.Material)=>mesh(new T.CylinderGeometry(r,r,h,12),m,p);
 box([94,.6,86],[0,-.4,-2],floor);
 // Broad steps and colonnades establish scale and provide geometric detail.
 for(let i=0;i<3;i++)box([78-i*3,.35,12-i*2],[0,.175+i*.35,-32],i===2?edge:stone);
 box([94,7,1.1],[0,3,-37],stone);
 for(const x of [-43,45]){
   box([1,8,74],[x,3.7,-1],darkStone);
   for(let z=-29;z<=31;z+=12){
     cylinder(1.15,10,[x*.91,5,z],stone);cylinder(1.6,.5,[x*.91,.25,z],edge);cylinder(1.55,.55,[x*.91,10,z],edge);
     box([3.6,.65,12],[x*.91,10.6,z+6],stone);
   }
 }
 for(let x=-32;x<=32;x+=16){
   const arch=mesh(new T.TorusGeometry(6,.8,6,18,Math.PI),stone,[x,5,-32]);arch.name='Back arcade';
   box([1.6,5,1.8],[x-6,2.5,-32],stone);box([1.6,5,1.8],[x+6,2.5,-32],stone);
 }
 // A shallow inset pool, with coping and a stepped crossing.
 box([15,.4,18],[13,.05,-20],dark);box([14,.08,17],[13,.3,-20],water);
 for(const x of [5.5,20.5])box([.7,.55,19],[x,.25,-20],edge);
 for(const z of [-29,-11])box([16,.55,.7],[13,.25,z],edge);
 for(let z=-26;z<-12;z+=3)box([2.2,.55,1.8],[13,.5,z],stone);
 const sphere=mesh(new T.SphereGeometry(sphereRadius,40,24),red,sphereCenter);sphere.name='Colored diffuse stone';
 cylinder(3.4,1,[sphereCenter[0],.5,sphereCenter[2]],darkStone);cylinder(3.7,.25,[sphereCenter[0],.12,sphereCenter[2]],edge);
 const reflector=mesh(new T.PlaneGeometry(8,8),metal,metalHit);reflector.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),new T.Vector3(...metalNormal));reflector.material.side=T.DoubleSide;
 const frame=box([8.6,8.6,.3],metalHit,dark);frame.quaternion.copy(reflector.quaternion);frame.position.addScaledVector(new T.Vector3(...metalNormal),-.2);
 box([1,2,1],[metalHit[0],1,metalHit[2]],darkStone);box([10,.5,5],[metalHit[0],.25,metalHit[2]],stone);
 const pane=box([9,11,2],[glassEntry[0],6,-2],glass);pane.name='Glass slab, IOR 1.5';pane.castShadow=false;
 for(const x of [18.2,27.8])box([.5,12,2.5],[x,6,-2],dark);box([10,.6,2.5],[23,12,-2],dark);
 box([11,.5,5],[23,.25,-2],edge);
 // The detailed arch is the actual triangle mesh used by the teaching BVH.
 const teachingData=createTeachingData();const teaching=mesh(teachingData.geometry,teal,[0,0,0]);teaching.name='BVH teaching arch';
 box([2.1,3,2.1],[-8,1.5,-15],teal);box([2.1,3,2.1],[2,1.5,-15],teal);
 const emissive=mat('#ffdfad',.4);emissive.emissive.set('#ffca87');emissive.emissiveIntensity=6;
 const lamp=mesh(new T.PlaneGeometry(6,7),emissive,lightHit);lamp.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),new T.Vector3(...outsideGlass).negate());
 const lampFrame=box([7,8,.65],lightHit,dark);lampFrame.quaternion.copy(lamp.quaternion);lampFrame.position.addScaledVector(new T.Vector3(...outsideGlass),.4);
 box([8,.8,8],[lightHit[0],.4,lightHit[2]],stone);
 const area=new T.RectAreaLight('#ffd29b',18,6,7);area.position.copy(lamp.position).addScaledVector(new T.Vector3(...outsideGlass),-.05);area.lookAt(new T.Vector3(...lightHit).sub(new T.Vector3(...outsideGlass)));scene.add(area);
 // Sparse planted islands and rocks frame the route without covering its intersections.
 const foliage=mat('#4a6459'),soil=mat('#66675a');
 for(const [x,z] of [[-31,-18],[-33,14],[33,24],[31,-30]]){
   box([7,.65,6],[x,.3,z],stone);box([6,.2,5],[x,.7,z],soil);
   for(let i=0;i<5;i++){const crown=mesh(new T.IcosahedronGeometry(1.8+(i%2)*.4,0),foliage,[x+Math.sin(i*2)*1.5,2.1+(i%2),z+Math.cos(i*2)*1.5]);crown.scale.y=1.6;}
 }
 scene.add(new T.HemisphereLight('#d9eceb','#7c816c',2.8));
 const sun=new T.DirectionalLight('#ffe9c9',2.2);sun.position.set(-25,45,30);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-52,right:52,top:48,bottom:-48,far:150});sun.shadow.normalBias=.06;scene.add(sun);
 scene.environment=daylightEnvironment();scene.environmentIntensity=.7;
 scene.updateMatrixWorld(true);
 return {scene,world,materials,teaching,reflector,reflectorFrame:frame,...teachingData,
 setBeauty(beauty:boolean){for(const m of materials){m.flatShading=!beauty;m.needsUpdate=true;}scene.fog=beauty?null:new T.Fog('#698a90',100,220);}};
}
export type Courtyard=ReturnType<typeof createCourtyard>;
