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
   * Idem, arrondi à l'euro supérieur et sans décimales : sur un montant
   * restant à atteindre, « 311 € » se lit mieux que « 311,00 € ».
   */
  function formatPriceRounded(cents, currency) {
    var euros = Math.ceil(cents / 100);
    try {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(euros);
    } catch (e) {
      return euros + ' ' + currency;
    }
  }

  /**
   * Variante sélectionnée : lue au clic depuis l'input caché name="id" du
   * formulaire, cherchée dans la carte JSON rendue par le snippet.
   * Renvoie null si la carte ou la variante est introuvable.
   */
  function readVariant(cta, form) {
    // Même repli que findForm : les CTA persistants n'ont pas d'id de formulaire.
    var mapEl =
      (cta.dataset.formId &&
        document.querySelector(
          '[data-whatsapp-variants][data-form-id="' + cta.dataset.formId + '"]'
        )) ||
      document.querySelector('[data-whatsapp-variants]');
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
   * Propriétés visibles du formulaire (configurateur, app d'options, champs
   * personnalisés) : radios cochées, selects et champs texte nommés
   * properties[...]. Les propriétés machine (préfixe _) et les valeurs vides
   * sont ignorées.
   *
   * L'app d'options écrit le supplément payant dans la valeur même de la
   * propriété (« Carbone + alcantara | 149.90 € ») — c'est ce qui arrive tel
   * quel dans le panier. On extrait ce montant dans `cents` pour le total.
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
      var priceSuffix = el.value.match(/\|\s*([\d\s.,]+\s*[€$£])\s*$/);
      options.push({
        label: label,
        value: el.value,
        cents: priceSuffix ? parsePriceCents(priceSuffix[1]) : 0
      });
    }
    return options;
  }

  function buildMessage(cta, form) {
    // Pas d'emoji ici : certains appareils les corrompent via le lien wa.me.
    var lines = ['Bonjour Les As du Volant,', '', 'Je souhaite vous envoyer ma configuration :', ''];

    // Nom du produit
    var title = cta.dataset.productTitle;
    if (title) lines.push('Produit : ' + title);

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
    lines.push('Quantité : ' + qty);

    // Prix total = (prix de la variante courante + suppléments des options
    // payantes) × quantité (repli : prix rendu côté serveur ; ligne omise
    // si aucun prix disponible)
    var unitCents = variant ? variant.price : parseInt(cta.dataset.priceCents, 10);
    var totalCents = 0;
    if (unitCents > 0) {
      properties.forEach(function (opt) { unitCents += opt.cents; });
      totalCents = unitCents * qty;
      lines.push('Total : ' + formatPrice(totalCents, cta.dataset.currency || 'EUR'));
    }

    // Offre en cours : 90 % des commandes passent par WhatsApp et ne voient
    // donc jamais la barre de progression du panier. On porte l'information
    // dans le message lui-même, en la personnalisant selon le total réel :
    // le client ouvre la conversation en sachant s'il est éligible ou ce qui
    // lui manque — ce qui ouvre naturellement la discussion sur les options.
    var promo = window.PROMO_ETE150;
    if (promo && totalCents > 0 && promo.threshold) {
      var deadlineOk = !promo.deadline || new Date(promo.deadline).getTime() > Date.now();
      if (deadlineOk) {
        var missing = promo.threshold - totalCents;
        lines.push(
          '',
          missing <= 0
            ? 'Offre : ma configuration atteint le seuil des 150 € offerts.'
            : 'Offre : il me manque ' +
              formatPriceRounded(missing, cta.dataset.currency || 'EUR') +
              ' pour les 150 € offerts.'
        );
      }
    }

    // URL du produit + configuration partageable (?cfg= maintenu par le configurateur)
    var url = cta.dataset.productUrl || '';
    if (url) {
      var cfg = new URLSearchParams(window.location.search).get('cfg');
      if (cfg) url += '?cfg=' + encodeURIComponent(cfg);
      lines.push('', 'Lien : ' + url);
    }

    return lines.join('\n');
  }

  /**
   * Formulaire produit associé au CTA.
   *
   * Le CTA rendu dans buy-buttons connaît l'id du <form> ; les CTA persistants
   * (barre collante, bouton flottant) sont rendus hors de la section produit et
   * ne l'ont pas. On retombe alors sur le premier formulaire d'ajout au panier
   * de la page, qui est celui du produit affiché.
   */
  function findForm(cta) {
    var byId = cta.dataset.formId && document.getElementById(cta.dataset.formId);
    if (byId) return byId;

    // Dawn rend deux formulaires /cart/add sur une fiche produit : le
    // formulaire de paiement échelonné (caché, id product-form-installment-…,
    // sans propriétés) arrive EN PREMIER dans le DOM. Prendre le premier venu
    // produirait un message sans aucune option choisie — exactement ce que ce
    // bouton doit transmettre. On écarte donc l'échelonné et on privilégie un
    // formulaire visible, puis celui qui porte le plus de properties[].
    var forms = [].slice
      .call(document.querySelectorAll('form[action*="/cart/add"]'))
      .filter(function (f) {
        return (f.getAttribute('id') || '').indexOf('installment') === -1;
      });
    if (!forms.length) return null;

    var visible = forms.filter(function (f) {
      return f.offsetParent !== null;
    });
    var candidates = visible.length ? visible : forms;

    return candidates.reduce(function (best, f) {
      return countProperties(f) > countProperties(best) ? f : best;
    }, candidates[0]);
  }

  /** Nombre de champs properties[...] d'un formulaire. */
  function countProperties(form) {
    var n = 0;
    for (var i = 0; i < form.elements.length; i++) {
      if (/^properties\[/.test(form.elements[i].name || '')) n++;
    }
    return n;
  }

  document.addEventListener('click', function (evt) {
    var cta = evt.target.closest('[data-whatsapp-cta]');
    if (!cta) return;

    var form = findForm(cta);
    // Sans formulaire, le href de repli (produit + URL) est conservé.
    if (!form) return;

    cta.href = 'https://wa.me/' + cta.dataset.phone + '?text=' + encodeURIComponent(buildMessage(cta, form));
  });
})();
