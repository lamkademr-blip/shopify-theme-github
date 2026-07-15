document.addEventListener('DOMContentLoaded', function() {
  var shippingMessage = document.getElementById('shipping-location-message');
  if (!shippingMessage) return;

  var country = window.Shopify && window.Shopify.country ? window.Shopify.country : '';
  if (country === 'FR' || country === 'France') {
    shippingMessage.textContent = 'Livraison offerte en France métropolitaine';
  } else if (country) {
    shippingMessage.textContent = 'Livraison disponible vers ' + country;
  } else {
    shippingMessage.textContent = 'Livraison offerte partout en France';
  }
});
