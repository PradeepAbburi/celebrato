import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Send, 
  Sparkles, 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  Calendar, 
  Users, 
  PartyPopper,
  HelpCircle,
  MessageSquare
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { sendContactMessage } from '../services/partyDataService';

interface ContactPageProps {
  onBack: () => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({ onBack }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [eventType, setEventType] = useState('Birthday Celebration');
  const [eventDate, setEventDate] = useState('');
  const [guestsEstimated, setGuestsEstimated] = useState<number>(20);
  const [message, setMessage] = useState('');

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError('Please fill in your name, email, and message.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await sendContactMessage({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        eventType,
        eventDate: eventDate || undefined,
        guestsEstimated: Number(guestsEstimated) || undefined,
        message: message.trim(),
      });

      // Fire festive confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to submit inquiry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setName('');
    setEmail('');
    setPhone('');
    setEventType('Birthday Celebration');
    setEventDate('');
    setMessage('');
    setSubmitted(false);
    setError(null);
  };

  return (
    <div id="contact-page" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      
      {/* Return Navigation */}
      <div>
        <button
          id="contact-back-btn"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-300 hover:text-white transition group"
        >
          <div className="p-2 rounded-xl bg-[#282828] border border-[#383838] group-hover:bg-[#323232] group-hover:border-amber-500/40 transition">
            <ArrowLeft className="w-4 h-4 text-amber-400" />
          </div>
          <span className="hidden sm:inline">Back to Party Rooms</span>
          <span className="sm:hidden">Back</span>
        </button>
      </div>

      {/* Header Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-violet-500/10 border border-[#383838] p-6 sm:p-10 overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Celebrato Event Concierge
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight font-outfit">
            Plan Your Epic Party With Us.
          </h1>
          <p className="text-sm sm:text-base text-gray-300 leading-relaxed font-normal">
            Have questions about suite availability, custom DJ sound setups, outside catering, or booking multiple suites? Send us a message and our concierge will get back to you within 15 minutes.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Form or Success */}
        <div className="lg:col-span-7 bg-[#282828] border border-[#383838] rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          {submitted ? (
            <div className="text-center py-10 space-y-5">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-white font-outfit">Message Received!</h3>
                <p className="text-sm text-gray-300 max-w-md mx-auto">
                  Thank you, <strong className="text-amber-400">{name}</strong>! Your inquiry has been sent directly to the Celebrato venue operations team. We will contact you at <span className="text-white font-medium">{email}</span> shortly.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-[#202020] border border-[#383838] text-xs text-gray-400 max-w-md mx-auto text-left space-y-1">
                <div className="font-bold text-gray-200">Summary of Inquiry:</div>
                <div>Event Type: <span className="text-amber-300 font-semibold">{eventType}</span></div>
                {eventDate && <div>Estimated Date: <span className="text-gray-200">{eventDate}</span></div>}
                <div>Guests: <span className="text-gray-200">{guestsEstimated} people</span></div>
              </div>
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={handleReset}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#323232] hover:bg-[#3c3c3c] text-white text-xs font-bold transition border border-[#444]"
                >
                  Send Another Inquiry
                </button>
                <button
                  onClick={onBack}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition shadow-lg shadow-amber-500/20"
                >
                  Return to Party Rooms
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="flex items-center justify-between border-b border-[#383838] pb-4">
                <div className="flex items-center gap-2 text-white font-bold text-lg font-outfit">
                  <MessageSquare className="w-5 h-5 text-amber-400" />
                  Contact Venue Team
                </div>
                <span className="text-xs text-gray-400 font-medium">* Required fields</span>
              </div>

              {error && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    Your Full Name *
                  </label>
                  <input
                    id="contact-name-input"
                    type="text"
                    required
                    placeholder="e.g. Alex Morgan"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 bg-[#202020] border border-[#383838] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    Email Address *
                  </label>
                  <input
                    id="contact-email-input"
                    type="email"
                    required
                    placeholder="alex@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-[#202020] border border-[#383838] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    Phone / WhatsApp
                  </label>
                  <input
                    id="contact-phone-input"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 bg-[#202020] border border-[#383838] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    Event Type
                  </label>
                  <select
                    id="contact-event-type-select"
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="w-full px-3 py-3 bg-[#202020] border border-[#383838] rounded-xl text-sm text-white focus:outline-none focus:border-amber-500 transition"
                  >
                    <option value="Birthday Celebration">Birthday Celebration</option>
                    <option value="Private DJ Rave">Private DJ Rave</option>
                    <option value="Milestone & Anniversary">Milestone & Anniversary</option>
                    <option value="Bachelor / Bachelorette">Bachelor / Bachelorette</option>
                    <option value="Corporate / Team Party">Corporate / Team Party</option>
                    <option value="Suite Buyout">Suite Buyout</option>
                    <option value="Other Celebration">Other Celebration</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    Est. Date
                  </label>
                  <input
                    id="contact-date-input"
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-3 py-3 bg-[#202020] border border-[#383838] rounded-xl text-sm text-white focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5 flex items-center justify-between">
                  <span>Estimated Guests: <strong className="text-amber-400">{guestsEstimated} people</strong></span>
                  <span className="text-[11px] text-gray-500">Rooms fit 15 to 60+</span>
                </label>
                <input
                  type="range"
                  min={5}
                  max={75}
                  step={5}
                  value={guestsEstimated}
                  onChange={(e) => setGuestsEstimated(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                  Your Message or Special Requests *
                </label>
                <textarea
                  id="contact-message-input"
                  required
                  rows={4}
                  placeholder="Tell us about your celebration, music preferences, preferred hours, or custom catering requests..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-4 py-3 bg-[#202020] border border-[#383838] rounded-2xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition resize-none"
                />
              </div>

              <button
                id="contact-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-black text-sm rounded-2xl transition shadow-xl shadow-amber-500/20 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  'Submitting Message...'
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span className="hidden sm:inline">Send Inquiry & Get Fast Quote</span>
                    <span className="sm:hidden">Send Inquiry</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Right Column: Venue Contact Info & Fast FAQs */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Direct Details Card */}
          <div className="bg-[#282828] border border-[#383838] rounded-3xl p-6 sm:p-7 shadow-xl space-y-5">
            <h3 className="text-lg font-bold text-white font-outfit flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Venue Direct Line
            </h3>

            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-[#202020] border border-[#343434]">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs text-gray-400 font-medium">Hotline & WhatsApp</div>
                  <a href="tel:+15557278948" className="font-bold text-white hover:text-amber-400 transition">
                    +1 (555) 727-8948
                  </a>
                  <p className="text-[11px] text-gray-500">24/7 Dedicated Host Support</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-[#202020] border border-[#343434]">
                <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs text-gray-400 font-medium">Email Inquiries</div>
                  <a href="mailto:hello@celebrato.party" className="font-bold text-white hover:text-rose-400 transition">
                    hello@celebrato.party
                  </a>
                  <p className="text-[11px] text-gray-500">Average response in 15 mins</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-[#202020] border border-[#343434]">
                <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs text-gray-400 font-medium">Location & Access</div>
                  <div className="font-bold text-white">840 Neon Boulevard</div>
                  <p className="text-[11px] text-gray-500">Entertainment Arts District, Suite 400</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-[#202020] border border-[#343434]">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs text-gray-400 font-medium">Operating Hours</div>
                  <div className="font-bold text-white">Open 24 Hours • 7 Days</div>
                  <p className="text-[11px] text-gray-500">All party bookings are strictly private</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick FAQ Card */}
          <div className="bg-[#282828] border border-[#383838] rounded-3xl p-6 shadow-xl space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-gray-300 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-amber-400" />
              Frequently Asked Questions
            </h4>
            <div className="space-y-3 text-xs text-gray-300">
              <div className="p-3 rounded-xl bg-[#202020] border border-[#333]">
                <span className="font-bold text-amber-300 block mb-1">Can we bring outside cake and drinks?</span>
                Yes! Outside celebration cakes and food platters are 100% welcome with no corkage fees.
              </div>
              <div className="p-3 rounded-xl bg-[#202020] border border-[#333]">
                <span className="font-bold text-amber-300 block mb-1">How does the Event Media Vault work?</span>
                Each booking generates a private photo/video vault. You share the QR code with your guests and everyone can drop their clips into one high-res folder in real-time!
              </div>
              <div className="p-3 rounded-xl bg-[#202020] border border-[#333]">
                <span className="font-bold text-amber-300 block mb-1">What is the cancellation policy?</span>
                Full refund or free date rescheduling up to 48 hours prior to your party start time.
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
