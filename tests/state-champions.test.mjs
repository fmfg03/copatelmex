import test from "node:test";
import assert from "node:assert/strict";
import { championImagePlacement, validateChampionImage, completeChampionPhotos, sortChampions, DEFAULT_CHAMPION_FRAMING, MAX_CHAMPION_IMAGE_BYTES } from "../src/lib/stateChampions.ts";

test("all three categories need an original and banner image to publish", () => {
  const photo = { original_path: "champions/original.jpg", image_path: "champions/banner.webp", framing: DEFAULT_CHAMPION_FRAMING };
  assert.equal(completeChampionPhotos({}), false);
  assert.equal(completeChampionPhotos({ varonil: photo, juvenil: photo }), false);
  assert.equal(completeChampionPhotos({ varonil: photo, juvenil: photo, femenil: { ...photo, original_path: "" } }), false);
  assert.equal(completeChampionPhotos({ varonil: photo, juvenil: photo, femenil: photo }), true);
});
test("states sort alphabetically in Spanish without modifying input", () => {
  const states = [{ state: "Zacatecas" }, { state: "Aguascalientes" }, { state: "Yucatán" }];
  assert.deepEqual(sortChampions(states).map((state) => state.state), ["Aguascalientes", "Yucatán", "Zacatecas"]);
  assert.equal(states[0].state, "Zacatecas");
});
test("supported photos admit exactly 10 MB; empty, oversize, SVG and false MIME reject", () => {
  for (const type of ["image/jpeg", "image/png", "image/webp"]) assert.equal(validateChampionImage({ type, size: MAX_CHAMPION_IMAGE_BYTES }), null);
  for (const size of [0, MAX_CHAMPION_IMAGE_BYTES + 1]) assert.ok(validateChampionImage({ type: "image/jpeg", size }));
  for (const type of ["image/svg+xml", "text/plain", "", "video/mp4"]) assert.ok(validateChampionImage({ type, size: 1024 }));
});
test("default framing preserves all people in a panoramic photo", () => {
  assert.deepEqual(championImagePlacement(2000, 1000, DEFAULT_CHAMPION_FRAMING), { width: 900, height: 450, x: 0, y: 75 });
});
test("default framing preserves portrait photo with side margins", () => {
  assert.deepEqual(championImagePlacement(600, 1200, DEFAULT_CHAMPION_FRAMING), { width: 300, height: 600, x: 300, y: 0 });
});
test("selected framing crops predictably with bounds and center", () => {
  assert.deepEqual(championImagePlacement(1800, 1200, { zoom: 2, x: 50, y: 50 }), { width: 1800, height: 1200, x: -450, y: -300 });
  const anchored = championImagePlacement(1800, 1200, { zoom: 2, x: 0, y: 100 });
  assert.equal(Math.abs(anchored.x), 0);
  assert.equal(anchored.y, -600);
});
test("invalid dimensions and unsafe frames are refused", () => {
  for (const [width, height] of [[0, 600], [900, 0], [-1, 600], [NaN, 600], [Infinity, 600]]) assert.throws(() => championImagePlacement(width, height, DEFAULT_CHAMPION_FRAMING));
  for (const frame of [{ zoom: 4, x: 50, y: 50 }, { zoom: 0, x: 50, y: 50 }, { zoom: 1, x: -1, y: 50 }, { zoom: 1, x: 50, y: 101 }, { zoom: NaN, x: 50, y: 50 }]) assert.throws(() => championImagePlacement(900, 600, frame));
});
