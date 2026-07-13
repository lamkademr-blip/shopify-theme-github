/**
 * Popup Remise 10% — Première Commande
 * Exit intent + délai différé
 */
(function () {
  'use strict';

  var POPUP_DELAY_MS = 12000;       // 12s avant popup automatique
  var COOKIE_NAME = '_lav_dpop_shown';
  var COOKIE_DAYS = 30;             // Ne pas réafficher avant 30 jours

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

    // Overlay
    var overlay = document.createElement('div');
    overlay.className = 'dpop-overlay';

    // Container
    var container = document.createElement('div');
    container.className = 'dpop-container';
    container.setAttribute('role', 'dialog');
    container.setAttribute('aria-modal', 'true');
    container.setAttribute('aria-label', '10% de réduction sur votre première commande');

    container.innerHTML =
      '<div class="dpop-card">' +
        '<button class="dpop-close" aria-label="Fermer">&times;</button>' +
        '<div class="dpop-badge">' +
          '<svg viewBox="0 0 24 24"><path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z"/></svg>' +
        '</div>' +
        '<h2 class="dpop-title">Bienvenue chez <span class="dpop-highlight">Les As du Volant</span></h2>' +
        '<p class="dpop-subtitle">Profitez de <strong>10% de réduction</strong> sur votre première commande</p>' +
        '<div class="dpop-code-box">' +
          '<span class="dpop-code-label">Code</span>' +
          '<span class="dpop-code-value">BIENVENUE10</span>' +
          '<button class="dpop-code-copy" aria-label="Copier le code">&nbsp;&#128203;</button>' +
        '</div>' +
        '<a href="/collections/all" class="dpop-button">Je profite de l\'offre</a>' +
        '<button class="dpop-skip">Non merci, je continue</button>' +
        '<p class="dpop-footer-text">Offre valable sur votre première commande. Code non cumulable.</p>' +
      '</div>';

    document.body.appendChild(overlay);
    document.body.appendChild(container);

    // Animation
    requestAnimationFrame(function () {
      overlay.classList.add('dpop-visible');
      container.classList.add('dpop-visible');
    });

    // Fermeture
    function closePopup() {
      overlay.classList.remove('dpop-visible');
      container.classList.remove('dpop-visible');
      setTimeout(function () {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        if (container.parentNode) container.parentNode.removeChild(container);
      }, 400);
    }

    var closeBtn = container.querySelector('.dpop-close');
    var skipBtn = container.querySelector('.dpop-skip');
    if (closeBtn) closeBtn.addEventListener('click', closePopup);
    if (skipBtn) skipBtn.addEventListener('click', closePopup);
    if (overlay) overlay.addEventListener('click', closePopup);

    // Copier le code promo
    var copyBtn = container.querySelector('.dpop-code-copy');
    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        var code = 'BIENVENUE10';
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(code).then(function () {
            copyBtn.textContent = '\u2705';
            setTimeout(function () { copyBtn.textContent = '\uD83D\uDCCB'; }, 2000);
          }).catch(function () { fallbackCopy(code, copyBtn); });
        } else {
          fallbackCopy(code, copyBtn);
        }
      });
    }

    function fallbackCopy(text, btn) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        btn.textContent = '\u2705';
        setTimeout(function () { btn.textContent = '\uD83D\uDCCB'; }, 2000);
      } catch (e) {}
      document.body.removeChild(ta);
    }
  }

  // Exit intent
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

  // Init
  function init() {
    if (hasBeenShown()) return;

    // Popup automatique après délai
    setTimeout(function () {
      if (!hasBeenShown()) {
        showPopup();
      }
    }, POPUP_DELAY_MS);

    // Exit intent
    setupExitIntent();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
