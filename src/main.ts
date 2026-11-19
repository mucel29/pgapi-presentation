import './style.css';
import {chapters,beats,sources,type Beat} from './content/chapters';
import {Journey} from './engine/journey';
import type {Node} from './core/bvh';
import {triangleIllustration,mollerTrumboreFigure,mollerTrumboreSteps,primaryUV} from './ui/illustrations';
import {ImageComparison} from './ui/image-comparison';
import {TemporalDemo,temporalModes,temporalModeNote,type TemporalMode} from './ui/temporal-demo';
import {glassIllustration,reflectionIllustration,slabIllustration} from './ui/experiments';
import {presentationLayout,type PresentationMode} from './ui/layout';
import {ModalPause,traversalSummary,graphicsFeedback,routeHash} from './ui/session-state';
import {drawDenoiseComparison,denoisePipelineSvg} from './ui/denoise-demo';
import {teachingCopy,sourceTitles} from './ui/teaching-copy';
import {selectedPathEstimate,loopStageState} from './core/lesson-state';
import {materialThroughput,metalReflectance} from './core/transport';
import {cameraPixel,illustratedSamples} from './core/sampling';
import {exampleCount,loopLessonDiagram,loopOperations,loopShortNotes,loopLabels,rgbText,rgbSwatch} from './ui/path-lesson';
const $=<E extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as E;
const escape=(s:string)=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const arrow='<svg viewBox="0 0 24 24" fill="none"><path d="M4 12h15m-6-6 6 6-6 6" stroke="currentColor" stroke-width="1.5"/></svg>';
document.querySelector('#app')!.innerHTML=`
<canvas id="scene" aria-label="Cameră cu PC și observator într-un canion 3D"></canvas><div class="shade"></div>
<header><a class="subject" href="#chapter=room">RAY TRACING</a><nav id="progress" aria-label="Capitole"></nav><button id="overview-open">Cuprins <kbd>O</kbd></button><button id="fullscreen" aria-label="Ecran complet">⛶</button></header>
<main id="presentation" aria-label="Lecție și demonstrație interactivă"><div id="lesson-scroll"><article id="chapter"><div id="section" class="eyebrow"></div><h1 id="title"></h1><p id="intro"></p><p id="reasoning"></p><ul id="points"></ul><div id="formula-block"><div id="formula"></div><p id="formula-note"></p></div><div class="actions"><button id="code-open"><kbd>C</kbd> Cod</button><button id="notes-open" aria-label="Detalii (N)">Detalii</button><button id="replay" aria-label="Reia animația">↻</button></div><button id="explore" class="primary hidden">Explorare ${arrow}</button></article>
<aside id="inline-code" class="panel hidden"><div id="inline-label" class="eyebrow"></div><pre id="inline-content"></pre><span id="inline-source"></span></aside>
<aside id="bvh-panel" class="panel hidden"><div class="panel-heading"><span id="bvh-heading">BVH</span><span id="bvh-count"></span></div><div id="tree"></div><div id="sah-chart" class="hidden"></div><div id="slabs" class="hidden"></div><div id="trace-status"></div><div id="bvh-ray-cases"><button data-ray-case="hit">Raza traseului</button><button data-ray-case="other">Lovește modelul</button><button id="bvh-ray-pick">Alege pe model</button></div><div id="bvh-controls"><button id="trace-replay">|← Primul</button><button id="step-prev">← Pas</button><button id="step-next">Pas →</button><button id="trace-last">Ultimul →|</button><button id="trace-play">Rulează ▶</button></div></aside>
<aside id="algorithm-panel" class="panel hidden"><div id="algorithm-heading" class="eyebrow"></div><div id="algorithm-figure"></div><div id="triangle-controls"><label>u <input id="triangle-u" type="range" min="-.25" max="1.25" step=".01" value=".25"/></label><label>v <input id="triangle-v" type="range" min="-.25" max="1.25" step=".01" value=".35"/></label><div class="triangle-presets"><button data-tri="inside">Raza reală</button><button data-tri="edge">Muchie</button><button data-tri="outside">În afară</button><button data-tri="parallel">Paralel</button></div></div><div id="mt-controls" class="hidden"><button id="mt-prev">← Pas</button><button id="mt-next">Pas →</button><button id="mt-all">Tot →|</button></div><div id="flow-controls" class="hidden"><button id="flow-step">Pas algoritm →</button><button id="flow-play">Animație ▶</button></div><p id="algorithm-status" aria-live="polite"></p></aside>
<aside id="material-panel" class="panel hidden"><div id="material-label" class="eyebrow"></div><div id="glass-figure"></div><p id="glass-answer">Ieșire paralelă cu direcția inițială, deplasată lateral.</p></aside>
<aside id="sample-budget" class="hidden"></aside>
<aside id="contribution-panel" class="hidden"></aside><div id="scene-caption" class="hidden"></div>
<aside id="sampling-panel" class="panel hidden"></aside><aside id="temporal-panel" class="panel hidden"></aside><aside id="denoise-panel" class="panel hidden"></aside>
<div id="ray-status"><span class="cyan">●</span><span id="ray-info"></span><span id="beta-info"></span></div>
</div><div id="lesson-tools"></div></main><div id="pixel-marker" class="hidden" aria-hidden="true"></div><div id="image-frame" class="hidden" aria-label="Imaginea camerei virtuale inițiale"><span>CAMERA INIȚIALĂ</span><i id="image-pixel"><b>pixel q</b></i></div><div id="world-labels" aria-hidden="true"></div><p id="graphics-fallback" class="hidden" role="status">Grafica 3D nu este disponibilă. Poți continua lecția, figurile interactive și explicațiile. Încearcă reîncărcarea paginii sau un browser cu WebGL 2.</p>
<section id="explorer" class="panel hidden"><div class="explorer-heading"><div class="eyebrow">EXPLORARE</div><button id="explorer-toggle" aria-expanded="true">Restrânge setările</button></div><div id="explorer-body"><h2>Observatorul din canion</h2><p id="explore-status">Rasterizare · path tracer oprit</p><button id="start-tracing" class="primary">Start path tracing</button><button id="stop-tracing" class="hidden">Oprește path tracing</button><div id="tracer-controls" class="hidden">
<p class="settings-note">Rezoluția schimbă rasterizarea acum. Celelalte opțiuni se aplică după Start.</p><label>Rezoluție raster / tracer<select id="scale"><option value=".25">25%</option><option value=".5">50%</option><option value=".75">75%</option><option value="1" selected>100% · max 1280 × 720</option></select></label><label>Samples / update<select id="updates"><option>1</option><option>2</option><option>4</option></select></label><label>BSDF principal<select id="bounces"><option>2</option><option>4</option><option selected>8</option><option>12</option></select></label><p class="settings-note">Sticla are încă 8 treceri, separat de bounces. Razele de umbră nu intră în această limită.</p><label>Prag mișcare<select id="motion-threshold"><option value=".15">0.15 px</option><option value=".35" selected>0.35 px</option><option value=".75">0.75 px</option><option value="1.5">1.5 px</option></select></label><label>Denoising<input id="final-denoise" type="checkbox" checked/></label><label>Forță<input id="final-strength" type="range" min="0" max="1" step=".05" value=".8"/></label><label>Treceri<select id="passes"><option>1</option><option selected>3</option><option>5</option></select></label><button id="reset-accumulation">Reset acumulare</button></div>
<p class="help">Mouse: drag pentru orbită, click dreapta pentru pan, scroll pentru zoom.<br>Touch: un deget pentru orbită; două degete pentru pan / zoom.<br>Tastatură: W A S D / Q E, Shift pentru viteză.</p><div class="actions"><button id="reset-view">Reset cameră</button></div></div><button id="return">Înapoi la prezentare</button></section>
<footer><div><span id="number">01</span><span class="quiet"> / ${chapters.length}</span><span id="beat-count"></span></div><div class="navigation"><button id="prev" aria-label="Pasul anterior">←</button><span id="next-label">Următorul pas</span><button id="next" aria-label="Pasul următor">${arrow}</button><kbd>SPACE</kbd></div><div id="render-status">WEBGL 2 · RASTER</div></footer>
<dialog id="overview"><div class="dialog-heading"><h2>Cuprins</h2><button class="close" aria-label="Închide">×</button></div><div id="chapter-list"></div><div class="dialog-footer"><span>${chapters.length} teme · ${beats.filter(b=>b.travel).length} secvențe de deplasare · ~19 minute</span><button id="sources-open">Bibliografie</button></div></dialog>
<dialog id="code" aria-labelledby="code-title"><div class="dialog-heading"><h2 id="code-title"></h2><button class="close" aria-label="Închide">×</button></div><div id="code-label" class="eyebrow"></div><pre tabindex="0"><code id="code-content"></code></pre><p id="code-source"></p></dialog>
<dialog id="notes"><div class="dialog-heading"><h2 id="notes-title"></h2><button class="close" aria-label="Închide">×</button></div><p id="notes-content"></p><div id="notes-sources"></div></dialog>
<dialog id="sources"><div class="dialog-heading"><h2>Bibliografie</h2><button class="close" aria-label="Închide">×</button></div><div id="source-list"></div></dialog><div id="toast" class="hidden" role="status"></div>`;
// Compact teaching cards float over one continuous, full-size world.
const figureStage=document.createElement('section');figureStage.id='active-figure';figureStage.setAttribute('aria-label','Demonstrație interactivă');$('formula-block').after(figureStage);
for(const id of ['bvh-panel','algorithm-panel','material-panel','sample-budget','sampling-panel','temporal-panel','denoise-panel','contribution-panel'])figureStage.append($(id));
const expandButton=document.createElement('button');expandButton.id='expand-experiment';expandButton.textContent='Mărește';expandButton.setAttribute('aria-label','Mărește demonstrația');expandButton.setAttribute('aria-expanded','false');expandButton.setAttribute('aria-controls','active-figure experiment-controls');$('lesson-tools').append(expandButton);
const experimentControls=document.createElement('div');experimentControls.id='experiment-controls';
const hitSummary=document.createElement('div');hitSummary.id='hit-summary';hitSummary.className='hidden';experimentControls.append(hitSummary);$('lesson-tools').append(experimentControls,$('chapter').querySelector('.actions')!,$('explore'));
for(const id of ['bvh-controls','triangle-controls','mt-controls'])experimentControls.append($(id));


function applyLayout(mode:PresentationMode){
 const layout=presentationLayout(innerWidth,innerHeight,mode),style=document.documentElement.style;
 style.setProperty('--header-height',`${layout.headerHeight}px`);style.setProperty('--footer-height',`${layout.footerHeight}px`);
 const rail=layout.rail??{left:innerWidth<760?12:24,top:innerHeight-layout.footerHeight-192,width:Math.min(370,innerWidth-24),height:168};
 for(const [name,r] of [['scene',layout.scene],['rail',rail]] as const)for(const [key,value] of Object.entries(r))style.setProperty(`--${name}-${key}`,`${value}px`);
 return layout;
}
applyLayout('lesson');
document.body.dataset.tracing='off';
let journey:Journey|null=null;let graphicsAvailable=false;try{journey=new Journey($<HTMLCanvasElement>('scene'));graphicsAvailable=true;}catch(e){console.error(e);$('render-status').textContent=graphicsFeedback(false);$('graphics-fallback').classList.remove('hidden');$<HTMLButtonElement>('explore').disabled=true;$('explore').textContent='Explorare 3D indisponibilă';}
const params=new URLSearchParams(location.search),capture=params.get('capture'),capturePhase=params.get('phase');const aliases:Record<string,string>={gpu:'room',accumulation:'noise',modern:'denoise',approach:'portal',launch:'hit',inflight:'hit'};
function routeIndex(){const p=new URLSearchParams(location.hash.slice(1)),id=aliases[p.get('chapter')??'']??p.get('chapter')??'room',bid=aliases[p.get('beat')??'']??p.get('beat');return Math.max(0,beats.findIndex(b=>bid?b.id===bid:b.id===id));}
let index=routeIndex(),exploring=false,lastUi=0,treeSignature='',toastTimer=0,triangleU=primaryUV.u,triangleV=primaryUV.v,triangleParallel=false,flowIndex=0,flowPlaying=false,lastFlow=0,picking=false,noiseSamples=1,noisePlaying=false,lastNoise=0,budgetPaths=2,budgetBounces=3,samplesPlaying=false,lastSample=0,tracingUiRequest=0,denoiseGuided=true,denoisePass=0,denoiseStrength=.8,denoisePlaying=false,lastDenoise=0,mtStep=0,temporalPlaying=false,lastTemporal=0;
const temporal=new TemporalDemo();
const comparisonStage=document.createElement('section');comparisonStage.id='image-comparison';comparisonStage.className='hidden';comparisonStage.setAttribute('aria-label','Comparație pe imaginea principală');
comparisonStage.innerHTML=`<div class="comparison-caption">CAMERA INIȚIALĂ · SIMULARE ZGOMOT PE IMAGINE RASTER</div><div class="comparison-views"><figure><figcaption id="comparison-low-label">Referință fixă · <b>1 spp</b></figcaption><canvas id="comparison-low" aria-label="Aceeași imagine cu zgomot simulat la un sample"></canvas></figure><figure><figcaption id="comparison-label"></figcaption><canvas id="comparison-high" aria-label="Aceeași imagine cu zgomot simulat mediat"></canvas></figure></div><div id="comparison-controls"></div><output id="comparison-state" aria-live="polite"></output>`;
$('app').append(comparisonStage);
const pipelineStage=document.createElement('section');pipelineStage.id='pipeline-stage';pipelineStage.className='hidden';pipelineStage.innerHTML=denoisePipelineSvg()+'<div class="pipeline-legend"><span>SVGF · lanțul de mai sus</span><span>NRD · difuz / specular separat</span><span>OIDN · filtru neuronal</span></div>';$('app').append(pipelineStage);
const comparison=new ImageComparison($<HTMLCanvasElement>('comparison-low'),$<HTMLCanvasElement>('comparison-high'));
let comparisonCapture=0,temporalSamples=1,temporalCamera=0;
const current=()=>beats[index],chapter=()=>chapters.find(c=>c.id===current().chapter)!;
const imagePhase=()=>['image','samples','noise','temporal','temporal-motion','denoise','denoise-pipeline'].includes(current().id);
const comparisonPhase=()=>['image','noise','temporal','denoise'].includes(current().id);
function updateLayout(){const mode:PresentationMode=capture&&!params.has('ui')?'capture':exploring?'explorer':current().travel?'travel':'lesson';const layout=applyLayout(mode);journey?.setSceneViewport(layout.scene);}
window.addEventListener('resize',updateLayout);

function toast(s:string){$('toast').textContent=s;$('toast').classList.remove('hidden');clearTimeout(toastTimer);toastTimer=window.setTimeout(()=>$('toast').classList.add('hidden'),5000);}
$('progress').innerHTML=chapters.map((c,i)=>`<button data-chapter="${c.id}" title="${i+1}. ${escape(c.title)}" aria-label="${escape(c.title)}"></button>`).join('');
$('chapter-list').innerHTML=chapters.map((c,i)=>`<button data-chapter="${c.id}"><span class="quiet">${String(i+1).padStart(2,'0')}</span><span>${escape(c.title)}</span><span class="quiet">${c.duration}</span></button>`).join('');
$('source-list').innerHTML=Object.entries(sources).map(([name,url])=>`<a href="${url}" target="_blank" rel="noopener noreferrer">${sourceTitles[name]??name}<span>${url}</span></a>`).join('');
const modalPause=new ModalPause();
function syncModalPause(){const paused=modalPause.sync(Boolean(document.querySelector('dialog[open]')));if(journey&&paused!==undefined)journey.paused=paused;}
function closeDialogs(){document.querySelectorAll<HTMLDialogElement>('dialog[open]').forEach(d=>d.close());syncModalPause();}
function openDialog(id:string){showCursor(false);if(journey)journey.paused=modalPause.open(journey.paused);document.querySelectorAll<HTMLDialogElement>('dialog[open]').forEach(d=>d.close());$<HTMLDialogElement>(id).showModal();syncModalPause();}
document.querySelectorAll<HTMLDialogElement>('dialog').forEach(d=>{d.querySelector<HTMLButtonElement>('.close')!.onclick=closeDialogs;d.onclose=syncModalPause;});
function go(i:number,settled=false){if(exploring)returnJourney(false);index=Math.max(0,Math.min(beats.length-1,i));const hash=routeHash(current().chapter,current().id);if(location.hash!==hash)history.pushState(null,'',hash);render(settled);}
function advance(){if(journey?.isMoving){journey.finish();return;}if(index===beats.length-1)startExplore();else go(index+1);}
// The presenter supplies the explanation; derivations belong in the optional workspace.
function renderLessonCopy(expanded=false){
 const b=current(),c=chapter(),reasoning=teachingCopy[c.id];
 $('intro').textContent=b.intro??c.slide.intro;$('intro').classList.toggle('hidden',!expanded||b.travel);
 $('reasoning').textContent=reasoning?.text??'';$('reasoning').classList.toggle('hidden',!expanded||!reasoning||b.travel);
 const formula=b.travel||!expanded?'':reasoning?.formula??c.slide.formula;
 $('formula').textContent=formula;$('formula-block').classList.toggle('hidden',!formula);
}
function render(settled=false){
 picking=false;document.body.classList.remove('picking');
 const b=current(),c=chapter(),n=chapters.indexOf(c);document.body.dataset.layout=b.layout;document.body.classList.toggle('has-path-lesson',['samples','light'].includes(c.id)&&!b.travel&&b.id!=='image');samplesPlaying=false;noisePlaying=false;temporalPlaying=false;denoisePlaying=false;document.body.dataset.beat=b.id;document.body.classList.toggle('image-phase',imagePhase());$('image-frame').classList.add('hidden');document.body.classList.toggle('main-comparison',comparisonPhase());document.body.classList.toggle('initial-image',b.id==='image');document.body.classList.toggle('diagram-stage',b.id==='denoise-pipeline');comparisonStage.classList.toggle('hidden',!comparisonPhase());pipelineStage.classList.toggle('hidden',b.id!=='denoise-pipeline');comparisonStage.querySelector<HTMLElement>('.comparison-caption')!.textContent=b.id==='denoise'?'SEMNAL SINTETIC · GHIDAJE: NORMALĂ / ADÂNCIME / ALBEDO':b.id==='image'?'Simulare · 1 spp':'CAMERA INIȚIALĂ · SIMULARE ZGOMOT PE IMAGINE RASTER';$('comparison-low-label').innerHTML=b.id==='denoise'?'Intrare zgomotoasă · <b>1 spp</b>':'Referință fixă · <b>1 spp</b>';comparisonCapture++;document.body.dataset.chapter=c.id;document.body.classList.toggle('has-experiment',['bvh','aabb','traversal','hit','loop','materials','samples','noise','temporal','denoise','light'].includes(c.id)&&!b.travel);document.body.classList.toggle('is-room',b.scene==='room');
 $('section').textContent=`${String(n+1).padStart(2,'0')} / ${c.section}`;$('title').textContent=b.title??c.slide.title;$('points').innerHTML=c.slide.points.map(p=>`<li>${escape(p)}</li>`).join('');$('formula-note').textContent=c.formulaNote;renderLessonCopy();
 $('number').textContent=String(n+1).padStart(2,'0');$('beat-count').textContent=`pas ${index+1}/${beats.length}`;$('next-label').textContent=index===beats.length-1?'Explorare':beats[index+1].title??chapters.find(c=>c.id===beats[index+1].chapter)!.title;
 $('prev').toggleAttribute('disabled',index===0);$('explore').classList.toggle('hidden',index!==beats.length-1);$('ray-status').classList.toggle('hidden',b.scene!=='courtyard'||['bvh','aabb','traversal'].includes(c.id)||imagePhase());
 document.querySelectorAll<HTMLElement>('[data-chapter]').forEach(el=>{const active=el.dataset.chapter===c.id;el.classList.toggle('active',active);if(active)el.setAttribute('aria-current','step');else el.removeAttribute('aria-current');});
 const inline=false;$('inline-code').classList.toggle('hidden',!inline);if(inline){$('inline-label').textContent=c.codeLabel;$('inline-content').textContent=c.code;$('inline-source').textContent=c.codeSource;}
 $('bvh-panel').classList.toggle('hidden',!['bvh','aabb','traversal'].includes(c.id)||b.travel);$('sampling-panel').classList.add('hidden');$('temporal-panel').classList.toggle('hidden',b.id!=='temporal-motion');$('denoise-panel').classList.add('hidden');
 $('algorithm-panel').classList.toggle('hidden',!['hit','loop'].includes(c.id));if(c.id==='hit'){triangleU=primaryUV.u;triangleV=primaryUV.v;triangleParallel=false;mtStep=0;renderTriangle();}if(c.id==='loop')renderFlow();
 if(b.id==='image'){comparison.draw(1);$('comparison-controls').innerHTML='';$('comparison-state').textContent='';}if(b.id==='noise'){noiseSamples=1;noisePlaying=true;lastNoise=performance.now();renderSampling();}if(b.id==='temporal'){temporalSamples=1;temporalCamera=0;temporalPlaying=true;lastTemporal=performance.now();renderTemporalAverage();}if(b.id==='temporal-motion'){temporal.restart();renderTemporal();}if(b.id==='denoise'){denoisePass=0;denoisePlaying=true;lastDenoise=performance.now();renderDenoise();}
 updateMaterialPanel();$('sample-budget').classList.toggle('hidden',c.id!=='samples');if(c.id==='samples'){budgetPaths=1;budgetBounces=3;samplesPlaying=true;lastSample=performance.now();}
 const captions:Record<string,string>={diffuse:b.id==='diffuse-chosen'?'Direcție aleasă':'Direcții candidate',traversal:'Traversare BVH'};$('scene-caption').textContent=captions[c.id]??'';$('scene-caption').classList.toggle('hidden',!captions[c.id]||b.travel);
 for(const [id,visible] of [['hit-summary',c.id==='traversal'],['bvh-controls',c.id==='traversal'],['triangle-controls',c.id==='hit'],['mt-controls',b.id==='hit-steps'],['flow-controls',c.id==='loop'],['algorithm-status',['hit','loop'].includes(c.id)]] as const)$(id).classList.toggle('hidden',!visible||b.travel);
 $('lesson-scroll').scrollTop=0;document.body.classList.remove('experiment-expanded');expandButton.setAttribute('aria-expanded','false');expandButton.textContent='Mărește';expandButton.setAttribute('aria-label','Mărește demonstrația');expandButton.classList.toggle('hidden',!document.body.classList.contains('has-experiment')||document.body.classList.contains('has-path-lesson'));updateLayout();treeSignature='';journey?.setBeat(index,settled||imagePhase());updateMaterialPanel();if(['image','noise','temporal'].includes(b.id))captureComparison();if(c.id==='samples')renderBudget();if(c.id==='loop')updateFlow();updateContribution();updateBVH();document.title=`${c.title} · Ray Tracing`;
}
let materialDiagram='';
function updateMaterialPanel(){
 const mirror=current().id==='materials',glass=current().id==='to-glass'&&(journey?.visuals.progress??0)>=3;
 document.body.classList.toggle('glass-diagram',glass);
 if(current().id==='to-glass'){document.body.classList.toggle('has-experiment',glass);expandButton.classList.toggle('hidden',!glass);}
 $('material-panel').classList.toggle('hidden',!mirror&&!glass);
 const kind=mirror?'mirror':glass?'glass':'';if(kind===materialDiagram)return;materialDiagram=kind;if(!kind)return;
 $('material-label').textContent=mirror?'REFLEXIE PERFECTĂ · OGLINDĂ':'REFRACȚIE · PLACĂ PARALELĂ';
 $('glass-figure').innerHTML=mirror?reflectionIllustration():glassIllustration(true);
 $('glass-answer').textContent=mirror?'θᵢ = θᵣ':'Aer → sticlă → aer · ieșire paralelă';
}
function captureComparison(){
 const request=++comparisonCapture;
 // Journey paints on its own animation frame; allow its capped raster frame to finish.
 window.setTimeout(()=>{if(request!==comparisonCapture||!['image','noise','temporal'].includes(current().id)||exploring)return;comparison.capture($<HTMLCanvasElement>('scene'));comparison.draw(current().id==='noise'?noiseSamples:current().id==='image'?1:temporalSamples);},90);
}
function renderSampling(){
 $('comparison-label').innerHTML=`Același cadru · <b>${noiseSamples} spp</b>`;
 $('comparison-controls').innerHTML=`<label>Samples / pixel <input id="comparison-spp" type="range" min="1" max="256" step="1" value="${noiseSamples}"/><b>${noiseSamples}</b></label><div class="sample-choices">${[1,4,16,64,256].map(n=>`<button data-samples="${n}" aria-pressed="${n===noiseSamples}">${n} spp</button>`).join('')}</div><button data-noise-action="play">${noisePlaying?'Pauză Ⅱ':'Ciclu automat ▶'}</button>`;
 $('comparison-state').textContent='Aceeași cameră · același set de samples · zgomot ∝ 1 / √N';
 comparison.draw(noiseSamples);
}
function renderTemporalAverage(){
 $('comparison-label').innerHTML=`Medie temporală · <b>N = ${temporalSamples}</b>`;
 $('comparison-controls').innerHTML=`<button data-average="play">${temporalPlaying?'Pauză Ⅱ':'Acumulează ▶'}</button><button data-average="step" ${temporalSamples===100?'disabled':''}>+1 cadru</button><button data-average="reset">Reset istoric</button><button data-average="camera">Schimbă camera → reset</button><span>1 sample / pixel / cadru</span>`;
 $('comparison-state').textContent=temporalSamples?`Cameră ${temporalCamera?'B':'A'} fixă · ${temporalSamples} cadre acumulate · Cₙ = Cₙ₋₁ + (Sₙ − Cₙ₋₁) / N`:'Istoric șters · N = 0';
 comparison.draw(temporalSamples);
}
$('comparison-controls').oninput=e=>{const input=e.target as HTMLInputElement;if(input.id==='comparison-strength'){denoiseStrength=Number(input.value);input.nextElementSibling!.textContent=denoiseStrength.toFixed(2);drawDenoiseComparison($<HTMLCanvasElement>('comparison-low'),$<HTMLCanvasElement>('comparison-high'),denoisePass,denoiseGuided,denoiseStrength);return;}if(input.id==='comparison-spp'){noiseSamples=Number(input.value);noisePlaying=false;comparison.draw(noiseSamples);$('comparison-label').innerHTML=`Același cadru · <b>${noiseSamples} spp</b>`;input.nextElementSibling!.textContent=String(noiseSamples);$('comparison-controls').querySelectorAll<HTMLElement>('[data-samples]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.samples)===noiseSamples)));const play=$('comparison-controls').querySelector<HTMLElement>('[data-noise-action]');if(play)play.textContent='Ciclu automat ▶';}};
$('comparison-controls').onclick=e=>{
 const button=(e.target as Element).closest<HTMLElement>('button');if(!button)return;
 if(button.hasAttribute('data-denoise-pass')){denoisePass=Number(button.dataset.denoisePass);denoisePlaying=false;renderDenoise();return;}if(button.hasAttribute('data-denoise-guided')){denoiseGuided=!denoiseGuided;renderDenoise();return;}if(button.hasAttribute('data-denoise-play')){denoisePlaying=!denoisePlaying;lastDenoise=performance.now();renderDenoise();return;}
 if(button.dataset.samples){noiseSamples=Number(button.dataset.samples);noisePlaying=false;renderSampling();}
 if(button.dataset.noiseAction==='play'){noisePlaying=!noisePlaying;lastNoise=performance.now();renderSampling();}
 const action=button.dataset.average;if(!action)return;
 if(action==='play'){temporalPlaying=!temporalPlaying;if(temporalPlaying&&temporalSamples===100)temporalSamples=0;lastTemporal=performance.now();}
 if(action==='step'){temporalPlaying=false;temporalSamples=Math.min(100,temporalSamples+1);}
 if(action==='reset'){temporalSamples=0;lastTemporal=performance.now();}
 if(action==='camera'){
  temporalSamples=0;lastTemporal=performance.now();temporalCamera=1-temporalCamera;
  if(journey){journey.camera.position.x+=temporalCamera?2:-2;journey.camera.updateMatrixWorld();journey.invalidateRaster();captureComparison();}
 }
 renderTemporalAverage();
};
expandButton.onclick=()=>{const expanded=document.body.classList.toggle('experiment-expanded');expandButton.textContent=expanded?'Micșorează':'Mărește';expandButton.setAttribute('aria-label',expanded?'Micșorează demonstrația':'Mărește demonstrația');expandButton.setAttribute('aria-expanded',String(expanded));renderLessonCopy(expanded);$('lesson-scroll').scrollTop=0;};
$('explorer-toggle').onclick=()=>{const collapsed=$('explorer').classList.toggle('collapsed');$('explorer-toggle').textContent=collapsed?'Deschide setările':'Restrânge setările';$('explorer-toggle').setAttribute('aria-expanded',String(!collapsed));};

function renderBudget(){
 const focused=document.activeElement instanceof HTMLButtonElement&&$('sample-budget').contains(document.activeElement)?document.activeElement:null,focusSelector=focused?.dataset.sampleAction?`[data-sample-action="${focused.dataset.sampleAction}"]`:focused?.dataset.lessonDepth?`[data-lesson-depth="${focused.dataset.lessonDepth}"]`:null;
 journey?.setLessonSamples(budgetPaths,budgetBounces);
 const points=illustratedSamples(exampleCount).map(({pixel})=>{const delta=pixel.map((v,i)=>v-cameraPixel.center[i]);return [.5+delta.reduce((s,v,i)=>s+v*cameraPixel.right[i],0)/cameraPixel.footprint,.5-delta.reduce((s,v,i)=>s+v*cameraPixel.up[i],0)/cameraPixel.footprint];}),colors=['#ffd294','#a4d5bf','#c7b1e8','#f0b0bc'];
 $('sample-budget').innerHTML=`<div class="pixel-jitter"><svg viewBox="0 0 96 96" role="img" aria-label="${budgetPaths} poziții de sampling în același pixel q"><rect x="8" y="8" width="80" height="80" fill="#152e38" stroke="#c7ded0"/>${points.slice(0,budgetPaths).map(([x,y],i)=>`<circle cx="${8+x*80}" cy="${8+y*80}" r="4" fill="${colors[i]}"/><text x="${18+x*80}" y="${11+y*80}" fill="${colors[i]}">${i+1}</text>`).join('')}</svg><div><span>pixel q · jitter</span><output aria-live="polite">${budgetPaths} ${budgetPaths===1?'sample':'samples'}</output></div></div>
 <div class="lesson-controls"><button data-sample-action="next" ${budgetPaths===exampleCount?'disabled':''}>+ 1 sample</button><button data-sample-action="play">${samplesPlaying?'Pauză Ⅱ':'Rulează ▶'}</button><button data-sample-action="replay" aria-label="Reia samples">↻</button></div>
 <div class="lesson-depth" role="group" aria-label="Limita de bounces pe fiecare sample"><span>Bounces</span>${[1,3].map(depth=>`<button data-lesson-depth="${depth}" aria-pressed="${budgetBounces===depth}">${depth}</button>`).join('')}</div>`;
 if(focusSelector){const replacement=$('sample-budget').querySelector<HTMLButtonElement>(focusSelector);(replacement&&!replacement.disabled?replacement:$('sample-budget').querySelector<HTMLButtonElement>('[data-sample-action="play"]'))?.focus({preventScroll:true});}
}
$('sample-budget').onclick=e=>{
 const button=(e.target as Element).closest<HTMLButtonElement>('button');if(!button)return;
 if(button.dataset.lessonDepth){budgetBounces=Number(button.dataset.lessonDepth);renderBudget();return;}
 const action=button.dataset.sampleAction;
 if(action==='next'){samplesPlaying=false;budgetPaths=Math.min(exampleCount,budgetPaths+1);}
 if(action==='play'){samplesPlaying=!samplesPlaying;if(samplesPlaying&&budgetPaths===exampleCount)budgetPaths=0;lastSample=performance.now();}
 if(action==='replay'){budgetPaths=0;samplesPlaying=true;lastSample=performance.now();}
 renderBudget();
};

function renderDenoise(){
 $('comparison-label').innerHTML=`${denoiseGuided?'Filtru ghidat':'Fără ghidaje'} · <b>${denoisePass} treceri</b>`;
 $('comparison-controls').innerHTML=`<label>Treceri ${[0,1,2,3].map(n=>`<button data-denoise-pass="${n}" aria-pressed="${n===denoisePass}">${n}</button>`).join('')}</label><label>Forță <input id="comparison-strength" type="range" min="0" max="1" step=".05" value="${denoiseStrength}"/><b>${denoiseStrength.toFixed(2)}</b></label><button data-denoise-guided aria-pressed="${denoiseGuided}">${denoiseGuided?'Cu ghidaje':'Fără ghidaje'}</button><button data-denoise-play>${denoisePlaying?'Pauză Ⅱ':'Ciclu automat ▶'}</button>`;
 $('comparison-state').textContent='Același semnal și același zgomot · à-trous: pas 1 → 2 → 4';
 drawDenoiseComparison($<HTMLCanvasElement>('comparison-low'),$<HTMLCanvasElement>('comparison-high'),denoisePass,denoiseGuided,denoiseStrength);
}
function renderTemporal(){
 const panel=$('temporal-panel');
 if(!panel.querySelector('canvas')){panel.innerHTML=`<div class="eyebrow">CUB ÎN MIȘCARE PESTE FUNDAL FIX</div><div class="temporal-views"><figure><canvas id="temporal-image"></canvas><figcaption>Imagine acumulată</figcaption></figure><figure><canvas id="temporal-history"></canvas><figcaption>Lungime istoric · <span class="reset-key">roșu: 1 cadru</span></figcaption></figure></div><div class="temporal-modes" role="group" aria-label="Mod de acumulare">${temporalModes.map(([m,l])=>`<button data-mode="${m}">${l}</button>`).join('')}</div><div class="lesson-controls"><button data-temporal="play"></button><button data-temporal="step">+1 cadru</button><span class="temporal-alpha">α ${[.05,.1,.25,.5].map(a=>`<button data-alpha="${a}">${a}</button>`).join('')}</span></div><div class="running-average"><span>cadru <b id="temporal-frame"></b></span><span>RMSE <b id="temporal-rmse"></b></span><span>pixeli resetați <b id="temporal-resets"></b></span></div><p class="experiment-note" id="temporal-note"></p>`;}
 temporal.draw($<HTMLCanvasElement>('temporal-image'),$<HTMLCanvasElement>('temporal-history'));
 panel.querySelectorAll<HTMLElement>('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===temporal.mode)));
 panel.querySelectorAll<HTMLElement>('[data-alpha]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.alpha)===temporal.alpha)));
 panel.querySelector<HTMLElement>('[data-temporal="play"]')!.textContent=temporalPlaying?'Pauză Ⅱ':'Rulează ▶';
 $('temporal-frame').textContent=String(temporal.frame);$('temporal-rmse').textContent=temporal.rmse().toFixed(3);$('temporal-resets').textContent=String(temporal.resetPixels);$('temporal-note').textContent=temporalModeNote[temporal.mode];
}
$('temporal-panel').onclick=e=>{
 const t=e.target as Element,mode=t.closest<HTMLElement>('[data-mode]'),alpha=t.closest<HTMLElement>('[data-alpha]'),action=t.closest<HTMLElement>('[data-temporal]')?.dataset.temporal;
 if(mode){temporal.mode=mode.dataset.mode as TemporalMode;temporal.restart();}
 if(alpha)temporal.alpha=Number(alpha.dataset.alpha);
 if(action==='play'){temporalPlaying=!temporalPlaying;lastTemporal=performance.now();}
 if(action==='step'){temporalPlaying=false;temporal.step();}
 renderTemporal();
};
function renderTriangle(){
 if(current().id==='hit-steps'){renderMT();return;}
 const figure=triangleIllustration(triangleU,triangleV,triangleParallel);$('algorithm-heading').textContent='TRIUNGHIUL DE PE SFERĂ LOVIT DE RAZA PRIMARĂ';$('algorithm-figure').innerHTML=figure.svg;$('algorithm-status').textContent=figure.summary;$('triangle-controls').classList.remove('hidden');$('flow-controls').classList.add('hidden');
 $<HTMLInputElement>('triangle-u').value=String(triangleU);$<HTMLInputElement>('triangle-v').value=String(triangleV);
}
function renderMT(){
 const steps=mollerTrumboreSteps(triangleU,triangleV,triangleParallel);mtStep=Math.min(mtStep,steps.length-1);
 $('algorithm-heading').textContent='MÖLLER–TRUMBORE · PAS CU PAS';$('triangle-controls').classList.remove('hidden');$('flow-controls').classList.add('hidden');
 $('algorithm-figure').innerHTML=mollerTrumboreFigure(triangleU,triangleV,triangleParallel,mtStep)+`<ol class="mt-steps">${steps.map((s,i)=>`<li class="${i===mtStep?'active':i<mtStep?'done':'todo'}${s.exit&&i<=mtStep?' exit-'+s.exit:''}"><code>${escape(s.code)}</code><output>${i<=mtStep?escape(s.value):''}</output></li>`).join('')}</ol>`;
 $('algorithm-status').textContent=steps[mtStep].note;
 $<HTMLInputElement>('triangle-u').value=String(triangleU);$<HTMLInputElement>('triangle-v').value=String(triangleV);
 $<HTMLButtonElement>('mt-prev').disabled=mtStep===0;$<HTMLButtonElement>('mt-next').disabled=$<HTMLButtonElement>('mt-all').disabled=mtStep===steps.length-1;
}
$('mt-prev').onclick=()=>{mtStep=Math.max(0,mtStep-1);renderMT();};$('mt-next').onclick=()=>{mtStep++;renderMT();};$('mt-all').onclick=()=>{mtStep=99;renderMT();};
function renderFlow(){
 flowIndex=0;flowPlaying=false;$('triangle-controls').classList.add('hidden');$('flow-controls').classList.remove('hidden');
 $('algorithm-figure').innerHTML='<div id="loop-diagram"></div><div class="loop-operation"><span id="flow-step-name"></span><code id="flow-operation"></code></div><div class="flow-registers"><div><b>L</b><output id="flow-l"></output><span>lumină adunată</span></div><div><b>β</b><output id="flow-beta"></output><span>ponderea traseului</span></div></div>';
 updateFlow();
}
function updateFlow(){
 const state=loopStageState(Math.min(6,flowIndex)),complete=selectedPathEstimate(),radiance=flowIndex>=7?complete.contribution:state.radiance,beta=flowIndex>=7?complete.beta:state.beta;
 $('loop-diagram').innerHTML=loopLessonDiagram(flowIndex);
 $('flow-l').textContent=rgbText(radiance);$('flow-beta').textContent=rgbText(beta);
 $('flow-step-name').textContent=`${flowIndex+1}/${loopLabels.length} · ${loopLabels[flowIndex]}`;
 $('flow-operation').textContent=loopOperations[flowIndex];
 $('algorithm-status').textContent=loopShortNotes[flowIndex];
 $('algorithm-heading').textContent='PENTRU FIECARE SAMPLE(q) → REPETĂ INTERACȚIUNILE';
 $('flow-play').textContent=flowPlaying?'Pauză Ⅱ':'Rulează ▶';
}

for(const id of ['triangle-u','triangle-v'])$<HTMLInputElement>(id).oninput=e=>{const v=Number((e.target as HTMLInputElement).value);if(id==='triangle-u')triangleU=v;else triangleV=v;triangleParallel=false;renderTriangle();};
document.querySelectorAll<HTMLElement>('[data-tri]').forEach(b=>b.onclick=()=>{const mode=b.dataset.tri;triangleParallel=mode==='parallel';[triangleU,triangleV]=mode==='edge'?[.5,0]:mode==='outside'?[.8,.65]:[primaryUV.u,primaryUV.v];renderTriangle();});

$('flow-step').onclick=()=>{flowPlaying=false;flowIndex=(flowIndex+1)%loopLabels.length;updateFlow();};$('flow-play').onclick=()=>{flowPlaying=!flowPlaying;if(flowPlaying&&flowIndex===loopLabels.length-1)flowIndex=0;lastFlow=performance.now();updateFlow();};
function updateBVH(){
 if(!journey||!['bvh','aabb','traversal'].includes(chapter().id))return;
 const v=journey.visuals,c=chapter(),e=v.event,root=v.displayRoot,tracing=v.traversalActive,signature=[c.id,v.selected.id,v.lastStep,v.revision,v.bvhStage].join(':');if(signature===treeSignature)return;treeSignature=signature;
 $('bvh-ray-cases').querySelectorAll<HTMLElement>('[data-ray-case]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.rayCase===v.rayCase)));$('bvh-count').textContent=`${v.triangleCount} tri`;$('bvh-heading').textContent=c.id==='bvh'?'Arbore BVH · click pe un nod':'BVH';
 const visible=v.visibleNodes(),positions=new Map<number,{x:number;y:number}>(),visibleIds=new Set(visible.map(n=>n.id)),leaves=visible.filter(n=>!n.children?.some(c=>visibleIds.has(c.id)));let leafIndex=0;function place(node:Node):number{const children=node.children?.filter(c=>visibleIds.has(c.id))??[],xs=children.map(place),x=xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:leaves.length===1?200:14+leafIndex++*372/(leaves.length-1);positions.set(node.id,{x,y:35+(node.depth-root.depth)*68});return x;}place(root);
 let svg='';for(const node of visible){const p=positions.get(node.id)!;node.children?.forEach(child=>{const q=positions.get(child.id);if(q)svg+=`<path d="M${p.x} ${p.y+12}L${q.x} ${q.y-12}" stroke="#5c7c80"/>`;});}
 for(const node of visible){
  const p=positions.get(node.id)!,active=tracing?e?.node.id===node.id:node.id===v.selected.id;
  const color=active?'#ffd091':'#597778',title=`N${node.id} · ${node.indices.length} triunghiuri`;
  svg+=visible.length>12?`<g data-node="${node.id}" role="button" tabindex="0" aria-label="${title}"><title>${title}</title><circle cx="${p.x}" cy="${p.y}" r="${active?7:4}" fill="${color}" stroke="${active?'#fff0c7':'#73918c'}"/>${active?`<text x="${p.x}" y="${p.y-13}" class="tree-active" text-anchor="middle">N${node.id}</text>`:''}</g>`:`<g data-node="${node.id}" role="button" tabindex="0" aria-label="${title}"><rect x="${p.x-30}" y="${p.y-15}" width="60" height="33" rx="3" fill="${active?'#8c6b3f':'#234148'}" stroke="${color}"/><text x="${p.x}" y="${p.y-1}" text-anchor="middle">N${node.id}</text><text x="${p.x}" y="${p.y+12}" class="tree-small" text-anchor="middle">${node.indices.length} tri</text></g>`;
 }
 const treeHeight=65+Math.max(0,...visible.map(n=>n.depth-root.depth))*68;
 $('tree').innerHTML=`<svg viewBox="0 0 400 ${treeHeight}" role="img" aria-label="Arborele BVH calculat din triunghiurile modelului">${svg}</svg>`;
 const active=tracing?e.node:v.selected,ancestors=v.nodes.filter(n=>n.depth<=active.depth&&active.indices.every(i=>n.indices.includes(i))).sort((a,b)=>a.depth-b.depth);
 $('sah-chart').classList.add('hidden');$('slabs').classList.toggle('hidden',c.id!=='aabb');$('trace-status').classList.toggle('hidden',['sah','aabb'].includes(c.id));
 if(c.id==='sah'){const chosen=v.splitCandidates,max=Math.max(v.tree.indices.length,...chosen.map(s=>s.cost)),selected=chosen[v.candidateIndex];$('sah-chart').innerHTML=`<div class="eyebrow">COMPARĂ TĂIETURILE · ACELAȘI MODEL</div>`+chosen.map((s,i)=>`<button data-split="${i}" aria-pressed="${i===v.candidateIndex}"><span>${'XYZ'[s.axis]} = ${s.plane.toFixed(1)}<small>Nₗ=${s.left} · Nᵣ=${s.right}</small></span><i style="--cost:${100*s.cost/max}%"></i><b>${s.cost.toFixed(1)} ${i===0?'✓':''}</b></button>`).join('')+`<div id="sah-values">S=${selected.parentArea.toFixed(1)}<br><span class="left-group">Sₗ=${selected.leftArea.toFixed(1)} · Nₗ=${selected.left}</span><br><span class="right-group">Sᵣ=${selected.rightArea.toFixed(1)} · Nᵣ=${selected.right}</span><br>C = 1 + ${(selected.leftArea/selected.parentArea*selected.left).toFixed(2)} + ${(selected.rightArea/selected.parentArea*selected.right).toFixed(2)} = ${selected.cost.toFixed(2)}<br>Frunză fără tăiere: C=${v.tree.indices.length}</div>`;}
 if(c.id==='aabb')$('slabs').innerHTML=slabIllustration(v.testRayOrigin,v.testRayDirection,v.tree.min,v.tree.max)+`<p id="slab-context">Cutie N0 · o=[${v.testRayOrigin.map(n=>n.toFixed(1)).join(', ')}]<br>d=[${v.testRayDirection.map(n=>n.toFixed(3)).join(', ')}]</p>`;
 const hit=v.currentHit,hitLabel=hit.triangle>=0?`Triunghi #${hit.triangle}`:'Niciun hit';
 if(tracing)$('trace-status').innerHTML=`<div class="trace-line"><b>N${e.node.id}: ${e.status.toUpperCase()}</b></div>${e.testedTriangle===undefined?'':`<p>Tri #${e.testedTriangle} · t=${e.triangleDistance===null?'MISS':e.triangleDistance?.toFixed(3)}</p>`}<p>Stivă [${e.stack.join(', ')}]</p>`;
 else $('trace-status').innerHTML=`<div class="compare"><div><b>${v.triangleCount} → ${v.traversal.triangleTests}</b><span>teste de triunghi: brute force → BVH</span></div></div><p>N${active.id} · ${active.indices.length} triunghiuri · ${active.children?'nod intern':'frunză'}</p>`;
 const closestLabel=Number.isFinite(hit.closest)?hit.closest.toFixed(3):'∞';
 if(tracing)$('hit-summary').textContent=`AABB ${e.boxTests} · tri ${e.triangleTests} · ${traversalSummary(hit.triangle,hit.closest,v.lastStep===v.traversal.events.length-1)}`;
 else if(c.id==='traversal')$('trace-status').innerHTML+=`<p class="hit-legend">${hitLabel} · tClosest = ${closestLabel}</p>`;
 for(const id of ['step-prev','step-next','trace-replay','trace-last','trace-play'])$(id).classList.toggle('hidden',!tracing);$('trace-play').textContent=v.manualStep===null?'Pauză Ⅱ':'Rulează ▶';
}
$('bvh-ray-cases').onclick=e=>{const button=(e.target as Element).closest<HTMLElement>('[data-ray-case]');if(button){journey?.visuals.setCase(button.dataset.rayCase!);journey?.invalidateRaster();treeSignature='';updateBVH();}};
$('bvh-ray-pick').onclick=()=>{picking=!picking;document.body.classList.toggle('picking',picking);$('bvh-ray-pick').textContent=picking?'Click pe model…':'Alege pe model';};
$('scene').addEventListener('click',e=>{if(!picking||!journey)return;e.preventDefault();journey.pickBVH(e.clientX,e.clientY);picking=false;document.body.classList.remove('picking');$('bvh-ray-pick').textContent='Alege pe model';treeSignature='';updateBVH();});
$('sah-chart').onclick=e=>{const button=(e.target as Element).closest<HTMLElement>('[data-split]');if(button){journey?.visuals.setSplitCandidate(Number(button.dataset.split));treeSignature='';updateBVH();}};
$('trace-last').onclick=()=>{journey?.visuals.step(999);updateBVH();};$('trace-play').onclick=()=>{if(!journey)return;const v=journey.visuals,play=v.manualStep!==null;if(play){if(v.lastStep>=v.traversal.events.length-1){v.lastStep=0;v.manualStep=0;}}v.traversalPlayback(play);updateBVH();};
$('tree').onclick=e=>{const node=(e.target as Element).closest('[data-node]');if(node){journey?.visuals.select(Number(node.getAttribute('data-node')));treeSignature='';updateBVH();}};
$('tree').onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();(e.target as HTMLElement).dispatchEvent(new MouseEvent('click',{bubbles:true}));}};
$('step-prev').onclick=()=>{journey?.visuals.step(-1);updateBVH();};$('step-next').onclick=()=>{journey?.visuals.step(1);updateBVH();};$('trace-replay').onclick=()=>{journey?.replayVisuals();treeSignature='';updateBVH();};
document.querySelectorAll<HTMLElement>('[data-chapter]').forEach(el=>el.onclick=()=>{closeDialogs();go(beats.findIndex(b=>b.id===el.dataset.chapter),true);});
$('prev').onclick=()=>go(index-1,true);$('next').onclick=advance;$('replay').onclick=()=>{if(chapter().id==='samples'){budgetPaths=0;samplesPlaying=true;lastSample=performance.now();renderBudget();}else if(chapter().id==='loop')renderFlow();else journey?.replayShot();};
$('overview-open').onclick=()=>openDialog('overview');$('sources-open').onclick=()=>openDialog('sources');$('code-open').onclick=()=>{const c=chapter();$('code-title').textContent=c.title;const glsl=/\b(vec[234]|float|Ray|BSDFSample)\b/.test(c.code);$('code-label').textContent=glsl&&c.id!=='denoise'?`GLSL simplificat · ${c.codeLabel.replace(/^GLSL\s*·?\s*/, '')}`:c.codeLabel;$('code-content').textContent=current().id==='materials'?'vec3 next = reflect(direction, n);':c.code;if(current().id==='materials'){$('code-title').textContent='Reflexie perfectă';$('code-label').textContent='GLSL simplificat · oglindă';}if(current().id==='to-glass'){$('code-title').textContent='Refracție · placă paralelă';$('code-label').textContent='GLSL simplificat · dielectric';}$('code-source').textContent=c.codeSource;openDialog('code');};$('notes-open').onclick=()=>{const c=chapter(),teaching=teachingCopy[c.id];$('notes-title').textContent=c.title;$('notes-content').textContent=[c.intro,...c.points.map(p=>'• '+p),c.id==='materials'?`βin ${rgbText(materialThroughput[1])} × ρmetal ${rgbText(metalReflectance)} = βout ${rgbText(materialThroughput[2])}`:null,teaching?.text,teaching?.formula,c.formula,c.formulaNote,c.notes].filter(Boolean).join('\n\n');$('notes-sources').innerHTML=c.sources.map(s=>`<a href="${s}" target="_blank" rel="noopener noreferrer">${s}</a>`).join('');openDialog('notes');};
$('fullscreen').onclick=()=>{if(document.fullscreenElement)document.exitFullscreen();else document.documentElement.requestFullscreen().catch(()=>toast('Fullscreen indisponibil.'));};
const interactiveSelector='button,a,input,select,textarea,label,[contenteditable],[role="button"],dialog,#explorer,#active-figure,#experiment-controls';
function presentationBackground(target:EventTarget|null){
 if(exploring||picking||document.querySelector('dialog[open]')||!(target instanceof Element))return false;
 return !target.closest(interactiveSelector)&&!(document.body.classList.contains('experiment-expanded')&&target.closest('#presentation'));
}
let pointerStart:{x:number;y:number}|null=null,cursorTimer=0,lastPointerTarget:EventTarget|null=$('scene');
function showCursor(rearm=true){
 clearTimeout(cursorTimer);document.body.classList.remove('cursor-idle');
 if(rearm&&!document.hidden&&document.hasFocus()&&presentationBackground(lastPointerTarget)&&!document.activeElement?.matches(':focus-visible'))cursorTimer=window.setTimeout(()=>{
  if(presentationBackground(lastPointerTarget))document.body.classList.add('cursor-idle');
 },1800);
}
window.addEventListener('pointermove',e=>{if(e.pointerType==='mouse'){lastPointerTarget=e.target;showCursor();}},{passive:true});
window.addEventListener('pointerdown',e=>{pointerStart={x:e.clientX,y:e.clientY};lastPointerTarget=e.target;showCursor();},{passive:true});
document.addEventListener('click',e=>{
 if(e.button!==0||e.defaultPrevented||e.altKey||e.ctrlKey||e.metaKey||e.shiftKey||!presentationBackground(e.target))return;
 if(pointerStart&&Math.hypot(e.clientX-pointerStart.x,e.clientY-pointerStart.y)>6)return;
 advance();
});
document.addEventListener('contextmenu',e=>{
 if(e.button!==2||e.altKey||e.ctrlKey||e.metaKey||e.shiftKey||!presentationBackground(e.target))return;
 e.preventDefault();go(index-1,true);
});
window.addEventListener('blur',()=>showCursor(false));
window.addEventListener('focus',()=>showCursor());
window.addEventListener('pagehide',()=>showCursor(false));
document.addEventListener('visibilitychange',()=>showCursor(!document.hidden));
document.addEventListener('fullscreenchange',()=>showCursor());
document.addEventListener('focusin',()=>showCursor(false));
window.addEventListener('keydown',()=>showCursor(false));
$('fullscreen').classList.toggle('hidden',typeof document.documentElement.requestFullscreen!=='function');
async function startExplore(){if(!journey){toast('Explorarea 3D necesită WebGL 2. Lecția text și figurile rămân disponibile.');return;}await journey.exploreRaster();exploring=true;document.body.classList.add('exploring');$('presentation').classList.add('hidden');$('explorer').classList.remove('collapsed');$('explorer-toggle').setAttribute('aria-expanded','true');$('explorer-toggle').textContent='Restrânge setările';$('explorer').classList.remove('hidden');$('tracer-controls').classList.remove('hidden');$('next').classList.add('hidden');$('prev').classList.add('hidden');$('next-label').textContent='Explorare rasterizată';$('scene').classList.add('beauty');updateLayout();}
function returnJourney(renderAgain=true){tracingUiRequest++;$<HTMLButtonElement>('start-tracing').disabled=false;$('start-tracing').textContent='Start path tracing';document.body.dataset.tracing='off';exploring=false;journey?.returnToJourney();document.body.classList.remove('exploring');$('presentation').classList.remove('hidden');$('explorer').classList.add('hidden');$('next').classList.remove('hidden');$('prev').classList.remove('hidden');$('scene').classList.remove('beauty');$('tracer-controls').classList.remove('hidden');$('stop-tracing').classList.add('hidden');$('start-tracing').classList.remove('hidden');$('explore-status').textContent='Rasterizare · path tracer oprit';updateLayout();if(renderAgain)render(true);}
$('explore').onclick=startExplore;$('return').onclick=()=>returnJourney();$('reset-view').onclick=()=>journey?.resetView();$('reset-accumulation').onclick=()=>journey?.finale?.invalidate();
$('start-tracing').onclick=async()=>{if(!journey||!exploring)return;const request=++tracingUiRequest,active=()=>request===tracingUiRequest&&exploring,button=$<HTMLButtonElement>('start-tracing');document.body.dataset.tracing='initializing';button.disabled=true;button.textContent='Inițializare path tracer…';try{const started=await journey.startTracing();if(!started||!active())return;button.classList.add('hidden');$('stop-tracing').classList.remove('hidden');$('tracer-controls').classList.remove('hidden');$('explore-status').textContent='Path tracing activ';document.body.dataset.tracing='on';}catch(e){if(active()){document.body.dataset.tracing='off';$('explore-status').textContent='Inițializarea a eșuat. Rasterizarea continuă; poți reîncerca Start.';toast(String(e));}}finally{if(active()){button.disabled=false;button.textContent='Start path tracing';}}};
$('stop-tracing').onclick=()=>{tracingUiRequest++;document.body.dataset.tracing='off';journey?.stopTracing();$('tracer-controls').classList.remove('hidden');$('stop-tracing').classList.add('hidden');$('start-tracing').classList.remove('hidden');$<HTMLButtonElement>('start-tracing').disabled=false;$('start-tracing').textContent='Start path tracing';$('explore-status').textContent='Rasterizare · path tracer oprit';};
for(const [id,key] of [['scale','scale'],['updates','samplesPerUpdate'],['bounces','bounces'],['passes','passes'],['motion-threshold','motionThreshold']] as const)$<HTMLSelectElement>(id).onchange=e=>journey?.setSettings({[key]:Number((e.target as HTMLSelectElement).value)});
$<HTMLInputElement>('final-denoise').onchange=e=>journey?.setSettings({denoise:(e.target as HTMLInputElement).checked});$<HTMLInputElement>('final-strength').oninput=e=>journey?.setSettings({strength:Number((e.target as HTMLInputElement).value)});
window.addEventListener('popstate',()=>{index=routeIndex();if(exploring)returnJourney(false);render(true);});
window.addEventListener('keydown',e=>{if(e.repeat&&!exploring)return;if(e.target instanceof HTMLButtonElement&&e.key===' ')return;if(e.target instanceof Element&&e.target.closest('input,select,textarea,[contenteditable]'))return;if(document.querySelector('dialog[open]')){if(e.key==='Escape'||(e.key.toLowerCase()==='c'&&$<HTMLDialogElement>('code').open)){e.preventDefault();closeDialogs();}return;}if(exploring){if(e.key==='Escape')returnJourney();return;}if([' ','ArrowRight','ArrowDown','PageDown'].includes(e.key)){e.preventDefault();advance();}else if(['ArrowLeft','ArrowUp','PageUp','Backspace'].includes(e.key)){e.preventDefault();go(index-1,true);}else if(e.key==='Home')go(0,true);else if(e.key==='End')go(beats.length-1,true);else if(e.key.toLowerCase()==='o')$('overview-open').click();else if(e.key.toLowerCase()==='c')$('code-open').click();else if(e.key.toLowerCase()==='n')$('notes-open').click();else if(e.key.toLowerCase()==='f')$('fullscreen').click();});
if(journey)journey.onFrame=s=>{if(s){document.body.dataset.samples=String(Math.floor(s.samples));document.body.dataset.resets=String(s.resets);document.body.dataset.motion=s.moving?'moving':'stationary';$('explore-status').textContent=`${Math.floor(s.samples)} spp · ${s.width} × ${s.height} · ${s.bounces} bounces`;$('render-status').textContent=s.moving?'PATH TRACING · MIȘCARE':'PATH TRACING · ACUMULARE';}};
function updateWorldLabels(){
 const layer=$('world-labels'),showCamera=!exploring&&!current().travel&&['ray','samples'].includes(chapter().id),labels=showCamera?journey?.cameraLabels:undefined;
 layer.innerHTML=labels?Object.entries(labels).filter(([key])=>key!=='sample').map(([key,p])=>p.visible?`<span style="left:${p.x}px;top:${p.y}px">${({origin:'o · cameră',pixel:'pixel q',direction:'d'} as Record<string,string>)[key]??key}</span>`:'').join(''):'';
 if(exploring||!journey||imagePhase())return;
 const guides=journey.guideLabels.filter(p=>p.visible);if(!guides.length)return;
 const panel=$('presentation').getBoundingClientRect(),placed:{left:number;top:number;right:number;bottom:number}[]=[],top=innerWidth<760?64:74,bottom=innerHeight-(innerWidth<760?70:78);
 const overlaps=(a:{left:number;top:number;right:number;bottom:number},b:{left:number;top:number;right:number;bottom:number})=>a.left<b.right+5&&a.right>b.left-5&&a.top<b.bottom+5&&a.bottom>b.top-5;
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox',`0 0 ${innerWidth} ${innerHeight}`);svg.classList.add('guide-leaders');layer.append(svg);
 for(const guide of guides){
  const label=document.createElement('span');label.className='world-guide';label.textContent=guide.text;label.style.color=guide.color;layer.append(label);
  const width=label.offsetWidth,height=label.offsetHeight;
  const candidates=[[12,-height-10],[12,10],[-width-12,-height-10],[-width-12,10],[-width/2,-height-32],[-width/2,32],[-width/2,-height-56]];
  const boxes=candidates.map(([dx,dy])=>{const left=Math.max(8,Math.min(innerWidth-width-8,guide.x+dx)),y=Math.max(top,Math.min(bottom-height,guide.y+dy));return {left,top:y,right:left+width,bottom:y+height};});
  const box=boxes.find(b=>!overlaps(b,panel)&&placed.every(p=>!overlaps(b,p)))??boxes.find(b=>!overlaps(b,panel))??boxes[0];placed.push(box);
  label.style.left=`${box.left}px`;label.style.top=`${box.top}px`;
  const x=Math.max(box.left,Math.min(box.right,guide.x)),y=Math.max(box.top,Math.min(box.bottom,guide.y));
  if(Math.hypot(x-guide.x,y-guide.y)>7){const line=document.createElementNS('http://www.w3.org/2000/svg','line');for(const [key,value] of Object.entries({x1:guide.x,y1:guide.y,x2:x,y2:y}))line.setAttribute(key,String(value));line.setAttribute('stroke',guide.color);svg.append(line);}
 }
}
function updateContribution(){
 const panel=$('contribution-panel'),show=current().id==='light'||current().id==='image';panel.classList.toggle('hidden',!show);if(!show)return;
 const e=selectedPathEstimate();
 if(current().id==='image'){
  panel.innerHTML=`<div class="pixel-average"><span class="lesson-pixel" style="background:${rgbSwatch(e.contribution)}"></span><b>pixel q</b></div>`;
  return;
 }
 panel.innerHTML=`<div class="return-to-pixel"><code>ΔL = β × Le</code><span aria-hidden="true">→</span><span class="lesson-pixel" style="background:${rgbSwatch(e.contribution)}"></span><b>pixel q</b></div>`;
}

function uiFrame(time:number){if(imagePhase()&&!exploring){const pixel=journey?.primaryPixel;$('image-pixel').classList.toggle('hidden',!pixel?.visible);if(pixel?.visible){$('image-pixel').style.left=`${pixel.x}px`;$('image-pixel').style.top=`${pixel.y}px`;}}const showPixel=!exploring&&!current().travel&&chapter().id==='ray',pixel=showPixel?journey?.primaryPixel:undefined;$('pixel-marker').classList.toggle('hidden',!pixel?.visible);if(pixel?.visible){$('pixel-marker').style.left=`${pixel.x}px`;$('pixel-marker').style.top=`${pixel.y}px`;}updateWorldLabels();if(chapter().id==='samples'&&samplesPlaying&&!journey?.paused&&time-lastSample>950){lastSample=time;budgetPaths=Math.min(exampleCount,budgetPaths+1);if(budgetPaths===exampleCount)samplesPlaying=false;renderBudget();} if(chapter().id==='loop'&&flowPlaying&&!journey?.paused&&time-lastFlow>900){lastFlow=time;flowIndex=Math.min(loopLabels.length-1,flowIndex+1);if(flowIndex===loopLabels.length-1)flowPlaying=false;updateFlow();}if(current().id==='noise'&&noisePlaying&&!journey?.paused&&time-lastNoise>1400){lastNoise=time;const levels=[1,4,16,64,256];noiseSamples=levels[(levels.indexOf(noiseSamples)+1)%levels.length];renderSampling();}if(current().id==='denoise'&&denoisePlaying&&!journey?.paused&&time-lastDenoise>(denoisePass===3?2200:1400)){lastDenoise=time;denoisePass=(denoisePass+1)%4;renderDenoise();}if(chapter().id==='temporal'&&temporalPlaying&&!journey?.paused&&time-lastTemporal>(current().id==='temporal'&&temporalSamples===100?2200:110)){lastTemporal=time;if(current().id==='temporal-motion'){temporal.step();renderTemporal();}else{temporalSamples=temporalSamples===100?1:Math.min(100,temporalSamples+1);renderTemporalAverage();}}if(time-lastUi>150){lastUi=time;updateMaterialPanel();document.body.classList.toggle('is-moving',Boolean(journey?.isMoving));if(!journey?.pathTracing)$('render-status').textContent=graphicsFeedback(graphicsAvailable);if(journey){const p=journey.visuals.progress,leg=Math.min(4,Math.floor(p)),weight=journey.rayWeight;$('ray-info').textContent=`segment ${Math.min(5,leg+1)}`;$('beta-info').textContent=`β [${weight.rgb.map(v=>v.toFixed(2)).join(', ')}]`;updateBVH();}}requestAnimationFrame(uiFrame);}requestAnimationFrame(uiFrame);
if(capture){if(!params.has('ui'))document.body.classList.add('capture');index=Math.max(0,beats.findIndex(b=>b.id===capture));render(true);if(capture==='beauty'||capture==='final')startExplore();window.setTimeout(()=>{if(journey){journey.paused=true;if(capturePhase!==null)journey.captureAt(Number(capturePhase));if(current().captureStep!==undefined)journey.visuals.step(current().captureStep!);if(capturePhase===null)journey.visuals.update(8*current().captureTime,current().rayTo);journey.invalidateRaster();}requestAnimationFrame(()=>requestAnimationFrame(()=>document.body.dataset.captureReady='true'));},400);}else render(true);
// No path tracer is imported, prepared or rendered before the explicit Start button.
