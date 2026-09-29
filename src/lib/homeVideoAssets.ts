import { supabase } from "@/integrations/supabase/client";

const HOME_VIDEO_BUCKET = "gallery-media";

const getPublicVideoUrl = (path: string): string =>
  supabase.storage.from(HOME_VIDEO_BUCKET).getPublicUrl(path).data.publicUrl;

export const homeVideoAssets = {
  fanzone: getPublicVideoUrl("homepage/ctt-25-fanzone.mp4"),
  tournament: getPublicVideoUrl("homepage/zucaritas-proteina-ii-10s.mp4"),
} as const;
