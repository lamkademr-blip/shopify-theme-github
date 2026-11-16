/**
 * Lien « Réserver un appel » (snippets/calendly-booking.liquid) + calendrier
 * intégré (sections/calendly-inline.liquid).
 *
 * - Charge widget.js / widget.css de Calendly au PREMIER clic seulement
 *   (~2,7 Mo évités sur toutes les pages qui ne s'en servent pas).
 * - Ouvre le pop-up pré-rempli : a1 = véhicule (titre produit),
 *   a2 = configuration en cours (propriétés YMQ du formulaire produit).
 *   a1/a2 = 1re et 2e question personnalisée de l'événement, dans cet ordre ;
 *   Calendly ignore sans erreur une clé sans question correspondante.
 * - UTM : source=site, medium=emplacement, campaign=handle produit,
 *   content=window.lavWaRef() (même référence que les messages WhatsApp).
 * - Suivi : calendly_open (clic), calendly_slot (créneau choisi),
 *   calendly_booked (RDV réservé) vers GA4 via gtag/dataLayer, Clarity,
 *   Meta (Schedule) et Google Ads si ADS_SEND_TO est renseigné.
 *   Les messages calendly.* n'existent que pour le pop-up et l'intégré,
 *   pas pour un lien calendly.com ouvert dans un nouvel onglet.
 */
(function () {
  if (window.__lavCal) return;
  window.__lavCal = true;

  // Libellé de l'action de conversion Google Ads « RDV réservé » (à créer).
  // Vide = seuls GA4, Meta et Clarity reçoivent la réservation.
  var ADS_SEND_TO = '';
  var ADS_VALUE = 60;

  var lastSource = 'inconnu';
  var loading = null;
  var booked = {};

  function g() { window.dataLayer = window.dataLayer || []; window.dataLayer.push(arguments); }
  function ref() {
    try { return typeof window.lavWaRef === 'function' ? window.lavWaRef() : 'direct'; } catch (e) { return 'direct'; }
  }
  function clarity(name, source) {
    if (typeof window.clarity !== 'function') return;
    try {
      window.clarity('event', name);
      window.clarity('set', 'cal_source', source);
    } catch (e) {}
  }

  function load() {
    if (window.Calendly && window.Calendly.initPopupWidget) return Promise.resolve();
    if (loading) return loading;
    loading = new Promise(function (resolve, reject) {
      var l = document.createElement('link');
      l.rel = 'stylesheet';
      l.href = 'https://assets.calendly.com/assets/external/widget.css';
      document.head.appendChild(l);
      var s = document.createElement('script');
      s.src = 'https://assets.calendly.com/assets/external/widget.js';
      s.async = true;
      s.onload = resolve;
      s.onerror = function () { loading = null; reject(); };
      document.head.appendChild(s);
    });
    return loading;
  }

  /** Même lecture que wheel-whatsapp-cta.js : propriétés cochées, sans prix ni id YMQ. */
  function configSummary(formId) {
    var f = formId && document.getElementById(formId);
    if (!f) f = document.querySelector('form[action*="/cart/add"]:not([id*="installment"])');
    if (!f) return '';
    var out = [];
    var seen = {};
    for (var i = 0; i < f.elements.length; i++) {
      var el = f.elements[i];
      var m = el.name && el.name.match(/^properties\[(.+)\]$/);
      if (!m || m[1].charAt(0) === '_') continue;
      if ((el.type === 'radio' || el.type === 'checkbox') && !el.checked) continue;
      if (!el.value || seen[m[1]]) continue;
      seen[m[1]] = true;
      var label = m[1].replace(/-\d+-\d+$/, '').trim();
      var value = el.value.replace(/\s*\|\s*[\d\s.,]+\s*[€$£]\s*$/, '').trim();
      out.push(label + ' : ' + value);
    }
    // Longueur maximale d'une réponse non documentée par Calendly : marge.
    return out.join(' / ').slice(0, 900);
  }

  function utm(source, campaign) {
    return {
      utmSource: 'site',
      utmMedium: source,
      utmCampaign: (campaign || location.pathname).slice(0, 200),
      utmContent: ref().slice(0, 250)
    };
  }

  /** Utilisé par sections/calendly-inline.liquid. */
  window.lavCalInline = function (box) {
    lastSource = box.dataset.source || 'contact_inline';
    return load().then(function () {
      var q = new URLSearchParams(location.search);
      var u = utm(lastSource, q.get('utm_campaign') || location.pathname);
      if (q.get('utm_source')) u.utmSource = q.get('utm_source');
      if (q.get('utm_medium')) u.utmMedium = q.get('utm_medium');
      window.Calendly.initInlineWidget({ url: box.dataset.url, parentElement: box, resize: true, utm: u });
    });
  };

  document.addEventListener('click', function (e) {
    var btn = e.target && e.target.closest ? e.target.closest('[data-calendly-open]') : null;
    if (!btn) return;
    e.preventDefault();
    lastSource = btn.dataset.source || 'inconnu';
    g('event', 'calendly_open', { cal_source: lastSource, page_path: location.pathname, wa_ref: ref() });
    clarity('calendly_open', lastSource);

    var answers = {};
    if (btn.dataset.vehicle) answers.a1 = btn.dataset.vehicle;
    var cfg = configSummary(btn.dataset.formId);
    if (cfg) answers.a2 = cfg;

    btn.setAttribute('aria-busy', 'true');
    load().then(function () {
      btn.removeAttribute('aria-busy');
      window.Calendly.initPopupWidget({
        url: btn.dataset.url,
        prefill: { customAnswers: answers },
        utm: utm(lastSource, btn.dataset.handle)
      });
    }).catch(function () {
      // Script bloqué (bloqueur, réseau) : on ouvre la page Calendly directement.
      btn.removeAttribute('aria-busy');
      window.open(btn.dataset.url, '_blank', 'noopener');
    });
  });

  window.addEventListener('message', function (e) {
    if (e.origin !== 'https://calendly.com' || !e.data || typeof e.data.event !== 'string') return;
    var ev = e.data.event;
    if (ev === 'calendly.date_and_time_selected') {
      g('event', 'calendly_slot', { cal_source: lastSource, page_path: location.pathname });
      clarity('calendly_slot', lastSource);
    } else if (ev === 'calendly.event_scheduled') {
      var p = e.data.payload || {};
      var uri = (p.invitee && p.invitee.uri) || String(Date.now());
      if (booked[uri]) return;
      booked[uri] = true;
      g('event', 'calendly_booked', { cal_source: lastSource, page_path: location.pathname, wa_ref: ref() });
      if (ADS_SEND_TO) g('event', 'conversion', { send_to: ADS_SEND_TO, value: ADS_VALUE, currency: 'EUR' });
      try { if (typeof window.fbq === 'function') window.fbq('track', 'Schedule'); } catch (err) {}
      clarity('calendly_booked', lastSource);
      try { if (typeof window.clarity === 'function') window.clarity('upgrade', 'calendly_booked'); } catch (err) {}
    }
  });
})();
