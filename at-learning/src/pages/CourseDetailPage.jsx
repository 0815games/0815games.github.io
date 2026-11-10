import React from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  FileDown,
  MapPin,
  Phone,
} from 'lucide-react';
import { usePageMeta } from '../hooks/usePageMeta';
import { courses, upcomingCohorts } from '../data/siteData';

export default function CourseDetailPage() {
  const { slug } = useParams();
  const course = courses.find((c) => c.slug === slug);

  usePageMeta(
    course ? `${course.title} (${course.code})` : 'Lehrgang nicht gefunden',
    course ? course.summary : ''
  );

  if (!course) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-slate-900">Lehrgang nicht gefunden</h1>
        <Link to="/weiterbildung" className="mt-4 inline-block text-[#123E8A] font-semibold underline">
          Zur Lehrgangsübersicht
        </Link>
      </div>
    );
  }

  const matchingCohorts = upcomingCohorts.filter(
    (c) =>
      c.courseSlug === course.slug ||
      (c.id === 'vollzeit-mai-27' && course.category === 'Meister')
  );

  return (
    <div>
      {/* Header */}
      <section className="bg-gradient-to-br from-[#0B224D] to-[#16428F] text-white py-12 sm:py-16 bg-tech-grid-dark">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to="/weiterbildung"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-200 hover:text-white mb-5"
          >
            <ArrowLeft className="w-4 h-4" /> Alle Weiterbildungen
          </Link>

          <div className="flex flex-wrap items-center gap-2.5 mb-3">
            <span className="font-mono-tech text-xs font-bold px-2.5 py-1 rounded-md bg-white text-[#0F2D63]">
              {course.code}
            </span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-amber-400/20 border border-amber-300/30 text-amber-200">
              {course.dqr}
            </span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-white/10 text-blue-100">
              {course.legalBasis}
            </span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">
            {course.title}
          </h1>
          <p className="mt-2 text-sm sm:text-base text-sky-200 font-medium">
            Englische Original-Übersetzung nach IHK: „{course.englishTitle}“
          </p>
          <p className="mt-4 text-base text-blue-100 max-w-3xl leading-relaxed">
            {course.summary}
          </p>

          {/* Key Stats */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white/10 border border-white/15 rounded-xl p-4">
              <p className="text-xs text-blue-200 uppercase font-semibold">Unterrichtsumfang</p>
              <p className="font-mono-tech text-2xl font-bold mt-1">{course.totalUE}</p>
              <p className="text-xs text-blue-200 mt-0.5">IHK-Empfehlung: {course.ihkRecommendation}</p>
            </div>
            <div className="bg-white/10 border border-white/15 rounded-xl p-4">
              <p className="text-xs text-blue-200 uppercase font-semibold">Ausbilderschein (AEVO)</p>
              <p className="text-sm font-semibold mt-1 text-white">{course.aevoNote}</p>
            </div>
            <div className="bg-white/10 border border-white/15 rounded-xl p-4">
              <p className="text-xs text-blue-200 uppercase font-semibold">Direkte Fachberatung</p>
              <a
                href={`tel:${course.phone.replace(/[^0-9]/g, '')}`}
                className="font-mono-tech text-xl font-bold text-amber-300 hover:underline inline-flex items-center gap-1.5 mt-1"
              >
                <Phone className="w-4 h-4" />
                {course.phone}
              </a>
              <p className="text-xs text-blue-200 mt-0.5">Kostenlose Beratung &amp; BAföG-Hilfe</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 sm:py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Curriculum */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-[#123E8A]">
                Unser Lehrgangsziel
              </p>
              <p className="font-display font-bold text-slate-900 text-lg mt-1">
                „{course.goal}“
              </p>
            </div>

            <div>
              <h2 className="font-display text-2xl font-extrabold text-slate-900 mb-4 flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-[#123E8A]" />
                Lehrinhalte &amp; Modulaufbau
              </h2>

              <div className="space-y-4">
                {course.modules.map((mod) => (
                  <div
                    key={mod.part}
                    className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-3 flex-wrap border-b border-slate-100 pb-3 mb-4">
                      <h3 className="font-display font-bold text-slate-900 text-base sm:text-lg">
                        {mod.part}
                      </h3>
                      <span className="font-mono-tech text-xs font-bold px-2.5 py-1 rounded-md bg-blue-50 text-[#123E8A]">
                        {mod.ue}
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {mod.topics.map((t) => (
                        <li key={t} className="flex items-start gap-2.5 text-sm text-slate-700">
                          <CheckCircle2 className="w-4 h-4 text-[#123E8A] shrink-0 mt-0.5" />
                          <span>{t}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar: Dates, Zulassung PDF, CTA */}
          <div className="lg:col-span-5 space-y-6">
            {/* Matching Cohorts */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h2 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-[#123E8A]" />
                Nächste Kurstermine
              </h2>

              <div className="space-y-3">
                {matchingCohorts.map((coh) => (
                  <div
                    key={coh.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono-tech text-xs font-bold text-[#123E8A]">
                        {coh.courseNumbers}
                      </span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-100 text-[#123E8A]">
                        {coh.mode}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-900">{coh.title}</p>
                    <p className="text-xs text-slate-600 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {coh.start} – {coh.end}
                    </p>
                    <p className="text-xs text-slate-600 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {coh.locations.join(' & ')}
                    </p>
                    <p className="text-[11px] text-slate-500 pt-1">{coh.schedule}</p>
                  </div>
                ))}
              </div>

              <Link
                to="/termine"
                className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#123E8A] hover:underline"
              >
                Alle Starttermine &amp; Filter ansehen <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Zulassung PDFs */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
              <h2 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-[#123E8A]" />
                Zulassungsvoraussetzungen
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Lade dir die offiziellen IHK-Zulassungsvoraussetzungen direkt als PDF herunter oder lass sie kostenlos von uns prüfen:
              </p>
              <a
                href={course.zulassungPdf}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-2 w-full px-4 py-3 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-800 hover:text-[#123E8A] font-semibold text-sm transition-colors border border-slate-200"
              >
                <span>Zulassung {course.shortTitle} (PDF)</span>
                <FileDown className="w-4 h-4 shrink-0" />
              </a>
              {course.extraPdf && (
                <a
                  href={course.extraPdf.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-2 w-full px-4 py-3 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-800 hover:text-[#123E8A] font-semibold text-sm transition-colors border border-slate-200"
                >
                  <span>{course.extraPdf.label}</span>
                  <FileDown className="w-4 h-4 shrink-0" />
                </a>
              )}
            </div>

            {/* CTA Card */}
            <div className="bg-[#0F2D63] text-white rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="font-display text-lg font-bold">
                Interesse an diesem Lehrgang?
              </h3>
              <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
                Im persönlichen Beratungsgespräch bekommst du alle Infos zu Kursablauf, Stundenübersichten, Kosten und deinen 75 % Staatsfördermitteln.
              </p>
              <Link
                to="/kontakt"
                className="block w-full text-center px-5 py-3 rounded-xl bg-white text-[#0F2D63] font-bold text-sm hover:bg-blue-50 transition-colors"
              >
                Beratungstermin vereinbaren
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
