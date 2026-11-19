export const teachingCopy:Record<string,{text:string;formula?:string}>={
 room:{text:'Ray tracing găsește ce suprafață vede o rază. Path tracing repetă aceste interogări ca să estimeze lumina unui pixel.'},
 ray:{text:'o este camera virtuală. q este un punct din pixel. Camera prin care vezi canionul doar urmărește raza.',formula:'d = normalize(q − o) · r(t) = o + t·d'},
 hit:{text:'Triunghiul #187 al sferei, lovit de raza primară. Mută u și v: raza pleacă tot din cameră, spre alt punct P.',formula:'HIT ⇔ t > ε, u ≥ 0, v ≥ 0, u + v ≤ 1'},
 diffuse:{text:'β este ponderea RGB a traseului. ρ este albedo-ul. p este probabilitatea direcției alese.',formula:'f = ρ/π · p = cosθ/π\nβ′ = β · f cosθ/p = β · ρ'},
 materials:{text:'Metalul înmulțește β cu reflectanța lui RGB. Sticla îndoaie raza la intrare și la ieșire. Cu fețe paralele, raza iese paralelă cu direcția inițială.',formula:'θ incident = θ reflectat · η₁ sinθ₁ = η₂ sinθ₂'},
 samples:{text:'Fiecare traseu dă o estimare pentru același pixel. Bounces limitează lungimea fiecărui traseu.',formula:'N samples → N estimări · mai multe bounces → trasee mai lungi'},
 loop:{text:'Pentru fiecare sample repetăm interacțiunile până la terminare. L adună lumina. β ponderează fiecare contribuție.'},
 bvh:{text:'Stanford Bunny: 948 de triunghiuri. Ierarhia completă este discretă; doar cutia testată acum este accentuată. O frunză conține câteva triunghiuri.',formula:'C = 1 + (Sₗ/S)Nₗ + (Sᵣ/S)Nᵣ'},
 aabb:{text:'Aceeași rază o + t·d intersectează cele trei perechi de plane ale cutiei rădăcină.',formula:'tNear = max(tX−, tY−, tZ−, 0)\ntFar = min(tX+, tY+, tZ+)'},
 traversal:{text:'Auriu: cutia activă. Roz: triunghiul lovit. Raza traseului ratează iepurele; „Lovește modelul” arată un hit real.'},
 noise:{text:'Fiecare update adaugă un sample nou la media pixelului. Eroarea scade lent.',formula:'eroare standard ∝ 1/√N'},
 temporal:{text:'Camera fixă: fiecare cadru adaugă o estimare nouă. Următorul pas arată separat reproiecția pentru un cub în mișcare.',formula:'Cₙ = Cₙ₋₁ + (Sₙ − Cₙ₋₁)/n'},
 denoise:{text:'Pixelul marcat este lângă muchie. Cercurile arată ponderea fiecărui vecin la pasul curent.',formula:'w = kernel · wNormal · wDepth · wAlbedo · wLuminance'},
 light:{text:'Contribuția traseului intră în pixelul q. Valorile RGB sunt liniare.'}
};
export const sourceTitles:Record<string,string>={
 reference:'Prezentarea de referință',weekend:'Ray Tracing in One Weekend',next:'Ray Tracing: The Next Week',pbrt:'PBRT, ediția 4: BVH și SAH',svgf:'Schied et al. (2017): SVGF',nrd:'NVIDIA Real-Time Denoisers',oidn:'Intel Open Image Denoise',tracer:'three-gpu-pathtracer v0.0.23',meshbvh:'three-mesh-bvh'
};
export function neeCalculation(){
 const rho=.7,beta=.6,le=5,cos=.8,area=2,distance2=4,cosLight=.5,pLight=distance2/(area*cosLight),pBsdf=cos/Math.PI,wLight=pLight*pLight/(pLight*pLight+pBsdf*pBsdf),wBsdf=1-wLight,value=beta*(rho/Math.PI)*le*cos/pLight*wLight;
 return `<details class="nee-calculation"><summary>Un calcul NEE + MIS, cu valori</summary><p>Exemplu scalar separat: β=0.6, ρ=0.7, Le=5, cosθ=0.8, vizibilitate V=1.</p><p>Arie A=2, distanță²=4, cosθ lumină=0.5.<br>pω = pA · r² / cosθ lumină = (1/2)·4/0.5 = ${pLight.toFixed(1)} sr⁻¹.</p><p>pBSDF = cosθ/π = ${pBsdf.toFixed(3)} sr⁻¹.<br>MIS power: wL=${wLight.toFixed(3)}, wBSDF=${wBsdf.toFixed(3)}; suma=1.</p><p>ΔL = β · (ρ/π) · Le · cosθ · V · wL / pω = <b>${value.toFixed(3)}</b>.<br>O rază de umbră blocată dă V=0, deci ΔL=0. Strategia BSDF folosește pω al aceleiași direcții pentru ponderea complementară.</p></details>`;
}
