// Run after npm run build. --static checks the bundled assets; --self-test
// exercises the HTTP failure cases locally. Full mode accepts --news-file with
// a read-only public.news export, or the public Supabase URL/key in process env.
// The 5+9 assertions describe this repair inventory, not future editorial policy.
import { readFile, readdir, access } from "node:fs/promises";
import { createHash } from "node:crypto";
import { createServer } from "node:http";
import assert from "node:assert/strict";

const ROOT = new URL("../", import.meta.url);
const ORIGIN = "https://api.copatelmextelcel.com.mx";
const DEAD_HOST = "yrrqjcnthnleqiblwlom.supabase.co";
const ADIDAS_HASH = "306396bd3e068154bf2774eabeab3e651a8648178fb86bdd809e96cb29278f1e";
const TIMEOUT_MS = 10000;
const PNG = Buffer.from("89504e470d0a1a0a", "hex");
const DISPOSITIONS = new Map([
  // The approved repair inventory, not all future news articles.
  ["2b5a93b9-0e54-42d3-95c6-10d50dbf277c", "institutional"],
  ["7ff5d4c9-6553-4cb8-aa7b-30691f056b71", "institutional"],
  ["d15e6c5b-90a3-458d-b9d3-87d16f3b407c", "institutional"],
  ["5e73e567-0cbc-4ffb-8cca-e948c4056e7d", "institutional"],
  ["5b073e81-e75b-496b-ad57-38ef1392e96e", "institutional"],
  ["23aa7d85-344a-4952-b253-9418ba5ee4fd", "institutional"],
  ["6b50aa39-10bd-43f6-ab2d-d990e1b2008b", "restored"],
  ["9bc148e4-9f66-4a84-9997-75974b126f63", "restored"],
  ["1c015e4a-cc2e-4c2e-849e-9042cf910c25", "institutional"],
  ["4c6bd118-4e69-4d45-ae7a-2899a2e00ddc", "restored"],
  ["d8933624-3691-4c44-a0bf-f4e420d06937", "restored"],
  ["0e5815b2-e161-47bc-b02d-134f61a3c447", "restored"],
  ["a5a0ee2e-bb56-4bc5-8cab-e09aad19c528", "institutional"],
  ["5b1b0df4-7410-456d-a48f-fe19d1daf830", "institutional"],
]);

const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
function magicMime(bytes) {
  if (bytes.subarray(0, 8).equals(PNG)) return "image/png";
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (/^GIF8[79]a$/.test(bytes.subarray(0, 6).toString())) return "image/gif";
  if (bytes.subarray(0, 4).toString() === "RIFF" && bytes.subarray(8, 12).toString() === "WEBP") return "image/webp";
  if (bytes.subarray(4, 8).toString() === "ftyp" && /avif|avis/.test(bytes.subarray(8, 32).toString())) return "image/avif";
  return null;
}

async function staticAudit() {
  const failures = [];
  const check = async (label, action) => {
    try { await action(); } catch (error) { failures.push(`${label}: ${error.message}`); }
  };
  await check("local Adidas", async () => {
    const bytes = await readFile(new URL("src/assets/sponsor-adidas.png", ROOT));
    assert.equal(magicMime(bytes), "image/png");
    assert.equal(bytes.length, 10034);
    assert.equal(hash(bytes), ADIDAS_HASH);
  });
  await check("Adidas import", async () => {
    const code = await readFile(new URL("src/components/SponsorsCarousel.tsx", ROOT), "utf8");
    assert.match(code, /import\s+sponsorAdidas\s+from\s+["']@\/assets\/sponsor-adidas\.png["']/);
    assert.doesNotMatch(code, /__l5e|sponsor-adidas\.png\.asset\.json/);
    let exists = true;
    try { await access(new URL("src/assets/sponsor-adidas.png.asset.json", ROOT)); } catch (error) {
      if (error.code !== "ENOENT") throw error;
      exists = false;
    }
    assert.equal(exists, false, "obsolete Adidas descriptor exists");
  });
  await check("built Adidas", async () => {
    const assets = new URL("dist/assets/", ROOT);
    const files = await readdir(assets);
    const images = files.filter((name) => /^sponsor-adidas-[\w-]+\.png$/.test(name));
    assert.equal(images.length, 1, "expected one hashed Adidas PNG; run npm run build first");
    assert.equal(hash(await readFile(new URL(images[0], assets))), ADIDAS_HASH);
    for (const file of files.filter((name) => name.endsWith(".js"))) {
      const code = await readFile(new URL(file, assets), "utf8");
      assert.doesNotMatch(code, /\/__l5e\/[^"'\s]*sponsor-adidas/i);
    }
  });
  await check("institutional image fallback", async () => {
    const code = await readFile(new URL("src/components/NewsImage.tsx", ROOT), "utf8");
    assert.match(code, /Imagen institucional/);
    assert.match(code, /onError/);
    for (const file of ["src/components/NewsSection.tsx", "src/pages/News.tsx", "src/pages/NewsDetail.tsx"]) {
      assert.match(await readFile(new URL(file, ROOT), "utf8"), /<NewsImage\b/);
    }
  });
  return failures;
}

async function probeImage(value, { allowLocal = false } = {}) {
  let url;
  try { url = new URL(value); } catch { return "invalid image URL"; }
  if (url.hostname === DEAD_HOST || url.pathname.startsWith("/__l5e/")) return "obsolete media URL";
  if (url.username || url.password || (url.protocol !== "https:" && !(allowLocal && url.hostname === "127.0.0.1" && url.protocol === "http:"))) return "unsafe image URL";
  try {
    const response = await fetch(url, { redirect: "error", headers: { Range: "bytes=0-63" }, signal: AbortSignal.timeout(TIMEOUT_MS) });
    const mime = (response.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
    if (![200, 206].includes(response.status) || !mime.startsWith("image/")) {
      await response.body?.cancel();
      return `HTTP ${response.status}, MIME ${mime || "missing"}`;
    }
    const reader = response.body?.getReader();
    if (!reader) return "empty image response";
    const chunks = [];
    let length = 0;
    try {
      while (length < 32) {
        const chunk = await reader.read();
        if (chunk.done) break;
        chunks.push(Buffer.from(chunk.value.subarray(0, 64)));
        length += chunk.value.length;
      }
    } finally { await reader.cancel(); }
    const actualMime = magicMime(Buffer.concat(chunks));
    return actualMime === mime ? null : `image signature ${actualMime || "unrecognized"} does not match MIME ${mime}`;
  } catch { return "transport failure, timeout or disallowed redirect"; }
}

async function newsAudit(rows, { restoredOrigin = ORIGIN, allowLocal = false } = {}) {
  const failures = [];
  if (!Array.isArray(rows) || !rows.length) return ["news inventory must be a nonempty JSON array"];
  const byId = new Map();
  for (const row of rows) {
    if (!row || typeof row.id !== "string" || byId.has(row.id)) {
      failures.push("invalid or duplicate news ID");
      continue;
    }
    byId.set(row.id, row);
    if (row.image_url !== null && typeof row.image_url !== "string") {
      failures.push(`${row.id}: image_url must be a string or null`);
      continue;
    }
    if (row.image_url !== null) {
      const error = await probeImage(row.image_url, { allowLocal });
      if (error) failures.push(`${row.id}: ${error}`);
    }
  }
  let restored = 0;
  let institutional = 0;
  for (const [id, disposition] of DISPOSITIONS) {
    const row = byId.get(id);
    if (!row) { failures.push(`${id}: approved repair row missing`); continue; }
    if (disposition === "restored") {
      restored++;
      try {
        const url = new URL(row.image_url);
        assert.equal(url.origin, restoredOrigin);
        assert.ok(url.pathname.startsWith("/storage/v1/object/public/news-images/"));
      } catch { failures.push(`${id}: restored image must use approved news-images Storage origin`); }
    } else if (disposition === "institutional") {
      institutional++;
      if (row.image_url !== null) failures.push(`${id}: institutional disposition requires image_url=null`);
      if (row.image_source !== "Imagen institucional") failures.push(`${id}: institutional disposition requires truthful image_source`);
    } else failures.push(`${id}: repair disposition not configured`);
  }
  if (restored !== 5 || institutional !== 9) failures.push(`repair inventory must be 5 restored + 9 institutional, found ${restored}+${institutional}`);
  return failures;
}

async function fetchNews() {
  const origin = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (origin?.replace(/\/$/, "") !== ORIGIN || !key) throw new Error("provide approved public Supabase URL/key environment or --news-file JSON");
  const rows = [];
  for (let offset = 0; ; offset += 1000) {
    const url = new URL("/rest/v1/news", ORIGIN);
    url.searchParams.set("select", "id,image_url,image_source");
    url.searchParams.set("order", "id.asc");
    url.searchParams.set("offset", String(offset));
    url.searchParams.set("limit", "1000");
    const response = await fetch(url, { redirect: "error", headers: { apikey: key, Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!response.ok) throw new Error(`public news inventory HTTP ${response.status}`);
    const page = await response.json();
    if (!Array.isArray(page)) throw new Error("invalid public news response");
    rows.push(...page);
    if (page.length < 1000) return rows;
  }
}

async function selfTest() {
  const server = createServer((request, response) => {
    if (request.url === "/transport") { request.socket.destroy(); return; }
    if (request.url === "/404") { response.writeHead(404, { "Content-Type": "image/png" }); response.end(PNG); return; }
    if (request.url === "/html") { response.writeHead(200, { "Content-Type": "text/html" }); response.end("<html>SPA fallback</html>"); return; }
    if (request.url === "/fake-image") { response.writeHead(200, { "Content-Type": "image/png" }); response.end("<html>wrong signature</html>"); return; }
    if (request.url === "/redirect") { response.writeHead(302, { Location: "/html" }); response.end(); return; }
    response.writeHead(206, { "Content-Type": "image/png" }); response.end(Buffer.concat([PNG, Buffer.alloc(32)]));
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const origin = `http://127.0.0.1:${server.address().port}`;
  try {
    for (const path of ["/404", "/html", "/fake-image", "/transport", "/redirect"]) assert.ok(await probeImage(origin + path, { allowLocal: true }), `must reject ${path}`);
    assert.ok(await probeImage(`https://${DEAD_HOST}/image.png`));
    assert.equal(await probeImage(origin + "/png", { allowLocal: true }), null);
    const rows = [...DISPOSITIONS].map(([id, disposition]) => ({ id, image_url: disposition === "restored" ? `${origin}/storage/v1/object/public/news-images/${id}.png` : null, image_source: disposition === "institutional" ? "Imagen institucional" : "Original editorial" }));
    assert.deepEqual(await newsAudit(rows, { restoredOrigin: origin, allowLocal: true }), []);
    const wrong = structuredClone(rows);
    wrong.find((row) => row.image_url === null).image_url = origin + "/png";
    assert.ok((await newsAudit(wrong, { restoredOrigin: origin, allowLocal: true })).length);
    assert.ok((await newsAudit(rows.slice(1), { restoredOrigin: origin, allowLocal: true })).length);
    assert.ok((await newsAudit([...rows, rows[0]], { restoredOrigin: origin, allowLocal: true })).length);
    console.log("PASS self-test: valid image, HTTP failures, HTML fallback, signature mismatch, dead host, transport, redirects, 5+9 dispositions, missing and duplicate rows");
  } finally { server.closeAllConnections(); await new Promise((resolve) => server.close(resolve)); }
}

async function main() {
  const args = process.argv.slice(2);
  const fileIndex = args.indexOf("--news-file");
  const allowed = new Set(["--static", "--self-test", "--news-file"]);
  if (args.some((arg, index) => !allowed.has(arg) && !(fileIndex >= 0 && index === fileIndex + 1)) || (fileIndex >= 0 && (!args[fileIndex + 1] || args[fileIndex + 1].startsWith("--")))) throw new Error("usage: [--static | --self-test | --news-file inventory.json]");
  if (args.includes("--self-test")) { await selfTest(); return; }
  const failures = await staticAudit();
  if (!args.includes("--static")) {
    try {
      const rows = fileIndex >= 0 ? JSON.parse(await readFile(args[fileIndex + 1], "utf8")) : await fetchNews();
      failures.push(...await newsAudit(rows));
      console.log(`Audited ${Array.isArray(rows) ? rows.length : 0} news records`);
    } catch (error) { failures.push(error.message); }
  }
  for (const failure of failures) console.error(`FAIL ${failure}`);
  if (failures.length) process.exitCode = 1;
  else console.log(`PASS news media ${args.includes("--static") ? "static assets and integration" : "static assets, all image URLs and approved 5+9 repair inventory"}`);
}
main().catch(() => { console.error("FAIL audit could not complete (input or infrastructure error)"); process.exitCode = 1; });
