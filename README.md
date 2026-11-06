# Algoritmul Ray Tracing

Prezentare în română pentru Programare grafică avansată și prelucrarea imaginilor: 15 teme, patru secvențe de deplasare, aproximativ 17–19 minute cu opriri pentru demonstrații, urmate de explorare opțională.

Începem la un birou obișnuit, cu PC și monitor. Monitorul arată curtea în mișcare lentă, rasterizată. Intrarea continuă aceeași mișcare în lumea virtuală: un culoar umbrit se deschide spre o curte adâncă, un element difuz din ocru, o foaie de poartă din bronz, un vestibul de sticlă și o cameră retrasă cu lumină caldă. Materialele fac parte din arhitectură. Secțiunea BVH folosește cele 96 de triunghiuri ale arcului structural din spate.

Raza pornește înaintea observatorului. Camera o urmărește pe segmente de aproximativ 41, 50, 55 și 40 de unități, apoi se așază la fiecare demonstrație. La sticlă sunt distincte sosirea, intrarea, ieșirea și continuarea. Navigarea rămâne manuală.

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
- **Home / End**: început / ultimul slide.
- Codul și detaliile pun animația pe pauză. Slide-ul principal are o explicație scurtă și cel mult două idei; detaliile păstrează derivările și observațiile complete.
- BVH: selectează noduri. **Opțiuni** deschide părinții, raza hit/miss și **Alege ținta** și click pe arc. **Primul / Pas / Ultimul / Rulează** controlează traversarea; triunghiul closest-hit este magenta.
- Intersecția rază–triunghi: slidere u/v și cazuri interior, muchie, exterior, paralel. Diagrama și BVH-ul folosesc aceeași implementare Möller–Trumbore.
- Bucla de path tracing: pași manuali pentru contribuția emisivă, shadow ray, BSDF și registrele L/β.
- Sticlă: alege o predicție pentru direcția de ieșire, apoi vezi ramura transmisă prin ambele fețe.
- Samples: modifică separat numărul traseelor și limita de bounces. SAH: compară costul unor tăieturi reale pe arc.
- Zgomot: experiment sintetic la 1/4/16/64/256 samples, cu RMSE măsurat față de un semnal cunoscut. Nu pornește rendererul path-traced.

Linkuri directe: `#chapter=bvh`, `#chapter=traversal`, `#chapter=materials&beat=to-glass`. Sunt păstrate aliasurile vechi `gpu`, `accumulation`, `modern`.

## Path tracing: numai la cerere

Prezentarea și capturile folosesc exclusiv rasterizare. **Nu există inițializare, compilare sau randare path-traced în fundal.**

Butonul final **Explorare** deschide întâi curtea rasterizată. Doar **Start path tracing** importă și inițializează `WebGLPathTracer`. Butonul **Oprește path tracing** revine la rasterizare. O verificare GPU anterioară, din 5 noiembrie 2026, a urmărit acumularea la 320 × 180 și două bounces. În revizia curentă nu s-a pornit tracer-ul. Comparațiile la multe samples și benchmark-ul la calitatea maximă rămân separate.

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

## PPTX și capturi

`output/raytracing.pptx`: 16:9, 15 slide-uri principale + două anexe, cu text, formule, cod și diagrame editabile, trei proiecții CPU explicite ale geometriei actuale, note și citări. Include răspunsul pentru placa de sticlă, costuri SAH calculate, intervale slab reale, un pas concret de pruning și experimentul sintetic de convergență. Proiecțiile CPU nu sunt capturi de browser și nu reproduc iluminarea, reflexiile sau transmisia WebGL. Nicio imagine a scenei vechi nu este prezentată ca rezultat al redesign-ului. Fonturile DejaVu sunt incluse în `public/fonts/`; instalează-le pe calculatorul cu PowerPoint pentru aceeași aranjare.

Manifestul comun este `src/content/chapters.ts`: conținut, note, surse și secvențe. Pozițiile de cameră active sunt în `Beat`, iar `src/core/cinematics.ts` calculează `shotPose`, mișcarea razei și intrarea prin monitor. Exportul ignoră câmpurile legacy `Chapter.camera/target` și folosește aceste poziții active. Capturi deterministe fără UI: `?capture=diffuse`, `?capture=to-glass`, `?capture=final`. **Inclusiv `final` și vechiul alias `beauty` sunt rasterizate.** Adaugă `&ui=1` pentru capturi cu overlay sau `&phase=0.5` pentru un moment precis din tranziție. Starea `body[data-capture-ready="true"]` indică finalizarea capturii.

Pentru regenerarea PPTX-ului în mediul Codex cu `@oai/artifact-tool` disponibil:

```sh
node --experimental-strip-types scripts/render-cinematic-proof.mjs
sh .build/cinematic-review/convert-proof.sh
node --experimental-strip-types scripts/export-manifest.mjs
node scripts/build-deck.mjs
```

Calea bibliotecilor poate fi schimbată cu `PRESENTATION_RUNTIME` și cea a skill-ului cu `PRESENTATION_SKILL`. Proiecțiile CPU curente sunt în `.build/cinematic-review/`; scriptul de conversie folosește ImageMagick. `assets/captures/` păstrează capturi istorice, nefolosite în PPTX-ul actual. Exporterul creează randări în `.build/slides/`, verifică pachetul, dimensiunile, fonturile și importul cu runtime-ul first-party, apoi actualizează copia canonică numai după validare. Versiunile anterioare sunt păstrate în `.build/revisions/`. Manifestul exportat, inclusiv datele geometrice și experimentele fără GPU, este `.build/deck-content.json`.

Toate cele 17 slide-uri au fost regenerate. Paginile modificate, inclusiv proiecțiile scenei, distribuția cosine-weighted, unghiurile sticlei și valorile SAH, au fost inspectate la 1280 × 720. Layout-urile neschimbate păstrează verificarea anterioară. Verificarea vizuală în browser pe desktop/telefon și Microsoft PowerPoint nativ nu au fost disponibile pentru această revizie. Verificările de layout în browser din revizia precedentă nu reprezintă o verificare a interfeței actuale.

## Preview prin tailnet

După build, pornește serverul pe IP-ul returnat de `tailscale ip -4`:

```sh
npm run preview -- --host <TAILNET_IP> --port 4173 --strictPort --base=/raytracing/
```

Deschide `http://upsilon:4173/raytracing/` de pe dispozitivul conectat la tailnet. `preview.allowedHosts` permite explicit `upsilon`. Adresa IP funcționează și direct.

## GitHub Pages

Workflow-ul `.github/workflows/pages.yml` publică `dist/` la push pe `main` sau `master`. În repository selectează **Settings → Pages → Source: GitHub Actions**. Configurația Vite folosește `base: './'`, inclusiv pentru fonturi și chunk-urile încărcate la cerere, astfel încât site-ul funcționează într-un subdirector Pages.

`output/raytracing-web.zip` conține build-ul static. Servește-l prin HTTP, nu direct prin `file://`.

Vezi `CREDITS.md` pentru surse și licențe și `VALIDATION.md` pentru verificări și limitele acestei revizii.
