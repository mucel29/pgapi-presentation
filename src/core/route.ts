import {materialThroughput} from './transport.ts';
import {observatory} from './world.ts';
import {primaryHit} from './sphere-mesh.ts';
import {add,sub,mul,dot,normalize,reflect,refract,intersectSphere,type Vec3} from './math.ts';
// A deterministic selected path. Each material interaction is locally valid.
export const origin:Vec3=[...observatory.origin],sphereCenter:Vec3=[...observatory.sphere],sphereRadius=observatory.sphereRadius;
// The primary ray hits one triangle of the sphere mesh. The shading normal stays smooth.
const primary=primaryHit();
export const diffuseHit=add(origin,mul(primary.d,primary.t));
export const diffuseNormal=normalize(sub(diffuseHit,sphereCenter));
export const metalHit:Vec3=[...observatory.mirror],glassEntry:Vec3=[...observatory.glass];
const metalIn=normalize(sub(metalHit,diffuseHit)),metalOut=normalize(sub(glassEntry,metalHit));
export const metalNormal=normalize(sub(metalOut,metalIn));
export const glassNormal:Vec3=[0,0,1];
export const insideGlass=refract(metalOut,glassNormal,1/1.5)!;
export const glassExit=add(glassEntry,mul(insideGlass,observatory.glassThickness/-insideGlass[2]));
export const outsideGlass=refract(insideGlass,glassNormal,1.5)!;
export const lightHit=add(glassExit,mul(outsideGlass,70));
export const route:Vec3[]=[origin,diffuseHit,metalHit,glassEntry,glassExit,lightHit];
export const throughput:Vec3[]=[...materialThroughput,materialThroughput[2],materialThroughput[2]];
export const routeChecks={diffuseHemisphere:dot(normalize(sub(metalHit,diffuseHit)),diffuseNormal),reflection:reflect(metalIn,metalNormal),transmission:outsideGlass};
