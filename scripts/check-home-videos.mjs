const DEFAULT_STORAGE_ORIGIN =
  "https://api.copatelmextelcel.com.mx/storage/v1/object/public/gallery-media";

const storageOrigin = (
  process.env.HOME_VIDEO_STORAGE_ORIGIN || DEFAULT_STORAGE_ORIGIN
).replace(/\/$/, "");

const videos = [
  {
    name: "Fan Zone",
    path: "homepage/ctt-25-fanzone.mp4",
    size: 198400594,
  },
  {
    name: "Copa Telmex Telcel",
    path: "homepage/zucaritas-proteina-ii-10s.mp4",
    size: 25226710,
  },
];

let failed = false;

for (const video of videos) {
  const response = await fetch(`${storageOrigin}/${video.path}`, {
    headers: { Range: "bytes=0-1023" },
  });
  const contentType = response.headers.get("content-type") || "";
  const contentRange = response.headers.get("content-range") || "";
  const expectedRange = `bytes 0-1023/${video.size}`;

  const errors = [];
  if (response.status !== 206) {
    errors.push(`status ${response.status}, expected 206`);
  }
  if (!contentType.toLowerCase().startsWith("video/mp4")) {
    errors.push(`content-type ${contentType || "missing"}, expected video/mp4`);
  }
  if (contentRange !== expectedRange) {
    errors.push(`content-range ${contentRange || "missing"}, expected ${expectedRange}`);
  }

  await response.body?.cancel();

  if (errors.length > 0) {
    failed = true;
    console.error(`FAIL ${video.name}: ${errors.join("; ")}`);
  } else {
    console.log(`PASS ${video.name}: 206 video/mp4 ${contentRange}`);
  }
}

if (failed) {
  process.exitCode = 1;
}
