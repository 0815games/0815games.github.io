import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, SlidersHorizontal, X } from 'lucide-react';

export default function CookieConsent({ isOpen, onClose, consent, onSaveConsent }) {
  const [showDetails, setShowDetails] = useState(false);
  const [analytics, setAnalytics] = useState(consent?.analytics ?? false);
  const [marketing, setMarketing] = useState(consent?.marketing ?? false);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Datenschutz- und Cookie-Einstellungen"
      className="fixed inset-x-0 bottom-0 z-50 p-4 sm:p-6 pointer-events-none"
    >
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 sm:p-6 pointer-events-auto">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#123E8A] flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-slate-900 text-base">
                Deine Privatsphäre ist uns wichtig
              </h2>
              <p className="text-xs text-slate-500">
                DSGVO- &amp; TDDDG-konform: Ohne deine aktive Zustimmung werden keine Tracking-Skripte geladen.
              </p>
            </div>
          </div>
          {consent && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Schließen"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <p className="mt-3 text-sm text-slate-600 leading-relaxed">
          Wir nutzen technisch notwendige Speicherfunktionen für den Betrieb dieser Website. Optionale Statistik- oder Marketing-Dienste werden erst nach deiner ausdrücklichen Einwilligung aktiviert. Weitere Infos findest du in unserer{' '}
          <Link to="/datenschutz" className="text-[#123E8A] font-semibold underline hover:text-blue-800">
            Datenschutzerklärung
          </Link>
          .
        </p>

        {showDetails && (
          <div className="mt-4 space-y-3 bg-slate-50 rounded-xl p-4 border border-slate-200 text-sm">
            <label className="flex items-start justify-between gap-3">
              <div>
                <span className="font-semibold text-slate-900 block">Technisch erforderlich</span>
                <span className="text-xs text-slate-500">Speichert deine Cookie-Auswahl und sorgt für sichere Seitennavigation.</span>
              </div>
              <input type="checkbox" checked disabled className="mt-1 h-4 w-4 accent-[#123E8A]" />
            </label>

            <label className="flex items-start justify-between gap-3 cursor-pointer">
              <div>
                <span className="font-semibold text-slate-900 block">Statistik &amp; Reichweite (Optional)</span>
                <span className="text-xs text-slate-500">Hilft uns anonymisiert zu verstehen, welche Lehrgänge besonders gefragt sind.</span>
              </div>
              <input
                type="checkbox"
                checked={analytics}
                onChange={(e) => setAnalytics(e.target.checked)}
                className="mt-1 h-4 w-4 accent-[#123E8A]"
              />
            </label>

            <label className="flex items-start justify-between gap-3 cursor-pointer">
              <div>
                <span className="font-semibold text-slate-900 block">Marketing (Optional)</span>
                <span className="text-xs text-slate-500">Ermöglicht die Messung von Werbekampagnen (erst nach Opt-in aktiv).</span>
              </div>
              <input
                type="checkbox"
                checked={marketing}
                onChange={(e) => setMarketing(e.target.checked)}
                className="mt-1 h-4 w-4 accent-[#123E8A]"
              />
            </label>
          </div>
        )}

        <div className="mt-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={() => setShowDetails((s) => !s)}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-semibold cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4" />
            {showDetails ? 'Details ausblenden' : 'Einstellungen'}
          </button>

          <button
            type="button"
            onClick={() => onSaveConsent({ essential: true, analytics: false, marketing: false })}
            className="px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-semibold cursor-pointer"
          >
            Nur essenzielle
          </button>

          {showDetails ? (
            <button
              type="button"
              onClick={() => onSaveConsent({ essential: true, analytics, marketing })}
              className="px-5 py-2.5 rounded-xl bg-[#123E8A] hover:bg-blue-800 text-white text-sm font-semibold cursor-pointer"
            >
              Auswahl speichern
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onSaveConsent({ essential: true, analytics: true, marketing: true })}
              className="px-5 py-2.5 rounded-xl bg-[#123E8A] hover:bg-blue-800 text-white text-sm font-semibold cursor-pointer"
            >
              Alle akzeptieren
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
