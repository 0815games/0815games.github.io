// Gemeinsame, unabhaengige Pip-Boy-Systemdialoge fuer Spiel, Login und Admin.
// Keine Browser-Dialoge: auch im Crash-Bildschirm muss das Design erhalten bleiben.
(() => {
    const warteschlange = [];
    let offen = false;

    function zeigeNaechsten() {
        if (offen || !warteschlange.length) return;
        if (!document.body) {
            document.addEventListener('DOMContentLoaded', zeigeNaechsten, {once: true});
            return;
        }
        offen = true;
        const {optionen, resolve} = warteschlange.shift();
        const vorher = document.activeElement;
        const layer = document.createElement('div');
        layer.className = 'pip-system-dialog-layer';
        layer.innerHTML = `<section class="pip-system-dialog" role="dialog" aria-modal="true" aria-labelledby="pip-dialog-title" aria-describedby="pip-dialog-message">
            <div class="pip-system-dialog-top"><span>ROBCO INDUSTRIES</span><span>TERMINAL LINK</span></div>
            <h2 id="pip-dialog-title"></h2><p id="pip-dialog-message"></p>
            <div class="pip-system-dialog-actions"></div>
            <div class="pip-system-dialog-footer">VAULT-TEC • PERSONAL INFORMATION PROCESSOR</div>
        </section>`;
        const box = layer.querySelector('section');
        box.querySelector('h2').textContent = optionen.titel || 'SYSTEMMELDUNG';
        box.querySelector('p').textContent = optionen.text || '';
        const actions = box.querySelector('.pip-system-dialog-actions');
        const nein = optionen.frage ? document.createElement('button') : null;
        const ja = document.createElement('button');
        if (nein) {
            nein.type = 'button'; nein.className = 'pip-dialog-button pip-dialog-cancel';
            nein.textContent = optionen.abbrechen || 'ABBRECHEN';
            actions.appendChild(nein);
        }
        ja.type = 'button'; ja.className = 'pip-dialog-button pip-dialog-primary';
        ja.textContent = optionen.bestaetigen || (optionen.frage ? 'BESTÄTIGEN' : 'VERSTANDEN');
        actions.appendChild(ja);
        const buttons = nein ? [nein, ja] : [ja];
        function fertig(wert) {
            document.removeEventListener('keydown', taste, true);
            layer.remove();
            offen = false;
            if (vorher && vorher.isConnected && typeof vorher.focus === 'function') vorher.focus();
            resolve(wert);
            zeigeNaechsten();
        }
        function taste(event) {
            if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); fertig(false); }
            else if (event.key === 'Tab') {
                event.preventDefault(); event.stopImmediatePropagation();
                const pos = buttons.indexOf(document.activeElement);
                buttons[(pos + (event.shiftKey ? buttons.length - 1 : 1)) % buttons.length].focus();
            }
        }
        if (nein) nein.addEventListener('click', () => fertig(false));
        ja.addEventListener('click', () => fertig(true));
        layer.addEventListener('click', event => { if (event.target === layer) fertig(false); });
        document.addEventListener('keydown', taste, true);
        document.body.appendChild(layer);
        (nein || ja).focus();
    }
    function anfordern(optionen) {
        return new Promise(resolve => { warteschlange.push({optionen, resolve}); zeigeNaechsten(); });
    }
    window.PipDialog = {
        confirm: optionen => anfordern({...optionen, frage: true}),
        info: optionen => anfordern({...optionen, frage: false})
    };
})();
