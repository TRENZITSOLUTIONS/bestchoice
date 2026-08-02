'use client';

export function WhatsAppButton({ productName, productUrl }: { productName: string; productUrl: string }) {
  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '919876543210';
  const message = encodeURIComponent(`Hi, I'm interested in ${productName} - ${productUrl}`);

  return (
    <a
      href={`https://wa.me/${number}?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp Enquiry"
      className="w-12 h-12 border border-line rounded flex items-center justify-center text-leaf flex-shrink-0"
    >
      ✆
    </a>
  );
}
