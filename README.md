# Algoritmul Ray Tracing

Prezentare în română pentru Programare grafică avansată și prelucrarea imaginilor: 15 teme, patru secvențe de deplasare, aproximativ 17–19 minute cu opriri pentru demonstrații, urmate de explorare opțională.

Începem la un birou obișnuit, cu PC și monitor. Intrăm prin monitor într-un observator suspendat peste un canion: stânci colorate, o punte cu grinzi, un instrument difuz cian, un heliostat de bronz cu ramă, o placă groasă de sticlă și un far îndepărtat. Un singur traseu leagă aceste repere. BVH-ul didactic este construit din triunghiurile reale ale punții; numărul de teste și closest-hit provin din aceeași geometrie.

Raza pornește înaintea observatorului. Camera o urmărește pe segmente lungi între reperele din canion, apoi se așază la fiecare demonstrație. La sticlă sunt distincte sosirea, intrarea, ieșirea și continuarea. Navigarea rămâne manuală.

## Checkpoint local

Repository-ul a fost inițializat înaintea redesign-ului. Commit de bază pe `main`: `16531134896fa5bb7044534a3e3c143551875b65` (`chore: checkpoint presentation before scene redesign`). Nu este configurat un remote. Acest checkpoint păstrează versiunea de dinaintea schimbării scenei și tranzițiilor.

## Pornire locală

Necesită Node.js 22.18+ sau 24+ și un browser cu WebGL 2.

```sh
npm ci
npm run dev
```

Deschide adresa afișată de Vite. Pentru build și verificări:

```sh
npm test
# Pentru a vedea toate testele individuale și pe Node 26:
node --experimental-strip-types --test --test-isolation=none tests/*.test.ts
npm run build
npm run preview
```

Site-ul nu folosește CDN, framework UI sau backend. Bibliotecile, fonturile și texturile procedurale sunt locale.

## Control

- **Space / Right / PageDown**: următorul pas. În timpul unui zbor, prima apăsare îl încheie; următoarea avansează.
- **Left / PageUp**: pasul anterior, cu starea completă restaurată.
- **O**: cuprins; **C**: cod; **N**: detalii; **F**: fullscreen.
- **Home / End**: început / ultimul capitol.
- Codul și detaliile pun animația pe pauză. Cardul principal are o explicație scurtă, o formulă și demonstrația activă; detaliile păstrează derivările și observațiile complete.
- Lumea 3D ocupă întregul ecran și păstrează același aspect în lecție și deplasare. Cardul compact este suprapus în stânga-jos; comenzile experimentului rămân fixate sub conținut. Pe telefon, cardul ocupă cel mult 41% din înălțime.
- BVH: selectează noduri. **Opțiuni** deschide părinții, raza hit/miss și **Alege ținta** și click pe punte. **Primul / Pas / Ultimul / Rulează** controlează traversarea; triunghiul closest-hit este magenta.
- Intersecția rază–triunghi: slidere u/v și cazuri interior, muchie, exterior, paralel. Diagrama și BVH-ul folosesc aceeași implementare Möller–Trumbore.
- Bucla de path tracing: pași manuali pentru contribuția emisivă, shadow ray, BSDF și registrele L/β.
- Sticlă: alege o predicție pentru direcția de ieșire, apoi vezi ramura transmisă prin ambele fețe.
- Samples: modifică separat numărul traseelor și limita de bounces. SAH: compară costul unor tăieturi reale pe punte.
- În demonstrația Samples, observatorul rămâne lângă sticlă, iar lumea rămâne vizibilă. Cele 12/24/48 de lansări ilustrate sunt reprezentative; bugetul SPP rămâne separat. Adăugarea unui lot lansează raze noi fără să repornească loturile anterioare.
- Raza afișează nuanța normalizată a ponderii RGB β. Nuanța singură nu arată mărimea contribuției; calculul RGB complet este explicat în Detalii. Materialele cian și bronz folosesc aceleași culori în geometrie și în calculul didactic al ponderii.
- Zgomot: experiment sintetic la 1/4/16/64/256 samples, cu RMSE măsurat față de un semnal cunoscut. Nu pornește rendererul path-traced.

Linkuri directe: `#chapter=bvh`, `#chapter=traversal`, `#chapter=materials&beat=to-glass`. Sunt păstrate aliasurile vechi `gpu`, `accumulation`, `modern`.

## Path tracing: numai la cerere

Prezentarea și capturile folosesc exclusiv rasterizare. **Nu există inițializare, compilare sau randare path-traced în fundal.**

Butonul final **Explorare** deschide întâi canionul rasterizat. Doar **Start path tracing** importă și inițializează `WebGLPathTracer`. Butonul **Oprește path tracing** revine la rasterizare. O verificare GPU anterioară, din 5 noiembrie 2026, a urmărit acumularea la 320 × 180 și două bounces. În revizia curentă nu s-a pornit tracer-ul. Comparațiile la multe samples și benchmark-ul la calitatea maximă rămân separate.

Implementarea păstrează:

- Mișcare: maximum aproximativ 320 × 180, două bounces, reset la schimbarea camerei.
- După 400 ms fără mișcare: acumulare staționară până la 1280 × 720, implicit opt bounces.
- Rezoluție, samples per update și bounces pot fi alese înainte de Start.
- Prag de mișcare configurabil: implicit 0.35 pixeli proiectați, cu praguri de translație și rotație față de ultima poziție acceptată.
- La repaus, acumularea rămâne stabilă; mișcările deliberate se acumulează până depășesc pragul. Ultima imagine este păstrată cât timp se reconstruiesc țintele, evitând alternarea raster/path tracing.
- Reset și filtru à-trous ghidat de normal/depth/albedo.
- Raw accumulation separat de output-ul filtrat; reproiecția, SVGF, NRD și OIDN sunt explicate, nu integrate.

Experimentul Monte Carlo folosește un semnal scalar Bernoulli cunoscut, cu seed fix, și arată estimări și RMSE. Diagrama filtrării este conceptuală. Niciuna nu este o captură path-traced a scenei. Comparațiile path-traced la multe samples nu au fost regenerate.

Orbit: drag; pan: click dreapta; zoom: scroll; deplasare: W/A/S/D și Q/E; Shift pentru viteză. Există reset cameră și revenire la prezentare. Fără floating-point render targets, rămâne disponibilă explorarea rasterizată.

## Scena web și capturi

Revizia canionului este exclusiv web. Fișierele PPTX și exporturile existente sunt istorice și nu au fost regenerate pentru această scenă. Prototipul anterior de compoziție BVH este păstrat local în `.build/prototype-reference/`, în afara surselor și a build-ului de producție.

`src/content/chapters.ts` păstrează conținutul, notele și sursele celor 15 teme. `src/content/world-shots.ts` definește cadrele active, inclusiv cele pentru telefon. `src/core/world.ts` definește reperele canionului, iar `src/core/cinematics.ts` calculează mișcarea camerei și a razei. Câmpurile legacy `Chapter.camera/target` nu definesc cadrele active.

Capturi deterministe fără UI: `?capture=diffuse`, `?capture=to-glass`, `?capture=final`. Inclusiv `final` și aliasul `beauty` sunt rasterizate. Adaugă `&ui=1` pentru interfață sau `&phase=0.5` pentru un moment precis din tranziție. `body[data-capture-ready="true"]` indică finalizarea capturii. Rasterul redus este mărit cu nearest-neighbor; textul și comenzile DOM rămân clare la rezoluția ecranului.

Verificarea în browserul integrat a acoperit desktop 1280 × 720 și telefon 390 × 844: camera cu PC, heliostatul, sticla cu ambele interfețe și normalele vizibile, adăugarea de samples în aceeași lume, arborele BVH, traversarea și rezultatul numeric, intersecția interactivă, codul, notele și farul final. Valorile implicite ale traversării sunt 15 teste AABB, 6 teste de triunghi, triunghiul #98 și tClosest = 36.277; sumarul rămâne fixat deasupra comenzilor. Verificările geometrice complete au trecut 41 de teste, iar TypeScript și build-ul Vite au trecut. Path tracer-ul nu a fost pornit în această revizie.


## Preview prin tailnet

După build, pornește serverul pe IP-ul returnat de `tailscale ip -4`:

```sh
npm run preview -- --host <TAILNET_IP> --port 4173 --strictPort --base=/raytracing/
```

Deschide `http://upsilon:4173/raytracing/` de pe dispozitivul conectat la tailnet. `preview.allowedHosts` permite explicit `upsilon`. Adresa IP funcționează și direct.

Build-ul canionului a trecut verificarea TypeScript și Vite. HTML-ul, toate chunk-urile JavaScript și CSS-ul servite din `/raytracing/` au răspuns cu 200, tipul MIME corect și conținut identic cu `dist/`. Raportul local este `.build/canyon-web-delivery.json`. Auditul HTTP citește octeții fișierelor; nu execută path tracer-ul.

## GitHub Pages

Workflow-ul `.github/workflows/pages.yml` publică `dist/` la push pe `main` sau `master`. În repository selectează **Settings → Pages → Source: GitHub Actions**. Configurația Vite folosește `base: './'`, inclusiv pentru fonturi și chunk-urile încărcate la cerere, astfel încât site-ul funcționează într-un subdirector Pages.

`output/raytracing-web.zip` conține build-ul static. Servește-l prin HTTP, nu direct prin `file://`.

Vezi `CREDITS.md` pentru surse și licențe și `VALIDATION.md` pentru verificări și limitele acestei revizii.
