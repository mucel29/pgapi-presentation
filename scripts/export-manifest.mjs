import fs from 'node:fs/promises';
import {chapters,beats,sources,glossary} from '../src/content/chapters.ts';
import {createTeachingData} from '../src/core/teaching.ts';
import {accumulationExperiment,slabIntervals} from '../src/core/experiments.ts';
import {route,glassNormal,insideGlass,outsideGlass} from '../src/core/route.ts';
import {dot,normalize,sub,cosineHemisphere} from '../src/core/math.ts';
import {shotPose} from '../src/core/cinematics.ts';
await fs.mkdir('.build',{recursive:true});const {tree,triangles,traversal,rayOrigin,rayDirection}=createTeachingData();
const angle=d=>Math.acos(Math.min(1,Math.abs(dot(d,glassNormal))))*180/Math.PI;
const experiments={accumulation:[1,4,16,64,256].map(n=>accumulationExperiment(n)),diffuse:Array.from({length:20},(_,i)=>cosineHemisphere((i+.5)/20,(i*.61803398875)%1)),slabs:slabIntervals(rayOrigin,rayDirection,tree.min,tree.max),glass:{ior:1.5,incomingAngle:angle(normalize(sub(route[3],route[2]))),insideAngle:angle(insideGlass),exitAngle:angle(outsideGlass)}};
const shots=Object.fromEntries(beats.map((b,i)=>[b.id,{landscape:shotPose(b,beats[Math.max(0,i-1)],1,16/9),portrait:shotPose(b,beats[Math.max(0,i-1)],1,9/16)}]));
// Source Chapter poses are legacy. Export the corresponding authoritative Beat pose.
const exportedChapters=chapters.map(c=>({...c,camera:shots[c.id].landscape.position,target:shots[c.id].landscape.target}));
await fs.writeFile('.build/deck-content.json',JSON.stringify({chapters:exportedChapters,beats,shots,shotAuthority:'src/core/cinematics.ts · shotPose(Beat, previousBeat, t, aspect)',sources,glossary,bvh:{tree,triangles,triangleCount:triangles.length,traversal,rayOrigin,rayDirection},experiments},null,2));
console.log(`Exported ${chapters.length} topics and ${beats.length} beats; no GPU rendering.`);
