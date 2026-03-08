import { MessageCircle } from "lucide-react";

export default function WhatsAppFloat({ phone }: { phone: string }) {
  if (!phone) return null;
  
  return (
    <a
      href={`https://wa.me/${phone}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 left-6 z-50 h-14 w-14 rounded-full bg-[#25D366] text-white shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 flex items-center justify-center animate-bounce"
      style={{ animationDuration: '2s', animationIterationCount: '3' }}
      aria-label="تواصل معانا واتساب"
    >
      <MessageCircle className="h-7 w-7" />
    </a>
  );
}
