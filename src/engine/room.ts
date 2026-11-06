import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {RectAreaLightUniformsLib} from 'three/addons/lights/RectAreaLightUniformsLib.js';
import {monitor} from '../core/portal.ts';
import {type Vec3} from '../core/math.ts';
import {daylightEnvironment} from './lighting.ts';

export const landmarks={
  gpu:[-2.66,1.76,-.62] as Vec3,
  screen:[...monitor.center] as Vec3,
  lamp:[1.66,3.18,-.64] as Vec3,
};

export function createRoom(){
  RectAreaLightUniformsLib.init();
  const scene=new T.Scene();scene.background=new T.Color('#14252c');scene.fog=new T.Fog('#14252c',14,30);
  const world=new T.Group();world.name='room-prologue';scene.add(world);
  const materials:T.MeshStandardMaterial[]=[];
  const mat=(name:string,color:T.ColorRepresentation,roughness=.7,metalness=0)=>{
    const m=new T.MeshStandardMaterial({name,color,roughness,metalness});materials.push(m);return m;
  };
  const charcoal=mat('Graphite enclosure','#252d30',.48,.2),black=mat('Dark fittings','#121c21',.6,.25);
  const wall=mat('Cool plaster','#35474a',.95),sideWall=mat('Shaded plaster','#25383e',.95),floor=mat('Quiet floor','#343d3c',.92);
  const walnut=mat('Matte walnut','#735741',.76),endgrain=mat('Desk edge','#514334',.82),cloth=mat('Chair upholstery','#3c4849',.96);
  const ceramic=mat('Warm ceramic','#b7ad95',.48),brass=mat('Brushed bronze','#a48b65',.42,.7),pcb=mat('GPU board','#304d43',.8,.1);
  const cream=mat('Keyboard caps','#c8c5b5',.68),rubber=mat('Desk mat','#2b3537',.96),paper=mat('Notebook paper','#b4b3a4',.92);
  const emitter=mat('Warm lamp diffuser','#f2d5a5',.7);emitter.emissive.set('#ffc58d');emitter.emissiveIntensity=2.2;
  const windowMat=mat('Evening window','#617f88',.92);windowMat.emissive.set('#618e9a');windowMat.emissiveIntensity=.28;
  const status=mat('PC status light','#93ada8',.7);status.emissive.set('#719c9b');status.emissiveIntensity=.35;
  const mesh=(name:string,geometry:T.BufferGeometry,material:T.Material,position:Vec3,parent:T.Object3D=world)=>{
    const o=new T.Mesh(geometry,material);o.name=name;o.position.set(...position);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;
  };
  const box=(name:string,size:Vec3,pos:Vec3,m:T.Material,parent:T.Object3D=world,bevel=0)=>mesh(name,bevel?new RoundedBoxGeometry(...size,1,bevel):new T.BoxGeometry(...size),m,pos,parent);
  const cyl=(name:string,top:number,bottom:number,height:number,pos:Vec3,m:T.Material,parent:T.Object3D=world,segments=20)=>mesh(name,new T.CylinderGeometry(top,bottom,height,segments),m,pos,parent);
  const rod=(name:string,a:Vec3,b:Vec3,r:number,m:T.Material,parent:T.Object3D=world)=>{
    const av=new T.Vector3(...a),bv=new T.Vector3(...b),o=cyl(name,r,r,av.distanceTo(bv),av.clone().add(bv).multiplyScalar(.5).toArray() as Vec3,m,parent,12);
    o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),bv.sub(av).normalize());return o;
  };

  // The room opens toward the observer. Broad surfaces support the monitor silhouette.
  box('Floor',[13,.14,13],[0,-.94,.8],floor);
  box('Back wall',[13,7,.16],[0,2.48,-3.5],wall);
  box('Left wall',[.16,7,13],[-4.7,2.48,.8],sideWall);
  box('Back skirting',[12.9,.16,.07],[0,-.75,-3.37],black);
  // A single tall window gives a cool counterlight, without a striped backdrop.
  box('Window recess',[2.05,3.9,.11],[3.45,2.45,-3.36],black);
  box('Window glass',[1.82,3.65,.035],[3.45,2.45,-3.285],windowMat);
  box('Window mullion',[.055,3.65,.07],[3.65,2.45,-3.24],charcoal);
  box('Window sill',[2.23,.11,.35],[3.45,.49,-3.19],ceramic);
  // The side return is foreground architecture, outside the monitor approach corridor.
  box('Right doorway return',[.22,6.5,1.15],[4.65,2.23,4.25],sideWall);

  // No high-frequency texture: the tabletop is read by its edge and warm grazing light.
  box('Desktop',[6.25,.18,2.9],[-.3,.97,-.12],walnut,world,.055);
  box('Desktop apron',[6.05,.16,2.65],[-.3,.82,-.12],endgrain);
  for(const x of [-3.06,2.46]){
    box('Desk trestle',[.12,1.62,2.25],[x,-.02,-.12],charcoal);
    box('Trestle foot',[.44,.10,2.40],[x,-.82,-.12],black,world,.025);
  }
  box('Rear stretcher',[5.5,.10,.10],[-.3,-.46,-1.15],charcoal);
  box('Cable tray',[2.8,.13,.32],[-.6,.69,-1.21],black);

  // An ordinary cutaway tower: enough structure to read the GPU without neon accents.
  const pc=new T.Group();pc.name='Open PC with GPU';pc.position.set(-2.65,1.065,-.74);world.add(pc);
  box('PC base',[1.18,.09,1.40],[0,.045,0],charcoal,pc,.025);
  box('PC roof',[1.18,.09,1.40],[0,1.76,0],charcoal,pc,.025);
  box('PC rear',[1.18,1.72,.07],[0,.91,-.665],charcoal,pc);
  box('PC left wall',[.065,1.72,1.40],[-.56,.91,0],charcoal,pc);
  for(const x of [-.55,.55])box('Front corner post',[.045,1.72,.045],[x,.91,.665],black,pc);
  box('Motherboard',[1.02,1.37,.035],[0,1.00,-.61],pcb,pc);
  box('CPU heat sink',[.38,.42,.22],[.21,1.23,-.47],brass,pc);
  for(let i=0;i<3;i++)box('Memory module',[.065,.51,.05],[-.38+i*.115,1.24,-.55],black,pc);
  box('Power supply',[.98,.32,.72],[0,.25,-.15],black,pc);
  box('GPU shroud',[1.02,.36,.19],[0,.75,.47],charcoal,pc,.025);
  box('GPU board',[1.04,.045,.83],[0,.94,.13],pcb,pc);
  for(let i=0;i<7;i++)box('GPU heat-sink fin',[.08,.10,.38],[-.35+i*.116,.65,.18],brass,pc);
  for(const x of [-.27,.27]){
    const ring=mesh('GPU fan ring',new T.TorusGeometry(.205,.018,5,20),black,[x,.75,.584],pc);
    for(let b=0;b<5;b++){
      const a=b*Math.PI*2/5,blade=box('GPU fan blade',[.055,.16,.018],[x+Math.cos(a)*.09,.75+Math.sin(a)*.09,.59],black,pc,.008);blade.rotation.z=-a+.4;
    }
    mesh('GPU fan hub',new T.SphereGeometry(.045,10,6),brass,[x,.75,.61],pc);
    ring.castShadow=false;
  }
  box('PC power indicator',[.026,.026,.012],[.47,1.61,.697],status,pc);
  // One broad cable bend is readable at low raster resolution.
  rod('GPU cable',[.43,.84,.37],[.46,.48,.28],.025,black,pc);

  // Screen placement is a shared geometric contract with the portal camera.
  const [sx,sy,sz]=monitor.center,w=monitor.width,h=monitor.height;
  box('Monitor foot',[.66,.065,.45],[sx,1.095,sz-.12],black,world,.025);
  box('Monitor riser',[.115,.58,.12],[sx,1.39,sz-.18],charcoal,world,.015);
  box('Monitor back',[w+.22,h+.23,.16],[sx,sy,sz-.115],charcoal,world,.045);
  // Four separate rails leave the entire active rectangle open, including oblique views.
  const rail=.075,gap=.018;
  box('Bezel left',[rail,h+rail*2+gap*2,.035],[sx-w/2-gap-rail/2,sy,sz-.022],black);
  box('Bezel right',[rail,h+rail*2+gap*2,.035],[sx+w/2+gap+rail/2,sy,sz-.022],black);
  box('Bezel top',[w+gap*2,rail,.035],[sx,sy+h/2+gap+rail/2,sz-.022],black);
  box('Bezel bottom',[w+gap*2,rail,.035],[sx,sy-h/2-gap-rail/2,sz-.022],black);
  const display=new T.MeshBasicMaterial({color:0xffffff,toneMapped:false});
  const screen=mesh('Portal active screen',new T.PlaneGeometry(w,h),display,[sx,sy,sz]);screen.castShadow=false;screen.receiveShadow=false;

  box('Desk mat',[2.68,.025,1.05],[-.77,1.075,.06],rubber,world,.045);
  box('Keyboard base',[1.78,.07,.56],[-1.05,1.12,-.035],charcoal,world,.025);
  const keyGeometry=new T.BoxGeometry(.105,.025,.09);
  for(let row=0;row<4;row++)for(let col=0;col<12;col++)mesh('Keyboard key',keyGeometry,cream,[-1.73+col*.124,1.166,-.23+row*.123]);
  box('Space bar',[.53,.025,.09],[-1.06,1.166,.27],cream,world,.008);
  box('Mouse',[.27,.115,.41],[.12,1.145,.04],ceramic,world,.065);

  // A warm practical, kept low and to the right so it never crowds the portal.
  cyl('Lamp base',.27,.31,.07,[2.07,1.10,-.69],black);
  rod('Lamp lower arm',[2.07,1.13,-.69],[2.22,2.38,-.73],.035,charcoal);
  rod('Lamp upper arm',[2.22,2.38,-.73],[1.61,3.14,-.64],.035,charcoal);
  mesh('Lamp hinge',new T.SphereGeometry(.075,12,8),brass,[2.22,2.38,-.73]);
  const shade=cyl('Task lamp shade',.17,.35,.22,[1.61,3.12,-.64],charcoal);shade.rotation.z=-.15;
  cyl('Lamp diffuser',.30,.30,.012,[1.61,3.005,-.64],emitter);
  const practical=new T.RectAreaLight('#ffd1a0',8,.58,.40);practical.position.set(1.61,2.97,-.64);practical.lookAt(1.08,1,.35);scene.add(practical);

  // One personal object and one work object establish scale, leaving the desk open.
  const mug=cyl('Ceramic mug',.16,.135,.32,[-2.26,1.235,.73],ceramic);
  const rim=mesh('Mug rim',new T.TorusGeometry(.147,.014,6,24),ceramic,[-2.26,1.399,.73]);rim.rotation.x=Math.PI/2;
  const handle=mesh('Mug handle',new T.TorusGeometry(.105,.027,7,18),ceramic,[-2.06,1.26,.73]);handle.rotation.y=Math.PI/2;
  cyl('Coffee',.13,.13,.009,[-2.26,1.385,.73],mat('Coffee','#332c24',.4));mug.castShadow=true;
  box('Notebook lower cover',[.62,.012,.84],[1.69,1.067,.64],charcoal,world,.008);
  box('Notebook page block',[.57,.033,.79],[1.69,1.090,.64],paper);
  box('Notebook upper cover',[.62,.012,.84],[1.69,1.112,.64],charcoal,world,.008);

  // Foreground chair sits below the monitor sightline and stays outside the push-in lane.
  const chair=new T.Group();chair.name='Foreground chair';chair.position.set(1.97,0,2.12);chair.rotation.y=-.22;world.add(chair);
  box('Chair seat',[1.34,.18,1.18],[0,.17,0],cloth,chair,.09);
  box('Chair back',[1.36,1.26,.16],[0,.94,.50],cloth,chair,.10);
  for(const x of [-.49,.49])rod('Chair back support',[x,.03,.43],[x,1.44,.53],.03,charcoal,chair);
  cyl('Chair pedestal',.075,.075,.83,[0,-.34,0],charcoal,chair,12);
  for(let i=0;i<5;i++){
    const a=i*Math.PI*2/5;rod('Chair base spoke',[0,-.75,0],[Math.cos(a)*.64,-.75,Math.sin(a)*.64],.045,charcoal,chair);
    cyl('Chair caster',.075,.075,.10,[Math.cos(a)*.64,-.83,Math.sin(a)*.64],black,chair,10);
  }

  const hemi=new T.HemisphereLight('#a8c4cc','#675445',1.15);scene.add(hemi);
  const key=new T.DirectionalLight('#e5d6bd',1.55);key.position.set(1,6,4);key.target.position.set(-.7,1,-.3);scene.add(key.target);key.castShadow=true;key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-4.5,right:4.5,top:4.5,bottom:-4.5,near:.5,far:15});key.shadow.normalBias=.025;key.shadow.bias=-.0001;scene.add(key);
  const cool=new T.RectAreaLight('#a2c6d3',4.5,1.65,3.4);cool.position.set(3.45,2.45,-3.18);cool.lookAt(-1.1,1.5,1.3);scene.add(cool);
  const monitorSpill=new T.PointLight('#99b6b8',1.1,3.7,2);monitorSpill.position.set(sx,sy,sz+.4);scene.add(monitorSpill);
  const lampBounce=new T.PointLight('#f4c28e',2.4,4.8,2);lampBounce.position.set(1.45,2.6,-.35);scene.add(lampBounce);
  scene.environment=daylightEnvironment(true);scene.environmentIntensity=.28;
  return {scene,world,materials,screen,display,
    setBeauty(beauty:boolean){for(const m of materials){m.flatShading=false;m.needsUpdate=true;}scene.fog=beauty?null:new T.Fog('#14252c',14,30);},
  };
}
export interface SceneWorld{scene:T.Scene;world:T.Group;materials:T.MeshStandardMaterial[];setBeauty(beauty:boolean):void;}
export type Room=ReturnType<typeof createRoom>;
