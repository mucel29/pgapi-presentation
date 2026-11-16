import type {Vec3} from '../core/math.ts';
import {add,sub,mul,normalize,cross} from '../core/math.ts';
import {route} from '../core/route.ts';
import {observatory} from '../core/world.ts';
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
// One overview for every depth/sample setting. The phone composition uses the
// upper world window, above the teaching card, while retaining the whole canyon.
const sampleView={compactCamera:[-23.5,214.5,243.1] as Vec3,compactTarget:[-96,28.9,-34.3] as Vec3,camera:[0,247.5,108.1] as Vec3,target:[-28.6,29,-20.5] as Vec3,
 portraitCamera:[401.2,300.6,-81.9] as Vec3,portraitTarget:[73.2,-43.3,-24] as Vec3};
const overview=view([0,67,109],[22,27,-18],[-103,95,152],.12);
const bridgeView=view([-20,41,10],observatory.bridge.center,[-66,64,53],.25);
const beaconView=view([83,60,-48],route[5],[72,75,-27],.3);
const shots:Record<string,Partial<Beat>>={
 portal:{camera:[...observatory.landing],target:[...observatory.entranceAim],seconds:5.6},
 ray:{...originView,seconds:3.2},
 hit:{...diffuseView,seconds:5.2},
 diffuse:{...diffuseView,seconds:0,motion:'hold'},
 'to-metal':{...mirrorView,seconds:6.6},
 materials:{...mirrorView,seconds:0,motion:'hold'},
 'to-glass':{...glassView,seconds:7.8},
 samples:{...sampleView,seconds:4,via:[[90,105,-8]],aimVia:[[38,29,-10]]},
 loop:{...diffuseView,seconds:3.4,via:[[-81,85,111]],aimVia:[[-4,29,-5]]},
 cost:{...bridgeView,seconds:4,via:[[-28,61,52]],aimVia:[[0,22,-22]]},
 bvh:{...bridgeView},sah:{...bridgeView},aabb:{...bridgeView},traversal:{...bridgeView},
 noise:{...overview,seconds:3.8,via:[[-48,65,52]],aimVia:[[4,26,-18]]},
 denoise:{...overview},
 'to-light':{...beaconView,seconds:7},
 light:{...originView,seconds:5,via:[[84,94,69]],aimVia:[[54,32,-30]]},
};
export function applyObservatoryShots(beats:Beat[]){for(const beat of beats){if(beat.id==='room')continue;Object.assign(beat,shots[beat.id]??{});}}
export const observatoryFinalView={camera:[8,77,140] as Vec3,target:[29,22,-24] as Vec3};
