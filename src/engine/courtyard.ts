import * as T from 'three';
import {materialPalette,polishedRoughness} from '../core/transport.ts';
import {daylightEnvironment} from './lighting.ts';
import {RectAreaLightUniformsLib} from 'three/addons/lights/RectAreaLightUniformsLib.js';
import {sphereCenter,metalHit,metalNormal,glassEntry,glassExit,lightHit,outsideGlass} from '../core/route.ts';
import {observatory} from '../core/world.ts';
import {type Vec3} from '../core/math.ts';
import {surfaceRotation} from '../core/surface-frame.ts';
import {sphereGeometry} from '../core/sphere-mesh.ts';
import {createAccelerationData,probePosition,probeScale} from '../core/acceleration-model.ts';

// Kept as the public factory name so the existing explorer uses the same world.
export function createCourtyard(){
 RectAreaLightUniformsLib.init();
 const scene=new T.Scene(),sky='#667c95';scene.background=new T.Color(sky);scene.fog=new T.Fog(sky,155,380);
 const world=new T.Group();world.name='Canyon observatory — landing, heliostat, optical window, beacon';scene.add(world);
 const materials:T.MeshStandardMaterial[]=[];
 const mat=(color:T.ColorRepresentation,roughness=.8,metalness=0)=>{const m=new T.MeshStandardMaterial({color,roughness,metalness,flatShading:true});materials.push(m);return m;};
 const sandstone=mat('#b37555'),goldStone=mat('#c99562'),deepStone=mat('#584e68'),shadowStone=mat('#67565a'),floor=mat('#ad9876'),dark=mat('#223642'),pale=mat('#ddd4ad'),orange=mat('#db7546'),steel=mat('#55787b',.5,.4),ochre=mat(materialPalette.diffuse,.82),bronze=mat(materialPalette.metal,polishedRoughness,1);
 const mesh=(g:T.BufferGeometry,m:T.Material,p:Vec3,parent:T.Object3D=world)=>{const o=new T.Mesh(g,m);o.position.set(...p);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;};
 const box=(size:Vec3,p:Vec3,m:T.Material,parent:T.Object3D=world)=>mesh(new T.BoxGeometry(...size),m,p,parent);
 const cylinder=(r:number,h:number,p:Vec3,m:T.Material,parent:T.Object3D=world,segments=8)=>mesh(new T.CylinderGeometry(r,r,h,segments),m,p,parent);
 const strut=(a:Vec3,b:Vec3,r:number,m:T.Material,parent:T.Object3D=world)=>{const av=new T.Vector3(...a),bv=new T.Vector3(...b),o=mesh(new T.CylinderGeometry(r,r,av.distanceTo(bv),5),m,av.clone().add(bv).multiplyScalar(.5).toArray(),parent);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),bv.sub(av).normalize());return o;};
 // Simple faceted masses with stepped, offset bands establish depth. The canyon
 // stays open along all optical flight corridors; the low floor is far below.
 box([420,3,380],[20,-75,-20],deepStone);
 const mesa=(x:number,z:number,r:number,top:number,bottom:number,m:T.Material,phase=0)=>{
  const g=new T.CylinderGeometry(r,r*1.12,top-bottom,7,1);g.rotateY(phase);const o=mesh(g,m,[x,(top+bottom)/2,z]);o.name='Faceted canyon cliff';
  const rim=new T.CylinderGeometry(r*1.015,r*1.025,2.2,7);rim.rotateY(phase);mesh(rim,goldStone,[x,top-.7,z]);
  const band=new T.CylinderGeometry(r*1.055,r*1.07,4,7);band.rotateY(phase);mesh(band,shadowStone,[x,bottom+(top-bottom)*.38,z]);
 };
 mesa(-71,19,47,10.5,-70,sandstone,.25);mesa(-51,-48,29,12,-70,sandstone,.32);
 mesa(14,33,12,17,-70,deepStone,.2);mesa(64,-30,29,25,-70,sandstone,.5);mesa(115,-94,30,37,-70,shadowStone,.3);
 // Monumental far silhouettes frame the optical route without becoming props.
 for(const [x,z,r,top,phase] of [[-119,-52,28,64,.1],[-101,-114,34,90,.4],[-44,-143,33,73,.1],[16,-155,38,96,.25],[78,-160,24,79,.5],[151,-146,36,108,.1],[176,-80,24,82,.3],[150,21,28,64,.4]] as number[][])mesa(x,z,r,top,-72,deepStone,phase);
 // Near observation deck: painted apparatus is a part of the landing, with
 // real supports, a calibration ring and a small shelter for human scale.
 box([31,1,37],[-63,11,40],floor);box([31,.4,1],[-63,11.7,58],pale);box([1,.4,36],[-78,11.7,40],pale);
 for(const z of [25,36,47,58]){box([.35,3,.35],[-78,13,z],steel);box([.35,3,.35],[-48,13,z],steel);}box([.24,.24,34],[-78,14.4,41],steel);box([.24,.24,34],[-48,14.4,41],steel);
 box([6,.5,10],[-75,23,42],dark);for(const x of [-77,-73])box([.3,11,.3],[x,17.2,42],steel);
 box([10,1,10],[-35,11.7,-8],floor);cylinder(1.7,1.2,[-35,12.7,-8],steel);
 const sphere=mesh(sphereGeometry(),ochre,sphereCenter);sphere.name='Cyan receiver — triangle mesh';
 const ring=mesh(new T.TorusGeometry(4.5,.14,4,32),pale,[-35,12.6,-8]);ring.rotation.x=Math.PI/2;
 for(const x of [-40,-30])box([.4,4,.4],[x,13.5,-8],steel);
 // The heliostat is visibly an optical instrument: a thin framed surface,
 // back braces and pedestal, with open air around the reflected path.
 const gate=new T.Group();gate.position.set(...metalHit);gate.quaternion.copy(surfaceRotation(metalNormal));world.add(gate);
 const reflector=mesh(new T.PlaneGeometry(9,10),bronze,[0,0,0],gate);reflector.name='Framed polished heliostat';reflector.material.side=T.DoubleSide;
 const frame=box([9.5,10.5,.18],[0,0,-.18],dark,gate);frame.name='Heliostat back skin';
 for(const x of [-4.65,4.65])box([.3,10.6,.55],[x,0,.04],pale,gate);for(const y of [-5.15,5.15])box([9.5,.3,.55],[0,y,.04],pale,gate);
 strut([-4,-5,-.55],[4,5,-.55],.12,steel,gate);strut([-4,5,-.55],[4,-5,-.55],.12,steel,gate);
 cylinder(.45,5,[metalHit[0],19.3,metalHit[2]],steel);box([7,.55,7],[metalHit[0],17.4,metalHit[2]],floor);cylinder(1.5,.5,[metalHit[0],17.9,metalHit[2]],dark);
 // A thick, free-standing optical window makes entry and exit faces legible.
 const glass=new T.MeshPhysicalMaterial({color:'#d8f4e6',roughness:0,transmission:.95,transparent:true,opacity:.27,ior:1.5,thickness:observatory.glassThickness,attenuationColor:'#ffffff',attenuationDistance:Infinity,side:T.FrontSide,depthWrite:false,flatShading:true});materials.push(glass);
 const pane=box([11,12,observatory.glassThickness],[glassEntry[0],glassEntry[1],glassEntry[2]-observatory.glassThickness/2],glass);pane.name='Thick optical window — parallel interfaces, IOR 1.5';pane.castShadow=false;
 for(const x of [glassEntry[0]-5.9,glassEntry[0]+5.9])box([.25,12.6,3.25],[x,glassEntry[1],glassEntry[2]-1.5],steel);for(const y of [glassEntry[1]-6.3,glassEntry[1]+6.3])box([12,.25,3.25],[glassEntry[0],y,glassEntry[2]-1.5],pale);
 box([18,.8,15],[62,28.8,-28],floor);for(const x of [57,67])box([.6,4,.6],[x,27,-28],steel);
 // Far beacon: its luminous aperture faces the transmitted selected ray.
 const d=new T.Vector3(...outsideGlass),beacon=new T.Group();beacon.position.set(...lightHit);beacon.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),d.clone().negate());world.add(beacon);
 const emissive=mat('#ffdb9f',.5);emissive.emissive.set('#ffbf71');emissive.emissiveIntensity=6;
 const lamp=mesh(new T.PlaneGeometry(10,9),emissive,[0,0,.05],beacon);lamp.name='Beacon emission aperture';
 box([14,13,1],[0,0,-.6],dark,beacon);for(const x of [-6,6])box([1,13,3],[x,0,-.4],orange,beacon);for(const y of [-5.5,5.5])box([14,1,3],[0,y,-.4],orange,beacon);
 const beaconBase:[number,number,number]=[lightHit[0],37.5,lightHit[2]];box([18,1,18],beaconBase,floor);for(const x of [-4,4])strut([beaconBase[0]+x,38,beaconBase[2]],[lightHit[0]+x,lightHit[1]-5,lightHit[2]],.32,steel);
 cylinder(.23,18,[lightHit[0],lightHit[1]+12,lightHit[2]],pale);box([3,.5,3],[lightHit[0],lightHit[1]+21,lightHit[2]],emissive);
 const area=new T.RectAreaLight('#ffd59a',12,10,9);area.position.copy(lamp.getWorldPosition(new T.Vector3())).addScaledVector(d,-.1);area.lookAt(new T.Vector3(...glassExit));scene.add(area);
 // The access/service line stays well below the selected optical corridors.
 for(const [a,b] of [ [[-48,11.4,25],[7,16.8,34]], [[17,17.2,27],[55,28.4,-20]] ] as [Vec3,Vec3][]){
  strut(a,b,.16,steel);strut([a[0],a[1]-.6,a[2]],[b[0],b[1]-.6,b[2]],.09,dark);
 }
 const probeData=createAccelerationData(),probe=mesh(probeData.geometry,new T.MeshStandardMaterial({vertexColors:true,metalness:.15,roughness:.65,side:T.DoubleSide,flatShading:true}),probePosition);probe.scale.setScalar(probeScale);probe.name='Stanford Bunny — the ray passes just beside it';
 scene.add(new T.HemisphereLight('#adc9da','#594441',1.05));
 const sun=new T.DirectionalLight('#ffddb1',3.2);sun.position.set(-95,140,75);sun.target.position.set(20,10,-20);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-175,right:175,top:150,bottom:-140,far:440});sun.shadow.normalBias=.1;sun.shadow.bias=-.0001;scene.add(sun,sun.target);
 scene.environment=daylightEnvironment();scene.environmentIntensity=.32;scene.updateMatrixWorld(true);
 return {scene,world,materials,probe,teaching:probe,reflector,reflectorFrame:frame,sphere,pane,lamp,...probeData,setBeauty(_beauty:boolean){scene.fog=new T.Fog(sky,155,380);}};
}
export type Courtyard=ReturnType<typeof createCourtyard>;
