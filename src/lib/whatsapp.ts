/**
 * Helper to normalize phone numbers and build universal WhatsApp links.
 * Compatible with WhatsApp Web, Desktop, Android, and iOS.
 */

export function cleanWhatsAppPhone(phone: string): string {
  if (!phone) return '';

  // 1. Remove all non-digits (spaces, dashes, parens, and crucial: the '+' sign)
  let digits = phone.replace(/\D/g, '');

  // 2. Remove leading zero if entered as local prefix (e.g. 0987654321)
  if (digits.startsWith('0')) {
    digits = digits.substring(1);
  }

  // 3. If it's a 9-digit number starting with 9 (standard Peru cell phone), prepend country code 51
  if (digits.length === 9 && digits.startsWith('9')) {
    digits = '51' + digits;
  }

  return digits;
}

export function buildWhatsAppUrl(phone: string, message?: string): string {
  const digits = cleanWhatsAppPhone(phone);
  if (!digits) return '#';

  const textParam = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${digits}${textParam}`;
}
