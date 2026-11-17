# Web presentation acceptance — 17 November 2026

Default cards now show a title and an essential equation where needed. `Demonstrație` opens the existing figures, controls and explanations; `Detalii` retains the complete technical context, including the former visible teaching paragraphs.

After glass, the observer moves forward to a labeled miniature of the original sample/path model. Samples and loop share this station. The BVH bridge lies farther along the same leg; noise, denoising and the final contribution remain near the light source. The actual optical path is unchanged. Interrupted movement starts at the current observer pose.

## Checks completed

- Final TypeScript and production build passed; `git diff --check` passed.
- Focused CPU suites passed: cinematics, overview framing, journey, integration, math, illustrations, lesson state, UI state and request generation. These cover camera clearance at desktop/phone aspect ratios, local-model projections and reset on revisit, and relocated BVH intersections against brute force and the library reference.
- Actual IAB review used its existing 1280×720 viewport. Verified glass → samples → loop, forward BVH framing, source-side noise/denoise and light; chapter jumps, previous/next, a direct samples hash plus reload, depth 2 then revisit/reset, and advancing during movement (first click finishes the shot).
- Sparse opening, sampling, BVH, noise, denoising and source cards were checked visually. Samples, loop, BVH, noise and denoising demonstrations remained one click away; sample depth and loop stepping worked. `Detalii` displayed the full BVH context and sources. Labels remained crisp over the intentionally pixelated world.
- Before/after samples and source screenshots were captured in the IAB review. The final source view stays at the beacon rather than returning to the original camera.

## Scope and limits

This was focused acceptance of the requested route and decluttering changes, not a new exhaustive review of every exercise or device. No viewport override, projector hardware test or native touch test was performed. The sample station is explicitly an explanatory miniature; noise and denoising comparisons use synthetic signals.

The actual path tracer was never started, imported at runtime, initialized, shader-compiled or rendered. Its explicit Start gate remains. PowerPoint files and deck scripts were excluded from this web change. No remote publication was performed.

Preview: `http://upsilon:4173/`, serving this checkout's `dist`; detached preview log: `/tmp/pgapi-web-preview.log`.
