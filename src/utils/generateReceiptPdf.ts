import { jsPDF } from 'jspdf';
import { Booking } from '../types';

export interface ReceiptGenerationResult {
  filename: string;
  blob: Blob;
  sharedDirectly: boolean;
}

/**
 * Generates a clean, professional PDF receipt for a Celebrato party room booking.
 */
export function createBookingReceiptPdf(booking: Booking): { doc: jsPDF; filename: string } {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const code = (booking.shareCode || booking.id.slice(-6)).toUpperCase();
  const filename = `Celebrato-Receipt-${code}.pdf`;

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const margin = 18;
  const contentWidth = pageWidth - margin * 2; // 174mm

  // Header background banner
  doc.setFillColor(24, 24, 28); // #18181c
  doc.rect(0, 0, pageWidth, 42, 'F');

  // Accent stripe
  doc.setFillColor(245, 158, 11); // Amber-500
  doc.rect(0, 42, pageWidth, 2.5, 'F');

  // Brand Name
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('CELEBRATO', margin, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(245, 158, 11);
  doc.text('PREMIUM PARTY SUITES & PRIVATE THEATRES', margin, 26);

  doc.setTextColor(180, 180, 190);
  doc.setFontSize(8);
  doc.text('Venue Operations & Guest Management Console', margin, 32);

  // Right-aligned header badge
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('BOOKING RECEIPT', pageWidth - margin, 18, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(200, 200, 210);
  doc.text(`Ref #: ${code}`, pageWidth - margin, 25, { align: 'right' });
  doc.text(`Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, pageWidth - margin, 31, { align: 'right' });

  let y = 56;

  // Status & Event summary box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 24, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  const eventTitle = booking.eventName || `${booking.userName}'s Celebration`;
  doc.text(eventTitle.length > 40 ? eventTitle.substring(0, 38) + '...' : eventTitle, margin + 5, y + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Party Suite: ${booking.roomName || 'Celebration Room'}  |  Guests: ${booking.guestsCount} Persons`, margin + 5, y + 17);

  // Status Pill on top right of the box
  doc.setFillColor(220, 252, 231); // Light emerald
  doc.setDrawColor(134, 239, 172);
  doc.roundedRect(pageWidth - margin - 40, y + 5, 35, 8, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(22, 101, 52);
  doc.text('PAID & CONFIRMED', pageWidth - margin - 22.5, y + 10.5, { align: 'center' });

  y += 32;

  // Two columns: Guest / Customer Details vs Reservation Details
  const colWidth = (contentWidth - 6) / 2;

  // Left Column: Customer details
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, colWidth, 40, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text('PRIMARY GUEST / HOST', margin + 4, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Name: ${booking.userName || 'Guest Host'}`, margin + 4, y + 16);
  doc.text(`Phone: ${booking.userPhone || 'Not provided'}`, margin + 4, y + 23);
  const emailText = booking.userEmail || 'N/A';
  doc.text(`Email: ${emailText.length > 28 ? emailText.substring(0, 26) + '...' : emailText}`, margin + 4, y + 30);
  doc.text(`Booking ID: ${booking.id.substring(0, 22)}`, margin + 4, y + 37);

  // Right Column: Schedule / Venue details
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin + colWidth + 6, y, colWidth, 40, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text('EVENT SCHEDULE & VENUE', margin + colWidth + 10, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Date: ${booking.date}`, margin + colWidth + 10, y + 16);
  doc.text(`Time Slot: ${booking.timeSlot}`, margin + colWidth + 10, y + 23);
  doc.text(`Duration: ${booking.durationHours} Hours`, margin + colWidth + 10, y + 30);
  doc.text(`Room: ${booking.roomName}`, margin + colWidth + 10, y + 37);

  y += 48;

  // Itemized Pricing Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('ITEMIZED INVOICE BREAKDOWN', margin, y);

  y += 4;

  // Table header
  doc.setFillColor(30, 41, 59);
  doc.rect(margin, y, contentWidth, 7, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('ITEM DESCRIPTION', margin + 4, y + 5);
  doc.text('QTY / HRS', margin + 98, y + 5);
  doc.text('RATE (INR)', margin + 128, y + 5);
  doc.text('AMOUNT (INR)', pageWidth - margin - 4, y + 5, { align: 'right' });

  y += 7;

  // Base Suite Row
  doc.setFillColor(255, 255, 255);
  doc.rect(margin, y, contentWidth, 8, 'F');
  doc.setDrawColor(241, 245, 249);
  doc.line(margin, y + 8, pageWidth - margin, y + 8);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(`Venue Suite Rental (${booking.roomName})`, margin + 4, y + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`${booking.durationHours} hrs`, margin + 98, y + 5.5);
  const hourlyRate = booking.durationHours ? Math.round((booking.basePrice || 0) / booking.durationHours) : booking.basePrice;
  doc.text(`Rs. ${hourlyRate.toLocaleString('en-IN')}/hr`, margin + 128, y + 5.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`Rs. ${(booking.basePrice || 0).toLocaleString('en-IN')}`, pageWidth - margin - 4, y + 5.5, { align: 'right' });

  y += 8;

  // Selected Add-ons
  if (booking.addOns && booking.addOns.length > 0) {
    booking.addOns.forEach((addon, idx) => {
      const isAlt = idx % 2 === 0;
      doc.setFillColor(isAlt ? 250 : 255, isAlt ? 250 : 255, isAlt ? 252 : 255);
      doc.rect(margin, y, contentWidth, 7.5, 'F');
      doc.setDrawColor(241, 245, 249);
      doc.line(margin, y + 7.5, pageWidth - margin, y + 7.5);

      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      const addonTitle = `Add-On: ${addon.name}`;
      doc.text(addonTitle.length > 45 ? addonTitle.substring(0, 42) + '...' : addonTitle, margin + 4, y + 5);

      doc.setTextColor(71, 85, 105);
      doc.text(`${addon.quantity} unit${addon.quantity > 1 ? 's' : ''}`, margin + 98, y + 5);
      doc.text(`Rs. ${addon.price.toLocaleString('en-IN')}`, margin + 128, y + 5);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`Rs. ${(addon.price * addon.quantity).toLocaleString('en-IN')}`, pageWidth - margin - 4, y + 5, { align: 'right' });

      y += 7.5;
    });
  }

  // Summary Table box at bottom right
  y += 4;
  const summaryBoxWidth = 85;
  const summaryBoxX = pageWidth - margin - summaryBoxWidth;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(summaryBoxX, y, summaryBoxWidth, 34, 2, 2, 'FD');

  let sy = y + 6;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Base Suite Rental:', summaryBoxX + 4, sy);
  doc.text(`Rs. ${(booking.basePrice || 0).toLocaleString('en-IN')}`, pageWidth - margin - 4, sy, { align: 'right' });

  sy += 6;
  doc.text('Add-Ons Subtotal:', summaryBoxX + 4, sy);
  doc.text(`Rs. ${(booking.addOnsTotal || 0).toLocaleString('en-IN')}`, pageWidth - margin - 4, sy, { align: 'right' });

  if (Boolean(booking.discount && booking.discount > 0)) {
    sy += 6;
    doc.setTextColor(22, 101, 52);
    doc.text('Promotional Discount:', summaryBoxX + 4, sy);
    doc.text(`- Rs. ${booking.discount.toLocaleString('en-IN')}`, pageWidth - margin - 4, sy, { align: 'right' });
  }

  sy += 7;
  doc.setDrawColor(203, 213, 225);
  doc.line(summaryBoxX + 4, sy - 2, pageWidth - margin - 4, sy - 2);

  // Total Paid highlight
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('TOTAL PAID:', summaryBoxX + 4, sy + 3);
  doc.setTextColor(180, 83, 9); // Amber-700
  doc.text(`Rs. ${booking.finalPrice.toLocaleString('en-IN')}`, pageWidth - margin - 4, sy + 3, { align: 'right' });

  // Verification & Instructions on bottom left
  const notesWidth = contentWidth - summaryBoxWidth - 6;
  doc.setFillColor(254, 252, 232); // Light amber
  doc.setDrawColor(254, 240, 138);
  doc.roundedRect(margin, y, notesWidth, 34, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(133, 77, 14);
  doc.text('IMPORTANT GUEST INSTRUCTIONS', margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(113, 63, 18);
  doc.text('• Present this official PDF receipt at venue check-in.', margin + 4, y + 12);
  doc.text('• Arrive 10 minutes prior to your reserved slot.', margin + 4, y + 18);
  doc.text('• Outside catering & custom party decorations permitted.', margin + 4, y + 24);
  doc.text(`• Verification Code: ${code}`, margin + 4, y + 30);

  // Bottom Footer
  const footerY = 270;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, footerY, pageWidth - margin, footerY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Celebrato Party Suites & Private Lounge', margin, footerY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('For reservations, custom decor & 24/7 host concierge assistance:', margin, footerY + 11);
  doc.text('Phone & WhatsApp: +91 98765 43210  |  Email: celebrations@celebrato.com', margin, footerY + 16);

  doc.text(`System Generated Receipt • Authorized by Celebrato Operations`, pageWidth - margin, footerY + 16, { align: 'right' });

  return { doc, filename };
}

/**
 * Downloads the receipt as a PDF file directly.
 */
export function downloadReceiptPdf(booking: Booking): string {
  const { doc, filename } = createBookingReceiptPdf(booking);
  doc.save(filename);
  return filename;
}

/**
 * Generates the PDF receipt and either shares via native Web Share API (if supported)
 * or downloads it and returns the blob and WhatsApp url for easy sending.
 */
export async function downloadAndPrepareReceiptForWhatsApp(
  booking: Booking
): Promise<ReceiptGenerationResult> {
  const { doc, filename } = createBookingReceiptPdf(booking);
  const blob = doc.output('blob');
  let sharedDirectly = false;

  // Try native Web Share API with file (works on supported Android & iOS browsers)
  if (typeof navigator !== 'undefined' && 'canShare' in navigator && 'share' in navigator) {
    try {
      const file = new File([blob], filename, { type: 'application/pdf' });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Celebrato Booking Receipt - ${booking.shareCode}`,
          text: `Hello ${booking.userName}, here is your official Celebrato booking receipt for ${booking.eventName}!`,
        });
        sharedDirectly = true;
        return { filename, blob, sharedDirectly };
      }
    } catch {
      // User cancelled share or file sharing not accepted - fallback to download
    }
  }

  // Fallback to standard save/download
  doc.save(filename);
  return { filename, blob, sharedDirectly };
}

/**
 * Constructs WhatsApp sharing link with prefilled booking message.
 */
export function getWhatsAppReceiptShareUrl(booking: Booking): string {
  const phone = (booking.userPhone || '').replace(/[^0-9]/g, '');
  const code = (booking.shareCode || booking.id.slice(-6)).toUpperCase();
  const priceFormatted = `Rs. ${booking.finalPrice.toLocaleString('en-IN')}`;
  
  const text = 
    `Hello ${booking.userName}! 🎉\n\n` +
    `Here is your official booking confirmation & receipt for *${booking.eventName}* at Celebrato Party Suites.\n\n` +
    `• Booking Ref: *${code}*\n` +
    `• Suite: *${booking.roomName}*\n` +
    `• Date: *${booking.date}*\n` +
    `• Time: *${booking.timeSlot}* (${booking.durationHours} Hours)\n` +
    `• Guests: *${booking.guestsCount} Guests*\n` +
    `• Total Paid: *${priceFormatted}* (Confirmed)\n\n` +
    `I have attached your official PDF receipt. Please feel free to reach out if you have any questions before the event!`;

  const encoded = encodeURIComponent(text);
  if (phone) {
    return `https://wa.me/${phone}?text=${encoded}`;
  }
  return `https://api.whatsapp.com/send?text=${encoded}`;
}
