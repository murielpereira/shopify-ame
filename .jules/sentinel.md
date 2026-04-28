## 2026-04-28 - [Sentinel Setup]
## 2025-04-27 - Fix DOM XSS in Product Configurator
**Vulnerability:** Found a DOM XSS vulnerability in `assets/product-configurator.js` where `.innerHTML` was used to render `m.label` (a product variant option).
**Learning:** Even though `m.label` typically comes from product data, interpolating strings directly into `.innerHTML` creates a risk if the product data is ever poisoned or manipulated.
**Prevention:** Always use safe DOM manipulation methods like `document.createElement`, `appendChild`, and `document.createTextNode` instead of `.innerHTML` when injecting data, especially when generating UI elements dynamically.
