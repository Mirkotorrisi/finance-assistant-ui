import type { Metadata } from "next"
import "./globals.css"
import { ComponentRegistryInitializer } from "@/components/ComponentRegistryInitializer"
import { StatementUpload } from "@/components/finance/StatementUpload"

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
        {children}
        <StatementUpload />
      </body>
    </html>
  )
}
