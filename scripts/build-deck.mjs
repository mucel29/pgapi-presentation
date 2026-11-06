import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const runtime=process.env.PRESENTATION_RUNTIME??'/home/mucel/.cache/codex-runtimes/codex-primary-runtime/dependencies';
const {Presentation,PresentationFile}=await import(pathToFileURL(path.join(runtime,'node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs')).href);
const {chapters,beats,sources,glossary,bvh,experiments}=JSON.parse(await fs.readFile('.build/deck-content.json','utf8'));
const presentation=Presentation.create({slideSize:{width:1280,height:720}});
const C={bg:'#10262D',ink:'#EDF0E4',muted:'#C0D1C3',quiet:'#91ADA1',gold:'#EDBD7F',cyan:'#88C6C4',line:'#416360',dark:'#091C23',green:'#9CD9B5',red:'#EF9E97',purple:'#CDA7CF'};
const font='DejaVu Sans',mono='DejaVu Sans Mono';
await fs.mkdir('.build/slides',{recursive:true});await fs.mkdir('output',{recursive:true});
function rect(s,x,y,w,h,fill,line='none'){return s.shapes.add({geometry:'rect',position:{left:x,top:y,width:w,height:h},fill,line:{fill:line,width:line==='none'?0:1.5}});}
function text(s,value,x,y,w,h,size=24,color=C.ink,bold=false,typeface=font){const sh=s.shapes.add({geometry:'textbox',position:{left:x,top:y,width:w,height:h},fill:'none',line:{fill:'none',width:0}});sh.text=value;sh.text.style={fontSize:size,typeface,color,bold,insets:0,verticalAlignment:'top',wrap:'square',autoFit:'none',lineSpacing:1.12};return sh;}
function line(s,x,y,xx,yy,color=C.line,width=2){return s.shapes.add({geometry:'line',position:{left:Math.min(x,xx),top:Math.min(y,yy),width:Math.max(.01,Math.abs(xx-x)),height:Math.max(.01,Math.abs(yy-y)),horizontalFlip:xx<x,verticalFlip:yy<y},fill:'none',line:{fill:color,width}});}
function arrow(s,x,y,xx,yy,color=C.gold,width=3){line(s,x,y,xx,yy,color,width);const a=Math.atan2(yy-y,xx-x),r=12;for(const d of [-.45,.45])line(s,xx,yy,xx-r*Math.cos(a+d),yy-r*Math.sin(a+d),color,width);}
function dot(s,x,y,color=C.ink,r=5){return s.shapes.add({geometry:'ellipse',position:{left:x-r,top:y-r,width:r*2,height:r*2},fill:color,line:{fill:'none',width:0}});}
function poly(s,pts,fill='none',stroke=C.cyan,width=2,close=true){const minX=Math.min(...pts.map(p=>p[0])),minY=Math.min(...pts.map(p=>p[1])),w=Math.max(1,Math.max(...pts.map(p=>p[0]))-minX),h=Math.max(1,Math.max(...pts.map(p=>p[1]))-minY);return s.shapes.add({geometry:'custom',position:{left:minX,top:minY,width:w,height:h},fill,line:{fill:stroke,width},customPaths:[{width:w,height:h,commands:[{moveTo:{x:pts[0][0]-minX,y:pts[0][1]-minY}},...pts.slice(1).map(p=>({lineTo:{x:p[0]-minX,y:p[1]-minY}})),...(close?[{close:{}}]:[])]}]});}
async function image(s,id,x,y,w,h){s.images.add({blob:await fs.readFile(`assets/captures/${id}.jpg`),contentType:'image/jpeg',position:{left:x,top:y,width:w,height:h},fit:'cover',alt:`Scenă procedurală rasterizată: ${id}`});}
function header(s,n,label){s.background.fill=C.bg;text(s,label,54,35,1100,24,14,C.cyan,true,mono);line(s,54,676,1226,676);text(s,`${String(n).padStart(2,'0')} / 17`,1130,690,96,17,11,C.quiet,false,mono);}
function title(s,t){text(s,t,54,85,1172,72,43,C.ink,true);}
function left(s,c,{formula=true}={}){text(s,c.slide.intro,54,190,454,112,28,C.muted);let y=326;for(const p of c.slide.points){text(s,'›',54,y,18,36,26,C.gold);text(s,p,82,y,424,82,24);y+=100;}if(formula&&c.slide.formula)text(s,c.slide.formula,54,560,460,80,21,C.gold,false,mono);}
function code(s,value,x,y,w,h,size=19){rect(s,x-14,y-14,w+28,h+28,C.dark);text(s,value,x,y,w,h,size,C.muted,false,mono);}
function caption(s,value,x=584,y=619,w=640,color=C.quiet){text(s,value,x,y,w,42,17,color);}
function nativeTree(s,root,x=913,y=425,span=160,depths=2){const list=[],positions=new Map();function place(n,xx,yy,delta,depth){list.push(n);positions.set(n.id,[xx,yy]);if(depth<depths)n.children?.forEach((ch,i)=>place(ch,xx+(i?1:-1)*delta,yy+76,delta/2,depth+1));}place(root,x,y,span,0);for(const n of list){const p=positions.get(n.id);n.children?.forEach(ch=>{const q=positions.get(ch.id);if(q)line(s,p[0],p[1]+18,q[0],q[1]-18,C.line);});}for(const n of list){const [xx,yy]=positions.get(n.id);rect(s,xx-48,yy-22,96,45,n.id===root.id?'#5D5038':'#20464A',C.line);text(s,`N${n.id} · ${n.indices.length}`,xx-43,yy-12,86,29,17,C.ink,false,mono);}}
function pixelGrid(s,values,width,height,x,y,cell){values.forEach((v,i)=>{const c=Math.round(30+v*215),hex='#'+[Math.round(c*.91),c,Math.round(c*.92)].map(v=>v.toString(16).padStart(2,'0')).join('');rect(s,x+i%width*cell,y+Math.floor(i/width)*cell,cell+.1,cell+.1,hex);});}
const nodes=[];function collect(n){nodes.push(n);n.children?.forEach(collect);}collect(bvh.tree);
const candidates=[...bvh.tree.candidates].sort((a,b)=>a.cost-b.cost),shownCandidates=[candidates[0],candidates[Math.floor(candidates.length/3)],candidates[Math.floor(candidates.length*2/3)]];
const near=n=>Math.max(0,...[0,1,2].map(a=>Math.min((n.min[a]-bvh.rayOrigin[a])/bvh.rayDirection[a],(n.max[a]-bvh.rayOrigin[a])/bvh.rayDirection[a])));
for(const [i,c] of chapters.entries()){
 const s=presentation.slides.add();header(s,i+1,c.section);title(s,c.slide.title);
 if(c.id==='room'){
  text(s,c.slide.intro,54,220,460,150,36,C.gold);await image(s,'room',572,183,654,369);
  text(s,'Intersecții, materiale și accelerare cu BVH',54,470,455,100,25,C.muted);
  text(s,'Programare grafică avansată și prelucrarea imaginilor',54,609,1172,37,20,C.muted);
 }else if(c.id==='ray'){
  left(s,c);rect(s,795,280,90,190,'#1C4148',C.cyan);rect(s,826,356,27,27,C.gold);dot(s,615,480,C.ink,9);arrow(s,615,480,1178,228);
  text(s,'cameră',580,514,170,40,23);text(s,'o',601,435,50,30,24,C.gold,false,mono);text(s,'pixel',797,243,160,34,23,C.gold);text(s,'planul imaginii',747,496,220,48,20,C.muted);
  dot(s,1020,299,C.cyan,6);text(s,'o + td',1012,333,200,40,22,C.cyan,false,mono);text(s,'d',1116,225,70,35,24,C.gold,false,mono);
  caption(s,'Intersecția rezolvă t. Raza nu avansează în pași mici.',584,610,640);
 }else if(c.id==='hit'){
  left(s,c);const A=[622,520],B=[1166,520],D=[795,238],P=[818.55,421.3],M=[1143.7,379];poly(s,[A,B,D],'#21494A',C.gold,3);poly(s,[A,B,P],'#3E6055','none',0);poly(s,[A,P,D],'#344F67','none',0);poly(s,[P,B,D],'#68533C','none',0);poly(s,[A,B,D],'none',C.gold,3);
  arrow(s,727,230,...P,C.green);dot(s,...P,C.green,7);dot(s,...M,C.red,7);text(s,'A',598,531,45,35,24);text(s,'B',1168,531,45,35,24);text(s,'C',782,193,45,35,24);text(s,'P · HIT',834,429,200,35,21,C.green);text(s,'MISS',1112,337,110,35,21,C.red);
  text(s,'u = 0.25 · v = 0.35',635,576,580,30,21,C.cyan,false,mono);caption(s,'În afara triunghiului, deși punctul se află în plan.',584,619,640);
 }else if(c.id==='diffuse'){
  left(s,c);await image(s,'detail-diffuse',584,187,642,350);text(s,'20 de direcții cosine-weighted',584,565,642,36,23,C.cyan);caption(s,'Evantai de alternative; un singur segment continuă traseul.',584,615,642);
 }else if(c.id==='materials'){
  left(s,c);const x0=825,x1=955,y0=345,theta=experiments.glass.incomingAngle*Math.PI/180,phi=experiments.glass.insideAngle*Math.PI/180,y1=y0+130*Math.tan(phi);
  rect(s,x0,215,x1-x0,340,'#234C54',C.cyan);text(s,'aer',648,215,150,34,23);text(s,'n = 1.5',831,176,180,34,21,C.cyan,false,mono);text(s,'aer',1055,215,120,34,23);
  line(s,772,y0,1010,y0,C.cyan);line(s,907,y1,1120,y1,C.cyan);arrow(s,700,y0-125*Math.tan(theta),x0,y0);arrow(s,x0,y0,x1,y1);arrow(s,x1,y1,1100,y1+145*Math.tan(theta));
  text(s,`${experiments.glass.incomingAngle.toFixed(0)}°`,756,306,70,35,22,C.gold,false,mono);text(s,`${experiments.glass.insideAngle.toFixed(0)}°`,857,365,70,35,22,C.gold,false,mono);text(s,`${experiments.glass.exitAngle.toFixed(0)}°`,1024,y1+9,80,35,22,C.gold,false,mono);
  text(s,'Ieșire paralelă, deplasată lateral',584,594,642,40,24,C.green,true);caption(s,'Ramura transmisă · același mediu pe ambele părți',584,640,642);
 }else if(c.id==='samples'){
  text(s,c.slide.intro,54,177,1172,50,29,C.muted);const cols=[{x:74,label:'Samples per pixel',n:'32',color:C.gold},{x:704,label:'Maximum bounces',n:'8',color:C.cyan}];
  cols.forEach(({x,label,n,color})=>{text(s,label,x,265,500,40,25,C.muted);text(s,n,x,318,500,98,76,color,true,mono);});
  for(let j=0;j<8;j++)for(let k=0;k<4;k++)rect(s,78+j*49,449+k*28,34,16,C.gold);for(let j=0;j<8;j++){dot(s,722+j*62,484,C.cyan,6);if(j<7)line(s,728+j*62,484,778+j*62,484,C.cyan,3);}
  text(s,'32 trasee estimate pentru pixel',74,591,530,52,23);text(s,'Până la 8 interacțiuni pe traseu',704,591,522,52,23);
 }else if(c.id==='loop'){
  text(s,c.slide.intro,54,175,1172,50,29,C.muted);const steps=['Rază din cameră','Cel mai apropiat hit','Emisie + direct lighting','Sample BSDF','Actualizează β','Continuă sau termină'];
  steps.forEach((v,j)=>{const y=256+j*60;dot(s,73,y+14,j===4?C.cyan:C.gold,5);text(s,v,103,y,490,40,25);if(j<5)arrow(s,73,y+24,73,y+48,C.line,2);});line(s,570,242,570,635,C.line);
  text(s,'L',635,262,90,80,58,C.gold,true,mono);text(s,'lumină adunată',745,281,470,45,28);text(s,'L += β · contribuție',635,357,580,48,24,C.gold,false,mono);
  text(s,'β',635,448,90,80,58,C.cyan,true,mono);text(s,'ponderea traseului',745,467,470,45,28);text(s,c.slide.formula,635,543,590,48,23,C.cyan,false,mono);caption(s,'Un path produce un sample. MIS evită dublarea contribuțiilor.',635,621,590);
 }else if(c.id==='cost'){
  text(s,'Buget ilustrativ pentru un cadru',54,175,1172,44,29,C.muted);text(s,'796 milioane',54,242,1172,100,78,C.gold,true);text(s,'1920 × 1080 pixeli × 64 samples × până la 6 interacțiuni',54,364,1172,62,28);
  line(s,54,456,1226,456);text(s,'Interogări closest-hit',54,491,520,46,30,C.cyan,true);text(s,'Fiecare cere căutarea\ncelui mai apropiat triunghi.',54,551,520,82,26,C.muted);
  text(s,'Teste cu triunghiuri',692,491,534,46,30,C.cyan,true);text(s,'Brute force: numărul razelor\n× numărul triunghiurilor.',692,551,534,82,26,C.muted);text(s,'Traseele pot termina mai devreme. Shadow rays nu sunt incluse.',54,640,1172,27,17,C.quiet);
 }else if(c.id==='bvh'){
  left(s,c);await image(s,'detail-bvh',584,184,642,190);nativeTree(s,bvh.tree,905,421,160,2);caption(s,'96 de triunghiuri · aceleași grupuri în arbore și în scenă',584,625,642);
 }else if(c.id==='sah'){
  left(s,c,{formula:false});text(s,c.slide.formula,54,561,500,85,20,C.gold,false,mono);text(s,'Trei candidați pe geometria arcului',584,187,642,48,25,C.cyan,true);
  shownCandidates.forEach((p,j)=>{const y=268+j*104;const color=j===0?C.gold:C.cyan;text(s,`${'XYZ'[p.axis]} = ${p.plane.toFixed(2)}`,584,y,265,34,21,C.muted,false,mono);text(s,`${p.left}/${p.right} triunghiuri`,885,y,330,34,20,C.quiet);rect(s,584,y+43,p.cost/96*500,20,color);text(s,p.cost.toFixed(1),1112,y+37,100,40,23,color,true,mono);});
  caption(s,'Cost SAH estimat · Ct = Ci = 1 · mai mic este mai bun',584,619,642);
 }else if(c.id==='aabb'){
  left(s,c);const data=experiments.slabs,lo=Math.min(0,...data.axes.map(a=>a.near)),hi=Math.max(...data.axes.map(a=>a.far)),xx=t=>651+(t-lo)/(hi-lo)*548;
  text(s,'Intervale pentru raza reală de test',584,187,642,48,25,C.cyan,true);rect(s,xx(data.near),254,Math.max(4,xx(data.far)-xx(data.near)),302,'#365958');
  data.axes.forEach((a,j)=>{const y=289+j*98;const color=[C.gold,C.green,C.cyan][j];text(s,'XYZ'[j],584,y-15,45,34,24,color,true,mono);line(s,651,y,1199,y,C.line,1);line(s,xx(a.near),y,xx(a.far),y,color,9);text(s,`${a.near.toFixed(2)} ≤ t ≤ ${a.far.toFixed(2)}`,651,y+23,560,36,21,C.muted,false,mono);});
  text(s,`HIT: ${data.near.toFixed(2)} ≤ t ≤ ${data.far.toFixed(2)}`,584,586,642,45,27,C.green,true,mono);caption(s,'Bandă comună îngustă; toate cele trei condiții sunt adevărate.',584,636,642);
 }else if(c.id==='traversal'){
  text(s,c.slide.intro,54,177,1172,48,29,C.muted);const pruned=bvh.traversal.events.find(e=>e.status==='pruned'),hit=bvh.traversal.events.find(e=>e.triangle>=0),parent=nodes.find(n=>n.children?.some(c=>c.id===pruned.node.id));
  const branches=[{x:190,event:hit,label:'vizitat întâi',color:C.purple},{x:910,event:pruned,label:'eliminat după hit',color:C.red}];rect(s,514,254,252,56,'#25494B',C.line);text(s,`N${parent.id}`,552,265,180,34,25,C.ink,true,mono);
  branches.forEach(({x,event,label,color})=>{line(s,640,310,x+80,365,C.line,3);rect(s,x,366,180,58,'#25494B',color);text(s,`N${event.node.id}`,x+27,378,144,34,25,color,true,mono);text(s,label,x-55,440,340,36,24,color);text(s,`tNear = ${near(event.node).toFixed(2)}`,x-55,493,340,36,23,C.muted,false,mono);});
  text(s,`tClosest = ${hit.closest.toFixed(2)}`,470,512,430,44,28,C.gold,true,mono);text(s,'Același closest-hit: #30',54,590,565,42,26,C.purple,true);text(s,`Brute force: 96 triunghiuri\nBVH: ${bvh.traversal.triangleTests} triunghiuri + ${bvh.traversal.boxTests} AABB-uri`,680,584,546,70,24,C.muted);
 }else if(c.id==='noise'){
  left(s,c);const a=experiments.accumulation[0],b=experiments.accumulation[3];text(s,'1 sample',584,184,270,40,25,C.gold,true);text(s,'64 samples',918,184,308,40,25,C.cyan,true);pixelGrid(s,a.estimate,20,12,584,235,14);pixelGrid(s,b.estimate,20,12,918,235,14);text(s,`RMSE ${a.rmse.toFixed(3)}`,584,425,280,38,22,C.gold,false,mono);text(s,`RMSE ${b.rmse.toFixed(3)}`,918,425,308,38,22,C.cyan,false,mono);
  text(s,'N',584,505,80,32,19,C.quiet,false,mono);text(s,'1       4       16      64      256',665,505,561,32,18,C.quiet,false,mono);text(s,'RMSE',584,549,80,32,19,C.muted,false,mono);text(s,experiments.accumulation.map(d=>d.rmse.toFixed(3)).join('   '),665,549,561,32,18,C.muted,false,mono);caption(s,'Experiment sintetic Bernoulli · RMSE față de semnalul cunoscut',584,619,642);
 }else if(c.id==='denoise'){
  left(s,c);const x=595,y=235,cell=62;for(let row=0;row<5;row++)for(let col=0;col<5;col++)rect(s,x+col*cell,y+row*cell,cell-4,cell-4,col<3?'#548A85':'#AD7A51');line(s,x+3*cell-2,y-12,x+3*cell-2,y+5*cell-4,C.ink,3);dot(s,x+cell*2.5-2,y+cell*2.5-2,C.gold,11);arrow(s,x+2.5*cell,y+2.5*cell,x+3.5*cell,y+2.5*cell,C.red,4);
  text(s,'Altă suprafață',935,293,270,65,25,C.red,true);text(s,'Normal\nDepth\nAlbedo',954,390,260,123,25,C.muted);caption(s,'Ghidajele reduc ponderea vecinului incompatibil.',584,591,642);text(s,'Filtru spațial · acumulare brută separată',584,634,642,30,20,C.cyan);
 }else if(c.id==='light'){
  left(s,c);await image(s,'final',584,184,642,361);text(s,'Curtea rămâne disponibilă pentru explorare',584,577,642,40,25,C.gold,true);caption(s,'Explorarea începe rasterizat. Path tracing cere Start explicit.',584,631,642);
 }
 const travel=beats.filter(b=>b.chapter===c.id&&b.travel).map(b=>`${b.title}: ${b.intro}`).join('\n');
 s.speakerNotes.text=`${c.intro}\n\n${c.points.join('\n\n')}\n\n${c.formula}\n${c.formulaNote}\n\n${c.notes}\n\n${c.codeLabel}\n${c.code}\n\nCod: ${c.codeSource}\n\nSurse:\n${c.sources.join('\n')}${travel?'\n\nTranziții în prezentarea live:\n'+travel:''}\n\nDurată orientativă: ${c.duration}.`;
 if(['room','diffuse','bvh','light'].includes(c.id))s.speakerNotes.text+='\n\nImagine: captură rasterizată a scenei procedurale locale.';
 if(c.id==='noise')s.speakerNotes.text+='\n\nExperiment Bernoulli sintetic, seed 4279, grilă 20×12. Media fiecărui pixel este comparată cu semnalul de probabilitate cunoscut. RMSE-urile afișate provin din src/core/experiments.ts și nu măsoară scena WebGL.';
 if(c.id==='traversal')s.speakerNotes.text+=`\n\nRaza implicită: primul hit în N${bvh.traversal.events.find(e=>e.triangle>=0).node.id}, apoi N${bvh.traversal.events.find(e=>e.status==='pruned').node.id} este eliminat. Numărătoarea finală este de ${bvh.traversal.triangleTests} teste cu triunghiuri și ${bvh.traversal.boxTests} teste AABB.`;
 console.log(`Authored ${i+1}/15`);
}
{
 const s=presentation.slides.add();header(s,16,'ANEXĂ · IMPLEMENTARE');title(s,'Traversare GPU și detalii numerice');
 text(s,'three-mesh-bvh 0.8.3 · extras GLSL',54,176,1172,39,24,C.cyan,true);
 code(s,'uint leftIndex = currNodeIndex + 1u;\nuint axis = boundsInfo.x & 0x0000ffffu;\nuint rightIndex = boundsInfo.y;\n\nbool order = rayDirection[axis] >= 0.0;\nuint c1 = order ? leftIndex : rightIndex;\nuint c2 = order ? rightIndex : leftIndex;\nstack[++ptr] = c2;\nstack[++ptr] = c1;',68,255,710,280,18);
 text(s,'Ordine după axa split-ului',838,248,370,70,26,C.gold,true);text(s,'Demo-ul sortează tNear.\n\nNoduri compacte în texturi.\n\nStivă cu limită în shader.',838,336,370,250,23,C.muted);
 text(s,'Axe paralele · normală orientată · offset după hit · acumulare liniară',54,605,1172,48,22,C.cyan);
 s.speakerNotes.text=`Extras reformatat din three-mesh-bvh 0.8.3, src/gpu/glsl/bvh_ray_functions.glsl.js, _bvhIntersectFirstHit. Autor Garrett Johnson și contributori, licență MIT. Numele splitAxis/leftToRight sunt prescurtate aici la axis/order. Ordinea upstream depinde de semnul direcției pe axa split-ului. Demo-ul didactic calculează tNear pentru fiecare copil. Shaderul complet include limite, intersecții și frunze.\n${sources.meshbvh}\n${sources.tracer}\n${sources.pbrt}\n\n${glossary.map(([a,b])=>a+': '+b).join('\n\n')}\n\nVersiuni: Three.js 0.184.0, three-mesh-bvh 0.8.3 și three-gpu-pathtracer 0.0.23. Rendererul folosit este WebGLPathTracer. Implementarea à-trous din proiect este spațială și păstrează acumularea brută separat.`;
}
{
 const s=presentation.slides.add();header(s,17,'ANEXĂ · BIBLIOGRAFIE');title(s,'Surse și implementări');
 const refs=[['Möller & Trumbore · 1997','https://doi.org/10.1080/10867651.1997.10487468'],['Ray Tracing in One Weekend',sources.weekend],['Ray Tracing: The Next Week',sources.next],['PBRT · BVH',sources.pbrt],['PBRT · A Better Path Tracer','https://pbr-book.org/4ed/Light_Transport_I_Surface_Reflection/A_Better_Path_Tracer'],['PBRT · Sampling','https://pbr-book.org/4ed/Sampling_Algorithms/Sampling_Multidimensional_Functions'],['three-gpu-pathtracer · 0.0.23',sources.tracer],['three-mesh-bvh · 0.8.3',sources.meshbvh],['Schied et al. · SVGF',sources.svgf],['NVIDIA NRD',sources.nrd],['Intel Open Image Denoise',sources.oidn]];
 refs.forEach(([t,url],i)=>{const col=i<6?0:1,row=i<6?i:i-6,x=54+col*610,y=177+row*72;const sh=text(s,t,x,y,557,35,22,C.muted);sh.text.set([[{run:t,link:{uri:url,isExternal:true}}]]);text(s,new URL(url).hostname,x,y+35,557,26,16,C.cyan,false,mono);});
 text(s,'Geometrie procedurală și capturi locale · biblioteci MIT · fonturi DejaVu',54,618,1172,38,19,C.quiet);
 s.speakerNotes.text=refs.map(([a,b])=>a+'\n'+b).join('\n\n')+'\n\nMaterialul de pornire\n'+sources.reference+'\n\nGeometria, texturile și capturile scenei sunt procedurale și locale. Diagramele, contoarele, formulele și codul sunt obiecte editabile. Three.js, three-mesh-bvh și three-gpu-pathtracer: MIT. Fonturi DejaVu incluse local. Graficele de sampling sunt un experiment sintetic separat de path tracing. SVGF, NRD și OIDN sunt surse de context, nu integrări ale proiectului.';
}
await(await PresentationFile.exportPptx(presentation)).save('.build/candidate.pptx');
const renderSlides=process.env.DECK_RENDER_SLIDES?.split(',').map(Number);
for(let i=0;i<presentation.slides.items.length;i++){if(renderSlides&&!renderSlides.includes(i+1))continue;await fs.writeFile(`.build/slides/slide-${String(i+1).padStart(2,'0')}.png`,new Uint8Array(await (await presentation.export({slide:presentation.slides.items[i],format:'png',scale:1})).arrayBuffer()));console.log(`Rendered ${i+1}/17`);}
if(!process.env.DECK_RENDER_ONLY){const {finalizeDeck}=await import('./finalize-deck.mjs');await finalizeDeck();}
