import { championImagePlacement, type ChampionFraming } from "./stateChampions";

async function decodeChampionImage(blob: Blob): Promise<{ image: CanvasImageSource; width: number; height: number; close: () => void }> {
  if (typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(blob, { imageOrientation: "from-image" });
    return { image: bitmap, width: bitmap.width, height: bitmap.height, close: () => bitmap.close() };
  }
  const url = URL.createObjectURL(blob);
  const image = new Image();
  try {
    image.src = url;
    await image.decode();
    return { image, width: image.naturalWidth, height: image.naturalHeight, close: () => URL.revokeObjectURL(url) };
  } catch {
    URL.revokeObjectURL(url);
    throw new Error("No se pudo leer la imagen. Selecciona otra fotografía.");
  }
}

export async function optimizeChampionImage(original: Blob, framing: ChampionFraming): Promise<Blob> {
  let decoded: Awaited<ReturnType<typeof decodeChampionImage>>;
  try { decoded = await decodeChampionImage(original); }
  catch { throw new Error("No se pudo leer la imagen. Selecciona otra fotografía."); }
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 900;
    canvas.height = 600;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Este navegador no permite preparar la imagen.");
    const placement = championImagePlacement(decoded.width, decoded.height, framing);
    context.fillStyle = "#11243a";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(decoded.image, placement.x, placement.y, placement.width, placement.height);
    const result = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.84));
    if (!result) throw new Error("No se pudo preparar la imagen.");
    return result;
  } finally { decoded.close(); }
}
