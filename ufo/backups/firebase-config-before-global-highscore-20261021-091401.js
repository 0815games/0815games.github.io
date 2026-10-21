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

firebase.initializeApp(firebaseConfig);

window.ufoFirebase = {
  auth: firebase.auth(),
  database: firebase.database(),
  ready: false,
  user: null,
  lastSubmittedScore: null
};

window.ufoFirebase.auth.signInAnonymously()
  .then(function(credential) {
    window.ufoFirebase.user = credential.user;
    window.ufoFirebase.ready = true;

    console.log("✅ Firebase anonym angemeldet:", credential.user.uid);

    if (typeof window.refreshUfoHighscores === "function") {
      window.refreshUfoHighscores();
    }
  })
  .catch(function(error) {
    console.error(
      "❌ Firebase-Anmeldung fehlgeschlagen:",
      error.code,
      error.message
    );
  });
