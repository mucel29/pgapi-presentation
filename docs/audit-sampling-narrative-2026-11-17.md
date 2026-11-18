# Audit independent: sampling, buclă și trecerea spre BVH

Data: 2026-11-17. Commit web analizat: `78575b94afaffbc8d10f87659a96e24430c8886e`.

## Verdict

Slide-ul semnalat este confuz în **starea implicită**. Problema este modelul vizual, nu formularea etichetelor. O miniatură a traseului optic anterior plutește în canionul real, peste punte și lângă sursa reală. Pare următoarea porțiune a călătoriei, deși reia conceptual traseul de la o a doua cameră, micșorată. Conceptul predat — mai multe estimări independente pentru același pixel — aproape nu se vede.

Deplasarea camerei înainte a rezolvat navigarea, dar a introdus o ruptură de sens. Etichete suplimentare sau repoziționate nu o pot repara.

## Dovezi și limite

- Am privit întâi captura utilizatorului: `/tmp/codex-clipboard-d3236550-22de-4819-9ac5-ae92ef985d5c.png`.
- Am folosit exclusiv browserul din aplicație, la `http://upsilon:4173/`, 1280 × 720: samples normal/extins, loop normal/extins, pasul de eșantionare a luminii, tranziția spre cost, vederea stabilizată a punții, introducerea BVH și finalul lângă sursă.
- Am deschis samples din cuprins fără reglaje: **32 spp, adâncime 8, 4 lansări ilustrate**. Captura semnalată corespunde compoziției implicite; problema nu cere o setare specială a utilizatorului.
- Inspecția sursei a urmărit geometria, vizibilitatea, construirea samples și pozițiile camerelor. Nu am rulat teste, build sau path tracer; nu am importat, compilat, pornit ori randat tracerul. Fluxul opțional Explorare/Start a rămas neatins.
- Nu am reverificat în acest tur UI capitolele anterioare de sticlă și rază–triunghi, formatul portrait sau întreaga secvență BVH. Capturile browserului au fost privite în rezultatele instrumentului, fără fișiere noi de imagine.
- Inventarul focalizat nu a găsit un `AGENTS.md` local. Am urmat instrucțiunile AGENTS furnizate și am citit skill-ul systematic-debugging înaintea investigației.

## Constatări prioritare

### P1 — Samples / loop: modelul și lumea reală se confundă

**UI observat:** miniatura și traseul se suprapun peste silueta punții. Grinzile portocalii domină; sursa reală, foarte luminoasă, atrage privirea. „oglindă” pare lipită de un nod al punții, „sticlă” plutește în fața platformei sursei, iar camera micșorată plutește deasupra canionului.

**Sursă:** `src/core/lesson-space.ts:6–10` micșorează traseul la 0.18 și îl mută în lume. `src/engine/visuals.ts:80–91` adaugă copii wireframe translucide ale obiectelor optice. Lipsește o scenă separată, un suport sau un reveal care să stabilească stratul explicativ.

**Eroare didactică:** privitorul poate crede că raza interacționează cu puntea și cu obiectele reale din această zonă. Corectitudinea transformării geometrice nu asigură identificarea miniaturii.

**Recomandare:** eliminarea miniaturii din această poziție sau izolarea ei categorică într-o scenă de demonstrație. Obiectele lumii și cele explicative trebuie să se distingă înainte de citirea etichetelor.

### P1 — Samples: se vede un traseu cu bounces, nu mai multe estimări

**UI observat:** elementul clar este un traseu complet, segmentat, cameră → difuz → oglindă → sticlă → sursă. Cele patru lansări albe aproape coincid. Nu se văd patru trasee completate independent, patru contribuții sau media lor.

**Sursă:** `src/core/sampling.ts:10–16` construiește raze primare cu jitter până la primul hit. Calculează și o direcție de ieșire, dar liniile afișate folosesc numai `origin → end` (`src/engine/visuals.ts:148–155`). Traseul complet separat își modifică lungimea la schimbarea adâncimii.

**Eroare didactică:** fiecare segment sau stație poate părea un sample nou. Eticheta „4 lansări ilustrate · 32 spp · sursa atinsă” nu demonstrează relația dintre cele trei numere/concepte.

**Recomandare:** un sample se completează, depune o contribuție în același pixel, apoi începe alt sample independent. Numărul estimărilor și adâncimea unui traseu selectat trebuie demonstrate separat.

### P1 — Samples / loop: modul simplificat ascunde dovezile esențiale

**UI observat:** samples normal are titlu, formula mediei și un status mic. Loop normal are practic numai titlul și eticheta generică a modelului; pasul curent, L, β și comenzile lipsesc. Extinderea demonstrației le readuce, dar panoul opac mare acoperă modelul pe care îl explică.

**Sursă:** `src/style.css:43` ascunde împreună `#active-figure` și `#experiment-controls`. Loop începe oprit la pasul 0.

**Eroare didactică:** alegerea devine scenă fără explicație sau explicație fără scenă. Textul rar este potrivit; eliminarea contorului de samples, a operației curente și a dovezilor L/β nu este simplificare utilă.

**Recomandare:** operația curentă, dovada vizuală și o comandă principală rămân vizibile. Codul, derivările și paragrafele suplimentare pot sta în panoul extins.

### P1 — Loop: două contexte de rază simultane

**UI observat:** modelul reîncepe la camera sa, în timp ce un pachet verde al traseului real rămâne sub punte. La pasul de eșantionare a luminii, indicația mică a interogării concurează cu aceste elemente fără legătură vizibilă.

**Sursă:** `src/engine/visuals.ts:221–232` transformă grupul explicativ; `packet`, coada și contactul rămân în lumea reală și folosesc traseul original (`:247–251`).

**Eroare didactică:** nu se înțelege care rază reprezintă operația algoritmică. Recomand un singur context activ la un popas explicativ; dacă diagrama reîncepe la cameră, indicatorii concurenți ai traseului real trebuie suprimați sau delimitați clar.

### P2 — Loop → cost → BVH: deplasare coerentă, transfer semantic absent

**UI observat:** avansarea elimină miniatura și apropie observatorul de puntea reală. Apare o interogare galbenă și o față/grindă evidențiată roz; BVH adaugă apoi cutia. Deplasarea este continuă și puntea este un subiect concret bun. Vederea normală nu leagă însă raza nouă de operația `intersectScene` din buclă. Raza care părea să traverseze puntea a dispărut.

**Recomandare:** păstrăm deplasarea înainte; selectăm vizibil o interogare de intersecție din algoritm, apoi o examinăm pe punte. Trebuie stabilit dacă este un exemplu geometric separat sau segmentul optic urmărit. Identitatea nu poate rămâne implicită.

### P2 — Final: pixelul pare parte din sursă

**UI observat:** „celulă pixel” și „ΔL → pixel q · RGB” apar chiar pe/deasupra emițătorului.

**Sursă:** `src/engine/visuals.ts:45,236–239` mută markerul de întoarcere lângă sursă pentru a evita revenirea camerei.

**Eroare didactică:** continuitatea observatorului este păstrată, dar pixelul pare plasat pe obiectul emițător. Recomand păstrarea observatorului lângă sursă și transferul contribuției către un pixel de acumulare separat vizual, persistent.

## Cauza de fond

Designul echivalează mișcarea camerei înainte cu o explicație coerentă. Sampling și bucla revin conceptual la cameră și la interacțiunile anterioare. Copierea lor lângă observator păstrează direcția deplasării, dar schimbă sensul obiectelor. Materialele familiare, etichetele, vizibilitatea prin geometrie și alinierea cu sursa reală fac modelul să pară fizic.

A doua cauză este regula generică de restrângere a panoului: odată cu proza dispar și dovezile algoritmului. Scena nu a fost reproiectată pentru a le înlocui. Testele de geometrie/framing nu verifică dacă publicul identifică sample-ul, bounce-ul, pixelul sau stratul căruia îi aparține raza.

## Două variante de reproiectare

### A — Eliminăm miniatura; păstrăm o diagramă algoritmică mică și persistentă — recomandată

1. Observatorul se oprește după sticla reală pentru samples/loop. Canionul și traseul real rămân contextul spațial.
2. O diagramă mică, clar în planul interfeței și separată de obiectele lumii, arată **același pixel**, un sample activ și contribuția/media. Nu apare o a doua cameră fizică deasupra punții.
3. Animăm succesiv 3–4 samples ilustrative. Fiecare are propriul traseu schematic complet și propriul rezultat. Rezultatele rămân ca un rând scurt de culori; un singur traseu este accentuat. Continuările trebuie alese independent; primarele cu jitter nu trebuie prezentate ca estimări complete.
4. Adâncimea scurtează/prelungește sample-ul selectat fără a-i schimba identitatea. Numărul samples adaugă estimări în rând. „sample 2/4” și „segment 3” sunt suficiente; nu trebuie paragrafe.
5. Loop reutilizează această reprezentare. Operația curentă, L și β rămân într-o bandă mică, alături de pas/play. Derivările și codul rămân opționale.
6. Operația de intersecție face transferul vizibil spre puntea reală. La sursă, ΔL ajunge în același afișaj persistent al pixelului.

Avantaj: păstrează lumea pixelată, textul rar și călătoria înainte, dar oferă algoritmului un limbaj vizual consecvent. Diagrama este recognoscibilă ca diagramă și nu concurează cu puntea ori emițătorul.

### B — Păstrăm miniatura pe o stație de demonstrație distinctă

Miniatura stă pe un suport separat, neaglomerat, lângă ruta de după sticlă. Un reveal scurt, prin micșorarea traseului deja văzut, stabilește că este model. Fundalul/suportul izolează silueta de puntea și sursa reale. Arată samples complete și contribuții, cu comenzi mici persistente. Modelul dispare ca un singur obiect înainte de continuarea spre punte. Pixelul său rămâne element de diagramă și la final.

Varianta este posibilă, dar cere o nouă stație, mai multă scenografie și încadrare atentă. Eticheta generică „model” nu poate salva miniatura plutitoare actuală. **A are mai puține straturi de reprezentare și este mai clară.**

## Criterii pentru o implementare ulterioară

- Fără deschiderea detaliilor, publicul poate indica pixelul, diferenția un sample de un segment și vedea două contribuții combinate.
- Mai multe samples adaugă estimări; mai multă adâncime schimbă un traseu cu identitate constantă.
- Operația buclei și valorile L/β rămân lângă evenimentul ilustrat.
- Nicio rază de diagramă nu pare să lovească o grindă dacă aceasta nu este subiectul geometric intenționat.
- Transferul algoritm → interogare pe punte și sursă → contribuție în pixel este neechivoc.
- O captură normală și o scurtă parcurgere secvențială trebuie să demonstreze aceste relații înainte ca testele matematice/de încadrare să susțină validarea.

## Păstrarea lucrărilor existente

Am adăugat numai acest raport. Sursele, prezentările/PPTX, scripturile, artefactele output și modificările utilizatorului au rămas intacte. Nu am creat commit.
