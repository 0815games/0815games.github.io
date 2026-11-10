import React, { useState } from 'react';
import { BookOpen, Calculator, ExternalLink, FileDown, FolderOpen, ShieldCheck } from 'lucide-react';
import { usePageMeta } from '../hooks/usePageMeta';
import { serviceLinks, bookRecommendations } from '../data/siteData';

export default function ServicePage() {
  usePageMeta(
    'Zulassungsvoraussetzungen, Formulare & Lernhilfen',
    'Alle offiziellen Zulassungs-PDFs, BAföG-Unterlagen, Raumbelegung, ISO-Zertifikat, IHK-Prüfungstermine sowie Taschenrechner- und Gesetzestext-Empfehlungen.'
  );

  const [activeTab, setActiveTab] = useState('zulassungen');

  return (
    <div>
      <section className="bg-gradient-to-br from-[#0B224D] to-[#16428F] text-white py-12 sm:py-16 bg-tech-grid-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-sky-200 text-xs font-bold uppercase tracking-wider mb-3">
            Download-Center &amp; Links
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">
            Zulassungen, Formulare &amp; Lernhilfen
          </h1>
          <p className="mt-3 text-blue-100 max-w-2xl text-sm sm:text-base">
            Alle wichtigen PDF-Merkblätter zu den IHK-Zulassungsvoraussetzungen, Antragsformulare, Prüfungshilfsmittel sowie unsere Buch- und Taschenrechnerempfehlungen auf einen Blick.
          </p>
        </div>
      </section>

      <section className="py-10 sm:py-14 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Tabs */}
          <div className="flex flex-wrap gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
            {[
              { id: 'zulassungen', label: 'Zulassungsvoraussetzungen (9 PDFs)', icon: ShieldCheck },
              { id: 'downloads', label: 'Formulare, BAföG, IHK & Raumbelegung', icon: FolderOpen },
              { id: 'buecher', label: 'Bücher & Taschenrechner', icon: BookOpen },
            ].map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  className={`flex-1 min-w-[200px] inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
                    activeTab === t.id
                      ? 'bg-[#123E8A] text-white shadow-sm'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* TAB 1: ZULASSUNGEN */}
          {activeTab === 'zulassungen' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
              <h2 className="font-display text-2xl font-bold text-slate-900">
                Zulassungsvoraussetzungen der IHK im Überblick
              </h2>
              <p className="text-sm text-slate-600 mt-2">
                Lade dir die Voraussetzungen für deinen Wunsch-Abschluss herunter. Du bist unsicher, ob deine Berufserfahrung ausreicht? Ruf uns einfach an – wir prüfen das kostenlos für dich.
              </p>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {serviceLinks.zulassungen.map((item) => (
                  <a
                    key={item.title}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 transition-all flex items-center justify-between gap-3"
                  >
                    <div>
                      <span className="font-mono-tech text-[11px] font-bold text-[#123E8A] bg-blue-50 px-2 py-0.5 rounded">
                        {item.type}
                      </span>
                      <p className="font-semibold text-slate-900 text-sm mt-2 group-hover:text-[#123E8A]">
                        {item.title}
                      </p>
                    </div>
                    <FileDown className="w-5 h-5 text-slate-400 group-hover:text-[#123E8A] shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: DOWNLOADS & LINKS */}
          {activeTab === 'downloads' && (
            <div className="space-y-6">
              {[
                { heading: 'Anmeldung, Organisation & Zertifikate', items: serviceLinks.formulareUndOrganisation },
                { heading: 'IHK-Prüfung, Hilfsmittel & Lernvideos', items: serviceLinks.ihkUndPruefung },
                { heading: 'Aufstiegs-BAföG, Stipendium & Bildungsurlaub (BW)', items: serviceLinks.foerderungUndBildungszeit },
              ].map((group) => (
                <div key={group.heading} className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
                  <h2 className="font-display text-xl font-bold text-slate-900 mb-4">{group.heading}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {group.items.map((item) => (
                      <a
                        key={item.title}
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 transition-all flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono-tech text-[11px] font-bold px-2 py-1 rounded bg-slate-100 text-slate-700 shrink-0">
                            {item.type}
                          </span>
                          <span className="text-sm font-semibold text-slate-800 group-hover:text-[#123E8A]">
                            {item.title}
                          </span>
                        </div>
                        {item.internal ? (
                          <FileDown className="w-4 h-4 text-slate-400 group-hover:text-[#123E8A] shrink-0" />
                        ) : (
                          <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-[#123E8A] shrink-0" />
                        )}
                      </a>
                    ))}
                  </div>
                </div>
              ))}

              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 text-sm text-slate-700">
                <strong>Hinweis zu den @Learning Lernvideos:</strong> Seit März 2014 stellt @Learning im eigenen YouTube-Kanal ergänzende Lernvideos zu betriebswirtschaftlichen Themen bereit. Diese Videos unterstützen gezielt bei der Prüfungsvorbereitung, ersetzen aber bewusst nicht unseren intensiven Präsenzunterricht.
              </div>
            </div>
          )}

          {/* TAB 3: BÜCHER & TASCHENRECHNER */}
          {activeTab === 'buecher' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
                <h2 className="font-display text-2xl font-bold text-slate-900">
                  Buch- und Taschenrechnerempfehlungen
                </h2>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  {bookRecommendations.intro}
                </p>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Casio */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 flex items-center gap-5">
                    <img
                      src="/images/casio-fx991de-x.jpg"
                      alt="Wissenschaftlicher Taschenrechner Casio FX-991DE X ClassWiz"
                      className="w-20 h-32 object-contain rounded-lg bg-white p-1.5 border border-slate-200 shrink-0"
                    />
                    <div className="flex flex-col justify-between h-full">
                      <div>
                        <div className="flex items-center gap-2 text-[#123E8A] font-bold text-sm">
                          <Calculator className="w-5 h-5" />
                          Taschenrechnerempfehlung (IM, TFW, TBW)
                        </div>
                        <h3 className="font-display font-bold text-lg text-slate-900 mt-1">
                          {bookRecommendations.calculator.name}
                        </h3>
                        <p className="text-sm text-slate-600 mt-1">{bookRecommendations.calculator.note}</p>
                      </div>
                      <a
                        href={bookRecommendations.calculator.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-[#123E8A] hover:underline"
                      >
                        Auf Amazon ansehen <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>

                  {/* Allgemeine Empfehlung PDF */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-[#123E8A] font-bold text-sm">
                        <BookOpen className="w-5 h-5" />
                        Weitere Lernhilfen
                      </div>
                      <h3 className="font-display font-bold text-lg text-slate-900 mt-2">
                        Allgemeine Bücherempfehlung (optional)
                      </h3>
                      <p className="text-sm text-slate-600 mt-1">
                        Für die Teilnahme am Unterricht bei @Learning nicht zwingend erforderlich – wir stellen strukturierte Unterlagen bereit. IHK-Formelsammlungen erhältst du bei uns im Büro.
                      </p>
                    </div>
                    <a
                      href={bookRecommendations.generalPdf}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-[#123E8A] hover:underline"
                    >
                      Bücherliste als PDF herunterladen <FileDown className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Gesetzestexte */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
                <h3 className="font-display text-xl font-bold text-slate-900">
                  Zugelassene Gesetzestexte für das Fach Recht
                </h3>
                <p className="text-sm text-slate-600 mt-1 mb-5">{bookRecommendations.lawBooksNote}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {bookRecommendations.books.map((b) => (
                    <a
                      key={b.isbn}
                      href={b.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition-colors flex items-center justify-between gap-3"
                    >
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{b.title}</p>
                        <p className="font-mono-tech text-xs text-slate-500 mt-0.5">ISBN: {b.isbn}</p>
                        <p className="text-xs text-[#123E8A] font-medium mt-1">Empfohlen für: {b.forCourses}</p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-slate-400 shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
