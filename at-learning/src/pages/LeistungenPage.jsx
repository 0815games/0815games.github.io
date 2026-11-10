import React from 'react';
import { Link } from 'react-router-dom';
import { Award, CheckCircle2, FileDown, ShieldCheck, Users } from 'lucide-react';
import { usePageMeta } from '../hooks/usePageMeta';
import { benefitsList } from '../data/siteData';
import BafoegSimulator from '../components/BafoegSimulator';

export default function LeistungenPage() {
  usePageMeta(
    'Unsere Leistungen, Aufstiegs-BAföG & Bildungsurlaub',
    'Kleine Gruppen, 40 erfahrene Dozenten, individuelle Lernkontrollen, bis zu 75 % Förderung über Aufstiegs-BAföG & KfW sowie Bildungszeitgesetz BW.'
  );

  return (
    <div>
      <section className="bg-gradient-to-br from-[#0B224D] to-[#16428F] text-white py-12 sm:py-16 bg-tech-grid-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-sky-200 text-xs font-bold uppercase tracking-wider mb-3">
            Qualität · Beratung · Förderung
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">
            Unsere Leistungen &amp; staatliche Förderung
          </h1>
          <p className="mt-3 text-blue-100 max-w-2xl text-sm sm:text-base">
            Berufsbegleitend, praxisnah und prüfungsorientiert: Warum @Learning zu den erfolgreichsten Bildungsträgern für Industriemeister in Baden-Württemberg zählt.
          </p>
        </div>
      </section>

      <section className="py-12 sm:py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Wissensvermittlung & Beratung */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
              <h2 className="font-display text-2xl font-bold text-slate-900 flex items-center gap-2 mb-5">
                <Users className="w-6 h-6 text-[#123E8A]" />
                Wissensvermittlung mit System
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {benefitsList.map((b) => (
                  <div key={b.title} className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <h3 className="font-display font-bold text-slate-900 text-sm">{b.title}</h3>
                    <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{b.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
                <h2 className="font-display text-xl font-bold text-slate-900 mb-4">
                  Persönliche Beratung &amp; Antragsservice
                </h2>
                <ul className="space-y-3 text-sm text-slate-700">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#123E8A] shrink-0 mt-0.5" />
                    <span>Wir unterstützen dich bei der Wahl der passenden Weiterbildung</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#123E8A] shrink-0 mt-0.5" />
                    <span>Individuelle Beratungstermine am Wochenende (und nach Vereinbarung)</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#123E8A] shrink-0 mt-0.5" />
                    <span>Gemeinsame Antragstellung für Aufstiegs-BAföG und IHK-Zulassungen</span>
                  </li>
                </ul>
                <Link
                  to="/kontakt"
                  className="mt-5 inline-block px-5 py-2.5 rounded-xl bg-[#123E8A] hover:bg-blue-800 text-white text-sm font-semibold"
                >
                  Beratungstermin vereinbaren
                </Link>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 space-y-3">
                <div className="flex items-center gap-2 text-[#123E8A] font-bold text-sm">
                  <ShieldCheck className="w-5 h-5" />
                  Bildungszeit (Bildungsurlaub) in BW
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  Wir sind anerkannter Bildungsträger nach <strong>§ 10 Absatz 3 des Bildungszeitgesetzes Baden-Württemberg (BzG BW)</strong>.
                </p>
                <a
                  href="/downloads/anerkennung-bildungszeitgesetz-bw.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#123E8A] hover:underline"
                >
                  <FileDown className="w-4 h-4" />
                  Anerkennungsbescheid RP Karlsruhe (PDF)
                </a>
              </div>
            </div>
          </div>

          {/* Interactive BAföG Simulator */}
          <BafoegSimulator />

          {/* BBiG Abschlussbezeichnungen */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-6 space-y-4">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#123E8A] bg-blue-50 px-2.5 py-1 rounded-md">
                  <Award className="w-3.5 h-3.5" />
                  Novellierung des Berufsbildungsgesetzes (BBiG)
                </span>
                <h2 className="font-display text-2xl font-bold text-slate-900">
                  Neue Bezeichnungen: Bachelor Professional &amp; Master Professional
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Die höherqualifizierende Berufsbildung macht die Gleichwertigkeit von beruflicher und akademischer Bildung auch international sichtbar:
                </p>
                <div className="space-y-2.5 text-sm">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <strong>Stufe 1: Geprüfte/r Berufsspezialist/-in</strong> (z. B. Servicetechnik)
                  </div>
                  <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200">
                    <strong>Stufe 2: Bachelor Professional (DQR 6)</strong> – z. B. Meister/-in, Fachwirt/-in (gleichwertig mit Bachelor-Hochschulabschlüssen)
                  </div>
                  <div className="p-3 rounded-xl bg-[#0F2D63] text-white">
                    <strong>Stufe 3: Master Professional (DQR 7)</strong> – z. B. Geprüfte/r Technische(r) Betriebswirt/-in (gleichwertig mit Master-Abschlüssen)
                  </div>
                </div>
                <a
                  href="/downloads/neue-englische-ihk-abschlussbezeichnungen.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#123E8A] hover:underline"
                >
                  <FileDown className="w-4 h-4" />
                  Neue englische IHK-Abschlussbezeichnungen (PDF)
                </a>
              </div>

              <div className="lg:col-span-6">
                <img
                  src="/images/bbig-bezeichnungen.jpg"
                  alt="Übersicht der BBiG-Stufen Berufsspezialist, Bachelor Professional und Master Professional (Quelle BMBF)"
                  className="w-full rounded-xl border border-slate-200 shadow-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
