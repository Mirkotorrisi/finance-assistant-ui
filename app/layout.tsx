import type { Metadata, Viewport } from "next"
import Script from "next/script"
import "@fontsource-variable/ibm-plex-sans"
import "@fontsource/ibm-plex-mono/400.css"
import "@fontsource/ibm-plex-mono/500.css"
import "./globals.css"
import { ComponentRegistryInitializer } from "@/components/ComponentRegistryInitializer"
import { AppShell } from "@/components/layout/AppShell"
import { THEME_BOOTSTRAP } from "@/components/layout/ThemeToggle"
import { I18nProvider } from "@/lib/i18n"

export const metadata: Metadata = {
  title: "Finance Assistant",
  description: "Personal finance assistant: accounts, spending, net worth and portfolio, with an agent that answers in the chat.",
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f7f8" },
    { media: "(prefers-color-scheme: dark)", color: "#141518" },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="it" suppressHydrationWarning>
      <body className="antialiased">
        {/* applies the stored theme before the first paint */}
        <Script id="theme-bootstrap" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
        <I18nProvider>
          <ComponentRegistryInitializer />
          <AppShell>{children}</AppShell>
        </I18nProvider>
      </body>
    </html>
  )
}
