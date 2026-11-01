import type { Metadata } from "next";
import "./globals.css";
import type { CSSProperties } from "react";
import { Toaster } from "sonner";
import { Geist, Inter, JetBrains_Mono, Source_Serif_4 } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryProvider } from "@/components/query-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { PLATFORM_BRANDING, THEME_BOOTSTRAP_SCRIPT } from "@/lib/theme";

// Font presets (see FONT_STACKS in lib/theme/engine.ts). Only the default face
// is preloaded; the others download when an organization selects them.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap", preload: false });
const serif = Source_Serif_4({ subsets: ["latin"], variable: "--font-serif", display: "swap", preload: false });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", display: "swap", preload: false });

export const metadata: Metadata = {
  title: PLATFORM_BRANDING.productName,
  description: `${PLATFORM_BRANDING.productName} by ${PLATFORM_BRANDING.platformName}: an applicant tracking system for recruiters, hiring managers and interviewers.`,
  authors: [{ name: PLATFORM_BRANDING.platformName }],
  applicationName: PLATFORM_BRANDING.productName,
  openGraph: {
    title: PLATFORM_BRANDING.productName,
    description: "Applicant tracking for recruiters, hiring managers and interviewers.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

// Sonner reads these variables, so toasts follow the active theme.
const toasterStyle = {
  "--normal-bg": "var(--color-popover)",
  "--normal-text": "var(--color-popover-foreground)",
  "--normal-border": "var(--color-border)",
  "--border-radius": "var(--radius-lg)",
} as CSSProperties;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // The bootstrap script sets the theme class and colour-scheme on <html>
    // before hydration, so React must accept those attributes as they are.
    <html lang="en" className={cn(inter.variable, geist.variable, serif.variable, mono.variable)} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }} />
      </head>
      <body>
        <QueryProvider>
          <ThemeProvider>
            <TooltipProvider>
              {children}
              <Toaster position="bottom-right" style={toasterStyle} toastOptions={{ className: "font-sans" }} />
            </TooltipProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
