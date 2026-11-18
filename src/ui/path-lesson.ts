import type {Vec3} from '../core/math.ts';
import {loopStageState} from '../core/lesson-state.ts';
import {flowSteps} from './illustrations.ts';

// A finite, authored example of accumulation, not samples from the canyon renderer.
const examples=[
 {color:'#ffd091',points:[[140,38],[248,18],[414,32]],rgb:[.80,.40,.12]},
 {color:'#8cddd9',points:[[135,76],[250,116],[327,64],[414,76]],rgb:[.12,.56,.72]},
 {color:'#c2b4ff',points:[[170,124],[414,122]],rgb:[.40,.16,.64]},
 {color:'#e9a6bb',points:[[130,166],[236,146],[320,180],[414,168]],rgb:[.64,.24,.32]},
] as const;
export const exampleCount=examples.length;
export const rgbText=(rgb:readonly number[])=>'['+rgb.map(v=>v.toFixed(2)).join(', ')+']';
export function rgbSwatch(rgb:readonly number[]){
 const encode=(v:number)=>Math.round(255*(v<=.0031308?12.92*v:1.055*Math.pow(v,1/2.4)-.055));
 return `rgb(${rgb.map(v=>encode(Math.max(0,Math.min(1,v)))).join(' ')})`;
}
export function sampleLessonState(count=2,depth=3){
 const n=Math.max(0,Math.min(exampleCount,Math.floor(count))),limit=depth<=1?1:3;
 const samples=examples.slice(0,n).map((example,i)=>{
  const bounces=example.points.length-1,complete=bounces<=limit;
  return {id:i+1,color:example.color,bounces,complete,rgb:(complete?[...example.rgb]:[0,0,0]) as Vec3,
   points:example.points.slice(0,complete?example.points.length:limit)};
 });
 const mean=samples.reduce((sum,s)=>sum.map((v,i)=>v+s.rgb[i]/Math.max(1,n)) as Vec3,[0,0,0] as Vec3);
 return {count:n,depth:limit,samples,mean};
}
export function sampleLessonDiagram(count:number,depth:number){
 const state=sampleLessonState(count,depth);
 return `<svg viewBox="0 0 470 200" role="img" aria-label="${state.count} trasee independente prin aceeași celulă pixel; cercurile sunt bounces, pătratele sunt terminări la sursă">
 <path d="M20 94H61" stroke="#f4eddc" stroke-width="2"/><circle cx="20" cy="94" r="5" fill="#f4eddc"/><text x="7" y="119">o</text>
 <rect x="59" y="70" width="24" height="48" rx="2" fill="#243d46" stroke="#f8ead2" stroke-width="2"/><text x="43" y="141">pixel q</text>
 ${state.samples.map((s,i)=>{
  const q=[71,79+i*10],points=[q,...s.points],end=points[points.length-1];
  return `<g><path d="M20 94L${points.map(p=>p.join(' ')).join('L')}" fill="none" stroke="${s.color}" stroke-width="2.5"/>
  <circle cx="${q[0]}" cy="${q[1]}" r="3" fill="${s.color}"/>
  ${s.points.slice(0,s.complete?-1:undefined).map(p=>`<circle cx="${p[0]}" cy="${p[1]}" r="4" fill="#102632" stroke="${s.color}" stroke-width="2"/>`).join('')}
  ${s.complete?`<rect x="${end[0]-5}" y="${end[1]-5}" width="10" height="10" fill="${s.color}"/>`:`<path d="M${end[0]-5} ${end[1]-5}l10 10m0-10-10 10" stroke="${s.color}" stroke-width="2"/>`}
  <text x="${end[0]+12}" y="${end[1]+5}" style="fill:${s.color}">L${s.id}</text></g>`;
 }).join('')}
 </svg>`;
}
export const loopLabels=[...flowSteps,'Ajunge la sursă · termină sample-ul','Adaugă sample-ul în media pixelului'];
export const loopOperations=[
 'ray = generateCameraRay(q)',
 'hit = intersectScene(ray)',
 'L += β × Le   // aici: Le = 0',
 'L += directLight   // aici: V = 0',
 'direction = sampleBSDF(hit)',
 'β *= f × |n·ω| / pdf',
 'ray = spawnOffsetRay(hit, direction)',
 'repeat hits → emitter; L += β × Le; break',
 'N += 1; C += (L − C) / N; nextSample(q)',
];
export const loopShortNotes=[
 'Un singur sample începe la același pixel q.',
 'Păstrăm primul hit; operația closest-hit folosește BVH-ul deja inspectat.',
 'Suprafața difuză nu emite: L rămâne zero.',
 'Sursa nu este vizibilă din acest hit: contribuția directă este zero.',
 'Alegem o singură continuare în emisfera suprafeței.',
 'Cu sampling cosine-weighted, factorul este albedo RGB.',
 'Continuăm același sample; următorul hit repetă bucla.',
 'După reflexie și transmisie ajungem la sursă: contribuția deja urmărită intră în L.',
 'Abia acum se încheie un sample. Bucla exterioară pornește următorul traseu pentru q.',
];
export function loopLessonDiagram(stage:number){
 if(stage>=7)return `<svg viewBox="0 0 470 164" role="img" aria-label="Sample complet: diffuse, reflexie, sticlă, sursă, apoi contribuție în media pixelului"><rect x="30" y="88" width="24" height="24" fill="#243d46" stroke="#f8ead2" stroke-width="2"/><text x="12" y="140">pixel q</text><path d="M42 88L135 48L230 98L315 56L410 45" fill="none" stroke="#ffd091" stroke-width="3"/><circle cx="135" cy="48" r="6" fill="#99e0dc"/><circle cx="230" cy="98" r="6" fill="#ffd091"/><path d="M306 43V71M320 43V71" stroke="#99e0dc" stroke-width="3"/><rect x="402" y="37" width="16" height="16" fill="#ffd091"/><text x="100" y="25">difuz</text><text x="204" y="131">metal</text><text x="284" y="101">sticlă</text><text x="382" y="24">Le</text>${stage===8?'<path d="M410 63V150H42V115" stroke="#99e0dc" fill="none" stroke-dasharray="5 4"/><text x="142" y="161">L → media pixelului</text>':'<text x="345" y="138">L += β·Le</text>'}</svg>`;
 const s=loopStageState(stage),hit=stage>=1,scatter=stage>=4;
 return `<svg viewBox="0 0 470 164" role="img" aria-label="Un bounce difuz: rază prin pixel, hit, interogare separată de umbră și continuare BSDF">
 <defs><marker id="lesson-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="#99e0dc"/></marker></defs>
 <rect x="58" y="91" width="22" height="35" fill="#243d46" stroke="#f8ead2" stroke-width="2"/><text x="45" y="151">pixel q</text>
 <circle cx="20" cy="109" r="5" fill="#f4eddc"/><path d="M20 109L${hit?'190 90':'110 103'}" stroke="#f4eddc" stroke-width="2.5"/>
 <path d="M205 44L205 137" stroke="#51777d" stroke-width="4"/>
 ${hit?'<circle cx="190" cy="90" r="6" fill="#ffd091"/><path d="M190 90L150 90" stroke="#82999d"/><text x="142" y="82">n</text><text x="216" y="111">hit difuz</text>':''}
 <rect x="390" y="25" width="20" height="20" fill="#ffd091"/><text x="371" y="17">sursă</text>
 ${stage===3?'<path d="M190 90L400 35" stroke="#f19489" stroke-width="2" stroke-dasharray="5 5"/><path d="M280 57l12 12m0-12-12 12" stroke="#f19489" stroke-width="3"/><text x="290" y="94">V = 0</text>':''}
 ${scatter?`<path d="M190 90L112 28" stroke="#99e0dc" stroke-width="3" marker-end="url(#lesson-arrow)"/><text x="130" y="22">${stage===6?'următorul hit':'direcție BSDF'}</text>`:''}
 <text x="308" y="146">${s.stage+1} / ${loopLabels.length} operații</text></svg>`;
}
