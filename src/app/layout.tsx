import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";

import "./globals.css";
import { I18nProvider } from "@/lib/i18n/provider";
import { getLocale } from "@/lib/i18n/server";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin", "greek"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

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
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
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
