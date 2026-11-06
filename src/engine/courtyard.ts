import * as T from 'three';
import {daylightEnvironment} from './lighting.ts';
import {RectAreaLightUniformsLib} from 'three/addons/lights/RectAreaLightUniformsLib.js';
import {sphereCenter,sphereRadius,metalHit,metalNormal,glassEntry,glassExit,lightHit,outsideGlass} from '../core/route.ts';
import {type Vec3} from '../core/math.ts';
import {surfaceRotation} from '../core/surface-frame.ts';
import {createTeachingData} from '../core/teaching.ts';

// A courtyard made of three architectural thresholds. Its surfaces remain the
// same in the raster lesson and the optional, explicitly started path tracer.
export function createCourtyard(){
 RectAreaLightUniformsLib.init();
 const scene=new T.Scene(),fogColor='#657875';scene.background=new T.Color('#7e9393');scene.fog=new T.Fog(fogColor,85,245);
 const world=new T.Group();world.name='courtyard — cloister, gate, glass gallery';scene.add(world);
 const materials:T.MeshStandardMaterial[]=[];
 const mat=(color:T.ColorRepresentation,roughness=.8,metalness=0)=>{const m=new T.MeshStandardMaterial({color,roughness,metalness});materials.push(m);return m;};
 const stone=mat('#b9ae93'),cutStone=mat('#cbbfa3'),shadowStone=mat('#68716b'),floor=mat('#77796b'),dark=mat('#253a3c'),ochre=mat('#b56a45',.85),bronze=mat('#d2a866',.055,1),oxidized=mat('#527a73',.72,.12);
 const glass=new T.MeshPhysicalMaterial({color:'#f4fffd',roughness:0,transmission:1,ior:1.5,thickness:2,attenuationColor:'#b5e6dc',attenuationDistance:35,side:T.FrontSide,depthWrite:false});materials.push(glass);
 const mesh=(g:T.BufferGeometry,m:T.Material,p:Vec3,parent:T.Object3D=world)=>{const o=new T.Mesh(g,m);o.position.set(...p);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;};
 const box=(size:Vec3,p:Vec3,m:T.Material,parent:T.Object3D=world)=>mesh(new T.BoxGeometry(...size),m,p,parent);
 const cylinder=(r:number,h:number,p:Vec3,m:T.Material,parent:T.Object3D=world)=>mesh(new T.CylinderGeometry(r,r,h,12),m,p,parent);
 // Broad ground slabs surround one genuinely recessed dry channel. No pool,
 // planters or patterned tile field competes with the material route.
 box([57,1,135],[-37.5,-.5,-2.5],floor);box([97,1,135],[51.5,-.5,-2.5],floor);
 box([12,1,50],[-3,-.5,-45],floor);box([12,1,49],[-3,-.5,40.5],floor);
 box([12,.5,36],[-3,-3.25,-2],dark);box([.55,3,36],[-9.25,-1.5,-2],shadowStone);box([.55,3,36],[3.25,-1.5,-2],shadowStone);
 box([12,3,.55],[-3,-1.5,-20.25],shadowStone);box([12,3,.55],[-3,-1.5,16.25],shadowStone);
 // A handful of long construction joints give human scale without noise.
 for(const z of [-10,30,50]){box([56,.012,.12],[-37.5,.008,z],shadowStone);box([95,.012,.12],[51.5,.008,z],shadowStone);}
 for(const x of [-48,24,66])box([.12,.012,132],[x,.008,-2.5],shadowStone);
 // The entrance cloister is roofed, with a dark near ceiling and a few strong
 // piers. Its open eastern edge reveals the sky and the sunlit middle court.
 box([2,18,124],[-64,9,1],shadowStone);box([29,1.5,124],[-50,15.5,1],stone);
 box([27,.35,122],[-50,14.55,1],dark);
 for(const z of [-45,-19,17,39,59]){
  box([2.6,15,2.6],[-36,7.5,z],stone);box([3.5,.6,3.5],[-36,.3,z],cutStone);
  box([3.4,1,3.4],[-36,14.4,z],cutStone);box([26,.8,1.1],[-50,14.7,z],cutStone);
 }
 // This entrance jamb moves quickly across the foreground at the portal cut.
 box([3.2,15,3.2],[-47,7.5,54],shadowStone);box([28,1.5,3.2],[-50,15.2,54],cutStone);
 // Ochre sphere as the finial of a stair landing/balustrade, not an exhibit on
 // a separate display plinth. The analytic sphere is still the first hit.
 box([19,.6,11],[-34,.3,-7],shadowStone);box([17,.4,9],[-33,.8,-7],stone);
 box([8,1.4,1.2],[-39,1.7,-6.5],stone);box([1.2,1.4,8],[-40.5,1.7,-10],stone);
 box([8.6,.3,1.6],[-39,2.55,-6.5],cutStone);box([1.6,.3,8.5],[-40.5,2.55,-10],cutStone);
 const sphere=mesh(new T.SphereGeometry(sphereRadius,40,24),ochre,sphereCenter);sphere.name='Analytic diffuse finial';
 // Polished bronze gate leaf, mounted inside heavy masonry piers. Its normal
 // is derived from the incident and reflected selected directions.
 const gate=new T.Group();gate.position.set(...metalHit);gate.quaternion.copy(surfaceRotation(metalNormal));world.add(gate);
 const reflector=mesh(new T.PlaneGeometry(10,13),bronze,[0,0,0],gate);reflector.name='Polished bronze gate leaf';reflector.material.side=T.DoubleSide;
 const frame=box([10.3,13.3,.3],[0,0,-.22],bronze,gate);frame.name='Bronze leaf thickness';
 for(const x of [-7.2,7.2]){box([3.6,19,4],[x,3.2,-.4],stone,gate);box([4.1,.7,4.5],[x,-5.5,-.4],cutStone,gate);box([4.2,.7,4.7],[x,12.5,-.4],cutStone,gate);}
 box([19,1.5,4],[0,12.7,-.4],cutStone,gate);
 for(const y of [-4,0,4])cylinder(.16,1.1,[-5.22,y,.05],dark,gate);
 // A short vestibule wall has true parallel entry/exit faces and visible
 // jambs/sill. The recess behind it follows the transmitted direction.
 const pane=box([10,12,2],[glassEntry[0],6,glassEntry[2]-1],glass);pane.name='Glass gallery wall, IOR 1.5';pane.castShadow=false;
 for(const x of [glassEntry[0]-5.7,glassEntry[0]+5.7])box([1.2,14,3],[x,7,glassEntry[2]-1],shadowStone);
 box([12.6,1,3],[glassEntry[0],13.5,glassEntry[2]-1],cutStone);box([12.6,.35,3.5],[glassEntry[0],.175,glassEntry[2]-1],cutStone);
 const recess=new T.Group(),d=new T.Vector3(...outsideGlass),mid=new T.Vector3(...glassExit).lerp(new T.Vector3(...lightHit),.6125);
 recess.position.copy(mid);recess.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),d);world.add(recess);
 for(const x of [-8,8])box([2,17,39],[x,2.5,0],shadowStone,recess);
 box([18,1.3,39],[0,11,0],shadowStone,recess);box([18,.7,39],[0,-5.65,0],cutStone,recess);
 // Repeated ceiling ribs are depth cues inside one gallery, not ornaments
 // scattered across the open court. They cast a restrained sequence of shade.
 for(const z of [-13,-3,7,17])box([14,.45,.75],[0,10.15,z],dark,recess);
 const emissive=mat('#ffe0ad',.6);emissive.emissive.set('#ffc57e');emissive.emissiveIntensity=5.5;
 const lamp=mesh(new T.PlaneGeometry(12,11),emissive,lightHit);lamp.name='Recessed emissive wall';lamp.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),d.clone().negate());
 const lampWall=box([16,16,1],lightHit,dark);lampWall.quaternion.copy(lamp.quaternion);lampWall.position.addScaledVector(d,.55);
 const area=new T.RectAreaLight('#ffd29b',15,12,11);area.position.copy(lamp.position).addScaledVector(d,-.05);area.lookAt(new T.Vector3(...lightHit).sub(d));scene.add(area);
 // The one structural arch is the EXACT 96-triangle mesh used by the CPU BVH.
 const teachingData=createTeachingData(),teaching=mesh(teachingData.geometry,oxidized,[0,0,0]);teaching.name='Structural cloister arch — 96 teaching triangles';
 box([2.1,3,3],[-17,1.5,-38],oxidized);box([2.1,3,3],[-7,1.5,-38],oxidized);
 box([48,16,3],[-42,8,-38],stone);box([26,16,3],[7,8,-38],stone);box([12,7,3],[-12,12.5,-38],stone);
 // A deep space behind the arch makes its opening legible in silhouette.
 box([25,14,1],[-12,7,-61],dark);box([1,14,24],[-24,7,-50],shadowStone);
 scene.add(new T.HemisphereLight('#b4d2d4','#514937',.85));
 const sun=new T.DirectionalLight('#ffe3b3',3.5);sun.position.set(-65,48,55);sun.target.position.set(0,0,-5);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-110,right:110,top:95,bottom:-95,far:260});sun.shadow.normalBias=.08;sun.shadow.bias=-.0001;scene.add(sun,sun.target);
 scene.environment=daylightEnvironment();scene.environmentIntensity=.4;
 scene.updateMatrixWorld(true);
 return {scene,world,materials,teaching,reflector,reflectorFrame:frame,sphere,pane,lamp,...teachingData,
 setBeauty(_beauty:boolean){scene.fog=new T.Fog(fogColor,85,245);}};
}
export type Courtyard=ReturnType<typeof createCourtyard>;
