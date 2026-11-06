import {add,sub,mul,dot,normalize,reflect,refract,intersectSphere,type Vec3} from './math.ts';
// A deterministic selected path. Each material interaction is locally valid.
export const origin:Vec3=[-45,4,38],sphereCenter:Vec3=[-32,4,-4],sphereRadius=3;
const incoming=normalize(sub(sphereCenter,origin));
export const diffuseHit=add(origin,mul(incoming,intersectSphere(origin,incoming,sphereCenter,sphereRadius)!));
export const diffuseNormal=normalize(sub(diffuseHit,sphereCenter));
export const metalHit:Vec3=[8,6,28],glassEntry:Vec3=[48,6,-10];
const metalIn=normalize(sub(metalHit,diffuseHit)),metalOut=normalize(sub(glassEntry,metalHit));
export const metalNormal=normalize(sub(metalOut,metalIn));
export const glassNormal:Vec3=[0,0,1];
export const insideGlass=refract(metalOut,glassNormal,1/1.5)!;
export const glassExit=add(glassEntry,mul(insideGlass,2/-insideGlass[2]));
export const outsideGlass=refract(insideGlass,glassNormal,1.5)!;
export const lightHit=add(glassExit,mul(outsideGlass,40));
export const route:Vec3[]=[origin,diffuseHit,metalHit,glassEntry,glassExit,lightHit];
export const throughput:Vec3[]=[[1,1,1],[.75,.28,.13],[.75*.91,.28*.78,.13*.52],[.75*.91,.28*.78,.13*.52],[.75*.91,.28*.78,.13*.52]];
export const routeChecks={diffuseHemisphere:dot(normalize(sub(metalHit,diffuseHit)),diffuseNormal),reflection:reflect(metalIn,metalNormal),transmission:outsideGlass};
