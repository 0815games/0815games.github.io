import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Layers, Award, Clock } from 'lucide-react';
import { usePageMeta } from '../hooks/usePageMeta';
import { kombiModel, aevoData } from '../data/siteData';

export function KombimodellPage() {
  usePageMeta(
    'Kombimodell: In 1,5 Jahren zum Technischen Betriebswirt',
    'Kombiniere Industriemeister oder Technischen Fachwirt mit dem Technischen Betriebswirt und spare ca. ein halbes Jahr durch überlappenden Unterricht.'
  );

  return (
    <div>
      <section className="bg-gradient-to-br from-[#0B224D] to-[#16428F] text-white py-14 sm:py-18 bg-tech-grid-dark">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-300/30 text-amber-200 text-xs font-bold uppercase tracking-wider mb-4">
            <Layers className="w-3.5 h-3.5" />
            Fast-Track zum DQR Niveau 7
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">
            {kombiModel.title}
          </h1>
          <p className="mt-3 text-base sm:text-lg text-blue-100 max-w-3xl">
            {kombiModel.subtitle} – bei vollen preislichen Vorteilen.
          </p>
        </div>
      </section>

      <section className="py-14 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          {/* Options */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            <h2 className="font-display text-xl font-bold text-slate-900 mb-4">
              Zwei Kombinationen stehen zur Wahl:
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {kombiModel.options.map((opt) => (
                <div key={opt} className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#123E8A] shrink-0 mt-0.5" />
                  <span className="font-semibold text-slate-900 text-sm sm:text-base">{opt}</span>
                </div>
              ))}
            </div>
            <p className="mt-5 text-sm sm:text-base text-slate-600 leading-relaxed">
              {kombiModel.explanation}
            </p>
          </div>

          {/* 5 Steps */}
          <div>
            <h2 className="font-display text-2xl font-extrabold text-slate-900 mb-6">
              Der Ablauf in 5 Schritten
            </h2>
            <div className="space-y-4">
              {kombiModel.steps.map((s) => (
                <div
                  key={s.step}
                  className="bg-white rounded-2xl border border-slate-200 p-5 flex items-start gap-4 shadow-sm"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#123E8A] text-white font-mono-tech font-bold flex items-center justify-center shrink-0">
                    {s.step}
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-slate-900 text-base">{s.title}</h3>
                    <p className="text-sm text-slate-600 mt-1">{s.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/termine"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#123E8A] hover:bg-blue-800 text-white font-semibold text-sm"
            >
              Passende Starttermine ansehen <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/kontakt"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm"
            >
              Beratung zum Kombimodell anfragen
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export function AevoPage() {
  usePageMeta(
    'AEVO Sonderkurse – Ausbildung der Ausbilder (Ausbilderschein)',
    'Vorbereitung auf die bundesweit einheitliche IHK-Ausbildereignungsprüfung (AEVO) in 50 UE sowie 10-UE-Praxis-Sonderkurse für Fachwirte.'
  );

  return (
    <div>
      <section className="bg-gradient-to-br from-[#0B224D] to-[#16428F] text-white py-14 sm:py-18 bg-tech-grid-dark">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-sky-200 text-xs font-bold uppercase tracking-wider mb-4">
            <Award className="w-3.5 h-3.5" />
            Ausbilderschein (IHK)
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">
            {aevoData.title}
          </h1>
          <p className="mt-3 text-base sm:text-lg text-blue-100 max-w-3xl">
            {aevoData.subtitle}
          </p>
        </div>
      </section>

      <section className="py-14 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
            <p className="text-slate-700 leading-relaxed">{aevoData.description}</p>
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-950 font-medium">
              {aevoData.noteFachwirte}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {aevoData.modules.map((m) => (
              <div key={m.part} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <span className="font-mono-tech text-xs font-bold px-2.5 py-1 rounded bg-blue-50 text-[#123E8A]">
                  {m.ue}
                </span>
                <h2 className="font-display font-bold text-slate-900 text-lg mt-3">{m.part}</h2>
              </div>
            ))}
          </div>

          <div className="bg-[#0F2D63] text-white rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-300 uppercase">
                <Clock className="w-3.5 h-3.5" />
                {aevoData.sonderkursUE}
              </p>
              <h3 className="font-display text-xl font-bold mt-1">
                Sonderkurs praktischer Teil (10 UE) auf Anfrage
              </h3>
              <p className="text-sm text-blue-100 mt-1">
                Ideal für Technische Fachwirte und Wirtschaftsfachwirte zur gezielten Prüfungsvorbereitung.
              </p>
            </div>
            <Link
              to="/kontakt"
              className="px-5 py-3 rounded-xl bg-white text-[#0F2D63] font-bold text-sm hover:bg-blue-50 shrink-0"
            >
              Termin anfragen
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
