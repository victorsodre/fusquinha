# Local validation — Fusquinha

Validated on 2026-09-05.

- `npm test`: eight tests passed. They cover catalog integrity, plate scale and orientation, non-overlapping placement of 515 elements, camera framing in three aspect ratios, engine-motion limits, articulated assemblies, driver-door opening, and sound-loop durations.
- `npm run build`: TypeScript and production build passed; the 3D scene loads as a separate module.
- `scripts/browser-check.js`: 21 Chromium checks passed through Playwright CLI with no runtime errors.
- `scripts/accessories-check.js`: eight checks passed for lights, door, wipers, hazards, global mute, reduced motion, disassembly after opening the door, and mobile controls.

The original validation also confirmed user-initiated audio, looping, mute behavior, reduced-motion handling, scene labels, isolation, zoom, search, reversible assembly, keyboard control, local Vitória/ES plates, desktop/mobile layouts, and PNG export.

Records are in `output/playwright/`. Mobile verification uses a browser viewport, not a physical device. The 515 elements belong to an artistic model and do not validate manufacturing accuracy. Distribution conditions are documented in [ASSETS.md](ASSETS.md).
