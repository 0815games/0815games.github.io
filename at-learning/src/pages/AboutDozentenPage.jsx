import React from 'react';
import { Award, Briefcase, CheckCircle2, ExternalLink, HeartHandshake, Mail, MapPin, Phone } from 'lucide-react';
import { usePageMeta } from '../hooks/usePageMeta';
import { brandInfo, communityEvents, dozentenData } from '../data/siteData';

export default function AboutDozentenPage() {
  usePageMeta(
    'Über @Learning, Standorte & Dozentensuche',
    'Seit 2006 erfolgreicher Bildungsträger für IHK-Weiterbildungen in Plochingen und Reutlingen. Inhaber Tim Ohnmeiss MSc, soziales Engagement und Bewerbung als Dozent.'
  );

  return (
    <div>
      <section className="bg-gradient-to-br from-[#0B224D] to-[#16428F] text-white py-12 sm:py-16 bg-tech-grid-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-sky-200 text-xs font-bold uppercase tracking-wider mb-3">
            Seit 2006 · Plochingen &amp; Reutlingen
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">
            Über @Learning &amp; unser Dozententeam
          </h1>
          <p className="mt-3 text-blue-100 max-w-2xl text-sm sm:text-base">
            Erfahrene Praxistrainer, persönliche Atmosphäre in kleinen Gruppen und über 20 Jahre Erfahrung in der IHK-Erwachsenenbildung.
          </p>
        </div>
      </section>

      <section className="py-12 sm:py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Story & Leadership (nur echte Fotos von @Learning) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <h2 className="font-display text-2xl font-bold text-slate-900">
                Aus der Praxis für die industrielle Führungsebene
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Gegründet am <strong>27. November 2006</strong> in Plochingen, hat sich <strong>@Learning</strong> zum größten und erfolgreichsten Bildungsträger für Industriemeister-Weiterbildungen in Baden-Württemberg entwickelt. Über <strong>25 % aller Industriemeister Metall</strong> im Land legen ihren Titel bei uns ab.
              </p>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Seit <strong>2026</strong> wird das Bildungszentrum von <strong>{brandInfo.owner}</strong> als alleinigem Inhaber geführt – mit dem klaren Fokus auf persönlichen Präsenzunterricht, individuelle Betreuung (16–20 Teilnehmer pro Kurs) und der Erweiterung um den neuen Präsenzstandort in <strong>Reutlingen</strong>.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                    <MapPin className="w-4 h-4 text-[#123E8A]" />
                    Standort Plochingen
                  </div>
                  <p className="text-xs text-slate-600 mt-1">Robert-Bosch-Straße 7–9, 73207 Plochingen</p>
                </div>
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                    <MapPin className="w-4 h-4 text-[#123E8A]" />
                    Standort Reutlingen
                  </div>
                  <p className="text-xs text-slate-600 mt-1">Auchtertstraße 8, 72770 Reutlingen</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-4">
              <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
                <img
                  src="/images/oktoberfest-2025-3.jpg"
                  alt="Das Führungsteam von @Learning im Gebäude in Plochingen"
                  className="w-full h-72 object-cover object-top"
                />
                <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 text-xs text-slate-600">
                  Persönlich &amp; nahbar: Das @Learning-Team am Standort Plochingen (Oktoberfest 2025).
                </div>
              </div>
              <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <img
                  src="/images/plochingen-gebaeude.jpg"
                  alt="Schulungsgebäude von @Learning in der Robert-Bosch-Straße in Plochingen"
                  className="w-24 h-16 object-cover rounded-lg border border-slate-200 shrink-0"
                />
                <div className="text-xs text-slate-600">
                  <p className="font-bold text-slate-900">Hauptsitz Plochingen</p>
                  <p>Klimatisierte Räume &amp; eigene Lernplätze unter der Woche.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Dozentensuche */}
          <div id="dozenten" className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-6">
              <div>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#123E8A] bg-blue-50 px-2.5 py-1 rounded-md">
                  <Briefcase className="w-3.5 h-3.5" />
                  Karriere &amp; Lehre
                </span>
                <h2 className="font-display text-2xl font-bold text-slate-900 mt-2">
                  Verstärkung für unser Dozententeam gesucht (Präsenz)
                </h2>
                <p className="text-sm text-slate-600 mt-1 max-w-3xl">{dozentenData.intro}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div>
                <h3 className="font-display font-bold text-slate-900 text-sm uppercase tracking-wider mb-3">
                  Gesuchte IHK-Fächer
                </h3>
                <ul className="space-y-2 text-sm text-slate-700">
                  {dozentenData.subjects.map((s) => (
                    <li key={s} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#123E8A] shrink-0 mt-0.5" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-display font-bold text-slate-900 text-sm uppercase tracking-wider mb-3">
                  Was du mitbringen solltest
                </h3>
                <ul className="space-y-2 text-sm text-slate-700">
                  {dozentenData.requirements.map((r) => (
                    <li key={r} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#123E8A] shrink-0 mt-2" />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-5 flex flex-col justify-between">
                <div>
                  <h3 className="font-display font-bold text-slate-900 text-sm uppercase tracking-wider mb-3">
                    Was wir dir bieten
                  </h3>
                  <ul className="space-y-2 text-sm text-slate-700">
                    {dozentenData.benefits.map((b) => (
                      <li key={b} className="flex items-start gap-2">
                        <Award className="w-4 h-4 text-[#123E8A] shrink-0 mt-0.5" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 pt-4 border-t border-blue-200 space-y-2 text-xs sm:text-sm">
                  <p className="font-bold text-slate-900">Bewerbung bitte mit Unterlagen &amp; Vita an:</p>
                  <a
                    href={`mailto:${brandInfo.emailPrimary}?subject=Dozentenbewerbung%20%40Learning`}
                    className="flex items-center gap-2 text-[#123E8A] font-semibold hover:underline"
                  >
                    <Mail className="w-4 h-4" />
                    {brandInfo.emailPrimary}
                  </a>
                  <a
                    href={`tel:${brandInfo.phoneMainRaw}`}
                    className="flex items-center gap-2 text-slate-700 font-semibold hover:text-[#123E8A]"
                  >
                    <Phone className="w-4 h-4" />
                    {brandInfo.phoneMain} / -221
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Soziales Engagement & Gemeinschaft mit echten Fotos */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <div className="flex items-center gap-2 text-[#123E8A] font-bold text-xs uppercase tracking-wider mb-2">
                <HeartHandshake className="w-4 h-4" />
                Gemeinschaft &amp; Soziales Engagement
              </div>
              <h2 className="font-display text-2xl font-bold text-slate-900">
                Sonderaktionen &amp; Rückblick
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {communityEvents.map((ev) => (
                <div key={ev.title} className="p-5 rounded-xl border border-slate-200 bg-slate-50/70">
                  <span className="font-mono-tech text-xs font-bold text-[#123E8A]">{ev.date}</span>
                  <h3 className="font-display font-bold text-slate-900 text-base mt-1">{ev.title}</h3>
                  <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">{ev.desc}</p>
                  {ev.link && (
                    <a
                      href={ev.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#123E8A] hover:underline"
                    >
                      Bericht bei der Olgäle-Stiftung ansehen <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              ))}
            </div>

            {/* Echte Impressionen */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                <img
                  src="/images/olgaele-spende-2021.jpg"
                  alt="Scheckübergabe über 3.000 Euro von @Learning an die Olgäle-Stiftung Stuttgart"
                  className="w-full h-52 object-cover object-top"
                />
                <p className="p-3 text-xs text-slate-600 font-medium">
                  Spendenübergabe 3.000 € an die Olgäle-Stiftung (2021)
                </p>
              </div>
              <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                <img
                  src="/images/oktoberfest-2025-1.jpg"
                  alt="Inhaber Tim Ohnmeiss beim @Learning Oktoberfest 2025 in Plochingen"
                  className="w-full h-52 object-cover object-top"
                />
                <p className="p-3 text-xs text-slate-600 font-medium">
                  Inhaber Tim Ohnmeiss beim @Learning Oktoberfest 2025
                </p>
              </div>
              <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                <img
                  src="/images/oktoberfest-2025-2.jpg"
                  alt="Dekoration beim @Learning Oktoberfest 2025"
                  className="w-full h-52 object-cover"
                />
                <p className="p-3 text-xs text-slate-600 font-medium">
                  Gemeinsamer Austausch beim Oktoberfest 2025 in Plochingen
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
