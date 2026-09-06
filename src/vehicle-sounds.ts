import type { VehicleSwitches } from './vehicle-rig';

export const HAZARD_CYCLE = .73;
export const WIPER_CYCLE = 1.4;
export type LoopSound = 'hazards' | 'wipers';
type SoundName = 'headlights-on' | 'headlights-off' | 'door-open' | 'door-close' | LoopSound;

export function createVehicleSounds(onError: () => void) {
  const volumes: Record<SoundName, number> = { 'headlights-on': .6, 'headlights-off': .6, 'door-open': .65, 'door-close': .38, hazards: .55, wipers: .3 };
  const sounds = new Map<SoundName, HTMLAudioElement>();
  let doorTimer: ReturnType<typeof setTimeout> | undefined;
  let disposed = false;
  for (const [name, volume] of Object.entries(volumes)) {
    const audio = new Audio(`/audio/sfx/${name}.wav`);
    audio.preload = 'auto'; audio.volume = volume; audio.dataset.sfx = name;
    audio.loop = name === 'hazards' || name === 'wipers';
    audio.hidden = true; document.body.appendChild(audio);
    sounds.set(name as SoundName, audio);
  }
  function stop(name: SoundName) { const audio = sounds.get(name)!; audio.pause(); audio.currentTime = 0; }
  function play(name: SoundName) {
    if (disposed) return;
    const audio = sounds.get(name)!;
    audio.currentTime = 0;
    void audio.play().catch(error => { if (!disposed && error.name !== 'AbortError') onError(); });
  }
  function loop(name: LoopSound, enabled: boolean) {
    const audio = sounds.get(name)!;
    if (!enabled) stop(name);
    else if (audio.paused) play(name);
  }
  return {
    command(key: keyof VehicleSwitches, enabled: boolean) {
      if (key === 'headlights') { stop('headlights-on'); stop('headlights-off'); play(enabled ? 'headlights-on' : 'headlights-off'); }
      else if (key === 'doorOpen') {
        clearTimeout(doorTimer); stop('door-open'); stop('door-close');
        if (enabled) play('door-open');
        else doorTimer = setTimeout(() => play('door-close'), 280);
      } else loop(key, enabled);
    },
    loop,
    clock(name: LoopSound) { const audio = sounds.get(name)!; return audio.paused ? null : audio.currentTime; },
    mute(muted: boolean) { for (const audio of sounds.values()) audio.muted = muted; },
    dispose() {
      disposed = true; clearTimeout(doorTimer);
      for (const audio of sounds.values()) { audio.pause(); audio.removeAttribute('src'); audio.load(); audio.remove(); }
    },
  };
}
