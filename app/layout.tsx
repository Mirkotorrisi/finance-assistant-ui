import type { Metadata } from "next"
import "./globals.css"

// Next.js app router requires metadata export in layout files
// eslint-disable-next-line react-refresh/only-export-components
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
        {children}
      </body>
    </html>
  )
}
