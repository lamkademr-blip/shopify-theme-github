/**
 * Configurateur de volant — Phase 1.
 *
 * Rôle : synchroniser les radios d'options vers les propriétés machine du
 * panier (properties[_config], properties[_hash]) et vers l'URL (?cfg=)
 * pour le partage de configuration.
 *
 * Le formulaire fonctionne sans ce script (rendu serveur, attribut form) —
 * ce script n'est qu'une amélioration progressive. Phase 3 branchera le
 * compositeur d'images sur l'événement `wheel:config-change`.
 */
(function () {
  'use strict';

  if (customElements.get('wheel-configurator')) return;

  class WheelConfigurator extends HTMLElement {
    connectedCallback() {
      const manifestEl = this.querySelector('[data-cfg-manifest]');
      if (!manifestEl) return;
      try {
        this.manifest = JSON.parse(manifestEl.textContent);
      } catch (e) {
        console.warn('[wheel-cfg] manifest JSON invalide', e);
        return;
      }
      this.jsonInput = this.querySelector('[data-cfg-json]');
      this.hashInput = this.querySelector('[data-cfg-hash]');

      this.applyUrlConfig();
      this.sync();

      this.addEventListener('change', (evt) => {
        if (evt.target.matches('.wheel-cfg__radio')) this.sync();
      });
    }

    /** Configuration courante : { slot: valueHandle } depuis les radios cochées. */
    readConfig() {
      const config = {};
      this.querySelectorAll('.wheel-cfg__radio:checked').forEach((input) => {
        config[input.dataset.group] = input.dataset.valueHandle;
      });
      return config;
    }

    /** Applique ?cfg=slot.handle,slot.handle depuis l'URL si présent. */
    applyUrlConfig() {
      const raw = new URLSearchParams(window.location.search).get('cfg');
      if (!raw) return;
      raw.split(',').forEach((pair) => {
        const sep = pair.indexOf('.');
        if (sep < 1) return;
        const slot = pair.slice(0, sep);
        const handle = pair.slice(sep + 1);
        const input = this.querySelector(
          `.wheel-cfg__radio[data-group="${CSS.escape(slot)}"][data-value-handle="${CSS.escape(handle)}"]`
        );
        if (input) input.checked = true;
      });
    }

    sync() {
      const config = this.readConfig();

      const payload = JSON.stringify(
        Object.assign({ v: this.manifest.v, model: this.manifest.model }, config)
      );
      if (this.jsonInput) this.jsonInput.value = payload;
      if (this.hashInput) this.hashInput.value = WheelConfigurator.hash(payload);

      // ?cfg= dans l'URL sans rechargement ni entrée d'historique.
      const params = new URLSearchParams(window.location.search);
      params.set(
        'cfg',
        Object.entries(config).map(([slot, handle]) => `${slot}.${handle}`).join(',')
      );
      history.replaceState(null, '', `${window.location.pathname}?${params}`);

      // Point d'ancrage du compositeur (Phase 3).
      this.dispatchEvent(
        new CustomEvent('wheel:config-change', { detail: { config }, bubbles: true })
      );
    }

    /** djb2 → base36, 6 caractères — identifiant court citable en SAV. */
    static hash(str) {
      let h = 5381;
      for (let i = 0; i < str.length; i++) {
        h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
      }
      return h.toString(36).padStart(6, '0').slice(-6);
    }
  }

  customElements.define('wheel-configurator', WheelConfigurator);
})();
