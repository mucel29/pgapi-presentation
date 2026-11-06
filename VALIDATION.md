# Verificarea reviziei din 6 noiembrie 2026

Prezentarea păstrează 15 teme și 19 pași manuali. Site-ul și PPTX-ul folosesc același manifest. În această revizie nu s-a inițializat, compilat sau rulat path tracing-ul și nu s-au generat comparații GPU.

## Verificări curente

- Build TypeScript/Vite reușit din sursele finale.
- **22 de teste individuale trecute**, în șapte fișiere, cu `node --experimental-strip-types --test --test-isolation=none tests/*.test.ts`. Pe Node 26, comanda implicită poate raporta doar cele șapte procese de test. Comanda de mai sus afișează și execută explicit cazurile individuale.
- Testele acoperă Möller–Trumbore, sampling, refracție, traseul ales, slab test, BVH versus brute force și biblioteca de producție, manifest, mișcare, proiecția monitorului și anularea pornirii asincrone cu fakes deferred.
- Revizuirea independentă a surselor a confirmat protecțiile pentru anulare/retry și corecția etichetei de sticlă. Nu au rămas constatări substanțiale în acea revizuire.
- Cele opt diagrame SVG au fost exportate din cod și inspectate ca PNG. Este verificare de diagrame, nu verificare a interfeței în browser.

Datele didactice sunt reale pentru algoritmii locali: arcul are 96 de triunghiuri; raza implicită execută 7 teste cu triunghiuri și 17 teste AABB; closest-hit este triunghiul #30. În exemplul de pruning, tNear = 25.45 depășește tClosest = 25.10. Candidații SAH au costuri 54.5, 67.9 și 80.6. Intervalul comun pentru cutia rădăcină este 24.40…26.51.

Experimentul de zgomot este sintetic, Bernoulli, cu seed 4279 și grilă 20×12. RMSE la N = 1/4/16/64/256 este aproximativ 0.447/0.214/0.108/0.050/0.025. Aceste valori nu măsoară randarea scenei. Relația 1/√N descrie eroarea standard a estimatorului, fără a garanta o îmbunătățire monotonă a fiecărei realizări.

## PPTX și pachetul web

PPTX-ul are 17 slide-uri 16:9: 15 teme și două anexe. Cele 17 randări au fost inspectate individual la 1280×720, apoi revizuite independent. Nu au fost identificate suprapuneri sau clipping. Diagramele, textul, formulele și codul sunt obiecte editabile. Doar patru imagini ale scenei sunt capturi rasterizate reutilizate, cu geometrie/stare corespunzătoare. Notele păstrează explicațiile complete, codul și URL-urile surselor, fără afirmațiile de QA ale vechiului export.

Finalizer-ul first-party a verificat structura pachetului, numărul de slide-uri, dimensiunile, geometria textului și politica fonturilor DejaVu: fără constatări. Reimportul cu `@oai/artifact-tool` a trecut. Copia canonică are același SHA-256 ca fișierul validat. Validarea a necesitat rularea locală autorizată în afara sandbox-ului, deoarece runtime-ul Node raporta EPERM pentru subprocessul Python chiar când acesta termina cu cod 0.

`output/raytracing-web.zip` conține build-ul static final, cu fonturi și chunk-uri locale. Conținutul arhivei este comparat cu `dist/`, nu cu o versiune precedentă. Fișierele vechi sunt păstrate în `.build/revisions/`.

Rapoarte curente: `.build/qa/tests-current.log`, `build-current.log`, `raytracing-current.validation.json`, `artifact-content-current.json`, `package-current.json` și `preview-current.json`. Randări: `.build/slides/`; manifest: `.build/deck-content.json`.

## Preview și limite

Serverul existent nu a fost întrerupt. `http://100.122.176.14:4173/raytracing/` și aceeași cerere cu `Host: upsilon:4173` au răspuns HTTP 200 după build-ul final. IP-ul Tailscale este 100.122.176.14, iar `preview.allowedHosts` păstrează `upsilon`. URL pentru telefonul conectat la tailnet: `http://upsilon:4173/raytracing/`.

**Browser CUA nu a fost disponibil.** Nu s-au verificat vizual site-ul curent pe desktop, responsive layout-ul sau interacțiunile pe telefon. Nu s-a folosit altă automatizare de browser. Cele 45 de verificări de layout consemnate în revizia anterioară se referă la interfața anterioară și nu sunt atribuite acestei versiuni. Nu a fost disponibil Microsoft PowerPoint nativ. Verificările structurale/importul nu dovedesc comportamentul în aplicația nativă. Fallback-ul fără floating-point rendering și performanța la 720p/8 bounces nu au fost verificate fizic în această revizie.

## Verificare GPU anterioară, din 5 noiembrie 2026

La 320×180 și două bounces, după orbitare și stabilizare, samples au crescut de la 166 la 651, iar contorul resetărilor a rămas 48. Tracing-ul a fost oprit după verificare. Raport istoric: `.build/qa/motion-regression.json`. Această observație limitată este păstrată separat și nu reprezintă o nouă verificare GPU a surselor curente.
