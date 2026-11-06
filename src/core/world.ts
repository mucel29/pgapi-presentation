import type {Vec3} from './math.ts';

// One physical layout for the lesson, the monitor view and optional renderer.
export const observatory={
 origin:[-64,16,48] as Vec3,
 sphere:[-35,16,-8] as Vec3,
 sphereRadius:3.6,
 mirror:[12,23,30] as Vec3,
 glass:[62,36,-26] as Vec3,
 glassThickness:3,
 bridge:{center:[8,19,-48] as Vec3,span:48,height:8,width:5},
 entrance:[-84,22,77] as Vec3,
 landing:[-68,18,52] as Vec3,
 entranceAim:[-18,20,-12] as Vec3,
};
