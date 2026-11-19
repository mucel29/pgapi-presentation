# Note de prezentare

Generat din `src/content/chapters.ts` cu `node --experimental-strip-types scripts/export-notes.mjs`. Nu edita acest fișier manual. Editează câmpul `notes` din capitol, apoi rulează scriptul din nou.

Durată estimată: 19 minute, fără întrebări. 14 capitole, 22 pași. Space trece la pasul următor. N deschide aceste note în site.

| # | Capitol | Durată | Pași |
| --- | --- | --- | --- |
| 1 | Algoritmul Ray Tracing | 0:25 | `room` |
| 2 | Camera, pixelul și raza | 0:45 | `portal`, `ray` |
| 3 | Intersecția rază–triunghi | 2:15 | `hit`, `hit-steps` |
| 4 | Suprafața mată | 1:15 | `diffuse`, `diffuse-chosen` |
| 5 | Reflexie și refracție | 1:40 | `to-metal`, `materials`, `to-glass` |
| 6 | BVH: de ce și cum | 1:30 | `bvh` |
| 7 | Intersecția rază–AABB | 1:05 | `aabb` |
| 8 | Traversarea BVH | 1:50 | `traversal` |
| 9 | Contribuția la pixel | 0:45 | `to-light`, `light`, `image` |
| 10 | Samples și bounces | 1:00 | `samples` |
| 11 | Bucla de path tracing | 1:40 | `loop` |
| 12 | Zgomot și acumulare | 1:00 | `noise` |
| 13 | Acumulare temporală și reproiecție | 1:30 | `temporal` |
| 14 | Denoising | 2:00 | `denoise`, `denoise-pipeline` |

## 1. Algoritmul Ray Tracing (0:25)

**Pe ecran:** pixel → rază → suprafețe → lumină

Pornim de la o întrebare: ce culoare primește un pixel de pe monitor? Ray tracing pornește invers față de lumină: din cameră spre scenă. Urmărim o singură rază prin canion. La fiecare oprire explicăm un calcul: intersecția, materialul, accelerarea, apoi zgomotul. Apasă Space pentru a intra prin monitor.

## 2. Camera, pixelul și raza (0:45)

Înainte: deplasare „Canionul de pe monitor”. Apasă Space o dată ca să sari peste animație.

**Pe ecran:** r(t) = o + t·d

Camera virtuală este punctul o. Alegem un punct q în interiorul pixelului. Direcția este d = normalize(q − o). Orice punct de pe rază este o + t·d. Intersecția înseamnă să găsim t, nu să mutăm raza în pași mici. Aceeași ecuație descrie fiecare segment de după un bounce.

## 3. Intersecția rază–triunghi (2:15)

**Pe ecran:** o + t·d = A + u·e₁ + v·e₂

Pasul 1. Sfera cian este un mesh: 440 de triunghiuri. Raza primară lovește triunghiul #187, conturat cu alb pe sferă. Cardul din stânga arată exact acest triunghi, cu culoarea sferei. Raza vine din camera o, aflată la aproximativ 60 de unități.

Mută sliderele u și v. Raza pleacă tot din o, dar spre alt punct P al planului. Cât timp u ≥ 0, v ≥ 0 și u+v ≤ 1, P este în triunghi. Apasă „În afară”: raza lovește planul, dar nu triunghiul. Apasă „Paralel”: det este aproape zero și nu există soluție. „Raza reală” revine la raza din scenă.

Pasul 2. Ecuația o + t·d = A + u·e₁ + v·e₂ are trei necunoscute: t, u, v. Fiecare axă dă o ecuație. Apasă „Pas →” și citește valorile reale: e₁, e₂, P, det, u, Q, v, t. Ultimul pas dă t ≈ 59.53, distanța de la cameră la sferă.

Cu „În afară”, algoritmul se oprește la u sau la v și nu mai calculează t. Testul rulează de milioane de ori pe cadru. BVH-ul reduce numărul de teste. Ieșirea timpurie reduce costul fiecărui test.

## 4. Suprafața mată (1:15)

**Pe ecran:** β ← β · albedo

Raza lovește o suprafață mată. O suprafață mată împrăștie lumina în toată emisfera normalei. Evantaiul arată direcțiile posibile. Într-un sample alegem una singură, la întâmplare.

Alegem mai des direcțiile apropiate de normală (cosine-weighted sampling). Atunci factorul cosθ și densitatea p se simplifică, iar ponderea devine β ← β · albedo. Culoarea razei arată ponderea β, nu culoarea unui foton.

## 5. Reflexie și refracție (1:40)

Înainte: deplasare „Spre reflector”, „Prin placa de sticlă”. Apasă Space o dată ca să sari peste animație.

**Pe ecran:** d′ = d − 2(d·n)n

La heliostat raza se reflectă. Unghiul de incidență este egal cu unghiul de reflexie. Roughness-ul lărgește lobul: evantaiul arată direcțiile posibile. Ponderea β se înmulțește cu reflectanța RGB a metalului.

La sticlă, legea lui Snell îndoaie raza spre normală la intrare și o îndepărtează de normală la ieșire. Cu două fețe paralele și același mediu pe ambele părți, raza iese paralelă cu direcția inițială, dar deplasată lateral. Figura din card arată ambele refracții.

Modelul didactic nu urmărește reflexiile interne și nu aplică ponderile Fresnel.

## 6. BVH: de ce și cum (1:30)

**Pe ecran:** C = 1 + (Sₗ/S)·Nₗ + (Sᵣ/S)·Nᵣ

Raza a ieșit din sticlă. Următorul segment merge spre far și trece prin pod, printre grinzi. Avem nevoie de cel mai apropiat hit de pe acest segment. Brute force testează fiecare triunghi: 1152 pentru pod, 2 pentru far.

BVH (Bounding Volume Hierarchy) grupează triunghiurile în cutii aliniate la axe. Rădăcina conține podul și farul. Click pe un nod din arbore: cutia lui apare în scenă. Dacă raza ratează cutia unui nod, nu testăm niciun triunghi din subarborele lui.

Tăietura fiecărui nod vine din SAH (Surface Area Heuristic). O rază lovește o cutie mare mai des decât una mică. Costul unui copil este aria lui înmulțită cu numărul lui de triunghiuri. Alegem tăietura cu costul minim. Codul este în „Cod”.

Rezultat pentru raza reală: 37 de teste de cutie și 37 de teste de triunghi, în loc de 1154. Hit-ul este același: farul, la t = 69.95.

## 7. Intersecția rază–AABB (1:05)

**Pe ecran:** hit dacă 0 ≤ tNear ≤ tFar

Testul de cutie rulează la fiecare nod vizitat, deci trebuie să fie ieftin. Raza este aceeași: segmentul de la sticlă la far. Cutia este rădăcina BVH-ului.

Arată benzile X, Y, Z din card. Intrarea în cutie este cea mai mare dintre intrări: tNear = max. Ieșirea este cea mai mică dintre ieșiri: tFar = min. Dacă tNear > tFar, raza ratează cutia. Dacă tFar < 0, cutia este în spatele originii.

Cazul paralel: dacă d este zero pe o axă, nu împărțim. Verificăm doar că originea este între cele două plane.

## 8. Traversarea BVH (1:50)

**Pe ecran:** skip dacă tNear > tClosest

Apasă „Pas →” de câteva ori. Portocaliu: nodul activ. Verde: cutie lovită. Roșu: cutie ratată sau eliminată.

Raza trece prin cutia podului, deci BVH-ul coboară în arbore și testează câteva grinzi. Niciuna nu este lovită: raza trece printre ele. Acesta este cazul important: hit la cutie nu înseamnă hit la triunghi.

Stiva păstrează nodurile de vizitat. Copilul îndepărtat intră primul în stivă, ca să vizităm întâi copilul apropiat. După primul hit, tClosest scade. O cutie cu tNear > tClosest nu poate conține un hit mai apropiat, deci o sărim.

Apasă „Ultimul →|”. Hit-ul este farul, la t = 69.95, la fel ca la brute force. Apoi raza continuă spre far.

## 9. Contribuția la pixel (0:45)

Înainte: deplasare „Spre far”. Apasă Space o dată ca să sari peste animație.

**Pe ecran:** L ← L + β · Le

Raza ajunge la far. Contribuția acestui traseu este β × Le: emisia farului, înmulțită cu ponderea adunată pe drum. Această valoare intră în pixelul q.

Un singur traseu este o estimare. Alt traseu prin același pixel poate da altă valoare sau zero. Apasă Space: privim acum prin camera inițială. Imaginea este formată din milioane de asemenea pixeli.

## 10. Samples și bounces (1:00)

**Pe ecran:** L̂ = (1/N) Σ Lᵢ

Un sample este un traseu complet pentru pixel. Mai multe samples înseamnă mai multe estimări pentru același pixel. Bounces limitează lungimea fiecărui traseu.

Apasă „+ 1 sample”: un nou traseu pornește din alt punct al pixelului (jitter). Comută bounces 1 / 3. Cu 1 bounce lipsește lumina indirectă. Mai multe samples nu repară o limită prea mică de bounces.

## 11. Bucla de path tracing (1:40)

**Pe ecran:** β *= f·|n·ω|/pdf

Bucla păstrează două valori. L adună lumina găsită. β este ponderea traseului. La început L = 0 și β = 1.

Apasă „Pas algoritm →”. La fiecare hit: adunăm emisia, trimitem o rază de umbră spre o sursă, alegem o direcție nouă din BSDF și înmulțim β. Ne oprim la miss, la limita de bounces sau prin Russian roulette. Codul complet este în „Cod”.

## 12. Zgomot și acumulare (1:00)

**Pe ecran:** eroare standard ∝ 1/√N

Un singur traseu dă o estimare zgomotoasă. Alt traseu prin același pixel dă altă valoare. Media lor se apropie de valoarea corectă.

Apasă 1, 4, 16, 64, 256. Eroarea scade cu 1/√N: pentru jumătate din eroare avem nevoie de 4× mai multe samples. De la 64 la 256 samples câștigăm doar jumătate din eroare. Asta face path tracing-ul scump.

Apasă „Schimbă camera → reset”: istoricul nu mai aparține acelorași puncte, deci pornim de la zero. Următorul capitol arată cum păstrăm istoricul când camera se mișcă.

## 13. Acumulare temporală și reproiecție (1:30)

**Pe ecran:** C = α·S + (1 − α)·H(x − v)

Acumularea din capitolul anterior funcționează doar cu o cameră fixă. Într-un joc, camera și obiectele se mișcă în fiecare cadru. Dacă ștergem istoricul la fiecare mișcare, rămânem la 1 sample per pixel și imaginea este zgomotoasă.

Reproiecția: pentru fiecare pixel, vectorul de mișcare spune unde era același punct în cadrul anterior. Citim istoricul de acolo și amestecăm: C = α·S + (1−α)·H. Verificăm că istoricul aparține aceleiași suprafețe: aceeași adâncime, aceeași normală.

În vizualizator, cubul din față se mișcă peste fundal. Pornește „Rulează ▶”. Mod „Fără reproiecție”: istoricul rămâne pe loc și cubul lasă urme (ghosting). Mod „Reset”: fiecare mișcare șterge istoricul și imaginea rămâne zgomotoasă. Mod „Reproiecție”: cubul rămâne curat. Pe muchia din spatele cubului apare o fâșie zgomotoasă: fundalul abia descoperit nu are istoric (disocclusion). Harta din dreapta arată lungimea istoricului pentru fiecare pixel.

α mic înseamnă medie lungă: mai puțin zgomot, dar reacție lentă la schimbări de lumină. Rendererul din explorare nu are reproiecție. El resetează acumularea la mișcare.

## 14. Denoising (2:00)

**Pe ecran:** à-trous: pas 1 → 2 → 4

Pasul 1 (filtrul à-trous). După acumulare rămâne zgomot. Un blur simplu ar netezi zgomotul, dar ar amesteca suprafețele de pe cele două părți ale muchiei. Filtrul ghidat calculează o pondere pentru fiecare vecin. Normala, adâncimea și albedo-ul vin din G-buffer și nu au zgomot. Un vecin de pe altă suprafață primește pondere aproape zero.

Apasă „Pas →”. Pasul 1 folosește vecinii imediați. Pasul 2 și pasul 4 sar peste pixeli: același kernel 5×5 acoperă o zonă mai mare. Așa obținem un filtru larg cu doar 25 de citiri pe pixel. Cercurile arată ponderea fiecărui vecin pentru pixelul marcat. Comută „Fără ghidaje”: cercurile trec peste muchie și muchia se estompează.

Pasul 2 (sisteme reale). SVGF pune totul împreună: acumulare temporală cu reproiecție, varianța fiecărui pixel, apoi 5 treceri à-trous. Varianța decide cât filtrăm: pixelii cu mult istoric primesc mai puțin blur. NRD (NVIDIA) aplică aceleași idei separat pentru difuz și specular. OIDN (Intel) și DLSS Ray Reconstruction folosesc rețele neuronale.

Denoising-ul nu adaugă lumină lipsă. Dacă niciun traseu nu a găsit o sursă, filtrul nu o poate inventa.
