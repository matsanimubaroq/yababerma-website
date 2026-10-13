import './globals.css'
import { Providers } from './providers'
import Navbar from '@/components/site/navbar'
import Footer from '@/components/site/footer'
import FloatingWa from '@/components/site/floating-wa'
import { Toaster } from '@/components/ui/sonner'

export const metadata = {
  title: 'Yayasan Banua Berkah Mandiri | Filantropi Islam & Kemanusiaan Banjarmasin',
  description: 'Yayasan Banua Berkah Mandiri (YABABERMA) - lembaga filantropi Islam & kemanusiaan di Banjarmasin. Zakat, Wakaf, Sedekah, Panti Asuhan, TPQ, dan Bantuan Dhuafa.',
  icons: {
    icon: 'https://customer-assets-m6fa6gv7.emergentagent.net/job_8686a8aa-42c1-46ab-92c8-1ae6eb1872e2/artifacts/4k17zphv_logo%20yababerma.png',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <script dangerouslySetInnerHTML={{__html:'window.addEventListener("error",function(e){if(e.error instanceof DOMException&&e.error.name==="DataCloneError"&&e.message&&e.message.includes("PerformanceServerTiming")){e.stopImmediatePropagation();e.preventDefault()}},true);'}} />
      </head>
      <body>
        <Providers>
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <Footer />
          <FloatingWa />
          <Toaster richColors position="top-center" />
        </Providers>
      </body>
    </html>
  )
}
