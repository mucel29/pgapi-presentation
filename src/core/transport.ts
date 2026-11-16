import type {Vec3} from './math.ts';
export const polishedRoughness=.055;
export const materialPalette={diffuse:'#43bdd9',metal:'#f4b14b'};
export function linearRGB(hex:string):Vec3{
 return [1,3,5].map(i=>{const s=parseInt(hex.slice(i,i+2),16)/255;return s<=.04045?s/12.92:((s+.055)/1.055)**2.4;}) as Vec3;
}
export const diffuseAlbedo=linearRGB(materialPalette.diffuse),metalReflectance=linearRGB(materialPalette.metal);
export const materialThroughput:Vec3[]=[[1,1,1],diffuseAlbedo,diffuseAlbedo.map((v,i)=>v*metalReflectance[i]) as Vec3];
export function weightDisplay(rgb:Vec3){const magnitude=Math.max(...rgb);return {rgb:[...rgb] as Vec3,hue:rgb.map(v=>magnitude?v/magnitude:0) as Vec3,magnitude};}
