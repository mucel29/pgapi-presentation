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
    "accent": "INTERSECȚII · MATERIALE · BVH · ZGOMOT",
    "intro": "Un pixel de pe monitor are nevoie de o culoare. O rază pornește din cameră, lovește suprafețe și ajunge la o sursă de lumină.",
    "points": [
      "Raza pornește din cameră și caută cea mai apropiată suprafață.",
      "Materialul decide unde merge raza mai departe.",
      "BVH face căutarea suprafețelor rapidă."
    ],
    "formula": "pixel → rază → suprafețe → lumină",
    "formulaNote": "Urmărim o singură rază prin toată scena.",
    "code": "renderer.render(scene, observerCamera);\n// Path tracer-ul se încarcă numai la Start.",
    "codeLabel": "Randarea prezentării",
    "notes": "Pornim de la o întrebare: ce culoare primește un pixel de pe monitor? Ray tracing pornește invers față de lumină: din cameră spre scenă. Urmărim o singură rază prin canion. La fiecare oprire explicăm un calcul: intersecția, materialul, accelerarea, apoi zgomotul. Apasă Space pentru a intra prin monitor.",
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
      "intro": "Culoarea unui pixel vine din lumina care ajunge în cameră.",
      "points": [],
      "formula": ""
    }
  },
  {
    "codeSource": "GLSL · cameră pinhole",
    "sources": [
      "https://raytracing.github.io/books/RayTracingInOneWeekend.html"
    ],
    "duration": "0:45",
    "id": "ray",
    "section": "RAZA PRIMARĂ",
    "title": "Camera, pixelul și raza",
    "accent": "CAMERĂ → SCENĂ",
    "intro": "Camera și un punct din pixel definesc raza primară. Aceeași ecuație descrie fiecare segment de după un bounce.",
    "points": [
      "o este originea. d este direcția, cu lungimea 1.",
      "t > 0 înseamnă un punct în fața camerei. Cu |d| = 1, t este o distanță.",
      "Pornim din cameră spre scenă, invers față de lumină."
    ],
    "formula": "r(t) = o + t · d,   t ≥ 0",
    "formulaNote": "o: origine · d: direcție · t: distanță",
    "code": "vec2 uv = (pixel + jitter) / resolution;\nvec4 view = inverseProjectionMatrix\n  * vec4(uv * 2.0 - 1.0, -1.0, 1.0);\nvec3 d = normalize(mat3(cameraWorldMatrix) * view.xyz);\nRay ray = Ray(cameraPosition, d);",
    "codeLabel": "Raza primară · inverse projection",
    "notes": "Camera virtuală este punctul o. Alegem un punct q în interiorul pixelului. Direcția este d = normalize(q − o). Orice punct de pe rază este o + t·d. Intersecția înseamnă să găsim t, nu să mutăm raza în pași mici. Aceeași ecuație descrie fiecare segment de după un bounce.",
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
      "intro": "O origine și o direcție descriu toată raza.",
      "points": [
        "o: poziția camerei",
        "d de lungime 1: t este distanța"
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
    "duration": "2:15",
    "id": "hit",
    "section": "INTERSECȚII",
    "title": "Intersecția rază–triunghi",
    "accent": "MÖLLER–TRUMBORE",
    "intro": "Sfera din scenă este un mesh de 440 de triunghiuri. Raza primară lovește triunghiul #187. Möller–Trumbore calculează t, u și v pentru acest triunghi.",
    "points": [
      "e₁ = B−A și e₂ = C−A sunt muchiile triunghiului.",
      "P = A + u·e₁ + v·e₂ este în triunghi dacă u ≥ 0, v ≥ 0 și u+v ≤ 1.",
      "Dacă det ≈ 0, raza este paralelă cu planul.",
      "Dintre toate hit-urile cu t > ε, păstrăm t minim."
    ],
    "formula": "o + t·d = A + u·e₁ + v·e₂",
    "formulaNote": "Ponderile vârfurilor A, B, C sunt 1−u−v, u și v.",
    "code": "const e1 = sub(b,a), e2 = sub(c,a);\nconst p = cross(d,e2), det = dot(e1,p);\nif (Math.abs(det) < 1e-8) return null;\nconst tv = sub(o,a), u = dot(tv,p)/det;\nif (u < 0 || u > 1) return null;\nconst q = cross(tv,e1), v = dot(d,q)/det;\nif (v < 0 || u+v > 1) return null;\nconst t = dot(e2,q)/det;\nreturn t > 1e-4 ? t : null;",
    "codeLabel": "Möller–Trumbore",
    "notes": "Pasul 1. Sfera cian este un mesh: 440 de triunghiuri. Raza primară lovește triunghiul #187, conturat cu alb pe sferă. Cardul din stânga arată exact acest triunghi, cu culoarea sferei. Raza vine din camera o, aflată la aproximativ 60 de unități.\n\nMută sliderele u și v. Raza pleacă tot din o, dar spre alt punct P al planului. Cât timp u ≥ 0, v ≥ 0 și u+v ≤ 1, P este în triunghi. Apasă „În afară”: raza lovește planul, dar nu triunghiul. Apasă „Paralel”: det este aproape zero și nu există soluție. „Raza reală” revine la raza din scenă.\n\nPasul 2. Ecuația o + t·d = A + u·e₁ + v·e₂ are trei necunoscute: t, u, v. Fiecare axă dă o ecuație. Apasă „Pas →” și citește valorile reale: e₁, e₂, P, det, u, Q, v, t. Ultimul pas dă t ≈ 59.53, distanța de la cameră la sferă.\n\nCu „În afară”, algoritmul se oprește la u sau la v și nu mai calculează t. Testul rulează de milioane de ori pe cadru. BVH-ul reduce numărul de teste. Ieșirea timpurie reduce costul fiecărui test.",
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
      "intro": "Raza primară lovește un triunghi al sferei.",
      "points": [
        "Interior: u ≥ 0, v ≥ 0, u+v ≤ 1",
        "Păstrăm cel mai mic t > ε"
      ],
      "formula": "o + t·d = A + u·e₁ + v·e₂"
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
    "title": "Suprafața mată",
    "accent": "DIFUZ · COSINE-WEIGHTED SAMPLING",
    "intro": "O suprafață mată împrăștie lumina în toată emisfera normalei. Un sample alege o singură direcție și corectează ponderea cu probabilitatea ei.",
    "points": [
      "BRDF-ul Lambert este albedo / π.",
      "Cosine-weighted sampling alege direcția cu pdf = cosθ / π.",
      "f·cosθ / pdf devine albedo.",
      "Evantaiul arată direcții posibile. Raza continuă pe una singură."
    ],
    "formula": "β ← β · (albedo/π) · cosθ / (cosθ/π)",
    "formulaNote": "Lambert + cosine-weighted sampling",
    "code": "float r = sqrt(u1);\nfloat phi = 2.0 * PI * u2;\nvec3 local = vec3(r * cos(phi),\n                  r * sin(phi), sqrt(1.0-u1));\nvec3 nextDirection = tangentFrame * local;\nthroughput *= albedo;",
    "codeLabel": "GLSL · sampling în emisferă",
    "notes": "Raza lovește o suprafață mată. O suprafață mată împrăștie lumina în toată emisfera normalei. Evantaiul arată direcțiile posibile. Într-un sample alegem una singură, la întâmplare.\n\nAlegem mai des direcțiile apropiate de normală (cosine-weighted sampling). Atunci factorul cosθ și densitatea p se simplifică, iar ponderea devine β ← β · albedo. Culoarea razei arată ponderea β, nu culoarea unui foton.",
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
      "title": "Suprafața mată",
      "intro": "O suprafață mată poate trimite raza în multe direcții.",
      "points": [
        "Alegem o direcție din emisfera normalei",
        "Cosine-weighted sampling simplifică ponderea"
      ],
      "formula": "β ← β · albedo"
    }
  },
  {
    "codeSource": "GLSL · alegerea ramurii pentru sticlă",
    "sources": [
      "https://raytracing.github.io/books/RayTracingInOneWeekend.html"
    ],
    "duration": "1:40",
    "id": "materials",
    "section": "MATERIALE",
    "title": "Reflexie și refracție",
    "accent": "REFLEXIE · REFRACȚIE",
    "intro": "Heliostatul de metal reflectă raza spre o placă de sticlă. La intrare raza se apropie de normală. La ieșire se îndepărtează de ea.",
    "points": [
      "Metalul reflectă după d − 2(d·n)n. Roughness-ul lărgește reflexia.",
      "Sticla refractă după legea lui Snell, la ambele fețe.",
      "Două fețe paralele, cu aer pe ambele părți: raza iese paralelă, deplasată lateral.",
      "Fresnel împarte energia între reflexie și refracție."
    ],
    "formula": "r = d − 2(d·n)n;   η₁ sinθ₁ = η₂ sinθ₂",
    "formulaNote": "Sticlă cu IOR = 1.5",
    "code": "vec3 n = entering ? outwardNormal : -outwardNormal;\nfloat eta = entering ? 1.0 / ior : ior;\nfloat c = clamp(dot(-direction, n), 0.0, 1.0);\nbool tir = eta * sqrt(max(0.0, 1.0-c*c)) > 1.0;\nvec3 next = tir || random() < fresnelSchlick(c, eta)\n  ? reflect(direction, n) : refract(direction, n, eta);",
    "codeLabel": "GLSL · material dielectric",
    "notes": "La heliostat raza se reflectă. Unghiul de incidență este egal cu unghiul de reflexie. Roughness-ul lărgește lobul: evantaiul arată direcțiile posibile. Ponderea β se înmulțește cu reflectanța RGB a metalului.\n\nLa sticlă, legea lui Snell îndoaie raza spre normală la intrare și o îndepărtează de normală la ieșire. Cu două fețe paralele și același mediu pe ambele părți, raza iese paralelă cu direcția inițială, dar deplasată lateral. Figura din card arată ambele refracții.\n\nModelul didactic nu urmărește reflexiile interne și nu aplică ponderile Fresnel.",
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
    "accent": "β · Le",
    "intro": "Raza ajunge la far. Emisia farului, înmulțită cu ponderea β, intră în pixel.",
    "points": [
      "Intersecțiile și materialele au construit traseul.",
      "Emisia farului transformă traseul în lumină pentru pixel.",
      "Un traseu dă o estimare. Pixelul final este media mai multor estimări."
    ],
    "formula": "L ← L + β · Le",
    "formulaNote": "Un traseu dă o contribuție. Pixelul este media contribuțiilor.",
    "code": "vec3 contribution = beta * emission;\nL += contribution;\n// Un traseu complet → o estimare pentru pixelul q.",
    "codeLabel": "Contribuția traseului",
    "notes": "Raza ajunge la far. Contribuția acestui traseu este β × Le: emisia farului, înmulțită cu ponderea adunată pe drum. Această valoare intră în pixelul q.\n\nUn singur traseu este o estimare. Alt traseu prin același pixel poate da altă valoare sau zero. Înainte să construim imaginea, revenim la iepure și la costul intersecțiilor.",
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
      "intro": "Emisia farului intră în pixel cu ponderea întregului traseu.",
      "points": [
        "Un traseu este un sample. Imaginea cere o medie."
      ],
      "formula": "L ← L + β · Le"
    }
  },
  {
    "codeSource": "src/core/bvh.ts · traceTriangles / buildSAH",
    "sources": [
      "https://graphics.stanford.edu/data/3Dscanrep/",
      "https://pbr-book.org/4ed/Primitives_and_Intersection_Acceleration/Bounding_Volume_Hierarchies",
      "https://github.com/gkjohnson/three-mesh-bvh/tree/v0.8.3"
    ],
    "duration": "1:30",
    "id": "acceleration-intro",
    "section": "ÎNAPOI LA STANFORD BUNNY",
    "title": "Cum am trecut atât de repede pe lângă el?",
    "accent": "O ÎNTREBARE ÎNAINTE DE BVH",
    "intro": "Raza a ajuns la far. Revenim la iepurele pe lângă care tocmai a trecut.",
    "points": [
      "Calculatorul vede 948 de triunghiuri.",
      "Trebuie să le testeze pe toate, pentru fiecare rază?",
      "O cutie ratată elimină un întreg grup."
    ],
    "formula": "948 de triunghiuri × fiecare rază",
    "formulaNote": "Urmează explicația colegului: grupăm triunghiurile în cutii.",
    "code": "// Brute force: O(N) pentru fiecare rază\nfor (int i = 0; i < triangleCount; i++) {\n  float t = intersectTriangle(ray, triangles[i]);\n  if (t > EPSILON && t < closest) { closest = t; hit = i; }\n}\n\n// Construcție BVH cu SAH (pseudocod)\nnode.bounds = union(bounds(indices));\nif (indices.length <= leafSize) return node;\nsplit = argmin over candidates of\n  1 + (area(L)*L.count + area(R)*R.count) / area(node);\nnode.children = [build(L), build(R)];",
    "codeLabel": "Brute force și construcție SAH · pseudocod",
    "notes": "Pauză pentru predarea explicației colegului. Raza completă a ajuns deja la sursa de lumină. Revenim la același Stanford Bunny de lângă ultimul segment. Avansul este manual.",
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
    "visual": "acceleration-intro",
    "layout": "scene",
    "slide": {
      "title": "Cum am trecut atât de repede pe lângă el?",
      "intro": "Raza a ajuns la far. Revenim la iepurele pe lângă care tocmai a trecut.",
      "points": [
        "Calculatorul vede 948 de triunghiuri.",
        "Trebuie să le testeze pe toate, pentru fiecare rază?"
      ],
      "formula": "948 de triunghiuri × fiecare rază"
    }
  },
  {
    "codeSource": "src/core/bvh.ts · traceTriangles / buildSAH",
    "sources": [
      "https://pbr-book.org/4ed/Primitives_and_Intersection_Acceleration/Bounding_Volume_Hierarchies",
      "https://github.com/gkjohnson/three-mesh-bvh/tree/v0.8.3",
      "https://graphics.stanford.edu/data/3Dscanrep/"
    ],
    "duration": "1:30",
    "id": "bvh",
    "section": "ACCELERARE · BVH",
    "title": "BVH: evităm 948 de teste",
    "accent": "BOUNDING VOLUME HIERARCHY",
    "intro": "Același Stanford Bunny, acum în prim-plan. Cutia ratată elimină un întreg grup de triunghiuri.",
    "points": [
      "Toate cutiile ierarhiei rămân vizibile discret.",
      "Doar cutia testată acum este accentuată.",
      "Raza originală intersectează cutii, dar ratează triunghiurile.",
      "Alege „Lovește modelul” pentru un hit real."
    ],
    "formula": "C = 1 + (Sₗ/S)·Nₗ + (Sᵣ/S)·Nᵣ",
    "formulaNote": "SAH · S: aria cutiei · N: numărul de triunghiuri",
    "code": "// Brute force: O(N) pentru fiecare rază\nfor (int i = 0; i < triangleCount; i++) {\n  float t = intersectTriangle(ray, triangles[i]);\n  if (t > EPSILON && t < closest) { closest = t; hit = i; }\n}\n\n// Construcție BVH cu SAH (pseudocod)\nnode.bounds = union(bounds(indices));\nif (indices.length <= leafSize) return node;\nsplit = argmin over candidates of\n  1 + (area(L)*L.count + area(R)*R.count) / area(node);\nnode.children = [build(L), build(R)];",
    "codeLabel": "Brute force și construcție SAH · pseudocod",
    "notes": "Stanford Bunny res4: 948 de triunghiuri din Stanford 3D Scanning Repository. Este același iepure de lângă segmentul sticlă → far. Raza originală ratează mesh-ul; BVH testează cutii și numai triunghiurile frunzelor relevante. Butonul „Lovește modelul” și click în scenă lansează interogări CPU reale. Doar nodul activ are accent puternic.",
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
      "title": "BVH: evităm 948 de teste",
      "intro": "Același Stanford Bunny, acum în prim-plan. Cutia ratată elimină un întreg grup de triunghiuri.",
      "points": [
        "Toate cutiile ierarhiei rămân vizibile discret.",
        "Doar cutia testată acum este accentuată.",
        "Raza originală intersectează cutii, dar ratează triunghiurile.",
        "Alege „Lovește modelul” pentru un hit real."
      ],
      "formula": "C = 1 + (Sₗ/S)·Nₗ + (Sᵣ/S)·Nᵣ"
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
    "accent": "SLAB TEST",
    "intro": "Pe fiecare axă, cele două plane ale cutiei dau un interval de valori t. Raza este în cutie numai unde cele trei intervale se suprapun.",
    "points": [
      "Pe fiecare axă calculăm t la planul min și la planul max.",
      "tNear este cea mai mare intrare. tFar este cea mai mică ieșire.",
      "Dacă tNear > tFar, raza ratează cutia.",
      "Dacă raza este paralelă cu o axă, originea trebuie să fie între cele două plane."
    ],
    "formula": "tNear = max(0, tₓ⁻, tᵧ⁻, t𝓏⁻);   tFar = min(tₓ⁺, tᵧ⁺, t𝓏⁺)",
    "formulaNote": "tFar se poate opri la tClosest.",
    "code": "let near = 0, far = closest;\nfor (let a = 0; a < 3; a++) {\n  if (Math.abs(d[a]) < 1e-10) {\n    if (o[a] < min[a] || o[a] > max[a]) return null;\n    continue;\n  }\n  const t0 = (min[a]-o[a])/d[a], t1 = (max[a]-o[a])/d[a];\n  near = Math.max(near, Math.min(t0,t1));\n  far = Math.min(far, Math.max(t0,t1));\n  if (near > far) return null;\n}\nreturn near;",
    "codeLabel": "TypeScript · slab test",
    "notes": "Testul de cutie rulează la fiecare nod vizitat, deci trebuie să fie ieftin. Raza este aceeași: direcția segmentului sticlă → far, lângă Stanford Bunny. Cutia este rădăcina BVH-ului.\n\nArată benzile X, Y, Z din card. Intrarea în cutie este cea mai mare dintre intrări: tNear = max. Ieșirea este cea mai mică dintre ieșiri: tFar = min. Dacă tNear > tFar, raza ratează cutia. Dacă tFar < 0, cutia este în spatele originii.\n\nCazul paralel: dacă d este zero pe o axă, nu împărțim. Verificăm doar că originea este între cele două plane.",
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
    "accent": "NEAR-FIRST",
    "intro": "Folosim arborele pentru aceeași întrebare ca brute force: ce triunghi lovește raza prima dată?",
    "points": [
      "Stiva păstrează nodurile de vizitat. Copilul apropiat vine primul.",
      "Miss la cutie: sărim subarborele. Frunză: testăm triunghiurile.",
      "Hit la cutie nu înseamnă hit la triunghi: raza trece pe lângă iepure.",
      "Rezultatul este același ca la brute force."
    ],
    "formula": "skip if AABB miss or tNear > tClosest",
    "formulaNote": "Auriu: nod activ · cutii discrete: întreaga ierarhie · roz: triunghi lovit",
    "code": "const { node, near } = stack.pop()!;\nif (near === null || near > closest) continue;\nif (node.children) {\n  const children = testChildBounds(node.children);\n  children.sort((a,b) => b.near - a.near);\n  stack.push(...children); // near este extras primul\n} else {\n  for (const i of node.indices) {\n    const t = intersectTriangle(o,d,...triangles[i]);\n    if (t !== null && t < closest) closest = t;\n  }\n}",
    "codeLabel": "Traversare closest-hit",
    "notes": "Traversarea rulează și se repetă. Urmărește cutia aurie și nodul activ. În frunze sunt testate triunghiuri reale ale Stanford Bunny. Raza traseului ratează mesh-ul, deși intersectează cutii. „Lovește modelul” lansează altă rază, cu hit. Pas/Pauză permit prezentarea manuală; rezultatul coincide cu brute force.",
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
      "intro": "Cutiile lovite nu garantează un hit.",
      "points": [
        "Vizităm întâi copilul apropiat",
        "Același hit ca brute force"
      ],
      "formula": "skip dacă tNear > tClosest"
    }
  },
  {
    "codeSource": "GLSL · bucla de sampling",
    "sources": [
      "https://raytracing.github.io/books/RayTracingInOneWeekend.html"
    ],
    "duration": "1:00",
    "id": "samples",
    "section": "SAMPLING",
    "title": "Samples și bounces",
    "accent": "SAMPLES ≠ BOUNCES",
    "intro": "Un sample este un traseu complet pentru pixel. Bounces limitează lungimea fiecărui traseu.",
    "points": [
      "Fiecare sample pornește din alt punct al pixelului (jitter).",
      "32 de samples înseamnă 32 de estimări, oricâte bounces are fiecare.",
      "Mai multe bounces adaugă lumină indirectă. Mai multe samples reduc zgomotul.",
      "Path tracing-ul continuă o singură direcție la fiecare bounce."
    ],
    "formula": "L̂ = (L₁ + L₂ + … + Lₙ) / N",
    "formulaNote": "Media celor N estimări",
    "code": "vec3 color = vec3(0.0);\nfor (int s = 0; s < samples; s++) {\n  Ray ray = generateCameraRay(pixel, random2());\n  color += tracePath(ray, maxBounces);\n}\ncolor /= float(samples);",
    "codeLabel": "GLSL · estimare Monte Carlo",
    "notes": "Un sample este un traseu complet pentru pixel. Mai multe samples înseamnă mai multe estimări pentru același pixel. Bounces limitează lungimea fiecărui traseu.\n\nApasă „+ 1 sample”: un nou traseu pornește din alt punct al pixelului (jitter). Comută bounces 1 / 3. Cu 1 bounce lipsește lumina indirectă. Mai multe samples nu repară o limită prea mică de bounces.",
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
    "codeSource": "src/engine/finale.ts",
    "sources": [
      "https://raytracing.github.io/books/RayTracingInOneWeekend.html",
      "https://research.nvidia.com/labs/rtr/publication/schied2017spatiotemporal/"
    ],
    "duration": "1:00",
    "id": "noise",
    "section": "SAMPLING · ACUMULARE",
    "title": "Mai multe sample-uri, mai puțin zgomot",
    "accent": "MONTE CARLO",
    "intro": "Aceeași cameră și aceeași imagine. Comparăm puține sample-uri cu bugetul SPP ales.",
    "points": [
      "Eroarea mediei scade cu 1/√N.",
      "Pentru jumătate din eroare, avem nevoie de 4× mai multe samples.",
      "Acumulăm în RGB liniar, înainte de tone mapping.",
      "Dacă se mișcă camera, media veche nu mai este valabilă."
    ],
    "formula": "Cₙ = Cₙ₋₁ + (Sₙ − Cₙ₋₁) / n",
    "formulaNote": "Media rulantă a unui pixel",
    "code": "vec3 sample = tracePath(ray);\nvec3 previous = texelFetch(history, pixel, 0).rgb;\nvec3 average = previous + (sample - previous) / sampleCount;\n// Camera / lumină / material / rezoluție schimbată?\n// sampleCount = 1; history se reconstruiește.",
    "codeLabel": "Acumulare cu camera fixă",
    "notes": "Zgomot simulat didactic peste captura raster a scenei; SPP controlează scara zgomotului, aproximativ 1/√N.",
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
      "title": "Mai multe sample-uri, mai puțin zgomot",
      "intro": "Aceeași cameră și aceeași imagine. Comparăm puține sample-uri cu bugetul SPP ales.",
      "points": [
        "Acumulăm media contribuțiilor pentru același pixel",
        "Mișcarea camerei cere o medie nouă"
      ],
      "formula": "eroare standard ∝ 1/√N"
    }
  },
  {
    "codeSource": "După SVGF (Schied et al. 2017)",
    "sources": [
      "https://research.nvidia.com/labs/rtr/publication/schied2017spatiotemporal/",
      "https://github.com/NVIDIA-RTX/NRD"
    ],
    "duration": "1:30",
    "id": "temporal",
    "section": "DENOISING · TEMPORAL",
    "title": "Acumulare temporală, cameră fixă",
    "accent": "REPROJECTION · HISTORY",
    "intro": "Păstrăm camera fixă și adunăm o estimare nouă în fiecare cadru.",
    "points": [
      "Sample-uri noi independente.",
      "Media include toate cadrele acumulate.",
      "La schimbarea camerei, istoricul se resetează."
    ],
    "formula": "Cₙ = Cₙ₋₁ + (Sₙ − Cₙ₋₁) / n",
    "formulaNote": "Demonstrație didactică de mediere la cameră fixă.",
    "code": "vec2 prevUV = uv - motion(uv);\nvec4 hist = texture(history, prevUV);\nbool valid = inside(prevUV)\n  && abs(depth(uv) - hist.depth) < eps\n  && dot(normal(uv), hist.normal) > 0.9;\nfloat n = valid ? hist.count + 1.0 : 1.0;\nfloat a = max(1.0 / n, alphaMin);\nvec3 c = mix(valid ? hist.rgb : sample, sample, a);",
    "codeLabel": "GLSL · acumulare temporală",
    "notes": "Imaginea principală arată media unor estimări zgomotoase independente peste captura raster. Acumularea fixă nu cere reproiecție. Următorul pas păstrează demonstrația colegului cu mișcare, reproiecție și respingerea istoricului.",
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
      "title": "Acumulare temporală, cameră fixă",
      "intro": "Păstrăm camera fixă și adunăm o estimare nouă în fiecare cadru.",
      "points": [
        "Sample-uri noi independente.",
        "Media include toate cadrele acumulate.",
        "La schimbarea camerei, istoricul se resetează."
      ],
      "formula": "Cₙ = Cₙ₋₁ + (Sₙ − Cₙ₋₁) / n"
    }
  },

  {
    "codeSource": "src/engine/denoiser.ts",
    "sources": [
      "https://research.nvidia.com/labs/rtr/publication/schied2017spatiotemporal/",
      "https://github.com/NVIDIA-RTX/NRD",
      "https://www.openimagedenoise.org/"
    ],
    "duration": "2:00",
    "id": "denoise",
    "section": "DENOISING",
    "title": "Denoising",
    "accent": "À-TROUS GHIDAT",
    "intro": "Un blur simplu netezește zgomotul, dar șterge muchiile. Filtrul à-trous ghidat compară fiecare vecin cu pixelul central și ignoră vecinii de pe altă suprafață.",
    "points": [
      "Ponderea unui vecin: kernel × normală × adâncime × albedo × luminanță.",
      "Pașii 1, 2, 4 măresc distanța dintre vecini cu același kernel 5×5.",
      "SVGF: acumulare temporală, varianță, apoi à-trous.",
      "OIDN și alte rețele neuronale învață filtrul din perechi zgomotos / referință."
    ],
    "formula": "w = kernel · wNormal · wDepth · wAlbedo · wLuminance",
    "formulaNote": "Filtrul scrie într-o imagine separată. Acumularea rămâne neatinsă.",
    "code": "float wn = pow(max(dot(n0, nq), 0.0), 32.0);\nfloat wz = exp(-abs(z0-zq) / depthScale);\nfloat wa = exp(-length(a0-aq) * 8.0);\nfloat wl = exp(-abs(luma(c0)-luma(cq)) / colorScale);\nfloat weight = kernel * wn * wz * wa * wl;\nsum += weight * cq;\nweightSum += weight;\n// Ping-pong separat; acumularea brută rămâne intactă.",
    "codeLabel": "GLSL · filtrul à-trous din proiect",
    "notes": "Pasul 1 (filtrul à-trous). După acumulare rămâne zgomot. Un blur simplu ar netezi zgomotul, dar ar amesteca suprafețele de pe cele două părți ale muchiei. Filtrul ghidat calculează o pondere pentru fiecare vecin. Normala, adâncimea și albedo-ul vin din G-buffer și nu au zgomot. Un vecin de pe altă suprafață primește pondere aproape zero.\n\nApasă „Pas →”. Pasul 1 folosește vecinii imediați. Pasul 2 și pasul 4 sar peste pixeli: același kernel 5×5 acoperă o zonă mai mare. Așa obținem un filtru larg cu doar 25 de citiri pe pixel. Cercurile arată ponderea fiecărui vecin pentru pixelul marcat. Comută „Fără ghidaje”: cercurile trec peste muchie și muchia se estompează.\n\nPasul 2 (sisteme reale). SVGF pune totul împreună: acumulare temporală cu reproiecție, varianța fiecărui pixel, apoi 5 treceri à-trous. Varianța decide cât filtrăm: pixelii cu mult istoric primesc mai puțin blur. NRD (NVIDIA) aplică aceleași idei separat pentru difuz și specular. OIDN (Intel) și DLSS Ray Reconstruction folosesc rețele neuronale.\n\nDenoising-ul nu adaugă lumină lipsă. Dacă niciun traseu nu a găsit o sursă, filtrul nu o poate inventa.",
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
      "title": "Denoising",
      "intro": "Mediem vecinii, dar nu peste muchii.",
      "points": [
        "Normala, adâncimea și albedo-ul separă suprafețele",
        "Prea mult filtru șterge detalii"
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
    "id": "hit-steps",
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
    "rayFrom": 1,
    "rayTo": 1,
    "visual": "hit",
    "seconds": 0,
    "layout": "technical",
    "travel": false,
    "captureTime": 1,
    "motion": "hold",
    "title": "Möller–Trumbore pas cu pas",
    "intro": "Aceeași rază și același triunghi. Fiecare pas folosește produse vectoriale și produse scalare."
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
    "intro": "Raza continuă pe direcția aleasă la suprafața mată.",
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
    "intro": "Raza trece prin ambele fețe ale plăcii.",
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
    "title": "Spre far",
    "intro": "Ultimul segment: de la sticlă, pe lângă Stanford Bunny, la far.",
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
    "id": "acceleration-intro",
    "chapter": "acceleration-intro",
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
    "rayFrom": 5,
    "rayTo": 5,
    "visual": "acceleration-intro",
    "seconds": 2.5,
    "layout": "technical",
    "travel": false,
    "captureTime": 1,
    "via": [],
    "motion": "arrive",
    "title": "Cum am trecut atât de repede pe lângă el?",
    "intro": "Raza a ajuns la far. Revenim la iepurele pe lângă care tocmai a trecut.",
    "aimVia": []
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
    "title": "Imaginea inițială · 1 spp",
    "intro": "Simulare de zgomot peste imaginea raster a camerei inițiale.",
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
    "motion": "arrive",
    "title": "Puține sample-uri / mai multe sample-uri",
    "intro": "Aceeași cameră și aceeași imagine. Comparăm puține sample-uri cu bugetul SPP ales."
  },
  {
    "id": "temporal",
    "chapter": "temporal",
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
    "motion": "arrive",
    "title": "Acumulare temporală, cameră fixă",
    "intro": "Păstrăm camera fixă și adunăm o estimare nouă în fiecare cadru."
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
  },
  {
    "id": "denoise-pipeline",
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
    "motion": "hold",
    "title": "Denoising în sisteme reale",
    "intro": "SVGF, NRD și OIDN combină acumularea temporală, ghidajele din G-buffer și filtrarea spațială."
  },
  {
    "id": "temporal-motion",
    "chapter": "temporal",
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
    "motion": "arrive",
    "title": "Când scena se mișcă: reproiecție",
    "intro": "Cubul în mișcare arată când păstrăm istoricul și când îl respingem."
  }
];

applyObservatoryShots(beats);
export const finalView=observatoryFinalView;
export const glossary=[["Radiance (L)", "Mărime radiometrică direcțională estimată de integrator și integrată pentru pixel."], ["Throughput (β)", "Ponderea cumulată a unui traseu; include BSDF, cosinus și PDF."], ["BSDF / PDF", "Modelul interacțiunii / densitatea de probabilitate a direcției alese."], ["BVH / AABB", "Ierarhie de volume / cutie aliniată la axele scenei."], ["SPP", "Samples per pixel; număr de estimări de traseu pentru un pixel."], ["Denoising", "Reconstrucție cu un compromis între reducerea varianței și păstrarea detaliilor."]];
