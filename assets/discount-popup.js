/**
 * Popup 3D — Captation WhatsApp + Code Promo
 * Les As du Volant
 */
(function () {
  'use strict';

  var POPUP_DELAY_MS = 12000;
  var COOKIE_NAME = '_lav_dpop_shown';
  var COOKIE_DAYS = 30;
  var WHATSAPP_NUMBER = '33622510196';

  function getCookie(name) {
    var match = document.cookie.match('(?:^|;)\\s*' + name + '=([^;]*)');
    return match ? decodeURIComponent(match[1]) : null;
  }

  function setCookie(name, value, days) {
    var date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = name + '=' + encodeURIComponent(value) +
      '; expires=' + date.toUTCString() + '; path=/; SameSite=Lax';
  }

  function hasBeenShown() {
    return getCookie(COOKIE_NAME) === '1';
  }

  function markAsShown() {
    setCookie(COOKIE_NAME, '1', COOKIE_DAYS);
  }

  function showPopup() {
    if (hasBeenShown()) return;
    markAsShown();

    var whatsappMessage = encodeURIComponent(
      'Bonjour \u{1F44B}, je découvre votre site et j’aimerais recevoir mon code de réduction de bienvenue. Merci !'
    );
    var whatsappUrl = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + whatsappMessage;

    var overlay = document.createElement('div');
    overlay.className = 'dpop-overlay';

    var container = document.createElement('div');
    container.className = 'dpop-container';
    container.setAttribute('role', 'dialog');
    container.setAttribute('aria-modal', 'true');
    container.setAttribute('aria-label', 'Recevez votre code promo par WhatsApp');

    container.innerHTML =
      '<div class="dpop-card">' +
        '<div class="dpop-glow-bar"></div>' +
        '<div class="dpop-particles">' +
          '<div class="dpop-particle"></div>' +
          '<div class="dpop-particle"></div>' +
          '<div class="dpop-particle"></div>' +
          '<div class="dpop-particle"></div>' +
          '<div class="dpop-particle"></div>' +
        '</div>' +
        '<button class="dpop-close" aria-label="Fermer">&times;</button>' +
        '<div class="dpop-inner">' +
          '<div class="dpop-wheel-scene">' +
            '<div class="dpop-wheel">' +
              '<div class="dpop-wheel-inner">' +
                '<div class="dpop-wheel-center">' +
                  '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>' +
                '</div>' +
              '</div>' +
            '</div>' +
            '<div class="dpop-discount-badge">-10%</div>' +
          '</div>' +
          '<h2 class="dpop-title">Votre volant vous attend <span class="dpop-highlight">sur WhatsApp</span></h2>' +
          '<p class="dpop-subtitle">Recevez <strong>-10% sur votre première commande</strong> en nous contactant directement</p>' +
          '<div class="dpop-steps">' +
            '<div class="dpop-step">' +
              '<div class="dpop-step-num">1</div>' +
              '<div class="dpop-step-text">Écrivez-nous</div>' +
            '</div>' +
            '<div class="dpop-step-arrow">›</div>' +
            '<div class="dpop-step">' +
              '<div class="dpop-step-num">2</div>' +
              '<div class="dpop-step-text">Recevez votre code</div>' +
            '</div>' +
            '<div class="dpop-step-arrow">›</div>' +
            '<div class="dpop-step">' +
              '<div class="dpop-step-num">3</div>' +
              '<div class="dpop-step-text">Profitez de -10%</div>' +
            '</div>' +
          '</div>' +
          '<a href="' + whatsappUrl + '" target="_blank" rel="noopener noreferrer" class="dpop-wa-button">' +
            '<svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>' +
            'Recevoir mon code par WhatsApp' +
          '</a>' +
          '<button class="dpop-skip">Non merci, je continue sans réduction</button>' +
          '<p class="dpop-footer-text">Réponse instantanée • Conseils personnalisés • Sans engagement</p>' +
        '</div>' +
      '</div>';

    document.body.appendChild(overlay);
    document.body.appendChild(container);

    requestAnimationFrame(function () {
      overlay.classList.add('dpop-visible');
      container.classList.add('dpop-visible');
    });

    function closePopup() {
      overlay.classList.remove('dpop-visible');
      container.classList.remove('dpop-visible');
      setTimeout(function () {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        if (container.parentNode) container.parentNode.removeChild(container);
      }, 500);
    }

    var closeBtn = container.querySelector('.dpop-close');
    var skipBtn = container.querySelector('.dpop-skip');
    if (closeBtn) closeBtn.addEventListener('click', closePopup);
    if (skipBtn) skipBtn.addEventListener('click', closePopup);
    if (overlay) overlay.addEventListener('click', closePopup);
  }

  function setupExitIntent() {
    var exitFired = false;

    function onMouseLeave(e) {
      if (e.clientY > 0 || exitFired) return;
      exitFired = true;
      showPopup();
      document.removeEventListener('mouseleave', onMouseLeave);
    }

    document.addEventListener('mouseleave', onMouseLeave);
  }

  function init() {
    if (hasBeenShown()) return;
    setTimeout(function () {
      if (!hasBeenShown()) showPopup();
    }, POPUP_DELAY_MS);
    setupExitIntent();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
