import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, ShieldCheck, Cookie } from 'lucide-react';
import { BrandLogo } from './Navbar';
import { brandInfo, courses } from '../data/siteData';

export default function Footer({ onOpenCookieSettings }) {
  return (
    <footer className="bg-[#0B1E42] text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Col 1: Brand */}
          <div className="space-y-4">
            <BrandLogo dark />
            <p className="text-sm text-slate-400 leading-relaxed">
              Dein Bildungspartner für IHK-Weiterbildungen seit 2006. Praxisnaher Präsenzunterricht in kleinen Gruppen an unseren Standorten Plochingen und Reutlingen.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-amber-300 font-medium">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              DIN EN ISO 9001:2015 (2027–2029)
            </div>
          </div>

          {/* Col 2: Lehrgänge */}
          <div>
            <h3 className="font-display text-white font-bold text-sm uppercase tracking-wider mb-4">
              IHK-Lehrgänge
            </h3>
            <ul className="space-y-2 text-sm">
              {courses.map((c) => (
                <li key={c.slug}>
                  <Link to={`/lehrgaenge/${c.slug}`} className="hover:text-white transition-colors">
                    {c.title}
                  </Link>
                </li>
              ))}
              <li>
                <Link to="/lehrgaenge/kombimodell" className="text-amber-300 hover:text-amber-200 transition-colors">
                  Kombimodell (1,5 Jahre)
                </Link>
              </li>
              <li>
                <Link to="/lehrgaenge/aevo" className="hover:text-white transition-colors">
                  AEVO / Ausbilderschein
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Info & Service */}
          <div>
            <h3 className="font-display text-white font-bold text-sm uppercase tracking-wider mb-4">
              Infos &amp; Service
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/weiterbildung" className="hover:text-white transition-colors">
                  Weiterbildungs-Übersicht
                </Link>
              </li>
              <li>
                <Link to="/termine" className="hover:text-white transition-colors">
                  Kursstarts 2026 / 2027
                </Link>
              </li>
              <li>
                <Link to="/leistungen" className="hover:text-white transition-colors">
                  Leistungen &amp; Aufstiegs-BAföG
                </Link>
              </li>
              <li>
                <Link to="/service" className="hover:text-white transition-colors">
                  Zulassungen, PDFs &amp; Buchtipps
                </Link>
              </li>
              <li>
                <Link to="/ueber-uns" className="hover:text-white transition-colors">
                  Über @Learning &amp; Dozentensuche
                </Link>
              </li>
              <li>
                <Link to="/kontakt" className="hover:text-white transition-colors">
                  Kontakt &amp; Beratung
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Standorte & Kontakt */}
          <div className="space-y-4">
            <h3 className="font-display text-white font-bold text-sm uppercase tracking-wider">
              Standorte &amp; Kontakt
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white">Plochingen (Hauptsitz)</p>
                  <p className="text-slate-400">Robert-Bosch-Straße 7–9, 73207 Plochingen</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white">Reutlingen</p>
                  <p className="text-slate-400">Auchtertstraße 8, 72770 Reutlingen</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-blue-400 shrink-0" />
                <a href={`tel:${brandInfo.phoneMainRaw}`} className="hover:text-white transition-colors">
                  {brandInfo.phoneMain} / -221
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                <a href={`mailto:${brandInfo.emailPrimary}`} className="hover:text-white transition-colors">
                  {brandInfo.emailPrimary}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Legal Bar */}
        <div className="mt-12 pt-8 border-t border-slate-800/90 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>
            © {new Date().getFullYear()} @Learning Bildungszentrum · Inhaber: {brandInfo.owner}
          </p>
          <div className="flex flex-wrap items-center gap-5">
            <Link to="/impressum" className="hover:text-white transition-colors">
              Impressum (§ 5 DDG)
            </Link>
            <Link to="/datenschutz" className="hover:text-white transition-colors">
              Datenschutzerklärung
            </Link>
            <button
              type="button"
              onClick={onOpenCookieSettings}
              className="inline-flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
            >
              <Cookie className="w-3.5 h-3.5" />
              Cookie-Einstellungen
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
