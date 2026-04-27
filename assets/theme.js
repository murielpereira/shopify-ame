// ── Âme Acessórios Pet — Theme JS ──────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {

  // ── Header scroll effect ─────────────────────────────────────────────────
  const header = document.querySelector('.site-header');
  if (header) {
    window.addEventListener('scroll', () => {
      header.classList.toggle('scrolled', window.scrollY > 20);
    }, { passive: true });
  }

  // ── Mobile menu ──────────────────────────────────────────────────────────
  const menuToggle = document.querySelector('[data-mobile-menu-toggle]');
  const mobileMenu = document.querySelector('[data-mobile-menu]');
  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', () => {
      mobileMenu.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', mobileMenu.classList.contains('open'));
    });
  }

  // ── Cart Drawer ──────────────────────────────────────────────────────────
  const cartOverlay = document.querySelector('.cart-drawer-overlay');
  const cartDrawer  = document.querySelector('.cart-drawer');
  const cartToggles = document.querySelectorAll('[data-cart-toggle]');
  const cartClose   = document.querySelector('[data-cart-close]');

  function openCart() {
    cartOverlay?.classList.add('open');
    cartDrawer?.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeCart() {
    cartOverlay?.classList.remove('open');
    cartDrawer?.classList.remove('open');
    document.body.style.overflow = '';
  }

  cartToggles.forEach(btn => btn.addEventListener('click', openCart));
  cartClose?.addEventListener('click', closeCart);
  cartOverlay?.addEventListener('click', closeCart);

  // ── Product Image Gallery ────────────────────────────────────────────────
  const mainImage = document.querySelector('.product-page__main-image img');
  const thumbnails = document.querySelectorAll('.product-page__thumbnail');
  thumbnails.forEach(thumb => {
    thumb.addEventListener('click', () => {
      const src = thumb.querySelector('img')?.src;
      if (mainImage && src) mainImage.src = src;
      thumbnails.forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
    });
  });

  // ── Color Swatches ───────────────────────────────────────────────────────
  document.querySelectorAll('.swatch').forEach(swatch => {
    swatch.addEventListener('click', () => {
      const group = swatch.closest('.variant-colors');
      group?.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');
      const input = document.querySelector('input[name="Color"]') || document.querySelector('select[data-option="color"]');
      if (input) input.value = swatch.dataset.value;
    });
  });

  // ── Size Buttons ─────────────────────────────────────────────────────────
  document.querySelectorAll('.size-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const group = btn.closest('.variant-sizes');
      group?.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const input = document.querySelector('input[name="Size"]') || document.querySelector('select[data-option="size"]');
      if (input) input.value = btn.dataset.value;
    });
  });

  // ── Coupon Field ─────────────────────────────────────────────────────────
  const VALID_COUPONS = {
    'AME10':    { type: 'percent', value: 10, label: '10% de desconto' },
    'AME20':    { type: 'percent', value: 20, label: '20% de desconto' },
    'FRETE':    { type: 'fixed',   value: 30, label: 'R$30 de desconto' },
    'BEMVINDO': { type: 'percent', value: 15, label: '15% de desconto' },
  };

  const couponInput  = document.querySelector('[data-coupon-input]');
  const couponBtn    = document.querySelector('[data-coupon-apply]');
  const couponMsg    = document.querySelector('[data-coupon-message]');

  if (couponInput && couponBtn) {
    couponBtn.addEventListener('click', () => {
      const code = couponInput.value.trim().toUpperCase();
      const coupon = VALID_COUPONS[code];
      if (coupon) {
        if (couponMsg) {
          couponMsg.textContent = `✓ Cupom "${code}" aplicado — ${coupon.label}`;
          couponMsg.style.color = 'green';
        }
        couponInput.value = '';
        // Store for checkout
        sessionStorage.setItem('ame_coupon', JSON.stringify({ code, ...coupon }));
      } else {
        if (couponMsg) {
          couponMsg.textContent = 'Cupom inválido ou expirado.';
          couponMsg.style.color = 'red';
        }
      }
    });
  }

  // ── Announcement marquee duplicate ──────────────────────────────────────
  const marqueeInner = document.querySelector('.announcement-bar__inner');
  if (marqueeInner) {
    const clone = marqueeInner.cloneNode(true);
    marqueeInner.parentElement.appendChild(clone);
  }

  // ── Scroll reveal ────────────────────────────────────────────────────────
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.product-card, .category-banner').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(el);
  });

});