import type {Vec3} from '../core/math.ts';
import {add,sub,mul,normalize,cross} from '../core/math.ts';
import {route} from '../core/route.ts';
import {observatory} from '../core/world.ts';
import {lessonCenter} from '../core/lesson-space.ts';
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
// Lessons stay beside the transmitted leg. Sampling uses a small, labeled
// model instead of sending the observer back to the original camera.
const sampleView={...view([55,64,-4],lessonCenter,[43,87,26],.32),portraitTarget:aim(lessonCenter,[43,87,26],0,.48,9/16)};
const bridgeView=view([68,53,-37],observatory.bridge.center,[54,68,-13],.25);
const noiseView=view([85,58,-49],add(route[4],mul(sub(route[5],route[4]),.72)),[73,74,-28],.28);
const beaconView=view([94,62,-59],route[5],[84,76,-39],.3);
const shots:Record<string,Partial<Beat>>={
 portal:{camera:[...observatory.landing],target:[...observatory.entranceAim],seconds:5.6},
 ray:{...originView,seconds:3.2},
 hit:{...diffuseView,seconds:5.2},
 diffuse:{...diffuseView,seconds:0,motion:'hold'},
 'to-metal':{...mirrorView,seconds:6.6},
 materials:{...mirrorView,seconds:0,motion:'hold'},
 'to-glass':{...glassView,seconds:7.8},
 samples:{...sampleView,seconds:3.8,via:[],aimVia:[]},
 loop:{...sampleView,seconds:0,motion:'hold',via:[],aimVia:[]},
 cost:{...bridgeView,seconds:4.2,via:[],aimVia:[],rayFrom:4.18,rayTo:4.45},
 bvh:{...bridgeView},sah:{...bridgeView},aabb:{...bridgeView},traversal:{...bridgeView},
 noise:{...noiseView,seconds:3.8,via:[],aimVia:[],rayFrom:4.45,rayTo:4.72},
 denoise:{...noiseView,rayFrom:4.72,rayTo:4.72},
 'to-light':{...beaconView,seconds:5,rayFrom:4.72,rayTo:5},
 light:{...beaconView,seconds:0,motion:'hold',via:[],aimVia:[]},
};
export function applyObservatoryShots(beats:Beat[]){for(const beat of beats){if(beat.id==='room')continue;Object.assign(beat,shots[beat.id]??{});if(['bvh','sah','aabb','traversal'].includes(beat.id)){beat.rayFrom=4.45;beat.rayTo=4.45;}}}
export const observatoryFinalView={camera:[94,62,-59] as Vec3,target:[...route[5]] as Vec3};
