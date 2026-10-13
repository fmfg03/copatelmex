import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import { CHAMPION_BUCKET, CHAMPION_CATEGORIES, CHAMPION_LABELS, CHAMPION_ROTATION_MS, sortChampions, type PublishedChampion } from "@/lib/stateChampions";

function ChampionImage({ path, state, category }: { path: string; state: string; category: typeof CHAMPION_CATEGORIES[number] }) {
  const [failed, setFailed] = useState(false);
  const label = CHAMPION_LABELS[category];
  return (
    <figure className="min-w-0 overflow-hidden rounded-lg border border-primary/20 bg-muted">
      <div className="aspect-[3/2]">
        {failed ? <p className="flex h-full items-center justify-center p-3 text-center text-sm text-muted-foreground" role="status">Fotografía de {label} no disponible</p>
          : <img src={supabase.storage.from(CHAMPION_BUCKET).getPublicUrl(path).data.publicUrl} alt={`Campeones de ${state}, categoría ${label}`} width={900} height={600} loading="lazy" decoding="async" className="h-full w-full object-contain" onError={() => setFailed(true)} />}
      </div>
      <figcaption className="px-2 py-2 text-center text-sm font-semibold text-secondary">{label}</figcaption>
    </figure>
  );
}

export function StateChampionsBanner({ champions }: { champions: PublishedChampion[] }) {
  const states = useMemo(() => sortChampions(champions), [champions]);
  const [api, setApi] = useState<CarouselApi>();
  const sectionRef = useRef<HTMLElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const interacting = hovered || focused;
  const current = states[currentIndex];
  const multiple = states.length > 1;
  const step = (direction: number) => {
    if (api && states.length) api.scrollTo((api.selectedScrollSnap() + direction + states.length) % states.length, true);
  };

  useEffect(() => {
    if (!api) return;
    const selected = () => setCurrentIndex(api.selectedScrollSnap());
    const dragged = () => setPaused(true);
    selected();
    api.on("select", selected); api.on("reInit", selected); api.on("pointerDown", dragged);
    return () => { api.off("select", selected); api.off("reInit", selected); api.off("pointerDown", dragged); };
  }, [api]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!api || !multiple || paused || reducedMotion) return;
    // Read the current DOM interaction at each tick. Layout or scrolling can
    // change hover/focus without the captured React state reflecting it yet.
    const timer = window.setInterval(() => {
      const section = sectionRef.current;
      if (!section || section.matches(":hover") || section.contains(document.activeElement)) return;
      api.scrollTo((api.selectedScrollSnap() + 1) % states.length, true);
    }, CHAMPION_ROTATION_MS);
    return () => window.clearInterval(timer);
  }, [api, states.length, paused, reducedMotion, multiple]);

  if (!current) return null;
  const stopped = paused || reducedMotion;
  const controlClass = "inline-flex h-11 w-11 items-center justify-center rounded-full border border-primary/30 text-secondary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";
  return (
    <section ref={sectionRef} aria-label="Campeones estatales" aria-roledescription="carrusel" data-testid="state-champions-banner"
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
      <div className="mb-6 text-center">
        <h2 className="text-3xl font-extrabold tracking-tight text-secondary md:text-4xl">Campeones estatales</h2>
        <div className="mx-auto mt-4 h-1 w-20 bg-primary" />
      </div>
      <Carousel setApi={setApi} opts={{ loop: multiple }} aria-label="Estados campeones" className="rounded-xl border-2 border-primary/20 bg-card p-4 shadow-xl"
        onKeyDownCapture={(event) => { if (!multiple) return; if (event.key === "ArrowRight" || event.key === "ArrowLeft") { event.preventDefault(); setPaused(true); step(event.key === "ArrowRight" ? 1 : -1); } }}>
        <h3 className="mb-4 text-center text-xl font-bold text-secondary" aria-live={stopped || interacting ? "polite" : "off"} data-testid="champions-state">{current.state}</h3>
        <CarouselContent className="ml-0">{states.map((entry, index) => <CarouselItem key={entry.id} className="pl-0" aria-hidden={index !== currentIndex}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {CHAMPION_CATEGORIES.map((category) => entry.photos[category]
              ? <ChampionImage key={`${entry.id}-${entry.photos[category].image_path}`} path={entry.photos[category].image_path} state={entry.state} category={category} />
              : <p key={category} className="text-sm">Fotografía de {CHAMPION_LABELS[category]} no disponible</p>)}
          </div>
        </CarouselItem>)}</CarouselContent>
        {multiple && <div className="mt-4 flex items-center justify-center gap-3">
          <button type="button" className={controlClass} aria-label="Estado anterior" onClick={() => { setPaused(true); step(-1); }}><ChevronLeft className="h-5 w-5" /></button>
          <span className="text-sm text-muted-foreground">{currentIndex + 1} / {states.length}</span>
          <button type="button" className={controlClass} aria-label={stopped ? "Reanudar rotación" : "Pausar rotación"} disabled={reducedMotion} title={reducedMotion ? "Rotación desactivada por tu preferencia de movimiento reducido" : undefined} onClick={() => setPaused((value) => !value)}>{stopped ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}</button>
          <button type="button" className={controlClass} aria-label="Estado siguiente" onClick={() => { setPaused(true); step(1); }}><ChevronRight className="h-5 w-5" /></button>
        </div>}
      </Carousel>
    </section>
  );
}
