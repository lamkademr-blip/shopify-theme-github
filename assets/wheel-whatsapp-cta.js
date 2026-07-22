/**
 * Bouton WhatsApp « Envoyez votre configuration ».
 *
 * Au clic, construit le message à partir de l'état réel du formulaire
 * produit (options du configurateur cochées, quantité, prix) puis met à
 * jour le href wa.me avant que la navigation n'ait lieu. Le lien reste
 * fonctionnel sans ce script (href de repli rendu côté serveur).
 *
 * Aucune dépendance : ne touche ni au configurateur ni au panier.
 */
(function () {
  'use strict';

  /** Prix en centimes → « 1 234,56 € » (repli brut si Intl indisponible). */
  function formatPrice(cents, currency) {
    var amount = cents / 100;
    try {
      return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: currency }).format(amount);
    } catch (e) {
      return amount.toFixed(2) + ' ' + currency;
    }
  }

  /**
   * Lit les propriétés visibles du formulaire : radios cochées, selects et
   * champs texte nommés properties[...]. Les propriétés machine (préfixe _)
   * et les valeurs vides sont ignorées.
   */
  function readOptions(form) {
    var options = [];
    var seen = {};
    for (var i = 0; i < form.elements.length; i++) {
      var el = form.elements[i];
      var match = el.name && el.name.match(/^properties\[(.+)\]$/);
      if (!match) continue;
      var label = match[1];
      if (label.charAt(0) === '_') continue; // propriété machine (_config, _hash)
      if ((el.type === 'radio' || el.type === 'checkbox') && !el.checked) continue;
      if (!el.value || seen[label]) continue;
      seen[label] = true;
      options.push({ label: label, value: el.value });
    }
    return options;
  }

  function buildMessage(cta, form) {
    var lines = ['Bonjour Les As du Volant 👋', '', 'Je souhaite vous envoyer ma configuration :', ''];

    // Nom du produit
    var title = cta.dataset.productTitle;
    if (title) lines.push('🏁 Produit : ' + title);

    // Options sélectionnées dans le configurateur
    readOptions(form).forEach(function (opt) {
      lines.push('• ' + opt.label + ' : ' + opt.value);
    });

    // Quantité (défaut 1 si le champ est absent ou vide)
    var qtyInput = form.elements.namedItem('quantity');
    var qty = qtyInput && parseInt(qtyInput.value, 10) > 0 ? parseInt(qtyInput.value, 10) : 1;
    lines.push('🔢 Quantité : ' + qty);

    // Prix total = prix unitaire × quantité (omis si prix indisponible)
    var unitCents = parseInt(cta.dataset.priceCents, 10);
    if (unitCents > 0) {
      lines.push('💰 Total : ' + formatPrice(unitCents * qty, cta.dataset.currency || 'EUR'));
    }

    // URL du produit + configuration partageable (?cfg= maintenu par le configurateur)
    var url = cta.dataset.productUrl || '';
    if (url) {
      var cfg = new URLSearchParams(window.location.search).get('cfg');
      if (cfg) url += '?cfg=' + encodeURIComponent(cfg);
      lines.push('', '🔗 ' + url);
    }

    return lines.join('\n');
  }

  document.addEventListener('click', function (evt) {
    var cta = evt.target.closest('[data-whatsapp-cta]');
    if (!cta) return;

    var form = document.getElementById(cta.dataset.formId);
    // Sans formulaire, le href de repli (produit + URL) est conservé.
    if (!form) return;

    cta.href = 'https://wa.me/' + cta.dataset.phone + '?text=' + encodeURIComponent(buildMessage(cta, form));
  });
})();
