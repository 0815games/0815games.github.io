import React from 'react';
import { Cookie, ShieldCheck } from 'lucide-react';
import { usePageMeta } from '../hooks/usePageMeta';
import { brandInfo } from '../data/siteData';

export function ImpressumPage() {
  usePageMeta('Impressum (§ 5 DDG)', 'Rechtliche Pflichtangaben von @Learning Bildungszentrum, Inhaber Tim Ohnmeiss MSc, Plochingen und Reutlingen.');

  return (
    <div className="bg-slate-50 py-12 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 shadow-sm space-y-6 text-sm text-slate-700 leading-relaxed">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#123E8A]">Angaben gemäß § 5 DDG</span>
            <h1 className="font-display text-3xl font-extrabold text-slate-900 mt-1">Impressum</h1>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 rounded-xl p-5 border border-slate-200">
            <div>
              <p className="font-bold text-slate-900 text-base">{brandInfo.name}</p>
              <p>Inhaber: {brandInfo.owner}</p>
              <p className="mt-2 font-semibold text-slate-900">Hauptsitz Plochingen:</p>
              <p>Robert-Bosch-Straße 7–9</p>
              <p>73207 Plochingen</p>
              <p className="mt-2 font-semibold text-slate-900">Standort Reutlingen:</p>
              <p>Auchtertstraße 8</p>
              <p>72770 Reutlingen</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900">Kontakt:</p>
              <p>Telefon: {brandInfo.phoneMain} / -221</p>
              <p>E-Mail: {brandInfo.emailPrimary}</p>
              <p>Alternativ: {brandInfo.emailSecondary}</p>
              <p className="mt-3 text-xs text-slate-500">
                Gründungsdatum: {brandInfo.founded}
                <br />
                Erstellungsdatum der Website: {brandInfo.homepageCreated}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="font-display font-bold text-slate-900 text-lg">
              Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV
            </h2>
            <p>{brandInfo.owner}, Robert-Bosch-Straße 7–9, 73207 Plochingen</p>
          </div>

          <div className="space-y-2">
            <h2 className="font-display font-bold text-slate-900 text-lg">Haftung für Inhalte</h2>
            <p>
              Als Diensteanbieter sind wir gemäß § 7 Abs. 1 DDG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="font-display font-bold text-slate-900 text-lg">Haftung für Links</h2>
            <p>
              Unser Angebot enthält Links zu externen Webseiten Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber verantwortlich. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Links umgehend entfernen.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="font-display font-bold text-slate-900 text-lg">Urheberrecht</h2>
            <p>
              Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="font-display font-bold text-slate-900 text-lg">
              Verbraucherstreitbeilegung (§ 36 VSBG)
            </h2>
            <p>
              Wir sind nicht verpflichtet und grundsätzlich nicht bereit, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DatenschutzPage({ onOpenCookieSettings }) {
  usePageMeta('Datenschutzerklärung (DSGVO)', 'Transparente Informationen zur Datenverarbeitung bei @Learning gemäß DSGVO und TDDDG.');

  return (
    <div className="bg-slate-50 py-12 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 shadow-sm space-y-6 text-sm text-slate-700 leading-relaxed">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#123E8A]">
                <ShieldCheck className="w-4 h-4" />
                DSGVO &amp; § 25 TDDDG
              </span>
              <h1 className="font-display text-3xl font-extrabold text-slate-900 mt-1">
                Datenschutzerklärung
              </h1>
            </div>
            <button
              type="button"
              onClick={onOpenCookieSettings}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#123E8A] text-xs font-bold cursor-pointer"
            >
              <Cookie className="w-4 h-4" />
              Cookie-Einstellungen verwalten
            </button>
          </div>

          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
            <p className="font-bold text-slate-900">Verantwortlicher im Sinne der DSGVO:</p>
            <p className="mt-1">
              {brandInfo.name} · Inhaber: {brandInfo.owner}
              <br />
              Robert-Bosch-Straße 7–9, 73207 Plochingen
              <br />
              Telefon: {brandInfo.phoneMain} / -221 · E-Mail: {brandInfo.emailPrimary}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Ein betrieblicher Datenschutzbeauftragter entfällt gemäß Art. 37 Abs. 4 DSGVO i. V. m. § 38 Abs. 1 BDSG.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="font-display font-bold text-slate-900 text-lg">
              1. Datenübermittlung &amp; Server-Logfiles
            </h2>
            <p>
              Bei der rein informatorischen Nutzung unserer Website erhebt der Webserver technisch erforderliche Zugriffsdaten (besuchte Seite, Datum/Uhrzeit, übertragene Datenmenge, Referrer, Browser, Betriebssystem, IP-Adresse). Die Verarbeitung erfolgt gemäß Art. 6 Abs. 1 lit. f DSGVO auf Basis unseres berechtigten Interesses an Stabilität und Sicherheit des Webauftritts.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="font-display font-bold text-slate-900 text-lg">
              2. Cookies &amp; Einwilligungsverwaltung (Opt-in)
            </h2>
            <p>
              Wir setzen technisch notwendige Speicherfunktionen ein, um deine Privatsphäre-Auswahl zu sichern (Art. 6 Abs. 1 lit. c / lit. f DSGVO, § 25 Abs. 2 TDDDG). Optionale Analyse- oder Marketing-Skripte werden erst geladen, nachdem du über unseren Cookie-Banner ausdrücklich eingewilligt hast (Art. 6 Abs. 1 lit. a DSGVO, § 25 Abs. 1 TDDDG). Du kannst deine Auswahl jederzeit über den Button oben oder im Footer widerrufen bzw. ändern.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="font-display font-bold text-slate-900 text-lg">
              3. Kontaktaufnahme &amp; Beratungsanfragen
            </h2>
            <p>
              Wenn du uns per E-Mail, Telefon oder Kontaktformular anfragst, werden deine angegebenen Daten ausschließlich zur Bearbeitung deiner Beratungs- bzw. Anmeldeanfrage verarbeitet (Art. 6 Abs. 1 lit. b bzw. lit. a DSGVO). Eine Weitergabe an Dritte erfolgt nicht ohne deine Einwilligung.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="font-display font-bold text-slate-900 text-lg">
              4. Externe Links &amp; Karten
            </h2>
            <p>
              Für Standortkarten verlinken wir datensparsam auf OpenStreetMap und Google Maps – es werden beim Laden dieser Seite keine Kartendaten externer Anbieter im Hintergrund übertragen, bevor du aktiv auf einen Link klickst.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="font-display font-bold text-slate-900 text-lg">
              5. Deine Rechte als betroffene Person
            </h2>
            <p>
              Du hast jederzeit das Recht auf Widerruf einer erteilten Einwilligung (Art. 7 Abs. 3 DSGVO), Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16 DSGVO), Löschung (Art. 17 DSGVO), Einschränkung der Verarbeitung (Art. 18 DSGVO), Datenübertragbarkeit (Art. 20 DSGVO), Widerspruch (Art. 21 DSGVO) sowie auf Beschwerde bei einer Datenschutz-Aufsichtsbehörde (Art. 77 DSGVO, z. B. beim Landesbeauftragten für den Datenschutz und die Informationsfreiheit Baden-Württemberg).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
