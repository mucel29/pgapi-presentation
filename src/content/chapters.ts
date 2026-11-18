import {applyObservatoryShots,observatoryFinalView} from './world-shots.ts';
import type {Vec3} from '../core/math';
export type Layout='scene'|'technical'|'travel';
export interface SlideCopy {title:string;intro:string;points:string[];formula:string;}
export interface Chapter {slide:SlideCopy;id:string;section:string;title:string;accent:string;intro:string;points:string[];formula:string;formulaNote:string;code:string;codeLabel:string;codeSource:string;notes:string;sources:string[];camera:Vec3;target:Vec3;visual:string;duration:string;layout:Layout;}
import type {ShotMotion} from '../core/cinematics';
export interface Beat {compactCamera?:Vec3;compactTarget?:Vec3;motion?:ShotMotion;aimVia?:Vec3[];portraitCamera?:Vec3;portraitTarget?:Vec3;id:string;chapter:string;scene:'room'|'courtyard'|'portal';camera:Vec3;target:Vec3;via?:Vec3[];rayFrom:number;rayTo:number;visual:string;seconds:number;layout:Layout;travel:boolean;captureTime:number;captureStep?:number;title?:string;intro?:string;}
export const sources = {
  "reference": "https://mucel29.github.io/egc-presentation/",
  "weekend": "https://raytracing.github.io/books/RayTracingInOneWeekend.html",
  "next": "https://raytracing.github.io/books/RayTracingTheNextWeek.html",
  "pbrt": "https://pbr-book.org/4ed/Primitives_and_Intersection_Acceleration/Bounding_Volume_Hierarchies",
  "svgf": "https://research.nvidia.com/labs/rtr/publication/schied2017spatiotemporal/",
  "nrd": "https://github.com/NVIDIA-RTX/NRD",
  "oidn": "https://www.openimagedenoise.org/",
  "tracer": "https://github.com/gkjohnson/three-gpu-pathtracer/tree/v0.0.23",
  "meshbvh": "https://github.com/gkjohnson/three-mesh-bvh/tree/v0.8.3"
};
export const chapters:Chapter[] = [
  {
    "codeSource": "src/engine/journey.ts",
    "sources": [
      "https://mucel29.github.io/egc-presentation/",
      "https://github.com/gkjohnson/three-gpu-pathtracer/tree/v0.0.23"
    ],
    "duration": "0:25",
    "id": "room",
    "section": "INTRODUCERE",
    "title": "Algoritmul Ray Tracing",
    "accent": "INTERSECȚII · MATERIALE · BVH",
    "intro": "Un pixel din monitor trebuie să primească o culoare. Urmărim un traseu prin canion pentru a vedea ce calcule contribuie la ea.",
    "points": [
      "Camera virtuală lansează raza, iar intersecțiile găsesc suprafețele întâlnite.",
      "Materialele schimbă direcția și ponderea traseului.",
      "BVH reduce numărul testelor de geometrie."
    ],
    "formula": "pixel → traseu → contribuție RGB",
    "formulaNote": "O singură contribuție explică algoritmul. Imaginea cere multe asemenea estimări.",
    "code": "renderer.render(scene, observerCamera);\n// Path tracer-ul se încarcă numai la Start.",
    "codeLabel": "Randarea prezentării",
    "notes": "Deschidere: „Cum ajunge lumina din canionul de pe monitor într-un singur pixel?” Nu explicăm încă ecuația razei. Camera de pe birou oferă contextul, apoi intrăm prin monitor în scena virtuală. Vom urmări un traseu selectat și vom opri animația la calculele care contează. Ray tracing este mecanismul de interogare geometrică. Path tracing îl folosește pentru a estima transportul de lumină prin sampling. Animația este rasterizată și traseul este construit pentru explicație, nu reprezintă o randare Monte Carlo deja calculată. Explorarea cu path tracing rămâne o acțiune opțională, după lecție.",
    "camera": [
      2.4,
      3.5,
      5.9
    ],
    "target": [
      -0.8,
      1.9,
      -0.8
    ],
    "visual": "room",
    "layout": "scene",
    "slide": {
      "title": "Algoritmul Ray Tracing",
      "intro": "Cum calculăm culoarea unui pixel?",
      "points": [],
      "formula": ""
    }
  },
  {
    "codeSource": "GLSL didactic · cameră pinhole, convenție OpenGL",
    "sources": [
      "https://raytracing.github.io/books/RayTracingInOneWeekend.html"
    ],
    "duration": "0:45",
    "id": "ray",
    "section": "RAZA PRIMARĂ",
    "title": "Camera, pixelul și raza",
    "accent": "CAMERA → SCENĂ",
    "intro": "Un punct ales în pixel și poziția camerei definesc raza primară. Aceeași ecuație va descrie și segmentele de după un bounce.",
    "points": [
      "o este originea, iar d este direcția normalizată a razei.",
      "t > 0 caută puncte în fața originii. Dacă |d| = 1, t este o distanță.",
      "Urmărim traseul din cameră spre scenă, în sens invers propagării luminii."
    ],
    "formula": "r(t) = o + t · d,   t ≥ 0",
    "formulaNote": "o: origine · d: direcție · t ≥ 0",
    "code": "vec2 uv = (pixel + jitter) / resolution;\nvec4 view = inverseProjectionMatrix\n  * vec4(uv * 2.0 - 1.0, -1.0, 1.0);\nvec3 d = normalize(mat3(cameraWorldMatrix) * view.xyz);\nRay ray = Ray(cameraPosition, d);",
    "codeLabel": "Raza primară · inverse projection",
    "notes": "Arată camera virtuală, apoi pixelul mărit și direcția care le unește. Un singur r(t) descrie o infinitate de puncte. La intersecție vom rezolva pentru t, nu vom avansa raza cu pași mici. Sensul cameră → sursă economisește traseele care nu pot contribui la imagine. Codul folosește o cameră pinhole și inverse projection pentru FOV și aspect ratio. Convenția originii coordonatelor pixelului trebuie să corespundă framebuffer-ului. Lens sampling, motion blur și camera orthographic cer generatoare diferite. Monitorul din prolog nu este originea geometrică a razei din canion.",
    "camera": [
      -34,
      9,
      33
    ],
    "target": [
      -24,
      4,
      18
    ],
    "visual": "ray",
    "layout": "scene",
    "slide": {
      "title": "Camera, pixelul și raza",
      "intro": "O origine și o direcție descriu întregul segment.",
      "points": [
        "o: poziția camerei virtuale",
        "d normalizată: t devine distanță"
      ],
      "formula": "r(t) = o + t·d"
    }
  },
  {
    "codeSource": "src/core/math.ts · triangleIntersection / intersectTriangle",
    "sources": [
      "https://doi.org/10.1080/10867651.1997.10487468",
      "https://raytracing.github.io/books/RayTracingInOneWeekend.html"
    ],
    "duration": "1:30",
    "id": "hit",
    "section": "INTERSECȚII",
    "title": "Intersecția rază–triunghi",
    "accent": "NEAREST POSITIVE HIT",
    "intro": "O rază poate intersecta planul unui triunghi fără să atingă triunghiul. Möller–Trumbore rezolvă simultan distanța t și poziția baricentrică u, v.",
    "points": [
      "e₁ = B−A și e₂ = C−A formează baza triunghiului.",
      "u ≥ 0, v ≥ 0 și u+v ≤ 1 păstrează doar interiorul și muchiile.",
      "t > ε elimină hit-urile din spate și contactele numerice foarte apropiate.",
      "Dintre toate hit-urile valide păstrăm t minim. Normalele și UV se pot interpola cu aceleași ponderi."
    ],
    "formula": "o + td = A + u·e₁ + v·e₂",
    "formulaNote": "Ponderile vârfurilor sunt 1−u−v, u și v.",
    "code": "const e1 = sub(b,a), e2 = sub(c,a);\nconst p = cross(d,e2), det = dot(e1,p);\nif (Math.abs(det) < 1e-8) return null;\nconst tv = sub(o,a), u = dot(tv,p)/det;\nif (u < 0 || u > 1) return null;\nconst q = cross(tv,e1), v = dot(d,q)/det;\nif (v < 0 || u+v > 1) return null;\nconst t = dot(e2,q)/det;\nreturn t > 1e-4 ? t : null;",
    "codeLabel": "Möller–Trumbore · fragment prescurtat",
    "notes": "Începe cu un punct din interior, apoi mută-l dincolo de muchia BC: de ce există încă intersecție cu planul, dar nu cu triunghiul? La u+v > 1, ponderea lui A devine negativă. Cazul de pe muchie este acceptat de testul didactic. Determinantul aproape nul indică paralelism sau degenerare. Implementarea locală testează ambele fețe, fără backface culling. Epsilon-urile sunt praguri didactice, nu o soluție universală pentru toate scările scenei. Primul obiect al traseului este o sferă: punctul său de contact este construit analitic în route.ts. Diagrama rază–triunghi explică separat primitiva folosită de mesh-uri și apoi de BVH-ul punții. Pentru sferă, înlocuirea lui o+td în |p−c|²=r² produce o ecuație de gradul doi. În producție, teste watertight pot evita fisurile numerice la muchii comune.",
    "camera": [
      -28,
      9,
      12
    ],
    "target": [
      -20,
      4,
      1
    ],
    "visual": "hit",
    "layout": "technical",
    "slide": {
      "title": "Intersecția rază–triunghi",
      "intro": "Atingerea planului nu garantează un hit pe triunghi.",
      "points": [
        "Interior: u ≥ 0, v ≥ 0, u+v ≤ 1",
        "Scena: alegem cel mai mic t > ε"
      ],
      "formula": "P = (1−u−v)A + uB + vC"
    }
  },
  {
    "codeSource": "src/core/math.ts · cosineHemisphere",
    "sources": [
      "https://pbr-book.org/4ed/Sampling_Algorithms/Sampling_Multidimensional_Functions",
      "https://raytracing.github.io/books/RayTracingInOneWeekend.html"
    ],
    "duration": "1:15",
    "id": "diffuse",
    "section": "MATERIALE",
    "title": "Diffuse scattering",
    "accent": "DIFFUSE · COSINE-WEIGHTED SAMPLING",
    "intro": "Suprafața mată poate contribui din multe direcții ale emisferei. Într-un sample alegem doar una și îi compensăm probabilitatea în throughput.",
    "points": [
      "Pentru Lambertian, BRDF-ul este albedo / π.",
      "Cosine-weighted sampling are pdf(ω) = cosθ / π.",
      "Factorul f·cosθ/pdf se simplifică la albedo pentru acest model.",
      "Evantaiul arată direcții alternative. Numai segmentul selectat continuă traseul urmărit."
    ],
    "formula": "β ← β · (albedo/π) · cosθ / (cosθ/π)",
    "formulaNote": "Lambertian + cosine-weighted sampling",
    "code": "float r = sqrt(u1);\nfloat phi = 2.0 * PI * u2;\nvec3 local = vec3(r * cos(phi),\n                  r * sin(phi), sqrt(1.0-u1));\nvec3 nextDirection = tangentFrame * local;\nthroughput *= albedo;",
    "codeLabel": "GLSL · sampling în spațiul local",
    "notes": "Arată normala și două direcții valide, apoi segmentul ales spre metal. O suprafață mată nu trimite toate razele pe normală. Cosine-weighted sampling favorizează direcțiile apropiate de normală deoarece estimatorul conține deja cosθ. Formula afișată este rezultatul simplificării, nu o regulă pentru orice material sau orice PDF. β este o pondere RGB a estimatorului. Culoarea segmentului nu descrie un foton care își schimbă fizic culoarea. Direcția spre reflector este selectată pentru poveste și se află în emisfera validă. Evantaiul este un set determinist de eșantioane ilustrative, nu toate ramurile executate ale unui singur path.",
    "camera": [
      -29,
      11,
      18
    ],
    "target": [
      -17,
      4,
      5
    ],
    "visual": "diffuse",
    "layout": "scene",
    "slide": {
      "title": "Diffuse scattering",
      "intro": "O suprafață mată oferă multe continuări posibile.",
      "points": [
        "Alegem o direcție din emisfera normalei",
        "Cosine-weighted sampling simplifică ponderea"
      ],
      "formula": "β ← β · albedo"
    }
  },
  {
    "codeSource": "GLSL didactic · alegerea ramurii unui dielectric ideal",
    "sources": [
      "https://raytracing.github.io/books/RayTracingInOneWeekend.html"
    ],
    "duration": "1:40",
    "id": "materials",
    "section": "MATERIALE",
    "title": "Reflexie și refracție",
    "accent": "REFLECTION · REFRACTION · FRESNEL",
    "intro": "Reflexia pe metal ne conduce la o placă de sticlă. La intrare raza se apropie de normală, iar la ieșire se îndepărtează de ea.",
    "points": [
      "O suprafață metalică ideală reflectă în direcția reflect(d,n). Roughness lărgește distribuția reflexiilor.",
      "La sticlă, Snell folosește indicii mediului de plecare și de sosire.",
      "O placă cu fețe paralele, în aer pe ambele părți, produce o rază emergentă paralelă cu cea incidentă, deplasată lateral.",
      "Fresnel permite și reflexie. Din sticlă spre aer poate apărea total internal reflection."
    ],
    "formula": "r = d − 2(d·n)n;   η₁ sinθ₁ = η₂ sinθ₂",
    "formulaNote": "IOR = 1.5 · ramura transmisă prin ambele fețe",
    "code": "vec3 n = entering ? outwardNormal : -outwardNormal;\nfloat eta = entering ? 1.0 / ior : ior;\nfloat c = clamp(dot(-direction, n), 0.0, 1.0);\nbool tir = eta * sqrt(max(0.0, 1.0-c*c)) > 1.0;\nvec3 next = tir || random() < fresnelSchlick(c, eta)\n  ? reflect(direction, n) : refract(direction, n, eta);",
    "codeLabel": "GLSL · dielectric ideal (schematic)",
    "notes": "La heliostat anticipează următoarea oprire, sticla: „După două fețe paralele, în ce direcție iese raza?” Lasă un răspuns înainte de reveal. Raza emergentă este paralelă, dar deplasată lateral, dacă mediul exterior este același și nu urmărim reflexiile interne. Normala folosită de refract trebuie orientată împotriva direcției incidente. Snippet-ul arată numai alegerea direcției. Un estimator complet aplică și ponderile BSDF/PDF și factorii de transport la transmisie. În route.ts, geometria segmentelor respectă Snell, dar throughput-ul de după sticlă este păstrat ilustrativ, fără ponderi Fresnel sau absorbție. Metalul folosește o pondere RGB didactică. Rendererul final are model de microfațete. La ieșirea din sticlă, un unghi suficient de mare poate face refracția imposibilă, caz în care se reflectă întreaga energie pentru dielectricul ideal.",
    "camera": [
      8,
      12,
      4
    ],
    "target": [
      2,
      6,
      18
    ],
    "visual": "materials",
    "layout": "technical",
    "slide": {
      "title": "Reflexie și refracție",
      "intro": "Heliostatul reflectă raza spre placa de sticlă.",
      "points": [
        "Metal: reflexie, lărgită de roughness",
        "Sticlă: Snell la intrare și la ieșire"
      ],
      "formula": "d′ = d − 2(d·n)n"
    }
  },
  {
    "codeSource": "Pseudocod echivalent cu src/core/bvh.ts · traceTriangles",
    "sources": [
      "https://pbr-book.org/4ed/Primitives_and_Intersection_Acceleration/Bounding_Volume_Hierarchies"
    ],
    "duration": "0:50",
    "id": "cost",
    "section": "ACCELERARE",
    "title": "Costul intersecțiilor",
    "accent": "BRUTE FORCE · O(N) / RAZĂ",
    "intro": "Fiecare segment cere cel mai apropiat hit. Oprim traseul optic și inspectăm separat o interogare pe cele 144 de triunghiuri ale punții.",
    "points": [
      "Brute force repetă testul pentru fiecare triunghi al scenei la fiecare interogare.",
      "Puntea este construită din triunghiuri reale; numărăm exact testele.",
      "Un BVH trebuie să păstreze același closest-hit cu mai puține teste de primitive."
    ],
    "formula": "1 interogare → 144 teste brute force",
    "formulaNote": "Aceeași rază de test, același closest-hit.",
    "code": "float closest = INF;\nfor (int i = 0; i < triangleCount; i++) {\n  float t = intersectTriangle(ray, triangles[i]);\n  if (t > EPSILON && t < closest) {\n    closest = t;\n    hitTriangle = i;\n  }\n}",
    "codeLabel": "GLSL · căutare liniară (schematic)",
    "notes": "Pauză în traseul optic după sticlă. Raza de test de pe punte este o interogare separată, nu continuarea optică. Puntea are 12 grinzi × 12 triunghiuri = 144 primitive. Brute force le testează pe toate pentru o singură interogare closest-hit. BVH elimină grupuri prin cutii și trebuie să păstreze același hit. Numerele din demonstrație sunt teste geometrice, nu un benchmark FPS. După traversare reluăm traseul selectat până la sursă.",
    "camera": [
      -14,
      15,
      18
    ],
    "target": [
      -3,
      5,
      -15
    ],
    "visual": "cost",
    "layout": "technical",
    "slide": {
      "title": "Costul intersecțiilor",
      "intro": "Un segment. O interogare. 144 de triunghiuri.",
      "points": [
        "Traseul optic este în pauză",
        "Raza de test a punții este separată"
      ],
      "formula": "1 interogare → 144 teste brute force"
    }
  },
  {
    "codeSource": "src/core/bvh.ts · buildSAH",
    "sources": [
      "https://pbr-book.org/4ed/Primitives_and_Intersection_Acceleration/Bounding_Volume_Hierarchies",
      "https://github.com/gkjohnson/three-mesh-bvh/tree/v0.8.3"
    ],
    "duration": "1:15",
    "id": "bvh",
    "section": "BVH · CONSTRUCȚIE",
    "title": "Construirea unui BVH",
    "accent": "BOUNDING VOLUME HIERARCHY",
    "intro": "Triunghiurile structurii de pod sunt grupate într-un arbore de cutii. O cutie ratată elimină toate primitivele din subarbore.",
    "points": [
      "Rădăcina conține întreaga punte. Copiii conțin grupuri din ce în ce mai mici.",
      "Nodurile interne păstrează AABB-uri. Frunzele păstrează referințe la triunghiuri.",
      "În arborele didactic fiecare triunghi apare într-o singură frunză. Cutiile copiilor pot avea suprapuneri.",
      "Selectarea unui nod leagă grupul din arbore de geometria pe care o acoperă."
    ],
    "formula": "AABB(parent) = union(AABB(left), AABB(right))",
    "formulaNote": "Fiecare triunghi apare într-o singură frunză.",
    "code": "const node = { ...union(bounds, indices), indices };\nif (indices.length <= leafSize) return node;\n// Centre AABB: 16 bin-uri pe fiecare axă.\nconst split = minimumSAHCost(candidates);\nnode.children = [\n  build(leftOf(split)), build(rightOf(split))\n];",
    "codeLabel": "Construcție binned SAH · pseudocod prescurtat",
    "notes": "Selectează rădăcina, un copil și o frunză. Aceeași selecție trebuie să poată fi recunoscută în arbore și în scenă. Arată o zonă de canion aflată în afara unei cutii: o rază care nu atinge acea cutie nu are de ce să testeze triunghiurile din interior. Cutiile sunt calculate din vertecșii reali ai punții. Suprapunerea copiilor este permisă, deci uneori vizităm ambele ramuri. Arborele didactic încearcă frunze de maximum patru triunghiuri, dar poate opri mai devreme dacă nu există un split valid. BVH nu garantează O(log N) pentru orice rază sau scenă. Rendererul final construiește separat BVH-ul întregii scene prin three-mesh-bvh.",
    "camera": [
      -14,
      15,
      18
    ],
    "target": [
      -3,
      5,
      -15
    ],
    "visual": "bvh",
    "layout": "technical",
    "slide": {
      "title": "Construirea unui BVH",
      "intro": "Grupăm aceleași triunghiuri ale punții în cutii.",
      "points": [
        "Nod: o cutie care acoperă primitivele de dedesubt",
        "Miss la cutie: eliminăm întregul grup"
      ],
      "formula": "AABB părinte ⊇ AABB copii"
    }
  },
  {
    "codeSource": "src/core/bvh.ts · buildSAH",
    "sources": [
      "https://pbr-book.org/4ed/Primitives_and_Intersection_Acceleration/Bounding_Volume_Hierarchies",
      "https://github.com/gkjohnson/three-mesh-bvh/tree/v0.8.3"
    ],
    "duration": "1:05",
    "id": "sah",
    "section": "BVH · ÎMPĂRȚIRE",
    "title": "Surface Area Heuristic",
    "accent": "BOUNDING VOLUME HIERARCHY",
    "intro": "Două grupuri cu același număr de triunghiuri pot avea cutii foarte diferite. SAH estimează cât va costa testarea unui split.",
    "points": [
      "Raportul ariilor de suprafață estimează probabilitatea de a intersecta fiecare copil.",
      "Un copil cu arie mare și multe primitive primește un cost estimat mare.",
      "Implementarea locală evaluează 15 plane interioare pe axă, adică 16 bin-uri, folosind centrele AABB-urilor triunghiurilor.",
      "Alegem candidatul cu cost minim. Construirea mai costisitoare poate reduce munca de traversare ulterioară."
    ],
    "formula": "C = Ct + (Sₗ/Sₚ)·Nₗ·Ci + (Sᵣ/Sₚ)·Nᵣ·Ci",
    "formulaNote": "S: arie · N: primitive · Ct = Ci = 1 în modelul local",
    "code": "const cost = 1 + (\n  area(leftBounds) * left.length +\n  area(rightBounds) * right.length\n) / area(parentBounds);\n// Alege candidatul cu cost minim.",
    "codeLabel": "TypeScript · formula folosită de buildSAH",
    "notes": "Compară două plane candidate pe puntea reală. Întreabă care ar lăsa cutii mai greu de evitat, apoi verifică valoarea calculată. Echilibrarea numărului de triunghiuri nu este obiectivul în sine. SAH folosește aria suprafeței, nu volumul, ca model de probabilitate pentru o distribuție generală de raze. În constructorul local, punctele folosite la binning sunt centrele AABB-urilor triunghiurilor. Codul continuă împărțirea peste leafSize dacă există candidați și nu compară costul celui mai bun split cu costul păstrării unei frunze. Acesta este un constructor didactic, nu o copie completă a constructorului de producție. three-gpu-pathtracer 0.0.23 configurează strategia SAH a three-mesh-bvh. Beneficiul se evaluează împreună cu build time, memorie și distribuția reală a razelor.",
    "camera": [
      -14,
      15,
      18
    ],
    "target": [
      -3,
      5,
      -15
    ],
    "visual": "sah",
    "layout": "technical",
    "slide": {
      "title": "Surface Area Heuristic",
      "intro": "Un split 50/50 nu este automat cel mai ieftin.",
      "points": [
        "SAH estimează teste de cutii și de primitive",
        "Aria mai mare înseamnă o probabilitate estimată mai mare"
      ],
      "formula": "C = Ct + (SₗNₗ + SᵣNᵣ)·Ci/Sₚ"
    }
  },
  {
    "codeSource": "src/core/math.ts · intersectAABB",
    "sources": [
      "https://pbr-book.org/4ed/Primitives_and_Intersection_Acceleration/Bounding_Volume_Hierarchies"
    ],
    "duration": "1:05",
    "id": "aabb",
    "section": "BVH · SLAB TEST",
    "title": "Intersecția rază–AABB",
    "accent": "BOUNDING VOLUME HIERARCHY",
    "intro": "Pe fiecare axă, cele două plane ale cutiei definesc un interval de valori t. Raza trece prin cutie numai dacă intervalele se suprapun în fața originii.",
    "points": [
      "Pentru fiecare axă ordonăm intersecțiile cu planele min și max.",
      "tNear este maximul intrărilor. tFar este minimul ieșirilor.",
      "Un interval comun gol înseamnă miss, chiar dacă fiecare axă are separat un interval.",
      "Dacă direcția este paralelă cu un slab, originea trebuie să fie deja în interiorul lui."
    ],
    "formula": "tNear = max(0, tₓ⁻, tᵧ⁻, t𝓏⁻);   tFar = min(tₓ⁺, tᵧ⁺, t𝓏⁺)",
    "formulaNote": "tFar poate fi limitat la tClosest.",
    "code": "let near = 0, far = closest;\nfor (let a = 0; a < 3; a++) {\n  if (Math.abs(d[a]) < 1e-10) {\n    if (o[a] < min[a] || o[a] > max[a]) return null;\n    continue;\n  }\n  const t0 = (min[a]-o[a])/d[a], t1 = (max[a]-o[a])/d[a];\n  near = Math.max(near, Math.min(t0,t1));\n  far = Math.min(far, Math.max(t0,t1));\n  if (near > far) return null;\n}\nreturn near;",
    "codeLabel": "TypeScript · slab test cu raze paralele",
    "notes": "Folosește mai întâi benzile de interval, apoi formula. La x intrăm într-un interval, la y într-altul, la z într-altul. Avem hit numai unde toate trei sunt adevărate simultan. Mută un interval până dispare suprapunerea și observă miss-ul. Dacă tFar este negativ, cutia este în spatele originii. near pornește de la zero ca să caute numai în față. Cazul paralel nu împarte la zero: dacă originea e în afara slab-ului avem miss, altfel axa nu mai restrânge intervalul. Testul local folosește o toleranță mică pentru direcții aproape paralele. Raza folosită în diagrama BVH este o rază de test distinctă de traseul prin materiale.",
    "camera": [
      -14,
      15,
      18
    ],
    "target": [
      -3,
      5,
      -15
    ],
    "visual": "aabb",
    "layout": "technical",
    "slide": {
      "title": "Intersecția rază–AABB",
      "intro": "Cele trei intervale trebuie să se suprapună.",
      "points": [
        "Intrare: cea mai târzie dintre cele trei",
        "Ieșire: cea mai timpurie dintre cele trei"
      ],
      "formula": "hit dacă 0 ≤ tNear ≤ tFar"
    }
  },
  {
    "codeSource": "src/core/bvh.ts · traceSAH; src/core/math.ts · intersectTriangle",
    "sources": [
      "https://pbr-book.org/4ed/Primitives_and_Intersection_Acceleration/Bounding_Volume_Hierarchies",
      "https://github.com/gkjohnson/three-mesh-bvh/tree/v0.8.3"
    ],
    "duration": "1:50",
    "id": "traversal",
    "section": "BVH · TRAVERSARE",
    "title": "Traversarea BVH",
    "accent": "SLAB TEST · NEAR-FIRST TRAVERSAL",
    "intro": "Acum folosim arborele pentru aceeași întrebare ca brute force: care este cel mai apropiat triunghi lovit de rază?",
    "points": [
      "Stiva păstrează nodurile rămase. Copilul apropiat este vizitat primul, pentru a găsi repede un hit util.",
      "Un miss la AABB respinge subarborele. Într-o frunză executăm testele cu triunghiuri.",
      "tClosest scade când găsim un hit mai apropiat. Orice nod cu tNear > tClosest poate fi eliminat.",
      "Contoarele compară testele AABB și testele cu triunghiuri. Rezultatul geometric trebuie să coincidă cu brute force."
    ],
    "formula": "skip if AABB miss or tNear > tClosest",
    "formulaNote": "Auriu: nod activ. Cian: primitive candidate. Magenta: closest-hit curent.",
    "code": "const { node, near } = stack.pop()!;\nif (near === null || near > closest) continue;\nif (node.children) {\n  const children = testChildBounds(node.children);\n  children.sort((a,b) => b.near - a.near);\n  stack.push(...children); // near este extras primul\n} else {\n  for (const i of node.indices) {\n    const t = intersectTriangle(o,d,...triangles[i]);\n    if (t !== null && t < closest) closest = t;\n  }\n}",
    "codeLabel": "Traversare closest-hit · fragment prescurtat",
    "notes": "Pornește manual de la rădăcină și avansează până la prima frunză care produce un hit. Înainte de pasul următor, arată o cutie al cărei tNear depășește tClosest: „Mai poate conține un triunghi mai apropiat?” Nu, fiindcă triunghiurile sunt închise în cutie. Acesta este motivul pentru ordonarea near-first. Stiva LIFO primește copilul îndepărtat înaintea celui apropiat. AABB-urile copiilor sunt testate o singură dată la introducerea în stivă, iar evenimentele arată contoare cumulative. Un hit de cutie nu garantează un hit de triunghi. La final compară cu toate testele brute force și păstrează vizibile ambele tipuri de teste: testele AABB nu sunt gratuite. La preset-ul Miss nu trebuie să existe triunghi magenta. Distanța hit-ului poate fi comparată cu brute force pe aceeași geometrie. Nu convertim această reducere de teste într-un procent garantat de FPS.",
    "camera": [
      -14,
      15,
      18
    ],
    "target": [
      -3,
      5,
      -15
    ],
    "visual": "traversal",
    "layout": "technical",
    "slide": {
      "title": "Traversarea BVH",
      "intro": "Primul hit apropiat poate elimina ramuri întregi.",
      "points": [
        "Vizităm întâi copilul apropiat",
        "Comparăm același hit cu brute force"
      ],
      "formula": "skip dacă tNear > tClosest"
    }
  },
  {
    "codeSource": "src/core/lesson-state.ts · selectedPathEstimate",
    "sources": [
      "https://github.com/gkjohnson/three-gpu-pathtracer/tree/v0.0.23",
      "https://github.com/gkjohnson/three-mesh-bvh/tree/v0.8.3",
      "https://research.nvidia.com/labs/rtr/publication/schied2017spatiotemporal/"
    ],
    "duration": "0:45",
    "id": "light",
    "section": "TRASEU COMPLET",
    "title": "Contribuția la pixel",
    "accent": "CONTRIBUȚIA TRASEULUI",
    "intro": "Traseul selectat ajunge la o suprafață emisivă. Înmulțim emisia ei cu ponderea acumulată și adăugăm contribuția la estimarea pixelului.",
    "points": [
      "Intersecțiile și materialele au construit traseul. Emisia îl transformă într-o contribuție de lumină.",
      "BVH a redus munca pentru intersecții, păstrând răspunsul geometric.",
      "Un traseu complet produce o estimare. Urmează cadrul camerei inițiale, apoi media mai multor estimări."
    ],
    "formula": "L ← L + β · Le",
    "formulaNote": "Contribuție pentru un traseu. Pixelul final este media multor estimări.",
    "code": "vec3 contribution = beta * emission;\nL += contribution;\n// Un traseu complet → o estimare pentru pixelul q.",
    "codeLabel": "Contribuția traseului selectat",
    "notes": "Revino la întrebarea din camera cu biroul: „Ce culoare primește pixelul?” Acest traseu aduce β·Le, iar altele pot aduce contribuții diferite sau zero. Schimbarea culorii suprafeței diffuse ar modifica ponderea contribuției. Eliminarea BVH-ului ar modifica numărul testelor, dar trebuie să păstreze același hit. Sampling-ul și denoising-ul afectează variația și reconstrucția imaginii în moduri diferite. Închide lecția înainte de explorare. Canionul poate fi explorat imediat rasterizat. Start path tracing încarcă explicit rendererul 0.0.23, apoi construiește scena și începe acumularea. Nicio inițializare, compilare sau randare path-traced nu se face automat în timpul prezentării. La mișcare, modul real folosește până la 320×180 și două bounces. După aproximativ 400 ms de stabilitate revine la rezoluția configurată și implicit opt bounces, cu resetarea acumulării la schimbarea modului.",
    "camera": [
      31,
      12,
      -5
    ],
    "target": [
      42,
      6,
      -19
    ],
    "visual": "light",
    "layout": "scene",
    "slide": {
      "title": "Contribuția la pixel",
      "intro": "Emisia sursei intră în pixel cu ponderea întregului traseu.",
      "points": [
        "Acesta este un sample. Imaginea cere o medie."
      ],
      "formula": "L ← L + β · Le"
    }
  },
  {
    "codeSource": "GLSL didactic · bucla exterioară de sampling",
    "sources": [
      "https://raytracing.github.io/books/RayTracingInOneWeekend.html"
    ],
    "duration": "1:00",
    "id": "samples",
    "section": "SAMPLING",
    "title": "Samples și bounces",
    "accent": "SAMPLES ≠ BOUNCES",
    "intro": "Un sample este o estimare pentru pixel, construită dintr-un traseu. Bounces limitează cât de departe poate continua acel traseu.",
    "points": [
      "Jitter alege o poziție subpixel. BSDF și light sampling aleg alte variabile de-a lungul traseului.",
      "32 samples înseamnă 32 estimări pentru pixel, chiar dacă fiecare permite până la 8 bounces.",
      "Limita de bounces controlează transportul inclus. Un număr mai mare de samples reduce variația estimării.",
      "Într-un path tracer obișnuit continuăm câte o direcție BSDF la fiecare bounce. Nu construim un arbore exhaustiv de reflexii."
    ],
    "formula": "L̂ = (L₁ + L₂ + … + Lₙ) / N",
    "formulaNote": "Trasee schematice complete · contribuții RGB ilustrative, separate de renderer",
    "code": "vec3 color = vec3(0.0);\nfor (int s = 0; s < samples; s++) {\n  Ray ray = generateCameraRay(pixel, random2());\n  color += tracePath(ray, maxBounces);\n}\ncolor /= float(samples);",
    "codeLabel": "GLSL · estimare Monte Carlo (schematic)",
    "notes": "Compară două reglaje: 32 samples cu maximum 2 bounces și 32 samples cu maximum 8 bounces. Numărul estimărilor rămâne 32. În a doua variantă, fiecare traseu poate include mai multă iluminare indirectă și poate costa mai mult. Samples per pixel nu se obține înmulțind samples cu bounces. Nici fiecare segment desenat înseamnă un sample nou. O limită fixă mică de bounces poate omite contribuții reale, deci acumularea unui număr oricât de mare de samples nu repară acea trunchiere. O parte dintre trasee se pot termina înainte de limită, de exemplu la miss sau prin Russian roulette. În explorator, BSDF principal are un buget separat de cele 8 traversări transmisive suplimentare. Produsul samples × segmente este doar plafonul modelului didactic și exclude umbrele.",
    "camera": [
      -33,
      10,
      34
    ],
    "target": [
      -23,
      4,
      13
    ],
    "visual": "samples",
    "layout": "technical",
    "slide": {
      "title": "Samples și bounces",
      "intro": "Mai multe samples adaugă estimări. Mai multe bounces prelungesc fiecare traseu.",
      "points": [
        "Sample: un traseu estimat pentru pixel",
        "Bounces: limita interacțiunilor pe traseu"
      ],
      "formula": "L̂ = (1/N) Σ Lᵢ"
    }
  },
  {
    "codeSource": "Pseudocod; renderer real: three-gpu-pathtracer 0.0.23 · PhysicalPathTracingMaterial",
    "sources": [
      "https://pbr-book.org/4ed/Light_Transport_I_Surface_Reflection/A_Better_Path_Tracer",
      "https://github.com/gkjohnson/three-gpu-pathtracer/tree/v0.0.23"
    ],
    "duration": "1:40",
    "id": "loop",
    "section": "IMPLEMENTARE",
    "title": "Bucla de path tracing",
    "accent": "RADIANCE L · THROUGHPUT β",
    "intro": "Bucla păstrează două mărimi: L adună contribuțiile, iar β transportă ponderea cu care vor intra contribuțiile următoare.",
    "points": [
      "La o suprafață emisivă adăugăm β·Le în L. La miss evaluăm environment-ul.",
      "Direct lighting alege o sursă și verifică vizibilitatea cu un shadow ray. MIS combină această estimare cu BSDF sampling.",
      "La un material continuăm cu un sample BSDF și actualizăm β. Pentru o distribuție continuă, factorul este f·|n·ω|/pdf.",
      "Originea noii raze trebuie deplasată robust de pe suprafață. Russian roulette poate termina traseele cu ponderare compensată."
    ],
    "formula": "L ← L + β·contribuție;   β ← β·f·|n·ω|/pdf",
    "formulaNote": "L: sumă · β: pondere multiplicativă",
    "code": "vec3 L = vec3(0.0), beta = vec3(1.0);\nfor (int b = 0; b < maxBounces; b++) {\n  Hit h = intersectScene(ray);\n  if (!h.found) { L += beta * environmentMIS(ray); break; }\n  L += beta * emittedMIS(h);\n  L += beta * estimateDirectMIS(h); // shadow ray\n  BSDFSample s = sampleBSDF(h, ray);\n  if (!s.valid) break;\n  beta *= s.weight; // f * abs(n·wi) / pdf, pentru BSDF continuu\n  ray = spawnOffsetRay(h, s.direction);\n}",
    "codeLabel": "Pseudocod · starea unui singur path",
    "notes": "Urmează întâi β: la început (1,1,1), după diffuse se înmulțește cu albedo, iar materialul următor o modifică din nou. L poate rămâne zero până apare o contribuție de la o sursă sau environment. Direct lighting poate adăuga lumină înainte ca traseul principal să lovească sursa. Shadow ray este o interogare de vizibilitate, nu continuarea BSDF a path-ului. Pentru MIS, helper-ele din pseudocod includ ponderile adecvate la emisie și environment, ca să nu dublăm contribuția estimată și prin light sampling. s.weight ascunde tratarea specială a distribuțiilor delta și a transmisiei. Russian roulette nu apare în snippet: dacă supraviețuirea are probabilitatea p, ponderea supraviețuitorului devine β/p. Această compensare păstrează media, spre deosebire de tăierea arbitrară a contribuțiilor mici. Shaderul real este PhysicalPathTracingMaterial din versiunea 0.0.23, nu codul compact de aici. Bucla exterioară repetă sample-uri pentru același pixel. Demonstrația trece de la o iterație difuză la rezumatul contactelor deja urmărite, termină la sursă și apoi salvează contribuția în medie. Buget ulterior: 1920 × 1080 × 64 samples × până la 6 interogări ≈ 796 milioane cereri closest-hit, fără shadow rays; nu este benchmark.",
    "camera": [
      -7,
      17,
      30
    ],
    "target": [
      4,
      5,
      3
    ],
    "visual": "loop",
    "layout": "technical",
    "slide": {
      "title": "Bucla de path tracing",
      "intro": "L adună contribuțiile. β le păstrează ponderea.",
      "points": [
        "La material: alegem direcția și actualizăm β",
        "La lumină: adăugăm o contribuție în L"
      ],
      "formula": "β *= f·|n·ω|/pdf"
    }
  },
  {
    "codeSource": "src/engine/finale.ts",
    "sources": [
      "https://raytracing.github.io/books/RayTracingInOneWeekend.html",
      "https://research.nvidia.com/labs/rtr/publication/schied2017spatiotemporal/"
    ],
    "duration": "1:00",
    "id": "noise",
    "section": "SAMPLING · ACUMULARE",
    "title": "Zgomot și acumulare progresivă",
    "accent": "MONTE CARLO · CONVERGENȚĂ",
    "intro": "Traseele diferite dau contribuții diferite pentru același pixel. Acumularea estimează media lor, dar convergența Monte Carlo este lentă.",
    "points": [
      "Pentru samples independente cu varianță finită, eroarea standard a mediei scade ca 1/√N.",
      "Înjumătățirea erorii standard cere aproximativ de patru ori mai multe samples.",
      "Acumulăm radiance liniară înainte de tone mapping și conversia pentru afișare.",
      "Când camera sau scena se schimbă, vechea medie nu mai estimează aceeași imagine și trebuie resetată."
    ],
    "formula": "Cₙ = Cₙ₋₁ + (Sₙ − Cₙ₋₁) / n",
    "formulaNote": "Experiment sintetic de sampling, separat de rendererul scenei.",
    "code": "vec3 sample = tracePath(ray);\nvec3 previous = texelFetch(history, pixel, 0).rgb;\nvec3 average = previous + (sample - previous) / sampleCount;\n// Camera / lumină / material / rezoluție schimbată?\n// sampleCount = 1; history se reconstruiește.",
    "codeLabel": "Acumulare staționară · fragment explicativ",
    "notes": "Cere o estimare: „De câte ori mărim samples ca să înjumătățim zgomotul?” Compară 4, 16 și 64 în experiment. Tendința statistică este 1/√N, dar o realizare particulară nu trebuie să se îmbunătățească monoton la fiecare pas. Dacă graficul afișează RMSE, el măsoară eroarea experimentului sintetic față de valoarea sa de referință. Nu este un benchmark sau o imagine path-traced a canionului. Monte Carlo noise din iluminare este diferit de aliasing-ul contururilor. Acumularea staționară din explorare se resetează la schimbarea camerei și nu implementează reproiecție temporală. Un filtru spațial aplicat pentru afișare nu trebuie reintrodus ca istoric al acumulării brute.",
    "camera": [
      -8,
      18,
      37
    ],
    "target": [
      4,
      5,
      -3
    ],
    "visual": "noise",
    "layout": "technical",
    "slide": {
      "title": "Zgomot și acumulare",
      "intro": "Jumătate din eroare cere aproximativ 4× samples.",
      "points": [
        "Acumulăm media contribuțiilor pentru același pixel",
        "Mișcarea camerei cere o medie nouă"
      ],
      "formula": "eroare standard ∝ 1/√N"
    }
  },
  {
    "codeSource": "src/engine/denoiser.ts",
    "sources": [
      "https://research.nvidia.com/labs/rtr/publication/schied2017spatiotemporal/",
      "https://github.com/NVIDIA-RTX/NRD",
      "https://www.openimagedenoise.org/"
    ],
    "duration": "0:45",
    "id": "denoise",
    "section": "DENOISING",
    "title": "Denoising ghidat",
    "accent": "GUIDED À-TROUS FILTER",
    "intro": "Un blur simplu amestecă zgomotul și muchiile. Un filtru ghidat scade influența vecinilor care aparțin altei suprafețe.",
    "points": [
      "Filtrul local à-trous folosește normal, depth și albedo, plus diferența de luminanță.",
      "Pașii 1, 2 și 4 măresc zona filtrată fără schimbarea dimensiunii kernel-ului.",
      "Filtrarea introduce un compromis: mai puțin zgomot, dar posibilă pierdere de detalii și bias.",
      "SVGF și NRD adaugă mecanisme temporale. OIDN folosește rețele neuronale. Proiectul nu integrează aceste sisteme."
    ],
    "formula": "w = kernel · wNormal · wDepth · wAlbedo · wLuminance",
    "formulaNote": "Filtru spațial à-trous. Output separat de acumularea brută.",
    "code": "float wn = pow(max(dot(n0, nq), 0.0), 32.0);\nfloat wz = exp(-abs(z0-zq) / depthScale);\nfloat wa = exp(-length(a0-aq) * 8.0);\nfloat wl = exp(-abs(luma(c0)-luma(cq)) / colorScale);\nfloat weight = kernel * wn * wz * wa * wl;\nsum += weight * cq;\nweightSum += weight;\n// Ping-pong separat; acumularea brută rămâne intactă.",
    "codeLabel": "GLSL · extras din filtrul implementat",
    "notes": "Păstrează secțiunea scurtă. Arată doi pixeli vecini aflați pe suprafețe diferite: media lor ar șterge muchia. Normal și depth reduc ponderea vecinului incompatibil, iar albedo ajută la separarea materialelor. În proiect există un filtru spațial cu pași dilatați, fără istoric reproiectat și fără estimarea completă de varianță din SVGF. Ghosting-ul și disocclusion sunt probleme ale metodelor temporale, nu etichete pentru filtrul spațial de aici. Ghidajele primei suprafețe nu descriu complet zgomotul văzut prin sticlă sau în reflexii. O imagine mai netedă nu dovedește o estimare mai corectă a iluminării. Denoising-ul completează sampling-ul, fără să înlocuiască transportul lipsă dintr-o limită prea mică de bounces.",
    "camera": [
      -8,
      18,
      37
    ],
    "target": [
      4,
      5,
      -3
    ],
    "visual": "denoise",
    "layout": "technical",
    "slide": {
      "title": "Denoising ghidat",
      "intro": "Ce vecini putem media fără să ștergem muchia?",
      "points": [
        "Normal, depth și albedo separă suprafețele",
        "Mai multă filtrare poate pierde detalii"
      ],
      "formula": "à-trous: pas 1 → 2 → 4"
    }
  }
];
export const beats:Beat[] = [
  {
    "id": "room",
    "chapter": "room",
    "scene": "room",
    "camera": [
      2.4,
      2.6,
      5.9
    ],
    "target": [
      -1.02,
      2.16,
      -1.047
    ],
    "rayFrom": 0,
    "rayTo": 0,
    "visual": "room",
    "seconds": 0,
    "layout": "scene",
    "travel": false,
    "captureTime": 1,
    "motion": "hold"
  },
  {
    "id": "portal",
    "chapter": "ray",
    "scene": "portal",
    "camera": [
      -52,
      5.5,
      44
    ],
    "target": [
      -32,
      4,
      -2
    ],
    "rayFrom": 0,
    "rayTo": 0,
    "visual": "room",
    "seconds": 4.8,
    "layout": "travel",
    "travel": true,
    "captureTime": 1,
    "title": "Canionul de pe monitor",
    "intro": "Intrăm în scena pe care vrem să o randăm.",
    "motion": "portal"
  },
  {
    "id": "ray",
    "chapter": "ray",
    "scene": "courtyard",
    "camera": [
      -52,
      5.5,
      44
    ],
    "target": [
      -38,
      4,
      19
    ],
    "rayFrom": 0,
    "rayTo": 0.18,
    "visual": "ray",
    "seconds": 2.3,
    "layout": "scene",
    "travel": false,
    "captureTime": 1,
    "motion": "launch"
  },
  {
    "id": "hit",
    "chapter": "hit",
    "scene": "courtyard",
    "camera": [
      -43,
      5.6,
      10
    ],
    "target": [
      -32,
      4,
      -4
    ],
    "rayFrom": 0.18,
    "rayTo": 1,
    "visual": "hit",
    "seconds": 3.3,
    "layout": "technical",
    "travel": false,
    "captureTime": 1,
    "via": [
      [
        -48,
        5.3,
        28
      ]
    ],
    "motion": "launch"
  },
  {
    "id": "diffuse",
    "chapter": "diffuse",
    "scene": "courtyard",
    "camera": [
      -40,
      5.7,
      6
    ],
    "target": [
      -30,
      4,
      -1
    ],
    "rayFrom": 1,
    "rayTo": 1,
    "visual": "diffuse",
    "seconds": 1.6,
    "layout": "scene",
    "travel": false,
    "captureTime": 1,
    "motion": "arrive"
  },
  {
    "id": "diffuse-chosen",
    "chapter": "diffuse",
    "scene": "courtyard",
    "camera": [
      -40,
      5.7,
      6
    ],
    "target": [
      -30,
      4,
      -1
    ],
    "rayFrom": 1,
    "rayTo": 1,
    "visual": "diffuse",
    "seconds": 1.6,
    "layout": "scene",
    "travel": false,
    "captureTime": 0,
    "motion": "arrive"
  },
  {
    "id": "to-metal",
    "chapter": "materials",
    "scene": "courtyard",
    "camera": [
      -2,
      6.8,
      12
    ],
    "target": [
      8,
      6,
      28
    ],
    "rayFrom": 1,
    "rayTo": 2,
    "visual": "materials",
    "seconds": 4.8,
    "layout": "travel",
    "travel": true,
    "captureTime": 1,
    "title": "Spre reflector",
    "intro": "Continuăm pe direcția selectată la suprafața mată.",
    "via": [
      [
        -25,
        5.5,
        13
      ],
      [
        -13,
        5.8,
        20
      ]
    ],
    "aimVia": [
      [
        -22,
        4,
        7
      ],
      [
        -5,
        6,
        25
      ]
    ],
    "motion": "travel"
  },
  {
    "id": "materials",
    "chapter": "materials",
    "scene": "courtyard",
    "camera": [
      0,
      6.5,
      15
    ],
    "target": [
      8,
      6,
      28
    ],
    "rayFrom": 2,
    "rayTo": 2,
    "visual": "materials",
    "seconds": 1.2,
    "layout": "technical",
    "travel": false,
    "captureTime": 1,
    "motion": "arrive"
  },
  {
    "id": "to-glass",
    "chapter": "materials",
    "scene": "courtyard",
    "camera": [
      39,
      12,
      -19
    ],
    "target": [
      51,
      6,
      -12
    ],
    "rayFrom": 2,
    "rayTo": 4.18,
    "visual": "materials",
    "seconds": 6.4,
    "layout": "travel",
    "travel": true,
    "captureTime": 1,
    "title": "Prin placa de sticlă",
    "intro": "Segmentul transmis traversează cele două fețe.",
    "motion": "glass",
    "portraitCamera": [
      32,
      15,
      -25
    ],
    "portraitTarget": [
      52,
      6,
      -13
    ]
  },
  {
    "id": "cost",
    "chapter": "cost",
    "scene": "courtyard",
    "camera": [
      -24,
      7,
      -14
    ],
    "target": [
      -12,
      4,
      -38
    ],
    "rayFrom": 4.18,
    "rayTo": 4.18,
    "visual": "cost",
    "seconds": 2.8,
    "layout": "technical",
    "travel": false,
    "captureTime": 1,
    "via": [
      [
        -12,
        14,
        38
      ],
      [
        -24,
        10,
        4
      ]
    ],
    "motion": "arrive"
  },
  {
    "id": "bvh",
    "chapter": "bvh",
    "scene": "courtyard",
    "camera": [
      -24,
      7,
      -14
    ],
    "target": [
      -12,
      4,
      -38
    ],
    "rayFrom": 4.18,
    "rayTo": 4.18,
    "visual": "bvh",
    "seconds": 0,
    "layout": "technical",
    "travel": false,
    "captureTime": 1,
    "motion": "hold"
  },
  {
    "id": "sah",
    "chapter": "sah",
    "scene": "courtyard",
    "camera": [
      -24,
      7,
      -14
    ],
    "target": [
      -12,
      4,
      -38
    ],
    "rayFrom": 4.18,
    "rayTo": 4.18,
    "visual": "sah",
    "seconds": 0,
    "layout": "technical",
    "travel": false,
    "captureTime": 1,
    "motion": "hold"
  },
  {
    "id": "aabb",
    "chapter": "aabb",
    "scene": "courtyard",
    "camera": [
      -24,
      7,
      -14
    ],
    "target": [
      -12,
      4,
      -38
    ],
    "rayFrom": 4.18,
    "rayTo": 4.18,
    "visual": "aabb",
    "seconds": 0,
    "layout": "technical",
    "travel": false,
    "captureTime": 1,
    "motion": "hold"
  },
  {
    "id": "traversal",
    "chapter": "traversal",
    "scene": "courtyard",
    "camera": [
      -24,
      7,
      -14
    ],
    "target": [
      -12,
      4,
      -38
    ],
    "rayFrom": 4.18,
    "rayTo": 4.18,
    "visual": "traversal",
    "seconds": 0,
    "layout": "technical",
    "travel": false,
    "captureTime": 1,
    "captureStep": 5,
    "motion": "hold"
  },
  {
    "id": "to-light",
    "chapter": "light",
    "scene": "courtyard",
    "camera": [
      67,
      6.2,
      -29
    ],
    "target": [
      79,
      6,
      -40
    ],
    "rayFrom": 4.18,
    "rayTo": 5,
    "visual": "light",
    "seconds": 4.8,
    "layout": "travel",
    "travel": true,
    "captureTime": 1,
    "title": "Spre suprafața emisivă",
    "intro": "Ultimul segment al traseului selectat.",
    "via": [
      [
        49,
        6.8,
        -13
      ],
      [
        58,
        6.5,
        -21
      ]
    ],
    "aimVia": [
      [
        61,
        6,
        -25
      ]
    ],
    "motion": "travel"
  },
  {
    "id": "light",
    "chapter": "light",
    "scene": "courtyard",
    "camera": [
      10,
      42,
      112
    ],
    "target": [
      12,
      4,
      -5
    ],
    "rayFrom": 5,
    "rayTo": 5,
    "visual": "light",
    "seconds": 4.6,
    "layout": "scene",
    "travel": false,
    "captureTime": 1,
    "via": [
      [
        49,
        8,
        -14
      ],
      [
        39,
        18,
        -23
      ],
      [
        25,
        24,
        12
      ]
    ],
    "motion": "arrive",
    "portraitCamera": [
      10,
      60,
      230
    ],
    "portraitTarget": [
      12,
      5,
      -5
    ]
  },
  {
    "id": "image",
    "chapter": "light",
    "scene": "courtyard",
    "camera": [
      10,
      42,
      112
    ],
    "target": [
      12,
      4,
      -5
    ],
    "rayFrom": 5,
    "rayTo": 5,
    "visual": "image",
    "seconds": 0,
    "layout": "scene",
    "travel": false,
    "captureTime": 1,
    "via": [],
    "motion": "hold",
    "portraitCamera": [
      10,
      60,
      230
    ],
    "portraitTarget": [
      12,
      5,
      -5
    ],
    "title": "De la pixel la imagine",
    "intro": "Schimbăm perspectiva: privim acum prin camera virtuală inițială. Cadrul rasterizat identifică imaginea și pixelul q; nu este rezultatul sample-ului didactic.",
    "aimVia": []
  },
  {
    "id": "samples",
    "chapter": "samples",
    "scene": "courtyard",
    "camera": [
      39,
      12,
      -19
    ],
    "target": [
      -36,
      4,
      16
    ],
    "rayFrom": 4.18,
    "rayTo": 4.18,
    "visual": "samples",
    "seconds": 1.8,
    "layout": "technical",
    "travel": false,
    "captureTime": 1,
    "motion": "arrive",
    "portraitCamera": [
      32,
      15,
      -25
    ],
    "portraitTarget": [
      -36,
      4,
      16
    ]
  },
  {
    "id": "loop",
    "chapter": "loop",
    "scene": "courtyard",
    "camera": [
      -24,
      8,
      -4
    ],
    "target": [
      -12,
      4,
      -38
    ],
    "rayFrom": 4.18,
    "rayTo": 4.18,
    "visual": "loop",
    "seconds": 1.8,
    "layout": "technical",
    "travel": false,
    "captureTime": 1,
    "motion": "arrive"
  },
  {
    "id": "noise",
    "chapter": "noise",
    "scene": "courtyard",
    "camera": [
      44,
      7,
      -14
    ],
    "target": [
      61,
      6,
      -24
    ],
    "rayFrom": 4.18,
    "rayTo": 4.18,
    "visual": "noise",
    "seconds": 2.8,
    "layout": "technical",
    "travel": false,
    "captureTime": 1,
    "via": [
      [
        12,
        12,
        -10
      ],
      [
        33,
        8,
        -10
      ]
    ],
    "motion": "arrive"
  },
  {
    "id": "denoise",
    "chapter": "denoise",
    "scene": "courtyard",
    "camera": [
      44,
      7,
      -14
    ],
    "target": [
      61,
      6,
      -24
    ],
    "rayFrom": 4.18,
    "rayTo": 4.18,
    "visual": "denoise",
    "seconds": 0,
    "layout": "technical",
    "travel": false,
    "captureTime": 1,
    "motion": "hold"
  }
];

applyObservatoryShots(beats);
export const finalView=observatoryFinalView;
export const glossary=[["Radiance (L)", "Mărime radiometrică direcțională estimată de integrator și integrată pentru pixel."], ["Throughput (β)", "Ponderea cumulată a unui traseu; include BSDF, cosinus și PDF."], ["BSDF / PDF", "Modelul interacțiunii / densitatea de probabilitate a direcției alese."], ["BVH / AABB", "Ierarhie de volume / cutie aliniată la axele scenei."], ["SPP", "Samples per pixel; număr de estimări de traseu pentru un pixel."], ["Denoising", "Reconstrucție cu un compromis între reducerea varianței și păstrarea detaliilor."]];
