# Fusquinha — free sound effects

Four CC0 effects were selected at Victor’s request. No paid file was acquired. The vehicle models are unspecified, so these are not confirmed Beetle recordings.

| File | Author | Source |
|---|---|---|
| `farol-interruptor.mp3` | khenshom | https://freesound.org/people/khenshom/sounds/504954/ |
| `pisca-rele.mp3` | MWsfx | https://freesound.org/people/MWsfx/sounds/574249/ |
| `limpadores-parabrisa.mp3` | MyInnerWill | https://freesound.org/people/MyInnerWill/sounds/704508/ |
| `porta-generica-abrir-fechar.mp3` | nmscher | https://freesound.org/people/nmscher/sounds/86232/ |

All four are licensed under [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/). Credit is not required, but authors and sources are retained here. Source files are public high-quality MP3s supplied by the Freesound player; they are not the original lossless WAV/AIFF downloads, which require login.

## Application edits

Derived mono PCM WAV files are 44.1 kHz. The source MP3s were preserved; the derived clips use 3–4 ms edge microfades.

| Use | Start (s) | Duration (s) | Clip gain |
|---|---:|---:|---:|
| Headlights on | 0.10 | 0.55 | 2× |
| Headlights off | 2.25 | 0.65 | 2× |
| Door open | 0.65 | 1.10 | 3× |
| Door close | 2.75 | 0.70 | 1× |
| Hazards loop | 1.50 | 0.73 | 5× |
| Wipers loop | 1.63 | 1.40 | 1× |

The relay and wipers use audio timing to drive animation. Door-close audio starts with a 280 ms delay. Final playback gains are defined in `src/vehicle-sounds.ts`; mute silences all sound without stopping the mechanical state.
