import React, { useState } from 'react';
import { Calculator, Info } from 'lucide-react';

export default function BafoegSimulator() {
  const [fee, setFee] = useState(4800);

  const zuschuss = Math.round(fee * 0.5);
  const kfwLoan = fee - zuschuss;
  const erlass = Math.round(kfwLoan * 0.5);
  const finalOwnShare = fee - zuschuss - erlass;

  const eur = (val) => val.toLocaleString('de-DE') + ' €';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#123E8A] bg-blue-50 px-2.5 py-1 rounded-md">
            <Calculator className="w-3.5 h-3.5" />
            Förder-Rechner (Aufstiegs-BAföG)
          </span>
          <h3 className="font-display text-xl sm:text-2xl font-bold text-slate-900 mt-2">
            So rechnet sich die 75-%-Förderung für dich
          </h3>
        </div>
      </div>

      <p className="mt-2 text-sm text-slate-600">
        Alle anerkannten IHK-Kurse sind nach dem Aufstiegs-BAföG förderfähig. Schiebe den Regler auf eine Beispielgebühr, um den Effekt von Zuschuss und KfW-Prüfungserlass sofort zu sehen:
      </p>

      {/* Slider */}
      <div className="mt-6 bg-slate-50 rounded-xl p-4 sm:p-5 border border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="bafoeg-slider" className="text-sm font-semibold text-slate-700">
            Beispielhafte Kurs- &amp; Prüfungsgebühr:
          </label>
          <span className="font-mono-tech text-xl font-bold text-[#123E8A]">{eur(fee)}</span>
        </div>
        <input
          id="bafoeg-slider"
          type="range"
          min="2000"
          max="8000"
          step="200"
          value={fee}
          onChange={(e) => setFee(Number(e.target.value))}
          className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-[#123E8A]"
        />
        <div className="flex justify-between text-xs text-slate-400 mt-1 font-mono-tech">
          <span>2.000 €</span>
          <span>5.000 €</span>
          <span>8.000 €</span>
        </div>
      </div>

      {/* Breakdown cards */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-100">
          <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide">1. Direkter Zuschuss (50 %)</p>
          <p className="font-mono-tech text-2xl font-bold text-[#123E8A] mt-1">{eur(zuschuss)}</p>
          <p className="text-xs text-slate-600 mt-1">Vom Staat erstattet – nicht rückzahlbar.</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">2. KfW-Kredit (50 %)</p>
          <p className="font-mono-tech text-2xl font-bold text-slate-800 mt-1">{eur(kfwLoan)}</p>
          <p className="text-xs text-slate-600 mt-1">Zinsloser Zweijahreskredit der KfW-Bank.</p>
        </div>

        <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
          <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide">3. Prüfungserlass (50 %)</p>
          <p className="font-mono-tech text-2xl font-bold text-emerald-700 mt-1">− {eur(erlass)}</p>
          <p className="text-xs text-slate-600 mt-1">Auf das KfW-Darlehen bei bestandener Prüfung.</p>
        </div>

        <div className="p-4 rounded-xl bg-[#0F2D63] text-white border border-blue-900">
          <p className="text-xs font-semibold text-amber-300 uppercase tracking-wide">Dein Eigenanteil (25 %)</p>
          <p className="font-mono-tech text-2xl font-bold text-white mt-1">{eur(finalOwnShare)}</p>
          <p className="text-xs text-blue-200 mt-1">75 % übernimmt im Regelfall der Staat.</p>
        </div>
      </div>

      <p className="mt-4 flex items-start gap-2 text-xs text-slate-500">
        <Info className="w-4 h-4 text-[#123E8A] shrink-0 mt-0.5" />
        <span>
          Hinweis: Dies ist ein unverbindliches Rechenbeispiel auf Basis der Regelung seit August 2020 (50 % Zuschuss + 50 % Darlehenserlass bei Abschluss). Die exakten Kursgebühren und deinen persönlichen Förderanspruch besprechen wir kostenlos in deiner Beratung – die Anträge füllen wir gemeinsam mit dir aus.
        </span>
      </p>
    </div>
  );
}
