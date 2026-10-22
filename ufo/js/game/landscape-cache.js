(function () {
  "use strict";

  window.UFOGame =
    window.UFOGame || {};


  var cacheCanvas = null;
  var cacheContext = null;

  var valid = false;

  var metadata = {
    width: 0,
    height: 0,
    dpr: 1,
    quality: "mid",
    rebuilds: 0,
    lastBuildMs: 0,
    pixelWidth: 0,
    pixelHeight: 0
  };


  function clamp(value, min, max) {

    value = Number(value);

    if (!Number.isFinite(value)) {
      value = min;
    }

    return Math.min(
      max,
      Math.max(min, value)
    );

  }


  function qualityConfig(quality) {

    quality =
      String(quality || "mid")
        .toLowerCase();


    if (quality === "low") {

      return {
        quality: "low",
        treeCount: 11,
        grassCount: 35,
        moonGlow: false,
        fence: true
      };

    }


    if (quality === "high") {

      return {
        quality: "high",
        treeCount: 18,
        grassCount: 120,
        moonGlow: true,
        fence: true
      };

    }


    return {
      quality: "mid",
      treeCount: 15,
      grassCount: 70,
      moonGlow: true,
      fence: true
    };

  }


  function ensureCanvas() {

    if (cacheCanvas) {
      return;
    }


    cacheCanvas =
      document.createElement("canvas");


    cacheCanvas.setAttribute(
      "aria-hidden",
      "true"
    );


    cacheContext =
      cacheCanvas.getContext(
        "2d",
        {
          alpha: false,
          desynchronized: true
        }
      );

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


  function drawSky(
    context,
    width,
    height
  ) {

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


    var glow =
      context.createRadialGradient(
        width * 0.8,
        height * 0.15,
        5,
        width * 0.8,
        height * 0.15,
        width * 0.34
      );


    glow.addColorStop(
      0,
      "rgba(173,222,255,.18)"
    );

    glow.addColorStop(
      0.35,
      "rgba(81,137,255,.07)"
    );

    glow.addColorStop(
      1,
      "rgba(8,20,60,0)"
    );


    context.fillStyle = glow;

    context.fillRect(
      0,
      0,
      width,
      height
    );

  }


  function drawAuroraBase(
    context,
    width,
    height
  ) {

    var aurora =
      context.createLinearGradient(
        0,
        height * 0.12,
        width,
        height * 0.48
      );


    aurora.addColorStop(
      0,
      "rgba(36,255,186,0)"
    );

    aurora.addColorStop(
      0.35,
      "rgba(48,224,190,.11)"
    );

    aurora.addColorStop(
      0.62,
      "rgba(95,107,255,.10)"
    );

    aurora.addColorStop(
      1,
      "rgba(40,135,255,0)"
    );


    context.fillStyle = aurora;

    context.beginPath();

    context.moveTo(
      0,
      height * 0.18
    );

    context.bezierCurveTo(
      width * 0.24,
      height * 0.1,
      width * 0.34,
      height * 0.43,
      width * 0.58,
      height * 0.23
    );

    context.bezierCurveTo(
      width * 0.75,
      height * 0.05,
      width * 0.87,
      height * 0.32,
      width,
      height * 0.14
    );

    context.lineTo(
      width,
      height * 0.48
    );

    context.bezierCurveTo(
      width * 0.78,
      height * 0.38,
      width * 0.67,
      height * 0.6,
      width * 0.45,
      height * 0.4
    );

    context.bezierCurveTo(
      width * 0.2,
      height * 0.53,
      width * 0.14,
      height * 0.25,
      0,
      height * 0.43
    );

    context.closePath();
    context.fill();

  }


  function drawMoon(
    context,
    width,
    height,
    config
  ) {

    var moonX =
      width * 0.8;

    var moonY =
      height * 0.15;


    context.save();


    if (config.moonGlow) {

      context.shadowColor =
        "#c7e9ff";

      context.shadowBlur =
        28;

    }


    ellipse(
      context,
      moonX,
      moonY,
      38,
      38,
      "#ebf7ff"
    );


    context.shadowBlur = 0;


    context.globalAlpha =
      0.17;

    context.strokeStyle =
      "#c7e9ff";

    context.lineWidth = 2;


    for (
      var ring = 1;
      ring < 4;
      ring += 1
    ) {

      context.beginPath();

      context.arc(
        moonX,
        moonY,
        38 + ring * 9,
        0,
        Math.PI * 2
      );

      context.stroke();

    }


    context.restore();

  }


  function drawMountains(
    context,
    width,
    height
  ) {

    context.fillStyle =
      "rgba(166,205,226,.16)";


    context.beginPath();

    context.moveTo(
      width * 0.59,
      height * 0.68
    );

    context.lineTo(
      width * 0.69,
      height * 0.58
    );

    context.lineTo(
      width * 0.77,
      height * 0.67
    );

    context.lineTo(
      width * 0.85,
      height * 0.56
    );

    context.lineTo(
      width * 0.96,
      height * 0.68
    );

    context.closePath();
    context.fill();


    context.fillStyle =
      "rgba(7,24,25,.72)";


    context.beginPath();

    context.moveTo(
      0,
      height * 0.7
    );


    for (
      var x = 0;
      x <= width;
      x += 32
    ) {

      context.lineTo(
        x,
        height * 0.65 +
        Math.sin(x * 0.028) * 18
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

    context.closePath();
    context.fill();

  }


  function drawFarm(
    context,
    width,
    height
  ) {

    var farmX =
      width * 0.735;

    var farmY =
      height * 0.63;

    var farmWidth =
      width * 0.07;

    var farmHeight =
      height * 0.08;


    context.fillStyle =
      "#09130e";

    context.fillRect(
      farmX,
      farmY,
      farmWidth,
      farmHeight
    );


    context.fillStyle =
      "#121b17";

    context.beginPath();

    context.moveTo(
      farmX - farmWidth * 0.12,
      farmY
    );

    context.lineTo(
      farmX + farmWidth * 0.5,
      farmY - farmHeight * 0.48
    );

    context.lineTo(
      farmX + farmWidth * 1.12,
      farmY
    );

    context.closePath();
    context.fill();


    context.fillStyle =
      "rgba(255,194,80,.78)";

    context.fillRect(
      farmX + farmWidth * 0.18,
      farmY + farmHeight * 0.25,
      farmWidth * 0.15,
      farmHeight * 0.22
    );


    context.fillRect(
      farmX + farmWidth * 0.67,
      farmY + farmHeight * 0.25,
      farmWidth * 0.15,
      farmHeight * 0.22
    );

  }


  function drawTreeLine(
    context,
    width,
    height,
    config
  ) {

    for (
      var index = 0;
      index < config.treeCount;
      index += 1
    ) {

      var treeX =
        (
          index *
          (
            width /
            Math.max(
              1,
              config.treeCount - 1
            )
          )
        ) +
        (
          index % 2 === 0
            ? -7
            : 8
        );


      var treeHeight =
        18 +
        (index % 5) * 11;


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

  }


  function drawGround(
    context,
    width,
    height
  ) {

    var ground =
      context.createLinearGradient(
        0,
        height * 0.69,
        0,
        height
      );


    ground.addColorStop(
      0,
      "#173615"
    );

    ground.addColorStop(
      1,
      "#020904"
    );


    context.fillStyle = ground;

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
      "rgba(160,220,255,.12)"
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

  }


  function drawFence(
    context,
    width,
    height,
    config
  ) {

    if (!config.fence) {
      return;
    }


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


    context.lineWidth = 4;


    for (
      var post = 0;
      post <= width;
      post += Math.max(
        75,
        width / 15
      )
    ) {

      var postY =
        height * 0.76 +
        (
          post /
          Math.max(1, width)
        ) *
        height * 0.04;


      context.beginPath();

      context.moveTo(
        post,
        postY - 8
      );

      context.lineTo(
        post,
        postY + 38
      );

      context.stroke();

    }

  }


  function drawStaticGrass(
    context,
    width,
    height,
    config
  ) {

    var count =
      config.grassCount;


    for (
      var index = 0;
      index < count;
      index += 1
    ) {

      var grassX =
        (
          index *
          83
        ) % width;


      var grassY =
        height * 0.72 +
        (
          (
            index *
            47
          ) %
          Math.max(
            1,
            height * 0.28
          )
        );


      context.strokeStyle =
        "rgba(93,149,58," +
        (
          0.1 +
          (index % 4) *
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
          index % 5 -
          2
        ) * 3,
        grassY -
        5 -
        (
          index % 7
        )
      );

      context.stroke();

    }

  }


  function drawVignette(
    context,
    width,
    height
  ) {

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
        ) * 0.74
      );


    vignette.addColorStop(
      0.54,
      "rgba(0,0,0,0)"
    );

    vignette.addColorStop(
      1,
      "rgba(0,0,10,.35)"
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


    ensureCanvas();


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


    var dpr =
      clamp(
        options.dpr ||
        window.devicePixelRatio ||
        1,
        0.75,
        2
      );


    var config =
      qualityConfig(
        options.quality
      );


    var startedAt =
      performance.now();


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


    cacheContext.clearRect(
      0,
      0,
      width,
      height
    );


    drawSky(
      cacheContext,
      width,
      height
    );


    drawAuroraBase(
      cacheContext,
      width,
      height
    );


    drawMoon(
      cacheContext,
      width,
      height,
      config
    );


    drawMountains(
      cacheContext,
      width,
      height
    );


    drawFarm(
      cacheContext,
      width,
      height
    );


    drawTreeLine(
      cacheContext,
      width,
      height,
      config
    );


    drawGround(
      cacheContext,
      width,
      height
    );


    drawFence(
      cacheContext,
      width,
      height,
      config
    );


    drawStaticGrass(
      cacheContext,
      width,
      height,
      config
    );


    drawVignette(
      cacheContext,
      width,
      height
    );


    metadata.width =
      width;

    metadata.height =
      height;

    metadata.dpr =
      dpr;

    metadata.quality =
      config.quality;

    metadata.rebuilds += 1;

    metadata.pixelWidth =
      cacheCanvas.width;

    metadata.pixelHeight =
      cacheCanvas.height;

    metadata.lastBuildMs =
      Number(
        (
          performance.now() -
          startedAt
        ).toFixed(2)
      );


    valid = true;


    window.dispatchEvent(
      new CustomEvent(
        "ufo:landscape-cache-rebuilt",
        {
          detail:
            Object.assign(
              {},
              metadata
            )
        }
      )
    );


    return getStats();

  }


  function draw(
    targetContext,
    width,
    height
  ) {

    if (
      !valid ||
      !cacheCanvas ||
      !targetContext
    ) {
      return false;
    }


    targetContext.drawImage(
      cacheCanvas,
      0,
      0,
      cacheCanvas.width,
      cacheCanvas.height,
      0,
      0,
      width || metadata.width,
      height || metadata.height
    );


    return true;

  }


  function invalidate() {

    valid = false;

  }


  function getStats() {

    return Object.assign(
      {
        valid: valid
      },
      metadata
    );

  }


  window.UFOGame.landscapeCache = {

    rebuild:
      rebuild,

    draw:
      draw,

    invalidate:
      invalidate,

    getStats:
      getStats,

    isValid:
      function () {
        return valid;
      }

  };

})();
