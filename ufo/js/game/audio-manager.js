(function () {
  "use strict";

  window.UFOGame =
    window.UFOGame || {};


  var settings =
    window.UFOGame.settings;


  if (!settings) {

    console.error(
      "Audio Manager: Settings-Service fehlt."
    );

    return;
  }


  var AudioContextClass =
    window.AudioContext ||
    window.webkitAudioContext;


  var context = null;

  var masterGain = null;
  var musicGain = null;
  var sfxGain = null;

  var musicNodes = [];

  var musicRunning = false;
  var unlocked = false;


  function clamp(value, min, max) {

    value =
      Number(value);


    if (!Number.isFinite(value)) {
      value = min;
    }


    return Math.min(
      max,
      Math.max(min, value)
    );

  }


  function settingEnabled(key) {

    return (
      settings.get(key) !==
      false
    );

  }


  function settingVolume(key) {

    return clamp(
      settings.get(key),
      0,
      1
    );

  }


  function createContext() {

    if (context) {
      return context;
    }


    if (!AudioContextClass) {

      console.warn(
        "Web Audio API wird von diesem Browser nicht unterstützt."
      );

      return null;
    }


    context =
      new AudioContextClass();


    masterGain =
      context.createGain();


    musicGain =
      context.createGain();


    sfxGain =
      context.createGain();


    masterGain.gain.value =
      0.92;


    musicGain.gain.value =
      settingEnabled("music")
        ? settingVolume("musicVolume")
        : 0;


    sfxGain.gain.value =
      settingEnabled("sfx")
        ? settingVolume("sfxVolume")
        : 0;


    musicGain.connect(
      masterGain
    );


    sfxGain.connect(
      masterGain
    );


    masterGain.connect(
      context.destination
    );


    return context;

  }


  function resume() {

    var audioContext =
      createContext();


    if (!audioContext) {
      return Promise.resolve(false);
    }


    if (
      audioContext.state ===
      "suspended"
    ) {

      return audioContext
        .resume()

        .then(function () {

          unlocked = true;

          if (
            settingEnabled("music") &&
            !musicRunning
          ) {
            startMusic();
          }


          return true;

        })

        .catch(function (error) {

          console.warn(
            "AudioContext konnte nicht aktiviert werden:",
            error
          );


          return false;

        });

    }


    unlocked = true;


    return Promise.resolve(true);

  }


  function rampGain(
    gainNode,
    target,
    duration
  ) {

    if (
      !context ||
      !gainNode
    ) {
      return;
    }


    var now =
      context.currentTime;


    var current =
      Math.max(
        0.0001,
        gainNode.gain.value
      );


    gainNode.gain
      .cancelScheduledValues(now);


    gainNode.gain
      .setValueAtTime(
        current,
        now
      );


    gainNode.gain
      .linearRampToValueAtTime(
        Math.max(
          0.0001,
          target
        ),
        now + duration
      );

  }


  function applySettings() {

    if (!context) {
      return;
    }


    rampGain(
      musicGain,
      settingEnabled("music")
        ? settingVolume("musicVolume")
        : 0.0001,
      0.12
    );


    rampGain(
      sfxGain,
      settingEnabled("sfx")
        ? settingVolume("sfxVolume")
        : 0.0001,
      0.08
    );


    if (
      settingEnabled("music") &&
      unlocked &&
      !musicRunning
    ) {
      startMusic();
    }


    if (
      !settingEnabled("music") &&
      musicRunning
    ) {
      stopMusic();
    }

  }


  function rememberMusicNode(node) {

    musicNodes.push(node);

    return node;

  }


  function createMusicOscillator(
    type,
    frequency,
    volume
  ) {

    var oscillator =
      rememberMusicNode(
        context.createOscillator()
      );


    var gain =
      rememberMusicNode(
        context.createGain()
      );


    oscillator.type =
      type;


    oscillator.frequency.value =
      frequency;


    gain.gain.value =
      volume;


    oscillator.connect(gain);
    gain.connect(musicGain);


    oscillator.start();


    return {
      oscillator: oscillator,
      gain: gain
    };

  }


  function startMusic() {

    if (
      musicRunning ||
      !settingEnabled("music")
    ) {
      return;
    }


    var audioContext =
      createContext();


    if (!audioContext) {
      return;
    }


    if (
      audioContext.state !==
      "running"
    ) {
      return;
    }


    musicRunning = true;


    /*
     * Atmosphärischer Sci-Fi-Drone.
     * Keine externen MP3-/OGG-Dateien erforderlich.
     */

    var bass =
      createMusicOscillator(
        "sine",
        55,
        0.038
      );


    var middle =
      createMusicOscillator(
        "triangle",
        110,
        0.017
      );


    var air =
      createMusicOscillator(
        "sine",
        220,
        0.006
      );


    var bassLfo =
      rememberMusicNode(
        context.createOscillator()
      );


    var bassLfoGain =
      rememberMusicNode(
        context.createGain()
      );


    bassLfo.frequency.value =
      0.105;


    bassLfoGain.gain.value =
      7;


    bassLfo.connect(
      bassLfoGain
    );


    bassLfoGain.connect(
      bass.oscillator.frequency
    );


    bassLfo.start();


    var middleLfo =
      rememberMusicNode(
        context.createOscillator()
      );


    var middleLfoGain =
      rememberMusicNode(
        context.createGain()
      );


    middleLfo.frequency.value =
      0.071;


    middleLfoGain.gain.value =
      4;


    middleLfo.connect(
      middleLfoGain
    );


    middleLfoGain.connect(
      middle.oscillator.frequency
    );


    middleLfo.start();


    var airLfo =
      rememberMusicNode(
        context.createOscillator()
      );


    var airLfoGain =
      rememberMusicNode(
        context.createGain()
      );


    airLfo.frequency.value =
      0.14;


    airLfoGain.gain.value =
      0.004;


    airLfo.connect(
      airLfoGain
    );


    airLfoGain.connect(
      air.gain.gain
    );


    airLfo.start();


    applySettings();

  }


  function stopMusic() {

    musicRunning = false;


    musicNodes.forEach(
      function (node) {

        try {

          if (
            typeof node.stop ===
            "function"
          ) {
            node.stop();
          }


          if (
            typeof node.disconnect ===
            "function"
          ) {
            node.disconnect();
          }

        }

        catch (error) {
          /*
           * Bereits gestoppte Nodes können ignoriert werden.
           */
        }

      }
    );


    musicNodes.length = 0;

  }


  function createEnvelope(
    start,
    peak,
    end,
    attack,
    duration
  ) {

    var gain =
      context.createGain();


    gain.gain
      .setValueAtTime(
        Math.max(0.0001, start),
        context.currentTime
      );


    gain.gain
      .exponentialRampToValueAtTime(
        Math.max(0.0001, peak),
        context.currentTime + attack
      );


    gain.gain
      .exponentialRampToValueAtTime(
        Math.max(0.0001, end),
        context.currentTime + duration
      );


    return gain;

  }


  function playTone(options) {

    options =
      options || {};


    if (
      !settingEnabled("sfx")
    ) {
      return;
    }


    var audioContext =
      createContext();


    if (!audioContext) {
      return;
    }


    if (
      audioContext.state !==
      "running"
    ) {

      resume().then(
        function (success) {

          if (success) {
            playTone(options);
          }

        }
      );


      return;
    }


    var now =
      audioContext.currentTime;


    var duration =
      options.duration || 0.25;


    var oscillator =
      audioContext.createOscillator();


    var envelope =
      createEnvelope(
        0.0001,
        options.volume || 0.08,
        0.0001,
        options.attack || 0.012,
        duration
      );


    oscillator.type =
      options.type || "sine";


    oscillator.frequency
      .setValueAtTime(
        options.frequency || 220,
        now
      );


    if (options.endFrequency) {

      oscillator.frequency
        .exponentialRampToValueAtTime(
          Math.max(
            1,
            options.endFrequency
          ),
          now + duration
        );

    }


    oscillator.connect(
      envelope
    );


    envelope.connect(
      sfxGain
    );


    oscillator.start(now);


    oscillator.stop(
      now + duration + 0.03
    );


    oscillator.addEventListener(
      "ended",
      function () {

        oscillator.disconnect();
        envelope.disconnect();

      },
      {
        once: true
      }
    );

  }


  function playSfx(name) {

    name =
      String(name || "hit")
        .toLowerCase();


    if (
      !settingEnabled("sfx")
    ) {
      return;
    }


    if (name === "jet") {

      playTone({
        type: "sawtooth",
        frequency: 120,
        endFrequency: 55,
        duration: 0.30,
        volume: 0.055
      });

      return;
    }


    if (
      name === "ufo" ||
      name === "cow_beam"
    ) {

      playTone({
        type: "sine",
        frequency: 260,
        endFrequency: 680,
        duration: 0.34,
        volume: 0.085
      });

      return;
    }


    if (
      name === "shoot"
    ) {

      playTone({
        type: "square",
        frequency: 320,
        endFrequency: 120,
        duration: 0.09,
        volume: 0.038,
        attack: 0.004
      });

      return;
    }


    if (
      name === "level_up"
    ) {

      [
        261.63,
        329.63,
        392,
        523.25
      ].forEach(
        function (frequency, index) {

          window.setTimeout(
            function () {

              playTone({
                type: "triangle",
                frequency: frequency,
                endFrequency:
                  frequency * 1.05,
                duration: 0.28,
                volume: 0.052
              });

            },
            index * 70
          );

        }
      );

      return;
    }


    if (
      name === "warning"
    ) {

      playTone({
        type: "square",
        frequency: 155,
        endFrequency: 115,
        duration: 0.24,
        volume: 0.047
      });

      return;
    }


    if (
      name === "button"
    ) {

      playTone({
        type: "sine",
        frequency: 430,
        endFrequency: 620,
        duration: 0.08,
        volume: 0.025
      });

      return;
    }


    /*
     * Standard: Treffer
     */

    playTone({
      type: "triangle",
      frequency: 180,
      endFrequency: 440,
      duration: 0.16,
      volume: 0.05
    });

  }


  function preview(channel) {

    resume().then(
      function (success) {

        if (!success) {
          return;
        }


        if (channel === "music") {

          if (
            settingEnabled("music")
          ) {
            startMusic();
          }


          return;
        }


        playSfx("button");

      }
    );

  }


  function unlockOnGesture() {

    resume();


    document.removeEventListener(
      "pointerdown",
      unlockOnGesture,
      true
    );


    document.removeEventListener(
      "keydown",
      unlockOnGesture,
      true
    );

  }


  document.addEventListener(
    "pointerdown",
    unlockOnGesture,
    true
  );


  document.addEventListener(
    "keydown",
    unlockOnGesture,
    true
  );


  window.addEventListener(
    "ufo:settings-change",
    function () {

      applySettings();

    }
  );


  window.addEventListener(
    "pagehide",
    function () {

      stopMusic();


      if (context) {

        context.close()
          .catch(
            function () {}
          );

      }

    },
    {
      once: true
    }
  );


  window.UFOGame.audio = {

    resume: resume,

    playSfx: playSfx,

    startMusic: function () {

      resume().then(
        function (success) {

          if (success) {
            startMusic();
          }

        }
      );

    },

    stopMusic: stopMusic,

    preview: preview,

    applySettings: applySettings,

    isMusicRunning:
      function () {
        return musicRunning;
      },

    getState:
      function () {

        return {
          supported:
            Boolean(AudioContextClass),

          contextState:
            context
              ? context.state
              : "not-created",

          musicRunning:
            musicRunning,

          musicEnabled:
            settingEnabled("music"),

          sfxEnabled:
            settingEnabled("sfx"),

          musicVolume:
            settingVolume("musicVolume"),

          sfxVolume:
            settingVolume("sfxVolume")
        };

      }

  };

})();
