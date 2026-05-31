import type { Metadata } from "next"
import "./globals.css"
import { ComponentRegistryInitializer } from "@/components/ComponentRegistryInitializer"
import { Navbar } from "@/components/layout/Navbar"

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
    <html lang="en">
      <body className="antialiased">
        <ComponentRegistryInitializer />
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  )
}
