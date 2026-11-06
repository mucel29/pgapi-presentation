import {add,mul,sub,normalize,triangleIntersection,type Vec3} from '../core/math.ts';
export function triangleIllustration(u=.25,v=.35,parallel=false){
 const a:Vec3=[0,0,0],b:Vec3=[4,0,0],c:Vec3=[1.2,3,0],o:Vec3=[1.1,1,4],p=add(a,add(mul(sub(b,a),u),mul(sub(c,a),v))),d:Vec3=parallel?[1,0,0]:normalize(sub(p,o));
 const result=triangleIntersection(o,d,a,b,c),hit=Boolean(result?.hit),color=hit?'#8ce3b6':'#f19489';
 const project=(p:Vec3)=>[32+p[0]*75+p[2]*12,205-p[1]*48-p[2]*15],point=(p:Vec3)=>project(p).join(','),pp=project(p),op=project(o),n=project(add(p,[0,0,2]));
 const end=parallel?project(add(o,[3,0,0])):project(add(p,mul(d,1.3)));
 const svg=`<svg viewBox="0 0 400 240" role="img" aria-label="Intersecția calculată dintre o rază și un triunghi; coordonate baricentrice interactive">
 <defs><marker id="tri-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="${color}"/></marker></defs>
 <path d="M15 218H375V48H15Z" fill="#16333b" stroke="#476468" stroke-dasharray="4 6"/>
 <polygon points="${point(a)} ${point(b)} ${point(c)}" fill="#244f51"/>
 <polygon points="${point(p)} ${point(b)} ${point(c)}" fill="#a57451" opacity=".4"/><polygon points="${point(a)} ${point(p)} ${point(c)}" fill="#507d9b" opacity=".4"/><polygon points="${point(a)} ${point(b)} ${point(p)}" fill="#70965b" opacity=".4"/>
 <path d="M${point(a)}L${point(b)}L${point(c)}Z" stroke="#f0cc8c" stroke-width="3" fill="none"/>
 <path d="M${op}L${end}" stroke="${color}" stroke-width="3" marker-end="url(#tri-arrow)"/>
 <path d="M${pp}L${n}" stroke="#75e5e7" stroke-width="2"/><text x="${n[0]+6}" y="${n[1]-3}" fill="#75e5e7">n</text>
 <circle cx="${op[0]}" cy="${op[1]}" r="6" fill="#eee8cb"/><text x="${op[0]+12}" y="${op[1]-8}">o</text>
 <circle cx="${pp[0]}" cy="${pp[1]}" r="6" fill="${color}"/><text x="${pp[0]+10}" y="${pp[1]+20}">P</text>
 <text x="18" y="232">A</text><text x="334" y="232">B</text><text x="112" y="43">C</text>
 <text x="245" y="28" fill="${color}">${parallel?'PARALEL':hit?'HIT':'MISS'}</text>
 <text x="245" y="53">${parallel?'det ≈ 0':`t = ${result!.t.toFixed(3)}`}</text>
 </svg>`;
 return {svg,result,summary:`u=${u.toFixed(2)} · v=${v.toFixed(2)} · 1−u−v=${(1-u-v).toFixed(2)} · ${parallel?'det≈0':hit?'HIT':'MISS'}`};
}
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
