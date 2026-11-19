import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {selectedPathEstimate} from '../src/core/lesson-state.ts';

const workspace=process.cwd();
const runtime='/home/mucel/.cache/codex-runtimes/codex-primary-runtime/dependencies';
const skill='/home/mucel/.codex/plugins/cache/openai-primary-runtime/presentations/26.1116.12020/skills/presentations';
process.env.RUNTIME_NODE_MODULES=path.join(runtime,'node/node_modules');
process.env.RUNTIME_NODE=path.join(runtime,'node/bin/node');
const {Presentation,PresentationFile}=await import(pathToFileURL(path.join(runtime,'node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs')).href);
const {finalizePresentation}=await import(pathToFileURL(path.join(skill,'container_tools/artifact_tool_utils.mjs')).href);
const {chapters,sources,experiments,bvh}=JSON.parse(await fs.readFile('.build/deck-content.json','utf8'));
const build=path.join(workspace,'.build/upload');
await fs.mkdir(path.join(build,'slides'),{recursive:true});
await fs.mkdir(path.join(workspace,'output'),{recursive:true});
const deck=Presentation.create({slideSize:{width:1280,height:720}});
const C={bg:'#10262D',ink:'#EDF0E4',muted:'#B6CFC7',gold:'#FFD091',cyan:'#88D4DB',line:'#52716F',green:'#9DDBB5',red:'#F3A39B',dark:'#0A1C23'};
const font='DejaVu Sans',mono='DejaVu Sans Mono';
function text(s,value,x,y,w,h,size=28,color=C.ink,bold=false,typeface=font){const sh=s.shapes.add({geometry:'textbox',position:{left:x,top:y,width:w,height:h},fill:'none',line:{fill:'none',width:0}});sh.text=value;sh.text.style={fontSize:size,typeface,color,bold,insets:0,verticalAlignment:'top',wrap:'square',autoFit:'none',lineSpacing:1.1};return sh;}
function rect(s,x,y,w,h,fill='none',stroke='none',width=2){return s.shapes.add({geometry:'rect',position:{left:x,top:y,width:w,height:h},fill,line:{fill:stroke,width:stroke==='none'?0:width}});}
function line(s,x,y,xx,yy,color=C.line,width=3){return s.shapes.add({geometry:'line',position:{left:Math.min(x,xx),top:Math.min(y,yy),width:Math.max(.01,Math.abs(xx-x)),height:Math.max(.01,Math.abs(yy-y)),horizontalFlip:xx<x,verticalFlip:yy<y},fill:'none',line:{fill:color,width}});}
function arrow(s,x,y,xx,yy,color=C.gold,width=4){line(s,x,y,xx,yy,color,width);const a=Math.atan2(yy-y,xx-x);for(const d of [-.45,.45])line(s,xx,yy,xx-14*Math.cos(a+d),yy-14*Math.sin(a+d),color,width);}
function dot(s,x,y,color=C.ink,r=6){return s.shapes.add({geometry:'ellipse',position:{left:x-r,top:y-r,width:2*r,height:2*r},fill:color,line:{fill:'none',width:0}});}
function poly(s,pts,fill='none',stroke=C.cyan,width=3){const x=Math.min(...pts.map(p=>p[0])),y=Math.min(...pts.map(p=>p[1])),w=Math.max(1,Math.max(...pts.map(p=>p[0]))-x),h=Math.max(1,Math.max(...pts.map(p=>p[1]))-y);return s.shapes.add({geometry:'custom',position:{left:x,top:y,width:w,height:h},fill,line:{fill:stroke,width},customPaths:[{width:w,height:h,commands:[{moveTo:{x:pts[0][0]-x,y:pts[0][1]-y}},...pts.slice(1).map(p=>({lineTo:{x:p[0]-x,y:p[1]-y}})),{close:{}}]}]});}
function base(title,n){const s=deck.slides.add();s.background.fill=C.bg;text(s,title,64,48,1152,94,46,C.ink,true);text(s,String(n).padStart(2,'0'),1158,662,58,26,17,C.muted,false,mono);return s;}
function formula(s,value,x=64,y=579,w=1120,size=31){text(s,value,x,y,w,70,size,C.gold,false,mono);}
const titles=['Algoritmul Ray Tracing','Raza primară','Intersecția rază–triunghi','Difuzie','Reflexie și refracție','Samples și bounces','Bucla de path tracing','Costul intersecțiilor','BVH','Surface Area Heuristic','Intersecția rază–AABB','Traversarea BVH','Zgomot și acumulare','Denoising ghidat','Contribuția la pixel'];
function notes(s,c){s.speakerNotes.text=[c.intro,...c.points,c.formula,c.formulaNote,c.notes,`${c.codeLabel}\n${c.code}`,`Cod: ${c.codeSource}`,`Surse:\n${c.sources.join('\n')}`].join('\n\n');}
function tree(s,root,x=640,y=220,span=300,levels=2){const nodes=[],pos=new Map();function place(n,xx,yy,sp,d){nodes.push(n);pos.set(n.id,[xx,yy]);if(d<levels)n.children?.forEach((c,i)=>place(c,xx+(i?sp:-sp),yy+132,sp/2,d+1));}place(root,x,y,span,0);for(const n of nodes){const p=pos.get(n.id);for(const child of n.children??[]){const q=pos.get(child.id);if(q)line(s,p[0],p[1]+34,q[0],q[1]-34);}}for(const n of nodes){const [xx,yy]=pos.get(n.id);rect(s,xx-80,yy-34,160,68,n===root?'#344C43':'#17383F',n===root?C.gold:C.line);text(s,`N${n.id}`,xx-62,yy-23,124,30,25,n===root?C.gold:C.ink,true,mono);text(s,`${n.indices.length} triunghiuri`,xx-66,yy+9,140,27,18,C.muted);}}
function pixels(s,values,x,y,cell){for(let i=0;i<values.length;i++){const n=Math.round(25+values[i]*210),hex='#'+[Math.round(n*.87),n,Math.round(n*.95)].map(v=>v.toString(16).padStart(2,'0')).join('');rect(s,x+(i%20)*cell,y+Math.floor(i/20)*cell,cell+.1,cell+.1,hex);}}

for(const [i,c] of chapters.entries()){
 const s=base(titles[i],i+1);notes(s,c);
 if(c.id==='room'){
  text(s,'Culoarea unui pixel',64,174,1100,65,36,C.gold);
  rect(s,550,288,250,174,'#173A43',C.cyan,3);rect(s,564,302,222,146,'#203F45');rect(s,654,355,31,31,C.gold);line(s,675,462,675,495,C.cyan,4);line(s,623,497,727,497,C.cyan,4);
  dot(s,205,526,C.ink,10);arrow(s,205,526,1085,268);dot(s,1085,268,C.gold,9);text(s,'cameră',134,552,210,44,28,C.muted);text(s,'pixel',634,249,160,42,28,C.gold);text(s,'scenă',1035,206,170,42,28,C.muted);
  s.speakerNotes.text+='\n\nDiagrama este schematică: raza primară pornește din camera virtuală și trece printr-un punct ales în pixel. Ray tracing rezolvă intersecții geometrice. Path tracing folosește aceste interogări într-un estimator al transportului de lumină. Prezentarea este autonomă și nu necesită rularea demonstrației web.';
 }else if(c.id==='ray'){
  dot(s,176,477,C.ink,10);rect(s,447,242,120,260,'#173A43',C.cyan,3);rect(s,488,363,32,32,C.gold);arrow(s,176,477,1138,188);dot(s,868,269,C.cyan,8);
  text(s,'o',143,420,90,46,34,C.gold,false,mono);text(s,'pixel',448,526,200,45,28,C.muted);text(s,'d',1085,225,90,46,34,C.gold,false,mono);text(s,'r(t)',865,308,200,45,30,C.cyan,false,mono);formula(s,'r(t) = o + t·d     t ≥ 0');
 }else if(c.id==='hit'){
  const a=[374,504],b=[1050,504],cc=[633,197],p=[634,396];poly(s,[a,b,cc],'#20474B',C.cyan);poly(s,[a,b,p],'#385247',C.line,1);poly(s,[a,p,cc],'#254C5A',C.line,1);arrow(s,435,199,...p);dot(s,...p,C.gold,8);
  for(const [v,xy] of [['A',[336,518]],['B',[1065,518]],['C',[622,150]],['P',[651,405]]])text(s,v,...xy,80,45,30,v==='P'?C.gold:C.ink,false,mono);
  text(s,'u ≥ 0\nv ≥ 0\nu + v ≤ 1',64,253,270,164,31,C.gold,false,mono);formula(s,'o + td = A + u(B−A) + v(C−A)',64,590,1130,29);
 }else if(c.id==='diffuse'){
  line(s,325,504,1135,504,C.line,4);arrow(s,733,504,733,179,C.cyan);text(s,'n',751,177,70,50,32,C.cyan,false,mono);
  for(const d of experiments.diffuse)arrow(s,733,504,733+d[0]*305+d[2]*50,504-d[1]*280,'#5DABB6',2);arrow(s,485,243,733,504,C.gold,4);dot(s,733,504,C.cyan,8);text(s,'ρ',64,245,140,98,70,C.cyan,true,mono);formula(s,'f = ρ/π     p(ω) = cosθ/π     β ← β·ρ',64,590,1152,28);
 }else if(c.id==='materials'){
  text(s,'reflexie',64,167,500,50,30,C.gold);line(s,104,468,523,468,C.line,4);line(s,312,467,312,240,C.cyan,2);arrow(s,125,267,312,468);arrow(s,312,468,499,267);text(s,'θᵢ = θᵣ',190,513,340,50,30,C.gold,false,mono);
  text(s,'refracție',680,167,500,50,30,C.cyan);rect(s,858,246,122,281,'#234A55',C.cyan,3);const a=43*Math.PI/180,p=27*Math.PI/180,y0=348,y1=y0+122*Math.tan(p);line(s,786,y0,1025,y0,C.line,2);line(s,925,y1,1112,y1,C.line,2);arrow(s,728,y0-130*Math.tan(a),858,y0);arrow(s,858,y0,980,y1);arrow(s,980,y1,1107,y1+127*Math.tan(a));text(s,'43°',768,342,100,45,26,C.gold,false,mono);text(s,'27°',879,394,90,45,26,C.gold,false,mono);text(s,'n = 1.5',856,542,280,45,27,C.cyan,false,mono);formula(s,'n₁ sinθ₁ = n₂ sinθ₂',64,615,1130,30);
 }else if(c.id==='samples'){
  text(s,'32',64,190,500,110,86,C.gold,true,mono);text(s,'trasee / pixel',64,306,500,55,32,C.muted);for(let j=0;j<8;j++)for(let k=0;k<4;k++)line(s,74+j*53,410+k*31,104+j*53,390+k*31,C.gold,3);
  text(s,'8',694,190,500,110,86,C.cyan,true,mono);text(s,'segmente / traseu, max.',694,306,510,70,30,C.muted);for(let j=0;j<=8;j++){dot(s,713+j*56,457,C.cyan,7);if(j<8)line(s,721+j*56,457,761+j*56,457,C.cyan,3);}formula(s,'32 × 8 = 256 interogări, max.',64,590,1152,31);
  text(s,'Fără razele de umbră',64,648,1000,30,20,C.muted);
 }else if(c.id==='loop'){
  const steps=['Rază primară','Closest hit','Emisie + lumină directă','Sampling BSDF','Actualizare β'];steps.forEach((v,j)=>{const y=180+j*79;dot(s,84,y+21,j===4?C.cyan:C.gold,7);text(s,v,122,y,560,58,29);if(j<4)arrow(s,84,y+33,84,y+66,C.line,2);});line(s,579,517,676,517,C.cyan,2);line(s,676,517,676,280,C.cyan,2);arrow(s,676,280,579,280,C.cyan,2);
  text(s,'L',807,197,130,92,70,C.gold,true,mono);text(s,'lumină adunată',807,294,360,50,28,C.muted);text(s,'β',807,389,130,92,70,C.cyan,true,mono);text(s,'ponderea traseului',807,486,390,50,28,C.muted);formula(s,'β ← β · f · |n·ω| / p(ω)',64,613,1152,32);
 }else if(c.id==='cost'){
  text(s,'796 milioane',64,193,1152,137,91,C.gold,true);text(s,'interogări closest-hit, max.',64,344,1152,65,38,C.muted);formula(s,'1920 × 1080 × 64 × 6',64,460,1152,43);text(s,'Brute force: raze × triunghiuri',64,580,1152,55,32,C.cyan);
  s.speakerNotes.text+='\n\nCalcul: 1920 × 1080 × 64 × 6 = 796262400. Buget ilustrativ al segmentelor primare și secundare, nu măsurătoare de performanță. Traseele pot termina mai devreme. Razele de umbră și unele traversări transmisive pot adăuga interogări.';
 }else if(c.id==='bvh'){
  tree(s,bvh.tree,640,220,300,2);text(s,`${bvh.triangleCount} triunghiuri`,64,586,1100,55,37,C.gold);text(s,'Cutie ratată → subarbore eliminat',64,642,1050,39,26,C.muted);
 }else if(c.id==='sah'){
  const sorted=[...bvh.tree.candidates].sort((a,b)=>a.cost-b.cost),items=[sorted[0],sorted[Math.floor(sorted.length/3)],sorted[Math.floor(sorted.length*2/3)]];
  items.forEach((p,j)=>{const y=185+j*114,color=j===0?C.gold:C.cyan;text(s,`${'XYZ'[p.axis]} = ${p.plane.toFixed(2)}`,64,y,340,48,28,color,false,mono);text(s,`${p.left} / ${p.right}`,414,y,270,48,28,C.muted,false,mono);line(s,704,y+20,704+p.cost/bvh.triangleCount*365,y+20,color,18);text(s,p.cost.toFixed(1),1115,y,100,48,29,color,true,mono);});formula(s,'C = Cₜ + Aₗ/Aₚ·Nₗ·Cᵢ + Aᵣ/Aₚ·Nᵣ·Cᵢ',64,580,1152,27);text(s,'Cₜ = Cᵢ = 1',64,635,1060,35,23,C.muted,false,mono);
  s.speakerNotes.text+='\n\nCele trei bare reprezintă candidați reali ai split-ului rădăcinii. Sunt afișate axa și poziția planului, numărul de triunghiuri din cele două grupuri și costul SAH estimat. Ct și Ci sunt normalizate la 1. Bara aurie este cel mai ieftin candidat evaluat în această implementare didactică. Costurile nu sunt timpi GPU.';
 }else if(c.id==='aabb'){
  const d=experiments.slabs,lo=Math.min(0,...d.axes.map(a=>a.near)),hi=Math.max(...d.axes.map(a=>a.far)),x=t=>191+(t-lo)/(hi-lo)*949;rect(s,x(d.near),191,x(d.far)-x(d.near),306,'#35564E');
  d.axes.forEach((a,j)=>{const y=235+j*110,color=[C.gold,C.green,C.cyan][j];text(s,'XYZ'[j],64,y-25,90,50,34,color,true,mono);line(s,191,y,1140,y,C.line,2);line(s,x(a.near),y,x(a.far),y,color,10);text(s,`[${a.near.toFixed(2)}, ${a.far.toFixed(2)}]`,191,y+26,950,44,27,color,false,mono);});formula(s,`HIT: ${d.near.toFixed(2)} ≤ t ≤ ${d.far.toFixed(2)}`,64,590,1152,38);
 }else if(c.id==='traversal'){
  const hit=bvh.traversal.events.find(e=>e.triangle>=0),pruned=bvh.traversal.events.find(e=>e.status==='pruned');
  const xs=[64,495,923];text(s,`N${hit.node.id}`,xs[0],208,290,65,43,C.gold,true,mono);text(s,`hit #${bvh.traversal.triangle}`,xs[0],288,290,65,31,C.muted);arrow(s,344,258,447,258,C.line,4);text(s,'tClosest',xs[1],208,350,65,37,C.cyan,true,mono);text(s,hit.closest.toFixed(2),xs[1],288,350,65,43,C.cyan,false,mono);arrow(s,805,258,878,258,C.line,4);text(s,`N${pruned.node.id}`,xs[2],208,290,65,43,C.red,true,mono);text(s,'eliminat',xs[2],288,290,65,31,C.muted);
  line(s,64,405,1216,405,C.line,2);text(s,'Brute force',64,452,420,50,30,C.muted);text(s,`${bvh.triangleCount} triunghiuri`,64,513,510,70,43,C.gold,true,mono);text(s,'BVH',694,452,500,50,30,C.muted);text(s,`${bvh.traversal.triangleTests} triunghiuri + ${bvh.traversal.boxTests} AABB`,694,519,522,80,32,C.cyan,true,mono);
  s.speakerNotes.text+=`\n\nEvenimente reale pentru aceeași rază de test pe punte: frunza N${hit.node.id} găsește un hit și reduce tClosest la ${hit.closest.toFixed(6)}. Ulterior nodul N${pruned.node.id} este eliminat deoarece intervalul lui începe după closest-hit. Cronologia nu afirmă că aceste două noduri sunt frați. Rezultatul final: triunghiul #${bvh.traversal.triangle}, distanța ${bvh.traversal.closest}, ${bvh.traversal.triangleTests} teste de triunghi și ${bvh.traversal.boxTests} teste AABB, comparativ cu ${bvh.triangleCount} teste brute force.`;
 }else if(c.id==='noise'){
  const a=experiments.accumulation[0],b=experiments.accumulation[3];text(s,'1 sample',64,177,500,50,32,C.gold);text(s,'64 samples',704,177,500,50,32,C.cyan);pixels(s,a.estimate,64,248,24);pixels(s,b.estimate,704,248,24);text(s,`RMSE ${a.rmse.toFixed(3)}`,64,552,500,50,27,C.gold,false,mono);text(s,`RMSE ${b.rmse.toFixed(3)}`,704,552,500,50,27,C.cyan,false,mono);formula(s,'eroare ∝ 1/√N',64,619,600,33);text(s,'Experiment sintetic',704,621,510,44,26,C.muted);
  s.speakerNotes.text+='\n\nExperiment sintetic Bernoulli cu seed fix, grilă 20×12, calculat în src/core/experiments.ts. Imaginile sunt estimări numerice ale unui semnal cunoscut și nu sunt randări ale scenei 3D. RMSE compară estimarea cu probabilitatea exactă a fiecărui pixel. Legea 1/√N descrie eroarea standard așteptată, nu garantează o scădere monotonă a fiecărui pixel într-o realizare.';
 }else if(c.id==='denoise'){
  const x=64,y=209,cell=65;for(let row=0;row<5;row++)for(let col=0;col<7;col++)rect(s,x+col*cell,y+row*cell,cell-4,cell-4,col<4?'#568F95':'#AF8054');line(s,x+4*cell-2,y-12,x+4*cell-2,y+5*cell-4,C.ink,4);dot(s,x+3.5*cell-2,y+2.5*cell-2,C.gold,12);arrow(s,x+3.5*cell,y+2.5*cell,x+4.5*cell,y+2.5*cell,C.red,4);
  text(s,'Ghidaje',704,203,500,65,39,C.gold,true);text(s,'Normală\nAdâncime\nAlbedo',704,292,480,183,34,C.muted);text(s,'Muchii păstrate',64,590,1050,60,37,C.cyan);s.speakerNotes.text+='\n\nDiagrama este conceptuală. Punctul auriu este pixelul filtrat, iar vecinul de peste muchie are o pondere redusă deoarece aparține altei suprafețe. Filtrul spațial à-trous folosește pași de 1, 2 și 4 pixeli și ghidaje de normală, adâncime și albedo. Acumularea brută rămâne separată de rezultat. Un filtru poate șterge detalii, iar reflexiile, sticla și ghidajele incomplete cer atenție. SVGF adaugă informație temporală și varianță. NRD și OIDN sunt implementări de referință, nu integrări ale acestei demonstrații.';
 }else if(c.id==='light'){
  const e=selectedPathEstimate(8),rgb=v=>'['+v.map(n=>n.toFixed(3)).join(', ')+']';text(s,'β',64,193,150,70,48,C.cyan,true,mono);text(s,rgb(e.beta),246,201,960,70,43,C.cyan,false,mono);text(s,'Lₑ',64,297,150,70,48,C.gold,true,mono);text(s,rgb(e.emission),246,305,960,70,43,C.gold,false,mono);line(s,64,411,1216,411,C.line,2);text(s,'ΔL',64,458,150,70,48,C.ink,true,mono);text(s,rgb(e.contribution),246,466,960,70,43,C.ink,true,mono);formula(s,'L += β · Lₑ',64,597,1152,43);
  s.speakerNotes.text+=`\n\nExemplu RGB liniar, pe traseul selectat: beta=${rgb(e.beta)}, emisie=${rgb(e.emission)}, contribuție=${rgb(e.contribution)}. Este o contribuție deterministă ilustrativă. Modelul traseului selectat omite Fresnel, absorbția, PDF și ponderile MIS. Un path tracer complet aplică ponderile estimatorului, iar media unor contribuții independente estimează pixelul. Nu interpretați această singură contribuție drept culoarea finală a imaginii. Sursa numerică: src/core/lesson-state.ts și src/core/transport.ts.`;
 }
}

{
 const s=base('Traversare GPU',16);text(s,'three-mesh-bvh 0.8.3',64,163,1152,40,25,C.cyan);
 text(s,'uint left  = currNodeIndex + 1u;\nuint axis  = boundsInfo.x & 0xffffu;\nuint right = boundsInfo.y;\nbool order = rayDirection[axis] >= 0.0;\nuint nearChild = order ? left : right;\nuint farChild  = order ? right : left;\nstack[++ptr] = farChild;\nstack[++ptr] = nearChild;',64,237,1152,330,27,C.ink,false,mono);
 text(s,'Ordine după semnul direcției pe axa split-ului',64,599,1152,65,29,C.gold);
 s.speakerNotes.text=`Extras reformatat din three-mesh-bvh 0.8.3, src/gpu/glsl/bvh_ray_functions.glsl.js, _bvhIntersectFirstHit. Autor Garrett Johnson și contributori, MIT. Numele sunt prescurtate pentru lizibilitate. Ordinea upstream folosește semnul direcției pe axa split-ului, o euristică diferită de calcularea explicită a tNear pentru fiecare copil din demonstrația CPU. Stiva este LIFO, astfel copilul îndepărtat intră primul și copilul apropiat se procesează primul. Shaderul complet include testele de cutii, frunze, limite și decodarea datelor.\n\nDetalii numerice: tratați separat o componentă de direcție nulă la testul slab. Orientați normala după fața lovită. Folosiți un offset al originii pentru a limita self-intersection. Acumulați în RGB liniar și aplicați transformarea de afișare după estimare.\n\nSurse:\n${sources.meshbvh}\n${sources.tracer}\n${sources.pbrt}`;
}
{
 const s=base('Surse',17);
 const refs=[['Möller–Trumbore','https://doi.org/10.1080/10867651.1997.10487468'],['Ray Tracing in One Weekend',sources.weekend],['PBRT',sources.pbrt],['three-mesh-bvh',sources.meshbvh],['three-gpu-pathtracer',sources.tracer],['SVGF',sources.svgf],['NVIDIA NRD',sources.nrd],['Intel Open Image Denoise',sources.oidn]];
 refs.forEach(([label,url],i)=>{const x=i<4?64:704,y=185+(i%4)*108,sh=text(s,label,x,y,510,54,30,i<4?C.ink:C.cyan);sh.hyperlink={uri:url,isExternal:true};text(s,new URL(url).hostname,x,y+52,510,36,21,C.muted,false,mono);});
 s.speakerNotes.text=refs.map(([a,b])=>a+'\n'+b).join('\n\n')+'\n\nSurse suplimentare:\nhttps://pbr-book.org/4ed/Light_Transport_I_Surface_Reflection/A_Better_Path_Tracer\nhttps://pbr-book.org/4ed/Sampling_Algorithms/Sampling_Multidimensional_Functions\n'+sources.next+'\n\nDiagramele tehnice sunt obiecte editabile. Valorile BVH și sampling provin din codul local al proiectului. Nu au fost realizate randări path-traced pentru această prezentare. Three.js, three-mesh-bvh și three-gpu-pathtracer au licență MIT. Fonturi: DejaVu Sans și DejaVu Sans Mono.';
}
const candidate=path.join(build,'candidate.pptx');
await(await PresentationFile.exportPptx(deck)).save(candidate);
console.log('Candidate exported: '+candidate);
for(let i=0;i<deck.slides.items.length;i++){const slide=deck.slides.items[i];await fs.writeFile(path.join(build,'slides',`slide-${String(i+1).padStart(2,'0')}.png`),new Uint8Array(await(await deck.export({slide,format:'png',scale:1})).arrayBuffer()));console.log(`Rendered ${i+1}/17`);}
if(process.env.DECK_EXPORT_ONLY)process.exit(0);
const final=path.join(workspace,'output/Ray-Tracing-Prezentare.pptx');
const revision=Date.now(),validated=path.join(workspace,`.build/validated/Ray-Tracing-upload-${revision}.pptx`);
await fs.mkdir(path.dirname(validated),{recursive:true});
const result=await finalizePresentation({workspaceDir:workspace,candidatePath:candidate,finalPath:validated,explicitTotalSlideCount:17,pythonExecutable:path.join(runtime,'python/bin/python3'),integrityValidatorPath:path.join(skill,'container_tools/inspect_presentation_package_integrity.py'),layoutValidatorPath:path.join(skill,'container_tools/inspect_presentation_layout_geometry.py'),layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-heading-fit'],fontPolicy:{basis:'design',families:[font,mono]},verifyArtifactToolImport:true,receiptPath:path.join(build,`validation-${revision}.json`)});
await fs.copyFile(validated,final);
console.log(JSON.stringify({final,package:result.packageIntegrity.status,findings:result.presentationLayout.findingCount,import:result.firstPartyImport}));
