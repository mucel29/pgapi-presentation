import {add,mul,sub,type Vec3} from './math.ts';
import {origin,route} from './route.ts';

// A uniformly scaled explanatory model carried forward beside the observer.
// The actual camera, sampled hits and optical route remain in their own world.
export const lessonScale=.18;
export const lessonOrigin:Vec3=[64,43,-39];
export const lessonOffset=sub(lessonOrigin,mul(origin,lessonScale));
export const lessonPoint=(point:Vec3):Vec3=>add(lessonOffset,mul(point,lessonScale));
export const lessonCenter=lessonPoint([20,25,-8]);
export const lessonRoute=route.map(lessonPoint);
