import {materialThroughput,linearRGB} from './transport.ts';
import {throughput,route,diffuseNormal,outsideGlass} from './route.ts';
import {sub,normalize,dot,type Vec3} from './math.ts';
// Linear emission matches the beacon material; this deterministic contribution
// deliberately omits Fresnel, absorption, PDFs and MIS, as the lesson discloses.
export const beaconEmission=linearRGB('#ffbf71').map(v=>v*6) as Vec3;
export function selectedPathEstimate(depth=8){
 const segments=Math.max(0,Math.min(route.length-1,Math.floor(depth))),reachesLight=segments===route.length-1;
 const beta=[...throughput[Math.min(throughput.length-1,segments)]] as Vec3;
 const contribution=beta.map((v,i)=>reachesLight?v*beaconEmission[i]:0) as Vec3;
 return {segments,reachesLight,beta,emission:[...beaconEmission] as Vec3,contribution};
}
// One iteration at the cyan receiver. Its emitted radiance is zero; a separate
// explicit, unoccluded illustrative light query is weighted in linear RGB.
export function loopStageState(index:number){
 const stage=Math.max(0,Math.min(6,Math.floor(index))),direction=normalize(sub(route[5],route[1]));
 const distance=Math.hypot(...sub(route[5],route[1])),area=90,emitterCosine=Math.max(0,dot(direction,outsideGlass));
 const signedCosine=dot(direction,diffuseNormal),cosine=Math.max(0,signedCosine),visibility=signedCosine>0;
 const lightPDF=emitterCosine>0?distance*distance/(area*emitterCosine):Infinity,bsdfPDF=cosine/Math.PI;
 const misWeight=Number.isFinite(lightPDF)?lightPDF**2/(lightPDF**2+bsdfPDF**2):0;
 const contribution=materialThroughput[1].map((rho,i)=>visibility?rho/Math.PI*cosine*beaconEmission[i]/lightPDF*misWeight:0) as Vec3;
 return {stage,beta:[...(stage>=5?materialThroughput[1]:materialThroughput[0])] as Vec3,
  radiance:(stage>=3?[...contribution]:[0,0,0]) as Vec3,emission:[0,0,0] as Vec3,
  contribution,visibility,lightPDF,bsdfPDF,cosine,signedCosine,misWeight,area,distance,emitterCosine,
  incident:[...beaconEmission] as Vec3};
}
