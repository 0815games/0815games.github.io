import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, CheckCircle2, Clock, FileDown, Filter, MapPin, Phone, ArrowRight } from 'lucide-react';
import { usePageMeta } from '../hooks/usePageMeta';
import { upcomingCohorts, brandInfo, newsHighlights } from '../data/siteData';

export default function TerminePage() {
  usePageMeta(
    'Kursstarts & Termine 2026 / 2027 – Plochingen & Reutlingen',
    'Aktuelle Starttermine für Industriemeister, Fachwirte und Technische Betriebswirte in Plochingen und Reutlingen (Teilzeit am Wochenende & Vollzeit).'
  );

  const [locationFilter, setLocationFilter] = useState('Alle');
  const [categoryFilter, setCategoryFilter] = useState('Alle');
  const [modeFilter, setModeFilter] = useState('Alle');

  const filtered = upcomingCohorts.filter((c) => {
    const locOk = locationFilter === 'Alle' || c.locations.includes(locationFilter);
    const catOk = categoryFilter === 'Alle' || c.category === categoryFilter;
    const modeOk =
      modeFilter === 'Alle' ||
      (modeFilter === 'Vollzeit' && c.mode.includes('Vollzeit')) ||
      (modeFilter === 'Teilzeit' && c.mode.includes('Teilzeit'));
    return locOk && catOk && modeOk;
  });

  return (
    <div>
      <section className="bg-gradient-to-br from-[#0B224D] to-[#16428F] text-white py-12 sm:py-16 bg-tech-grid-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-300/30 text-amber-200 text-xs font-bold uppercase tracking-wider mb-3">
            Endspurt Herbst 2026 · Ausblick 2027
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">
            Aktuelle Kursstarts &amp; Standorte
          </h1>
          <p className="mt-3 text-blue-100 max-w-2xl text-sm sm:text-base">
            Alle Industriemeister-Kurse (Metall, Elektro, Mechatronik, Logistik) beinhalten bereits den Ausbildereignungsschein (AEVO). Ab November 2026 unterrichten wir in Präsenz in Plochingen und neu auch in Reutlingen.
          </p>
        </div>
      </section>

      <section className="py-10 sm:py-14 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          {/* News & Raumbelegung Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {newsHighlights.map((n) => (
              <div key={n.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#123E8A] bg-blue-50 px-2 py-0.5 rounded">
                  {n.badge}
                </span>
                <h2 className="font-display font-bold text-slate-900 text-sm sm:text-base mt-2">{n.title}</h2>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.text}</p>
              </div>
            ))}
          </div>

          {/* Filter Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-4">
              <Filter className="w-4 h-4 text-[#123E8A]" />
              Kurse filtern
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase mb-1.5">Standort</p>
                <div className="flex flex-wrap gap-1.5">
                  {['Alle', 'Plochingen', 'Reutlingen'].map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => setLocationFilter(loc)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                        locationFilter === loc
                          ? 'bg-[#123E8A] text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase mb-1.5">Fachrichtung</p>
                <div className="flex flex-wrap gap-1.5">
                  {['Alle', 'Meister', 'Fachwirt', 'Betriebswirt'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                        categoryFilter === cat
                          ? 'bg-[#123E8A] text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase mb-1.5">Zeitmodell</p>
                <div className="flex flex-wrap gap-1.5">
                  {['Alle', 'Teilzeit', 'Vollzeit'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setModeFilter(m)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                        modeFilter === m
                          ? 'bg-[#123E8A] text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Cohort Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map((c) => (
              <div
                key={c.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between hover:border-blue-300 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
                    <span className="font-mono-tech text-xs font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
                      Kurs-Nr.: {c.courseNumbers}
                    </span>
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        c.status.includes('3')
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-emerald-50 text-emerald-800'
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>

                  <h2 className="font-display text-xl font-bold text-slate-900">{c.title}</h2>

                  <div className="mt-4 space-y-2 text-sm text-slate-700">
                    <p className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#123E8A] shrink-0" />
                      <span>
                        <strong>Zeitraum:</strong> {c.start} bis {c.end}
                      </span>
                    </p>
                    <p className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#123E8A] shrink-0" />
                      <span>
                        <strong>Standort(e):</strong> {c.locations.join(' & ')} · {c.ue}
                      </span>
                    </p>
                    <p className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-[#123E8A] shrink-0 mt-0.5" />
                      <span>
                        <strong>{c.mode}:</strong> {c.schedule} (1 UE = 45 Min.)
                      </span>
                    </p>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <Link
                    to={`/lehrgaenge/${c.courseSlug}`}
                    className="text-xs font-bold text-[#123E8A] hover:underline inline-flex items-center gap-1"
                  >
                    Kursinhalte ansehen <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${c.phone.replace(/[^0-9]/g, '')}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      {c.phone}
                    </a>
                    <Link
                      to="/kontakt"
                      className="px-3.5 py-1.5 rounded-lg bg-[#123E8A] hover:bg-blue-800 text-white text-xs font-semibold"
                    >
                      Platz anfragen
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Anmelde-Unterlagen & Raumbelegung */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
              <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900">
                So läuft deine Beratung &amp; Anmeldung ab
              </h2>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Mit allen Interessenten führen wir zunächst ein kostenloses, individuelles Beratungsgespräch. Dabei erhältst du genaue Infos über den Kursablauf, Lehrinhalte, Stundenübersichten, Kosten sowie deine zustehenden staatlichen Fördermittel (75 % durch Aufstiegs-BAföG &amp; KfW).
              </p>

              <h3 className="font-display font-bold text-slate-900 text-sm uppercase tracking-wider mt-6 mb-3">
                Benötigte Unterlagen für deine Anmeldung:
              </h3>
              <ul className="space-y-2.5">
                {brandInfo.registrationDocs.map((doc) => (
                  <li key={doc} className="flex items-start gap-2.5 text-sm text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-[#123E8A] shrink-0 mt-0.5" />
                    <span>{doc}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-slate-500">
                * Die BAföG-Antragsunterlagen füllen wir im Anschluss gemeinsam mit dir aus (oben genannte Unterlagen werden hierfür ebenfalls benötigt).
              </p>
            </div>

            <div className="lg:col-span-4 bg-[#0F2D63] text-white rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-sm">
              <div>
                <h3 className="font-display text-lg font-bold">Aktuelle Raumbelegung</h3>
                <p className="text-sm text-blue-100 mt-2">
                  Für bereits angemeldete Teilnehmer oder einen ersten Eindruck vor Ort:
                </p>
                <a
                  href="/downloads/raumbelegung-november-2026.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 flex items-center justify-between gap-2 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-sm font-semibold transition-colors"
                >
                  <span>Raumbelegung Nov. 2026 (PDF)</span>
                  <FileDown className="w-4 h-4" />
                </a>
              </div>

              <div className="mt-6 pt-5 border-t border-white/15">
                <Link
                  to="/kontakt"
                  className="block w-full text-center px-5 py-3 rounded-xl bg-white text-[#0F2D63] font-bold text-sm hover:bg-blue-50"
                >
                  Beratungstermin vereinbaren
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
