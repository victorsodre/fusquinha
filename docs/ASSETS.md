# Asset provenance and use

## Beetle model

- Author: **Rodrigo Marini**, artist from São Paulo, Brazil.
- Original title: **VolksWagen Beetle**, described by its author as a 1965 model with interior, engine, suspension, and wheels.
- Page: https://www.blendkit.com/asset-gallery-detail/e8a58537-3114-4962-a5c5-60fdb0346f1c/
- Asset base ID: `e8a58537-3114-4962-a5c5-60fdb0346f1c`; consulted version: `cfd06193-0f4e-467e-8f94-7a1a7e9ebdff`.
- License returned by the API on 2026-09-05: **Royalty Free**; free asset.
- Terms: https://www.blendkit.com/docs/licenses/ and https://www.blendkit.com/docs/licenses/licensing-faq/

The asset is **not public domain or manufacturing CAD**. It was downloaded through BlenderKit’s public API without credentials, using a scene UUID and the 1K texture variant. BlenderKit terms restrict redistribution of the separate product and delivery in an extractable open format. A browser-served GLB is extractable. Victor expressly requested repository inclusion and publication after receiving that information; this decision does not grant permission from the rightsholder or alter the original license. Rodrigo Marini remains credited in the interface and documentation.

Local changes: solar-yellow paint, four chrome hubcaps, two display plates, portable PBR shaders, separation of the original 511 islands, and organization into nine assemblies. The result has **515 elements**. The project originates in Vitória, ES, and the local plate identifier is defined in `src/project.ts` and drawn at runtime. The Brazilian reinterpretation does not claim complete historical fidelity to a national model year; part names are visual descriptions, not replacement-part codes.

## Interface inspiration and scenery

[Ashe’s Model X Studio](https://github.com/ashemag/model-x-studio) was visually inspected as an interaction reference for orbit, isolation, and disassembly. The implementation is independent; no source code or asset was copied. The repository consulted did not present a code license.

Green geometric tiles, cobogós, and plaster texture were created locally in `public/scenery/`. `src/garage-floor.ts` generates the stone-floor texture and receives headlight lighting and vehicle shadows. No external photograph or additional scenery asset is used.

## Sound, lighting, and icons

The engine recording is **Dušan Oblak / Work With Sounds / Technical Museum of Slovenia**, from a 1984 Mexican Beetle 1600: [Wikimedia source](https://commons.wikimedia.org/wiki/File:WWS_VolkswagenBeetle8211engine.ogg), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). The OGG and compatibility MP3 are local, uncut, and looped at 40% initial volume. Victor selected the recording and is not credited as its author. Command effects are documented in [SOUND-SOURCES.md](SOUND-SOURCES.md).

Lighting uses [Studio Small 09](https://polyhaven.com/a/studio_small_09) by Sergej Majboroda / Poly Haven, local 2K HDR, under [CC0](https://polyhaven.com/license). DM Sans and Manrope are under the SIL Open Font License; Lucide is ISC. No model extracted from a commercial game was used.
