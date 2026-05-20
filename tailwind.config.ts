import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      fontFamily: {
        sans: ["-apple-system", "Inter", "SF Pro Display", "system-ui", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        panel: {
          DEFAULT: "hsl(var(--panel-bg))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 8px)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 8px)",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        "ios-fade-in": {
          from: { opacity: "0", transform: "scale(0.97)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "ai-shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "ai-pulse-glow": {
          "0%, 100%": { boxShadow: "0 1px 2px 0 hsl(222 47% 11% / 0.25), 0 0 0 0 hsl(45 90% 60% / 0.25)" },
          "50%": { boxShadow: "0 1px 2px 0 hsl(222 47% 11% / 0.3), 0 0 18px 2px hsl(45 90% 60% / 0.35)" },
        },
        "ai-sparkle-spin": {
          "0%, 100%": { transform: "rotate(0deg) scale(1)", opacity: "0.95" },
          "50%": { transform: "rotate(8deg) scale(1.08)", opacity: "1" },
        },
        "ai-twinkle-1": {
          "0%, 100%": { opacity: "0", transform: "scale(0.4)" },
          "40%": { opacity: "1", transform: "scale(1)" },
          "70%": { opacity: "0.2", transform: "scale(0.7)" },
        },
        "ai-twinkle-2": {
          "0%, 100%": { opacity: "0", transform: "scale(0.4)" },
          "55%": { opacity: "1", transform: "scale(1)" },
          "85%": { opacity: "0.2", transform: "scale(0.6)" },
        },
        "ai-twinkle-3": {
          "0%, 100%": { opacity: "0", transform: "scale(0.4)" },
          "30%": { opacity: "0.8", transform: "scale(0.9)" },
          "65%": { opacity: "1", transform: "scale(1.1)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "ios-fade-in": "ios-fade-in 0.35s cubic-bezier(0.28,0.11,0.32,1)",
        "ai-shimmer": "ai-shimmer 4.5s ease-in-out infinite",
        "ai-pulse-glow": "ai-pulse-glow 3.6s ease-in-out infinite",
        "ai-sparkle-spin": "ai-sparkle-spin 3.2s ease-in-out infinite",
        "ai-twinkle-1": "ai-twinkle-1 1.4s ease-in-out infinite",
        "ai-twinkle-2": "ai-twinkle-2 1.8s ease-in-out 0.2s infinite",
        "ai-twinkle-3": "ai-twinkle-3 1.6s ease-in-out 0.4s infinite",
      },
      transitionTimingFunction: {
        ios: "cubic-bezier(0.28, 0.11, 0.32, 1)",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
