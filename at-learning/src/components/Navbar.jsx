import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ChevronDown, Menu, X, Phone, Mail, Award, MapPin, ArrowRight } from 'lucide-react';
import { brandInfo, courses } from '../data/siteData';

export function BrandLogo({ dark = false }) {
  return (
    <Link to="/" className="inline-flex items-center gap-2.5 group focus:outline-none">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#123E8A] text-white font-display font-extrabold text-2xl shadow-sm ring-1 ring-blue-900/20 group-hover:bg-blue-700 transition-colors">
        @
      </span>
      <div className="flex flex-col leading-none">
        <span className={`font-display text-xl font-extrabold tracking-tight ${dark ? 'text-white' : 'text-[#0F2D63]'}`}>
          Learning
        </span>
        <span className={`text-[11px] font-medium tracking-wide uppercase ${dark ? 'text-blue-200' : 'text-slate-500'}`}>
          Plochingen · Reutlingen
        </span>
      </div>
    </Link>
  );
}

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileCoursesOpen, setMobileCoursesOpen] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinkClass = ({ isActive }) =>
    `px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
      isActive ? 'text-[#123E8A] bg-blue-50' : 'text-slate-700 hover:text-[#123E8A] hover:bg-slate-100/80'
    }`;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      {/* Top Info Strip */}
      <div className="hidden lg:block bg-[#0B224D] text-slate-200 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-9 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <span className="inline-flex items-center gap-1.5 text-amber-300 font-medium">
              <Award className="w-3.5 h-3.5" />
              DIN EN ISO 9001:2015 zertifiziert seit 2006
            </span>
            <span className="inline-flex items-center gap-1.5 text-slate-300">
              <MapPin className="w-3.5 h-3.5 text-blue-300" />
              Präsenz in Plochingen &amp; Reutlingen
            </span>
          </div>
          <div className="flex items-center gap-5">
            <a href={`tel:${brandInfo.phoneMainRaw}`} className="inline-flex items-center gap-1.5 hover:text-white transition-colors">
              <Phone className="w-3.5 h-3.5 text-blue-300" />
              {brandInfo.phoneMain}
            </a>
            <a href={`mailto:${brandInfo.emailPrimary}`} className="inline-flex items-center gap-1.5 hover:text-white transition-colors">
              <Mail className="w-3.5 h-3.5 text-blue-300" />
              {brandInfo.emailPrimary}
            </a>
          </div>
        </div>
      </div>

      {/* Main Nav */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <BrandLogo />

        {/* Desktop Links */}
        <nav aria-label="Hauptnavigation" className="hidden lg:flex items-center gap-1">
          <NavLink to="/" end className={navLinkClass}>
            Startseite
          </NavLink>

          {/* Lehrgänge Mega-Dropdown */}
          <div
            ref={dropdownRef}
            className="relative"
            onMouseEnter={() => setDropdownOpen(true)}
            onMouseLeave={() => setDropdownOpen(false)}
          >
            <button
              type="button"
              onClick={() => setDropdownOpen((o) => !o)}
              aria-expanded={dropdownOpen}
              className={`inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                location.pathname.startsWith('/lehrgaenge') || location.pathname === '/weiterbildung'
                  ? 'text-[#123E8A] bg-blue-50'
                  : 'text-slate-700 hover:text-[#123E8A] hover:bg-slate-100/80'
              }`}
            >
              Lehrgänge
              <ChevronDown className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute left-0 top-full pt-2 w-[620px] z-50">
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-5 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2.5 mb-2">
                      Industriemeister (inkl. AEVO)
                    </p>
                    <div className="space-y-1">
                      {courses
                        .filter((c) => c.category === 'Meister')
                        .map((c) => (
                          <Link
                            key={c.slug}
                            to={`/lehrgaenge/${c.slug}`}
                            className="flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-blue-50 text-sm text-slate-800 group"
                          >
                            <span className="font-medium group-hover:text-[#123E8A]">{c.shortTitle}</span>
                            <span className="font-mono-tech text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                              {c.code}
                            </span>
                          </Link>
                        ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2.5 mb-2">
                      Fachwirte, Betriebswirt &amp; Spezial
                    </p>
                    <div className="space-y-1">
                      {courses
                        .filter((c) => c.category !== 'Meister')
                        .map((c) => (
                          <Link
                            key={c.slug}
                            to={`/lehrgaenge/${c.slug}`}
                            className="flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-blue-50 text-sm text-slate-800 group"
                          >
                            <span className="font-medium group-hover:text-[#123E8A]">{c.shortTitle}</span>
                            <span className="font-mono-tech text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                              {c.code}
                            </span>
                          </Link>
                        ))}
                      <Link
                        to="/lehrgaenge/kombimodell"
                        className="flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-amber-50 text-sm text-slate-800 group"
                      >
                        <span className="font-semibold text-amber-800">Kombimodell (1,5 Jahre)</span>
                        <span className="font-mono-tech text-[11px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                          TIPP
                        </span>
                      </Link>
                      <Link
                        to="/lehrgaenge/aevo"
                        className="flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-blue-50 text-sm text-slate-800 group"
                      >
                        <span className="font-medium group-hover:text-[#123E8A]">AEVO / Ausbilderschein</span>
                        <span className="font-mono-tech text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          AEVO
                        </span>
                      </Link>
                    </div>
                  </div>

                  <div className="col-span-2 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <Link
                      to="/weiterbildung"
                      className="text-xs font-semibold text-[#123E8A] hover:underline inline-flex items-center gap-1"
                    >
                      Alle Weiterbildungen im Überblick vergleichen <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                    <Link
                      to="/termine"
                      className="text-xs font-semibold text-slate-600 hover:text-[#123E8A]"
                    >
                      Nächste Starttermine 2026/2027 →
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          <NavLink to="/termine" className={navLinkClass}>
            Termine &amp; Standorte
          </NavLink>
          <NavLink to="/leistungen" className={navLinkClass}>
            Förderung &amp; Leistungen
          </NavLink>
          <NavLink to="/service" className={navLinkClass}>
            Zulassung &amp; Service
          </NavLink>
          <NavLink to="/ueber-uns" className={navLinkClass}>
            Über uns &amp; Dozenten
          </NavLink>
        </nav>

        {/* Right CTA & Mobile Button */}
        <div className="flex items-center gap-2.5">
          <Link
            to="/kontakt"
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#123E8A] hover:bg-blue-800 text-white text-sm font-semibold shadow-sm transition-colors"
          >
            Beratung vereinbaren
          </Link>
          <button
            type="button"
            aria-label={mobileOpen ? 'Menü schließen' : 'Menü öffnen'}
            onClick={() => setMobileOpen((o) => !o)}
            className="lg:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100 border border-slate-200"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-slate-200 max-h-[82vh] overflow-y-auto px-4 py-4 space-y-2 shadow-lg">
          <NavLink to="/" end className="block px-3 py-2.5 rounded-lg font-semibold text-slate-800 hover:bg-slate-100">
            Startseite
          </NavLink>

          <div>
            <button
              type="button"
              onClick={() => setMobileCoursesOpen((v) => !v)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-semibold text-slate-800 hover:bg-slate-100"
            >
              <span>Lehrgänge (IHK)</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${mobileCoursesOpen ? 'rotate-180' : ''}`} />
            </button>
            {mobileCoursesOpen && (
              <div className="pl-4 pr-2 py-1 space-y-1 border-l-2 border-blue-200 ml-3 mt-1">
                <Link to="/weiterbildung" className="block py-1.5 text-sm font-semibold text-[#123E8A]">
                  Gesamtübersicht Weiterbildung
                </Link>
                {courses.map((c) => (
                  <Link key={c.slug} to={`/lehrgaenge/${c.slug}`} className="block py-1.5 text-sm text-slate-700">
                    {c.shortTitle} ({c.code})
                  </Link>
                ))}
                <Link to="/lehrgaenge/kombimodell" className="block py-1.5 text-sm font-medium text-amber-700">
                  Kombimodell (1,5 Jahre)
                </Link>
                <Link to="/lehrgaenge/aevo" className="block py-1.5 text-sm text-slate-700">
                  AEVO / Ausbilderschein
                </Link>
              </div>
            )}
          </div>

          <NavLink to="/termine" className="block px-3 py-2.5 rounded-lg font-semibold text-slate-800 hover:bg-slate-100">
            Termine &amp; Standorte
          </NavLink>
          <NavLink to="/leistungen" className="block px-3 py-2.5 rounded-lg font-semibold text-slate-800 hover:bg-slate-100">
            Förderung &amp; Leistungen
          </NavLink>
          <NavLink to="/service" className="block px-3 py-2.5 rounded-lg font-semibold text-slate-800 hover:bg-slate-100">
            Zulassung &amp; Service-Downloads
          </NavLink>
          <NavLink to="/ueber-uns" className="block px-3 py-2.5 rounded-lg font-semibold text-slate-800 hover:bg-slate-100">
            Über uns &amp; Dozenten
          </NavLink>

          <div className="pt-3 border-t border-slate-200 space-y-2">
            <Link
              to="/kontakt"
              className="block w-full text-center px-4 py-3 rounded-xl bg-[#123E8A] text-white font-semibold"
            >
              Kostenlose Beratung vereinbaren
            </Link>
            <a
              href={`tel:${brandInfo.phoneMainRaw}`}
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm"
            >
              <Phone className="w-4 h-4 text-[#123E8A]" />
              {brandInfo.phoneMain}
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
