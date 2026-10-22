(function () {
  "use strict";

  window.UFOGame = window.UFOGame || {};

  var cacheCanvas = document.createElement("canvas");
  var cacheContext = cacheCanvas.getContext("2d", {
    alpha: false
  });

  var state = {
    width: 0,
    height: 0,
    dpr: 0,
    quality: "",
    valid: false,
    rebuilds: 0
  };


  function profile() {
    var settings = window.UFOGame.settings;

    if (
      settings &&
      typeof settings.getGraphicsProfile === "function"
    ) {
      return settings.getGraphicsProfile();
    }

    return {
      id: "mid",
      maxDpr: 1.25
    };
  }


  function currentQuality() {
    var settings = window.UFOGame.settings;

    if (
      settings &&
      typeof settings.getGraphics === "function"
    ) {
      return settings.getGraphics();
    }

    return "mid";
  }


  function drawEllipse(
    context,
    cx,
    cy,
    rx,
    ry,
    fill
  ) {
    context.fillStyle = fill;
    context.beginPath();
    context.ellipse(
      cx,
      cy,
      rx,
      ry,
      0,
      0,
      Math.PI * 2
    );
    context.fill();
  }


  function renderStaticScene(
    context,
    width,
    height,
    quality
  ) {
    var sky = context.createLinearGradient(
      0,
      0,
      0,
      height
    );

    sky.addColorStop(0, "#01020c");
    sky.addColorStop(0.48, "#0a1c43");
    sky.addColorStop(0.68, "#29436a");
    sky.addColorStop(0.695, "#111b12");
    sky.addColorStop(1, "#010704");

    context.fillStyle = sky;
    context.fillRect(0, 0, width, height);


    var skyGlow = context.createRadialGradient(
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

    context.fillStyle = skyGlow;
    context.fillRect(0, 0, width, height);


    /*
     * Statischer Mond.
     */

    context.save();

    context.shadowColor = "#c7e9ff";
    context.shadowBlur =
      quality === "low"
        ? 13
        : quality === "mid"
          ? 22
          : 32;

    drawEllipse(
      context,
      width * 0.8,
      height * 0.15,
      38,
      38,
      "#ebf7ff"
    );

    if (quality !== "low") {
      context.globalAlpha = 0.23;
      context.strokeStyle = "#c7e9ff";
      context.lineWidth = 2;

      var ringCount =
        quality === "high"
          ? 3
          : 2;

      for (
        var moonRing = 1;
        moonRing <= ringCount;
        moonRing += 1
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
    }

    context.restore();


    /*
     * Ferne Berg-/Gebäudestruktur.
     */

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

    context.fillStyle = "#09130e";

    context.fillRect(
      width * 0.735,
      height * 0.63,
      width * 0.07,
      height * 0.08
    );


    /*
     * Baumreihe wird nur einmal erzeugt.
     */

    var treeCount =
      quality === "low"
        ? 10
        : quality === "mid"
          ? 14
          : 18;

    for (
      var tree = 0;
      tree < treeCount;
      tree += 1
    ) {
      var treeX =
        tree * width /
        Math.max(1, treeCount - 1);

      var treeHeight =
        18 + (tree % 5) * 11;

      context.fillStyle =
        "rgba(3,13,8,.92)";

      context.beginPath();

      context.moveTo(
        treeX - treeHeight * 0.8,
        height * 0.695
      );

      context.lineTo(
        treeX,
        height * 0.695 - treeHeight
      );

      context.lineTo(
        treeX + treeHeight * 0.8,
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


    /*
     * Hügel und Vordergrund.
     */

    context.fillStyle = "#10200e";
    context.beginPath();
    context.moveTo(0, height * 0.7);

    for (
      var hillX = 0;
      hillX <= width;
      hillX += 32
    ) {
      context.lineTo(
        hillX,
        height * 0.65 +
          Math.sin(hillX * 0.028) * 18
      );
    }

    context.lineTo(width, height);
    context.lineTo(0, height);
    context.closePath();
    context.fill();


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

    context.fillStyle = foreground;

    context.fillRect(
      0,
      height * 0.72,
      width,
      height * 0.28
    );


    var haze =
      context.createLinearGradient(
        0,
        height * 0.7,
        0,
        height * 0.86
      );

    haze.addColorStop(
      0,
      "rgba(160,220,255,.14)"
    );

    haze.addColorStop(
      1,
      "rgba(160,220,255,0)"
    );

    context.fillStyle = haze;

    context.fillRect(
      0,
      height * 0.7,
      width,
      height * 0.16
    );


    /*
     * Statisches Gras.
     */

    var grassCount =
      quality === "low"
        ? 45
        : quality === "mid"
          ? 90
          : 140;

    for (
      var grass = 0;
      grass < grassCount;
      grass += 1
    ) {
      var grassX =
        grass * 83 % width;

      var grassY =
        height * 0.72 +
        (
          grass * 47 %
          Math.max(1, height * 0.28)
        );

      context.strokeStyle =
        "rgba(93,149,58," +
        (
          0.1 +
          (grass % 4) * 0.035
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
          (grass % 5 - 2) * 3,
        grassY -
          5 -
          (grass % 7)
      );

      context.stroke();
    }


    /*
     * Zaun.
     */

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


    /*
     * Statische Vignette.
     */

    var vignette =
      context.createRadialGradient(
        width * 0.5,
        height * 0.48,
        height * 0.25,
        width * 0.5,
        height * 0.48,
        Math.max(width, height) * 0.74
      );

    vignette.addColorStop(
      0.54,
      "rgba(0,0,0,0)"
    );

    vignette.addColorStop(
      1,
      "rgba(0,0,10,.38)"
    );

    context.fillStyle = vignette;

    context.fillRect(
      0,
      0,
      width,
      height
    );
  }


  function rebuild(options) {
    options = options || {};

    var width =
      Math.max(
        1,
        Math.round(
          Number(options.width) ||
          window.innerWidth ||
          1
        )
      );

    var height =
      Math.max(
        1,
        Math.round(
          Number(options.height) ||
          window.innerHeight ||
          1
        )
      );

    var selectedProfile = profile();

    var requestedDpr =
      Math.max(
        1,
        Number(options.dpr) || 1
      );

    var cacheDpr =
      Math.min(
        requestedDpr,
        Number(
          selectedProfile.maxDpr
        ) || requestedDpr
      );

    var quality =
      options.quality ||
      currentQuality();


    cacheCanvas.width =
      Math.max(
        1,
        Math.round(
          width * cacheDpr
        )
      );

    cacheCanvas.height =
      Math.max(
        1,
        Math.round(
          height * cacheDpr
        )
      );

    cacheCanvas.style.width =
      width + "px";

    cacheCanvas.style.height =
      height + "px";


    cacheContext.setTransform(
      cacheDpr,
      0,
      0,
      cacheDpr,
      0,
      0
    );

    cacheContext.clearRect(
      0,
      0,
      width,
      height
    );

    renderStaticScene(
      cacheContext,
      width,
      height,
      quality
    );


    state.width = width;
    state.height = height;
    state.dpr = cacheDpr;
    state.quality = quality;
    state.valid = true;
    state.rebuilds += 1;


    window.dispatchEvent(
      new CustomEvent(
        "ufo:landscape-cache-rebuilt",
        {
          detail: getState()
        }
      )
    );


    return getState();
  }


  function requiresRebuild(
    width,
    height,
    dpr,
    quality
  ) {
    return (
      !state.valid ||
      state.width !== width ||
      state.height !== height ||
      Math.abs(
        state.dpr - dpr
      ) > 0.01 ||
      state.quality !== quality
    );
  }


  function draw(
    targetContext,
    options
  ) {
    if (!targetContext) {
      return false;
    }

    options = options || {};

    var width =
      Math.max(
        1,
        Math.round(
          Number(options.width) ||
          window.innerWidth ||
          1
        )
      );

    var height =
      Math.max(
        1,
        Math.round(
          Number(options.height) ||
          window.innerHeight ||
          1
        )
      );

    var selectedProfile = profile();

    var requestedDpr =
      Math.max(
        1,
        Number(options.dpr) || 1
      );

    var dpr =
      Math.min(
        requestedDpr,
        Number(
          selectedProfile.maxDpr
        ) || requestedDpr
      );

    var quality =
      options.quality ||
      currentQuality();


    if (
      requiresRebuild(
        width,
        height,
        dpr,
        quality
      )
    ) {
      rebuild({
        width: width,
        height: height,
        dpr: dpr,
        quality: quality
      });
    }


    targetContext.drawImage(
      cacheCanvas,
      0,
      0,
      cacheCanvas.width,
      cacheCanvas.height,
      0,
      0,
      width,
      height
    );


    return true;
  }


  function invalidate() {
    state.valid = false;
  }


  function getState() {
    return {
      width: state.width,
      height: state.height,
      dpr: state.dpr,
      quality: state.quality,
      valid: state.valid,
      rebuilds: state.rebuilds,
      pixelWidth: cacheCanvas.width,
      pixelHeight: cacheCanvas.height
    };
  }


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


  window.addEventListener(
    "fullscreenchange",
    invalidate
  );


  window.addEventListener(
    "ufo:graphics-change",
    invalidate
  );


  window.UFOGame.landscapeCache = {
    rebuild: rebuild,
    draw: draw,
    invalidate: invalidate,
    getState: getState
  };

})();
