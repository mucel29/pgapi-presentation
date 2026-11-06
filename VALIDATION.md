# Verificare: revizia lecției și a viewport-ului, 6 noiembrie 2026

Checkpoint-ul local `16531134896fa5bb7044534a3e3c143551875b65` pe `main` precede redesign-ul. Revizia stabilă `def724e` rămâne în istoric. Nu există remote și istoricul nu a fost rescris. Artefactele înlocuite sunt păstrate în `.build/revisions/`.

## Surse, stare și geometrie

Revizorul independent a predat sursele și `dist/` stabile după **42/42 teste individuale trecute** și build TypeScript/Vite reușit. Comanda testelor a fost `node --experimental-strip-types --test --test-isolation=none tests/*.test.ts`. Exportul nu a modificat sursele aplicației și nu a repetat build-ul sau testele neschimbate. Rezultatul provine din predarea revizorului; nu este inventat un log separat.

Revizia separă zona opacă a lecției de viewport-ul scenei. La 1280×720, scena ocupă [486,72,794,568]; la 390×844, [0,64,390,321]. Testele verifică dreptunghiurile disjuncte, aspectul rasterizării și adăugarea o singură dată a offset-ului proiecției. Arborele, formulele și comenzile rămân în lecție, iar cutiile BVH au contur întunecat și contur colorat. Markerul de pixel folosește poziția proiectată, în locul vechiului frustum 3D.

Samples păstrează observatorul lângă sticlă. Vederea izolată ascunde temporar arhitectura și arată aceeași sferă analitică drept wireframe translucid. Cele 12/24/48 de lansări sunt reprezentative și nu înlocuiesc bugetul numeric SPP. Razele noi pornesc de la momentul interacțiunii, iar animația continuă până la terminarea emisiei. Sunt verificate capete de minimum patru pixeli la viewport-uri reprezentative și restaurarea vizibilității, materialelor și stării oglinzii la ieșire/revizitare/link direct. Replay păstrează setul și resetează timpul. Camera buclei evită spatele reflectorului.

Materialele cian `#43bdd9` și bronz cald `#f4b14b` alimentează atât geometria, cât și calculul didactic β în RGB liniar. Nuanța afișată este β/max(β), convertită în sRGB; valorile RGB și max(β) rămân separate. Modelul didactic nu aplică Fresnel sau absorbție după sticlă. Evantaiul GGX ilustrează direcții alternative, nu samples suplimentare ale pixelului.

Au rămas 15 teme și 19 pași manuali. Manifestul exportă Beat + `shotPose` la aspectul real al fiecărui viewport, pentru landscape și telefon. Datele BVH/SAH, intervalele slab, unghiurile sticlei și experimentul sintetic sunt regenerate din sursele stabile, fără GPU. Rapoartele numerice vechi din `.build/cinematic-review/` sunt istorice și nu validează noul layout.

## PPTX și pachet web

`output/raytracing.pptx` are **17 slide-uri 16:9**, 15 teme și două anexe. Textul, formulele, codul, arborele și diagramele sunt editabile. Diagrama diffuse și succesiunea β folosesc culorile din sursă; bucla are aceiași șapte pași ca lecția live. Notele explică vederea izolată Samples, ponderea RGB și convenția de afișare.

Trei imagini curente provin din `scripts/render-current-projections.mjs`: birou/monitor, arc BVH și curte. Ele folosesc aspectul 794×568 al scenei și sunt etichetate pe imagine, pe slide și în note drept **proiecții CPU de geometrie**. Nu sunt capturi de browser sau beauty renders și nu validează iluminarea, reflexiile ori transmisia WebGL. Nu se reutilizează capturi ale scenei vechi în deck.

Toate slide-urile au fost regenerate. Paginile modificate 1/4/5/6/7/9/15/17 au fost inspectate la dimensiune lizibilă, fără clipping sau suprapuneri constatate. Paginile neschimbate păstrează inspecția anterioară. Auditul pachetului confirmă 17 slide-uri, 17 note, toate notele/codul/sursele celor 15 teme și sursele celor două anexe. Finalizer-ul first-party a trecut integritatea, fonturile DejaVu, geometria cu **zero constatări** și reimportul celor 17 slide-uri. SHA-256 al copiei canonice coincide cu fișierul validat. Randarea de contact arată deck-ul curent; preview-ul sticlei este randarea diagramei native din slide-ul 5.

`output/raytracing-web.zip` conține **12 fișiere**, comparate individual byte-for-byte cu `dist/` final. Exportul nu a reconstruit producția și nu a oprit serverul existent. Rapoarte curente: `.build/qa/raytracing-current.validation.json`, `artifact-content-current.json`, `package-current.json` și `cinematic-integration.json`. Manifest: `.build/deck-content.json`; proiecții: `.build/current-projections/`; randări: `.build/slides/`.

## Preview și limite

Preview-ul este `http://upsilon:4173/raytracing/`, la `100.122.176.14:4173`, cu baza `/raytracing/` și `upsilon` permis explicit. HTML-ul, toate cele trei bundle-uri JS și CSS-ul răspund cu HTTP 200, tipul de conținut corect și bytes identici cu `dist/`.

**Browser CUA nu a fost disponibil.** Tranzițiile, reflexiile, transmisia, lumina și layout-ul pe telefon nu au fost evaluate vizual în browser. Nu s-a folosit automatizare alternativă de browser. Proiecțiile CPU și verificările numerice nu înlocuiesc acea evaluare. Microsoft PowerPoint nativ nu a fost disponibil.

Nu s-a inițializat, încărcat, compilat sau rulat path tracer-ul în această revizie sau în export. Performanța și acumularea scenei curente nu au fost măsurate pe GPU. Explorarea pornește rasterizat; path tracing rămâne o acțiune explicită a utilizatorului după lecție.

## Observație GPU istorică, 5 noiembrie 2026

La 320×180 și două bounces, samples au crescut de la 166 la 651 după stabilizare, iar resetările au rămas 48. Tracing-ul a fost oprit atunci. `.build/qa/motion-regression.json` se referă la versiunea veche și nu validează scena curentă.
