import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Clock, ExternalLink, Mail, MapPin, Phone, Send } from 'lucide-react';
import { usePageMeta } from '../hooks/usePageMeta';
import { brandInfo, courses } from '../data/siteData';

export default function KontaktPage() {
  usePageMeta(
    'Kontakt & Beratungstermin vereinbaren',
    'Kontaktiere @Learning in Plochingen (Robert-Bosch-Straße 7-9) oder Reutlingen (Auchtertstraße 8) telefonisch, per E-Mail oder über unser Beratungsformular.'
  );

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    course: 'Gepr. Industriemeister(in) Metall',
    location: 'Plochingen',
    message: '',
    consent: false,
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.consent) {
      setError('Bitte fülle Name und E-Mail-Adresse aus und stimme der Datenverarbeitung zu.');
      return;
    }
    setError('');
    setSubmitted(true);
  };

  const mailtoFallback = () => {
    const subject = encodeURIComponent(`Beratungsanfrage: ${form.course} (${form.location})`);
    const body = encodeURIComponent(
      `Name: ${form.name}\nE-Mail: ${form.email}\nTelefon: ${form.phone}\nWunsch-Lehrgang: ${form.course}\nStandort: ${form.location}\n\nNachricht:\n${form.message}`
    );
    window.location.href = `mailto:${brandInfo.emailPrimary}?subject=${subject}&body=${body}`;
  };

  return (
    <div>
      <section className="bg-gradient-to-br from-[#0B224D] to-[#16428F] text-white py-12 sm:py-16 bg-tech-grid-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-sky-200 text-xs font-bold uppercase tracking-wider mb-3">
            Persönliche Beratung
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">
            Kontakt &amp; Beratungstermin vereinbaren
          </h1>
          <p className="mt-3 text-blue-100 max-w-2xl text-sm sm:text-base">
            Du hast Fragen zu unseren Kursen, Zulassungsvoraussetzungen oder zum Aufstiegs-BAföG? Ruf uns direkt an, schreib uns oder besuche uns vor Ort in Plochingen.
          </p>
        </div>
      </section>

      <section className="py-12 sm:py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Form */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            <h2 className="font-display text-2xl font-bold text-slate-900">
              Deine Nachricht an uns
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Fülle einfach das Formular aus – wir melden uns zeitnah für deinen persönlichen Beratungstermin.
            </p>

            {submitted ? (
              <div className="mt-6 rounded-2xl bg-emerald-50 border border-emerald-200 p-6 space-y-4">
                <div className="flex items-center gap-2.5 text-emerald-800 font-display font-bold text-lg">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  Anfrage vorgemerkt!
                </div>
                <p className="text-sm text-emerald-900 leading-relaxed">
                  Vielen Dank, <strong>{form.name}</strong>! Da diese Vorschau als statische Web-App ohne aktiven Mailserver läuft, kannst du deine Anfrage jetzt direkt per E-Mail-Programm absenden oder uns sofort telefonisch erreichen.
                </p>
                <div className="flex flex-wrap gap-3 pt-1">
                  <button
                    type="button"
                    onClick={mailtoFallback}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#123E8A] hover:bg-blue-800 text-white text-sm font-semibold cursor-pointer"
                  >
                    <Mail className="w-4 h-4" />
                    Im E-Mail-Programm absenden
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubmitted(false)}
                    className="px-4 py-2.5 rounded-xl border border-emerald-300 text-emerald-900 text-sm font-semibold cursor-pointer"
                  >
                    Eingaben ändern
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                {error && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm font-medium">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="c-name" className="block text-sm font-semibold text-slate-700 mb-1">
                      Name *
                    </label>
                    <input
                      id="c-name"
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Dein Vor- und Nachname"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#123E8A] focus:ring-2 focus:ring-blue-200 outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="c-email" className="block text-sm font-semibold text-slate-700 mb-1">
                      E-Mail-Adresse *
                    </label>
                    <input
                      id="c-email"
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="deine@email.de"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#123E8A] focus:ring-2 focus:ring-blue-200 outline-none text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="c-phone" className="block text-sm font-semibold text-slate-700 mb-1">
                      Telefonnummer
                    </label>
                    <input
                      id="c-phone"
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="Für einen schnellen Rückruf"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#123E8A] focus:ring-2 focus:ring-blue-200 outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="c-location" className="block text-sm font-semibold text-slate-700 mb-1">
                      Wunsch-Standort
                    </label>
                    <select
                      id="c-location"
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white focus:border-[#123E8A] focus:ring-2 focus:ring-blue-200 outline-none text-sm"
                    >
                      <option value="Plochingen">Plochingen (Robert-Bosch-Str. 7–9)</option>
                      <option value="Reutlingen">Reutlingen (Auchtertstraße 8)</option>
                      <option value="Noch offen">Noch offen / Beratung gewünscht</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="c-course" className="block text-sm font-semibold text-slate-700 mb-1">
                    Interesse an welchem Lehrgang?
                  </label>
                  <select
                    id="c-course"
                    value={form.course}
                    onChange={(e) => setForm({ ...form, course: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white focus:border-[#123E8A] focus:ring-2 focus:ring-blue-200 outline-none text-sm"
                  >
                    {courses.map((c) => (
                      <option key={c.slug} value={c.title}>
                        {c.title}
                      </option>
                    ))}
                    <option value="Kombimodell (1,5 Jahre zum TBW)">Kombimodell (1,5 Jahre zum TBW)</option>
                    <option value="AEVO / Ausbilderschein">AEVO / Ausbilderschein</option>
                    <option value="Allgemeine Beratung">Allgemeine Beratung / noch unsicher</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="c-msg" className="block text-sm font-semibold text-slate-700 mb-1">
                    Deine Nachricht
                  </label>
                  <textarea
                    id="c-msg"
                    rows={4}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Schreib uns gerne deine Fragen zu Startterminen, Förderung oder deiner beruflichen Vorbildung..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#123E8A] focus:ring-2 focus:ring-blue-200 outline-none text-sm"
                  />
                </div>

                <label className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={form.consent}
                    onChange={(e) => setForm({ ...form, consent: e.target.checked })}
                    className="mt-0.5 h-4 w-4 accent-[#123E8A]"
                  />
                  <span>
                    Hiermit stimme ich der Verarbeitung meiner personenbezogenen Daten zur Kontaktaufnahme zu. Weitere Informationen findest du in unserer{' '}
                    <Link to="/datenschutz" className="text-[#123E8A] font-semibold underline">
                      Datenschutzerklärung
                    </Link>
                    .
                  </span>
                </label>

                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-xl bg-[#123E8A] hover:bg-blue-800 text-white font-bold text-sm shadow-sm transition-colors cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  Beratungsanfrage absenden
                </button>
              </form>
            )}
          </div>

          {/* Right: Locations, Direct Contact & Hours */}
          <div className="lg:col-span-5 space-y-6">
            {/* Direct Contact */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h2 className="font-display text-lg font-bold text-slate-900">Direkter Draht zu uns</h2>
              <div className="space-y-3 text-sm">
                <a
                  href={`tel:${brandInfo.phoneMainRaw}`}
                  className="flex items-center gap-3 p-3 rounded-xl bg-blue-50/70 border border-blue-100 hover:border-blue-300 transition-colors"
                >
                  <Phone className="w-5 h-5 text-[#123E8A]" />
                  <div>
                    <p className="font-bold text-slate-900">{brandInfo.phoneMain} &amp; -221</p>
                    <p className="text-xs text-slate-600">Telefonische Auskunft &amp; Terminvereinbarung</p>
                  </div>
                </a>
                <a
                  href={`mailto:${brandInfo.emailPrimary}`}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-300 transition-colors"
                >
                  <Mail className="w-5 h-5 text-[#123E8A]" />
                  <div>
                    <p className="font-bold text-slate-900">{brandInfo.emailPrimary}</p>
                    <p className="text-xs text-slate-600">Alternativ: {brandInfo.emailSecondary}</p>
                  </div>
                </a>
              </div>
            </div>

            {/* Locations */}
            {brandInfo.locations.map((loc) => (
              <div key={loc.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-[#123E8A] uppercase">
                      <MapPin className="w-3.5 h-3.5" />
                      Standort
                    </span>
                    <h3 className="font-display font-bold text-slate-900 text-lg mt-0.5">{loc.name}</h3>
                    <p className="text-sm text-slate-700 font-medium">
                      {loc.street}, {loc.zipCity}
                    </p>
                  </div>
                  {loc.id === 'plochingen' && (
                    <img
                      src="/images/plochingen-gebaeude.jpg"
                      alt="Gebäude Plochingen"
                      className="w-20 h-14 object-cover rounded-lg border border-slate-200 shrink-0"
                    />
                  )}
                </div>

                <p className="text-xs text-slate-600">{loc.note}</p>
                <ul className="space-y-1 text-xs text-slate-600">
                  {loc.features.map((f) => (
                    <li key={f} className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#123E8A] shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <div className="pt-2 flex flex-wrap gap-3 text-xs font-bold">
                  <a
                    href={loc.osmUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[#123E8A] hover:underline"
                  >
                    OpenStreetMap <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href={loc.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-slate-600 hover:text-[#123E8A] hover:underline"
                  >
                    Route in Google Maps <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}

            {/* Opening Hours */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
              <h3 className="font-display font-bold text-slate-900 text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#123E8A]" />
                Öffnungs- &amp; Bürozeiten (Plochingen)
              </h3>
              <ul className="space-y-1.5 text-xs sm:text-sm text-slate-700">
                {brandInfo.hours.officePlochingen.map((h) => (
                  <li key={h.label} className="flex justify-between gap-2 border-b border-slate-100 py-1">
                    <span>{h.label}</span>
                    <span className="font-mono-tech font-semibold text-slate-900">{h.time}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-slate-500">{brandInfo.hours.consultationNote}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
