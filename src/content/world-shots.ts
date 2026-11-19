import type {Vec3} from '../core/math.ts';
import {add,sub,mul,normalize,cross} from '../core/math.ts';
import {route} from '../core/route.ts';
import {cameraPixel} from '../core/sampling.ts';
import {observatory} from '../core/world.ts';
import {probePosition} from '../core/acceleration-model.ts';
import type {Beat} from './chapters.ts';

// Framing belongs to the shot rather than the canvas: the world never changes
// aspect or viewport when the lesson card appears.
function aim(subject:Vec3,camera:Vec3,x=.32,y=0,aspect=16/9):Vec3{
 const forward=normalize(sub(subject,camera)),right=normalize(cross(forward,[0,1,0])),up=normalize(cross(right,forward));
 const distance=Math.hypot(...sub(subject,camera)),half=distance*Math.tan(43*Math.PI/360);
 return sub(sub(subject,mul(right,half*x*aspect)),mul(up,half*y));
}
function view(camera:Vec3,subject:Vec3,portraitCamera:Vec3=camera,x=.32){return {camera,target:aim(subject,camera,x),portraitCamera,portraitTarget:aim(subject,portraitCamera,0,.3,9/16)};}
const originView=view([-75,24,56],[-61,16,43],[-77,31,62],.35);
const diffuseView=view([-53,27,16],route[1],[-60,40,31],.32);
const mirrorView=view([-3,33,9],route[2],[-9,39,0]);
const glassView=view([43,45,-10],route[3],[39,56,9],.3);
// High view: the glass → beacon segment crosses the bridge at an angle.
const bridgeView=view([16,10,20],[0,0,0],[22,15,28],.3);
const bunnyPass=view(add(probePosition,[-9,7,11]),probePosition,add(probePosition,[-14,12,17]),.2);
const beaconView=view([94,62,-59],route[5],[84,76,-39],.3);
// The image phase changes representation deliberately: this is the original
// virtual pinhole camera, with no observer framing offset.
const imageView={camera:[...cameraPixel.origin] as Vec3,target:[...cameraPixel.center] as Vec3,portraitCamera:[...cameraPixel.origin] as Vec3,portraitTarget:[...cameraPixel.center] as Vec3};
const imageHold={...imageView,seconds:0,motion:'hold' as const,via:[],aimVia:[],rayFrom:5,rayTo:5};
const shots:Record<string,Partial<Beat>>={
 portal:{camera:[...observatory.landing],target:[...observatory.entranceAim],seconds:5.6},
 ray:{...originView,seconds:3.2},
 hit:{...diffuseView,seconds:5.2},
 'hit-steps':{...diffuseView,seconds:0,motion:'hold'},
 diffuse:{...diffuseView,seconds:0,motion:'hold'},
 'diffuse-chosen':{...diffuseView,seconds:0,motion:'hold'},
 'to-metal':{...mirrorView,seconds:6.6},
 materials:{...mirrorView,seconds:0,motion:'hold'},
 'to-glass':{...glassView,seconds:7.8},
 'near-bunny':{...bunnyPass,seconds:3.8,via:[],aimVia:[],rayFrom:4,rayTo:4+32/70},
 'acceleration-intro':{...bunnyPass,seconds:2.5,motion:'arrive',via:[],aimVia:[],rayFrom:5,rayTo:5},
 bvh:{...bridgeView,seconds:2.5,motion:'arrive',via:[],aimVia:[],rayFrom:5,rayTo:5},
 aabb:{...bridgeView},traversal:{...bridgeView},
 'to-light':{...beaconView,seconds:5,rayFrom:4+32/70,rayTo:5,via:[],aimVia:[]},
 light:{...beaconView,seconds:0,motion:'hold',via:[],aimVia:[]},
 image:{...imageHold},samples:{...originView,seconds:0,motion:'hold',via:[],aimVia:[],rayFrom:5,rayTo:5},loop:{...imageHold},noise:{...imageHold},temporal:{...imageHold},'temporal-motion':{...imageHold},denoise:{...imageHold},'denoise-pipeline':{...imageHold},
};
export function applyObservatoryShots(beats:Beat[]){for(const beat of beats){if(beat.id==='room')continue;Object.assign(beat,shots[beat.id]??{});if(['bvh','aabb','traversal'].includes(beat.id)){beat.motion='hold';beat.seconds=0;beat.rayFrom=5;beat.rayTo=5;}}}
export const observatoryFinalView={camera:[94,62,-59] as Vec3,target:[...route[5]] as Vec3};
