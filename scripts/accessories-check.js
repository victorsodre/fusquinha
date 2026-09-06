// Run through the Playwright CLI with __OUTPUT__ replaced by an absolute path.
async page => {
  const output = '__OUTPUT__';
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  const settle = () => page.waitForFunction(() => document.querySelector('canvas').dataset.settled === 'true');
  const click = name => page.getByRole('button', { name, exact: true }).click();
  const sound = name => page.locator(`audio[data-sfx="${name}"]`);
  await page.setViewportSize({ width: 1440, height: 900 }); await page.reload();
  await page.locator('canvas[data-ready="true"][data-lighting="studio"]').waitFor(); await settle();
  assert(await page.locator('audio[data-sfx]').count() === 6, 'All six edited cues must be available');
  assert(await page.locator('audio').evaluateAll(nodes => nodes.every(audio => audio.paused)), 'No sound may autoplay');
  await click('Ligar faróis');
  await page.waitForFunction(() => document.querySelector('canvas').dataset.headlights === 'true' && document.querySelector('[data-sfx="headlights-on"]').currentTime > 0);
  await page.screenshot({ path: `${output}/headlights-on.png` });
  await click('Desligar faróis');
  await page.waitForFunction(() => document.querySelector('canvas').dataset.headlights === 'false' && document.querySelector('[data-sfx="headlights-off"]').currentTime > 0);

  await click('Abrir porta do motorista');
  await page.waitForFunction(() => document.querySelector('canvas').dataset.doorAngle === '1.1200'); await settle();
  assert(await sound('door-open').evaluate(audio => audio.currentTime > .5), 'Opening cue must have played');
  await page.screenshot({ path: `${output}/door-open.png` });
  await click('Fechar porta do motorista');
  await page.waitForFunction(() => document.querySelector('[data-sfx="door-close"]').currentTime > .1);
  await page.waitForFunction(() => document.querySelector('canvas').dataset.doorAngle === '0.0000'); await settle();

  await click('Ligar limpadores');
  await page.waitForFunction(() => Number(document.querySelector('canvas').dataset.wiperAngle) < -1 && !document.querySelector('[data-sfx="wipers"]').paused);
  await page.screenshot({ path: `${output}/wipers-moving.png` });
  const wiper = await page.locator('canvas').getAttribute('data-wiper-angle');
  await page.waitForFunction(previous => document.querySelector('canvas').dataset.wiperAngle !== previous, wiper);
  await click('Ligar pisca-alerta');
  await page.waitForFunction(() => document.querySelector('canvas').dataset.hazardPulse === 'true');
  await page.screenshot({ path: `${output}/hazards-on.png` });
  await page.waitForFunction(() => document.querySelector('canvas').dataset.hazardPulse === 'false');
  assert(await sound('hazards').evaluate(audio => !audio.paused && audio.loop && audio.duration === .73), 'Hazard sound must use the edited cycle');
  assert(await sound('wipers').evaluate(audio => !audio.paused && audio.loop && audio.duration === 1.4), 'Wipers must use the edited sweep cycle');
  await click('Silenciar sons');
  assert(await page.locator('audio').evaluateAll(nodes => nodes.every(audio => audio.muted)), 'Mute must apply to engine and every accessory');
  assert(await sound('wipers').evaluate(audio => !audio.paused), 'Muting must preserve the animation clock');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForFunction(() => document.querySelector('canvas').dataset.wiperAngle === '-0.5800' && document.querySelector('canvas').dataset.hazardPulse === 'true');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await click('Ativar sons');
  await click('Desligar limpadores'); await click('Desligar pisca-alerta');
  await page.waitForFunction(() => document.querySelector('canvas').dataset.wiperAngle === '0.0000' && document.querySelector('canvas').dataset.hazardPulse === 'false');
  assert(await sound('wipers').evaluate(audio => audio.paused), 'Wiper sound must stop');
  assert(await sound('hazards').evaluate(audio => audio.paused), 'Relay sound must stop');

  await click('Abrir porta do motorista'); await settle();
  await click('Separar todas as peças');
  await page.waitForFunction(() => document.querySelector('canvas').dataset.explosion === '1.000'); await settle();
  assert(await page.locator('canvas').getAttribute('data-door-angle') === '0.0000', 'Disassembly must restore articulation to its base pose');
  assert(await page.locator('canvas').getAttribute('data-visible-pieces') === '515', 'Articulation must not lose pieces');
  await click('Montar Fusca'); await settle();
  const frame = Number(await page.locator('canvas').getAttribute('data-frames'));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForFunction(previous => Number(document.querySelector('canvas').dataset.frames) > previous, frame); await settle();
  for (const name of ['Ligar faróis', 'Abrir porta do motorista', 'Ligar pisca-alerta', 'Ligar limpadores']) assert(await page.getByRole('button', { name, exact: true }).isVisible(), `${name} must be accessible on mobile`);
  await page.screenshot({ path: `${output}/mobile-accessories.png` });
  assert(errors.length === 0, errors.join('; '));
  return { result: 'PASS', checks: ['headlights and switch cues', 'door opening and closing cues', 'wiper animation and loop', 'hazard flashes and relay loop', 'global mute', 'reduced motion', 'reassembly after articulation', 'mobile controls'], errors };
}
