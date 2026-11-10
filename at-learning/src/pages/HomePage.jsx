import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Award,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  ShieldCheck,
  Calendar,
  ChevronDown,
  Sparkles,
  FileDown,
} from 'lucide-react';
import { usePageMeta } from '../hooks/usePageMeta';
import { brandInfo, courses, newsHighlights, benefitsList, faqs } from '../data/siteData';

export default function HomePage() {
  usePageMeta(
    'IHK-Weiterbildung in Plochingen & Reutlingen',
    'Berufsbegleitende und Vollzeit IHK-Weiterbildung in Plochingen & Reutlingen: Industriemeister, Technischer Fachwirt, Wirtschaftsfachwirt & Technischer Betriebswirt. DIN EN ISO 9001:2015 zertifiziert.'
  );

  const [openFaq, setOpenFaq] = useState(0);

  const featuredCourses = courses.slice(0, 4);

  return (
    <div>
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0A1F44] via-[#0F2D63] to-[#16428F] text-white">
        <div className="absolute inset-0 bg-tech-grid-dark pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 lg:py-22">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-300/30 text-amber-200 text-xs font-semibold">
                  <Award className="w-3.5 h-3.5" />
                  DIN EN ISO 9001:2015 zertifiziert seit 2006
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-400/15 border border-blue-300/30 text-blue-100 text-xs font-semibold">
                  <MapPin className="w-3.5 h-3.5" />
                  Plochingen &amp; Reutlingen (Präsenz)
                </span>
              </div>

              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-[1.12] tracking-tight">
                Dein sicherer Weg zum{' '}
                <span className="text-sky-300">IHK-Meister, Fachwirt &amp; Betriebswirt</span>
              </h1>

              <p className="text-base sm:text-lg text-blue-100 leading-relaxed max-w-2xl">
                Du bist Facharbeiter, Industriemechaniker oder Elektroniker und willst beruflich aufsteigen? Bei <strong className="text-white">@Learning</strong> erwirbst du in einem Jahr am Wochenende (oder in Vollzeit) deinen anerkannten IHK-Abschluss – praxisnah, prüfungsorientiert und im echten Präsenzunterricht.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl p-3.5">
                  <p className="font-mono-tech text-xl font-bold text-white">&gt; 25 %</p>
                  <p className="text-xs text-blue-200 mt-0.5">aller IM Metall in BW bei uns ausgebildet</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl p-3.5">
                  <p className="font-mono-tech text-xl font-bold text-sky-300">16–20</p>
                  <p className="text-xs text-blue-200 mt-0.5">Teilnehmer pro Kurs · 40 Dozenten</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl p-3.5">
                  <p className="font-mono-tech text-xl font-bold text-amber-300">75 %</p>
                  <p className="text-xs text-blue-200 mt-0.5">Förderung durch Aufstiegs-BAföG &amp; KfW</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <Link
                  to="/kontakt"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white text-[#0F2D63] hover:bg-blue-50 font-bold text-sm sm:text-base shadow-lg transition-colors"
                >
                  Kostenlose Beratung vereinbaren
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/termine"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-blue-800/60 hover:bg-blue-800 text-white border border-blue-400/30 font-semibold text-sm sm:text-base transition-colors"
                >
                  <Calendar className="w-4 h-4" />
                  Kursstarts 2026 / 2027 ansehen
                </Link>
              </div>
            </div>

            {/* Right: Real Campus + Quick Course Compass (no fake images) */}
            <div className="lg:col-span-5">
              <div className="bg-white text-slate-900 rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
                {/* Real Plochingen building header */}
                <div className="relative h-44 bg-slate-900">
                  <img
                    src="/images/plochingen-gebaeude.jpg"
                    alt="Bildungszentrum @Learning in der Robert-Bosch-Straße 7–9 in Plochingen"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent flex items-end p-4">
                    <div>
                      <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-400 text-slate-950 mb-1">
                        Hauptsitz Plochingen &amp; Standort Reutlingen
                      </span>
                      <p className="text-sm font-bold text-white">
                        Robert-Bosch-Straße 7–9 · 73207 Plochingen
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick Course Selector */}
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#123E8A]">
                      Schnelleinstieg Lehrgänge
                    </p>
                    <span className="font-mono-tech text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      Start Nov. 2026
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {featuredCourses.map((c) => (
                      <Link
                        key={c.slug}
                        to={`/lehrgaenge/${c.slug}`}
                        className="py-2.5 flex items-center justify-between gap-2 group hover:bg-blue-50/50 px-2 -mx-2 rounded-lg transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="font-mono-tech text-[11px] font-bold px-2 py-0.5 rounded bg-[#0F2D63] text-white shrink-0">
                            {c.code}
                          </span>
                          <span className="text-sm font-semibold text-slate-800 group-hover:text-[#123E8A] truncate">
                            {c.shortTitle}
                          </span>
                        </div>
                        <span className="font-mono-tech text-xs text-slate-500 shrink-0 inline-flex items-center gap-1">
                          {c.totalUE} <ArrowRight className="w-3.5 h-3.5 text-[#123E8A]" />
                        </span>
                      </Link>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <Link to="/weiterbildung" className="font-bold text-[#123E8A] hover:underline">
                      Alle 7 Abschlüsse + Kombimodell →
                    </Link>
                    <a
                      href={`tel:${brandInfo.phoneMainRaw}`}
                      className="font-mono-tech font-bold text-slate-700 hover:text-[#123E8A]"
                    >
                      {brandInfo.phoneMain}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AKTUELLES & NEWS STRIP */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {newsHighlights.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 flex flex-col justify-between hover:border-blue-300 transition-colors"
              >
                <div>
                  <span className="inline-block text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-blue-100 text-[#123E8A]">
                    {item.badge}
                  </span>
                  <h2 className="font-display font-bold text-slate-900 text-base mt-2">
                    {item.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                    {item.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LEHRGÄNGE OVERVIEW */}
      <section className="py-16 sm:py-20 bg-tech-grid">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#123E8A]">
                Unser Kursangebot (IHK)
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                Welcher Abschluss bringt dich weiter?
              </h2>
              <p className="text-slate-600 mt-2 max-w-2xl text-sm sm:text-base">
                Alle Lehrgänge finden im intensiven Präsenzunterricht statt – berufsbegleitend am Wochenende oder in Vollzeit.
              </p>
            </div>
            <Link
              to="/weiterbildung"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-[#123E8A] hover:underline shrink-0"
            >
              Zur detaillierten Vergleichsseite <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Link
                key={course.slug}
                to={`/lehrgaenge/${course.slug}`}
                className="group bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-blue-400 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="font-mono-tech text-xs font-bold px-2.5 py-1 rounded-lg bg-[#0F2D63] text-white">
                      {course.code}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                      {course.dqr}
                    </span>
                  </div>
                  <h3 className="font-display text-lg font-bold text-slate-900 group-hover:text-[#123E8A] transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed line-clamp-3">
                    {course.summary}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="font-mono-tech font-semibold text-slate-700">
                    Umfang: {course.totalUE}
                  </span>
                  <span className="font-semibold text-[#123E8A] inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Lehrplan &amp; Termine <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            ))}

            {/* Special Card: Kombimodell */}
            <Link
              to="/lehrgaenge/kombimodell"
              className="group bg-gradient-to-br from-[#0F2D63] to-[#1A4BA0] text-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="font-mono-tech text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950">
                    KOMBI
                  </span>
                  <span className="text-xs font-semibold text-blue-100 bg-white/10 px-2.5 py-1 rounded-md">
                    ca. 6 Monate schneller
                  </span>
                </div>
                <h3 className="font-display text-lg font-bold">
                  Kombimodell: Meister / TFW + Technischer Betriebswirt
                </h3>
                <p className="text-sm text-blue-100 mt-2 leading-relaxed">
                  In nur 1,5 Jahren vom Facharbeiter oder Ungelernten bis zum Geprüften Technischen Betriebswirt (DQR 7) durch überlappenden Unterricht.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-white/15 flex items-center justify-between text-xs font-semibold text-amber-300">
                <span>5 Schritte zum Kombimodell</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>

            {/* Special Card: AEVO */}
            <Link
              to="/lehrgaenge/aevo"
              className="group bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-blue-400 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="font-mono-tech text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-800 text-white">
                    AEVO
                  </span>
                  <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                    50 UE · Sonderkurs 10 UE
                  </span>
                </div>
                <h3 className="font-display text-lg font-bold text-slate-900 group-hover:text-[#123E8A] transition-colors">
                  Ausbildung der Ausbilder (AEVO / Ausbilderschein)
                </h3>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  Bundesweit anerkannte Ausbildereignungsprüfung der IHK – inklusive Sonderkursen für den praktischen Prüfungsteil für Fachwirte.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="font-mono-tech font-semibold text-slate-700">In IM-Kursen bereits enthalten</span>
                <span className="font-semibold text-[#123E8A] inline-flex items-center gap-1">
                  Details <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* WARUM @LEARNING (mit echten Fakten & Original-Marke/Team-Foto) */}
      <section className="py-16 sm:py-20 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            <div className="lg:col-span-5 space-y-5">
              {/* Real Team / Brand Box */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-4">
                <div className="bg-white rounded-xl p-4 border border-slate-200 flex items-center justify-center">
                  <img
                    src="/images/at-learning-logo-orig.jpg"
                    alt="Original-Logo des Bildungszentrums @Learning in Plochingen"
                    className="max-h-16 w-auto object-contain"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <p className="font-mono-tech text-2xl font-extrabold text-[#123E8A]">850 UE</p>
                    <p className="text-xs text-slate-600 mt-1">
                      statt ca. 1.200 UE IHK-Empfehlung beim Meister
                    </p>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <p className="font-mono-tech text-2xl font-extrabold text-[#123E8A]">1 Jahr</p>
                    <p className="text-xs text-slate-600 mt-1">
                      berufsbegleitend am Wochenende zum Abschluss
                    </p>
                  </div>
                </div>

                <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 space-y-2">
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-[#123E8A] shrink-0 mt-0.5" />
                    <div className="text-xs sm:text-sm text-slate-700">
                      <strong className="text-slate-900">Geprüfte Qualität &amp; Bildungszeit:</strong> Seit 2006 nach{' '}
                      <strong>DIN EN ISO 9001:2015</strong> zertifiziert (aktuell 2027–2029) und anerkannter Bildungsträger nach{' '}
                      <strong>§ 10 Abs. 3 BzG BW</strong>.
                    </div>
                  </div>
                  <a
                    href="/downloads/iso-zertifikat-2027-2029.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#123E8A] hover:underline pl-7"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    ISO-Zertifikat 2027–2029 ansehen (PDF)
                  </a>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7">
              <span className="text-xs font-bold uppercase tracking-wider text-[#123E8A]">
                Das @Learning-Prinzip
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                Fordern, fördern, Feedback geben – ohne unnötigen Leerlauf
              </h2>
              <p className="text-slate-600 mt-3 text-sm sm:text-base leading-relaxed">
                Unser Ziel ist klar: <strong>in kurzer Zeitdauer gezielt praxisnahe, prüfungsorientierte Wissensvermittlung ohne Qualitätsverlust.</strong> Darum erreichst du deinen Meister bei uns in 850 UE statt rund 1.200 UE.
              </p>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {benefitsList.map((b) => (
                  <div key={b.title} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-[#123E8A] shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-display font-bold text-slate-900 text-sm">{b.title}</h3>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">{b.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FÖRDERUNG & ZEITEN */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Förderung Box */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                <Sparkles className="w-3.5 h-3.5" />
                Staatliche Förderung
              </span>
              <h2 className="font-display text-2xl font-extrabold text-slate-900 mt-3">
                Bis zu 75 % Ersparnis durch Aufstiegs-BAföG &amp; KfW
              </h2>
              <p className="text-sm sm:text-base text-slate-600 mt-2 leading-relaxed">
                Alle anerkannten IHK-Lehrgänge sind zu 100 % über das Aufstiegs-BAföG förderfähig. Du erhältst <strong>50 % Zuschuss</strong> direkt erstattet und bei bestandener Prüfung weitere <strong>50 % Erlass</strong> auf den zinslosen KfW-Kredit – so bleiben effektiv oft nur <strong>25 % Eigenanteil</strong>.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-slate-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  Wir füllen alle BAföG-Unterlagen gemeinsam mit dir aus
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  Alternativ über das Weiterbildungsstipendium der IHK förderbar
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  Anerkannt für Bildungszeit (Bildungsurlaub) in Baden-Württemberg
                </li>
              </ul>
            </div>
            <div className="mt-6 pt-5 border-t border-slate-100">
              <Link
                to="/leistungen"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#123E8A] hover:bg-blue-800 text-white text-sm font-semibold transition-colors"
              >
                Förder-Rechner &amp; Leistungen öffnen
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Schul- & Bürozeiten Box */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#123E8A] bg-blue-50 px-2.5 py-1 rounded-md">
                <Clock className="w-3.5 h-3.5" />
                Unterrichts- &amp; Beratungszeiten
              </span>
              <h2 className="font-display text-2xl font-extrabold text-slate-900 mt-3">
                Wann du uns erreichst &amp; wann unterrichtet wird
              </h2>

              <div className="mt-4 space-y-4 text-sm">
                <div>
                  <p className="font-bold text-slate-900">Schulbetrieb (Präsenzunterricht):</p>
                  <ul className="mt-1 space-y-1 text-slate-600">
                    {brandInfo.hours.schoolWeekend.map((h) => (
                      <li key={h.label} className="flex justify-between gap-4 border-b border-slate-100 py-1">
                        <span>{h.label}</span>
                        <span className="font-mono-tech text-xs font-semibold text-slate-800">{h.time}</span>
                      </li>
                    ))}
                    {brandInfo.hours.schoolFulltime.map((h) => (
                      <li key={h.label} className="flex justify-between gap-4 py-1">
                        <span>{h.label}</span>
                        <span className="font-mono-tech text-xs font-semibold text-slate-800">{h.time}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="font-bold text-slate-900">Büro &amp; Beratung in Plochingen:</p>
                  <ul className="mt-1 space-y-1 text-slate-600">
                    {brandInfo.hours.officePlochingen.map((h) => (
                      <li key={h.label} className="flex justify-between gap-4 border-b border-slate-100 py-1">
                        <span>{h.label}</span>
                        <span className="font-mono-tech text-xs font-semibold text-slate-800">{h.time}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-slate-500 mt-2">{brandInfo.hours.consultationNote}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap gap-3">
              <a
                href={`tel:${brandInfo.phoneMainRaw}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition-colors"
              >
                <Phone className="w-4 h-4" />
                {brandInfo.phoneMain}
              </a>
              <Link
                to="/kontakt"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-800 text-sm font-semibold transition-colors"
              >
                Zum Kontaktformular
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="py-16 bg-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-[#123E8A]">
              Häufige Fragen
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              Alles Wichtige vor dem Kursstart
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((f, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={f.q}
                  className="rounded-xl border border-slate-200 bg-slate-50/50 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                    className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 font-display font-bold text-slate-900 hover:bg-slate-100/70 transition-colors cursor-pointer"
                  >
                    <span className="text-sm sm:text-base">{f.q}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-slate-500 shrink-0 transition-transform ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 text-sm text-slate-600 leading-relaxed border-t border-slate-200/70 pt-3 bg-white">
                      {f.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
