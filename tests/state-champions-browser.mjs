/** Mocked browser acceptance: no requests reach Supabase or external services.
 * Start: ./node_modules/.bin/vite --config tests/vite.champions.config.mjs
 * Run against its local server (mock API https://champions.example.test):
 * PLAYWRIGHT_MODULE_PATH=/path/to/playwright-core/index.mjs node tests/state-champions-browser.mjs
 */
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { mkdir } from 'node:fs/promises';

const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE_PATH || '/root/copa-nido-aguila/node_modules/playwright-core/index.mjs').href);
const base = (process.env.ACCEPTANCE_BASE_URL || 'http://127.0.0.1:4174/').replace(/\/?$/, '/');
const origin = new URL(base).origin;
const browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {}) });
const user = { id: '11111111-1111-4111-8111-111111111111', aud: 'authenticated', role: 'authenticated', email: 'acceptance@example.test' };
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==', 'base64');
const results = [];
const evidenceDir = process.env.ACCEPTANCE_SCREENSHOT_DIR;
if (evidenceDir) await mkdir(evidenceDir, { recursive: true });
async function screenshot(page, filename, target) {
  if (evidenceDir) await (target || page).screenshot({ path: `${evidenceDir}/${filename}.png`, ...(target ? {} : { fullPage: true }) });
}
const photos = Object.fromEntries(['varonil', 'juvenil', 'femenil'].map(category => [category, {
  original_path: `champions/acceptance/${category}.png`, image_path: `champions/acceptance/${category}.webp`, framing: { zoom: 1, x: 50, y: 50 },
}]));
const entry = (state = 'Aguascalientes', draft = photos) => ({ id: '22222222-2222-4222-8222-222222222222', state, draft: structuredClone(draft), published: null, updated_at: '2026-10-13T12:00:00Z', published_at: null });
const publicState = state => ({ id: state, state, photos });

async function check(name, fn) {
  if (process.env.ACCEPTANCE_CASE_FILTER && !name.includes(process.env.ACCEPTANCE_CASE_FILTER)) return;
  try { await fn(); results.push({ name, result: 'PASS' }); console.log(`PASS ${name}`); }
  catch (error) { results.push({ name, result: 'FAIL', error: error.message }); console.error(`FAIL ${name}: ${error.stack}`); }
}

async function fixture({ role = null, published = [], draftRows = [], publicFailure = false, broken = false, conflict = false, storageFailure = false, expired = false, viewport = { width: 1440, height: 1000 } } = {}) {
  const context = await browser.newContext({ viewport, reducedMotion: 'no-preference' });
  const calls = [];
  await context.route('**/*', async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin === origin) return route.continue();
    const json = (body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
    if (url.hostname !== 'champions.example.test') return route.abort();
    if (url.pathname.includes('/auth/v1/user')) return json(user);
    if (url.pathname.includes('/auth/v1/token')) return expired ? json({ message: 'Invalid Refresh Token', error_code: 'refresh_token_not_found' }, 400) : json({ user, access_token: 'acceptance-access', refresh_token: 'acceptance-refresh', expires_in: 3600, token_type: 'bearer' });
    if (url.pathname.includes('/storage/v1/object/public/')) return broken ? route.fulfill({ status: 404, body: '' }) : route.fulfill({ contentType: 'image/png', body: png });
    if (url.pathname.startsWith('/storage/v1/object/')) {
      if (request.method() === 'GET') return route.fulfill({ contentType: 'image/png', body: png });
      calls.push({ name: 'storage', method: request.method(), path: url.pathname }); return storageFailure ? json({ message: 'Simulated upload failure', statusCode: '500' }, 500) : json({ Key: url.pathname });
    }
    const rpc = url.pathname.split('/rpc/')[1];
    if (rpc) {
      const args = request.postDataJSON(); calls.push({ name: rpc, args });
      if (rpc === 'get_published_state_champions') return publicFailure ? json({ message: 'Acceptance simulated failure', code: 'XX000' }, 500) : json(published);
      if (conflict) return json({ message: 'Champion state changed; reload before saving', code: '40001' }, 409);
      if (rpc === 'save_state_champion_draft') {
        const saved = { ...(draftRows.find(row => row.id === args.p_id) || entry(args.p_state)), draft: args.p_draft, updated_at: '2026-10-13T12:00:01Z' };
        draftRows.splice(0, draftRows.length, saved); return json(saved);
      }
      if (rpc === 'publish_state_champion' || rpc === 'withdraw_state_champion') {
        const saved = { ...draftRows[0], published: rpc === 'publish_state_champion' ? draftRows[0].draft : null, published_at: rpc === 'publish_state_champion' ? '2026-10-13T12:00:02Z' : null, updated_at: '2026-10-13T12:00:02Z' };
        draftRows.splice(0, draftRows.length, saved); return json(saved);
      }
      return json(null);
    }
    if (url.pathname.endsWith('/user_roles')) {
      const isSingle = request.headers().accept?.includes('object');
      const admitted = role && (!url.searchParams.has('role') || role !== 'user');
      return json(isSingle ? (admitted ? { role } : null) : (admitted ? [{ role }] : []));
    }
    if (url.pathname.endsWith('/state_champions')) { calls.push({ name: 'fetch_admin_champions' }); return json(draftRows); }
    if (url.pathname.startsWith('/rest/v1/')) return json([], 200);
    return json({});
  });
  if (role) await context.addInitScript(({ user, expired }) => {
    localStorage.setItem('sb-champions-auth-token', JSON.stringify({ access_token: 'acceptance-access', refresh_token: 'acceptance-refresh', expires_at: Math.floor(Date.now() / 1000) + (expired ? -3600 : 3600), expires_in: 3600, token_type: 'bearer', user }));
  }, { user, expired });
  const page = await context.newPage();
  return { context, page, calls };
}

await check('Photo preparation: complete wide team retained, optimized WebP 900 × 600', async () => {
  const { page, context } = await fixture();
  try {
    await page.goto(base);
    const output = await page.evaluate(async () => {
      const { optimizeChampionImage } = await import(`${location.pathname}src/lib/championImages.ts`);
      const source = document.createElement('canvas'); source.width = 1600; source.height = 400;
      const ctx = source.getContext('2d'); ctx.fillStyle = '#ff0000'; ctx.fillRect(0, 0, 800, 400); ctx.fillStyle = '#0000ff'; ctx.fillRect(800, 0, 800, 400);
      const blob = await new Promise(resolve => source.toBlob(resolve, 'image/png'));
      const optimized = await optimizeChampionImage(blob, { zoom: 1, x: 50, y: 50 });
      const image = await createImageBitmap(optimized);
      const result = document.createElement('canvas'); result.width = image.width; result.height = image.height;
      const resultCtx = result.getContext('2d'); resultCtx.drawImage(image, 0, 0);
      return { type: optimized.type, width: image.width, height: image.height, left: [...resultCtx.getImageData(5, 300, 1, 1).data], right: [...resultCtx.getImageData(895, 300, 1, 1).data], size: optimized.size };
    });
    assert.equal(output.type, 'image/webp'); assert.equal(output.width, 900); assert.equal(output.height, 600);
    assert(output.left[0] > 200 && output.left[2] < 50 && output.right[2] > 200 && output.right[0] < 50);
    assert(output.size > 0 && output.size < 10 * 1024 * 1024);
  } finally { await context.close(); }
});

for (const publicFailure of [false, true]) await check(`Home fallback: ${publicFailure ? 'RPC failure' : 'no published states'}`, async () => {
  const { page, context, calls } = await fixture({ publicFailure });
  try {
    await page.goto(base);
    await page.getByTestId('promo-spot').waitFor();
    await page.waitForTimeout(500);
    assert.equal(await page.getByTestId('state-champions-banner').count(), 0);
    assert.equal(await page.getByTestId('spot-champions-layout').evaluate(el => getComputedStyle(el).display), 'block');
    assert(calls.some(call => call.name === 'get_published_state_champions'));
  } finally { await context.close(); }
});

await check('Phone JPEG: EXIF orientation corrected before banner preparation', async () => {
  const { page, context } = await fixture();
  try {
    await page.goto(base);
    const colors = await page.evaluate(async () => {
      const { optimizeChampionImage } = await import(`${location.pathname}src/lib/championImages.ts`);
      const canvas = document.createElement('canvas'); canvas.width = 200; canvas.height = 100;
      const ctx = canvas.getContext('2d'); ctx.fillStyle = '#ff0000'; ctx.fillRect(0, 0, 100, 100); ctx.fillStyle = '#0000ff'; ctx.fillRect(100, 0, 100, 100);
      const jpeg = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.95));
      const bytes = new Uint8Array(await jpeg.arrayBuffer());
      // APP1 Exif TIFF with one IFD entry: orientation SHORT = 6 (90° clockwise).
      const exif = new Uint8Array([0xff,0xe1,0,34,69,120,105,102,0,0,73,73,42,0,8,0,0,0,1,0,18,1,3,0,1,0,0,0,6,0,0,0,0,0,0,0]);
      const phoneJpeg = new Blob([bytes.slice(0,2), exif, bytes.slice(2)], { type: 'image/jpeg' });
      const optimized = await optimizeChampionImage(phoneJpeg, { zoom: 1, x: 50, y: 50 });
      const image = await createImageBitmap(optimized); canvas.width = image.width; canvas.height = image.height; ctx.drawImage(image,0,0);
      return { top: [...ctx.getImageData(450, 10, 1, 1).data], bottom: [...ctx.getImageData(450, 590, 1, 1).data] };
    });
    assert(colors.top[0] > 200 && colors.top[2] < 50 && colors.bottom[2] > 200 && colors.bottom[0] < 50);
  } finally { await context.close(); }
});

await check('One state: three labels and uniform images, no rotation controls', async () => {
  const { page, context } = await fixture({ published: [publicState('Aguascalientes')] });
  try {
    await page.goto(base);
    await page.getByTestId('champions-state').waitFor();
    assert.equal(await page.getByTestId('champions-state').textContent(), 'Aguascalientes');
    const banner = page.getByTestId('state-champions-banner');
    assert.equal(await banner.locator('img').count(), 3);
    for (const category of ['Varonil', 'Juvenil', 'Femenil']) assert.equal(await banner.getByText(category, { exact: true }).count(), 1);
    assert.equal(await banner.getByRole('button').count(), 0);
    const sizes = await banner.locator('img').evaluateAll(images => images.map(el => ({ width: el.getAttribute('width'), height: el.getAttribute('height'), fit: getComputedStyle(el).objectFit })));
    assert(sizes.every(size => size.width === '900' && size.height === '600' && size.fit === 'contain'));
    await screenshot(page, 'public-desktop', page.getByTestId('spot-champions-layout'));
  } finally { await context.close(); }
});

await check('Desktop: half-width spot/banner; alphabetical navigation, six-second timer and pause', async () => {
  const { page, context } = await fixture({ published: [publicState('Zacatecas'), publicState('Aguascalientes')] });
  try {
    await page.goto(base); await page.getByTestId('champions-state').waitFor();
    const state = page.getByTestId('champions-state');
    assert.equal(await state.textContent(), 'Aguascalientes');
    const spot = await page.getByTestId('promo-spot').boundingBox();
    const banner = await page.getByTestId('state-champions-banner').boundingBox();
    assert(Math.abs(spot.width - banner.width) < 2 && banner.x > spot.x + spot.width && Math.abs(spot.y - banner.y) < 2);
    await page.waitForTimeout(6300);
    assert.equal(await state.textContent(), 'Zacatecas');
    await page.getByRole('button', { name: 'Pausar rotación', exact: true }).click();
    await page.mouse.move(0, 0); await page.getByTestId('promo-spot').click();
    await page.waitForTimeout(6300);
    assert.equal(await state.textContent(), 'Zacatecas');
    await page.getByRole('button', { name: 'Estado siguiente', exact: true }).click();
    assert.equal(await state.textContent(), 'Aguascalientes');
    await page.getByRole('button', { name: 'Estado anterior', exact: true }).click();
    assert.equal(await state.textContent(), 'Zacatecas');
    await page.keyboard.press('ArrowRight');
    assert.equal(await state.textContent(), 'Aguascalientes');
    await page.keyboard.press('ArrowLeft');
    assert.equal(await state.textContent(), 'Zacatecas');
    await page.getByRole('button', { name: 'Reanudar rotación', exact: true }).click();
    assert.equal(await page.getByRole('button', { name: 'Pausar rotación', exact: true }).count(), 1);
    await page.getByTestId('promo-spot').getByRole('button', { name: 'Activar sonido', exact: true }).focus();
    await page.mouse.move(0, 0);
    await page.waitForTimeout(6300);
    await page.waitForFunction(() => document.querySelector('[data-testid="champions-state"]')?.textContent === 'Aguascalientes', undefined, { timeout: 2000 });
    assert.equal(await state.textContent(), 'Aguascalientes');
  } finally { await context.close(); }
});

await check('Mobile: spot above banner, three categories visible, no horizontal overflow', async () => {
  const { page, context } = await fixture({ published: [publicState('Aguascalientes')], viewport: { width: 390, height: 844 } });
  try {
    await page.goto(base); await page.getByTestId('champions-state').waitFor();
    const spot = await page.getByTestId('promo-spot').boundingBox();
    const banner = await page.getByTestId('state-champions-banner').boundingBox();
    assert(banner.y >= spot.y + spot.height);
    assert(banner.x >= 0 && banner.x + banner.width <= 390);
    const images = await page.getByTestId('state-champions-banner').locator('img').evaluateAll(els => els.map(el => el.getBoundingClientRect().width));
    assert.equal(images.length, 3); assert(images.every(width => width > 200));
    await screenshot(page, 'public-mobile', page.getByTestId('spot-champions-layout'));
  } finally { await context.close(); }
});

await check('Focus retains rotation stop after mouse leaves; blur resumes automatic rotation', async () => {
  const { page, context } = await fixture({ published: [publicState('Aguascalientes'), publicState('Zacatecas')] });
  try {
    await page.goto(base); await page.getByTestId('champions-state').waitFor();
    await page.getByRole('button', { name: 'Estado siguiente', exact: true }).focus();
    await page.mouse.move(0, 0); await page.waitForTimeout(6300);
    assert.equal(await page.getByTestId('champions-state').textContent(), 'Aguascalientes');
    await page.getByTestId('promo-spot').getByRole('button', { name: 'Activar sonido', exact: true }).focus();
    await page.waitForTimeout(6300);
    assert.equal(await page.getByTestId('champions-state').textContent(), 'Zacatecas');
  } finally { await context.close(); }
});

await check('Pointer swipe changes the whole state and pauses rotation', async () => {
  const { page, context } = await fixture({ published: [publicState('Aguascalientes'), publicState('Zacatecas')] });
  try {
    await page.goto(base); await page.getByTestId('champions-state').waitFor();
    const banner = page.getByTestId('state-champions-banner');
    await banner.scrollIntoViewIfNeeded();
    const box = await banner.locator('[aria-hidden="false"]').boundingBox();
    await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.5);
    await page.mouse.down(); await page.mouse.move(box.x + box.width * 0.15, box.y + box.height * 0.5, { steps: 12 }); await page.mouse.up();
    await page.waitForTimeout(700);
    assert.equal(await page.getByTestId('champions-state').textContent(), 'Zacatecas');
    assert.equal(await banner.getByRole('button', { name: 'Reanudar rotación', exact: true }).count(), 1);
    const alts = await banner.locator('[aria-hidden="false"] img').evaluateAll(images => images.map(image => image.alt));
    assert.equal(alts.length, 3); assert(alts.every(alt => alt.includes('Zacatecas')));
  } finally { await context.close(); }
});

await check('Reduced motion disables auto rotation; manual navigation remains available', async () => {
  const { page, context } = await fixture({ published: [publicState('Aguascalientes'), publicState('Zacatecas')] });
  try {
    await page.emulateMedia({ reducedMotion: 'reduce' }); await page.goto(base); await page.getByTestId('champions-state').waitFor();
    assert(await page.getByRole('button', { name: 'Reanudar rotación' }).isDisabled());
    await page.waitForTimeout(6300);
    assert.equal(await page.getByTestId('champions-state').textContent(), 'Aguascalientes');
    await page.getByRole('button', { name: 'Estado siguiente' }).click();
    assert.equal(await page.getByTestId('champions-state').textContent(), 'Zacatecas');
  } finally { await context.close(); }
});

await check('Broken image: identifies unavailable category without substitute photos', async () => {
  const { page, context } = await fixture({ published: [publicState('Aguascalientes')], broken: true });
  try {
    await page.goto(base); await page.getByTestId('state-champions-banner').scrollIntoViewIfNeeded(); await page.getByText('Fotografía de Varonil no disponible').waitFor();
    const banner = page.getByTestId('state-champions-banner');
    assert.equal(await banner.locator('img').count(), 0);
    for (const category of ['Varonil', 'Juvenil', 'Femenil']) assert.equal(await banner.getByText(`Fotografía de ${category} no disponible`).count(), 1);
  } finally { await context.close(); }
});

for (const role of [null, 'user', 'moderator']) await check(`Admin tab restricted: ${role || 'unauthenticated'}`, async () => {
  const { page, context, calls } = await fixture({ role });
  try {
    await page.goto(`${base}admin`);
    if (role === 'moderator') await page.getByRole('heading', { name: 'Panel de Administración' }).waitFor();
    else await page.waitForURL(url => url.pathname === new URL(role ? base : `${base}auth`).pathname);
    assert.equal(await page.getByRole('tab', { name: 'Campeones estatales' }).count(), 0);
    assert(!calls.some(call => ['save_state_champion_draft', 'publish_state_champion', 'withdraw_state_champion'].includes(call.name)));
  } finally { await context.close(); }
});

async function openChampions(page) {
  await page.goto(`${base}admin`);
  await page.getByRole('tab', { name: 'Campeones estatales' }).click();
  await page.getByTestId('admin-state-champions').waitFor();
}

async function photoFile(page, name = 'champion.png') {
  const data = await page.evaluate(() => {
    const canvas = document.createElement('canvas'); canvas.width = 1200; canvas.height = 800;
    const ctx = canvas.getContext('2d'); ctx.fillStyle = '#123456'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(50, 50, 300, 100);
    return canvas.toDataURL('image/png').split(',')[1];
  });
  return { name, mimeType: 'image/png', buffer: Buffer.from(data, 'base64') };
}

await check('Admin: validate file type/10MB/corruption; partial draft save cannot publish', async () => {
  const { page, context, calls } = await fixture({ role: 'admin' });
  try {
    await openChampions(page); await page.getByRole('button', { name: 'Agregar estado', exact: true }).click();
    await page.getByLabel('Estado', { exact: true }).selectOption('Aguascalientes');
    const input = page.getByLabel('Fotografía Varonil', { exact: true });
    await input.setInputFiles({ name: 'invalid.gif', mimeType: 'image/gif', buffer: Buffer.from('gif') });
    await page.getByRole('alert').filter({ hasText: 'Solo se permiten' }).waitFor();
    await input.setInputFiles({ name: 'large.png', mimeType: 'image/png', buffer: Buffer.alloc(10 * 1024 * 1024 + 1) });
    await page.getByRole('alert').filter({ hasText: '10 MB' }).waitFor();
    await input.setInputFiles({ name: 'corrupt.png', mimeType: 'image/png', buffer: Buffer.from('not an image') });
    await page.getByRole('alert').filter({ hasText: 'No se pudo leer' }).waitFor();
    assert(!calls.some(call => call.name === 'storage'));
    await input.setInputFiles(await photoFile(page));
    await page.getByAltText('Vista previa Varonil').waitFor();
    await page.locator('#champion-zoom-varonil').fill('1.5');
    await page.locator('#champion-x-varonil').fill('40');
    assert(await page.getByRole('button', { name: 'Publicar estado', exact: true }).isDisabled());
    await page.getByRole('button', { name: 'Guardar borrador', exact: true }).click();
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    const save = calls.find(call => call.name === 'save_state_champion_draft');
    assert.equal(save.args.p_state, 'Aguascalientes');
    assert.deepEqual(Object.keys(save.args.p_draft), ['varonil']);
    assert.deepEqual(save.args.p_draft.varonil.framing, { zoom: 1.5, x: 40, y: 50 });
    assert(save.args.p_draft.varonil.original_path.endsWith('/original.png'));
    assert(save.args.p_draft.varonil.image_path.endsWith('/banner.webp'));
    assert.equal(calls.filter(call => call.name === 'storage' && call.method === 'POST').length, 2);
    assert(!calls.some(call => call.name === 'publish_state_champion'));
    assert(await page.getByRole('button', { name: 'Publicar Aguascalientes', exact: true }).isDisabled());
  } finally { await context.close(); }
});

await check('Admin: complete three-photo upload, publish version, withdraw', async () => {
  const { page, context, calls } = await fixture({ role: 'admin' });
  try {
    await openChampions(page); await page.getByRole('button', { name: 'Agregar estado', exact: true }).click();
    await page.getByLabel('Estado', { exact: true }).selectOption('Aguascalientes');
    const file = await photoFile(page);
    for (const label of ['Varonil', 'Juvenil', 'Femenil']) {
      await page.getByLabel(`Fotografía ${label}`, { exact: true }).setInputFiles(file);
      await page.getByAltText(`Vista previa ${label}`).waitFor();
    }
    await screenshot(page, 'admin-complete-preview', page.getByRole('dialog'));
    await page.getByRole('button', { name: 'Publicar estado', exact: true }).click();
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    const save = calls.find(call => call.name === 'save_state_champion_draft');
    assert.equal(Object.keys(save.args.p_draft).length, 3);
    const publish = calls.find(call => call.name === 'publish_state_champion');
    assert.equal(publish.args.p_expected_updated_at, '2026-10-13T12:00:01Z');
    await page.getByRole('button', { name: 'Retirar Aguascalientes', exact: true }).click();
    await page.getByRole('button', { name: 'Retirar Aguascalientes', exact: true }).waitFor({ state: 'hidden' });
    assert.equal(calls.find(call => call.name === 'withdraw_state_champion').args.p_expected_updated_at, '2026-10-13T12:00:02Z');
  } finally { await context.close(); }
});

await check('Admin: published replacement stays draft until explicit publish; state cannot change', async () => {
  const row = { ...entry(), published: structuredClone(photos), published_at: '2026-10-13T11:00:00Z' };
  const { page, context, calls } = await fixture({ role: 'admin', draftRows: [row] });
  try {
    await openChampions(page); await page.getByRole('button', { name: 'Editar Aguascalientes', exact: true }).click();
    assert(await page.getByLabel('Estado', { exact: true }).isDisabled());
    await page.getByLabel('Fotografía Varonil', { exact: true }).setInputFiles(await photoFile(page, 'replacement.png'));
    await page.getByAltText('Vista previa Varonil').waitFor();
    await page.getByRole('button', { name: 'Guardar borrador', exact: true }).click();
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    const save = calls.find(call => call.name === 'save_state_champion_draft');
    assert.equal(save.args.p_id, row.id); assert.equal(save.args.p_expected_updated_at, row.updated_at);
    assert.notEqual(save.args.p_draft.varonil.image_path, row.published.varonil.image_path);
    assert.deepEqual(row.published, photos);
    assert(!calls.some(call => call.name === 'publish_state_champion'));
    assert.equal(await page.getByRole('button', { name: 'Retirar Aguascalientes', exact: true }).count(), 1);
  } finally { await context.close(); }
});

await check('Admin: concurrent version conflict visible, dialog retained and no publication', async () => {
  const { page, context, calls } = await fixture({ role: 'admin', draftRows: [entry()], conflict: true });
  try {
    await openChampions(page); await page.getByRole('button', { name: 'Editar Aguascalientes', exact: true }).click();
    await page.getByRole('button', { name: 'Guardar borrador', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: 'Si otra persona cambió' }).waitFor();
    assert(await page.getByRole('dialog').isVisible());
    assert.equal(calls.find(call => call.name === 'save_state_champion_draft').args.p_expected_updated_at, '2026-10-13T12:00:00Z');
    assert(!calls.some(call => call.name === 'publish_state_champion'));
    await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    const reload = page.getByRole('button', { name: 'Recargar estados', exact: true });
    assert(await reload.isVisible() && await reload.isEnabled());
    const before = calls.filter(call => call.name === 'fetch_admin_champions').length;
    await reload.click();
    await page.getByRole('button', { name: 'Editar Aguascalientes', exact: true }).waitFor();
    assert.equal(calls.filter(call => call.name === 'fetch_admin_champions').length, before + 1);
  } finally { await context.close(); }
});

await check('Admin: failed upload blocks metadata save and preserves dialog', async () => {
  const { page, context, calls } = await fixture({ role: 'admin', storageFailure: true });
  try {
    await openChampions(page); await page.getByRole('button', { name: 'Agregar estado', exact: true }).click();
    await page.getByLabel('Estado', { exact: true }).selectOption('Aguascalientes');
    await page.getByLabel('Fotografía Varonil', { exact: true }).setInputFiles(await photoFile(page));
    await page.getByAltText('Vista previa Varonil').waitFor();
    await page.getByRole('button', { name: 'Guardar borrador', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: 'No se pudo subir' }).waitFor();
    assert(await page.getByRole('dialog').isVisible());
    assert(!calls.some(call => call.name === 'save_state_champion_draft'));
  } finally { await context.close(); }
});

await check('Expired session cannot access admin champions', async () => {
  const { page, context, calls } = await fixture({ role: 'admin', expired: true });
  try {
    await page.goto(`${base}admin`); await page.waitForURL(`${base}auth`);
    assert.equal(await page.getByTestId('admin-state-champions').count(), 0);
    assert(!calls.some(call => call.name === 'save_state_champion_draft'));
  } finally { await context.close(); }
});

await browser.close();
if (results.some(result => result.result === 'FAIL')) process.exitCode = 1;
