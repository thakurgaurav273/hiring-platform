import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryProvider } from "@/components/query-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: "Grovyn Talent — Internal Hiring Platform",
  description:
    "Grovyn Talent is a modern applicant tracking system for recruiters, hiring managers, and interviewers to run the entire hiring lifecycle in one place.",
  authors: [{ name: "Grovyn" }],
  openGraph: {
    title: "Grovyn Talent",
    description: "Modern ATS for recruiters, hiring managers, and interviewers.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
        />
      </head>
      <body>
        <QueryProvider>
          <ThemeProvider>
            <TooltipProvider>
              {children}
              <Toaster position="bottom-right" toastOptions={{ className: "font-sans" }} />
            </TooltipProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
