import {add,mul,sub,normalize,triangleIntersection,type Vec3} from '../core/math.ts';
import {primaryHit} from '../core/sphere-mesh.ts';
import {materialPalette} from '../core/transport.ts';
export const flowSteps=['Rază din cameră','Cel mai apropiat hit','Adună emisia','Eșantionează lumina','Alege direcția BSDF','Actualizează β','Continuă sau termină'];
export const flowDescriptions=[
 'Un sample începe cu L = 0 și β = 1. Raza trece printr-un punct din pixel.',
 'BVH găsește cel mai apropiat hit. La miss, adunăm mediul și terminăm traseul.',
 'L adună emisia întâlnită, ponderată cu β. L este contribuția care ajunge în pixel.',
 'O rază de umbră verifică vizibilitatea spre o sursă. Adunăm contribuția directă în L.',
 'Materialul alege următoarea direcție și densitatea ei de probabilitate.',
 'β se înmulțește cu f · cosθ / pdf. Ponderea traseului nu este lumină adunată.',
 'Pornim din hit cu un mic offset. Repetăm până la miss, limita de bounces sau roulette.'
];
export function pathLoopIllustration(){return `<svg viewBox="0 0 600 430" role="img" aria-label="Algoritmul unui sample; L adună lumina, beta ponderează traseul"><defs><marker id="flow-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0L6,3L0,6" fill="#8bc5c1"/></marker></defs>${flowSteps.map((label,i)=>`<g data-flow="${i}"><rect x="12" y="${12+i*56}" width="350" height="42" rx="3" fill="#17383f" stroke="#47696b"/><text x="27" y="${40+i*56}">${i+1}  ${label}</text></g>${i<6?`<path d="M185 ${54+i*56}v14" stroke="#8bc5c1" marker-end="url(#flow-arrow)"/>`:''}`).join('')}<path d="M363 370H390V88H364" stroke="#edbd7f" stroke-dasharray="6 5" fill="none" marker-end="url(#flow-arrow)"/><text x="420" y="73" class="flow-register" fill="#ffd093">L</text><text x="420" y="105">lumină</text><text x="420" y="135">adunată</text><path d="M420 166H580" stroke="#537675"/><text x="420" y="213" class="flow-register" fill="#85d8dc">β</text><text x="420" y="245">ponderea</text><text x="420" y="275">traseului</text><text x="420" y="350" class="flow-small">1 traseu</text><text x="420" y="380" class="flow-small">→ 1 sample</text></svg>`;}
// The panel shows the real sphere triangle hit by the real primary ray.
const primary=primaryHit(),[A,B,C]=primary.triangle;
export const primaryUV={u:primary.u,v:primary.v};
const sphereColor=materialPalette.diffuse;
const dotv=(x:Vec3,y:Vec3)=>x[0]*y[0]+x[1]*y[1]+x[2]*y[2],crossv=(x:Vec3,y:Vec3):Vec3=>[x[1]*y[2]-x[2]*y[1],x[2]*y[0]-x[0]*y[2],x[0]*y[1]-x[1]*y[0]];
/** Real triangle and camera origin. The ray goes from o through P = A + u·e₁ + v·e₂. */
export function triangleScene(u=primaryUV.u,v=primaryUV.v,parallel=false){
 const a=A,b=B,c=C,o=primary.o,p=add(a,add(mul(sub(b,a),u),mul(sub(c,a),v))),d:Vec3=parallel?normalize(sub(b,a)):normalize(sub(p,o));
 return {a,b,c,o,d,p};
}
// Local frame of the triangle for the figure: x along e₁, z towards the camera.
function frame(){
 const ex=normalize(sub(B,A));let ez=normalize(crossv(sub(B,A),sub(C,A)));if(dotv(ez,primary.d)>0)ez=mul(ez,-1);
 const ey=crossv(ez,ex),local=(q:Vec3):Vec3=>{const r=sub(q,A);return [dotv(r,ex),dotv(r,ey),dotv(r,ez)];};
 const pts=[A,B,C].map(local),xs=pts.map(q=>q[0]),ys=pts.map(q=>q[1]),size=Math.max(Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys));
  // The triangle sits left; the ray comes in from the upper right (oblique view).
 const scale=Math.min(170/(Math.max(...xs)-Math.min(...xs)),150/(Math.max(...ys)-Math.min(...ys))),cx=(Math.max(...xs)+Math.min(...xs))/2,cy=(Math.max(...ys)+Math.min(...ys))/2;
 const project=(q:Vec3)=>{const l=local(q);return [125+(l[0]-cx)*scale+l[2]*scale*.85,145-(l[1]-cy)*scale-l[2]*scale*.45];};
 return {project,local,size};
}
function baseFigure(u:number,v:number,parallel:boolean,color:string,showPoint:boolean,label:string,extra=''){
 const {a,b,c,d,p}=triangleScene(u,v,parallel),{project,size}=frame(),pt=(q:Vec3)=>project(q).join(','),pp=project(p);
 // The camera is about 60 units away; the figure draws the last part of the ray.
 let k=parallel?1.2:.85,from=sub(p,mul(d,size*k));
 // Keep the start of the ray inside the figure.
 while(k>.2){const q=project(from);if(q[0]>12&&q[0]<318&&q[1]>34&&q[1]<228)break;k*=.85;from=sub(p,mul(d,size*k));}
 const fp=project(from),end=project(add(p,mul(d,size*(parallel?.5:.25))));
 const n=project(add(p,mul(normalize(crossv(sub(b,a),sub(c,a))),dotv(normalize(crossv(sub(b,a),sub(c,a))),primary.d)>0?-size*.5:size*.5)));
 return `<svg viewBox="0 0 400 240" overflow="hidden" role="img" aria-label="Triunghiul ${primary.index} al sferei și raza primară">
 <defs><marker id="tri-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="${color}"/></marker></defs>
 <polygon points="${pt(a)} ${pt(b)} ${pt(c)}" fill="${sphereColor}" opacity=".9"/>
 <polygon points="${pt(p)} ${pt(b)} ${pt(c)}" fill="#0b2a33" opacity=".18"/><polygon points="${pt(a)} ${pt(p)} ${pt(c)}" fill="#ffffff" opacity=".14"/>
 <path d="M${pt(a)}L${pt(b)}L${pt(c)}Z" stroke="#e9fbff" stroke-width="2" fill="none"/>
 ${extra}
 <path d="M${fp.join(',')}L${(showPoint?pp:end).join(',')}" stroke="${color}" stroke-width="3" marker-end="url(#tri-arrow)"/>
 ${showPoint?`<path d="M${pp}L${n}" stroke="#e9fbff" stroke-width="1.5" stroke-dasharray="3 3"/><text x="${n[0]+5}" y="${n[1]}" fill="#e9fbff">n</text><circle cx="${pp[0]}" cy="${pp[1]}" r="6" fill="${color}" stroke="#0b1d24"/><text x="${pp[0]+9}" y="${pp[1]+18}">P</text>`:''}
 <text x="${fp[0]+6}" y="${fp[1]-6}" class="tree-small">din o (cameră)</text>
 <text x="${project(a)[0]-14}" y="${project(a)[1]+16}">A</text><text x="${project(b)[0]+6}" y="${project(b)[1]+16}">B</text><text x="${project(c)[0]+8}" y="${project(c)[1]+4}">C</text>
 <text x="8" y="20" fill="${color}">${label}</text>
 </svg>`;
}
export function triangleIllustration(u=primaryUV.u,v=primaryUV.v,parallel=false){
 const {a,b,c,o,d}=triangleScene(u,v,parallel),result=triangleIntersection(o,d,a,b,c),hit=Boolean(result?.hit),color=hit?'#8ce3b6':'#f19489';
 const svg=baseFigure(u,v,parallel,color,!parallel,`${parallel?'PARALEL · det ≈ 0':hit?'HIT':'MISS'}${result?` · t = ${result.t.toFixed(2)}`:''}`);
 return {svg,result,summary:`triunghiul ${primary.index} din ${primary.count} · u=${u.toFixed(2)} · v=${v.toFixed(2)} · 1−u−v=${(1-u-v).toFixed(2)} · ${parallel?'det≈0':hit?'HIT':'MISS'}`};
}
/** Möller–Trumbore, one line at a time, on the same triangle and ray. */
export interface MTStep {code:string;value:string;note:string;exit?:'hit'|'miss'}
const fmt=(v:number)=>Math.abs(v)<5e-4?'0.000':v.toFixed(3),vec=(v:Vec3)=>`(${v.map(x=>Math.abs(x)<5e-3?'0.00':x.toFixed(2)).join(', ')})`;
export function mollerTrumboreSteps(u=primaryUV.u,v=primaryUV.v,parallel=false):MTStep[]{
 const {a,b,c,o,d}=triangleScene(u,v,parallel);
 const e1=sub(b,a),e2=sub(c,a),P=crossv(d,e2),det=dotv(e1,P),steps:MTStep[]=[
  {code:'e₁ = B − A',value:vec(e1),note:'Prima muchie a triunghiului.'},
  {code:'e₂ = C − A',value:vec(e2),note:'A doua muchie. e₁ și e₂ formează baza planului.'},
  {code:'P = d × e₂',value:vec(P),note:'Vector auxiliar. Îl folosim pentru det și pentru u.'},
  {code:'det = e₁ · P',value:fmt(det),note:'Dacă det ≈ 0, raza este paralelă cu planul.'}];
 if(Math.abs(det)<1e-8){steps[3].exit='miss';steps[3].note='det ≈ 0: raza este paralelă cu planul. Ieșim.';return steps;}
 const T=sub(o,a),uu=dotv(T,P)/det;
 steps.push({code:'T = o − A',value:vec(T),note:'Originea razei, relativ la vârful A.'},{code:'u = (T · P) / det',value:fmt(uu),note:'Ponderea lui B.'});
 if(uu<0||uu>1){steps[5].exit='miss';steps[5].note=`u = ${fmt(uu)} este în afara [0, 1]. Ieșim fără v și t.`;return steps;}
 const Q=crossv(T,e1),vv=dotv(d,Q)/det;
 steps.push({code:'Q = T × e₁',value:vec(Q),note:'Al doilea vector auxiliar.'},{code:'v = (d · Q) / det',value:fmt(vv),note:'Ponderea lui C.'});
 if(vv<0||uu+vv>1){steps[7].exit='miss';steps[7].note=vv<0?`v = ${fmt(vv)} < 0. Ieșim fără t.`:`u + v = ${fmt(uu+vv)} > 1. Ieșim fără t.`;return steps;}
 const t=dotv(e2,Q)/det;
 steps.push({code:'t = (e₂ · Q) / det',value:fmt(t),note:t>1e-4?`Hit la ${t.toFixed(2)} unități de cameră. Acesta este punctul de pe sferă.`:'t ≤ ε: triunghiul este în spatele originii.',exit:t>1e-4?'hit':'miss'});
 return steps;
}
export function mollerTrumboreFigure(u=primaryUV.u,v=primaryUV.v,parallel=false,step=0){
 const {a,b,c}=triangleScene(u,v,parallel),{project}=frame(),steps=mollerTrumboreSteps(u,v,parallel),last=steps[Math.min(step,steps.length-1)];
 const done=step>=steps.length-1,hit=done&&last.exit==='hit',miss=done&&last.exit==='miss',color=hit?'#8ce3b6':miss?'#f19489':'#ffd294';
 const arrow=(from:Vec3,to:Vec3,col:string,label:string,show:boolean)=>{if(!show)return '';const f=project(from),t=project(to);return `<path d="M${f.join(',')}L${t.join(',')}" stroke="${col}" stroke-width="3.5" marker-end="url(#mt-${col.slice(1)})"/><text x="${(f[0]+t[0])/2+8}" y="${(f[1]+t[1])/2+16}" fill="${col}">${label}</text>`;};
 const markers=`<defs>${['#ffb36b','#3f6fd9'].map(col=>`<marker id="mt-${col.slice(1)}" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="${col}"/></marker>`).join('')}</defs>`;
 return baseFigure(u,v,parallel,color,hit,hit?`HIT · t = ${steps.at(-1)!.value}`:miss?'MISS':`pas ${step+1}/${steps.length}`,markers+arrow(a,b,'#ffb36b','e₁',step>=0)+arrow(a,c,'#3f6fd9','e₂',step>=1));
}
