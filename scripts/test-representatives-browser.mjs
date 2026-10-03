// Local UI integration test. Uses fixture responses; never connects to production.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, basename } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const root = resolve(new URL('..', import.meta.url).pathname);
const require = createRequire(join(root, 'package.json'));
const { build } = require('esbuild');
if (!process.env.PLAYWRIGHT_MODULE) throw new Error('Set PLAYWRIGHT_MODULE to an installed Playwright index.mjs.');
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE));
const output = await mkdtemp(join(tmpdir(), 'representatives-ui-'));
await build({
  stdin: { contents: `import React from 'react'; import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Admin from './src/pages/Admin'; import StateOperators from './src/pages/StateOperators';
import { Toaster } from './src/components/ui/toaster'; import { supabase } from './src/integrations/supabase/client';
supabase.auth.getSession = async () => ({ data: { session: { user: { id: '00000000-0000-0000-0000-000000000001', email: 'test@example.test' } } }, error: null });
createRoot(document.getElementById('root')).render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false}}})}><BrowserRouter><Routes><Route path='/admin' element={<Admin/>}/><Route path='/inscripcion' element={<StateOperators/>}/></Routes><Toaster/></BrowserRouter></QueryClientProvider>);`, resolveDir: root, loader: 'tsx' },
  bundle: true, outfile: join(output, 'app.js'), jsx: 'automatic', alias: { '@': join(root, 'src') },
  loader: { '.png': 'file', '.jpg': 'file', '.jpeg': 'file', '.webp': 'file', '.mp4': 'file' },
  define: { 'import.meta.env.VITE_SUPABASE_URL': '"https://fixture.test"', 'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': '"fixture-key"', 'import.meta.env.BASE_URL': '"/"', 'process.env.NODE_ENV': '"test"' },
});
const css = (await readdir(join(root, 'dist/assets'))).find(name => /^index-.*\.css$/.test(name));
await writeFile(join(output, 'style.css'), await readFile(join(root, 'dist/assets', css)));
await writeFile(join(output, 'index.html'), '<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/style.css"></head><body><div id="root"></div><script src="/app.js"></script></body></html>');
const server = createServer(async (request, response) => {
  try {
    const name = basename(new URL(request.url, 'http://localhost').pathname);
    const file = !name || ['admin','inscripcion'].includes(name) ? 'index.html' : name;
    response.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : file.endsWith('.png') ? 'image/png' : file.endsWith('.html') ? 'text/html' : 'application/octet-stream');
    response.end(await readFile(join(output, file)));
  } catch { response.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}), args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  let role = 'admin', failSave = false, failLoad = false, saves = 0, publicReads = 0;
  let rows = [{ id:'00000000-0000-0000-0000-000000000010', state_slug:'estado-de-mexico', zone:'Valle de México', name:'Contacto México', email:'mexico@example.test', phone:null, is_active:true, updated_at:'2026-10-04T12:00:00Z', representative_personal_details:{spouse_name:'Cónyuge privado', representative_birthday:'02-29', spouse_birthday:'12-31'} },
    { id:'00000000-0000-0000-0000-000000000011', state_slug:'estado-de-mexico', zone:'Valle de Toluca', name:'Contacto Toluca', email:'toluca@example.test', phone:'7223581093', is_active:true, updated_at:'2026-10-04T12:00:00Z', representative_personal_details:{spouse_name:null,representative_birthday:null,spouse_birthday:null} }];
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('https://raw.githubusercontent.com/**', route => route.fulfill({ json:{ type:'FeatureCollection', features:[] } }));
  await page.route('https://fixture.test/**', async route => {
    const request = route.request(), url = new URL(request.url());
    if (url.pathname.endsWith('/user_roles')) return route.fulfill({ json: { role } });
    if (url.pathname.endsWith('/has_role')) return route.fulfill({ json: role === 'admin' });
    if (url.pathname.endsWith('/state_representatives')) {
      if (failLoad) return route.fulfill({ status:500, json:{message:'Fixture load failure'} });
      const operations = url.searchParams.get('select').includes('representative_personal_details');
      if (!operations) publicReads++;
      const result = operations ? rows : rows.filter(row => row.is_active).map(({representative_personal_details, ...contact}) => contact);
      return route.fulfill({ json:result });
    }
    if (url.pathname.endsWith('/save_state_representative')) {
      saves++;
      if (failSave) return route.fulfill({ status:409, json:{code:'40001',message:'Fixture conflict'} });
      assert.equal(role, 'admin');
      const args = request.postDataJSON();
      const updated = { id:args.p_id || '00000000-0000-0000-0000-000000000012', state_slug:args.p_state_slug, zone:args.p_zone, name:args.p_name, email:args.p_email, phone:args.p_phone, is_active:args.p_is_active, updated_at:new Date().toISOString(), representative_personal_details:{spouse_name:args.p_spouse_name,representative_birthday:args.p_representative_birthday,spouse_birthday:args.p_spouse_birthday} };
      if (args.p_id) rows = rows.map(row => row.id === args.p_id ? updated : row); else rows.push(updated);
      return route.fulfill({ json:updated.id });
    }
    return route.fulfill({ json:[] });
  });
  const openOperations = async () => {
    await page.goto(`${base}/admin`);
    await page.getByRole('tab', {name:'Representantes',exact:true}).click();
    await page.getByRole('cell',{name:'Contacto México',exact:true}).waitFor();
  };
  await openOperations();
  await page.getByRole('cell',{name:'Cónyuge privado',exact:true}).waitFor();
  await page.getByRole('button',{name:'Agregar representante',exact:true}).click();
  await page.getByLabel('Estado *',{exact:true}).selectOption('jalisco');
  await page.getByLabel('Nombre del representante *',{exact:true}).fill('Alta de prueba');
  await page.getByLabel('Correo *',{exact:true}).fill('alta@example.test');
  await page.getByLabel('Nombre del cónyuge (opcional)',{exact:true}).fill('Cónyuge nuevo');
  await page.getByLabel('Cumpleaños del representante (opcional)',{exact:true}).fill('30/02');
  await page.getByRole('button',{name:'Guardar',exact:true}).click();
  await page.getByRole('alert').filter({hasText:'fecha válida'}).waitFor();
  assert.equal(saves,0,'invalid date must never reach RPC');
  await page.getByLabel('Cumpleaños del representante (opcional)',{exact:true}).fill('29/02');
  await page.getByLabel('Cumpleaños del cónyuge (opcional)',{exact:true}).fill('31/12');
  await page.getByRole('button',{name:'Guardar',exact:true}).click();
  await page.getByRole('cell',{name:'Alta de prueba',exact:true}).waitFor();
  assert.equal(rows[2].representative_personal_details.representative_birthday,'02-29');
  const testRow = () => page.getByRole('row').filter({has:page.getByRole('cell',{name:'Alta de prueba',exact:true})});
  await testRow().getByRole('button',{name:'Editar',exact:true}).click();
  await page.getByLabel('Nombre del cónyuge (opcional)',{exact:true}).fill('Cónyuge editado');
  failSave = true;
  await page.getByRole('button',{name:'Guardar',exact:true}).click();
  await page.getByRole('alert').filter({hasText:'registro cambió'}).waitFor();
  assert.equal(rows[2].representative_personal_details.spouse_name,'Cónyuge nuevo');
  failSave = false;
  await page.getByRole('button',{name:'Guardar',exact:true}).click();
  await page.getByRole('cell',{name:'Cónyuge editado',exact:true}).waitFor();
  await testRow().getByRole('button',{name:'Dar de baja',exact:true}).click();
  await page.getByRole('button',{name:'Confirmar',exact:true}).click();
  await testRow().getByRole('button',{name:'Reactivar',exact:true}).waitFor();
  await page.getByLabel('Situación',{exact:true}).selectOption('active');
  assert.equal(await page.getByRole('cell',{name:'Alta de prueba',exact:true}).count(),0);
  await page.getByLabel('Situación',{exact:true}).selectOption('inactive');
  await testRow().getByRole('button',{name:'Reactivar',exact:true}).click();
  await page.getByRole('button',{name:'Confirmar',exact:true}).click();
  await page.getByText('No hay representantes con estos filtros.',{exact:true}).waitFor();
  await page.getByLabel('Situación',{exact:true}).selectOption('all');
  await page.getByLabel('Buscar',{exact:true}).fill('contacto mexico');
  assert.equal(await page.getByRole('cell',{name:'Contacto Toluca',exact:true}).count(),0);
  await page.getByLabel('Buscar',{exact:true}).fill('');
  await page.getByLabel('Estado',{exact:true}).selectOption('jalisco');
  await page.getByRole('cell',{name:'Alta de prueba',exact:true}).waitFor();
  assert.equal(await page.getByRole('cell',{name:'Contacto México',exact:true}).count(),0);
  await page.screenshot({path:join(output,'admin-desktop.png'),fullPage:true});
  await page.setViewportSize({width:390,height:844});
  await testRow().getByRole('button',{name:'Editar',exact:true}).click();
  await page.getByLabel('Nombre del cónyuge (opcional)',{exact:true}).waitFor();
  await page.getByLabel('Cumpleaños del cónyuge (opcional)',{exact:true}).scrollIntoViewIfNeeded();
  await page.screenshot({path:join(output,'admin-form-mobile.png'),animations:'disabled'});
  await page.getByRole('button',{name:'Cancelar',exact:true}).click();
  role = 'moderator';
  await openOperations();
  assert.equal(await page.getByRole('button',{name:'Agregar representante',exact:true}).count(),0);
  assert.equal(await page.getByRole('button',{name:'Editar',exact:true}).count(),0);
  await page.getByRole('cell',{name:'Cónyuge privado',exact:true}).waitFor();
  failLoad = true;
  await page.getByRole('button',{name:'Actualizar lista',exact:true}).click();
  await page.getByRole('alert').filter({hasText:'No se pudo cargar el directorio'}).waitFor();
  failLoad = false;
  await page.getByRole('button',{name:'Actualizar lista',exact:true}).click();
  await page.getByRole('cell',{name:'Contacto México',exact:true}).waitFor();
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:join(output,'moderator-mobile.png'),fullPage:true});
  await page.goto(`${base}/inscripcion`);
  await page.getByLabel('Selecciona un estado',{exact:true}).selectOption('estado-de-mexico');
  await page.getByText('Contacto México',{exact:true}).waitFor();
  await page.getByText('Contacto Toluca',{exact:true}).waitFor();
  assert.equal(await page.getByText('Cónyuge privado',{exact:true}).count(),0);
  assert.equal(await page.getByText('29/02',{exact:true}).count(),0);
  assert.ok(publicReads > 0);
  await page.screenshot({path:join(output,'public-mobile.png'),fullPage:true});
  await page.getByLabel('Selecciona un estado',{exact:true}).selectOption('sonora');
  await page.getByText('No hay un operador activo publicado para este estado.',{exact:true}).waitFor();
  failLoad = true;
  await page.reload();
  await page.getByText('No se pudieron cargar los contactos.',{exact:true}).waitFor();
  failLoad = false;
  await page.getByRole('button',{name:'Reintentar',exact:true}).click();
  await page.getByLabel('Selecciona un estado',{exact:true}).selectOption('jalisco');
  await page.getByText('Alta de prueba',{exact:true}).waitFor();
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({result:'PASS',checks:['admin tab','create','edit','invalid birthday','save failure','logical deactivation','reactivation','search','filters','moderator read only','public zones','private data excluded','empty state','load failure and retry','mobile'],screenshots:output,saves},null,2));
} finally {
  if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve));
}
