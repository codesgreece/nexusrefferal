import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";

import "./globals.css";
import { I18nProvider } from "@/lib/i18n/provider";
import { getLocale } from "@/lib/i18n/server";

// Inter and JetBrains Mono both ship Greek glyphs, which the UI needs since
// Greek is the default language.
const sans = Inter({
  variable: "--font-sans-family",
  subsets: ["latin", "latin-ext", "greek"],
  display: "swap",
});
const mono = JetBrains_Mono({
  variable: "--font-mono-family",
  subsets: ["latin", "latin-ext", "greek"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "NexusDevStudio Affiliates",
    template: "%s · NexusDevStudio Affiliates",
  },
  description:
    "Promote NexusDevStudio web design and development services, refer businesses and earn commission on qualifying sales.",
  applicationName: "NexusDevStudio Affiliates",
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#05040a",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${sans.variable} ${mono.variable} w-full overflow-x-hidden antialiased`}>
        <I18nProvider locale={locale}>
          {children}
          <Toaster
            position="top-right"
            offset={16}
            toastOptions={{
              classNames: {
                toast:
                  "!rounded-xl !border !border-white/10 !bg-surface-2/95 !text-ink !backdrop-blur !shadow-glow-sm",
                description: "!text-muted",
                actionButton: "!bg-violet-600 !text-white",
                cancelButton: "!bg-white/8 !text-muted",
              },
            }}
            closeButton
          />
        </I18nProvider>
      </body>
    </html>
  );
}
