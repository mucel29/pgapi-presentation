import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const workspace=process.cwd();
const runtime='/home/mucel/.cache/codex-runtimes/codex-primary-runtime/dependencies';
const skill='/home/mucel/.codex/plugins/cache/openai-primary-runtime/presentations/26.1116.12020/skills/presentations';
process.env.RUNTIME_NODE_MODULES=path.join(runtime,'node/node_modules');
process.env.RUNTIME_NODE=path.join(runtime,'node/bin/node');
const {Presentation,PresentationFile}=await import(pathToFileURL(path.join(runtime,'node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs')).href);
const {finalizePresentation}=await import(pathToFileURL(path.join(skill,'container_tools/artifact_tool_utils.mjs')).href);
const {chapters,sources,glossary}=JSON.parse(await fs.readFile('.build/deck-content.json','utf8'));
const build=path.join(workspace,'.build/screenshot-deck');
const captures=path.join(workspace,'.build/screenshot-deck-captures-fhd');
await fs.mkdir(path.join(build,'slides'),{recursive:true});
const deck=Presentation.create({slideSize:{width:1280,height:720}});
const font='DejaVu Sans',mono='DejaVu Sans Mono';
const titles=['Algoritmul Ray Tracing','Raza primară','Prima intersecție','Difuzie','Reflexie și refracție','Samples și bounces','Bucla de path tracing','Costul intersecțiilor','BVH','Surface Area Heuristic','Intersecția rază–AABB','Traversarea BVH','Zgomot și acumulare','Denoising ghidat','Contribuția la pixel'];
const descriptions={
 room:'Culoarea unui pixel rezultă din contribuțiile luminii de-a lungul traseelor.\nDemonstrația urmărește o rază din cameră până la sursă.',
 ray:'Camera și un punct ales în pixel definesc direcția inițială.\nEcuația r(t) = o + t·d descrie fiecare segment al traseului.',
 hit:'Păstrăm cea mai apropiată intersecție din fața camerei.\nPentru un mesh, testăm dacă punctul de pe plan se află în triunghi.',
 diffuse:'La o suprafață mată alegem o direcție din emisferă.\nSampling-ul ponderat cu cosinusul simplifică ponderea la albedo.',
 materials:'Oglinda reflectă raza, iar sticla o poate refracta.\nUnghiul și indicele de refracție determină direcția transmisă.',
 samples:'Un sample este un traseu estimat pentru pixel.\nMai multe bounces permit contribuții indirecte din trasee mai lungi.',
 loop:'L adună contribuțiile luminii, iar β păstrează ponderea traseului.\nFiecare interacțiune actualizează β înainte de continuare.',
 cost:'Căutarea liniară testează toate triunghiurile pentru fiecare rază.\nCostul crește odată cu geometria și cu numărul de raze.',
 bvh:'Cutiile ierarhice grupează triunghiurile scenei.\nCând raza ratează o cutie, respingem întregul subarbore.',
 sah:'SAH estimează costul unei împărțiri din arii și numărul primitivelor.\nConstructorul alege dintre planele candidate ale fiecărei axe.',
 aabb:'Fiecare axă produce un interval de valori t.\nRaza traversează cutia dacă cele trei intervale au o parte comună.',
 traversal:'Vizităm întâi copilul mai apropiat și actualizăm tClosest la hit.\nO cutie cu tNear > tClosest nu poate îmbunătăți rezultatul.',
 noise:'Media mai multor samples reduce variația estimării.\nEroarea standard scade aproximativ cu 1/√N.',
 denoise:'Normal, depth și albedo reduc amestecul între suprafețe diferite.\nFiltrul spațial poate netezi zgomotul, dar poate pierde detalii.',
 light:'Fiecare sample întoarce o estimare a luminii pentru pixel.\nAcumularea are loc în RGB liniar, înaintea transformării de afișare.'
};
function box(s,name,value,x,y,w,h,size,{bold=false,color='#F1EFE3',typeface=font}={}){
 const t=s.shapes.add({name,geometry:'textbox',position:{left:x,top:y,width:w,height:h},fill:'none',line:{fill:'none',width:0}});
 t.text=value;t.text.style={fontSize:size,typeface,color,bold,insets:{left:0,right:0,top:0,bottom:0},verticalAlignment:'middle',wrap:'none',autoFit:'none'};
 return t;
}
function gradient(s,{code=false}={}){
 s.shapes.add({name:'Overlay gradient pentru contrastul textului',geometry:'rect',position:{left:0,top:code?0:430,width:1280,height:code?720:290},fill:code?{type:'gradient',gradientKind:'linear',angleDeg:0,stops:[{offset:0,color:'#06171D/98'},{offset:66000,color:'#06171D/94'},{offset:100000,color:'#06171D/65'}]}:{type:'gradient',gradientKind:'linear',angleDeg:90,stops:[{offset:0,color:'#06171D/0'},{offset:35000,color:'#06171D/74'},{offset:100000,color:'#06171D/98'}]},line:{fill:'none',width:0}});
}
function caption(s,label,description){
 gradient(s);
 box(s,'Titlu editabil',label,48,542,1184,64,'32pt',{bold:true});
 box(s,'Descriere editabilă',description,48,610,1184,78,'20pt',{color:'#DBE5E2'});
}
async function screenshot(file,label){
 const s=deck.slides.add();s.background.fill='#10262D';
 s.images.add({name:'Captură reală Full HD din demonstrația web',blob:await fs.readFile(file),contentType:'image/png',position:{left:0,top:0,width:1280,height:720},fit:'contain',alt:`Captură reală Full HD din demonstrația web: ${label}`});
 return s;
}
async function detail(s,file,frame){
 s.images.add({blob:await fs.readFile(file),contentType:'image/png',position:frame,fit:'contain',alt:'Detaliu decupat fără redimensionare din captura Full HD a experimentului din demonstrația web'});
}
const codeSlides={
 hit:{title:'Shader · intersecția rază–triunghi',code:`vec3 e1 = b - a, e2 = c - a;
vec3 p = cross(d, e2);
float det = dot(e1, p);
if (abs(det) < 1e-8) return false;
vec3 tv = o - a;
float u = dot(tv, p) / det;
vec3 q = cross(tv, e1);
float v = dot(d, q) / det;
float t = dot(e2, q) / det;
return u >= 0.0 && v >= 0.0
    && u + v <= 1.0 && t > 1e-4;`,description:'Coordonatele u și v verifică interiorul triunghiului.\nValoarea t localizează intersecția de-a lungul razei.',notes:'GLSL didactic, adaptat din implementarea TypeScript src/core/math.ts, triangleIntersection și intersectTriangle. Corpul unei funcții bool, cu o,d,a,b,c ca parametri vec3. Test pe ambele fețe. det aproape nul respinge razele paralele și triunghiurile degenerate. Pragurile numerice sunt didactice, dependente de scara scenei. Un integrator complet păstrează și t, normala și identificatorul primitivei. Nu este un extras din shaderul de producție. Möller–Trumbore: https://doi.org/10.1080/10867651.1997.10487468'},
 loop:{title:'Shader · radiance și throughput',code:`vec3 L = vec3(0.0), beta = vec3(1.0);
for (int b = 0; b < maxBounces; ++b) {
  Hit h = intersectScene(ray);
  if (!h.found) { L += beta * envMIS(ray); break; }
  L += beta * emittedMIS(h);
  L += beta * directMIS(h); // include shadow ray
  BSDFSample s = sampleBSDF(h, ray);
  if (!s.valid) break;
  beta *= s.weight;
  ray = spawnOffsetRay(h, s.direction);
}`,description:'β multiplică fiecare contribuție adăugată în L.\nPentru o BSDF continuă, s.weight = f·|n·ω| / pdf.',notes:'GLSL didactic, schematic. Adaptat din src/content/chapters.ts, capitolul loop. Tipurile și helper-ele sunt abstracții, nu o unitate compilabilă independent. envMIS, emittedMIS și directMIS includ ponderile MIS coerente dintre estimarea prin lumină și estimarea prin BSDF. directMIS include testul de vizibilitate cu o rază de umbră. s.weight ascunde tratarea distribuțiilor delta și factorii de transport la transmisie. Russian roulette este omisă din excerpt. Dacă supraviețuirea are probabilitatea p, throughput-ul supraviețuitorului trebuie împărțit la p. Rendererul real este PhysicalPathTracingMaterial din three-gpu-pathtracer 0.0.23. Sursă conceptuală: https://pbr-book.org/4ed/Light_Transport_I_Surface_Reflection/A_Better_Path_Tracer'},
 aabb:{title:'Shader · testul slab pentru AABB',code:`float tNear = 0.0, tFar = closest;
for (int a = 0; a < 3; ++a) {
  if (abs(d[a]) < 1e-8) {
    if (o[a]<bmin[a] || o[a]>bmax[a]) return false;
  } else {
    float t0=(bmin[a]-o[a])/d[a];
    float t1=(bmax[a]-o[a])/d[a];
    tNear=max(tNear,min(t0,t1));
    tFar=min(tFar,max(t0,t1));
    if (tNear > tFar) return false;
  }
} // interval comun: [tNear, tFar]`,description:'O direcție paralelă cere originea în interiorul slab-ului.\nUn interval comun gol permite respingerea subarborelui BVH.',notes:'GLSL didactic, adaptat din src/core/math.ts, intersectAABB. Fragmentul reprezintă corpul testului, cu o,d,bmin,bmax ca parametri vec3 și closest ca limită float. La încheierea buclei fără return false, testul are hit și funcția completă întoarce true și tNear. near pornește de la zero pentru a căuta în fața originii. far este limitat de cea mai apropiată intersecție cunoscută. Ramura pentru direcții aproape paralele evită împărțirea la zero. Epsilon-ul GLSL este adaptat pentru expunerea didactică, nu prezentat ca prag universal. Implementarea locală TypeScript folosește 1e-10. Nu este un extras din shaderul de producție three-mesh-bvh. Referință: https://pbr-book.org/4ed/Primitives_and_Intersection_Acceleration/Bounding_Volume_Hierarchies'}
};
const assets=[];
for(const [i,c] of chapters.entries()){
 const file=path.join(captures,`${String(i+1).padStart(2,'0')}-${c.id}.png`);
 const s=await screenshot(file,titles[i]);
 if(c.id==='noise'){
  await detail(s,path.join(captures,'noise-1.png'),{left:122,top:142,width:430,height:401});
  await detail(s,path.join(captures,'noise-64.png'),{left:728,top:142,width:430,height:401});
 }
 if(c.id==='denoise')await detail(s,path.join(captures,'denoise-comparison.png'),{left:112,top:148,width:1056,height:396});
 caption(s,titles[i],descriptions[c.id]);
 s.speakerNotes.text=[c.intro,...c.points,c.formula,c.formulaNote,c.notes,`${c.codeLabel}\n${c.code}`,`Cod: ${c.codeSource}`,`Surse:\n${c.sources.join('\n')}`,`Imagine: demonstrația web locală, http://upsilon:4173/?capture=${c.id}. Captură reală realizată la 17 noiembrie 2026, 1920 × 1080. Stilul raster retro păstrează pixelarea intenționată. Scena lecției folosește rasterizare și raze ilustrative. Experimentele de zgomot și denoising sunt sintetice CPU, nu randări ale canionului prin path tracing.`,...glossary.filter(([term])=>c.notes.includes(term)).map(([term,definition])=>`${term}: ${definition}`)].join('\n\n');
 assets.push({slide:deck.slides.items.length,title:titles[i],file,url:`http://upsilon:4173/?capture=${c.id}`});
 if(codeSlides[c.id]){
  const cc=codeSlides[c.id],cs=await screenshot(file,cc.title);
  gradient(cs,{code:true});
  box(cs,'Titlu editabil',cc.title,48,40,1184,68,'32pt',{bold:true});
  box(cs,'Tipul fragmentului','GLSL didactic · fragment simplificat',50,112,1180,36,'18pt',{color:'#8ED7D0'});
  box(cs,'Cod GLSL editabil',cc.code,50,176,1180,416,'22pt',{typeface:mono,color:'#EEF1E4'});
  box(cs,'Explicație shader',cc.description,50,616,1180,76,'20pt',{color:'#D1DFDC'});
  cs.speakerNotes.text=cc.notes+'\n\nFundal: aceeași captură reală din demonstrația web ca în capitolul precedent, cu overlay gradient pentru lizibilitate. Codul este text editabil.';
  assets.push({slide:deck.slides.items.length,title:cc.title,file,shader:true});
 }
}
{
 const file=path.join(captures,'16-code-ui.png'),s=await screenshot(file,'Anexă · Implementare');
 caption(s,'Anexă · Implementare','TypeScript și Three.js susțin scena și experimentele didactice.\nRendererul opțional folosește three-gpu-pathtracer și three-mesh-bvh.');
 s.speakerNotes.text=`Implementarea didactică: TypeScript, Three.js, BVH construit prin binned SAH și traversare CPU cu copii ordonați după tNear. Rendererul opțional folosește three-gpu-pathtracer 0.0.23 și three-mesh-bvh 0.8.3.\n\nÎn GLSL-ul three-mesh-bvh, _bvhIntersectFirstHit folosește semnul direcției pe axa split-ului pentru ordinea copiilor. Stiva este LIFO: copilul îndepărtat intră primul. Shaderul complet include teste de cutii, frunze, limite și decodarea datelor.\n\nSurse:\n${sources.meshbvh}\n${sources.tracer}\n${sources.pbrt}\n\nImagine: captură reală din demonstrația web locală, 17 noiembrie 2026.`;
 assets.push({slide:deck.slides.items.length,title:'Anexă · Implementare',file});
}
{
 const file=path.join(captures,'17-sources-ui.png'),s=await screenshot(file,'Anexă · Surse');
 caption(s,'Anexă · Surse','Algoritmii și implementările de referință sunt citați în notele slide-urilor.\nImaginile provin din demonstrația web a proiectului.');
 const refs=[['Möller–Trumbore','https://doi.org/10.1080/10867651.1997.10487468'],['Ray Tracing in One Weekend',sources.weekend],['Ray Tracing: The Next Week',sources.next],['PBRT · BVH',sources.pbrt],['PBRT · A Better Path Tracer','https://pbr-book.org/4ed/Light_Transport_I_Surface_Reflection/A_Better_Path_Tracer'],['PBRT · Sampling','https://pbr-book.org/4ed/Sampling_Algorithms/Sampling_Multidimensional_Functions'],['three-mesh-bvh',sources.meshbvh],['three-gpu-pathtracer',sources.tracer],['SVGF',sources.svgf],['NVIDIA NRD',sources.nrd],['Intel Open Image Denoise',sources.oidn]];
 s.speakerNotes.text=refs.map(([name,url])=>`${name}\n${url}`).join('\n\n')+'\n\nImagini originale din demonstrația web a proiectului. Three.js, three-mesh-bvh și three-gpu-pathtracer: MIT. Fonturi: DejaVu Sans și DejaVu Sans Mono. SVGF, NRD și OIDN sunt surse de context, nu integrări ale demonstrației.';
 assets.push({slide:deck.slides.items.length,title:'Anexă · Surse',file});
}
await fs.writeFile(path.join(build,'assets.json'),JSON.stringify(assets,null,2));
const candidate=path.join(build,'candidate.pptx'),count=deck.slides.items.length;
await(await PresentationFile.exportPptx(deck)).save(candidate);
console.log('Exported screenshot candidate: '+candidate);
for(const [i,slide] of deck.slides.items.entries()){
 await fs.writeFile(path.join(build,'slides',`slide-${String(i+1).padStart(2,'0')}.png`),new Uint8Array(await(await deck.export({slide,format:'png',scale:1})).arrayBuffer()));
 console.log(`Rendered ${i+1}/${count}`);
}
if(process.env.DECK_EXPORT_ONLY)process.exit(0);
const revision=Date.now(),validated=path.join(workspace,`.build/validated/Ray-Tracing-screenshots-${revision}.pptx`);
const result=await finalizePresentation({workspaceDir:workspace,candidatePath:candidate,finalPath:validated,explicitTotalSlideCount:count,pythonExecutable:path.join(runtime,'python/bin/python3'),integrityValidatorPath:path.join(skill,'container_tools/inspect_presentation_package_integrity.py'),layoutValidatorPath:path.join(skill,'container_tools/inspect_presentation_layout_geometry.py'),layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-heading-fit'],fontPolicy:{basis:'design',families:[font,mono]},verifyArtifactToolImport:true,receiptPath:path.join(build,`validation-${revision}.json`)});
const final=path.join(workspace,'output/Ray-Tracing-Prezentare.pptx');
await fs.copyFile(validated,final);
await fs.copyFile(validated,path.join(workspace,'output/Ray-Tracing-Capturi-Demo.pptx'));
await fs.copyFile(validated,path.join(workspace,'output/Ray-Tracing-FullHD.pptx'));
console.log(JSON.stringify({final,slides:count,package:result.packageIntegrity.status,findings:result.presentationLayout.findingCount,import:result.firstPartyImport}));
