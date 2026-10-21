(function () {
  "use strict";


  var MAX_RESULTS = 10;
  var MAX_SCORE = 10000000;
  var MAX_NAME = 18;

  var cache = [];
  var loadingPromise = null;


  function firebaseSystem() {
    return window.ufoFirebase || null;
  }


  function sanitizeName(name) {

    name = String(
      name || "Spieler"
    )
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, MAX_NAME);


    return name || "Spieler";
  }


  function sanitizeScore(score) {

    score =
      Math.floor(
        Number(score)
      );


    if (
      !Number.isFinite(score) ||
      score <= 0 ||
      score > MAX_SCORE
    ) {
      throw new Error(
        "Ungültiger Highscore."
      );
    }


    return score;
  }


  function waitForFirebase() {

    var fb =
      firebaseSystem();


    if (
      !fb ||
      !fb.readyPromise
    ) {
      return Promise.reject(
        new Error(
          "Firebase wurde nicht initialisiert."
        )
      );
    }


    return fb.readyPromise;
  }


  function normalizeSnapshot(snapshot) {

    var scores = [];


    snapshot.forEach(
      function (child) {

        var value =
          child.val();


        if (
          !value ||
          typeof value.name !== "string" ||
          typeof value.score !== "number"
        ) {
          return;
        }


        scores.push({
          id: child.key,

          name:
            sanitizeName(
              value.name
            ),

          score:
            value.score,

          createdAt:
            typeof value.createdAt === "number"
              ? value.createdAt
              : 0,

          uid:
            typeof value.uid === "string"
              ? value.uid
              : ""
        });

      }
    );


    scores.sort(
      function (a, b) {

        if (b.score !== a.score) {
          return b.score - a.score;
        }


        return (
          (a.createdAt || 0) -
          (b.createdAt || 0)
        );
      }
    );


    return scores.slice(
      0,
      MAX_RESULTS
    );
  }


  function render(scores) {

    var list =
      document.getElementById(
        "scores"
      );


    if (!list) {
      return;
    }


    list.replaceChildren();


    var fb =
      firebaseSystem();


    var ownUid =
      fb &&
      fb.user
        ? fb.user.uid
        : null;


    if (
      !scores ||
      !scores.length
    ) {

      var empty =
        document.createElement("li");

      empty.textContent =
        "Noch kein globaler Rekord";

      list.appendChild(
        empty
      );

      return;
    }


    scores.forEach(
      function (entry, index) {

        var li =
          document.createElement("li");


        var medal = "";

        if (index === 0) {
          medal = "🥇 ";
        }

        else if (index === 1) {
          medal = "🥈 ";
        }

        else if (index === 2) {
          medal = "🥉 ";
        }


        li.textContent =
          medal +
          entry.name +
          " — " +
          Number(
            entry.score
          ).toLocaleString("de-DE") +
          " Punkte";


        li.dataset.rank =
          String(index + 1);


        if (
          ownUid &&
          entry.uid === ownUid
        ) {

          li.classList.add(
            "own-global-score"
          );

          li.title =
            "Dein Eintrag";

        }


        list.appendChild(
          li
        );

      }
    );
  }


  function updateHeader(online) {

    var lists =
      document.querySelectorAll(
        ".scores"
      );


    lists.forEach(
      function (box) {

        var title =
          box.querySelector("b");


        if (title) {

          title.textContent =
            online
              ? "🌍 GLOBAL TOP 10"
              : "HIGHSCORES";

        }


        box.classList.toggle(
          "global-online",
          Boolean(online)
        );

      }
    );
  }


  function load() {

    if (loadingPromise) {
      return loadingPromise;
    }


    loadingPromise =
      waitForFirebase()

        .then(function () {

          var fb =
            firebaseSystem();


          return fb.database
            .ref("ufoHighscores")
            .orderByChild("score")
            .limitToLast(
              MAX_RESULTS
            )
            .once("value");

        })

        .then(function (snapshot) {

          cache =
            normalizeSnapshot(
              snapshot
            );


          render(cache);

          updateHeader(true);


          console.log(
            "Globale Highscores geladen:",
            cache.length
          );


          return cache.slice();

        })

        .catch(function (error) {

          console.error(
            "Globale Highscores konnten nicht geladen werden:",
            error
          );


          updateHeader(false);


          throw error;

        })

        .finally(function () {
          loadingPromise = null;
        });


    return loadingPromise;
  }


  function submit(name, score) {

    var cleanName =
      sanitizeName(name);


    var cleanScore =
      sanitizeScore(score);


    return waitForFirebase()

      .then(function (user) {

        var fb =
          firebaseSystem();


        var submissionKey =
          [
            user.uid,
            cleanName,
            cleanScore
          ].join(":");


        if (
          fb.lastSubmittedScore ===
          submissionKey
        ) {

          console.log(
            "Doppeltes Highscore-Submit verhindert."
          );


          return {
            duplicate: true
          };

        }


        fb.lastSubmittedScore =
          submissionKey;


        var scoreRef =
          fb.database
            .ref("ufoHighscores")
            .push();


        return scoreRef
          .set({

            name:
              cleanName,

            score:
              cleanScore,

            createdAt:
              firebase.database
                .ServerValue
                .TIMESTAMP,

            uid:
              user.uid

          })

          .then(function () {

            console.log(
              "Globaler Highscore gespeichert:",
              cleanName,
              cleanScore
            );


            return {
              duplicate: false,
              id: scoreRef.key
            };

          })

          .catch(function (error) {

            fb.lastSubmittedScore =
              null;


            throw error;

          });

      })

      .then(function (result) {

        return load()
          .then(function () {
            return result;
          });

      });

  }


  function getCached() {
    return cache.slice();
  }


  window.UfoHighscores = {

    load:
      load,

    submit:
      submit,

    render:
      render,

    getCached:
      getCached

  };


  /*
   * Lade globale Tabelle sofort,
   * sobald DOM und Firebase verfügbar sind.
   */

  function initialLoad() {

    load()
      .catch(function () {

        /*
         * Das Spiel selbst darf auch bei
         * Netzwerkproblemen weiterlaufen.
         */

      });

  }


  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      initialLoad,
      {
        once: true
      }
    );

  }

  else {
    initialLoad();
  }

})();
