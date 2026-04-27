/**
 * Âme — Size Guide: Modal Tabela + Quiz de Tamanho
 */
(function () {
  'use strict';

  // ── Tabela de tamanhos ───────────────────────────────────────────────────
  const SIZE_TABLE = [
    { tam: 'XPP',  pescoco: '19 – 23 cm',   largura: '1 cm',   index: 0 },
    { tam: 'XPP+', pescoco: '20 – 27,5 cm', largura: '1 cm',   index: 1 },
    { tam: 'PP',   pescoco: '20 – 27,5 cm', largura: '1,5 cm', index: 2 },
    { tam: 'P',    pescoco: '27 – 37 cm',   largura: '1,5 cm', index: 3 },
    { tam: 'M',    pescoco: '33 – 45,5 cm', largura: '2 cm',   index: 4 },
    { tam: 'G',    pescoco: '45 – 60 cm',   largura: '2,5 cm', index: 5 },
  ];

  // ── Lógica de cálculo ────────────────────────────────────────────────────
  function calcularTamanho(raca, peso, adulto, meses) {
    // Gato → sempre XPP+
    if (raca === 'gato') {
      return { ...SIZE_TABLE[1], nota: 'Para gatos recomendamos o XPP+ 🐱' };
    }

    // Peso → índice base
    const pesoMap = {
      'ate-2kg':    0, // XPP
      '2-3.5kg':    1, // XPP+ (base; raças PP podem subir para 2)
      '4-10kg':     3, // P
      '12-22kg':    4, // M
      'acima-22kg': 5, // G
    };

    let idx = pesoMap[peso] ?? 3;

    // Raças que preferem PP (mais larga que XPP+) com peso 2–3,5kg
    const racasPP = ['pp-racas'];
    if (peso === '2-3.5kg' && racasPP.includes(raca)) {
      idx = 2; // PP
    }

    // Raças grandes → forçar índice mínimo
    const racasM = ['m-racas'];
    const racasG = ['g-racas'];
    if (racasG.includes(raca)) idx = Math.max(idx, 5);
    if (racasM.includes(raca)) idx = Math.max(idx, 4);

    // Filhote < 3 meses → +1 tamanho para crescer
    const fatorFilhote = (!adulto && meses === 'menos-3') ? 1 : 0;
    idx = Math.min(idx + fatorFilhote, 5);

    const resultado = SIZE_TABLE[idx];
    return {
      ...resultado,
      nota: fatorFilhote
        ? 'Sugerimos 1 tamanho a mais para o filhote crescer 🐶'
        : '',
    };
  }

  // ── Estado do quiz ───────────────────────────────────────────────────────
  const quiz = {
    raca:   null,
    peso:   null,
    adulto: null,
    meses:  null,
    recomendado: null,
  };

  let quizOpen = false;

  // ── DOM refs ─────────────────────────────────────────────────────────────
  const $ = id => document.getElementById(id);
  const $$ = sel => [...document.querySelectorAll(sel)];

  // Modal
  const modal         = $('sz-modal');
  const modalBackdrop = $('sz-modal-backdrop');
  const modalClose    = $('sz-modal-close');

  // Quiz
  const quizTrigger    = $('sz-quiz-trigger');
  const quizBody       = $('sz-quiz-body');
  const quizProgress   = $('sz-quiz-progress-bar');
  const quizResult     = $('sz-quiz-result');
  const resultSize     = $('sz-result-size');
  const resultDetail   = $('sz-result-detail');
  const resultNote     = $('sz-result-note');
  const resultConfirm  = $('sz-result-confirm');
  const quizRestart    = $('sz-quiz-restart');

  const STEPS = ['sq-step-1', 'sq-step-2', 'sq-step-3', 'sq-step-4'];
  const TOTAL_STEPS = 3; // base (sem filhote)

  // ── Modal ────────────────────────────────────────────────────────────────
  function openModal() {
    if (modal) { modal.hidden = false; document.body.style.overflow = 'hidden'; }
  }
  function closeModal() {
    if (modal) { modal.hidden = true; document.body.style.overflow = ''; }
  }

  modalClose?.addEventListener('click', closeModal);
  modalBackdrop?.addEventListener('click', closeModal);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  // Wire up all .sz-link-medidas buttons (from Liquid template)
  $$('.sz-link-medidas').forEach(el => el.addEventListener('click', openModal));

  // ── Quiz toggle ──────────────────────────────────────────────────────────
  quizTrigger?.addEventListener('click', () => {
    quizOpen = !quizOpen;
    quizTrigger.setAttribute('aria-expanded', quizOpen);
    if (quizBody) quizBody.hidden = !quizOpen;
    const textEl = $('sz-quiz-trigger-text');
    if (textEl) textEl.textContent = quizOpen
      ? 'Fechar quiz'
      : 'Vamos descobrir o tamanho ideal?';
  });

  // ── Mostrar step ─────────────────────────────────────────────────────────
  function showStep(stepId) {
    STEPS.forEach(id => {
      const el = $(id);
      if (el) el.hidden = (id !== stepId);
    });
    if (quizResult) quizResult.hidden = true;

    // Progresso
    const stepIndex = { 'sq-step-1': 1, 'sq-step-2': 2, 'sq-step-3': 3, 'sq-step-4': 3.5 };
    const pct = ((stepIndex[stepId] - 1) / TOTAL_STEPS) * 100;
    if (quizProgress) quizProgress.style.width = pct + '%';
  }

  // ── Respostas ────────────────────────────────────────────────────────────
  $$('.sz-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      const q   = btn.dataset.q;
      const val = btn.dataset.val;

      // Highlight dentro do grupo
      $$(`[data-q="${q}"]`).forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');

      switch (q) {
        case '1':
          quiz.raca = val;
          if (val === 'gato') {
            // Gato → pula para resultado direto
            quiz.peso   = '2-3.5kg';
            quiz.adulto = true;
            quiz.meses  = null;
            showResult();
          } else {
            showStep('sq-step-2');
          }
          break;

        case '2':
          quiz.peso = val;
          showStep('sq-step-3');
          break;

        case '3':
          quiz.adulto = (val === 'adulto');
          if (!quiz.adulto) {
            showStep('sq-step-4');
          } else {
            quiz.meses = null;
            showResult();
          }
          break;

        case '4':
          quiz.meses = val;
          showResult();
          break;
      }
    });
  });

  // ── Mostrar resultado ─────────────────────────────────────────────────────
  function showResult() {
    const res = calcularTamanho(quiz.raca, quiz.peso, quiz.adulto, quiz.meses);
    quiz.recomendado = res.tam;

    // Esconder todos os steps
    STEPS.forEach(id => { const el = $(id); if (el) el.hidden = true; });

    // Preencher card
    if (resultSize)   resultSize.textContent   = res.tam;
    if (resultDetail) resultDetail.textContent = `Pescoço ${res.pescoco} · Largura ${res.largura}`;
    if (resultNote)   resultNote.textContent   = res.nota || '';

    // Progresso completo
    if (quizProgress) quizProgress.style.width = '100%';

    if (quizResult) quizResult.hidden = false;

    // Selecionar o tamanho automaticamente no seletor
    selectSizeButton(res.tam);

    // Scroll suave até o seletor de tamanho
    setTimeout(() => {
      const sizeStep = document.getElementById('step-tamanho');
      sizeStep?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 300);
  }

  // ── Selecionar tamanho no seletor ─────────────────────────────────────────
  function selectSizeButton(tam) {
    $$('.size-btn').forEach(btn => {
      const match = btn.dataset.value === tam || btn.textContent.trim() === tam;
      btn.classList.toggle('active', match);
      btn.setAttribute('aria-pressed', match ? 'true' : 'false');
      if (match) {
        // Disparar clique real para atualizar o state do configurador
        btn.click();
      }
    });
  }

  // ── Confirmar tamanho ─────────────────────────────────────────────────────
  resultConfirm?.addEventListener('click', () => {
    // Fechar quiz
    quizOpen = false;
    quizTrigger?.setAttribute('aria-expanded', 'false');
    if (quizBody) quizBody.hidden = true;
    const textEl = $('sz-quiz-trigger-text');
    if (textEl) textEl.textContent = 'Vamos descobrir o tamanho ideal?';

    // Scroll até o seletor
    document.getElementById('step-tamanho')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  // ── Detectar troca manual de tamanho (override) ───────────────────────────
  $$('.size-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      if (!quiz.recomendado) return;
      const chosen = this.dataset.value || this.textContent.trim();
      const noteEl = document.getElementById('sz-override-note');
      if (!noteEl) return;
      if (chosen !== quiz.recomendado) {
        noteEl.textContent = `Você escolheu ${chosen} (sugerimos ${quiz.recomendado})`;
        noteEl.classList.add('visible');
      } else {
        noteEl.classList.remove('visible');
      }
    });
  });

  // ── Reiniciar quiz ────────────────────────────────────────────────────────
  quizRestart?.addEventListener('click', () => {
    quiz.raca = quiz.peso = quiz.adulto = quiz.meses = quiz.recomendado = null;
    $$('.sz-opt').forEach(b => b.classList.remove('selected'));
    if (quizProgress) quizProgress.style.width = '0%';
    showStep('sq-step-1');
  });

  // ── Init: começar no step 1 ───────────────────────────────────────────────
  showStep('sq-step-1');

})();