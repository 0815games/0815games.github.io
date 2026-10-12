/* Parameter des Förderrechners. Stand: Oktober 2026. Quellen siehe unten. Beträge bitte jährlich prüfen. */
window.FOERDER={
 stand:"Oktober 2026",
 max:15000,            /* max. förderfähige Lehrgangs- und Prüfungsgebühren (AFBG) */
 zuschuss:0.5,         /* Zuschussanteil */
 erlassBestanden:0.5,  /* Erlass auf das Darlehen bei bestandener Prüfung */
 unterhalt:{single:1019,partner:235,kind:235,betreuung:150},
 stipendium:{gesamt:9135,jahr:3045,eigen:10},
 bildungszeit:{tage:5,wochen:9,monate:12},
 gebuehrenStand:"Gebührentarif der IHK Region Stuttgart, gültig ab 01.08.2025",
 /* Prüfungsgebühren IHK Region Stuttgart (Summe aller Prüfungsteile), g=null: bitte selbst eintragen */
 pruefung:{
  im:{t:"Industriemeister Metall",g:820,d:"Basisqualifikation 380 € + Handlungsspezifisch 440 €"},
  imm:{t:"Industriemeister Mechatronik",g:820,d:"Basisqualifikation 380 € + Handlungsspezifisch 440 €"},
  ime:{t:"Industriemeister Elektro",g:820,d:"Basisqualifikation 380 € + Handlungsspezifisch 440 €"},
  iml:{t:"Logistikmeister",g:860,d:"Grundlegende Qualifikationen 380 € + Handlungsspezifisch 480 €"},
  tfw:{t:"Technischer Fachwirt",g:980,d:"Wirtschaft 340 € + Technik 300 € + Handlungsspezifisch 340 €"},
  tbw:{t:"Technischer Betriebswirt",g:980,d:"Grundlagen 360 € + Management 360 € + Projektarbeit 260 €"},
  wfw:{t:"Wirtschaftsfachwirt",g:720,d:"Wirtschaft 340 € + Handlungsspezifisch 380 €"},
  kombi1:{t:"Kombimodell Industriemeister Metall + Technischer Betriebswirt",g:1800,d:"820 € + 980 €"},
  kombi2:{t:"Kombimodell Technischer Fachwirt + Technischer Betriebswirt",g:1960,d:"980 € + 980 €"},
  aevo:{t:"Ausbildung der Ausbilder (AEVO)",g:null,d:"Gebühr bitte bei der IHK erfragen"}
 },
 /* Prüfungsperioden 2027, IHK Region Stuttgart */
 termine:[
  {k:"Industriemeister Metall",f:"Basis 29./30. April · Handlungsspez. 20./21. Mai",h:"Basis 21./22. Oktober · Handlungsspez. 18./19. November",as:"15. Februar / 1. August"},
  {k:"Industriemeister Elektro",f:"Basis 29./30. April · Handlungsspez. 25./26. Mai",h:"Basis 21./22. Oktober · Handlungsspez. 23./24. November",as:"15. Februar / 1. August"},
  {k:"Industriemeister Mechatronik",f:"Basis 29./30. April · Handlungsspez. 2./3. Juni",h:"Basis 21./22. Oktober · Handlungsspez. 29./30. November",as:"15. Februar / 1. August"},
  {k:"Logistikmeister",f:"Grundlegende Qual. 29./30. April · Handlungsspez. 12./13. Mai",h:"Grundlegende Qual. 21./22. Oktober · Handlungsspez. 11./12. November",as:"15. Februar / 1. August"},
  {k:"Technischer Fachwirt",f:"Wirtschaft 17. März · Technik 5. März · Handlungsspez. 5. Mai",h:"Wirtschaft 13. Oktober · Technik 22. September · Handlungsspez. 3. Dezember",as:"15. Dezember bzw. 15. Juli (Handlungsspez. 1. März / 1. September)"},
  {k:"Wirtschaftsfachwirt",f:"Wirtschaft 17. März · Handlungsspez. 20./21. April",h:"Wirtschaft 13. Oktober · Handlungsspez. 25./26. November",as:"15. Dezember / 15. Juli"},
  {k:"Technischer Betriebswirt",f:"Grundlagen 24./25. Februar · Management 3./4. März · Projektarbeit auf Anfrage",h:"Grundlagen 28./29. Oktober · Management 3./4. November · Projektarbeit auf Anfrage",as:"31. Dezember / 1. August"}
 ],
 links:[
  {t:"Aufstiegs-BAföG: Wie wird gefördert? (Bundesportal)",u:"https://www.aufstiegs-bafoeg.de/aufstiegsbafoeg/de/die-foerderung/wie-wird-gefoerdert/wie-wird-mit-dem-aufstiegs-bafoeg-gefoerdert.html"},
  {t:"KfW Aufstiegs-BAföG (172)",u:"https://www.kfw.de/inlandsfoerderung/Privatpersonen/Studieren-Qualifizieren/F%C3%B6rderprodukte/Aufstiegs-BAf%C3%B6G-(172)/"},
  {t:"Online-Antrag AFBG digital",u:"https://www.afbg-digital.de"},
  {t:"IHK Region Stuttgart: Prüfungstermine und Gebühren",u:"https://www.ihk.de/stuttgart/bildung-schulung-pruefung/weiterbildung/pruefungstermine-und-gebuehren-3988212"},
  {t:"IHK Region Stuttgart: Weiterbildungsstipendium",u:"https://www.ihk.de/stuttgart/fuer-azubis/stipendien-und-hilfsprogramme-fuer-azubis-und-absolventen/merkblatt-zur-begabtenfoerderung-berufliche-bildung-671290"},
  {t:"Bildungszeit Baden-Württemberg (Regierungspräsidien)",u:"https://rp.baden-wuerttemberg.de/themen/bildung/seiten/bildungszeit/"},
  {t:"Bildungszeit beantragen (service-bw)",u:"https://www.service-bw.de/zufi/leistungen/2317"}
 ]
};
