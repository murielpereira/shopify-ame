## 2024-05-01 - Added ARIA labels to cart interaction elements
**Learning:** In a Shopify theme context, standard form inputs within the cart drawer often miss semantic ARIA labels, relying exclusively on visual `+` or `-` characters and placeholders for screen reader context.
**Action:** Always check the cart implementation (like `sections/header.liquid` or `snippets/cart-drawer.liquid`) in Shopify themes for semantic labelling on quantity toggles and coupon inputs.
