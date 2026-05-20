import * as React from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Size = "sm" | "md";
type Shape = "rounded" | "pill";

export interface AIButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: Size;
  shape?: Shape;
  loading?: boolean;
  icon?: React.ReactNode;
  iconOnly?: boolean;
}

/**
 * Unified "AI" call-to-action button.
 * Deep slate/navy gradient with a subtle amber sparkle, soft gold glow pulse,
 * and a slow shimmer overlay. Used everywhere we trigger an AI feature so
 * those entry points feel consistent and premium.
 */
const AIButton = React.forwardRef<HTMLButtonElement, AIButtonProps>(
  (
    {
      className,
      size = "md",
      shape = "rounded",
      loading = false,
      icon,
      iconOnly = false,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const sizeClasses =
      size === "sm"
        ? iconOnly
          ? "h-8 w-8"
          : "h-8 px-3 text-[12px] gap-1.5"
        : iconOnly
          ? "h-10 w-10"
          : "h-10 px-4 text-[13px] gap-2";

    const shapeClass = shape === "pill" ? "rounded-full" : "rounded-xl";
    const iconSize = size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5";

    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled || loading}
        className={cn(
          "group relative inline-flex items-center justify-center font-medium tracking-tight overflow-hidden",
          "text-white border border-white/10",
          "ios-press animate-ai-pulse-glow",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:opacity-60 disabled:cursor-not-allowed",
          sizeClasses,
          shapeClass,
          className,
        )}
        style={{ backgroundColor: "hsl(220 18% 24%)" }}
        {...props}
      >
        <span
          className="absolute inset-0 animate-ai-shimmer bg-[length:220%_100%] opacity-60 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(110deg, transparent 35%, hsl(45 90% 60% / 0.14) 50%, transparent 65%)",
          }}
          aria-hidden
        />
        {/* Hover sparkles — subtle twinkles that appear when hovering */}
        <span aria-hidden className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="absolute top-1.5 left-3 h-1 w-1 rounded-full bg-amber-300 animate-ai-twinkle-1 shadow-[0_0_4px_hsl(45_90%_60%/0.8)]" />
          <span className="absolute bottom-1.5 right-4 h-[3px] w-[3px] rounded-full bg-amber-200 animate-ai-twinkle-2 shadow-[0_0_3px_hsl(45_90%_70%/0.7)]" />
          <span className="absolute top-2 right-2 h-[2px] w-[2px] rounded-full bg-amber-300 animate-ai-twinkle-3 shadow-[0_0_3px_hsl(45_90%_60%/0.7)]" />
        </span>
        {loading ? (
          <Loader2 className={cn("relative animate-spin text-amber-300", iconSize)} />
        ) : icon ? (
          <span className={cn("relative inline-flex items-center justify-center text-amber-500 drop-shadow-[0_0_3px_hsl(45_90%_55%/0.5)]", iconSize)}>
            {icon}
          </span>
        ) : (
          <Sparkles
            className={cn(
              "relative text-amber-500 animate-ai-sparkle-spin drop-shadow-[0_0_3px_hsl(45_90%_55%/0.5)]",
              iconSize,
            )}
          />
        )}
        {!iconOnly && children && <span className="relative">{children}</span>}
      </button>
    );
  },
);
AIButton.displayName = "AIButton";

export default AIButton;