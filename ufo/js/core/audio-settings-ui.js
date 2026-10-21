(function () {
  "use strict";

  window.UFOGame =
    window.UFOGame || {};


  var settings =
    window.UFOGame.settings;


  if (!settings) {

    console.error(
      "Audio Settings UI: Settings-Service fehlt."
    );

    return;
  }


  var observer = null;


  function createToggle(
    key,
    label
  ) {

    var row =
      document.createElement("div");


    row.className =
      "audioSettingRow";


    var text =
      document.createElement("span");


    text.className =
      "audioSettingLabel";


    text.textContent =
      label;


    var button =
      document.createElement("button");


    button.type =
      "button";


    button.className =
      "audioToggle";


    button.dataset.setting =
      key;


    button.addEventListener(
      "click",
      function () {

        var next =
          !Boolean(
            settings.get(key)
          );


        settings.set(
          key,
          next
        );


        if (
          window.UFOGame.audio
        ) {

          window.UFOGame.audio
            .applySettings();


          if (
            key === "music" &&
            next
          ) {

            window.UFOGame.audio
              .preview("music");

          }


          if (
            key === "sfx" &&
            next
          ) {

            window.UFOGame.audio
              .preview("sfx");

          }

        }


        render();

      }
    );


    row.appendChild(text);
    row.appendChild(button);


    return row;

  }


  function createSlider(
    key,
    label
  ) {

    var row =
      document.createElement("div");


    row.className =
      "audioSliderRow";


    var top =
      document.createElement("div");


    top.className =
      "audioSliderTop";


    var text =
      document.createElement("span");


    text.textContent =
      label;


    var value =
      document.createElement("strong");


    value.id =
      "value-" + key;


    top.appendChild(text);
    top.appendChild(value);


    var slider =
      document.createElement("input");


    slider.type =
      "range";


    slider.min =
      "0";


    slider.max =
      "100";


    slider.step =
      "1";


    slider.dataset.volume =
      key;


    slider.setAttribute(
      "aria-label",
      label
    );


    slider.addEventListener(
      "input",
      function () {

        settings.set(
          key,
          Number(slider.value) / 100
        );


        if (
          window.UFOGame.audio
        ) {
          window.UFOGame.audio
            .applySettings();
        }


        render();

      }
    );


    slider.addEventListener(
      "change",
      function () {

        if (
          window.UFOGame.audio
        ) {

          window.UFOGame.audio
            .preview(
              key === "musicVolume"
                ? "music"
                : "sfx"
            );

        }

      }
    );


    row.appendChild(top);
    row.appendChild(slider);


    return row;

  }


  function buildSection() {

    var body =
      document.querySelector(
        "#ufoSettings .ufoSettingsBody"
      );


    if (!body) {
      return false;
    }


    var oldFuture =
      body.querySelector(
        ".ufoSettingsFuture"
      );


    if (oldFuture) {
      oldFuture.remove();
    }


    if (
      document.getElementById(
        "audioSettingsSection"
      )
    ) {
      return true;
    }


    var section =
      document.createElement(
        "section"
      );


    section.id =
      "audioSettingsSection";


    section.className =
      "ufoSettingsSection audioSettingsSection";


    var title =
      document.createElement(
        "div"
      );


    title.className =
      "ufoSettingsSectionTitle";


    title.innerHTML =
      "<span>AUDIO & HAPTIK</span>" +
      "<small>LIVE</small>";


    section.appendChild(title);


    section.appendChild(
      createToggle(
        "music",
        "♪ MUSIK"
      )
    );


    section.appendChild(
      createSlider(
        "musicVolume",
        "MUSIK-LAUTSTÄRKE"
      )
    );


    section.appendChild(
      createToggle(
        "sfx",
        "◉ SOUNDEFFEKTE"
      )
    );


    section.appendChild(
      createSlider(
        "sfxVolume",
        "SFX-LAUTSTÄRKE"
      )
    );


    section.appendChild(
      createToggle(
        "haptics",
        "⌁ HAPTISCHES FEEDBACK"
      )
    );


    body.appendChild(section);


    render();


    return true;

  }


  function render() {

    document
      .querySelectorAll(
        "[data-setting]"
      )
      .forEach(
        function (button) {

          var key =
            button.dataset.setting;


          var active =
            Boolean(
              settings.get(key)
            );


          button.classList.toggle(
            "active",
            active
          );


          button.setAttribute(
            "aria-pressed",
            active
              ? "true"
              : "false"
          );


          button.textContent =
            active
              ? "AN"
              : "AUS";

        }
      );


    document
      .querySelectorAll(
        "[data-volume]"
      )
      .forEach(
        function (slider) {

          var key =
            slider.dataset.volume;


          var value =
            Math.round(
              Number(
                settings.get(key)
              ) * 100
            );


          if (!Number.isFinite(value)) {
            value = 0;
          }


          slider.value =
            String(value);


          var output =
            document.getElementById(
              "value-" + key
            );


          if (output) {
            output.textContent =
              value + " %";
          }


          var enabledKey =
            key === "musicVolume"
              ? "music"
              : "sfx";


          slider.disabled =
            settings.get(
              enabledKey
            ) === false;

        }
      );

  }


  function init() {

    if (buildSection()) {
      return;
    }


    observer =
      new MutationObserver(
        function () {

          if (buildSection()) {

            observer.disconnect();
            observer = null;

          }

        }
      );


    observer.observe(
      document.body,
      {
        childList: true,
        subtree: true
      }
    );

  }


  window.addEventListener(
    "ufo:settings-change",
    render
  );


  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      init,
      {
        once: true
      }
    );

  }

  else {
    init();
  }


  window.UFOGame.audioSettingsUI = {
    render: render
  };

})();
