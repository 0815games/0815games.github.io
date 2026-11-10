export const brandInfo = {
  name: '@Learning',
  tagline: 'Bildungszentrum für IHK-Weiterbildung in Plochingen & Reutlingen',
  owner: 'Tim Ohnmeiss MSc',
  founded: '27.11.2006',
  homepageCreated: '01.01.2007',
  isoCert: 'DIN EN ISO 9001:2015 (aktuelles Zertifikat 2027–2029)',
  bzgbw: 'Anerkannter Bildungsträger nach § 10 Abs. 3 Bildungszeitgesetz Baden-Württemberg (BzG BW)',
  emailPrimary: 'info@at-learning.de',
  emailSecondary: 'at-learning@gmx.de',
  phoneMain: '07153 / 6191-220',
  phoneMainRaw: '071536191220',
  phoneAlt: '07153 / 6191-221',
  phoneAltRaw: '071536191221',
  locations: [
    {
      id: 'plochingen',
      name: 'Hauptsitz Plochingen',
      street: 'Robert-Bosch-Straße 7–9',
      zipCity: '73207 Plochingen',
      features: [
        'Klimatisierte Schulungsräume',
        'Räume unter der Woche zum Lernen nutzbar',
        'Beratung & Büro vor Ort',
      ],
      osmUrl: 'https://www.openstreetmap.org/search?query=Robert-Bosch-Stra%C3%9Fe%207-9%2C%2073207%20Plochingen',
      mapsUrl: 'https://maps.google.com/?q=Robert-Bosch-Strasse+7-9,+73207+Plochingen',
      note: 'Zentral im Neckartal nahe Esslingen & Stuttgart gelegen.',
    },
    {
      id: 'reutlingen',
      name: 'Standort Reutlingen (Neu ab Nov. 2026)',
      street: 'Auchtertstraße 8',
      zipCity: '72770 Reutlingen',
      features: [
        'Präsenzunterricht vor Ort',
        'Start der Kurse ab November 2026',
        'Keine festen Bürozeiten – Beratung über Plochingen oder telefonisch',
      ],
      osmUrl: 'https://www.openstreetmap.org/search?query=Auchtertstra%C3%9Fe%208%2C%2072770%20Reutlingen',
      mapsUrl: 'https://maps.google.com/?q=Auchtertstrasse+8,+72770+Reutlingen',
      note: 'Neuer Präsenz-Standort in Reutlingen-Betzingen.',
    },
  ],
  hours: {
    schoolWeekend: [
      { label: 'Samstag (Regulärer Schulbetrieb)', time: '08:00 – 16:30 Uhr (10 UE)' },
      { label: 'Sonntag (Regulärer Schulbetrieb / Kurstermine)', time: '08:00 – 16:30 Uhr (Kurse i. d. R. bis 13:15 Uhr / 7 UE)' },
      { label: 'Feiertage (bei Kursterminen)', time: '08:00 – 16:30 Uhr (10 UE)' },
    ],
    schoolFulltime: [
      { label: 'Vollzeitkurs (Montag – Freitag)', time: '07:30 – 12:45 Uhr (7 UE)' },
    ],
    officePlochingen: [
      { label: 'Mo, Di, Do, Fr (Büro Plochingen)', time: '10:00 – 15:00 Uhr (Termine n. V. bis 17:00 Uhr)' },
      { label: 'Mittwoch', time: 'Geschlossen' },
      { label: 'Samstag (Schul- & Bürobetrieb)', time: '07:00 / 07:30 – 18:00 Uhr' },
      { label: 'Sonntag (Schul- & Bürobetrieb)', time: '07:00 / 07:30 – 15:00 Uhr' },
    ],
    consultationNote: 'Individuelle Beratungs- und Anmeldetermine finden bevorzugt am Wochenende zum laufenden Schulbetrieb oder flexibel nach vorheriger Vereinbarung statt.',
  },
  registrationDocs: [
    'Aktueller tabellarischer Lebenslauf mit Lichtbild und Unterschrift',
    'Facharbeiterbrief oder Gesellenbrief (alternativ Abschlusszeugnis der Ausbildung)',
    'Arbeitsbescheinigung des Arbeitgebers mit Tätigkeitsbezeichnung (beim Technischen Betriebswirt nicht notwendig)',
    'Personalausweis oder Reisepass',
  ],
};

export const newsHighlights = [
  {
    id: 'herbst-2026',
    badge: 'Endspurt Herbst 2026',
    title: 'Nur noch 3 freie Plätze für die November-Kurse 2026',
    text: 'Der letzte Kurs wird gerade gefüllt. Sichere dir jetzt kurzfristig deinen Platz für den Start am 14. bzw. 21. November 2026 in Plochingen oder Reutlingen.',
  },
  {
    id: 'reutlingen-neu',
    badge: 'Neuer Standort',
    title: 'Ab November 2026 auch in Reutlingen vor Ort',
    text: 'Neben unserem Hauptsitz in Plochingen bieten wir unsere IHK-Weiterbildungen in Präsenz jetzt auch in der Auchtertstraße 8 in 72770 Reutlingen an.',
  },
  {
    id: 'klimatisiert',
    badge: 'Lernkomfort',
    title: 'Klimatisierte Schulungsräume in Plochingen',
    text: 'Auch im Hochsommer behältst du in unseren modern ausgestatteten und voll klimatisierten Räumen in Plochingen immer einen kühlen Kopf beim Lernen.',
  },
];

export const courses = [
  {
    slug: 'industriemeister-metall',
    code: 'IM',
    category: 'Meister',
    title: 'Geprüfte(r) Industriemeister(in) Metall',
    shortTitle: 'Industriemeister Metall',
    englishTitle: 'Bachelor of Metal Production Technology and Operations (CCI)',
    dqr: 'DQR Niveau 6 (Bachelor-Niveau)',
    legalBasis: 'BBiG § 53 (§ 46 Abs. 2 a.F.)',
    totalUE: '850 UE',
    ihkRecommendation: 'ca. 1.200 UE',
    aevoNote: 'AEVO (Ausbilderschein) direkt im Kurs integriert (50 UE)',
    phone: '07153 / 6191-220',
    summary:
      'Mit dem geprüften Industriemeister Metall erreichst du in kurzer Zeitdauer berufsbegleitend am Wochenende (oder in 6 Monaten Vollzeit) einen anerkannten Meistertitel und steigst in die mittlere Führungsebene im Metallbereich auf.',
    goal: 'In kurzer Zeitdauer gezielt praxisnahe, prüfungsorientierte Wissensvermittlung ohne Qualitätsverlust!',
    zulassungPdf: '/downloads/zulassung-industriemeister-metall.pdf',
    extraPdf: {
      label: 'Liste anerkannter Metallberufe (PDF)',
      href: '/downloads/liste-metallberufe-im-metall.pdf',
    },
    modules: [
      {
        part: 'Teil 1: Grundlegende Basisqualifikation',
        ue: '360 UE',
        topics: [
          'Rechtsbewusstes Handeln',
          'Betriebswirtschaftliches Handeln',
          'Zusammenarbeit im Betrieb',
          'Methoden der Information, Kommunikation und Planung (MIKP)',
          'Naturwissenschaftliche und technische Grundlagen',
        ],
      },
      {
        part: 'Teil 2: Berufs- und arbeitspädagogische Qualifikation (AEVO)',
        ue: '50 UE',
        topics: [
          'Ausbildereignungsverordnung nach dem Berufsbildungsgesetz (Ausbilderschein)',
        ],
      },
      {
        part: 'Teil 3: Handlungsspezifische Qualifikation',
        ue: '440 UE',
        topics: [
          'Betriebstechnik',
          'Fertigungstechnik',
          'Montagetechnik',
          'Betriebliches Kostenwesen',
          'Planungs-, Steuerungs- und Kommunikationssysteme',
          'Arbeits-, Umwelt- und Gesundheitsschutz',
          'Personalführung',
          'Personalentwicklung',
          'Qualitätsmanagement',
        ],
      },
    ],
  },
  {
    slug: 'industriemeister-elektro',
    code: 'IME',
    category: 'Meister',
    title: 'Geprüfte(r) Industriemeister(in) Elektro',
    shortTitle: 'Industriemeister Elektro',
    englishTitle: 'Bachelor of Electrical Engineering and Operations (CCI)',
    dqr: 'DQR Niveau 6 (Bachelor-Niveau)',
    legalBasis: 'BBiG § 53 (§ 46 Abs. 2 a.F.)',
    totalUE: '850 UE',
    ihkRecommendation: 'ca. 1.200 UE',
    aevoNote: 'AEVO (Ausbilderschein) direkt im Kurs integriert (50 UE)',
    phone: '07153 / 6191-220',
    summary:
      'Das Berufsbild „Geprüfte(r) Industriemeister(in) Elektro“ ist das Ergebnis einer modernen, sich stetig weiterentwickelnden Industrie. Mit dieser Qualifikation übernimmst du Fach- und Führungsaufgaben in der mittleren Führungsebene.',
    goal: 'Durch hohe Qualität in praxisnahen und prüfungsorientierten Unterrichtsstrukturen in 850 UE sicher zur Prüfung!',
    zulassungPdf: '/downloads/zulassung-industriemeister-elektro.pdf',
    modules: [
      {
        part: 'Teil 1: Grundlegende Basisqualifikation',
        ue: '350 / 360 UE',
        topics: [
          'Rechtsbewusstes Handeln',
          'Betriebswirtschaftliches Handeln',
          'Zusammenarbeit im Betrieb',
          'Methoden der Information, Kommunikation und Planung (MIKP)',
          'Naturwissenschaftliche und technische Grundlagen',
        ],
      },
      {
        part: 'Teil 2: Berufs- und arbeitspädagogische Qualifikation (AEVO)',
        ue: '50 UE',
        topics: [
          'Ausbildereignungsverordnung nach dem Berufsbildungsgesetz (Ausbilderschein)',
        ],
      },
      {
        part: 'Teil 3: Handlungsspezifische Qualifikation',
        ue: '440 / 450 UE',
        topics: [
          'Infrastruktursysteme und Betriebstechnik',
          'Betriebliches Kostenwesen',
          'Planungs-, Steuerungs- und Kommunikationssysteme',
          'Arbeits- und Umweltschutz',
          'Personalführung',
          'Personalentwicklung',
          'Qualitätsmanagement',
        ],
      },
    ],
  },
  {
    slug: 'industriemeister-mechatronik',
    code: 'IMM',
    category: 'Meister',
    title: 'Geprüfte(r) Industriemeister(in) Mechatronik',
    shortTitle: 'Industriemeister Mechatronik',
    englishTitle: 'Bachelor Professional of Mechatronics (CCI)',
    dqr: 'DQR Niveau 6 (Bachelor-Niveau)',
    legalBasis: 'BBiG § 53 (§ 46 Abs. 2 a.F.)',
    totalUE: '850 UE',
    ihkRecommendation: 'ca. 1.200 UE',
    aevoNote: 'AEVO (Ausbilderschein) direkt im Kurs integriert (50 UE)',
    phone: '07153 / 6191-220',
    summary:
      'Die ideale Aufstiegsfortbildung an der Schnittstelle von Mechanik, Elektronik und IT. Qualifiziere dich berufsbegleitend am Wochenende oder in Vollzeit für Systemintegration, Service und Führungspositionen.',
    goal: 'In kurzer Zeitdauer gezielt praxisnahe, prüfungsorientierte Wissensvermittlung ohne Qualitätsverlust!',
    zulassungPdf: '/downloads/zulassung-industriemeister-mechatronik.pdf',
    modules: [
      {
        part: 'Teil 1: Grundlegende Basisqualifikation',
        ue: '360 UE',
        topics: [
          'Rechtsbewusstes Handeln',
          'Betriebswirtschaftliches Handeln',
          'Zusammenarbeit im Betrieb',
          'Methoden der Information, Kommunikation und Planung (MIKP)',
          'Naturwissenschaftliche und technische Grundlagen',
        ],
      },
      {
        part: 'Teil 2: Berufs- und arbeitspädagogische Qualifikation (AEVO)',
        ue: '50 UE',
        topics: [
          'Ausbildereignungsverordnung nach dem Berufsbildungsgesetz (Ausbilderschein)',
        ],
      },
      {
        part: 'Teil 3: Handlungsspezifische Qualifikation',
        ue: '440 UE',
        topics: [
          'Systemintegration',
          'Technische Applikation',
          'Kundenunterstützung und Service',
          'Betriebliches Kostenwesen',
          'Planungs-, Steuerungs- und Kommunikationssysteme',
          'Arbeits- und Umweltschutz',
          'Personalführung',
          'Personalentwicklung',
          'Qualitätsmanagement',
        ],
      },
    ],
  },
  {
    slug: 'logistikmeister',
    code: 'IML',
    category: 'Meister',
    title: 'Geprüfte(r) Logistikmeister(in)',
    shortTitle: 'Logistikmeister',
    englishTitle: 'Bachelor Professional in Logistics (CCI)',
    dqr: 'DQR Niveau 6 (Bachelor-Niveau)',
    legalBasis: 'BBiG § 53 (§ 46 Abs. 2 a.F.)',
    totalUE: '850 UE',
    ihkRecommendation: 'ca. 1.200 UE',
    aevoNote: 'AEVO (Ausbilderschein) direkt im Kurs integriert (50 UE)',
    phone: '07153 / 6191-220',
    summary:
      'Werde zur Führungskraft für moderne Lieferketten, Lagerhaltung und Intralogistik. Mit dem anerkannten IHK-Meisterabschluss übernimmst du die Steuerung und Optimierung betrieblicher Logistikprozesse.',
    goal: 'In kurzer Zeitdauer gezielt praxisnahe, prüfungsorientierte Wissensvermittlung ohne Qualitätsverlust!',
    zulassungPdf: '/downloads/zulassung-logistikmeister.pdf',
    modules: [
      {
        part: 'Teil 1: Grundlegende Basisqualifikation',
        ue: '360 UE',
        topics: [
          'Rechtsbewusstes Handeln',
          'Betriebswirtschaftliches Handeln',
          'Zusammenarbeit im Betrieb',
          'Methoden der Information, Kommunikation und Planung (MIKP)',
          'Naturwissenschaftliche und technische Grundlagen',
        ],
      },
      {
        part: 'Teil 2: Berufs- und arbeitspädagogische Qualifikation (AEVO)',
        ue: '50 UE',
        topics: [
          'Ausbildereignungsverordnung nach dem Berufsbildungsgesetz (Ausbilderschein)',
        ],
      },
      {
        part: 'Teil 3: Handlungsspezifische Qualifikation',
        ue: '440 UE',
        topics: [
          'Logistikkonzepte und Logistikprozesse',
          'Leistungserstellung',
          'Prozesssteuerung und Optimierung',
          'Betriebliches Kostenwesen und Logistikcontrolling',
          'Arbeits- und Umweltschutz sowie Qualitätsmanagement',
          'Personalführung',
          'Personalentwicklung',
        ],
      },
    ],
  },
  {
    slug: 'technischer-fachwirt',
    code: 'TFW',
    category: 'Fachwirt',
    title: 'Geprüfte(r) Technische(r) Fachwirt(in)',
    shortTitle: 'Technischer Fachwirt',
    englishTitle: 'Bachelor Professional of Technical Management (CCI)',
    dqr: 'DQR Niveau 6 (Bachelor-Niveau)',
    legalBasis: 'IHK-Prüfungsordnung / BBiG',
    totalUE: '750 UE',
    ihkRecommendation: 'ca. 850 UE',
    aevoNote:
      'Schriftlicher Teil der AEVO wird nach IHK-Prüfungsordnung erlassen – für die praktische Prüfung unterstützen wir dich mit ca. 10 UE.',
    phone: '07153 / 6191-221',
    summary:
      'Als Technische(r) Fachwirt(in) erwirbst du umfassende betriebswirtschaftliche und technische Handlungskompetenzen für Schnittstellenfunktionen zwischen Einkauf, Produktion, Controlling und Management.',
    goal: 'In gemeinsamer Anstrengung und klaren Unterrichtsstrukturen in 750 UE gezielt und ohne Qualitätsverlust zum Abschluss!',
    zulassungPdf: '/downloads/zulassung-technischer-fachwirt.pdf',
    modules: [
      {
        part: 'Teil 1: Wirtschaftsqualifikation',
        ue: '240 UE',
        topics: [
          'Volks- und Betriebswirtschaftslehre',
          'Rechnungswesen',
          'Recht und Steuern',
          'Unternehmensführung und Personalwirtschaft',
        ],
      },
      {
        part: 'Teil 2: Technische Qualifikation',
        ue: '265 UE',
        topics: [
          'Naturwissenschaftliche und technische Grundlagen',
          'Technische Kommunikation und Werkstofftechnologie',
          'Fertigungs- und Betriebstechnik',
        ],
      },
      {
        part: 'Teil 3: Handlungsspezifische Qualifikation',
        ue: '245 UE',
        topics: [
          'Absatz-, Materialwirtschaft und Logistik',
          'Produktionsplanung, -steuerung und -kontrolle',
          'Qualitäts- und Umweltmanagement sowie Arbeitsschutz',
          'Führung und Zusammenarbeit',
        ],
      },
    ],
  },
  {
    slug: 'wirtschaftsfachwirt',
    code: 'WFW',
    category: 'Fachwirt',
    title: 'Geprüfte(r) Wirtschaftsfachwirt(in)',
    shortTitle: 'Wirtschaftsfachwirt',
    englishTitle: 'Bachelor Professional of Business Management (CCI)',
    dqr: 'DQR Niveau 6 (Bachelor-Niveau)',
    legalBasis: 'IHK-Prüfungsordnung / BBiG',
    totalUE: '525 UE',
    ihkRecommendation: 'Kompakte Prüfungsvorbereitung',
    aevoNote:
      'Schriftlicher Teil der AEVO wird nach IHK-Prüfungsordnung erlassen – für die praktische Prüfung unterstützen wir dich mit ca. 10 UE.',
    phone: '07153 / 6191-221',
    summary:
      'Mit dem Titel „Geprüfte(r) Wirtschaftsfachwirt(in)“ qualifizierst du dich branchenübergreifend für anspruchsvolle Sach-, Organisations- und Führungsaufgaben in Unternehmen und Wirtschaftsorganisationen.',
    goal: 'In kurzer Zeitdauer gezielt praxisnahe, prüfungsorientierte Wissensvermittlung ohne Qualitätsverlust!',
    zulassungPdf: '/downloads/zulassung-wirtschaftsfachwirt.pdf',
    modules: [
      {
        part: 'Teil 1: Wirtschaftsbezogene Qualifikationen',
        ue: '220 UE',
        topics: [
          'Volks- und Betriebswirtschaftslehre',
          'Rechnungswesen',
          'Recht und Steuern',
          'Unternehmensführung',
        ],
      },
      {
        part: 'Teil 2: Handlungsspezifische Qualifikationen',
        ue: '305 UE',
        topics: [
          'Betriebliches Management',
          'Investition, Finanzierung, betriebliches Rechnungswesen und Controlling',
          'Logistik',
          'Marketing und Vertrieb',
          'Führung und Zusammenarbeit',
        ],
      },
    ],
  },
  {
    slug: 'technischer-betriebswirt',
    code: 'TBW',
    category: 'Betriebswirt',
    title: 'Geprüfte(r) Technische(r) Betriebswirt(in)',
    shortTitle: 'Technischer Betriebswirt',
    englishTitle: 'Master Professional of Technical Management (CCI)',
    dqr: 'DQR Niveau 7 (Master-Niveau)',
    legalBasis: 'IHK-Prüfungsordnung / BBiG (auf Meister/Techn. Fachwirt aufbauend)',
    totalUE: '480–500 UE',
    ihkRecommendation: 'Höchste Stufe der beruflichen IHK-Aufstiegsfortbildung',
    aevoNote: 'Ideal kombinierbar über das @Learning Kombimodell (in ca. 1,5 Jahren ab Facharbeiter)',
    phone: '07153 / 6191-221',
    summary:
      'Mit der Ausbildung zum „Geprüften Technischen Betriebswirt“ erwirbst du umfassende betriebswirtschaftliche Handlungs- und Führungskompetenz für Aufgaben in der Projektleitung sowie im mittleren und gehobenen Management.',
    goal: 'In kurzer Zeitdauer gezielt praxisnahe, prüfungsorientierte Wissensvermittlung ohne Qualitätsverlust!',
    zulassungPdf: '/downloads/zulassung-technischer-betriebswirt.pdf',
    modules: [
      {
        part: 'Teil 1: Grundlagen wirtschaftlichen Handelns und betrieblicher Leistungsprozesse',
        ue: '330 UE',
        topics: [
          'Volkswirtschaftslehre',
          'Rechnungswesen / Bilanzanalyse / Steuern',
          'Finanzierung und Investition',
          'Material-, Produktions- und Absatzwirtschaft',
        ],
      },
      {
        part: 'Teil 2: Management und Führung',
        ue: '170 UE',
        topics: [
          'Organisation und Unternehmensführung',
          'Personalmanagement',
          'Informations- und Kommunikationstechniken',
        ],
      },
      {
        part: 'Teil 3: Projektarbeit',
        ue: 'Prüfungsteil',
        topics: ['Praxisnahe Projektarbeit mit Fachgespräch und Präsentation'],
      },
    ],
  },
];

export const aevoData = {
  title: 'Ausbildung der Ausbilder (AEVO / Ausbilderschein)',
  subtitle: 'Bundesweit einheitlich anerkannte berufs- und arbeitspädagogische Qualifikation nach AEVO (§ 2)',
  totalUE: '50 UE (1 UE = 45 Min.)',
  sonderkursUE: '10 UE Sonderkurs Praktischer Teil (Start auf Anfrage)',
  description:
    'Wer ausbilden will, muss neben der persönlichen und fachlichen Eignung auch über pädagogische, rechtliche, organisatorische, psychologische und methodische Kenntnisse verfügen. Dieser Lehrgang bereitet gezielt auf die IHK-Ausbildereignungsprüfung nach dem aktuell gültigen Rahmenstoffplan vor.',
  noteFachwirte:
    'Für Fachwirte wird der schriftliche/theoretische Prüfungsteil nach IHK-Prüfungsordnung erlassen – hier ist nur die praktische Prüfung erforderlich. Bei allen Industriemeister- und Logistikmeister-Kursen ist die AEVO bereits fest integriert!',
  modules: [
    { part: 'Teil 1: Grundlegender theoretischer Teil AEVO', ue: '45 UE' },
    { part: 'Teil 2: Grundlegender praktischer Teil / Präsentation & Fachgespräch', ue: '10 UE' },
  ],
};

export const kombiModel = {
  title: 'Kombimodell: In 1,5 Jahren vom Facharbeiter zum Technischen Betriebswirt',
  subtitle: 'Ca. 6 Monate Zeitersparnis durch intelligent überlappenden Unterricht',
  options: [
    'Möglichkeit 1: Geprüfte(r) Industriemeister(in) + Geprüfte(r) Technische(r) Betriebswirt(in)',
    'Möglichkeit 2: Geprüfte(r) Technische(r) Fachwirt(in) + Geprüfte(r) Technische(r) Betriebswirt(in)',
  ],
  explanation:
    'Die Verkürzung um rund ein halbes Jahr entsteht, weil der Unterricht zum Geprüften Technischen Betriebswirt bereits überlappend am Ende deiner Grundqualifikation (Industriemeister bzw. Technischer Fachwirt) startet – bei vollen preislichen Vorteilen, auch wenn du dazwischen eine kurze Pause einlegen möchtest.',
  steps: [
    { step: 1, title: 'Grundqualifikation buchen', text: 'Start mit dem Geprüften Industriemeister (Metall/Elektro/Mechatronik/Logistik) oder Technischen Fachwirt.' },
    { step: 2, title: 'Anschlusskurs reservieren', text: 'Etwa 6 Monate vor Ende der Grundqualifikation buchst du den Geprüften Technischen Betriebswirt dazu.' },
    { step: 3, title: 'Grundprüfung ablegen', text: 'Du absolvierst deine IHK-Prüfungen der Grundqualifikation.' },
    { step: 4, title: 'IHK-Zulassung beantragen', text: 'Beantragung der Zulassung zum Technischen Betriebswirt (wir unterstützen dich bei den Unterlagen).' },
    { step: 5, title: 'Master-Niveau erreichen', text: 'Ablegung der Prüfungen zum Geprüften Technischen Betriebswirt (DQR Niveau 7).' },
  ],
};

export const upcomingCohorts = [
  {
    id: 'im-herbst-26',
    title: 'Gepr. Industriemeister(in) Metall',
    courseSlug: 'industriemeister-metall',
    category: 'Meister',
    mode: 'Teilzeit (Wochenende)',
    courseNumbers: 'IM26SP20, IM26SP23, IM26SP24',
    locations: ['Plochingen', 'Reutlingen'],
    ue: '850 UE (inkl. AEVO)',
    start: '14. Nov. 2026',
    end: '07. Nov. 2027',
    schedule: 'Sa: 08:00–16:30 Uhr (10 UE) · So: 08:00–13:15 Uhr (7 UE) · Feiertage: 08:00–16:30 Uhr (10 UE)',
    phone: '07153 / 6191-221',
    status: 'Noch 3 freie Plätze',
  },
  {
    id: 'iml-herbst-26',
    title: 'Gepr. Logistikmeister(in)',
    courseSlug: 'logistikmeister',
    category: 'Meister',
    mode: 'Teilzeit (Wochenende)',
    courseNumbers: 'IML26SP22',
    locations: ['Plochingen', 'Reutlingen'],
    ue: '850 UE (inkl. AEVO)',
    start: '14. Nov. 2026',
    end: '07. Nov. 2027',
    schedule: 'Sa: 08:00–16:30 Uhr (10 UE) · So: 08:00–13:15 Uhr (7 UE) · Feiertage: 08:00–16:30 Uhr (10 UE)',
    phone: '07153 / 6191-221',
    status: 'Noch Plätze verfügbar',
  },
  {
    id: 'ime-herbst-26',
    title: 'Gepr. Industriemeister(in) Elektro',
    courseSlug: 'industriemeister-elektro',
    category: 'Meister',
    mode: 'Teilzeit (Wochenende)',
    courseNumbers: 'IME26SP21, IME26SP26',
    locations: ['Plochingen', 'Reutlingen'],
    ue: '850 UE (inkl. AEVO)',
    start: '14. Nov. 2026',
    end: '07. Nov. 2027',
    schedule: 'Sa: 08:00–16:30 Uhr (10 UE) · So: 08:00–13:15 Uhr (7 UE) · Feiertage: 08:00–16:30 Uhr (10 UE)',
    phone: '07153 / 6191-221',
    status: 'Noch Plätze verfügbar',
  },
  {
    id: 'imm-herbst-26',
    title: 'Gepr. Industriemeister(in) Mechatronik',
    courseSlug: 'industriemeister-mechatronik',
    category: 'Meister',
    mode: 'Teilzeit (Wochenende)',
    courseNumbers: 'IMM26SP25',
    locations: ['Plochingen', 'Reutlingen'],
    ue: '850 UE (inkl. AEVO)',
    start: '14. Nov. 2026',
    end: '07. Nov. 2027',
    schedule: 'Sa: 08:00–16:30 Uhr (10 UE) · So: 08:00–13:15 Uhr (7 UE) · Feiertage: 08:00–16:30 Uhr (10 UE)',
    phone: '07153 / 6191-221',
    status: 'Noch Plätze verfügbar',
  },
  {
    id: 'tfw-herbst-26',
    title: 'Gepr. Technische(r) Fachwirt(in)',
    courseSlug: 'technischer-fachwirt',
    category: 'Fachwirt',
    mode: 'Teilzeit (Wochenende)',
    courseNumbers: 'TFW26SP20',
    locations: ['Plochingen', 'Reutlingen'],
    ue: '750 UE',
    start: '21. Nov. 2026',
    end: '28. Nov. 2027',
    schedule: 'Sa: 08:00–16:30 Uhr (10 UE) · So: 08:00–13:15 Uhr (7 UE) · Feiertage: 08:00–16:30 Uhr (10 UE)',
    phone: '07153 / 6191-221',
    status: 'Start November 2026',
  },
  {
    id: 'wfw-herbst-26',
    title: 'Gepr. Wirtschaftsfachwirt(in)',
    courseSlug: 'wirtschaftsfachwirt',
    category: 'Fachwirt',
    mode: 'Teilzeit (Wochenende)',
    courseNumbers: 'WFW26SP20',
    locations: ['Plochingen', 'Reutlingen'],
    ue: '525 UE',
    start: '21. Nov. 2026',
    end: '13. Nov. 2027',
    schedule: 'Sa: 08:00–16:30 Uhr (10 UE) · So: 08:00–13:15 Uhr (7 UE) · Feiertage: 08:00–16:30 Uhr (10 UE)',
    phone: '07153 / 6191-221',
    status: 'Start November 2026',
  },
  {
    id: 'tbw-fruehjahr-27',
    title: 'Gepr. Technische(r) Betriebswirt(in)',
    courseSlug: 'technischer-betriebswirt',
    category: 'Betriebswirt',
    mode: 'Teilzeit (Wochenende)',
    courseNumbers: 'TBW27SP10',
    locations: ['Plochingen'],
    ue: '480 UE',
    start: '26. März 2027',
    end: '24. Okt. 2027',
    schedule: 'Sa: 08:00–16:30 Uhr (10 UE) · So: 08:00–13:15 Uhr (7 UE) · Feiertage: 08:00–16:30 Uhr (10 UE)',
    phone: '07153 / 6191-220',
    status: 'Anmeldung offen',
  },
  {
    id: 'vollzeit-mai-27',
    title: 'Vollzeit: Industriemeister Metall, Elektro, Logistik & Mechatronik',
    courseSlug: 'industriemeister-metall',
    category: 'Meister',
    mode: 'Vollzeit (Mo – Fr)',
    courseNumbers: 'IM27V10, IME27V11, IML27V12, IMM27V15',
    locations: ['Plochingen'],
    ue: '850 UE (inkl. AEVO)',
    start: 'ca. 03. Mai 2027',
    end: 'ca. 29. Okt. 2027',
    schedule: 'Mo. bis Fr.: 07:30 – 12:45 Uhr (7 UE täglich, 1 UE = 45 Min.)',
    phone: '07153 / 6191-221',
    status: 'Anmeldung offen',
  },
];

export const benefitsList = [
  {
    title: '40 erfahrene, praxisorientierte Dozenten',
    desc: 'Unterricht von Praktikern mit tiefem IHK-Prüfungs-Know-how statt reiner Theorie.',
  },
  {
    title: 'Kleine Gruppen (16–20 Teilnehmer)',
    desc: 'Kein anonymer Massenbetrieb – wir fordern, fördern und geben jedem Einzelnen direktes Feedback.',
  },
  {
    title: 'Persönliche Lernkontrollen & Motivation',
    desc: 'Regelmäßige Überprüfung des Lernstands sorgt für maximale Sicherheit bis zum Prüfungstag.',
  },
  {
    title: 'Über 25 % aller IM Metall in Baden-Württemberg',
    desc: 'Mehr als ein Viertel aller geprüften Industriemeister Metall in BW wird bei @Learning zum Titel geführt (Stand 2025) – eine der besten Bestehensquoten Deutschlands.',
  },
  {
    title: 'Echter Präsenzunterricht in klimatisierten Räumen',
    desc: 'Direkter Austausch vor Ort in Plochingen und Reutlingen statt reiner Selbstlern-Videos.',
  },
  {
    title: 'Schulungsräume unter der Woche zum Lernen',
    desc: 'Teilnehmer können die Räumlichkeiten in Plochingen unter der Woche kostenlos als ruhige Lernumgebung nutzen.',
  },
];

export const serviceLinks = {
  zulassungen: [
    { title: 'Gesamtübersicht der IHK-Fortbildungsmöglichkeiten & Zulassungen', href: '/downloads/ihk-fortbildungsmoeglichkeiten-ueberblick.pdf', type: 'PDF' },
    { title: 'Geprüfte(r) Industriemeister(in) Metall', href: '/downloads/zulassung-industriemeister-metall.pdf', type: 'PDF' },
    { title: 'Liste der Metallberufe für die Zulassung (IM Metall)', href: '/downloads/liste-metallberufe-im-metall.pdf', type: 'PDF' },
    { title: 'Geprüfte(r) Industriemeister(in) Mechatronik', href: '/downloads/zulassung-industriemeister-mechatronik.pdf', type: 'PDF' },
    { title: 'Geprüfte(r) Industriemeister(in) Elektro', href: '/downloads/zulassung-industriemeister-elektro.pdf', type: 'PDF' },
    { title: 'Geprüfte(r) Logistikmeister(in)', href: '/downloads/zulassung-logistikmeister.pdf', type: 'PDF' },
    { title: 'Geprüfte(r) Technische(r) Fachwirt(in)', href: '/downloads/zulassung-technischer-fachwirt.pdf', type: 'PDF' },
    { title: 'Geprüfte(r) Wirtschaftsfachwirt(in)', href: '/downloads/zulassung-wirtschaftsfachwirt.pdf', type: 'PDF' },
    { title: 'Geprüfte(r) Technische(r) Betriebswirt(in)', href: '/downloads/zulassung-technischer-betriebswirt.pdf', type: 'PDF' },
  ],
  formulareUndOrganisation: [
    { title: 'Personendatenblatt zur Anmeldung bei @Learning', href: '/downloads/personendatenblatt-anmeldung.pdf', type: 'PDF', internal: true },
    { title: 'Raumbelegung November 2026', href: '/downloads/raumbelegung-november-2026.pdf', type: 'PDF', internal: true },
    { title: 'Neues ISO-Zertifikat @Learning (2027 bis 2029)', href: '/downloads/iso-zertifikat-2027-2029.pdf', type: 'PDF', internal: true },
    { title: 'EDV-Empfehlungen für Teilnehmer (Stand 05/2026)', href: '/downloads/edv-empfehlungen-05-2026.pdf', type: 'PDF', internal: true },
    { title: 'Virtuelle Festplatte für @Learning Teilnehmer (nur mit Passwort)', href: 'https://www.mydrive.ch/de', type: 'Extern', internal: false },
    { title: 'Neue englische IHK-Abschlussbezeichnungen', href: '/downloads/neue-englische-ihk-abschlussbezeichnungen.pdf', type: 'PDF', internal: true },
  ],
  ihkUndPruefung: [
    { title: 'Zugelassene Prüfungshilfsmittel für die IHK-Prüfungen', href: '/downloads/zugelassene-pruefungshilfsmittel.pdf', type: 'PDF', internal: true },
    { title: 'DIHK-Formelsammlungen (IM, TFW, WFW, TBW)', href: 'https://www.dihk-bildung.shop/weiterbildung/ihk-pruefungsvorbereitung/formelsammlungen/', type: 'DIHK Shop', internal: false },
    { title: 'Link zur AEVO DIHK-Lern-App', href: 'https://www.dihk-bildung.shop/ihk-aevo-app/700-APP', type: 'DIHK Shop', internal: false },
    { title: 'Allgemeines & Prüfungstermine der IHK Stuttgart (IM/TFW/WFW/TBW)', href: 'https://www.ihk.de/stuttgart/bildung-schulung-pruefung/weiterbildung/pruefungstermine-und-gebuehren-3988212', type: 'IHK Stuttgart', internal: false },
    { title: '@Learning YouTube-Lernvideos (BWL-Ergänzung seit 2014)', href: 'https://www.youtube.com/channel/UCTWAlRZN8KI_YJNqGoOXKYQ', type: 'YouTube', internal: false },
  ],
  foerderungUndBildungszeit: [
    { title: 'Ablauf Aufstiegs-BAföG für angemeldete Teilnehmer', href: '/downloads/ablauf-aufstiegs-bafoeg-teilnehmer.pdf', type: 'PDF', internal: true },
    { title: 'Offizielle Aufstiegs-BAföG-Formblätter A, B, Z, F', href: 'https://www.aufstiegs-bafoeg.de/aufstiegsbafoeg/de/ihr-weg-zur-foerderung/antragsformulare/antragsformulare_node.html', type: 'Bund', internal: false },
    { title: 'Aktuelles der Bundesregierung zum Aufstiegs-BAföG', href: 'https://www.bundesregierung.de/breg-de/aktuelles/aufstiegs-bafoeg-1674632', type: 'Bund', internal: false },
    { title: 'Info zum Weiterbildungsstipendium der IHK', href: '/downloads/weiterbildungsstipendium-ihk.pdf', type: 'PDF', internal: true },
    { title: 'Anerkennung von @Learning nach § 10 Abs. 3 BzG BW (RP Karlsruhe)', href: '/downloads/anerkennung-bildungszeitgesetz-bw.pdf', type: 'PDF', internal: true },
    { title: 'Formular zur Beantragung von Bildungszeit gem. § 7 BzG BW', href: 'https://rp.baden-wuerttemberg.de/fileadmin/RP-Internet/Themenportal/Schule_und_Bildung/Bildungszeit/Fuer_Beschaeftigte_und_Arbeitgeber/01_bildungszeitantrag.pdf', type: 'RP BW PDF', internal: false },
    { title: 'Ablauf der Beantragung des Bildungsurlaubs (Quelle: DGB)', href: '/downloads/ablauf-bildungsurlaub-dgb.jpg', type: 'Grafik', internal: true },
    { title: 'Gesetzestext Bildungszeitgesetz BW (Landesrecht)', href: 'https://www.landesrecht-bw.de/bsbw/document/jlr-BiZGBWrahmen', type: 'Extern', internal: false },
  ],
};

export const bookRecommendations = {
  intro:
    'Für unsere Kurse haben wir eine kompakte Liste an Lernhilfen zusammengestellt. Diese sind für den Unterricht nicht zwingend erforderlich, unterstützen dich aber optimal beim Lernen – für das Fach Recht werden jedoch Gesetzestexte benötigt, die in der IHK-Prüfung verwendet werden dürfen.',
  calculator: {
    name: 'Casio FX-991DE X (ClassWiz)',
    note: 'Empfohlener wissenschaftlicher Taschenrechner für Industriemeister-, Fachwirt- und Betriebswirt-Kurse.',
    url: 'https://www.amazon.de/s?k=Casio+FX-991DE+X',
  },
  lawBooksNote:
    'Bitte immer die neueste im Handel erhältliche Auflage (Verlag C.H. Beck / weiße dtv-Ausgaben) bestellen. Die IHK-Formelsammlungen erhältst du direkt bei uns im Büro.',
  books: [
    { title: 'Umweltrecht (Beck-Texte im dtv)', isbn: '978-3-406-72231-8', forCourses: 'Industriemeister (Metall, Elektro, Mechatronik, Logistik)', url: 'https://www.amazon.de/s?k=umweltrecht+beck+dtv' },
    { title: 'BGB – Bürgerliches Gesetzbuch', isbn: '978-3-406-73748-0', forCourses: 'Industriemeister & Fachwirte', url: 'https://www.amazon.de/s?k=BGB+Beck+dtv' },
    { title: 'ArbG – Arbeitsgesetze', isbn: '978-3-423-05006-7', forCourses: 'Industriemeister & Fachwirte', url: 'https://www.amazon.de/s?k=Arbeitsgesetze+Beck+dtv' },
    { title: 'HGB – Handelsgesetzbuch', isbn: '978-3-423-05002-9', forCourses: 'Fachwirte (TFW / WFW)', url: 'https://www.amazon.de/s?k=HGB+Beck+dtv' },
  ],
  generalPdf: '/downloads/allgemeine-buecherempfehlung.pdf',
};

export const dozentenData = {
  intro:
    'Für unser rund 40-köpfiges Dozententeam suchen wir freiberufliche Verstärkung an den Wochenenden in Präsenz (kein Online-Unterricht) am Standort Plochingen / Reutlingen.',
  subjects: [
    'Zusammenarbeit im Betrieb',
    'Personalentwicklung & Personalwesen',
    'Steuerrecht',
    'Recht (Arbeitsrecht, Umweltrecht, BGB, HGB)',
    'Finanzbuchhaltung',
    'MIKP (Methoden der Information, Kommunikation und Planung)',
    'Volkswirtschaftslehre',
    'Arbeits-, Umwelt- und Sicherheitsschutz',
    'Ausbildereignungsschein (AEVO)',
  ],
  requirements: [
    'Nachgewiesene Lehrtätigkeitserfahrung in den IHK-Weiterbildungen Industriemeister, Technischer Fachwirt oder Technischer Betriebswirt (bitte keine Neueinsteiger)',
    'Präsenzeinsatz an den Wochenenden mit mindestens ca. 100 Unterrichtseinheiten (UE) pro Semester',
    'Erfahrung im organisatorischen Ablauf des IHK-Prüfungswesens',
    'Hohe Planungssicherheit sowie schnelle Erreichbarkeit mit ggf. flexiblem Einsatz',
    'Soziale und fachliche Kompetenz im Umgang mit unseren Kursteilnehmern',
    'Offenheit, Ehrlichkeit, Loyalität und Umsetzung unserer klaren Unternehmensphilosophie',
  ],
  benefits: [
    'Verlässliche und langfristige Planungssicherheit',
    'Leistungsorientierte Bezahlung (umsatzsteuerbefreit nach § 4 Nr. 21 UStG bzw. Bildungsleistung)',
    'Fahrtkostenzuschuss',
    'Kostenlose Verpflegung während der Unterrichtstage',
    'Gut ausgestattete, klimatisierte Schulungsräume',
    'Klare, transparente und kollegiale Zusammenarbeit auf Augenhöhe',
  ],
};

export const communityEvents = [
  {
    date: 'Oktober 2025',
    title: 'Oktoberfest 2025 bei @Learning',
    desc: 'Gemeinschaft wird bei uns großgeschrieben: Im Herbst 2025 haben Kursteilnehmer, Absolventen und Dozenten gemeinsam unser traditionelles @Learning-Oktoberfest in Plochingen gefeiert.',
  },
  {
    date: 'April 2023',
    title: 'Spendenaktion für die Erdbebenopfer in der Türkei und Syrien',
    desc: 'Unsere Teilnehmer und Dozenten haben zwei Monate lang tatkräftig gespendet und Betroffene gemeinsam unterstützt – dafür unseren allergrößten Dank.',
  },
  {
    date: 'Juni 2021',
    title: 'Kostenloses Ernährungsseminar für Kursteilnehmer & Dozenten',
    desc: 'Am 13.06.2021 veranstaltete @Learning gemeinsam mit Peter Kettler (Kettler Studio) und Ernährungscoach Sven Hertler ein kostenloses Seminar rund um gesunde Ernährung für Beruf, Alltag und Sport.',
  },
  {
    date: 'Mai 2021',
    title: '3.000 € Spende an die Olgäle-Stiftung für das kranke Kind e.V.',
    desc: 'Teilnehmer und Dozenten sammelten rund 1.500 €, @Learning verdoppelte den Betrag auf 3.000 €. Am 06.05.2021 wurde der Scheck zur Unterstützung der Klinikclowns und Kinder-Onkologie im Olgahospital Stuttgart übergeben.',
    link: 'https://www.olgaele-stiftung.de/bildungszentrum-learning-aus-plochingen-spendet-3-000-euro-fuer-klinikclowns-und-onkologie/',
  },
];

export const faqs = [
  {
    q: 'Welche Kosten übernimmt der Staat durch Aufstiegs-BAföG & KfW?',
    a: 'Alle anerkannten IHK-Weiterbildungskurse sind zu 100 % nach dem Aufstiegs-BAföG förderfähig. Du erhältst 50 % der Kurs- und Prüfungsgebühren direkt als Zuschuss geschenkt. Die restlichen 50 % kannst du über ein zinsloses Darlehen der staatlichen KfW-Bank finanzieren – und bei bestandener Prüfung erhältst du nochmals 50 % Erlass auf das KfW-Darlehen. Dein effektiver Eigenanteil beträgt damit in der Regel nur 25 %. Zusätzlich ist eine Förderung über das IHK-Weiterbildungsstipendium möglich.',
  },
  {
    q: 'Wie schafft @Learning den Industriemeister in nur 850 UE statt ca. 1.200 UE?',
    a: 'Durch kleine Gruppen (16–20 Teilnehmer), 40 praxiserfahrene Dozenten mit IHK-Prüfungserfahrung und eine konsequent prüfungsorientierte Struktur ohne unnötigen Leerlauf. So erreichst du deinen IHK-Abschluss am Wochenende in rund einem Jahr – ohne Qualitätsverlust.',
  },
  {
    q: 'Ist der Ausbilderschein (AEVO) im Kurs enthalten?',
    a: 'Ja, bei allen Industriemeister-Kursen (Metall, Elektro, Mechatronik) und beim Logistikmeister ist die AEVO-Qualifikation (50 UE) fest im Lehrgang enthalten. Bei Fachwirten (TFW/WFW) entfällt der schriftliche AEVO-Teil per Prüfungsordnung, und für die praktische Prüfung bereiten wir dich gezielt in ca. 10 UE vor.',
  },
  {
    q: 'Kann ich in Plochingen unter der Woche in den Räumen lernen?',
    a: 'Ja! Als @Learning-Teilnehmer kannst du unsere klimatisierten Schulungsräume in Plochingen auch unter der Woche kostenfrei als ruhige Lernumgebung nutzen.',
  },
  {
    q: 'Was brauche ich für die Anmeldung?',
    a: 'Vereinbare einfach einen persönlichen Beratungstermin. Zur Anmeldung bringst du bitte mit: (1) tabellarischen Lebenslauf mit Lichtbild & Unterschrift, (2) Facharbeiter-/Gesellenbrief oder Abschlusszeugnis, (3) Arbeitsbescheinigung mit Tätigkeitsbezeichnung (beim TBW nicht nötig) sowie (4) Personalausweis oder Reisepass. Die BAföG-Unterlagen füllen wir gemeinsam mit dir aus!',
  },
];
