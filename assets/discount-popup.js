/**
 * Popup 3D — Captation WhatsApp via visuel 3D
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
    if (document.querySelector('#cart-whatsapp-popup.cwp-visible')) return;
    markAsShown();

    var whatsappMessage = encodeURIComponent(
      'Bonjour \u{1F44B}, j’aimerais recevoir un visuel 3D de mon volant personnalisé. Merci !'
    );
    var whatsappUrl = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + whatsappMessage;

    var overlay = document.createElement('div');
    overlay.className = 'dpop-overlay';

    var container = document.createElement('div');
    container.className = 'dpop-container';
    container.setAttribute('role', 'dialog');
    container.setAttribute('aria-modal', 'true');
    container.setAttribute('aria-label', 'Recevez votre visuel 3D par WhatsApp');

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
                  '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 2c4.41 0 8 3.59 8 8h-5.1c-.56-1.18-1.76-2-3.15-2s-2.58.82-3.15 2H4c0-4.41 3.59-8 8-8zm-1.5 8c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5zM4.26 14h4.59c.33.72.9 1.31 1.65 1.65v4.09c-3.03-.65-5.42-2.83-6.24-5.74zm9.24 5.74v-4.09c.75-.34 1.31-.93 1.65-1.65h4.59c-.82 2.91-3.21 5.09-6.24 5.74z"/></svg>' +
                '</div>' +
              '</div>' +
            '</div>' +
            '<div class="dpop-3d-badge">3D</div>' +
          '</div>' +
          '<h2 class="dpop-title">Visualisez votre volant <span class="dpop-highlight">en 3D</span></h2>' +
          '<p class="dpop-subtitle">Recevez gratuitement un <strong>rendu 3D personnalisé</strong> de votre futur volant directement sur WhatsApp</p>' +
          '<div class="dpop-steps">' +
            '<div class="dpop-step">' +
              '<div class="dpop-step-num">1</div>' +
              '<div class="dpop-step-text">Écrivez-nous</div>' +
            '</div>' +
            '<div class="dpop-step-arrow">›</div>' +
            '<div class="dpop-step">' +
              '<div class="dpop-step-num">2</div>' +
              '<div class="dpop-step-text">Choisissez vos options</div>' +
            '</div>' +
            '<div class="dpop-step-arrow">›</div>' +
            '<div class="dpop-step">' +
              '<div class="dpop-step-num">3</div>' +
              '<div class="dpop-step-text">Recevez votre visuel 3D</div>' +
            '</div>' +
          '</div>' +
          '<a href="' + whatsappUrl + '" target="_blank" rel="noopener noreferrer" class="dpop-wa-button">' +
            '<svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>' +
            'Recevoir mon visuel 3D' +
          '</a>' +
          '<button class="dpop-skip">Non merci, je continue</button>' +
          '<p class="dpop-footer-text">Gratuit • Sans engagement • Réponse rapide</p>' +
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
