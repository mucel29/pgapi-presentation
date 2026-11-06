# Surse și licențe

Geometria, texturile procedurale, traseul, ilustrațiile, BVH-ul didactic, filtrele și capturile scenei sunt create în acest proiect. Nu sunt folosite modele 3D sau imagini externe.

Conținutul didactic pornește de la:

- [Materialele EGC](https://mucel29.github.io/egc-presentation/): ray tracing, path tracing și partiționare spațială.
- [Ray Tracing in One Weekend](https://raytracing.github.io/books/RayTracingInOneWeekend.html) și [The Next Week](https://raytracing.github.io/books/RayTracingTheNextWeek.html).
- [PBRT, Bounding Volume Hierarchies](https://pbr-book.org/4ed/Primitives_and_Intersection_Acceleration/Bounding_Volume_Hierarchies).
- [Schied et al., SVGF, 2017](https://research.nvidia.com/labs/rtr/publication/schied2017spatiotemporal/).
- [NVIDIA Real-Time Denoisers](https://github.com/NVIDIA-RTX/NRD).
- [Intel Open Image Denoise](https://www.openimagedenoise.org/).

Biblioteci cu versiuni fixate în package-lock.json:

- Three.js 0.184.0 — MIT. Reflector este folosit pentru reflexia planară rasterizată din prezentare.
- three-gpu-pathtracer 0.0.23 — MIT, Garrett Johnson și contributori. Interfața WebGLPathTracer se încarcă numai după Start explicit.
- three-mesh-bvh 0.8.3 — MIT, Garrett Johnson și contributori. Anexa PPTX include un extras reformatat din `src/gpu/glsl/bvh_ray_functions.glsl.js`, `_bvhIntersectFirstHit`, privind ordinea introducerii copiilor în stivă.
- Vite și TypeScript — MIT / Apache-2.0, conform pachetelor.
- DejaVu Sans și DejaVu Sans Mono — licența DejaVu/Bitstream Vera, inclusă în `public/licenses/`.

Licențele bibliotecilor de randare sunt incluse în `public/licenses/`. Fragmentele schematice sunt etichetate ca pseudocod sau fragmente prescurtate. Referințele complete și proveniența codului apar în notele fiecărui slide.
