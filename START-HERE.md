# Începe de aici

Arhiva conține proiectul Ray Tracing în starea locală din 2026-11-18T23:43:55+02:00, cu sursele și modificările necomise incluse. Commit de referință: `10b67db393c6d440ca387487607c55856613a867`. Nu s-au regenerat site-ul sau prezentările pentru această arhivă.

## PowerPoint

Deschide `output/Ray-Tracing-Prezentare.pptx`: prezentarea cu 20 de slide-uri, capturi ale demonstrației și note. Poate fi editată direct în PowerPoint sau LibreOffice Impress.

- `output/Ray-Tracing-Capturi-Demo.pptx` și `output/raytracing.pptx` au exact același conținut ca prezentarea principală.
- `output/Ray-Tracing-Diagrame-backup.pptx`: varianta de rezervă cu diagrame, 17 slide-uri.
- `output/raytracingv1.pptx`: varianta mai veche, 17 slide-uri.
- `output/Ray-Tracing-FullHD-preview.png`: previzualizarea existentă. Nu există un fișier separat `Ray-Tracing-FullHD.pptx` în acest snapshot.

## Pornirea și editarea site-ului

Instalează Node.js 22.18+ sau 24+ și folosește un browser cu WebGL 2. Deschide un terminal în acest director și execută:

```sh
npm ci
npm run dev
```

Deschide adresa afișată în terminal. `npm ci` necesită acces la internet prima dată. Pentru o versiune de producție nouă:

```sh
npm run build
npm run preview
```

`dist/` conține și build-ul static existent, copiat fără regenerare; pentru a reflecta modificări noi, rulează build-ul. Site-ul trebuie servit prin HTTP, nu deschis prin `file://`. Comanda `npm run preview` servește `dist/` existent.

Lecția și explorarea inițială folosesc rasterizare. Path tracer-ul pornește doar prin **Start path tracing**. Nu a fost pornit la împachetare.

## Unde se lucrează

| Fișier / director | Conținut |
| --- | --- |
| `src/content/chapters.ts` | Capitole, text, note, exemple de cod și surse |
| `src/core/world.ts`, `src/core/cinematics.ts` | Scena și mișcarea camerei/razei |
| `src/content/world-shots.ts` | Configurația cadrelor |
| `src/ui/`, `src/engine/`, restul `src/core/` | Interfață, scenă și algoritmi |
| `public/` | Fonturi și licențe folosite de site |
| `assets/captures/` | Capturi și imagini ale proiectului |
| `scripts/` | Sursele generatoarelor de prezentări și uneltele auxiliare |
| `.build/deck-content.json` | Manifestul existent pentru generatoarele PPTX |
| `.build/screenshot-deck-captures-fhd/` | Capturi Full HD și detalii folosite de generatorul cu capturi |
| `.build/screenshot-deck-captures/`, `.build/captures/`, `.build/current-projections/` | Alte imagini și intrări pentru generare |
| `.build/` | Capturi, verificări și materiale intermediare utile păstrate |
| `docs/`, `README.md`, `VALIDATION.md`, `CREDITS.md` | Documentație, verificări istorice, surse și limite |
| `.github/workflows/pages.yml`, `vite.config.ts` | Publicarea GitHub Pages și configurația Vite |
| `tests/` | Testele existente; se rulează cu `npm test` |

## Regenerarea automată a PowerPoint-ului

`npm ci` instalează dependențele site-ului. Generatoarele PPTX folosesc în plus `@oai/artifact-tool` și utilitare din runtime-ul Codex, care nu fac parte din `package.json` și nu sunt distribuite aici. `build-screenshot-deck.mjs` și `build-upload-deck.mjs` au căi absolute pentru calculatorul de origine. Acestea trebuie adaptate, iar runtime-ul trebuie să fie disponibil separat pentru regenerare automată. `build-deck.mjs`/`finalize-deck.mjs` folosesc și variabilele `PRESENTATION_RUNTIME`/`PRESENTATION_SKILL` acolo unde sunt definite în scripturi. Fonturile folosite sunt DejaVu Sans și DejaVu Sans Mono.

Sursele, manifestul și imaginile de intrare sunt incluse; fișierele PPTX exportate se editează direct fără acest runtime. Pentru a actualiza manifestul din sursele web, scriptul existent este `node --experimental-strip-types scripts/export-manifest.mjs`. Nu am modificat și nu am executat generatoarele la împachetare.

## Conținutul snapshot-ului

Sunt incluse sursele locale exacte, fișierele necomise, toate cele cinci PPTX existente, imaginile, scripturile, configurația, manifestul/lockfile-ul npm, testele, documentația și `dist/` existent. Informațiile mai vechi din README și rapoarte rămân păstrate ca atare; acest fișier descrie conținutul arhivei.

Sunt excluse `node_modules`, istoricul `.git`, directoarele locale de cont/agent, fișierele de mediu și credențiale, cache-urile, jurnalele temporare, arhivele ZIP vechi, copiile istorice `.build/revisions/` și `.build/validated/`, candidații PPTX/inspecțiile temporare din `.build/` și imaginile intermediare PPM. Variantele utile finale sunt în `output/`, iar sursele și imaginile necesare editării rămân incluse. Dependențele web se reinstalează cu `npm ci`.

`HANDOFF/SNAPSHOT-GIT.txt` arată commitul și starea Git inițială. `HANDOFF/MANIFEST-SHA256.txt` conține hash-urile tuturor celorlalte fișiere din arhivă. Arhiva a fost verificată integral și extrasă într-un director temporar; fișierele extrase au fost comparate cu snapshot-ul. Nu s-au rulat build, teste sau browser la împachetare.
