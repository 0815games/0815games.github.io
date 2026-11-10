import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CookieConsent from './components/CookieConsent';
import HomePage from './pages/HomePage';
import WeiterbildungPage from './pages/WeiterbildungPage';
import CourseDetailPage from './pages/CourseDetailPage';
import { KombimodellPage, AevoPage } from './pages/SpecialCoursePage';
import TerminePage from './pages/TerminePage';
import LeistungenPage from './pages/LeistungenPage';
import ServicePage from './pages/ServicePage';
import AboutDozentenPage from './pages/AboutDozentenPage';
import KontaktPage from './pages/KontaktPage';
import { ImpressumPage, DatenschutzPage } from './pages/LegalPages';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

const CONSENT_KEY = 'at_learning_cookie_consent_v1';

export default function App() {
  const [consent, setConsent] = useState(() => {
    try {
      const saved = localStorage.getItem(CONSENT_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [cookieModalOpen, setCookieModalOpen] = useState(() => consent === null);

  const handleSaveConsent = (newConsent) => {
    setConsent(newConsent);
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify({ ...newConsent, updatedAt: new Date().toISOString() }));
    } catch {
      // ignore storage errors
    }
    setCookieModalOpen(false);
  };

  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/weiterbildung" element={<WeiterbildungPage />} />
            <Route path="/lehrgaenge/kombimodell" element={<KombimodellPage />} />
            <Route path="/lehrgaenge/aevo" element={<AevoPage />} />
            <Route path="/lehrgaenge/:slug" element={<CourseDetailPage />} />
            <Route path="/termine" element={<TerminePage />} />
            <Route path="/leistungen" element={<LeistungenPage />} />
            <Route path="/service" element={<ServicePage />} />
            <Route path="/ueber-uns" element={<AboutDozentenPage />} />
            <Route path="/kontakt" element={<KontaktPage />} />
            <Route path="/impressum" element={<ImpressumPage />} />
            <Route path="/datenschutz" element={<DatenschutzPage onOpenCookieSettings={() => setCookieModalOpen(true)} />} />
            <Route path="*" element={<HomePage />} />
          </Routes>
        </main>
        <Footer onOpenCookieSettings={() => setCookieModalOpen(true)} />
        <CookieConsent
          isOpen={cookieModalOpen}
          onClose={() => setCookieModalOpen(false)}
          consent={consent}
          onSaveConsent={handleSaveConsent}
        />
      </div>
    </BrowserRouter>
  );
}
