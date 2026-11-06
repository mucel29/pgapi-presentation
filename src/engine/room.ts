import * as T from 'three';
import {daylightEnvironment} from './lighting';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { rng, type Vec3 } from '../core/math';

export const landmarks = {
  gpu: [-2.6, 1.78, -0.55] as Vec3,
  screen: [-1.05, 2.1, -1.01] as Vec3,
  diffuse: [-0.1, 1.61, 0.58] as Vec3,
  metal: [1.23, 1.66, 0.05] as Vec3,
  glass: [2.28, 1.65, -0.65] as Vec3,
  lamp: [1.68, 3.88, -1.2] as Vec3,
};

function woodTexture() {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 512;
  const ctx = canvas.getContext('2d')!, pixels = ctx.createImageData(512, 512), rand = rng(774);
  const phases = Array.from({ length: 10 }, () => rand() * 6.28);
  for (let y = 0; y < 512; y++) for (let x = 0; x < 512; x++) {
    const grain = Math.sin(y * .32 + Math.sin(x * .012 + phases[0]) * 3 + Math.sin(x * .035) * .6);
    const fine = Math.sin(y * 1.8 + Math.sin(x * .02 + phases[1]) * 2) * .1;
    const board = Math.floor(y / 128) * 3;
    const f = grain * .12 + fine + rand() * .045;
    const i = (y * 512 + x) * 4;
    pixels.data[i] = 114 + f * 68 - board; pixels.data[i + 1] = 68 + f * 45 - board;
    pixels.data[i + 2] = 39 + f * 29 - board; pixels.data[i + 3] = 255;
  }
  ctx.putImageData(pixels, 0, 0);
  const tex = new T.CanvasTexture(canvas); tex.colorSpace = T.SRGBColorSpace;
  tex.wrapS = tex.wrapT = T.RepeatWrapping; tex.repeat.set(2, 1); tex.anisotropy = 4;
  return tex;
}

export function createRoom() {
  RectAreaLightUniformsLib.init();
  const scene = new T.Scene(); scene.background = new T.Color('#101e28');
  scene.fog = new T.Fog('#101e28', 13, 35);
  const world = new T.Group(); world.name = 'room-prologue'; scene.add(world);
  const materials: T.MeshStandardMaterial[] = [];
  const mat = (color: T.ColorRepresentation, roughness = .6, metalness = 0) => {
    const m = new T.MeshStandardMaterial({ color, roughness, metalness, flatShading:true }); materials.push(m); return m;
  };
  const navy = mat('#182e38'), shell = mat('#d5c7a9', .43), black = mat('#141f25',.3,.55);
  const metal = mat('#d2b487',.16,1), copper = mat('#b56e44',.29,.85), pcb = mat('#1b6556',.65,.25);
  const wall = mat('#566b70',.92), floor = mat('#263944',.85), darkWood = mat('#533b2d',.7);
  const wood = mat('#ffffff',.43); wood.map = woodTexture(); wood.bumpMap = wood.map; wood.bumpScale = .008;
  const cream = mat('#e5d9bd',.22), orange = mat('#c77a47',.55), teal = mat('#4b9f97',.6);
  const glass = new T.MeshPhysicalMaterial({color:'#d6f0ed',roughness:.035,metalness:0,transmission:1,ior:1.5,thickness:.9,transparent:true,flatShading:true});
  materials.push(glass);
  const emitter = mat('#fff1c9',.4); emitter.emissive.set('#ffd6a1'); emitter.emissiveIntensity = 3;
  const cyanEmitter = mat('#bbf2df',.2); cyanEmitter.emissive.set('#53d3b0'); cyanEmitter.emissiveIntensity = 1;

  const mesh = (geo:T.BufferGeometry,m:T.Material,pos:Vec3,parent:T.Object3D=world) => {
    const o = new T.Mesh(geo,m); o.position.set(...pos); o.castShadow = true; o.receiveShadow = true; parent.add(o); return o;
  };
  const box = (size:Vec3,pos:Vec3,m:T.Material,parent:T.Object3D=world,bevel=.035) => mesh(new RoundedBoxGeometry(...size,2,bevel),m,pos,parent);
  const cylinder = (rt:number,rb:number,h:number,pos:Vec3,m:T.Material,parent:T.Object3D=world,segments=32) => mesh(new T.CylinderGeometry(rt,rb,h,segments),m,pos,parent);
  const sphere = (r:number,pos:Vec3,m:T.Material) => mesh(new T.SphereGeometry(r,40,24),m,pos);
  // Architectural shell: open front and right, allowing the observer to follow the ray.
  box([18,.16,17],[0,-1.35,0],floor);
  box([18,10,.16],[0,3.6,-4.1],wall);
  box([.16,10,17],[-6.0,3.6,0],navy);
  box([17,.12,.12],[1,-1.14,-3.95],black);
  // Window and slatted frame on the back wall.
  const windowMat = mat('#75b5c3',.7); windowMat.emissive.set('#4b8193'); windowMat.emissiveIntensity=.35;
  box([3.2,3.4,.12],[3.65,3.1,-3.93],black);
  box([2.92,3.1,.08],[3.65,3.1,-3.84],windowMat);
  for(let i=0;i<8;i++) box([3.1,.055,.15],[3.65,1.8+i*.38,-3.7],navy);
  box([.08,3.2,.17],[3.65,3.1,-3.7],navy);
  // Desk, bevels and structural frame.
  box([7.7,.22,4.0],[0,.96,-.2],wood,world,.065);
  box([7.2,.19,3.45],[0,.77,-.2],darkWood);
  for(const x of [-3.3,3.3]) for(const z of [-1.6,1.2]) box([.16,2.05,.16],[x,-.36,z],black);
  box([6.7,.09,.09],[0,-.95,-1.6],black);
  // PC tower: a cutaway enclosure, GPU and two visible fans.
  const pc = new T.Group(); pc.position.set(-2.65,1.08,-.9); world.add(pc); pc.name='GPU cutaway';
  box([1.25,.10,1.65],[0,.04,0],black,pc);
  box([1.25,.10,1.65],[0,1.94,0],navy,pc);
  box([1.25,1.9,.08],[0,1.0,-.81],navy,pc);
  box([.08,1.9,1.65],[-.59,1.0,0],navy,pc);
  for(const x of [-.56,.56]) box([.045,1.9,.045],[x,1.0,.79],copper,pc,.005);
  box([1.06,1.59,.055],[0,1.03,-.7],pcb,pc);
  for(let i=0;i<4;i++) box([.08,.56,.07],[-.39+i*.13,1.36,-.63],black,pc,.005);
  box([.42,.40,.12],[.2,1.35,-.59],metal,pc);
  box([1.07,.17,1.16],[0,.75,-.08],black,pc);
  box([1.02,.035,1.2],[0,.87,-.08],pcb,pc,.005);
  for(const x of [-.29,.29]) {
    const fan = cylinder(.24,.24,.08,[x,.9,.0],black,pc,24); fan.rotation.x=Math.PI/2;
    // Visible fan faces are at the open front of the enclosure.
    const ring = mesh(new T.TorusGeometry(.225,.016,6,28),copper,[x,.75,.56],pc);
    for(let b=0;b<7;b++) { const blade=box([.045,.19,.025],[x+Math.cos(b*.897)*.09,.75+Math.sin(b*.897)*.09,.58],black,pc,.008);blade.rotation.z=-b*.897+.35; }
    mesh(new T.SphereGeometry(.045,12,8),metal,[x,.75,.61],pc);
    ring.name='GPU fan';
  }
  for(let i=0;i<9;i++) box([.07,.035,.25],[-.43+i*.105,.62,.12],copper,pc,.004);
  box([.88,.05,.025],[0,.96,.55],cyanEmitter,pc,.005);
  // Monitor and its stand.
  box([.62,.07,.45],[-1.02,1.11,-1.37],black);
  box([.13,.53,.15],[-1.02,1.38,-1.43],shell);
  const monitor = box([2.0,1.45,.30],[-1.02,2.12,-1.28],shell,world,.075);monitor.name='Virtual image plane';
  box([1.78,1.18,.07],[-1.02,2.15,-1.09],black);
  const display = new T.MeshBasicMaterial({color:0xffffff,toneMapped:false});
  const screen=mesh(new T.PlaneGeometry(1.66,1.06),display,[-1.02,2.16,-1.047]);
  sphere(.022,[-.27,1.49,-1.105],cyanEmitter);
  // Keyboard and precision mouse.
  box([1.85,.075,.63],[-1.12,1.115,-.33],shell,world,.035);
  for(let row=0;row<4;row++) for(let col=0;col<14;col++) box([.10,.045,.10],[-1.92+col*.122,1.175,-.55+row*.137],row===3&&col>3&&col<9?navy:cream,world,.012);
  box([.34,.14,.5],[.25,1.17,-.5],shell,world,.07);
  // Articulated desk lamp. Both the visible emitter and the actual area light share placement.
  cylinder(.36,.40,.09,[2.85,1.11,-1.65],black);
  const rod = (a:Vec3,b:Vec3,r=.035) => { const av=new T.Vector3(...a),bv=new T.Vector3(...b),o=cylinder(r,r,av.distanceTo(bv),av.clone().add(bv).multiplyScalar(.5).toArray() as Vec3,copper);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),bv.sub(av).normalize());return o; };
  rod([2.85,1.15,-1.65],[2.85,3.1,-1.65],.045);
  rod([2.85,3.1,-1.65],[1.68,3.92,-1.2],.045);
  for(const p of [[2.85,3.1,-1.65],[1.68,3.92,-1.2]] as Vec3[]) sphere(.09,p,metal);
  box([1.52,.15,.65],[1.68,3.96,-1.2],black,world,.04);
  box([1.35,.025,.53],[1.68,3.87,-1.2],emitter,world,.01);
  const area = new T.RectAreaLight('#ffddad',14,1.35,.53);area.position.set(1.68,3.85,-1.2);area.lookAt(.5,1,0);scene.add(area);
  // Practical room props give the final rendering texture, scale and indirect color.
  box([.9,.07,.65],[2.6,1.13,1.1],navy);
  for(let i=0;i<3;i++) box([.88,.10,.62],[2.6,1.21+i*.11,1.1],i===1?orange:cream);
  const mug=cylinder(.19,.16,.42,[-2.4,1.3,1.0],cream);
  const handle=mesh(new T.TorusGeometry(.14,.045,10,24),cream,[-2.18,1.31,1.0]);handle.rotation.y=Math.PI/2;
  cylinder(.167,.167,.01,[-2.4,1.515,1.0],mat('#35251d',.18));mug.name='Ceramic mug';
  // A small plant, deliberately geometric during the journey.
  cylinder(.23,.17,.40,[-3.08,1.28,1.05],teal);
  const leaf=mat('#54755b',.75);
  for(let i=0;i<8;i++) { const a=i*.785;const l=mesh(new T.SphereGeometry(.2,10,7),leaf,[-3.08+Math.cos(a)*.15,1.65+(i%3)*.08,1.05+Math.sin(a)*.15]);l.scale.set(.5,1.6,.35);l.rotation.z=Math.sin(a)*.6; }
  const hemi=new T.HemisphereLight('#b9d9e4','#665244',2.8);scene.add(hemi);
  const key=new T.DirectionalLight('#ffe6c4',2.4);key.position.set(-1,7,5);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-6;key.shadow.camera.right=6;key.shadow.camera.top=6;key.shadow.camera.bottom=-6;key.shadow.normalBias=.035;scene.add(key);
  const fill=new T.RectAreaLight('#c2e5f1',7,4,3);fill.position.set(3.5,4.2,-3.55);fill.lookAt(0,1.5,0);scene.add(fill);
  const bounce=new T.PointLight('#ffd4a2',7,10,2);bounce.position.set(1.5,3.5,2);scene.add(bounce);
  scene.environment=daylightEnvironment(true);scene.environmentIntensity=.65;
  return {scene,world,materials,screen,display,
    setBeauty(beauty:boolean) { for(const m of materials) {m.flatShading=!beauty;m.needsUpdate=true;} scene.fog=beauty?null:new T.Fog('#101e28',13,35); },
  };
}
export interface SceneWorld {scene:T.Scene;world:T.Group;materials:T.MeshStandardMaterial[];setBeauty(beauty:boolean):void;}
export type Room = ReturnType<typeof createRoom>;
