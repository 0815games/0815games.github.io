(function () {
  "use strict";

  var intro =
    document.getElementById("ufoIntro");

  var particleField =
    document.getElementById(
      "phase3BeamParticles"
    );


  if (!intro || !particleField) {
    console.warn(
      "Phase 3: Beam-Partikelsystem nicht initialisiert."
    );
    return;
  }


  var reducedMotion =
    window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;


  var mobile =
    window.matchMedia(
      "(pointer: coarse)"
    ).matches;


  if (reducedMotion) {
    return;
  }


  /*
   * Desktop bekommt mehr Beam-Partikel.
   * Mobile bewusst weniger, um Compositing zu reduzieren.
   */

  var particleCount =
    mobile ? 16 : 34;


  for (
    var i = 0;
    i < particleCount;
    i++
  ) {

    var particle =
      document.createElement("i");


    particle.className =
      "phase3Particle";


    particle.style.setProperty(
      "--particle-x",
      (
        15 +
        Math.random() * 70
      ) + "%"
    );


    particle.style.setProperty(
      "--particle-size",
      (
        1.3 +
        Math.random() * 3.4
      ).toFixed(2) + "px"
    );


    particle.style.setProperty(
      "--particle-duration",
      (
        1.5 +
        Math.random() * 2.5
      ).toFixed(2) + "s"
    );


    particle.style.setProperty(
      "--particle-delay",
      (
        -Math.random() * 4
      ).toFixed(2) + "s"
    );


    particle.style.setProperty(
      "--particle-drift",
      (
        -18 +
        Math.random() * 36
      ).toFixed(1) + "px"
    );


    particleField.appendChild(
      particle
    );
  }


  /*
   * Kurzer Energieimpuls beim Einschalten
   * des Tractor Beams.
   */

  var beamWasActive = false;


  function monitorBeam() {

    if (!document.body.contains(intro)) {
      observer.disconnect();
      return;
    }


    var active =
      intro.classList.contains(
        "phase-beam"
      );


    if (
      active &&
      !beamWasActive
    ) {

      intro.classList.add(
        "phase3-energy-impact"
      );


      window.setTimeout(
        function () {
          intro.classList.remove(
            "phase3-energy-impact"
          );
        },
        650
      );
    }


    beamWasActive = active;
  }


  var observer =
    new MutationObserver(
      monitorBeam
    );


  observer.observe(
    intro,
    {
      attributes: true,
      attributeFilter: [
        "class"
      ]
    }
  );


  monitorBeam();


  window.addEventListener(
    "pagehide",
    function () {
      observer.disconnect();
    }
  );

})();
