# Prepared path traced presentation frames

Generated locally from this presentation's `createCourtyard` scene using the existing `Finale`, `three-gpu-pathtracer` 0.0.23 and Three.js 0.184.0. No synthetic noise overlays or raster images are presented as traced samples.

Each `raw-NNN.webp` is the display transform of one genuine progressive prefix of N samples per pixel. The manifest records the fixed camera, resolution, estimator settings, filter settings and provenance. Guided outputs use the exact same raw 4 spp input and the existing normal, depth and albedo buffers from the same camera. They differ only in the number of existing guide-aware filter passes.

Stanford Bunny: Stanford Computer Graphics Laboratory, Stanford 3D Scanning Repository. See `src/assets/STANFORD-BUNNY-CREDITS.md` in the source distribution. Third-party licenses are bundled in `public/licenses`.

To regenerate locally, run `node scripts/serve-capture.mjs`, open `/capture.html` and click **Capture actual 1–100 spp**. The local endpoint writes only the bounded prepared capture filenames under this directory. The presentation itself never invokes this capture page or endpoint.
