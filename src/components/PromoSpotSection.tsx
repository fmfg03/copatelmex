import { useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

const promoVideoPath = "/ctt-promo-26.mp4";

export const PromoSpotSection = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isMuted, setIsMuted] = useState(true);

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    const nextMuted = !isMuted;
    video.muted = nextMuted;
    setIsMuted(nextMuted);

    if (!nextMuted) {
      video.play().catch(() => undefined);
    }
  };

  return (
    <section className="bg-background py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6 text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-secondary md:text-4xl">
              Spot Copa Telmex Telcel
            </h2>
            <div className="mx-auto mt-4 h-1 w-20 bg-primary" />
          </div>

          <div className="overflow-hidden rounded-xl border-2 border-primary/20 bg-black shadow-2xl">
            <div className="relative aspect-video">
              <video
                ref={videoRef}
                src={promoVideoPath}
                className="h-full w-full object-contain"
                autoPlay
                muted={isMuted}
                loop
                playsInline
                preload="metadata"
              />
              <button
                type="button"
                onClick={toggleMute}
                className="absolute bottom-4 right-4 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                aria-label={isMuted ? "Activar sonido" : "Silenciar video"}
              >
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
