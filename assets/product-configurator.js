/**
 * Âme Acessórios Pet — Product Configurator
 * Tipos: sem_pingente (A) | pingente_incluso (B) | pingente_opcional (C)
 */
(function () {
  'use strict';



  function init() {
    // ── Bootstrap ──────────────────────────────────────────────────────────────
    const dataEl = document.getElementById('product-json');
    if (!dataEl) { console.error('product-json not found'); return; }

    const pd = JSON.parse(dataEl.textContent);
  const TIPO = pd.tipo; // 'sem_pingente' | 'pingente_incluso' | 'pingente_opcional'
  const IS_A = TIPO === 'sem_pingente';
  const IS_B = TIPO === 'pingente_incluso';
  const IS_C = TIPO === 'pingente_opcional';

  // ── Mapa segunda_cor por variante ─────────────────────────────────────────
  const segundaCorMap = JSON.parse(
    (document.getElementById('variants-segunda-cor') || { textContent: '{}' }).textContent
  );

  // ── State ──────────────────────────────────────────────────────────────────
  const S = {
    cor:          null,   // string (label da cor)
    tamanho:      null,   // string
    metal:        null,   // string (label: Ouro, Prata, Rose, Grafite)
    metalSlug:    null,   // string (slug: ouro, prata, rose, grafite)
    modelo:       null,   // 'metal' | 'couro' | 'metal_couro'
    formato:      null,   // 'circulo'|'coracao'|'flor'|'osso'
    pendantChoice:'sem',  // 'com'|'sem' (only Tipo C)
    segundaCor:   '',     // segunda cor da variante selecionada
    petName:      '',
    tutorName:    '',
    tutorPhone:   '',
    pendantExtra: 0,
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const $ = id => document.getElementById(id);
  const $$ = sel => [...document.querySelectorAll(sel)];

  function money(cents) {
    return 'R$\u00a0' + (cents / 100).toFixed(2).replace('.', ',');
  }

  function slugify(s) {
    return (s || '').toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }

  function setPressed(btn, val) {
    btn.setAttribute('aria-pressed', val ? 'true' : 'false');
    btn.classList.toggle('active', !!val);
  }

  function deactivateGroup(sel) {
    $$(sel).forEach(b => setPressed(b, false));
  }

  // ── Image resolution — coleira principal ──────────────────────────────────
  /**
   * Filename convention (imagens do produto/coleira):
   * [cor-slug]_[metal-slug]_[n].jpg
   * Score-based: quanto mais critérios batidos no alt, melhor.
   */
  function resolveImage() {
    const cor   = slugify(S.cor || '');
    const metal = S.metalSlug   || '';
    const criteria = [cor, metal].filter(Boolean);
    if (!criteria.length) return null;
    let best = null, bestScore = -1;
    for (const img of pd.allImages) {
      const alt = img.alt || '';
      let score = 0;
      for (const c of criteria) { if (c && alt.includes(c)) score++; }
      if (score > bestScore) { bestScore = score; best = img; }
    }
    return best && bestScore > 0 ? best.src : null;
  }

  // ── Image resolution — pingente ────────────────────────────────────────────
  /**
   * Busca a imagem do pingente no JSON do snippet pendant-images-json.
   * Campos de busca:
   *   metal:       shape + material="metal"      + metal=[metalSlug]
   *   couro:       shape + material="couro"      + segunda_cor=[segundaCor]
   *   metal-couro: shape + material="metal-couro"+ metal=[metalSlug] + segunda_cor=[segundaCor]
   */
  function getPendantImage(formato, material, metalSlug, segundaCor) {
    const jsonEl = document.getElementById('pendant-images-json');
    if (!jsonEl) return null;
    const entries = JSON.parse(jsonEl.textContent || '[]');

    return entries.find(e => {
      if (e.shape !== formato) return false;
      if (e.material !== material) return false;
      if (material === 'metal') return e.metal === metalSlug;
      if (material === 'couro') return e.segunda_cor === segundaCor;
      if (material === 'metal-couro') return e.metal === metalSlug && e.segunda_cor === segundaCor;
      return false;
    }) || null;
  }

  // Mapa de modelo JS → material do JSON
  const MODELO_TO_MATERIAL = { metal: 'metal', couro: 'couro', 'metal-couro': 'metal-couro' };

  function resolvePendantImageUrl(formato, modelo) {
    if (!formato || !modelo) return null;
    const material = MODELO_TO_MATERIAL[modelo];
    if (!material) return null;
    const entry = getPendantImage(formato, material, S.metalSlug, S.segundaCor);
    return entry?.image_url || null;
  }

  // ── Swap main image ────────────────────────────────────────────────────────
  const mainImg  = $('product-main-image');
  const skeleton = $('img-skeleton');
  let   swapTimer = null;

  function swapImage(src) {
    if (!src || !mainImg) return;
    clearTimeout(swapTimer);
    swapTimer = setTimeout(() => {
      mainImg.style.opacity = '0';
      const tmp = new Image();
      tmp.onload = () => {
        mainImg.src = src;
        mainImg.style.opacity = '1';
        syncThumbs(src);
      };
      tmp.onerror = () => {
        mainImg.style.opacity = '1';
      };
      tmp.src = src;
    }, 30);
  }

  function syncThumbs(activeSrc) {
    $$('.gallery__thumb').forEach(t => {
      t.classList.toggle('active', t.dataset.src === activeSrc);
    });
  }

  // ── Pendant overlay ────────────────────────────────────────────────────────
  function updatePendantOverlay() {
    const overlay = $('pendant-overlay');
    if (!overlay) return;

    if ((!IS_B && !IS_C) || !S.formato || !S.modelo) {
      overlay.style.opacity = '0';
      setTimeout(() => { overlay.hidden = true; }, 200);
      return;
    }

    const material = MODELO_TO_MATERIAL[S.modelo];
    if (!material) {
      overlay.style.opacity = '0';
      setTimeout(() => { overlay.hidden = true; }, 200);
      return;
    }

    const entry = getPendantImage(S.formato, material, S.metalSlug, S.segundaCor);
    if (entry && entry.image_url) {
      overlay.style.opacity = '0';
      overlay.hidden = false;
      overlay.onload = () => { overlay.style.opacity = '1'; };
      overlay.src = entry.image_url;
      if (overlay.complete && overlay.naturalHeight > 0) overlay.style.opacity = '1';
    } else {
      overlay.style.opacity = '0';
      setTimeout(() => { overlay.hidden = true; }, 200);
    }
  }

  // ── Update all visuals ─────────────────────────────────────────────────────
  function refresh() {
    updatePrice();
    updateBuyButton();

    // 1. Troca foto pela variante ativa (Cor + Tamanho + Metal)
    const variant = findVariant();
    if (variant && variant.featured_image && variant.featured_image.src) {
      swapImage(variant.featured_image.src);
    } else {
      const src = resolveImage();
      if (src) swapImage(src);
    }

    // 2. Overlay do pingente (PNG transparente)
    if (IS_B || IS_C) {
      updatePendantOverlay();
      checkPingenteAvailability();
    }
  }

  // ── Price ──────────────────────────────────────────────────────────────────
  function updatePrice() {
    const variant = findVariant();
    const base    = variant ? variant.price : pd.basePrice;
    S.pendantExtra = getPendantExtra();
    const total   = base + S.pendantExtra;

    const priceEl = $('js-price');
    const instEl  = $('js-installments');
    if (priceEl) priceEl.textContent = money(total);
    if (instEl)  instEl.textContent  = `até 6x de ${money(Math.round(total / 6))} sem juros`;

    const vi = $('cfg-variant-id');
    if (vi && variant) vi.value = variant.id;

    // Indisponível
    const buyBtn = $('btn-buy');
    const buyTxt = $('btn-buy-text');
    if (buyBtn && variant && !variant.available) {
      buyBtn.disabled = true;
      if (buyTxt) buyTxt.textContent = 'Indisponível';
    } else if (buyBtn && variant && variant.available && buyTxt) {
      if (buyTxt.textContent === 'Indisponível') buyTxt.textContent = 'Comprar';
    }
  }

  // Mapeia nomes das opções para índices (option1/option2/option3)
  const optionNames = pd.optionNames || []; // ex: ["Cor", "Tamanho", "Metal"]
  function optionIndex(names, keywords) {
    for (const kw of keywords) {
      const i = names.findIndex(n => n.toLowerCase().includes(kw));
      if (i !== -1) return i + 1; // retorna 1, 2 ou 3
    }
    return null;
  }
  const corOpt    = optionIndex(optionNames, ['cor', 'color', 'colour']);
  const tamOpt    = optionIndex(optionNames, ['tamanho', 'size', 'tam']);
  const metalOpt  = optionIndex(optionNames, ['metal', 'cor do metal']);

  function getVariantOption(v, optNum) {
    return v['option' + optNum] || null;
  }

  function findVariant() {
    return pd.variants.find(v => {
      const ok_cor   = !S.cor     || !corOpt   || (getVariantOption(v, corOpt)   || '').toLowerCase() === S.cor.toLowerCase();
      const ok_tam   = !S.tamanho || !tamOpt   || (getVariantOption(v, tamOpt)   || '').toLowerCase() === S.tamanho.toLowerCase();
      const ok_metal = !S.metal   || !metalOpt || (getVariantOption(v, metalOpt) || '').toLowerCase() === S.metal.toLowerCase();
      return ok_cor && ok_tam && ok_metal;
    });
  }

  // ── Buy button state ───────────────────────────────────────────────────────
  const hasSizeStep = !!document.getElementById('step-tamanho');

  function updateBuyButton() {
    const btn = $('btn-buy');
    if (!btn) return;

    const sizeOk = hasSizeStep ? !!S.tamanho : true;
    const metalOk = metalOpt ? !!S.metal : true;
    let ready = !!(S.cor && sizeOk && metalOk);

    const phoneDigits = S.tutorPhone.replace(/\D/g, '');
    const pendantPersonOk = !!(S.modelo && S.formato && S.petName.trim() && S.tutorName.trim() && phoneDigits.length >= 10);

    if (IS_B) ready = ready && pendantPersonOk;
    if (IS_C && S.pendantChoice === 'com') ready = ready && pendantPersonOk;

    btn.disabled = !ready;
    btn.classList.toggle('btn-buy--ready', ready);
  }

  // ── Swatch clicks (foto miniatura) ─────────────────────────────────────────
  const swatchBtns = $$('.swatch-photo');
  swatchBtns.forEach(btn => {
    // Init state from active swatch
    if (btn.classList.contains('active') || btn.getAttribute('aria-pressed') === 'true') {
      S.cor = btn.dataset.color;
      const variantId = btn.dataset.variantId;
      if (variantId && segundaCorMap[variantId] !== undefined) {
        S.segundaCor = segundaCorMap[variantId];
      }
    }

    btn.addEventListener('click', e => {
      e.stopPropagation();
      $$('.swatch-photo').forEach(b => setPressed(b, false));
      setPressed(btn, true);
      S.cor = btn.dataset.color;
      const label = $('chosen-cor');
      if (label) label.textContent = S.cor;

      // Atualiza segundaCor a partir do variant.id do swatch
      const variantId = btn.dataset.variantId;
      if (variantId && segundaCorMap[variantId] !== undefined) {
        S.segundaCor = segundaCorMap[variantId];
      }

      // Swap directly to swatch image, then resolve best match
      if (btn.dataset.imgSrc) {
        swapImage(btn.dataset.imgSrc);
        updateGalleryForColor(S.cor);
      }

      refresh();
    });
  });

  function updateGalleryForColor(color) {
    // Mark all thumbs — highlight ones matching the chosen color slug
    const slug = slugify(color);
    $$('.gallery__thumb').forEach(t => {
      const isMatch = (t.dataset.alt || '').includes(slug);
      t.classList.toggle('color-match', isMatch);
    });
  }

  // ── Tamanho ────────────────────────────────────────────────────────────────
  // Função pública para que o quiz possa selecionar tamanho
  function selectSize(val) {
    deactivateGroup('.size-btn');
    const btn = document.querySelector(`.size-btn[data-value="${val}"]`);
    if (btn) setPressed(btn, true);
    S.tamanho = val;
    const label = $('chosen-tamanho');
    if (label) label.textContent = val;
    const note = $('sz-override-note');
    if (note) { note.textContent = `✓ Tamanho ${val} sugerido pelo quiz`; note.style.display = 'block'; }
    refresh();
  }
  // Expõe para o quiz (definido em size-guide.liquid)
  window.ameSelectSize = selectSize;

  $$('.size-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      deactivateGroup('.size-btn');
      setPressed(btn, true);
      S.tamanho = btn.dataset.value;
      const label = $('chosen-tamanho');
      if (label) label.textContent = S.tamanho;
      refresh();
    });
  });

  // ── Metal ──────────────────────────────────────────────────────────────────
  // Generate metal buttons from product data
  const metalMap = {
    'grafite': 'metal-dot--grafite',
    'ouro': 'metal-dot--ouro',
    'prata': 'metal-dot--prata',
    'rose': 'metal-dot--rose'
  };

  const metalsContainer = $('metals-container');
  if (metalsContainer && pd.metals && pd.metals.length > 0) {
    pd.metals.forEach(m => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'metal-btn';
      btn.dataset.value = m.label;
      btn.dataset.slug = m.slug;
      btn.setAttribute('aria-pressed', 'false');

      const dotClass = metalMap[m.slug] || 'metal-dot--grafite';
      const span = document.createElement('span');
      span.className = `metal-dot ${dotClass}`;
      span.setAttribute('aria-hidden', 'true');
      btn.appendChild(span);
      btn.appendChild(document.createTextNode(m.label));

      btn.addEventListener('click', () => {
        $$('.metal-btn').forEach(b => setPressed(b, false));
        setPressed(btn, true);
        S.metal     = btn.dataset.value;
        S.metalSlug = btn.dataset.slug; // slug sem espaço, ex: "rósegold" → "rosegold"
        const label = $('chosen-metal');
        if (label) label.textContent = S.metal;
        refresh();
      });

      metalsContainer.appendChild(btn);
    });
  }

  // ── Helpers pingente — mapeamento tamanho/formato ────────────────────────
  function mapColarSizeToPingenteSize(colarSize) {
    const big = ['M', 'G'];
    return big.includes(colarSize) ? 'G' : 'P';
  }

  function mapFormatoToLabel(formato) {
    const map = { 'osso': 'Osso', 'coracao': 'Coração', 'flor': 'Flor', 'circulo': 'Círculo' };
    return map[formato] || null;
  }

  function findPingenteVariant() {
    if (!pd.pingenteProducts || !S.modelo) return null;
    const prod = pd.pingenteProducts[S.modelo];
    if (!prod || !prod.variants || !prod.variants.length) return null;
    const formatoLabel = mapFormatoToLabel(S.formato);
    if (!formatoLabel) return null;
    const tamanhoPingente = mapColarSizeToPingenteSize(S.tamanho);
    return prod.variants.find(v =>
      v.metal   === S.metal &&
      v.tamanho === tamanhoPingente &&
      v.formato === formatoLabel
    ) || null;
  }

  function getPendantExtra() {
    if (IS_A) return 0;
    if (IS_C && S.pendantChoice !== 'com') return 0;
    if (!S.modelo || !pd.pingentePrices) return 0;
    return pd.pingentePrices[S.modelo] || 0;
  }

  function checkPingenteAvailability() {
    const warning = document.getElementById('pingente-warning');
    if (!warning) return;
    if (!S.modelo || !S.formato || !S.metal || !S.tamanho) {
      warning.hidden = true;
      return;
    }
    const prod = pd.pingenteProducts?.[S.modelo];
    if (!prod || !prod.handle) {
      warning.hidden = false;
      warning.textContent = 'Esse modelo de pingente ainda não está disponível para essa cor de coleira.';
      return;
    }
    const variant = findPingenteVariant();
    if (!variant) {
      warning.hidden = false;
      warning.textContent = 'Essa combinação de pingente ainda não está cadastrada.';
      return;
    }
    if (!variant.available) {
      warning.hidden = false;
      warning.textContent = 'Essa combinação de pingente está sem estoque no momento.';
      return;
    }
    warning.hidden = true;
  }

  // ── Modelo do pingente (metal / couro / metal-couro) ─────────────────────
  if (IS_B || IS_C) {
    $$('.modelo-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        deactivateGroup('.modelo-btn');
        setPressed(btn, true);
        S.modelo = btn.dataset.modelo; // 'metal' | 'couro' | 'metal-couro'
        const sfx = btn.dataset.suffix || '';
        const chosenEl = $('chosen-modelo' + sfx);
        if (chosenEl) chosenEl.textContent = btn.querySelector('.modelo-btn__label')?.textContent || S.modelo;
        refresh();
      });
    });
  }

  // ── Gallery media player ──────────────────────────────────────────────────
  const mainVideo  = $('product-main-video');
  const mainEmbed  = $('product-main-embed');
  const mainIframe = $('product-main-iframe');

  // Parse media list from Liquid-rendered JSON
  let mediaList = [];
  try {
    const mEl = document.getElementById('product-media-json');
    if (mEl) mediaList = JSON.parse(mEl.textContent);
  } catch(e) {}

  function showImage(src) {
    if (mainImg)    { mainImg.src = src; mainImg.hidden = false; }
    if (mainVideo)  { mainVideo.pause(); mainVideo.hidden = true; }
    if (mainEmbed)  { mainEmbed.hidden = true; mainIframe.src = ''; }
  }

  function showVideo(sources) {
    if (!mainVideo) return;
    mainVideo.innerHTML = '';
    sources.forEach(s => {
      const el = document.createElement('source');
      el.src  = s.url;
      el.type = s.mime;
      mainVideo.appendChild(el);
    });
    mainVideo.load();
    if (mainImg)   mainImg.hidden = true;
    if (mainEmbed) mainEmbed.hidden = true;
    mainVideo.hidden = false;
  }

  function showEmbed(host, externalId) {
    let src = '';
    if (host === 'youtube') {
      src = `https://www.youtube.com/embed/${externalId}?rel=0&autoplay=1`;
    } else if (host === 'vimeo') {
      src = `https://player.vimeo.com/video/${externalId}?autoplay=1`;
    }
    if (!src) return;
    if (mainIframe) mainIframe.src = src;
    if (mainImg)    mainImg.hidden = true;
    if (mainVideo)  { mainVideo.pause(); mainVideo.hidden = true; }
    if (mainEmbed)  mainEmbed.hidden = false;
  }

  $$('.gallery__thumb').forEach(t => {
    t.addEventListener('click', () => {
      $$('.gallery__thumb').forEach(x => x.classList.remove('active'));
      t.classList.add('active');

      const idx  = parseInt(t.dataset.mediaIndex, 10);
      const type = t.dataset.mediaType;
      const media = mediaList[idx];

      if (type === 'image') {
        showImage(t.dataset.src || media?.src || '');
      } else if (type === 'video' && media?.sources) {
        showVideo(media.sources);
      } else if (type === 'external_video' && media) {
        showEmbed(media.host, media.external_id);
      }
    });
  });

  // ── Shape buttons (Tipo B e Tipo C) ───────────────────────────────────────
  if (IS_B || IS_C) {
    $$('[data-shape]').forEach(btn => {
      btn.addEventListener('click', () => {
        deactivateGroup('[data-shape]');
        setPressed(btn, true);
        S.formato = btn.dataset.shape;
        // Atualiza o label correto dependendo do tipo
        const chosenEl = $('chosen-formato') || $('chosen-formato-c');
        if (chosenEl) chosenEl.textContent = btn.querySelector('.shape-btn__label')?.textContent || S.formato;
        refresh();
      });
    });
  }

  // ── Toggle dados pingente ──────────────────────────────────────────────────
  function initToggle(btnId, wrapId) {
    const btn  = $(btnId);
    const wrap = $(wrapId);
    if (!btn || !wrap) return;
    btn.addEventListener('click', () => {
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', !expanded);
      wrap.hidden = expanded;
      btn.querySelector('.btn-toggle-dados__arrow').textContent = expanded ? '▾' : '▴';
    });
  }

  if (IS_B) initToggle('btn-toggle-dados', 'dados-wrap');
  if (IS_C) initToggle('btn-toggle-dados-c', 'dados-wrap-c');

  // ── Tipo C: escolha com/sem pingente ──────────────────────────────────────
  if (IS_C) {
    const cardCom = $('card-com-pingente');
    const cardSem = $('card-sem-pingente');
    const subSteps = $('sub-pendant-steps');

    function setPendantChoice(choice) {
      S.pendantChoice = choice;
      setPressed(cardCom, choice === 'com');
      setPressed(cardSem, choice === 'sem');
      if (subSteps) subSteps.hidden = choice !== 'com';
      if (choice !== 'com') {
        S.formato   = null;
        S.petName   = '';
        S.tutorName = '';
        S.tutorPhone= '';
      }
      refresh();
    }

    cardCom?.addEventListener('click', () => setPendantChoice('com'));
    cardSem?.addEventListener('click', () => setPendantChoice('sem'));

    // Update pendant preview images
    function updatePendantPreviews() {
      const comImg = $('preview-com-pingente');
      const semImg = $('preview-sem-pingente');
      if (comImg) {
        const src = findImageByHint('pingente') || resolveImage();
        if (src) comImg.src = src;
      }
      if (semImg) {
        const src = resolveImage() || (pd.allImages[0]?.src);
        if (src) semImg.src = src;
      }
    }

    function findImageByHint(hint) {
      return pd.allImages.find(i => (i.alt || '').includes(hint))?.src || null;
    }
  }

  // ── Personalization fields ─────────────────────────────────────────────────
  function initPersonFields(suffix) {
    const sfx = suffix || '';

    const petInput   = document.querySelector(`[data-field="pet"][data-suffix="${sfx}"]`);
    const tutorInput = document.querySelector(`[data-field="tutor"][data-suffix="${sfx}"]`);
    const phoneInput = document.querySelector(`[data-field="phone"][data-suffix="${sfx}"]`);

    function updatePersonState() {
      S.petName    = petInput?.value   || '';
      S.tutorName  = tutorInput?.value || '';
      S.tutorPhone = phoneInput?.value || '';
      updateBuyButton();
    }

    petInput?.addEventListener('input', updatePersonState);
    tutorInput?.addEventListener('input', updatePersonState);

    // Phone mask + state update
    phoneInput?.addEventListener('input', e => {
      let v = e.target.value.replace(/\D/g, '').slice(0, 11);
      if (v.length > 10) {
        v = v.replace(/^(\d{2})(\d{5})(\d{0,4}).*/, '($1) $2-$3');
      } else if (v.length > 6) {
        v = v.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
      } else if (v.length > 2) {
        v = v.replace(/^(\d{2})(\d{0,5}).*/, '($1) $2');
      } else if (v.length > 0) {
        v = v.replace(/^(\d{0,2}).*/, '($1');
      }
      e.target.value = v;
      S.tutorPhone = v;
      updateBuyButton();
    });
  }

  if (IS_B) initPersonFields('');
  if (IS_C) initPersonFields('-c');

  // ── Info loja textarea counter ─────────────────────────────────────────────
  const infoEl = $('cfg-info-loja');
  if (infoEl) {
    infoEl.addEventListener('input', () => {
      const cc = $('count-info');
      if (cc) cc.textContent = infoEl.value.length;
    });
  }

  // ── Tabela de Medidas modal ────────────────────────────────────────────────
  const medModal    = $('medidas-modal');
  const medClose    = $('medidas-close');
  const medBackdrop = $('medidas-backdrop');
  const linkMedidas = $('sz-link-medidas');

  function openMedidas(e) {
    e?.preventDefault();
    if (medModal) { medModal.hidden = false; document.body.style.overflow = 'hidden'; }
  }
  function closeMedidas() {
    if (medModal) { medModal.hidden = true; document.body.style.overflow = ''; }
  }

  linkMedidas?.addEventListener('click', openMedidas);
  medClose?.addEventListener('click', closeMedidas);
  medBackdrop?.addEventListener('click', closeMedidas);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMedidas(); });

  // Wire up any .sz-link-medidas buttons
  $$('.sz-link-medidas').forEach(el => el.addEventListener('click', openMedidas));

  // ── Form submit ────────────────────────────────────────────────────────────
  const form    = $('cfg-form');
  const btnBuy  = $('btn-buy');
  const btnText = $('btn-buy-text');
  const btnLoad = $('btn-buy-loading');
  const errEl   = $('cfg-error');

  function showError(msg) {
    if (!errEl) return;
    errEl.textContent = msg;
    errEl.hidden = false;
    errEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  function clearError() {
    if (errEl) { errEl.hidden = true; errEl.textContent = ''; }
  }

  form?.addEventListener('submit', async e => {
    e.preventDefault();
    clearError();

    // ── Propriedades da coleira (SEM dados de gravação) ──
    const infoLoja = $('cfg-info-loja');
    const coleiraProps = {
      'Cor da peça':  S.cor    || '',
      'Tamanho':      S.tamanho || '',
      'Cor do metal': S.metal  || '',
    };
    if (infoLoja?.value.trim()) coleiraProps['Informações para a loja'] = infoLoja.value.trim();

    const incluirPingente = IS_B || (IS_C && S.pendantChoice === 'com');

    const coleiraVariantId = parseInt(document.getElementById('cfg-variant-id').value);
    if (!coleiraVariantId) { showError('Variante da coleira não encontrada.'); return; }

    const items = [{ id: coleiraVariantId, quantity: 1, properties: coleiraProps }];

    // ── Item 2: produto pingente (TODOS os dados de gravação aqui) ──
    if (incluirPingente) {
      const pingenteVariant = findPingenteVariant();
      if (!pingenteVariant) {
        showError('Combinação de pingente não disponível. Tente outra cor de metal ou formato.');
        return;
      }
      if (!pingenteVariant.available) {
        showError('Esse pingente está sem estoque no momento.');
        return;
      }
      items.push({
        id: pingenteVariant.id,
        quantity: 1,
        properties: {
          'Pertence à coleira':  pd.title || document.title,
          'Cor do couro':        S.segundaCor || '',
          'Nome do pet':         S.petName || '',
          'Nome do tutor':       S.tutorName || '',
          'Telefone':            S.tutorPhone || '',
          '_linked_to_collar':   'true'
        }
      });
    }

    // Loading
    if (btnText) btnText.hidden = true;
    if (btnLoad) btnLoad.hidden = false;
    if (btnBuy)  btnBuy.disabled = true;

    try {
      const res = await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        body: JSON.stringify({ items }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.description || 'Não foi possível adicionar à sacola.');
      }

      const cartRes  = await fetch('/cart.js');
      const cartData = await cartRes.json();
      $$('.cart-count').forEach(el => { el.textContent = cartData.item_count; });

      // Open cart drawer
      document.querySelector('.cart-drawer')?.classList.add('open');
      document.querySelector('.cart-drawer-overlay')?.classList.add('open');
      document.body.style.overflow = 'hidden';

    } catch (err) {
      showError(err.message || 'Erro de conexão. Tente novamente.');
    } finally {
      if (btnText) btnText.hidden = false;
      if (btnLoad) btnLoad.hidden = true;
      if (btnBuy)  { btnBuy.disabled = false; updateBuyButton(); }
    }
  });

  // ── Preload all images ─────────────────────────────────────────────────────
  function preloadImages() {
    pd.allImages.forEach(img => {
      const link = document.createElement('link');
      link.rel  = 'prefetch';
      link.href = img.src;
      link.as   = 'image';
      document.head.appendChild(link);
    });
  }

  // ── Init ───────────────────────────────────────────────────────────────────
  (function initSelections() {
    // Pega a primeira variante disponível como base
    const firstVariant = pd.variants[0];
    if (!firstVariant) return;

    // ── COR: init a partir do swatch ativo no HTML ──
    const firstActiveSwatch = document.querySelector('.swatch-photo.active');
    if (firstActiveSwatch) {
      S.cor = firstActiveSwatch.dataset.color;
      const label = $('chosen-cor');
      if (label) label.textContent = S.cor;
      const initVariantId = firstActiveSwatch.dataset.variantId;
      if (initVariantId) S.segundaCor = segundaCorMap[initVariantId] || '';
    } else if (corOpt) {
      S.cor = firstVariant['option' + corOpt];
    }

    // ── TAMANHO: pré-selecionar o primeiro valor disponível ──
    if (tamOpt) {
      const initTam = firstVariant['option' + tamOpt];
      if (initTam) {
        S.tamanho = initTam;
        const tamLabel = $('chosen-tamanho');
        if (tamLabel) tamLabel.textContent = initTam;
        const tamBtn = document.querySelector(`.size-btn[data-value="${initTam}"]`);
        if (tamBtn) setPressed(tamBtn, true);
      }
    }

    // ── METAL: pré-selecionar o primeiro metal ──
    if (metalOpt) {
      const initMetal = firstVariant['option' + metalOpt];
      if (initMetal) {
        S.metal     = initMetal;
        S.metalSlug = initMetal.toLowerCase().replace(/\s+/g, '');
        const metalLabel = $('chosen-metal');
        if (metalLabel) metalLabel.textContent = initMetal;
        // Aguarda botões de metal serem renderizados (estão sendo criados logo acima)
        const tryActivateMetal = () => {
          const mBtn = document.querySelector(`.metal-btn[data-value="${initMetal}"]`);
          if (mBtn) setPressed(mBtn, true);
        };
        // Os botões de metal são criados no bloco logo antes — já existem
        tryActivateMetal();
      }
    }

    // ── Variant ID inicial ──
    const initVariant = findVariant();
    const vi = $('cfg-variant-id');
    if (vi && initVariant) vi.value = initVariant.id;

    // Mostrar imagem da primeira variante
    if (initVariant && initVariant.featured_image && initVariant.featured_image.src) {
      swapImage(initVariant.featured_image.src);
    }

    // Overlay começa escondido (nenhum formato selecionado ainda)
    const overlay = $('pendant-overlay');
    if (overlay) overlay.hidden = true;

    updatePrice();
    updateBuyButton();
    preloadImages();
  })();
  }

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();