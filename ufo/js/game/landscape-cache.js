(function () {
  "use strict";

  window.UFOGame =
    window.UFOGame || {};

  var cacheCanvas = null;
  var cacheContext = null;

  var cacheState = {
    width: 0,
    height: 0,
    dpr: 0,
    quality: "",
    valid: false,
    builds: 0
  };


  function clampDpr(value) {

    value = Number(value);

    if (
      !Number.isFinite(value) ||
      value <= 0
    ) {
      return 1;
    }

    return Math.min(
      2,
      Math.max(1, value)
    );

  }


  function getQuality() {

    if (
      window.UFOGame.settings &&
      typeof window.UFOGame.settings
        .getGraphics === "function"
    ) {

      return (
        window.UFOGame.settings
          .getGraphics() ||
        "mid"
      );

    }

    return "mid";

  }


  function ellipse(
    context,
    x,
    y,
    radiusX,
    radiusY,
    fill
  ) {

    context.fillStyle = fill;

    context.beginPath();

    context.ellipse(
      x,
      y,
      radiusX,
      radiusY,
      0,
      0,
      Math.PI * 2
    );

    context.fill();

  }


  function drawStaticScene(
    context,
    width,
    height,
    quality
  ) {

    context.clearRect(
      0,
      0,
      width,
      height
    );


    /* Himmel */

    var sky =
      context.createLinearGradient(
        0,
        0,
        0,
        height
      );

    sky.addColorStop(
      0,
      "#01020c"
    );

    sky.addColorStop(
      0.48,
      "#0a1c43"
    );

    sky.addColorStop(
      0.68,
      "#29436a"
    );

    sky.addColorStop(
      0.695,
      "#111b12"
    );

    sky.addColorStop(
      1,
      "#010704"
    );

    context.fillStyle = sky;

    context.fillRect(
      0,
      0,
      width,
      height
    );


    /* Himmelsleuchten */

    var skyGlow =
      context.createRadialGradient(
        width * 0.8,
        height * 0.15,
        5,
        width * 0.8,
        height * 0.15,
        width * 0.34
      );

    skyGlow.addColorStop(
      0,
      "rgba(173,222,255,.18)"
    );

    skyGlow.addColorStop(
      0.35,
      "rgba(81,137,255,.07)"
    );

    skyGlow.addColorStop(
      1,
      "rgba(8,20,60,0)"
    );

    context.fillStyle =
      skyGlow;

    context.fillRect(
      0,
      0,
      width,
      height
    );


    /* Mond */

    context.save();

    if (quality !== "low") {

      context.shadowColor =
        "#c7e9ff";

      context.shadowBlur =
        quality === "high"
          ? 32
          : 18;

    }

    ellipse(
      context,
      width * 0.8,
      height * 0.15,
      38,
      38,
      "#ebf7ff"
    );

    context.globalAlpha =
      quality === "low"
        ? 0.12
        : 0.23;

    context.strokeStyle =
      "#c7e9ff";

    context.lineWidth = 2;

    var moonRings =
      quality === "high"
        ? 3
        : quality === "mid"
          ? 2
          : 1;

    for (
      var moonRing = 1;
      moonRing <= moonRings;
      moonRing++
    ) {

      context.beginPath();

      context.arc(
        width * 0.8,
        height * 0.15,
        38 + moonRing * 9,
        0,
        Math.PI * 2
      );

      context.stroke();

    }

    context.restore();


    /* Ferne Berge */

    context.fillStyle =
      "rgba(166,205,226,.18)";

    context.beginPath();

    context.moveTo(
      width * 0.69,
      height * 0.67
    );

    context.lineTo(
      width * 0.77,
      height * 0.58
    );

    context.lineTo(
      width * 0.85,
      height * 0.67
    );

    context.closePath();
    context.fill();


    /* Gebäude */

    context.fillStyle =
      "#09130e";

    context.fillRect(
      width * 0.735,
      height * 0.63,
      width * 0.07,
      height * 0.08
    );


    /* Baumreihe */

    var treeCount =
      quality === "low"
        ? 11
        : quality === "mid"
          ? 15
          : 18;

    for (
      var tree = 0;
      tree < treeCount;
      tree++
    ) {

      var treeX =
        tree *
        (
          width /
          Math.max(
            1,
            treeCount - 1
          )
        );

      var treeHeight =
        18 +
        (
          tree % 5
        ) *
        11;

      context.fillStyle =
        "rgba(3,13,8,.92)";

      context.beginPath();

      context.moveTo(
        treeX -
        treeHeight * 0.8,
        height * 0.695
      );

      context.lineTo(
        treeX,
        height * 0.695 -
        treeHeight
      );

      context.lineTo(
        treeX +
        treeHeight * 0.8,
        height * 0.695
      );

      context.closePath();
      context.fill();

      context.fillRect(
        treeX - 2,
        height * 0.695 -
        treeHeight * 0.15,
        4,
        treeHeight * 0.4
      );

    }


    /* Hügel */

    context.fillStyle =
      "#10200e";

    context.beginPath();

    context.moveTo(
      0,
      height * 0.7
    );

    for (
      var hillX = 0;
      hillX <= width;
      hillX += 32
    ) {

      context.lineTo(
        hillX,
        height * 0.65 +
        Math.sin(
          hillX * 0.028
        ) *
        18
      );

    }

    context.lineTo(
      width,
      height
    );

    context.lineTo(
      0,
      height
    );

    context.fill();


    /* Boden */

    var foreground =
      context.createLinearGradient(
        0,
        height * 0.69,
        0,
        height
      );

    foreground.addColorStop(
      0,
      "#173615"
    );

    foreground.addColorStop(
      1,
      "#020904"
    );

    context.fillStyle =
      foreground;

    context.fillRect(
      0,
      height * 0.72,
      width,
      height * 0.28
    );


    /* Bodennebel */

    var haze =
      context.createLinearGradient(
        0,
        height * 0.7,
        0,
        height * 0.86
      );

    haze.addColorStop(
      0,
      quality === "low"
        ? "rgba(160,220,255,.07)"
        : "rgba(160,220,255,.14)"
    );

    haze.addColorStop(
      1,
      "rgba(160,220,255,0)"
    );

    context.fillStyle =
      haze;

    context.fillRect(
      0,
      height * 0.7,
      width,
      height * 0.16
    );


    /* Statisches Gras */

    var grassCount =
      quality === "low"
        ? 45
        : quality === "mid"
          ? 90
          : 140;

    for (
      var grass = 0;
      grass < grassCount;
      grass++
    ) {

      var grassX =
        (
          grass * 83
        ) %
        width;

      var grassY =
        height * 0.72 +
        (
          (
            grass * 47
          ) %
          (
            height * 0.28
          )
        );

      context.strokeStyle =
        "rgba(93,149,58," +
        (
          0.1 +
          (
            grass % 4
          ) *
          0.035
        ) +
        ")";

      context.lineWidth = 1;

      context.beginPath();

      context.moveTo(
        grassX,
        grassY
      );

      context.lineTo(
        grassX +
        (
          grass % 5 - 2
        ) *
        3,
        grassY -
        5 -
        (
          grass % 7
        )
      );

      context.stroke();

    }


    /* Zaun */

    context.strokeStyle =
      "rgba(44,75,33,.9)";

    context.lineWidth = 3;

    context.beginPath();

    context.moveTo(
      0,
      height * 0.76
    );

    context.lineTo(
      width,
      height * 0.8
    );

    context.moveTo(
      0,
      height * 0.8
    );

    context.lineTo(
      width,
      height * 0.84
    );

    context.stroke();


    /* Vignette */

    var vignette =
      context.createRadialGradient(
        width * 0.5,
        height * 0.48,
        height * 0.25,
        width * 0.5,
        height * 0.48,
        Math.max(
          width,
          height
        ) *
        0.74
      );

    vignette.addColorStop(
      0.54,
      "rgba(0,0,0,0)"
    );

    vignette.addColorStop(
      1,
      "rgba(0,0,10,.38)"
    );

    context.fillStyle =
      vignette;

    context.fillRect(
      0,
      0,
      width,
      height
    );

  }


  function rebuild(options) {

    options =
      options || {};

    var width =
      Math.max(
        1,
        Math.round(
          options.width ||
          window.innerWidth
        )
      );

    var height =
      Math.max(
        1,
        Math.round(
          options.height ||
          window.innerHeight
        )
      );

    var dpr =
      clampDpr(
        options.dpr ||
        window.devicePixelRatio ||
        1
      );

    var quality =
      options.quality ||
      getQuality();


    if (!cacheCanvas) {

      cacheCanvas =
        document.createElement(
          "canvas"
        );

      cacheContext =
        cacheCanvas.getContext(
          "2d",
          {
            alpha: false
          }
        );

    }


    cacheCanvas.width =
      Math.max(
        1,
        Math.round(
          width * dpr
        )
      );

    cacheCanvas.height =
      Math.max(
        1,
        Math.round(
          height * dpr
        )
      );


    cacheContext.setTransform(
      dpr,
      0,
      0,
      dpr,
      0,
      0
    );


    drawStaticScene(
      cacheContext,
      width,
      height,
      quality
    );


    cacheState.width =
      width;

    cacheState.height =
      height;

    cacheState.dpr =
      dpr;

    cacheState.quality =
      quality;

    cacheState.valid =
      true;

    cacheState.builds += 1;


    return cacheState;

  }


  function ensure(options) {

    options =
      options || {};

    var width =
      Math.round(
        options.width ||
        window.innerWidth
      );

    var height =
      Math.round(
        options.height ||
        window.innerHeight
      );

    var dpr =
      clampDpr(
        options.dpr ||
        window.devicePixelRatio ||
        1
      );

    var quality =
      options.quality ||
      getQuality();


    if (
      !cacheState.valid ||
      cacheState.width !== width ||
      cacheState.height !== height ||
      Math.abs(
        cacheState.dpr - dpr
      ) > 0.01 ||
      cacheState.quality !== quality
    ) {

      rebuild({
        width: width,
        height: height,
        dpr: dpr,
        quality: quality
      });

    }


    return cacheState;

  }


  function draw(
    context,
    width,
    height,
    dpr,
    quality
  ) {

    ensure({
      width: width,
      height: height,
      dpr: dpr,
      quality: quality
    });


    if (
      !cacheCanvas ||
      !cacheState.valid
    ) {
      return false;
    }


    context.save();

    context.setTransform(
      1,
      0,
      0,
      1,
      0,
      0
    );

    context.drawImage(
      cacheCanvas,
      0,
      0
    );

    context.restore();


    return true;

  }


  function invalidate() {

    cacheState.valid =
      false;

  }


  window.addEventListener(
    "ufo:graphics-change",
    invalidate
  );


  window.addEventListener(
    "resize",
    invalidate,
    {
      passive: true
    }
  );


  window.addEventListener(
    "orientationchange",
    invalidate,
    {
      passive: true
    }
  );


  document.addEventListener(
    "fullscreenchange",
    invalidate
  );


  document.addEventListener(
    "webkitfullscreenchange",
    invalidate
  );


  window.UFOGame.landscapeCache = {

    rebuild:
      rebuild,

    ensure:
      ensure,

    draw:
      draw,

    invalidate:
      invalidate,

    getState:
      function () {

        return Object.assign(
          {},
          cacheState
        );

      }

  };

})();
