import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Phone, ShieldAlert, TrendingUp } from 'lucide-react';
import { usePageMeta } from '../hooks/usePageMeta';
import { brandInfo, courses } from '../data/siteData';
import BafoegSimulator from '../components/BafoegSimulator';

export default function WeiterbildungPage() {
  usePageMeta(
    'Weiterbildung im Überblick – Dein Abschluss. Dein Gehalt. Deine Sicherheit.',
    'Alle IHK-Weiterbildungen bei @Learning im Vergleich: Industriemeister, Technischer Fachwirt, Wirtschaftsfachwirt und Technischer Betriebswirt – DQR 6 & 7.'
  );

  return (
    <div>
      {/* Hero */}
      <section className="bg-[#0F2D63] text-white py-14 sm:py-20 bg-tech-grid-dark">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold text-sky-200 mb-4">
            IHK-Aufstiegsfortbildung in Plochingen &amp; Reutlingen
          </span>
          <h1 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Dein Abschluss. Dein Gehalt.{' '}
            <span className="text-sky-300">Deine Sicherheit.</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-blue-100 max-w-2xl mx-auto leading-relaxed">
            Wir bereiten dich gezielt auf die Industriemeister-, Fachwirt- und Betriebswirt-Prüfung vor. Ein IHK-Abschluss ist keine Ausgabe, sondern die beste Investition in deine Karriere.
          </p>
          <div className="mt-7 flex flex-col sm:flex-row justify-center gap-3">
            <a
              href={`tel:${brandInfo.phoneMainRaw}`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white text-[#0F2D63] hover:bg-blue-50 font-bold text-sm sm:text-base shadow-md transition-colors"
            >
              <Phone className="w-4 h-4" />
              Jetzt anrufen: {brandInfo.phoneMain}
            </a>
            <Link
              to="/kontakt"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-blue-800/70 hover:bg-blue-800 text-white border border-blue-400/30 font-semibold text-sm sm:text-base transition-colors"
            >
              Beratungstermin buchen
            </Link>
          </div>
        </div>
      </section>

      {/* Problem statement */}
      <section className="py-14 sm:py-16 bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-6 sm:p-10">
            <div className="flex items-center gap-2 text-amber-700 font-bold text-xs uppercase tracking-wider mb-2">
              <ShieldAlert className="w-4 h-4" />
              Worauf es wirklich ankommt
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900">
              Du kommst nicht hierher, um zu scheitern.
            </h2>
            <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed">
              Die meisten fallen nicht durch, weil sie zu wenig können. Sie fallen durch, weil sie <strong>falsch vorbereitet</strong> werden: zu große Kurse, unklare Lernpläne, Dozenten ohne Praxis und keine individuelle Betreuung. Genau das ist bei uns anders.
            </p>
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {['Kleine Gruppen', 'Berufsbegleitend', 'Gezielte Prüfungsvorbereitung', 'Wochenend- & Vollzeitkurse'].map(
                (item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3.5 py-3 text-xs sm:text-sm font-semibold text-slate-800"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#123E8A] shrink-0" />
                    <span>{item}</span>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Alle 7 Abschlüsse */}
      <section className="py-14 sm:py-16 bg-tech-grid">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900">
              Unsere 7 IHK-Abschlüsse im Vergleich
            </h2>
            <p className="text-slate-600 mt-2 text-sm sm:text-base">
              Zugeordnet im Deutschen Qualifikationsrahmen auf Bachelor-Niveau (DQR 6) oder Master-Niveau (DQR 7).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div
                key={course.slug}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="font-mono-tech text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-[#123E8A] border border-blue-100">
                      {course.code} · {course.totalUE}
                    </span>
                    <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
                      {course.dqr}
                    </span>
                  </div>
                  <h3 className="font-display text-lg font-bold text-slate-900">{course.title}</h3>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">{course.summary}</p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    to={`/lehrgaenge/${course.slug}`}
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-[#123E8A] hover:underline"
                  >
                    Mehr erfahren <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    to="/termine"
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                  >
                    Termine →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4 Schritte */}
      <section className="py-14 sm:py-16 bg-white border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 text-center mb-10">
            In 4 klaren Schritten von der Beratung bis zum Titel
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { n: '01', t: 'Kostenlose Beratung & Anmeldung', d: 'Wir prüfen gemeinsam deine IHK-Zulassungsvoraussetzungen und wählen den optimalen Kurs.' },
              { n: '02', t: 'Bis zu 75 % staatlich gefördert', d: '100 % förderfähig über Aufstiegs-BAföG & KfW – alle Formulare füllen wir zusammen aus.' },
              { n: '03', t: 'Kursstart & Prüfungsvorbereitung', d: 'Praxisnaher Präsenzunterricht in kleinen Gruppen mit regelmäßigen Lernkontrollen.' },
              { n: '04', t: 'Dein Abschluss mit Titel', d: 'Bestens vorbereitet in die IHK-Prüfung – auf Bachelor- (DQR 6) oder Master-Niveau (DQR 7).' },
            ].map((s) => (
              <div key={s.n} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <span className="font-mono-tech text-2xl font-extrabold text-[#123E8A]">{s.n}</span>
                <h3 className="font-display font-bold text-slate-900 mt-2 text-base">{s.t}</h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>

          <div className="mt-12">
            <BafoegSimulator />
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-14 bg-[#0B224D] text-white text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <TrendingUp className="w-8 h-8 text-sky-300 mx-auto mb-3" />
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold">
            Was passiert, wenn du nichts änderst?
          </h2>
          <p className="mt-3 text-blue-100 text-sm sm:text-base">
            Gleiches Gehalt. Gleiche Position. Gleiche Unsicherheit. Oder du startest jetzt und wir klären gemeinsam in einem kostenlosen Gespräch, welcher Weg am besten zu dir passt.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
            <Link
              to="/kontakt"
              className="px-6 py-3.5 rounded-xl bg-white text-[#0F2D63] font-bold text-sm hover:bg-blue-50 transition-colors"
            >
              Jetzt Beratung vereinbaren
            </Link>
            <Link
              to="/termine"
              className="px-6 py-3.5 rounded-xl border border-blue-400/40 text-white font-semibold text-sm hover:bg-blue-900/50 transition-colors"
            >
              Nächste Kursstarts ansehen
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
