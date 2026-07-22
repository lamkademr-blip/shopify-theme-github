/**
 * Bouton WhatsApp « Envoyez votre configuration » (toutes pages produit).
 *
 * Au clic, construit le message à partir de l'état réel du formulaire
 * produit : options de la variante sélectionnée (via la carte JSON
 * [data-whatsapp-variants]), propriétés du configurateur si présent,
 * quantité et prix, puis met à jour le href wa.me avant la navigation.
 * Le lien reste fonctionnel sans ce script (href de repli côté serveur).
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
   * Variante sélectionnée : lue au clic depuis l'input caché name="id" du
   * formulaire, cherchée dans la carte JSON rendue par le snippet.
   * Renvoie null si la carte ou la variante est introuvable.
   */
  function readVariant(cta, form) {
    var mapEl = document.querySelector(
      '[data-whatsapp-variants][data-form-id="' + cta.dataset.formId + '"]'
    );
    if (!mapEl) return null;
    try {
      var map = JSON.parse(mapEl.textContent);
      var idInput = form.querySelector('input[name="id"]');
      var variant = idInput && map.variants[idInput.value];
      if (!variant) return null;
      return {
        price: variant.price,
        // Paires « Nom d'option : valeur », omises pour la variante par défaut.
        options: map.hasOnlyDefaultVariant
          ? []
          : map.optionNames.map(function (name, i) {
              return { label: name, value: variant.options[i] };
            })
      };
    } catch (e) {
      return null;
    }
  }

  /** « + 49.90 € » ou « 1 234,56 € » → centimes (0 si non analysable). */
  function parsePriceCents(text) {
    var raw = (text || '').replace(/[^\d.,]/g, '');
    if (!raw) return 0;
    if (raw.indexOf('.') > -1 && raw.indexOf(',') > -1) raw = raw.replace(/\./g, '');
    raw = raw.replace(',', '.');
    var value = parseFloat(raw);
    return isNaN(value) ? 0 : Math.round(value * 100);
  }

  /**
   * Supplément (en centimes) des options payantes de l'app d'options (YMQ).
   * Chaque choix payant affiche son prix dans un .ymq-price-span à côté du
   * bouton ; on additionne ceux des choix cochés. Deux précautions :
   * - dédoublonnage par name (l'app rend les groupes en double desktop/mobile) ;
   * - seuls les groupes actifs comptent, c.-à-d. ceux dont la propriété
   *   existe dans le formulaire (les sous-options masquées gardent un input
   *   coché mais leur propriété est retirée du formulaire par l'app).
   */
  function readAddonsCents(form, activeProps) {
    var cents = 0;
    var seen = {};
    document.querySelectorAll('.ymq-box input:checked, .ymq-box option:checked').forEach(function (el) {
      var input = el.tagName === 'OPTION' ? el.parentElement : el;
      var match = input.name && input.name.match(/^ymq\[(.+)\]$/);
      if (!match || seen[match[1]] || !activeProps[match[1]]) return;
      seen[match[1]] = true;

      // Prix : span dans le <label for=...> associé (ou parent), ou texte de l'<option>.
      var source = el;
      if (el.tagName !== 'OPTION') {
        source =
          (el.id && document.querySelector('label[for="' + CSS.escape(el.id) + '"] .ymq-price-span')) ||
          (el.closest('label') && el.closest('label').querySelector('.ymq-price-span'));
      }
      if (source) cents += parsePriceCents(source.textContent);
    });
    return cents;
  }

  /**
   * Propriétés visibles du formulaire (configurateur, champs personnalisés) :
   * radios cochées, selects et champs texte nommés properties[...]. Les
   * propriétés machine (préfixe _) et les valeurs vides sont ignorées.
   */
  function readProperties(form) {
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

    // Options de la variante sélectionnée, puis propriétés (configurateur…)
    var variant = readVariant(cta, form);
    var properties = readProperties(form);
    var selections = (variant ? variant.options : []).concat(properties);
    selections.forEach(function (opt) {
      if (opt.value) lines.push('• ' + opt.label + ' : ' + opt.value);
    });

    // Quantité (défaut 1 si le champ est absent ou vide)
    var qtyInput = form.elements.namedItem('quantity');
    var qty = qtyInput && parseInt(qtyInput.value, 10) > 0 ? parseInt(qtyInput.value, 10) : 1;
    lines.push('🔢 Quantité : ' + qty);

    // Prix total = (prix de la variante courante + supplément des options
    // payantes) × quantité (repli : prix rendu côté serveur ; ligne omise
    // si aucun prix disponible)
    var activeProps = {};
    properties.forEach(function (opt) { activeProps[opt.label] = true; });
    var unitCents = variant ? variant.price : parseInt(cta.dataset.priceCents, 10);
    if (unitCents > 0) {
      unitCents += readAddonsCents(form, activeProps);
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
