/**
 * Campagne « L'Été Grand Tourisme » — 150 € offerts dès 1 000 € d'achat
 * Les As du Volant
 *
 * Responsabilités :
 *   - alimenter les barres de progression [data-promo-progress] depuis le
 *     panier réel (/cart.js — source de vérité, y compris les suppléments
 *     d'options ajoutés par le configurateur) ;
 *   - se remettre à jour après chaque mutation du panier ;
 *   - afficher le nombre de jours restants dans [data-promo-deadline].
 *
 * Aucune dépendance externe. Le script est inerte si aucun composant promo
 * n'est présent sur la page.
 */
(function () {
  'use strict';

  var config = window.PROMO_ETE150 || {};
  var THRESHOLD_CENTS = parseInt(config.threshold, 10) || 100000; // 1 000 €
  var DEADLINE_ISO = config.deadline || '2026-08-31T21:59:59Z';
  var CURRENCY = config.currency || 'EUR';

  /* ----------------------------------------------------------------------
   * Formatage monétaire
   * -------------------------------------------------------------------- */

  var formatter = null;
  try {
    formatter = new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: CURRENCY,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  } catch (e) {
    formatter = null;
  }

  function formatMoney(cents) {
    var euros = Math.ceil(cents / 100);
    if (formatter) return formatter.format(euros);
    return euros + ' €';
  }

  /* ----------------------------------------------------------------------
   * Barres de progression
   * -------------------------------------------------------------------- */

  function render(totalCents) {
    var nodes = document.querySelectorAll('[data-promo-progress]');
    if (!nodes.length) return;

    var remaining = Math.max(0, THRESHOLD_CENTS - totalCents);
    var unlocked = remaining === 0;
    var ratio = Math.min(100, (totalCents / THRESHOLD_CENTS) * 100);

    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var fill = el.querySelector('[data-promo-progress-fill]');
      var label = el.querySelector('[data-promo-progress-label]');

      el.classList.toggle('is-unlocked', unlocked);
      el.hidden = totalCents === 0; // panier vide : on n'affiche rien

      if (fill) {
        fill.style.width = ratio + '%';
        fill.parentNode.setAttribute('aria-valuenow', Math.round(ratio));
      }

      if (label) {
        label.innerHTML = unlocked
          ? '<svg class="promo-progress__unlocked-icon" viewBox="0 0 24 24" fill="none" ' +
            'stroke="currentColor" stroke-width="3" aria-hidden="true">' +
            '<path d="M20 6L9 17l-5-5"/></svg>' +
            'Félicitations, vos <strong>150 € offerts</strong> sont débloqués.'
          : 'Plus que <strong>' + formatMoney(remaining) +
            '</strong> pour débloquer vos <strong>150 € offerts</strong>.';
      }
    }
  }

  var inFlight = false;

  function refresh() {
    if (!document.querySelector('[data-promo-progress]')) return;
    if (inFlight) return;
    inFlight = true;

    fetch(window.Shopify && window.Shopify.routes && window.Shopify.routes.root
      ? window.Shopify.routes.root + 'cart.js'
      : '/cart.js', { headers: { Accept: 'application/json' } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (cart) {
        if (cart && typeof cart.total_price === 'number') render(cart.total_price);
      })
      .catch(function () { /* silencieux : la barre garde sa valeur serveur */ })
      .then(function () { inFlight = false; });
  }

  /* ----------------------------------------------------------------------
   * Détection des mutations du panier
   *
   * Le thème (Dawn) et l'app d'options ne partagent pas d'événement commun
   * fiable. On combine donc : événements connus + interception de fetch sur
   * les routes /cart/*, ce qui couvre ajout, modification et suppression.
   * -------------------------------------------------------------------- */

  var CART_EVENTS = ['cart:updated', 'cart:refresh', 'cart:change', 'variant:change'];
  CART_EVENTS.forEach(function (name) {
    document.addEventListener(name, refresh);
  });

  var nativeFetch = window.fetch;
  if (typeof nativeFetch === 'function') {
    window.fetch = function (input) {
      var url = typeof input === 'string' ? input : (input && input.url) || '';
      var isCartMutation = /\/cart\/(add|change|update|clear)/.test(url);
      var result = nativeFetch.apply(this, arguments);
      if (isCartMutation && result && typeof result.then === 'function') {
        result.then(function () { setTimeout(refresh, 120); }).catch(function () {});
      }
      return result;
    };
  }

  /* ----------------------------------------------------------------------
   * Compte à rebours (granularité : le jour — pas de tic-tac anxiogène)
   * -------------------------------------------------------------------- */

  function renderDeadline() {
    var nodes = document.querySelectorAll('[data-promo-deadline]');
    if (!nodes.length) return;

    var end = new Date(DEADLINE_ISO).getTime();
    if (isNaN(end)) return;

    var days = Math.ceil((end - Date.now()) / 86400000);
    var text;

    if (days < 0) text = '';
    else if (days === 0) text = "Dernier jour — l'offre se termine ce soir";
    else if (days === 1) text = 'Plus qu’un jour';
    else text = 'Plus que ' + days + ' jours';

    for (var i = 0; i < nodes.length; i++) {
      nodes[i].textContent = text;
      nodes[i].hidden = text === '';
    }
  }

  /* ----------------------------------------------------------------------
   * Démarrage
   * -------------------------------------------------------------------- */

  function init() {
    renderDeadline();
    refresh();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Exposé pour les intégrations tierces (ex. app d'options).
  window.PROMO_ETE150 = window.PROMO_ETE150 || {};
  window.PROMO_ETE150.refresh = refresh;
})();
