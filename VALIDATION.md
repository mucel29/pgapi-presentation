# Verificare: redesign-ul scenei și tranzițiilor, 6 noiembrie 2026

Checkpoint-ul local `16531134896fa5bb7044534a3e3c143551875b65` pe `main` a fost creat înaintea redesign-ului. Nu există remote. Commit-ul de bază nu a fost rescris. Versiunile anterioare ale artefactelor sunt păstrate în `.build/revisions/`.

## Surse și geometrie

Responsabilul implementării a raportat **28/28 teste individuale trecute**, fără eșecuri, apoi build TypeScript/Vite reușit cu 164 de module. Comanda a fost `node --experimental-strip-types --test --test-isolation=none tests/*.test.ts && npm run build`. Rezultatul a fost predat integrării din sesiunea de lucru; nu este inventat un fișier de log pentru acea execuție. Exportul nu a modificat scena/core/copy și nu a repetat aceste verificări neschimbate.

Revizuirea independentă a surselor a confirmat că navigarea, linkurile directe, capturile și replay-ul folosesc Beat + `shotPose`, fără cititori activi ai vechilor poziții din Chapter. Exportul serializează acum pozițiile autoritative calculate pentru landscape și portrait. Au rămas 15 teme și 19 pași manuali.

Raportul CPU `.build/cinematic-review/geometry.json` consemnează segmente de 40.9659/50.2449/55.1725/2.2846/40 de unități, zero contacte nedorite, 837 de probe neobturate ale monitorului și zero coliziuni ale camerei. Acestea sunt verificări geometrice, nu o evaluare a imaginii WebGL.

Arcul structural, mutat în noua arhitectură, păstrează 96 de triunghiuri. Raza didactică testează 7 triunghiuri și 17 AABB-uri, cu closest-hit #30. Costurile SAH rămân 54.5/67.9/80.6; planele X/Z sunt actualizate la noile coordonate ale arcului. Intervalul comun este 24.40…26.51. Experimentul Bernoulli de zgomot rămâne separat de scena 3D, cu seed 4279 și RMSE aproximativ 0.447/0.214/0.108/0.050/0.025 la 1/4/16/64/256 samples.

## PPTX și pachet web

PPTX-ul are **17 slide-uri 16:9**, 15 teme și două anexe. Textul, formulele, codul, arborele și diagramele sunt editabile. Au fost eliminate toate capturile scenei vechi. Trei imagini arată explicit proiecții CPU ale geometriei curente: camera cu biroul/monitorul, arcul structural și curtea cu traseul ilustrativ. Diagrama diffuse este un evantai nativ editabil, generat cu funcția locală cosineHemisphere.

Imaginile CPU sunt etichetate pe slide și în note. Nu sunt capturi de browser, beauty renders sau verificări ale iluminării, reflexiei ori transmisiei. Traseul este determinist, ales pentru explicație și valid geometric local; nu este un rezultat Monte Carlo al rendererului. Unghiurile sticlei și datele BVH/SAH sunt regenerate din ruta și geometria curente.

Toate slide-urile au fost regenerate. Au fost inspectate la dimensiune lizibilă paginile modificate și efectele de layout aferente, fără clipping sau suprapuneri constatate. Paginile neschimbate păstrează inspecția anterioară. Numărul de slide-uri, notele complete, codul și sursele sunt auditate din pachet. Finalizer-ul first-party verifică integritatea, geometria, fonturile DejaVu și reimportul. Copia canonică este comparată prin SHA-256 cu fișierul validat.

`output/raytracing-web.zip` este reconstruit din `dist/` final și comparat byte-for-byte pentru fiecare fișier. Integrarea exportului nu reconstruiește din nou producția și nu întrerupe serverul existent. Rapoarte: `.build/qa/raytracing-current.validation.json`, `artifact-content-current.json`, `package-current.json` și `cinematic-integration.json`. Manifest: `.build/deck-content.json`; proiecții: `.build/cinematic-review/`; randări de slide: `.build/slides/`.

## Preview și limite

Preview pentru dispozitivul conectat la tailnet: `http://upsilon:4173/raytracing/`, IP `100.122.176.14`. Configurația Vite păstrează `preview.allowedHosts=['upsilon']`. Implementarea a predat build-ul final cu HTTP 200; integrarea verifică din nou conținutul servit și identitatea sa cu `dist/`.

**Browser CUA nu a fost disponibil.** Nu s-au evaluat vizual în browser noile tranziții, reflexiile, transmisia, lumina sau layout-ul pe telefon. Nu s-a folosit automatizare alternativă de browser. Capturile CPU și verificările numerice nu înlocuiesc acea evaluare. Cele 45 de verificări de layout dintr-o revizie anterioară sunt istorice și nu sunt atribuite interfeței actuale. Microsoft PowerPoint nativ nu a fost disponibil.

Nu s-a inițializat, încărcat, compilat sau rulat path tracer-ul în acest redesign sau în integrarea artefactelor. Performanța și acumularea noii scene nu au fost măsurate pe GPU. Start path tracing rămâne o acțiune explicită, după lecție.

## Observație GPU istorică, 5 noiembrie 2026

La 320×180 și două bounces, samples au crescut de la 166 la 651 după stabilizare, iar resetările au rămas 48. Tracing-ul a fost oprit atunci. Raport: `.build/qa/motion-regression.json`. Rezultatul se referă la versiunea veche și nu validează noua scenă.
