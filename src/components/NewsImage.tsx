import { useState, type ReactNode } from "react";
import copaLogo from "@/assets/copa-telmex-logo.png";

interface NewsImageProps {
  src: string | null | undefined;
  alt: string;
  source?: string | null;
  className?: string;
  loading?: "eager" | "lazy";
  children: (media: { image: ReactNode; attribution: string }) => ReactNode;
}

const usableSource = (src: NewsImageProps["src"]) => {
  if (!src?.trim()) return null;
  try {
    const url = new URL(src, "https://copatelmextelcel.com.mx");
    if (
      url.hostname === "yrrqjcnthnleqiblwlom.supabase.co" ||
      url.pathname.startsWith("/__l5e/")
    ) return null;
    return src;
  } catch {
    return null;
  }
};

const NewsImageContent = ({ src, alt, source, className, loading, children }: NewsImageProps) => {
  const [failed, setFailed] = useState(false);
  const institutional = !src || failed;
  const image = institutional ? (
    <div
      role="img"
      aria-label={`Imagen institucional de Copa Telmex Telcel para: ${alt}`}
      className={`${className || ""} flex min-h-28 flex-col items-center justify-center gap-2 bg-gradient-to-br from-secondary/10 to-primary/10 p-4`}
    >
      <img src={copaLogo} alt="" className="w-24 max-w-full max-h-24 object-contain" />
      <span aria-hidden="true" className="text-center text-[11px] font-medium text-secondary">
        Imagen institucional
      </span>
    </div>
  ) : (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={loading}
      onError={() => setFailed(true)}
    />
  );

  return <>{children({ image, attribution: institutional ? "Imagen institucional" : `Imagen: ${source || "Archivo"}` })}</>;
};

/** Keep the image and its attribution in sync, including after failed requests. */
export const NewsImage = (props: NewsImageProps) => {
  const src = usableSource(props.src);
  // Remount image state on source changes; a failed article must not affect another.
  return <NewsImageContent key={props.src || ""} {...props} src={src} />;
};
