import type { Metadata } from "next";
import { Geist, Inter } from "next/font/google";
import { RootProvider } from "fumadocs-ui/provider/next";
import { site } from "@/lib/layout.shared";
import "./global.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: `${site.name} · ${site.description}`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  openGraph: {
    type: "website",
    siteName: site.name,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geist.variable} ${inter.variable}`}>
      <body
        className="flex min-h-screen flex-col antialiased"
        style={{
          // Manicat UI components read these directly, next-themes writes className="dark" and data-theme on <html>.
          "--font-display": `var(--font-geist)`,
          "--font-body": `var(--font-inter)`,
        } as React.CSSProperties}
      >
        <RootProvider
          theme={{
            // Manicat UI keys its dark tokens off [data-theme="dark"], Fumadocs UI off the .dark class. Write both.
            attribute: ["class", "data-theme"],
            enableSystem: true,
          }}
        >
          {children}
        </RootProvider>
      </body>
    </html>
  );
}