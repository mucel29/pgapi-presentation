# Audit al fluxului complet și al dovezilor vizuale

Data: 2026-11-18. Audit independent, fără implementare. Baza declarată este `78575b9`, cu modificările locale existente pentru varianta A. Am inspectat sursa actuală și prezentarea servită la `http://upsilon:4173/` în browserul din aplicație, 1280 × 720.

## Verdict

Propunerea utilizatorului rezolvă cauza principală: **încheiem întâi traseul până la sursă și contribuția sa la pixel, arătăm imaginea pe care vrem să o calculăm, apoi explicăm de ce repetăm estimarea și cum o acumulăm**. În ordinea actuală, samples și bucla apar înainte ca primul sample urmărit să aibă un rezultat; zgomotul și denoising-ul apar tot înainte de această încheiere. Schimbarea reprezentării samples într-o schemă de interfață a eliminat miniatura ambiguă, dar nu a schimbat această dependență inversată.

Celelalte trei probleme semnalate sunt confirmate: direcțiile alternative difuze sunt prea slabe și direcția aleasă apare prematur; verdele de la reflector codifică o pondere RGB pe care aspectul vizibil al oglinzii nu o justifică; puntea se citește ca grinzi, nu ca mulțime de triunghiuri.

## Dovezi și limite

- UI observat: camera/pixelul, intersecția, diffuse, reflectorul, traversarea sticlei, samples, bucla, cost, construcția BVH, SAH, AABB, traversarea, zgomotul, denoising și contribuția finală. Am văzut denoising atât restrâns, cât și extins. Pentru începutul din cameră am verificat structura UI; nu am reverificat integral animația portalului.
- Am verificat stări stabilizate pentru diffuse, reflector, sticlă, samples, buclă, cost și contribuția la pixel. Pentru SAH/AABB/traversare am inspectat stările inițiale; nu pretind că am parcurs în UI toate frunzele, preset-urile și cazurile de miss.
- Am urmărit în sursă ordinea, camerele, progresul razei, ponderile materialelor, demonstrațiile și vizibilitatea primitivei/BVH. Verificările de corectitudine geometrică de mai jos sunt inspecție de sursă, nu o nouă rulare de teste.
- Nu am rulat teste, build, path tracer, compilare de shader sau randare offline. Nu am apăsat Explorare/Start. Am închis numai tabul creat pentru audit.
- Nu am editat surse, PPTX-uri sau capturi. Singurul fișier adăugat este acest raport. Nu am creat commit.
- Am aplicat investigația cauzei din skill-ul `systematic-debugging`. Nu am găsit un `AGENTS.md` în directoarele ascendente verificate; am urmat instrucțiunile AGENTS furnizate în conversație.

## Ordinea exactă actuală

Capitole, în ordinea din `src/content/chapters.ts`, confirmată de cuprinsul UI:

1. `room` — Algoritmul Ray Tracing
2. `ray` — Camera, pixelul și raza
3. `hit` — Intersecția rază–triunghi
4. `diffuse` — Diffuse scattering
5. `materials` — Reflexie și refracție
6. `samples` — Samples și bounces
7. `loop` — Bucla de path tracing
8. `cost` — Costul intersecțiilor
9. `bvh` — Construirea unui BVH
10. `sah` — Surface Area Heuristic
11. `aabb` — Intersecția rază–AABB
12. `traversal` — Traversarea BVH
13. `noise` — Zgomot și acumulare progresivă
14. `denoise` — Denoising ghidat
15. `light` — Sursa de lumină și explorarea / Contribuția la pixel

Cele 19 momente de navigare:

`room → portal → ray → hit → diffuse → to-metal → materials → to-glass → samples → loop → cost → bvh → sah → aabb → traversal → noise → denoise → to-light → light`.

Pozițiile efective sunt suprascrise de `applyObservatoryShots` în `src/content/world-shots.ts`; coordonatele vechi din definițiile capitolelor nu descriu singure experiența actuală. După sticlă, samples/loop păstrează progresul la `4.18`; cost îl duce la `4.45`; BVH îl ține acolo; noise îl avansează la `4.72`; denoise îl ține acolo; abia `to-light` ajunge la `5`. Rezultatul unui traseu este astfel amânat prin nouă momente explicative.

## Constatări prioritare

### P1 — Încheierea primului traseu vine după explicația repetării lui

**UI:** după cele două fețe ale sticlei urmează direct schema a două contribuții RGB complete. Raza din canion rămâne neterminată în fundal. Mai târziu discutăm zgomotul într-o vedere rasterizată a punții/sursei; contribuția selectată apare abia la ultimul capitol.

**Cauză:** ordinea capitolelor și `beats`, împreună cu avansarea lentă `4.18 → 4.45 → 4.72 → 5`, tratează fiecare concept ca o stație spațială. Sampling-ul are nevoie însă de rezultatul întregului traseu, nu de o poziție nouă a observatorului.

**Schimbare concretă:** mutăm `to-light` și `light` imediat după blocul BVH, înainte de samples/loop/noise/denoise. Adăugăm un singur moment pentru formarea imaginii, apoi reutilizăm demonstrațiile de interfață existente. După atingerea sursei, progresul fizic rămâne `5` în toate capitolele explicative.

**Acceptare:** la prima apariție a comenzilor de samples, publicul a văzut deja contactul cu emițătorul, `β × Le`, contribuția în pixelul camerei inițiale și cadrul imaginii căreia îi aparține pixelul. Navigarea înainte nu redeschide traseul de la `4.18` și nu retrimite observatorul înapoi lângă sticlă.

### P1 — Lipsește pivotul de la un pixel la o imagine

**UI:** varianta A demonstrează acum două trasee schematice, două rezultate și media lor. Contribuția finală ajunge într-un pixel separat de sursă, ceea ce este corect. Niciun moment al lecției nu arată însă imaginea camerei inițiale ca rezultat alcătuit din pixeli. Fundalul curent este vederea observatorului care călătorește prin canion.

**Sursă:** `src/main.ts:224` construiește un pixel și `ΔL`, fără cadrul imaginii sale. `src/ui/path-lesson.ts` folosește patru exemple RGB alese manual. `src/core/experiments.ts` produce un semnal Bernoulli sintetic 20 × 12, independent de canion. `PreparedData` din `src/engine/finale.ts` are encode/decode, dar nu am găsit un consumator sau date pregătite în inventarul curent.

**Schimbare concretă compatibilă cu Start numai la final:** după `light`, afișăm o vedere rasterizată a scenei din **camera virtuală inițială**, ca panou de imagine, cu pixelul urmărit identificat prin aceeași poziție/etichetă. Text permanent: „Vedere rasterizată de referință · contribuție de pixel ilustrativă”. Contribuția didactică se arată într-un detaliu mărit legat de acel pixel; nu trebuie să suprascrie pe ascuns pixelul rasterizat ca și când ar fi fost calculat fizic. Acest cadru explică ținta calculului, apoi experimentul sintetic existent explică statistic zgomotul.

Această variantă **nu demonstrează zgomot Monte Carlo al canionului**. Pentru acea dovadă ar trebui un set real de imagini pregătite din scena actuală, aceeași cameră și aceleași setări, la spp cunoscute. Nu adăugăm zgomot aleator unei capturi raster ca să o numim „1 spp”. În lecție nu inițializăm tracerul pentru acest moment.

**Active existente verificate vizual:** `output/raytracing-courtyard-cpu.png` este o proiecție CPU a vechii curți și își declară lipsa iluminării/reflexiilor; `assets/captures/final.jpg` arată vechea curte cu arcade, nu canionul actual; `output/raytracing-glass-preview.png` este o diagramă de slide. Nu recomand folosirea lor drept randări Monte Carlo ale scenei actuale. Nu am verificat proveniența fiecărei capturi din director.

**Acceptare:** fără explicație orală suplimentară, se disting camera care formează imaginea, observatorul călător și pixelul selectat. Proveniența raster/sintetic este vizibilă în vederea normală. Nicio etichetă spp nu apare pe un cadru raster ca măsurare reală.

### P1 — Verdele reflectorului este o convenție insuficient susținută vizual

**UI:** suprafața reflectă predominant culorile canionului și pare o oglindă aproape neutră; pachetul/segmentul devine verde la contact. Nu apare un calcul sau un indicator vizibil care să spună de ce.

**Cauza exactă:** `src/core/transport.ts` alege diffuse `#43bdd9` și metal `#f4b14b`, le convertește în RGB liniar și calculează produsul lor. După diffuse, β are dominante verde/albastru; metalul auriu atenuează puternic albastrul, iar produsul devine predominant verde: aproximativ `[0.05, 0.22, 0.05]`, valoare confirmată și în UI final. Este o pondere didactică plauzibilă pentru această combinație, nu o regulă „reflexia face raza verde”.

În raster, `JourneyVisuals` suprapune însă un `Reflector` cu tint fix `0xb4a68c` (`src/engine/visuals.ts:51`), separat de reflectanța metalului folosită pentru β. În plus, segmentele și pachetul normalizează RGB la componenta maximă (`:85`, `:198`), astfel că se vede nuanța fără atenuarea reală. Normala este tot cian în cod (`:87`), deși legenda restrânsă diffuse spune „Alb: normală”.

**Recomandare principală:** raza geometrică și săgețile păstrează o culoare neutră/aurie consistentă. Ponderea β se arată într-un indicator RGB compact, cu valoarea înainte/după și factorul materialului la contact. Astfel aspectul unei oglinzi neutre nu trebuie să explice o schimbare arbitrară a culorii liniei. Dacă se păstrează raza colorată după β, materialul raster și reflectorul trebuie să folosească aceeași convenție de tint, iar legenda permanentă să spună „culoare = nuanța ponderii β”, cu magnitudinea separată.

**Acceptare:** la reflector se poate identifica valoarea β care intră, factorul RGB aplicat și rezultatul. Legenda nu spune „normală albă” când normala este cian. O captură cu oglinda aparent neutră nu mai sugerează că reflexia în sine produce verde.

### P1 — Diffuse: alternativele trebuie văzute înainte de alegere

**UI:** în starea stabilizată predomină segmentul galben deja ales; emisfera este foarte slabă și alternativele nu se disting ca un set de săgeți. Nu se vede succesiunea „mai multe direcții valide → aleg una → continui pe ea”.

**Cauză:** sunt șase direcții cosine-weighted valide, dar fasciculele au rază `.025`, opacitate finală `.19`; vârfurile sunt la opacitate `.24` și scală `.5` (`src/engine/visuals.ts:90–94`, `:202`). Direcția aleasă are grosime `.065`, opacitate `.95` și este vizibilă întregul capitol (`:69`, `:182`). Datele respectă emisfera; ierarhia și timpul de afișare ascund explicația.

**Schimbare concretă:** întâi normala albă și conturul emisferei; apoi 6–8 săgeți complete, cu grosime și vârf suficient de mari în pixeli, opacitate aproximativ `.6–.8`, lungimi comparabile. După ce setul poate fi inspectat, una este evidențiată auriu și etichetată „direcția aleasă”; celelalte se sting la `.15–.25`. `to-metal` continuă exact direcția evidențiată. O comandă compactă „Alege direcția” sau faze clare de replay trebuie să permită inspectarea alternativelor; nu adăugăm ramuri executate simultan.

Șase săgeți sunt exemple ale distribuției, nu o demonstrație statistică suficientă a densității cosinusului. Textul scurt poate spune „favorizăm direcțiile aproape de normală”; nu le desenăm pe toate aliniate cu normala și nu sugerăm împărțirea energiei între toate.

**Acceptare:** la 1280 × 720, fără Detalii, cel puțin patru alternative au vârf distinct pe fundalul canionului; alegerea apare ulterior; există o singură continuare activă spre metal. Normala, alternativele și alegerea se disting și prin formă/stare, nu numai prin nuanță.

### P1 — BVH are primitive reale, dar triunghiurile lor nu se citesc

**UI:** grinzile portocalii și cutiile sunt vizibile. Triunghiul magenta seamănă cu o dungă lungă pe o grindă. Diagonalele fețelor celorlalte grinzi aproape dispar. La SAH/AABB se schimbă titlul și câteva etichete, dar dovezile numerice și primitivele grupate lipsesc în vederea normală.

**Cauză:** fiecare dintre cele 12 grinzi este un paralelipiped cu 12 triunghiuri; rezultă 144 primitive reale, nu cele câteva triunghiuri mari sugerate de silueta structurii (`src/core/teaching.ts`). Wireframe-ul folosește `LineBasicMaterial`, opacitate `.16`, cu test de adâncime implicit (`src/engine/visuals.ts:106`). Grupul selectat este portocaliu la opacitate `.11` peste o punte tot portocalie (`:107`). Prin contrast, hit-ul este magenta `.95`, fără depth test (`:108`). O față lungă și îngustă rămâne greu de identificat ca triunghi chiar dacă este foarte luminoasă.

**Schimbare concretă:** contururi pentru **muchii de triunghi**, inclusiv diagonalele coplanare, prin linii cu lățime stabilă în pixeli și contrast pe fundal. Începutul costului arată pe loc o față de grindă și diagonala ei: două primitive, apoi restabilește puntea. Nu folosim numai `EdgesGeometry`, care poate elimina tocmai diagonalele coplanare. Pentru nodul selectat evidențiem doar primitivele sale în cian, cu contur distinct; restul rămân lizibile, mai stinse. În traversare: candidați cian, respinși stinși, closest-hit magenta după primul test valid.

Cutiile actuale au deja contur în două straturi, dar `updateBoxes`/`setResolution` reduc grosimile din constructor la aproximativ 1 px. Reglajul trebuie evaluat la rezoluția raster internă, nu numai la dimensiunea canvasului CSS.

**Acceptare:** se pot indica trei triunghiuri individuale, inclusiv diagonala unei fețe, înainte de primul BVH. Selectarea unui nod evidențiază exact primitivele numărate. La pasul inițial de traversare nu există closest-hit viitor; după primul hit apare numai cel curent. Preset-ul miss nu lasă magenta reziduală. Cutiile nu acoperă diagonalele tuturor fețelor.

### P1 — Regula de UI rar ascunde încă dovezile esențiale în majoritatea capitolelor

Varianta A a corectat acest lucru pentru samples/loop/light: schema, operația, L/β și comenzile sunt vizibile normal. Este o îmbunătățire confirmată în UI. Regula generică `body:not(.experiment-expanded) :is(#active-figure,#experiment-controls){display:none}` (`src/style.css:43`) continuă să ascundă figura triunghiului, arborele/contorii BVH, costurile SAH, intervalele AABB și chiar imaginile zgomotoase/filtrate.

De exemplu, „Intersecția rază–triunghi” arată o sferă; declarația că exercițiul este separat stă în explicația extinsă. „Zgomot și acumulare” arată rasterul curat al canionului și formula; „Denoising ghidat” arată aproape aceeași vedere. Demonstrațiile sintetice există, dar sunt în spatele butonului. În prezent, sparse-copy este uneori echivalent cu lipsa experimentului.

**Schimbare concretă:** în normal rămân o figură/dovadă și o comandă principală per capitol. Hit: triunghiul separat cu hit/miss; cost: număr brut/BVH; BVH: mini-arbore și selecție; SAH: două costuri candidate; AABB: cele trei intervale și suprapunerea; traversal: nod/stivă/contor și Pas; noise: două imagini și N; denoise: înainte/după și toggle ghidaje. Codul, derivarea și paragrafele rămân în Detalii.

**Acceptare:** o captură normală a fiecărui capitol conține chiar obiectul care îi justifică titlul. Nu trebuie extins un panou opac peste punte pentru a vedea simultan nodul selectat și primitivele lui.

## Ordinea revizuită recomandată

Păstrăm puntea ca oprire geometrică pe parcurs, după sticlă și înaintea sursei. Nu pretindem că raza de test BVH este continuarea optică selectată: `src/core/teaching.ts` o construiește separat, iar `src/content/world-shots.ts` ține traseul optic la `4.45` în blocul BVH.

| Ordine | Capitol / momente | Dovada și tranziția necesară |
|---|---|---|
| 1 | `room → portal` | Problema unui pixel și intrarea în lumea de pe monitor. Nu predăm încă samples. |
| 2 | `ray` | Camera inițială, celula pixelului, direcția primară; observatorul este separat. |
| 3 | `hit` | Primul contact este pe sferă; exercițiul rază–triunghi are figură proprie, explicit separată. |
| 4 | `diffuse → to-metal` | Emisferă, alternative, alegere, apoi exact continuarea aleasă. |
| 5 | `materials → to-glass` | Reflexia și β; intrare/ieșire Snell, cu cele două normale și paralelismul emergentei. |
| 6 | `cost` | Oprim temporar segmentul după sticlă. „Fiecare segment cere un closest-hit. Cum îl găsim?” Pornim raza de test a punții, clar distinctă. |
| 7 | `bvh` | Aceleași 144 triunghiuri → grupuri → cutii; o selecție leagă arborele de primitive. |
| 8 | `sah` | Două/trei tăieturi reale și costul lor; fără o nouă deplasare de cameră. |
| 9 | `aabb` | Cum testăm cutia: intervale vizibile pe aceeași rază de test. |
| 10 | `traversal` | Combinăm cutiile și primitivele, apoi obținem același hit cu mai puține teste. La ieșire eliminăm raza de test și reluăm traseul optic. |
| 11 | `to-light → light` | Terminăm traseul principal: contact emisiv, `β × Le`, contribuție în pixelul inițial. |
| 12 | **Un moment nou: imaginea** | Cadrul camerei inițiale și pixelul q. Raster etichetat corect; un singur sample didactic nu este culoarea finală a întregului pixel. |
| 13 | `samples` | Mai multe estimări pentru același pixel, rezultate diferite, media lor. Refolosim schema existentă. |
| 14 | `loop` | Formalizăm acum traseul deja încheiat: bucla interioară pe interacțiuni, încadrată în bucla exterioară de samples. |
| 15 | `noise` | Pe o cameră fixă, aceeași medie se actualizează în timp; 1, 4, 16, 64 samples în experimentul sintetic. |
| 16 | `denoise → explorare` | Același input zgomotos înainte/după filtrare. Apoi explorare raster și Start explicit pentru tracerul real. |

Secvența exactă propusă de beats:

`room → portal → ray → hit → diffuse → to-metal → materials → to-glass → cost → bvh → sah → aabb → traversal → to-light → light → image → samples → loop → noise → denoise`.

`image` este singurul moment narativ nou necesar. Poate fi un beat separat în capitolul contribuției, cu titlu propriu; nu este obligatoriu un capitol nou. Explorarea trebuie să rămână acțiunea de la sfârșitul lecției, chiar dacă `light` nu mai este ultimul capitol.

### Adaptări cerute de noua ordine

- **Cost înainte de samples:** deschiderea nu mai folosește 64 samples și „796 milioane” ca premisă nepredată. Arată întâi o interogare pe cele 144 primitive. Calculul de cost pentru întregul cadru se mută în Detalii sau reapare ca scurtă observație după samples/loop. Astfel nu introducem o buclă înainte să înțelegem un singur traseu.
- **BVH în interiorul călătoriei:** este o inspecție locală a operației closest-hit, cu raza de test distinctă. Traseul optic rămâne oprit; camera nu schimbă complet decorul. La ieșire se reaprinde capul traseului și se continuă `4.45 → 5`.
- **Loop după rezultat:** actuala demonstrație este doar un bounce difuz, L rămânând zero. Îi păstrăm utilitatea, dar trebuie să existe și un pas/rezumat de terminare la sursă, care reia contribuția deja văzută. Nu numim „bucla completă” un ciclu care revine permanent la camera inițială fără să arate terminarea.
- **Samples → acumulare:** samples descrie estimările și media; noise explică păstrarea aceleiași medii între update-uri. O bandă compactă cu `N`, `S_n`, `C_n` și „Cameră fixă” leagă conceptele. O schimbare de cameră demonstrată în model resetează N; nu reciclează istoria vechii imagini.
- **Temporal:** numim implementarea „acumulare progresivă pentru cameră staționară”. `Finale` resetează la schimbarea camerei/setărilor; nu are reproiecție, motion vectors sau rezolvare de disocclusion. Filtrul implementat este spațial. SVGF/NRD pot fi menționate în Detalii ca extensii, fără a atribui proiectului aceste mecanisme.
- **Denoising:** reutilizăm exact estimarea zgomotoasă/N din momentul anterior, când este posibil. Dacă demonstrațiile rămân diferite, schimbarea trebuie declarată prin „exemplu sintetic pentru muchii”, fără a sugera că rezultatul filtrează cadrul canionului.
- **Camera după sursă:** observatorul rămâne lângă emițător; imaginea și schemele sunt în interfață. Nu folosim actualele `sampleView` și `noiseView` ca destinații care întorc călătoria înapoi spre sticlă/punte.

## Observații asupra ritmului întregii prezentări

| Bloc | Ce funcționează | Ajustarea necesară |
|---|---|---|
| Introducere / portal | Monitorul stabilește o țintă vizuală și oferă o intrare memorabilă. | Nu confundăm monitorul fizic cu planul geometric al camerei virtuale. |
| Camera / rază | UI arată o, celula pixelului, q și direcția; observatorul este numit separat. | Refolosim aceiași referenți la formarea imaginii, nu un pixel generic fără poziție. |
| Intersecție | Conținutul matematic și explicația separării sferei de mesh sunt prezente în sursă. | Figura triunghiului trebuie vizibilă normal; altfel titlul descrie alt obiect decât scena. |
| Diffuse | Traseul ales se află în emisfera validă, iar simplificarea Lambertian/cosine-weighted este explicată corect în text. | Timp separat pentru alternative și pentru alegere; săgeți lizibile. |
| Metal / sticlă | Reflectorul are identitate optică; sticla are grosime și două contacte distincte. | β separat de direcția geometrică; expunem ieșirea paralelă înainte de a pleca. Ponderile sticlei rămân declarate simplificate. |
| Cost / BVH / SAH / AABB / traversare | Aceeași punte și camera comună oferă continuitate; primitivele sunt reale. | Cele cinci capitole sunt un bloc lung. Fiecare trebuie să producă un rezultat vizibil diferit, nu numai un nou titlu peste aceeași punte. |
| Contribuția la pixel | Varianta A separă pixelul de emițător și arată β, Le, ΔL. | Mutare înainte de samples; apoi lărgirea la cadrul imaginii. |
| Samples / loop | Schema și comenzile sunt acum vizibile în modul restrâns. | Două niveluri de repetare explicate succesiv; terminarea sample-ului nu mai vine ulterior. |
| Noise / denoise | Separarea sintetic/renderer și spațial/temporal este explicită în sursă. | Aceste atribuiri și imaginile de comparație trebuie vizibile în modul normal; camera nu mai călătorește în timp ce discutăm o imagine fixă. |
| Explorare | Start explicit păstrează lecția ușoară și separă tracerul real de animația didactică. | CTA și condițiile hardcodate pe `light` se mută la noul sfârșit. |

## Fișiere și puncte de intervenție pentru implementare

1. `src/content/chapters.ts`: ordinea `chapters`/`beats`, noul moment imagine, intro cost, finalul lecției și textul loop. Menținem compatibilitatea ancorelor existente unde este posibil.
2. `src/content/world-shots.ts`: scoaterea samples/loop/noise/denoise de pe șina dinaintea sursei; hold după sursă; progres continuu după noua ordine; reluarea după raza separată BVH.
3. `src/engine/visuals.ts`: fazele diffuse, săgeți și normală, convenția culorii razei, triunghiuri și grupuri BVH, starea hit-ului pe pași, prioritatea cutiilor față de primitive.
4. `src/core/transport.ts` și `src/engine/courtyard.ts`: o singură definiție pentru reflectanța folosită didactic și aspectul materialului dacă se păstrează colorarea razei; nu schimbăm ecuația doar ca să mascăm contrastul vizual.
5. `src/main.ts`: render/update pentru cadrul imaginii și pixelul său; normal-mode pentru dovezile esențiale; `$('explore')`, `advance()` și condițiile legate de `light`; `updateContribution`; starea samples/noise și terminarea loop.
6. `src/ui/path-lesson.ts`, `src/ui/teaching-copy.ts`: cadrul de bucle, terminarea la sursă, etichetele raster/sintetic și explicația β. `loopShortNotes[1]` spune acum „în capitolul următor” pentru punte; noua ordine cere o trimitere la interogarea deja inspectată.
7. `src/ui/experiments.ts`, `src/ui/denoise-demo.ts`, `src/style.css`: comparații permanent lizibile, N și reset, reducerea separării dintre inputurile noise/denoise, păstrarea derivărilor opționale.
8. `src/engine/journey.ts`: eventuala vedere raster a camerei inițiale trebuie să excludă ilustrațiile, să nu mute camera observatorului și să nu importe `Finale`. `src/engine/finale.ts` rămâne traseul exclusiv după Start; nu folosim momentul imaginii ca declanșator implicit.

## Verificarea minimă după o eventuală implementare

- Parcurgere normală din cameră până la explorare, fără Detalii: traseu complet → contribuție → cadru imagine → samples → buclă → acumulare → filtrare.
- Capturi 1280 × 720 pentru diffuse înainte/după alegere, reflector cu β, o față de grindă cu diagonala vizibilă, nod/frunză selectate, contribuție/imagine, noise și denoise normale. Încadrare compactă/portrait verificată separat pentru comenzile persistente.
- Verificări punctuale: continuitatea progresului traseului după reorder; un singur sample cu mai multe segmente; N independent de bounces; primele/finalele/miss ale traversării; etichete corecte pentru raster și date sintetice; nicio inițializare a tracerului înainte de Start.
- Nu este suficient să treacă testele de geometrie sau build-ul: dovada de acceptare este identificarea vizuală a fiecărui referent în modul normal. Testele rămân scurte, cu aserțiuni pe valori scalare și identități explicite, fără dump-uri/egalitate profundă pe grafuri Three.js.

## Prioritatea recomandată pentru implementare

1. Reordonare, atingerea sursei, contribuția și pivotul imaginii; eliminarea întoarcerilor spațiale după sursă.
2. Normal-mode cu dovezile esențiale, inclusiv noise/denoise, și terminarea buclei.
3. Diffuse în faze și convenția β/reflexie.
4. Triunghiuri BVH lizibile și stările grup/candidat/hit, apoi ajustarea ritmului SAH/AABB.

Nu recomand încă alte decoruri, o nouă scenă de laborator, mai multe miniaturi sau pornirea automată a tracerului. Structura existentă poate susține fluxul propus prin reordonare, un singur moment de imagine și dovezi vizuale mai bine alese.

## Checkpoint de implementare și validare

Fluxul implementat are 20 de momente: traseul ajunge la sursă înainte de contribuție, cadrul camerei inițiale, samples, buclă, acumulare și denoising. Miniatura din lume a fost eliminată. Raza geometrică are culoare neutră, β rămâne explicit numeric; diffuse arată alternative înainte de alegere; puntea păstrează cele 144 de primitive reale, cu diagonale, selecție și hit evidențiate.

Au trecut serial typecheck-ul, cele patru fișiere de teste focalizate (`journey`, `cinematics`, `integration`, `overview-framing`), build-ul de producție și verificarea whitespace. Procesele Node au fost limitate la 1536 MB. Preview-ul existent servește build-ul curent la `http://upsilon:4173/`.

Acceptarea vizuală finală rămâne în așteptare: browserul IAB a răspuns „Browser is not available: iab” în ambele contexte de verificare. Nu există o parcurgere vizuală nouă a implementării finale, nici capturi care să o valideze. Nu a fost pornit tracerul și nu au fost modificate prezentările/PPTX sau publicat conținut.
