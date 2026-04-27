(function() {
  var dataEl = document.getElementById('product-stories-data');
  if (!dataEl) return;
  var data = JSON.parse(dataEl.textContent || '[]');
  if (!data.length) return;

  var viewer     = document.getElementById('story-viewer');
  var video      = document.getElementById('story-video');
  var progressBar = document.getElementById('story-progress');
  var closeBtn   = viewer.querySelector('.story-viewer__close');
  var prevBtn    = document.getElementById('story-prev');
  var nextBtn    = document.getElementById('story-next');
  var tapPrev    = document.getElementById('story-tap-prev');
  var tapNext    = document.getElementById('story-tap-next');
  var triggers   = document.querySelectorAll('.product-stories__circle');

  var currentIndex = 0;
  var progressInterval = null;
  var isPaused = false;

  function buildProgressBar() {
    progressBar.innerHTML = '';
    data.forEach(function(_, i) {
      var segment = document.createElement('div');
      segment.className = 'story-viewer__progress-segment';
      segment.dataset.index = i;
      var fill = document.createElement('span');
      fill.className = 'story-viewer__progress-fill';
      segment.appendChild(fill);
      progressBar.appendChild(segment);
    });
  }

  function updateProgress() {
    var segments = progressBar.querySelectorAll('.story-viewer__progress-segment');
    segments.forEach(function(seg, i) {
      var fill = seg.querySelector('.story-viewer__progress-fill');
      seg.classList.remove('story-viewer__progress-segment--complete');
      if (i < currentIndex) {
        seg.classList.add('story-viewer__progress-segment--complete');
        fill.style.width = '100%';
      } else if (i > currentIndex) {
        fill.style.width = '0%';
      }
    });
  }

  function loadVideo(index) {
    if (index < 0 || index >= data.length) return;
    currentIndex = index;
    isPaused = false;

    video.innerHTML = '';
    data[index].sources.forEach(function(src) {
      var source = document.createElement('source');
      source.src  = src.url;
      source.type = src.type;
      video.appendChild(source);
    });
    video.load();
    video.play().catch(function() {});
    updateProgress();
    startProgressTracking();
  }

  function startProgressTracking() {
    clearInterval(progressInterval);
    var segments = progressBar.querySelectorAll('.story-viewer__progress-segment');
    var segment = segments[currentIndex];
    if (!segment) return;
    var fill = segment.querySelector('.story-viewer__progress-fill');

    progressInterval = setInterval(function() {
      if (isPaused || !video.duration) return;
      var pct = (video.currentTime / video.duration) * 100;
      fill.style.width = pct + '%';
    }, 50);
  }

  function nextStory() {
    if (currentIndex < data.length - 1) {
      loadVideo(currentIndex + 1);
    } else {
      closeViewer();
    }
  }

  function prevStory() {
    if (currentIndex > 0) {
      loadVideo(currentIndex - 1);
    } else {
      video.currentTime = 0;
      video.play().catch(function() {});
    }
  }

  function openViewer(index) {
    viewer.hidden = false;
    document.body.style.overflow = 'hidden';
    buildProgressBar();
    loadVideo(index);
  }

  function closeViewer() {
    viewer.hidden = true;
    document.body.style.overflow = '';
    video.pause();
    clearInterval(progressInterval);
  }

  triggers.forEach(function(btn, i) {
    btn.addEventListener('click', function() { openViewer(i); });
  });

  closeBtn.addEventListener('click', closeViewer);
  nextBtn.addEventListener('click', nextStory);
  prevBtn.addEventListener('click', prevStory);
  tapNext.addEventListener('click', nextStory);
  tapPrev.addEventListener('click', prevStory);

  // Hold to pause
  ['mousedown', 'touchstart'].forEach(function(evt) {
    viewer.addEventListener(evt, function(e) {
      if (e.target.closest('.story-viewer__close, .story-viewer__nav')) return;
      isPaused = true;
      video.pause();
    });
  });

  ['mouseup', 'touchend', 'mouseleave'].forEach(function(evt) {
    viewer.addEventListener(evt, function() {
      if (isPaused) {
        isPaused = false;
        video.play().catch(function() {});
      }
    });
  });

  video.addEventListener('ended', nextStory);

  // Swipe
  var touchStartX = 0;
  viewer.addEventListener('touchstart', function(e) {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });
  viewer.addEventListener('touchend', function(e) {
    var diff = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) prevStory();
      else nextStory();
    }
  });

  document.addEventListener('keydown', function(e) {
    if (viewer.hidden) return;
    if (e.key === 'Escape')      closeViewer();
    if (e.key === 'ArrowRight')  nextStory();
    if (e.key === 'ArrowLeft')   prevStory();
  });
})();