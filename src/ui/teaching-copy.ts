export const teachingCopy:Record<string,{text:string;formula?:string}>={
 room:{text:'Ray tracing răspunde la interogări geometrice. Path tracing repetă aceste interogări pentru a estima lumina unui pixel.'},
 ray:{text:'o este orificiul camerei virtuale. q este un sample în celula pixelului; camera cu care privești scena este un observator separat.',formula:'d = normalize(q − o) · r(t) = o + t·d'},
 hit:{text:'Exercițiu separat: raza și triunghiul din figură. Raza galbenă din canion are o intersecție independentă cu sfera.',formula:'HIT ⇔ t > 0, u ≥ 0, v ≥ 0, u + v ≤ 1'},
 diffuse:{text:'β este ponderea RGB a traseului. ρ este reflectanța difuză; PDF p descrie cât de probabilă este direcția aleasă.',formula:'f = ρ/π · p = cosθ/π\nβ′ = β · f cosθ/p = β · ρ'},
 materials:{text:'βin × reflectanța RGB a metalului = βout. Normala n bisectează unghiurile reflexiei ideale. Materialul folosește roughness 0.055, deci α = roughness² ≈ 0.0030.',formula:'θ incident = θ reflectat'},
 samples:{text:'Fiecare traseu produce o estimare pentru același pixel. Schema folosește patru contribuții RGB alese pentru exemplu; nu calculează iluminarea canionului.',formula:'N samples → N estimări · mai multe bounces → trasee mai lungi'},
 loop:{text:'Pentru fiecare sample, repetăm interacțiunile până la terminare. L adună radiance RGB. β ponderează fiecare contribuție; PDF este densitatea direcției eșantionate. Valorile de mai jos sunt un model didactic.'},
 cost:{text:'Traseul optic este în pauză. Comparăm separat aceeași rază și aceleași triunghiuri. Un test de cutie poate elimina un întreg grup înaintea testelor de triunghi.'},
 bvh:{text:'Rădăcina cuprinde toată puntea. Copiii împart triunghiurile; o frunză păstrează un grup mic pentru testarea exactă.'},
 sah:{text:'S este aria suprafeței cutiei, N numărul triunghiurilor. Costurile de traversare Ct și intersecție Ci sunt ambele 1.',formula:'C = 1 + (Sₗ/S)Nₗ + (Sᵣ/S)Nᵣ'},
 aabb:{text:'Interogare pe cutia rădăcină a punții. Aceeași rază o + t·d produce intervalele de mai jos și contactele tNear / tFar din lume.',formula:'tNear = max(tX−, tY−, tZ−, 0)\ntFar = min(tX+, tY+, tZ+)'},
 traversal:{text:'Portocaliu: nod activ · verde: acceptat · stins: respins · magenta: cel mai apropiat triunghi. Stiva păstrează nodurile încă de vizitat.'},
 noise:{text:'Comparație Monte Carlo pe un semnal sintetic cunoscut. Mai multe estimări reduc zgomotul, dar nu repară transportul omis.',formula:'eroare standard ∝ 1/√N'},
 denoise:{text:'Demonstrație CPU pe un semnal sintetic. Trei treceri spațiale compară normală, adâncime și albedo înainte de a media vecinii.'},
 light:{text:'Întoarcem contribuția traseului selectat în pixelul q. RGB este liniar; modelul didactic omite ponderile Fresnel, absorbția și MIS.'}
};
export const sourceTitles:Record<string,string>={
 reference:'Prezentarea de referință',weekend:'Ray Tracing in One Weekend',next:'Ray Tracing: The Next Week',pbrt:'PBRT, ediția 4: BVH și SAH',svgf:'Schied et al. (2017): SVGF',nrd:'NVIDIA Real-Time Denoisers',oidn:'Intel Open Image Denoise',tracer:'three-gpu-pathtracer v0.0.23',meshbvh:'three-mesh-bvh'
};
export function neeCalculation(){
 const rho=.7,beta=.6,le=5,cos=.8,area=2,distance2=4,cosLight=.5,pLight=distance2/(area*cosLight),pBsdf=cos/Math.PI,wLight=pLight*pLight/(pLight*pLight+pBsdf*pBsdf),wBsdf=1-wLight,value=beta*(rho/Math.PI)*le*cos/pLight*wLight;
 return `<details class="nee-calculation"><summary>Un calcul NEE + MIS, cu valori</summary><p>Exemplu scalar separat: β=0.6, ρ=0.7, Le=5, cosθ=0.8, vizibilitate V=1.</p><p>Arie A=2, distanță²=4, cosθ lumină=0.5.<br>pω = pA · r² / cosθ lumină = (1/2)·4/0.5 = ${pLight.toFixed(1)} sr⁻¹.</p><p>pBSDF = cosθ/π = ${pBsdf.toFixed(3)} sr⁻¹.<br>MIS power: wL=${wLight.toFixed(3)}, wBSDF=${wBsdf.toFixed(3)}; suma=1.</p><p>ΔL = β · (ρ/π) · Le · cosθ · V · wL / pω = <b>${value.toFixed(3)}</b>.<br>O rază de umbră blocată dă V=0, deci ΔL=0. Strategia BSDF folosește pω al aceleiași direcții pentru ponderea complementară.</p></details>`;
}
