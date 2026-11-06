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
const originView=view([-85,27,70],[-59,16,38],[-103,39,86],.22);
const diffuseView=view([-53,26,12],route[1],[-58,35,22]);
const mirrorView=view([-3,33,9],route[2],[-9,39,0]);
const glassView=view([44,45,-10],route[3],[34,54,7],.3);
const sampleView=view([-97,61,66],[-51,16,22],[-119,65,99],.2);
const overview=view([0,67,109],[22,27,-18],[-103,95,152],.12);
const bridgeView=view([-31,39,1],observatory.bridge.center,[-68,41,-8],.2);
const beaconView=view([83,60,-48],route[5],[72,75,-27],.3);
const shots:Record<string,Partial<Beat>>={
 portal:{camera:[...observatory.landing],target:[...observatory.entranceAim],seconds:5.6},
 ray:{...originView,seconds:3.2},
 hit:{...diffuseView,seconds:5.2},
 diffuse:{...diffuseView,seconds:0,motion:'hold'},
 'to-metal':{...mirrorView,seconds:6.6},
 materials:{...mirrorView,seconds:0,motion:'hold'},
 'to-glass':{...glassView,seconds:7.8},
 samples:{...sampleView,seconds:3.4,via:[[-22,76,58],[-72,70,79]],aimVia:[[20,27,-5],[-37,20,12]]},
 loop:{...overview,seconds:3.4,via:[[-81,85,111]],aimVia:[[-4,29,-5]]},
 cost:{...bridgeView,seconds:4,via:[[-28,61,52]],aimVia:[[0,22,-22]]},
 bvh:{...bridgeView},sah:{...bridgeView},aabb:{...bridgeView},traversal:{...bridgeView},
 noise:{...overview,seconds:3.8,via:[[-48,65,52]],aimVia:[[4,26,-18]]},
 denoise:{...overview},
 'to-light':{...beaconView,seconds:7},
 light:{...overview,seconds:5,via:[[84,94,69]],aimVia:[[54,32,-30]]},
};
export function applyObservatoryShots(beats:Beat[]){for(const beat of beats){if(beat.id==='room')continue;Object.assign(beat,shots[beat.id]??{});}}
export const observatoryFinalView={camera:[8,77,140] as Vec3,target:[29,22,-24] as Vec3};
