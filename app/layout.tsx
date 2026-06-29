import type { Metadata } from "next"
import "./globals.css"
import { ComponentRegistryInitializer } from "@/components/ComponentRegistryInitializer"
import { Navbar } from "@/components/layout/Navbar"
import { I18nProvider } from "@/lib/i18n"

export const metadata: Metadata = {
  title: "Finance Assistant",
  description: "AI-powered financial assistant application",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="it">
      <body className="antialiased">
        <I18nProvider>
          <ComponentRegistryInitializer />
          <Navbar />
          <main>{children}</main>
        </I18nProvider>
      </body>
    </html>
  )
}
