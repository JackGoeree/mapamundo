// app/layout.tsx
import 'leaflet/dist/leaflet.css'
import './globals.css' // or your own global styles

export const metadata = {
  title: 'My Leaflet App',
  description: 'Next.js 13 App Router with Leaflet',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
