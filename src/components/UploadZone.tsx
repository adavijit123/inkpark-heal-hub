import { cn } from "@/lib/utils";

/**
 * Cinematic studio-frame upload zone.
 * Full-width dark tap target with viewfinder corner brackets, a circular
 * camera badge and display type. Wraps a native file input so mobile users
 * get the OS chooser (camera or gallery).
 */
export function UploadZone({
  id,
  title,
  caption,
  disabled,
  compact,
  onFile,
}: {
  id: string;
  title: string;
  caption: string;
  disabled?: boolean;
  compact?: boolean;
  onFile: (file: File) => void;
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "group relative block cursor-pointer select-none overflow-hidden rounded-md bg-foreground text-background",
        "transition-all duration-300 active:scale-[0.985]",
        disabled && "pointer-events-none opacity-60",
      )}
    >
      <input
        id={id}
        type="file"
        accept="image/*"
        disabled={disabled}
        className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />

      {/* viewfinder brackets */}
      <div className="pointer-events-none absolute inset-0">
        <span className="absolute top-3 left-3 size-3.5 border-t-2 border-l-2 border-background/40 transition-colors duration-300 group-active:border-background" />
        <span className="absolute top-3 right-3 size-3.5 border-t-2 border-r-2 border-background/40 transition-colors duration-300 group-active:border-background" />
        <span className="absolute bottom-3 left-3 size-3.5 border-b-2 border-l-2 border-background/40 transition-colors duration-300 group-active:border-background" />
        <span className="absolute bottom-3 right-3 size-3.5 border-b-2 border-r-2 border-background/40 transition-colors duration-300 group-active:border-background" />
      </div>

      <div className={cn("relative flex flex-col items-center gap-3 px-6 text-center", compact ? "py-5" : "py-9")}>
        <span
          className={cn(
            "flex items-center justify-center rounded-full border border-background/30 transition-colors duration-300 group-active:bg-background group-active:text-foreground",
            compact ? "size-9" : "size-12",
          )}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 256 256"
            fill="currentColor"
            className={compact ? "size-4" : "size-5"}
            aria-hidden="true"
          >
            <path d="M208,56H181.33L165.49,34.87A16,16,0,0,0,152.67,28H103.33a16,16,0,0,0-12.82,6.87L74.67,56H48A24,24,0,0,0,24,80V192a24,24,0,0,0,24,24H208a24,24,0,0,0,24-24V80A24,24,0,0,0,208,56Zm8,136a8,8,0,0,1-8,8H48a8,8,0,0,1-8-8V80a8,8,0,0,1,8-8H80a8,8,0,0,0,6.41-3.2L102.24,48h51.52l15.83,20.8A8,8,0,0,0,176,72h32a8,8,0,0,1,8,8ZM128,88a44,44,0,1,0,44,44A44.05,44.05,0,0,0,128,88Zm0,72a28,28,0,1,1,28-28A28,28,0,0,1,128,160Z" />
          </svg>
        </span>
        <span className="block">
          <span
            className={cn(
              "font-display block leading-none tracking-[0.18em] uppercase",
              compact ? "text-lg" : "text-2xl",
            )}
          >
            {title}
          </span>
          <span className="mt-1.5 block text-[10px] tracking-[0.3em] uppercase opacity-60">{caption}</span>
        </span>
      </div>
    </label>
  );
}
