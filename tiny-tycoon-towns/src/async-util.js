// Kleine Hilfen für Aufrufe, die hängen bleiben können (z. B. Cloud ohne Antwort).
// Rein, ohne Browser- oder Firebase-Abhängigkeit, daher mit node --test prüfbar.

/** Resolves or rejects like `promise`, but rejects with a timeout error after `ms`. */
export function withTimeout(promise, ms, label = 'Vorgang') {
  let timer;
  const limit = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const err = new Error(`${label}: Zeitlimit von ${ms} ms überschritten`);
      err.code = 'timeout';
      reject(err);
    }, ms);
  });
  return Promise.race([promise, limit]).finally(() => clearTimeout(timer));
}
