// Run with the Playwright CLI `run-code` command. Replace __OUTPUT__ with an absolute artifact directory.
async page => {
  const output = '__OUTPUT__';
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  const settle = () => page.waitForFunction(() => document.querySelector('canvas')?.dataset.settled === 'true', undefined, { timeout: 15000 });
  const resize = async size => {
    const before = Number(await page.locator('canvas').getAttribute('data-frames'));
    await page.setViewportSize(size);
    await page.waitForFunction(previous => Number(document.querySelector('canvas').dataset.frames) > previous, before);
    await settle();
  };
  const visible = count => page.waitForFunction(n => document.querySelector('canvas')?.dataset.visiblePieces === String(n), count);
  const capture = name => page.screenshot({ path: `${output}/${name}.png` });
  const assert = (value, message) => { if (!value) throw new Error(message); };
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.reload();
  await page.locator('canvas[data-ready="true"][data-lighting="studio"]').waitFor({ timeout: 30000 });
  await page.waitForFunction(() => Number(document.querySelector('canvas').dataset.contactShadows) > 0);
  await settle();
  await capture('desktop-assembled');
  const total = Number(await page.locator('canvas').getAttribute('data-pieces'));
  assert(total === 515, 'All 515 pieces must load');
  assert((await page.locator('.coordinates').innerText()).includes('VITÓRIA, ES'), 'Project location must be Vitória, ES');
  assert(await page.locator('.group-row').last().evaluate(el => el.getBoundingClientRect().bottom <= el.parentElement.getBoundingClientRect().bottom), 'All nine groups must fit in the desktop catalog');
  const contactShadows = await page.locator('canvas').getAttribute('data-contact-shadows');

  assert(await page.locator('audio:not([data-sfx])').evaluate(audio => audio.paused), 'Engine sound must never autoplay');
  await page.getByRole('button', { name: 'Ligar motor', exact: true }).click();
  await page.waitForFunction(() => !document.querySelector('audio:not([data-sfx])').paused && document.querySelector('audio:not([data-sfx])').currentTime > .2 && document.querySelector('canvas').dataset.engineVibrating === 'true');
  const motion = await page.locator('canvas').getAttribute('data-engine-motion');
  await page.waitForFunction(previous => document.querySelector('canvas').dataset.engineMotion !== previous, motion);
  await page.getByRole('button', { name: 'Silenciar sons', exact: true }).click();
  assert(await page.locator('audio:not([data-sfx])').evaluate(audio => audio.muted && !audio.paused), 'Muting must preserve the running engine');
  await page.getByRole('button', { name: 'Ativar sons', exact: true }).click();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForFunction(() => document.querySelector('canvas').dataset.engineVibrating === 'false');
  assert(await page.locator('audio:not([data-sfx])').evaluate(audio => !audio.paused), 'Reduced motion must preserve sound');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.waitForFunction(() => document.querySelector('canvas').dataset.engineVibrating === 'true');
  await capture('desktop-engine-running');
  await page.locator('audio:not([data-sfx])').evaluate(audio => { audio.currentTime = audio.duration - .15; });
  await page.waitForFunction(() => document.querySelector('audio:not([data-sfx])').currentTime < 2 && !document.querySelector('audio:not([data-sfx])').paused);
  assert(await page.locator('canvas').getAttribute('data-contact-shadows') === contactShadows, 'Engine vibration must reuse the cached contact shadow');
  await page.getByRole('button', { name: 'Desligar motor', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('audio:not([data-sfx])').paused && document.querySelector('canvas').dataset.engineVibrating === 'false');
  assert(await page.locator('canvas').getAttribute('data-engine-motion') === '0,0,0', 'Engine must return to its exact resting position');

  await page.getByRole('button', { name: /Motor boxer 97/ }).click();
  await page.getByRole('button', { name: 'Isolar conjunto', exact: true }).click();
  await visible(97); await settle(); await capture('desktop-engine');
  await page.getByRole('combobox', { name: 'Selecionar peça individual' }).selectOption({ index: 1 });
  await visible(1); await settle();
  const beforeZoom = Number(await page.locator('canvas').getAttribute('data-camera-distance'));
  await page.getByRole('button', { name: 'Aproximar', exact: true }).click();
  await page.waitForFunction(distance => Number(document.querySelector('canvas').dataset.cameraDistance) < distance, beforeZoom);
  await capture('desktop-isolated-piece');
  await page.getByRole('button', { name: 'Fechar detalhes', exact: true }).click();
  await visible(total); await settle();

  await page.getByRole('button', { name: 'Separar todas as peças', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('canvas').dataset.explosion === '1.000');
  await settle(); await visible(total); await capture('desktop-all-pieces');

  const range = page.getByRole('slider', { name: 'Desmontagem', exact: true });
  await range.focus(); await range.press('Home');
  for (let i = 0; i < 4; i++) await range.press('PageUp');
  for (let i = 0; i < 5; i++) await range.press('ArrowRight');
  assert(await range.inputValue() === '45', 'Keyboard slider must reach 45%');
  await settle(); await capture('desktop-exploded-groups');
  await page.getByRole('checkbox', { name: 'Mostrar nomes dos conjuntos' }).check();
  await page.waitForFunction(() => [...document.querySelectorAll('.scene-label')].some(el => !el.hidden));
  await capture('desktop-labels');
  await page.getByRole('checkbox', { name: 'Mostrar nomes dos conjuntos' }).uncheck();
  await page.getByRole('button', { name: 'Montar Fusca', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('canvas').dataset.explosion === '0.000');
  await settle();

  await page.getByRole('textbox', { name: 'Buscar uma peça' }).fill('Calota');
  const results = page.locator('.search-result');
  assert(await results.count() === 4, 'Search must find four added hubcaps');
  await results.first().click();
  await page.getByRole('button', { name: 'Isolar esta peça', exact: true }).click();
  await visible(1); await settle();
  await page.getByRole('button', { name: 'Fechar detalhes', exact: true }).click();
  await page.getByRole('textbox', { name: 'Buscar uma peça' }).fill('');
  await settle();

  await page.getByRole('button', { name: 'Projeto de Victor — abrir créditos', exact: true }).click();
  assert(await page.locator('dialog').evaluate(d => d.open), 'Credits dialog must open');
  assert((await page.locator('.credits > div').first().innerText()).includes('Victor'), 'Victor must receive the first credit');
  assert(await page.locator('.brand h1').innerText() === 'fusquinha.', 'Project must be named fusquinha');
  assert((await page.locator('dialog').innerText()).includes('Rodrigo Marini'), 'Author credit must be present');
  await capture('credits');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Sobre o projeto', exact: true }).click();
  assert(await page.locator('dialog').evaluate(d => d.open), 'Header must also open credits');
  await page.keyboard.press('Escape');

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByRole('button', { name: 'Girar automaticamente', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('canvas').dataset.autoRotate === 'false');
  await page.getByRole('button', { name: 'Girar automaticamente', exact: true }).click();
  await page.emulateMedia({ reducedMotion: 'no-preference' });

  await resize({ width: 390, height: 844 });
  await settle(); await capture('mobile-assembled');
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No mobile horizontal overflow');
  await page.getByRole('button', { name: 'Abrir catálogo', exact: true }).click();
  await page.getByRole('button', { name: /Motor boxer 97/ }).click();
  await page.getByRole('button', { name: 'Isolar conjunto', exact: true }).click();
  await visible(97); await settle(); await capture('mobile-engine');
  assert(await page.evaluate(() => document.querySelector('canvas').getBoundingClientRect().bottom <= document.querySelector('.detail-panel').getBoundingClientRect().top), 'Mobile detail panel must not cover the model viewport');
  await page.getByRole('button', { name: 'Fechar detalhes', exact: true }).click();
  await page.getByRole('button', { name: 'Separar todas as peças', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('canvas').dataset.explosion === '1.000');
  await settle(); await capture('mobile-all-pieces');
  await page.getByRole('button', { name: 'Montar Fusca', exact: true }).click();
  await settle();

  await resize({ width: 844, height: 390 });
  await settle(); await capture('mobile-landscape');
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No landscape horizontal overflow');
  assert(errors.length === 0, `Browser errors: ${errors.join('; ')}`);
  return { result: 'PASS', pieces: total, checks: ['load', 'HDRI lighting', 'cached contact shadows', 'complete desktop catalog', 'ignition and sound', 'bounded vibration', 'mute', 'audio loop', 'engine stop', 'group isolation', 'piece isolation', 'zoom', 'full disassembly', 'keyboard slider', 'labels', 'reassembly', 'search', 'credits and attribution order', 'reduced motion', 'mobile unobscured model', 'landscape'], errors };
}
