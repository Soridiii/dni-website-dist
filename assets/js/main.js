/* =========================================================
   DNI Company Profile — main.js
   Dimuat dengan <script src="assets/js/main.js" defer>.
   Modul:
     1. initNav            — hamburger menu (layar <= 960px)
     2. initAnimateOnScroll — animasi muncul saat scroll ([data-aos], [data-aos-stagger])
     3. initSectionScroll  — scroll mouse loncat per section ([data-snap]), desktop saja
   ========================================================= */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Penanda bahwa JS aktif. CSS hanya menyembunyikan elemen [data-aos]
  // jika class ini ada, jadi konten tetap tampil bila JS gagal dimuat.
  root.classList.add('js');

  /* ---------- 1. Hamburger menu ---------- */
  function initNav() {
    var header = document.querySelector('.site-header');
    if (!header) return;
    var toggle = header.querySelector('.nav-toggle');
    if (!toggle) return;

    function setOpen(open) {
      header.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Tutup menu' : 'Buka menu');
    }

    toggle.addEventListener('click', function () {
      setOpen(!header.classList.contains('is-open'));
    });

    header.querySelectorAll('.nav a').forEach(function (link) {
      link.addEventListener('click', function () { setOpen(false); });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && header.classList.contains('is-open')) {
        setOpen(false);
        toggle.focus();
      }
    });
  }

  /* ---------- 2. Animate on scroll ----------
     Pemakaian di HTML:
       <div data-aos="fade-up">                 animasi satu elemen
       <div data-aos="fade-left" data-aos-delay="150">   dengan jeda (ms)
       <ul data-aos-stagger="zoom">             setiap anak dianimasikan bergantian
     Jenis: fade-up, fade-left, fade-right, zoom */
  function initAnimateOnScroll() {
    var STAGGER_STEP = 70;   // jeda antar anak (ms)
    var STAGGER_MAX = 8;     // batas jeda agar list panjang tidak terlalu lama

    document.querySelectorAll('[data-aos-stagger]').forEach(function (group) {
      var type = group.getAttribute('data-aos-stagger') || 'fade-up';
      Array.prototype.forEach.call(group.children, function (child, i) {
        if (!child.hasAttribute('data-aos')) child.setAttribute('data-aos', type);
        child.style.setProperty('--aos-delay', (Math.min(i, STAGGER_MAX) * STAGGER_STEP) + 'ms');
      });
    });

    var items = document.querySelectorAll('[data-aos]');
    items.forEach(function (el) {
      var delay = el.getAttribute('data-aos-delay');
      if (delay) el.style.setProperty('--aos-delay', delay + 'ms');
    });

    if (reduceMotion.matches || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('aos-in'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('aos-in');
          observer.unobserve(entry.target);   // animasi hanya sekali
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

    items.forEach(function (el) { observer.observe(el); });
  }

  /* ---------- 3. Scroll per section dengan mouse ----------
     - Hanya di desktop (lebar > 960px dan pointer mouse).
     - Section yang lebih tinggi dari layar di-scroll normal dulu
       sampai ujungnya, baru loncat ke section berikutnya.
     - Keyboard, scrollbar, dan link anchor tetap bekerja normal. */
  function initSectionScroll() {
    var desktop = window.matchMedia('(min-width: 1101px) and (pointer: fine)');
    var header = document.querySelector('.site-header');
    var sections = Array.prototype.slice.call(document.querySelectorAll('[data-snap]'));
    if (sections.length < 2) return;

    var LOCK_MS = 850;   // lama kunci selama animasi scroll berjalan
    var EDGE = 4;        // toleransi piksel
    var locked = false;

    function headerHeight() { return header ? header.offsetHeight : 0; }
    function pageTop(el) { return el.getBoundingClientRect().top + window.scrollY; }

    function currentIndex() {
      var line = window.scrollY + headerHeight() + EDGE;
      var idx = 0;
      sections.forEach(function (s, i) { if (pageTop(s) <= line) idx = i; });
      return idx;
    }

    function scrollToY(y) {
      locked = true;
      window.scrollTo({ top: Math.max(0, y), behavior: reduceMotion.matches ? 'auto' : 'smooth' });
      window.setTimeout(function () { locked = false; }, LOCK_MS);
    }

    function goNext(i) {
      scrollToY(pageTop(sections[i + 1]) - headerHeight());
    }

    function goPrev(i) {
      var prev = sections[i - 1];
      var visible = window.innerHeight - headerHeight();
      // Section sebelumnya tinggi: tampilkan bagian bawahnya dulu.
      if (prev.offsetHeight > visible) {
        scrollToY(pageTop(prev) + prev.offsetHeight - window.innerHeight);
      } else {
        scrollToY(pageTop(prev) - headerHeight());
      }
    }

    window.addEventListener('wheel', function (e) {
      if (!desktop.matches || e.ctrlKey) return;                 // ctrl+wheel = zoom
      if (Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;       // scroll horizontal
      if (document.querySelector('.site-header.is-open')) return;

      if (locked) { e.preventDefault(); return; }

      var i = currentIndex();
      var rect = sections[i].getBoundingClientRect();
      var hh = headerHeight();

      if (e.deltaY > 0) {
        if (rect.bottom > window.innerHeight + EDGE) return;    // masih ada konten di bawah
        if (i < sections.length - 1) { e.preventDefault(); goNext(i); }
      } else if (e.deltaY < 0) {
        if (rect.top < hh - EDGE) return;                        // masih ada konten di atas
        if (i > 0) { e.preventDefault(); goPrev(i); }
      }
    }, { passive: false });
  }

  function initCleanAnchors() {
    function cleanUrl() {
      try {
        history.replaceState(null, '', window.location.pathname + window.location.search);
      } catch (err) { /* abaikan jika browser menolak */ }
    }

    function scrollToTarget(target) {
      target.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'start' });
      // Pindahkan fokus keyboard ke section tujuan (aksesibilitas) tanpa melompat lagi
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }

    document.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var link = e.target.closest('a[href^="#"]');
      if (!link) return;
      var id = link.getAttribute('href').slice(1);
      if (!id) return;
      var target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      scrollToTarget(target);
      cleanUrl();
    });

    // Jika halaman dibuka dari link lama yang berisi #section: scroll ke sana, lalu bersihkan URL
    if (window.location.hash) {
      var initial = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
      if (initial) {
        window.addEventListener('load', function () { scrollToTarget(initial); cleanUrl(); });
      } else {
        cleanUrl();
      }
    }
  }

  /* ---------- Jalankan ---------- */
  function boot() {
    initNav();
    initAnimateOnScroll();
    initSectionScroll();
    initCleanAnchors();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
