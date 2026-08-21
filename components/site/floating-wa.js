import { WHATSAPP_ADMIN, WA_INQUIRY_MESSAGE, waLink } from '@/lib/site-data';

function WhatsAppGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="currentColor" aria-hidden="true">
      <path d="M17.5 14.4c-.3-.15-1.8-.9-2.05-1-.28-.1-.48-.15-.68.15-.2.3-.78 1-.96 1.2-.18.2-.35.22-.65.08-.3-.15-1.27-.47-2.42-1.5-.9-.8-1.5-1.78-1.68-2.08-.17-.3-.02-.46.13-.6.14-.14.3-.35.45-.53.15-.18.2-.3.3-.5.1-.2.05-.38-.02-.53-.08-.15-.68-1.63-.93-2.23-.24-.58-.49-.5-.67-.51h-.58c-.2 0-.53.08-.8.38-.28.3-1.05 1.03-1.05 2.5 0 1.48 1.08 2.9 1.23 3.1.15.2 2.13 3.25 5.16 4.56.72.31 1.28.5 1.72.63.72.23 1.38.2 1.9.12.58-.09 1.8-.74 2.05-1.45.25-.71.25-1.32.18-1.45-.07-.13-.27-.2-.57-.35zM12.02 21.5h-.01a9.4 9.4 0 01-4.8-1.32l-.34-.2-3.56.94.95-3.48-.22-.36a9.42 9.42 0 01-1.44-5.02c0-5.2 4.24-9.44 9.46-9.44 2.53 0 4.9.99 6.69 2.78a9.38 9.38 0 012.76 6.68c0 5.2-4.24 9.44-9.45 9.44zM20.5 3.5A11.36 11.36 0 0012.02 0C5.72 0 .6 5.12.6 11.42c0 2.01.53 3.98 1.53 5.71L.5 24l6.02-1.58a11.4 11.4 0 005.49 1.4h.01c6.3 0 11.42-5.12 11.42-11.42 0-3.05-1.19-5.92-3.35-8.08z"/>
    </svg>
  );
}

export default function FloatingWa() {
  return (
    <a
      href={waLink(WHATSAPP_ADMIN, WA_INQUIRY_MESSAGE)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat WhatsApp Yayasan Banua Berkah Mandiri"
      title="Tanya via WhatsApp"
      className="fixed bottom-5 right-5 z-50 group flex items-center gap-2"
    >
      <span className="hidden md:inline-block bg-white text-brand-ink text-sm font-semibold px-3 py-2 rounded-full shadow-lg border border-border opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
        Butuh bantuan? Chat kami
      </span>
      <span className="relative flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] text-white shadow-xl hover:bg-[#1eb457] transition-colors">
        <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-60 animate-ping" />
        <span className="relative"><WhatsAppGlyph /></span>
      </span>
    </a>
  );
}
