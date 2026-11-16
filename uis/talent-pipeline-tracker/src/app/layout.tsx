import type { Metadata } from "next";
import { DM_Sans, DM_Serif_Display } from "next/font/google";
import { AppHeader } from "@/components/AppHeader";
import { ToastProvider } from "@/components/ToastProvider";
import "./globals.css";

const dmSans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"] });
const dmSerif = DM_Serif_Display({ variable: "--font-dm-serif", subsets: ["latin"], weight: "400" });

export const metadata: Metadata = {
  title: {
    default: "Talent Pipeline · Brasaland People & Culture",
    template: "%s · Brasaland Talent Pipeline",
  },
  description:
    "Internal Brasaland tool for People & Culture to track candidates for the Executive Assistant search.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${dmSans.variable} ${dmSerif.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-paper font-sans text-ink">
        <ToastProvider>
          <AppHeader />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">{children}</main>
          <footer className="border-t border-line py-4 text-center text-xs text-muted">
            Brasaland Digital · Internal tool for People &amp; Culture — candidate data is confidential.
          </footer>
        </ToastProvider>
      </body>
    </html>
  );
}
