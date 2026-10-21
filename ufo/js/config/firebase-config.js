(function () {
  "use strict";

  const firebaseConfig = {
    apiKey: "AIzaSyB9zyEl5nzin1njLhJbGvDm98OvrcMxP-E",
    authDomain: "entenjagd-7ca15.firebaseapp.com",
    databaseURL: "https://entenjagd-7ca15-default-rtdb.firebaseio.com",
    projectId: "entenjagd-7ca15",
    storageBucket: "entenjagd-7ca15.firebasestorage.app",
    messagingSenderId: "727931004273",
    appId: "1:727931004273:web:c984f89c5b9c6f5f0882d0",
    measurementId: "G-XS3C5MW3RY"
  };


  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }


  var auth =
    firebase.auth();

  var database =
    firebase.database();


  window.ufoFirebase = {
    auth: auth,
    database: database,

    ready: false,
    user: null,

    lastSubmittedScore: null,

    readyPromise: null
  };


  /*
   * Zentrales Auth-Promise.
   *
   * Dadurch muss das Spiel NICHT mehr hoffen,
   * dass Anonymous Auth beim Game Over schon
   * abgeschlossen ist.
   */

  window.ufoFirebase.readyPromise =
    new Promise(function (resolve, reject) {

      var settled = false;


      var unsubscribe =
        auth.onAuthStateChanged(
          function (user) {

            if (!user) {
              return;
            }


            window.ufoFirebase.user =
              user;

            window.ufoFirebase.ready =
              true;


            console.log(
              "Firebase online:",
              user.uid
            );


            if (!settled) {
              settled = true;

              resolve(user);
            }


            if (
              typeof window.UfoHighscores !==
              "undefined" &&
              typeof window.UfoHighscores.load ===
              "function"
            ) {
              window.UfoHighscores.load();
            }

          },

          function (error) {

            console.error(
              "Firebase Auth Fehler:",
              error
            );


            if (!settled) {
              settled = true;

              reject(error);
            }

          }
        );


      if (auth.currentUser) {

        window.ufoFirebase.user =
          auth.currentUser;

        window.ufoFirebase.ready =
          true;

        settled = true;

        resolve(
          auth.currentUser
        );

        return;
      }


      auth.signInAnonymously()
        .catch(function (error) {

          console.error(
            "Anonymous Auth fehlgeschlagen:",
            error.code,
            error.message
          );


          if (!settled) {
            settled = true;
            reject(error);
          }

        });


      window.addEventListener(
        "pagehide",
        function () {

          if (
            typeof unsubscribe ===
            "function"
          ) {
            unsubscribe();
          }

        },
        {
          once: true
        }
      );

    });

})();
