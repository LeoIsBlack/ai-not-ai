(function () {
  "use strict";

  var site = typeof SITE !== "undefined" ? SITE : {};
  var works = typeof WORKS !== "undefined" ? WORKS : [];

  var $ = function (sel) { return document.querySelector(sel); };
  var el = function (tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text) node.textContent = text;
    return node;
  };

  /* ---------- Имя и год ---------- */
  if (site.name) {
    document.querySelectorAll("[data-site-name]").forEach(function (n) {
      if (!n.classList.contains("logo")) { n.textContent = site.name; return; }
      // Логотип: слово «not» набирается тоньше и тише остальных
      n.textContent = "";
      site.name.split(/\s+/).forEach(function (word) {
        n.appendChild(el("span", word.toLowerCase() === "not" ? "logo__not" : "", word));
      });
      n.setAttribute("aria-label", site.name + " — наверх");
    });
    document.title = site.name + " — портфолио ИИ-видео";
  }
  $("#year").textContent = new Date().getFullYear();

  /* ---------- Разбор ссылки на видео ---------- */
  function parseVideo(url) {
    if (!url) return null;
    var m;
    if ((m = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{11})/))) {
      return { type: "youtube", id: m[1], cover: "https://i.ytimg.com/vi/" + m[1] + "/maxresdefault.jpg" };
    }
    if ((m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/))) {
      return { type: "iframe", src: "https://player.vimeo.com/video/" + m[1] + "?autoplay=1" };
    }
    if ((m = url.match(/rutube\.ru\/(?:video|shorts|play\/embed)\/([\da-f]+)/i))) {
      return { type: "iframe", src: "https://rutube.ru/play/embed/" + m[1] };
    }
    if ((m = url.match(/vk(?:video)?\.(?:com|ru)\/.*video(-?\d+)_(\d+)/))) {
      return { type: "iframe", src: "https://vk.com/video_ext.php?oid=" + m[1] + "&id=" + m[2] + "&hd=2&autoplay=1" };
    }
    if ((m = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([\w-]+)/))) {
      return { type: "iframe", src: "https://drive.google.com/file/d/" + m[1] + "/preview" };
    }
    if (/\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(url)) {
      return { type: "video", src: url };
    }
    return { type: "link", src: url };
  }

  /* Обложка YouTube: большая, а если её нет — запасная без чёрных полос */
  function ytCover(img, id) {
    img.addEventListener("load", function check() {
      if (img.naturalWidth > 0 && img.naturalWidth <= 120) {
        img.removeEventListener("load", check);
        img.src = "https://i.ytimg.com/vi/" + id + "/mqdefault.jpg";
      }
    });
    img.src = "https://i.ytimg.com/vi/" + id + "/maxresdefault.jpg";
  }

  /* ---------- Собственный плеер для YouTube ----------
     Ролик играет внутри сайта: название, логотип и ссылки YouTube
     остаются за краями рамки, а все нажатия принимает наш слой. */
  var ytQueue = [];
  var ytLoading = false;
  function loadYT(ok, fail) {
    if (window.YT && window.YT.Player) { ok(); return; }
    ytQueue.push([ok, fail]);
    if (ytLoading) return;
    ytLoading = true;
    window.onYouTubeIframeAPIReady = function () {
      ytQueue.splice(0).forEach(function (q) { q[0](); });
    };
    var script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.onerror = function () {
      ytLoading = false;
      ytQueue.splice(0).forEach(function (q) { q[1](); });
    };
    document.head.appendChild(script);
  }

  var ICONS = {
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg>',
    pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 6v12M15.5 6v12" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>',
    sound: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5v5h3.5l4.5 4v-13l-4.5 4z" fill="currentColor"/><path d="M15.5 9a4.2 4.2 0 0 1 0 6M18 6.5a7.8 7.8 0 0 1 0 11" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    muted: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5v5h3.5l4.5 4v-13l-4.5 4z" fill="currentColor"/><path d="M16 9.5l5 5M21 9.5l-5 5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    full: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 9.5v-5h5M14.5 4.5h5v5M19.5 14.5v5h-5M9.5 19.5h-5v-5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };

  function fmtTime(sec) {
    sec = Math.max(0, Math.floor(sec || 0));
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    return m + ":" + (s < 10 ? "0" : "") + s;
  }

  function mountYouTube(host, id, work) {
    var alive = true;
    var player = null;
    var timer = null;
    var idleTimer = null;
    var seeking = false;
    var started = false;
    var pendingPlay = false;

    var root = el("div", "player is-cover is-loading");
    var frame = el("div", "player__frame");
    var target = el("div");
    frame.appendChild(target);

    var poster = el("img", "player__poster");
    poster.alt = "";
    if (work.cover) poster.src = work.cover; else ytCover(poster, id);

    var surface = el("button", "player__surface");
    surface.type = "button";
    surface.setAttribute("aria-label", "Воспроизвести или поставить на паузу");

    var big = el("span", "player__big");
    big.innerHTML = ICONS.play;
    var spinner = el("span", "player__spinner");

    var bar = el("div", "player__bar");
    var btnPlay = el("button", "player__btn");
    btnPlay.type = "button";
    btnPlay.setAttribute("aria-label", "Воспроизвести");
    btnPlay.innerHTML = ICONS.play;
    var timeCur = el("span", "player__time", "0:00");
    var range = el("input", "player__range");
    range.type = "range"; range.min = 0; range.max = 1000; range.step = 1; range.value = 0;
    range.setAttribute("aria-label", "Перемотка");
    var timeDur = el("span", "player__time", "0:00");
    var btnMute = el("button", "player__btn");
    btnMute.type = "button";
    btnMute.setAttribute("aria-label", "Выключить звук");
    btnMute.innerHTML = ICONS.sound;
    var btnFull = el("button", "player__btn");
    btnFull.type = "button";
    btnFull.setAttribute("aria-label", "На весь экран");
    btnFull.innerHTML = ICONS.full;

    [btnPlay, timeCur, range, timeDur, btnMute].forEach(function (n) { bar.appendChild(n); });
    var canFull = !!(root.requestFullscreen || root.webkitRequestFullscreen);
    if (canFull) bar.appendChild(btnFull);

    [frame, poster, surface, big, spinner, bar].forEach(function (n) { root.appendChild(n); });
    host.appendChild(root);

    // YouTube выбирает качество по размеру окна плеера. Рисуем его увеличенным
    // (не уже ~1040px) и сжимаем обратно — так ролик идёт в 480p и быстро грузится.
    function fit() {
      var w = root.clientWidth || 1;
      root.style.setProperty("--k", Math.min(6, Math.max(1, 1040 / w)).toFixed(3));
    }
    fit();
    var resizeWatch = null;
    if ("ResizeObserver" in window) {
      resizeWatch = new ResizeObserver(fit);
      resizeWatch.observe(root);
    } else {
      window.addEventListener("resize", fit);
    }

    function state() {
      try { return player && player.getPlayerState ? player.getPlayerState() : -1; } catch (e) { return -1; }
    }
    function isPlaying() { var s = state(); return s === 1 || s === 3; }

    function wake() {
      root.classList.add("is-active");
      clearTimeout(idleTimer);
      idleTimer = setTimeout(function () { root.classList.remove("is-active"); }, 2600);
    }

    function setRange(v) {
      range.value = v;
      range.style.setProperty("--p", (v / 10) + "%");
    }

    function syncMute() {
      var m = false;
      try { m = player.isMuted(); } catch (e) {}
      btnMute.innerHTML = m ? ICONS.muted : ICONS.sound;
      btnMute.setAttribute("aria-label", m ? "Включить звук" : "Выключить звук");
    }

    function showEnd() {
      try { player.pauseVideo(); player.seekTo(0, true); } catch (e) {}
      root.classList.add("is-cover");
      root.classList.remove("is-playing", "is-loading");
      setRange(0);
      timeCur.textContent = "0:00";
    }

    function tick() {
      if (!player || !player.getDuration) return;
      var dur = 0, cur = 0;
      try { dur = player.getDuration() || 0; cur = player.getCurrentTime() || 0; } catch (e) { return; }
      timeDur.textContent = fmtTime(dur);
      if (!seeking) {
        timeCur.textContent = fmtTime(cur);
        setRange(dur ? Math.round(cur / dur * 1000) : 0);
      }
      // Останавливаемся чуть раньше конца, чтобы YouTube не показал свои рекомендации
      if (dur > 1 && cur >= dur - 0.4 && state() === 1) showEnd();
    }

    function toggle() {
      if (!player || !player.playVideo) return;
      wake();
      if (isPlaying()) { player.pauseVideo(); return; }
      pendingPlay = true;
      player.playVideo();
      // Если устройство не дало запустить ролик из нашего слоя —
      // на время пропускаем нажатие к самому плееру
      setTimeout(function () {
        if (!alive || !pendingPlay || isPlaying()) return;
        root.classList.add("is-native");
        root.classList.remove("is-cover", "is-loading");
      }, 2200);
    }

    surface.addEventListener("click", toggle);
    btnPlay.addEventListener("click", toggle);
    btnMute.addEventListener("click", function () {
      if (!player || !player.isMuted) return;
      if (player.isMuted()) player.unMute(); else player.mute();
      setTimeout(syncMute, 150);
      wake();
    });
    btnFull.addEventListener("click", function () {
      var fsEl = document.fullscreenElement || document.webkitFullscreenElement;
      if (fsEl) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      else (root.requestFullscreen || root.webkitRequestFullscreen).call(root);
    });
    surface.addEventListener("dblclick", function () { if (canFull) btnFull.click(); });
    range.addEventListener("input", function () {
      seeking = true;
      range.style.setProperty("--p", (range.value / 10) + "%");
      try { timeCur.textContent = fmtTime(player.getDuration() * range.value / 1000); } catch (e) {}
      wake();
    });
    range.addEventListener("change", function () {
      try { player.seekTo(player.getDuration() * range.value / 1000, true); } catch (e) {}
      seeking = false;
    });
    root.addEventListener("pointermove", wake);
    root.addEventListener("keydown", wake);
    bar.addEventListener("focusin", wake);
    root.addEventListener("contextmenu", function (e) { e.preventDefault(); });

    function plainFallback() {
      if (!alive) return;
      // Скрипт плеера не загрузился — показываем обычное встраивание
      var f = document.createElement("iframe");
      f.src = "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1&rel=0&playsinline=1";
      f.title = work.title || "Видео";
      f.allow = "autoplay; fullscreen; picture-in-picture; encrypted-media";
      f.allowFullscreen = true;
      host.textContent = "";
      host.appendChild(f);
    }

    loadYT(function () {
      if (!alive) return;
      player = root._yt = new YT.Player(target, {
        host: "https://www.youtube-nocookie.com",
        videoId: id,
        width: "100%",
        height: "100%",
        playerVars: {
          autoplay: 1, controls: 0, rel: 0, playsinline: 1, disablekb: 1,
          fs: 0, iv_load_policy: 3, modestbranding: 1, cc_load_policy: 0
        },
        events: {
          onReady: function () {
            if (!alive) return;
            var f = player.getIframe && player.getIframe();
            if (f) { f.title = work.title || "Видео"; f.tabIndex = -1; }
            player.playVideo();
            timer = setInterval(tick, 250);
            // Браузер запретил запуск со звуком — начинаем без звука
            setTimeout(function () {
              if (!alive || isPlaying()) return;
              try { player.mute(); player.playVideo(); } catch (e) {}
              setTimeout(syncMute, 200);
              setTimeout(function () {
                if (alive && !started) root.classList.remove("is-loading");
              }, 1500);
            }, 1500);
          },
          onStateChange: function (e) {
            if (!alive) return;
            if (e.data === 1) {
              started = true;
              pendingPlay = false;
              root.classList.add("is-playing");
              root.classList.remove("is-cover", "is-loading", "is-native");
              btnPlay.innerHTML = ICONS.pause;
              btnPlay.setAttribute("aria-label", "Пауза");
              syncMute();
              wake();
            } else if (e.data === 2 || e.data === 0) {
              root.classList.remove("is-playing");
              btnPlay.innerHTML = ICONS.play;
              btnPlay.setAttribute("aria-label", "Воспроизвести");
              if (e.data === 0) showEnd();
            }
          },
          onError: function () { if (alive) root.classList.remove("is-loading"); }
        }
      });
    }, plainFallback);

    setTimeout(function () { try { surface.focus({ preventScroll: true }); } catch (e) {} }, 50);

    return function teardown() {
      alive = false;
      clearInterval(timer);
      clearTimeout(idleTimer);
      if (resizeWatch) resizeWatch.disconnect(); else window.removeEventListener("resize", fit);
      try { if (player && player.destroy) player.destroy(); } catch (e) {}
    };
  }

  /* ---------- Карточки ---------- */
  var grid = $("#grid");
  var cards = [];

  works.forEach(function (work, i) {
    var video = parseVideo(work.video);
    var card = el(video ? "button" : "div", "card reveal" + (video ? "" : " card--soon"));
    if (video) card.type = "button";
    card.dataset.category = work.category || "";

    var media = el("div", "card__media");
    var cover = work.cover || (video && video.cover);
    if (cover) {
      var img = el("img", "card__cover");
      img.alt = "";
      img.loading = "lazy";
      if (video && video.type === "youtube" && !work.cover) ytCover(img, video.id);
      else img.src = cover;
      media.appendChild(img);
    } else if (video && video.type === "video") {
      // Обложки нет — показываем первый кадр самого ролика
      var preview = el("video", "card__cover");
      preview.src = video.src + "#t=0.1";
      preview.muted = true;
      preview.playsInline = true;
      preview.preload = "metadata";
      preview.tabIndex = -1;
      media.appendChild(preview);
    } else {
      media.appendChild(el("div", "card__placeholder card__placeholder--" + (i % 6)));
    }

    if (work.vertical) media.appendChild(el("span", "card__format", "9:16"));

    if (video) {
      var play = el("span", "card__play");
      play.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg>';
      media.appendChild(play);
      card.setAttribute("aria-label", "Смотреть: " + work.title);
      card.addEventListener("click", function () { openWork(work); });
    } else {
      media.appendChild(el("span", "card__badge", "Скоро"));
    }

    var meta = el("div", "card__meta");
    if (work.category) meta.appendChild(el("p", "card__category", work.category));
    meta.appendChild(el("h3", "card__title", work.title));

    card.appendChild(media);
    card.appendChild(meta);
    grid.appendChild(card);
    cards.push(card);
  });

  /* ---------- Фильтры ---------- */
  var categories = [];
  works.forEach(function (w) {
    if (w.category && categories.indexOf(w.category) === -1) categories.push(w.category);
  });

  if (categories.length > 1) {
    var filters = $("#filters");
    ["Все"].concat(categories).forEach(function (name, i) {
      var chip = el("button", "chip" + (i === 0 ? " is-active" : ""), name);
      chip.type = "button";
      chip.setAttribute("aria-pressed", i === 0 ? "true" : "false");
      chip.addEventListener("click", function () {
        filters.querySelectorAll(".chip").forEach(function (c) {
          c.classList.toggle("is-active", c === chip);
          c.setAttribute("aria-pressed", c === chip ? "true" : "false");
        });
        cards.forEach(function (card) {
          card.hidden = i !== 0 && card.dataset.category !== name;
          if (!card.hidden) { card.style.transitionDelay = ""; card.classList.add("is-visible"); }
        });
      });
      filters.appendChild(chip);
    });
  }

  /* ---------- Окно просмотра ---------- */
  var modal = $("#modal");
  var modalMedia = $("#modal-media");
  var copyBtn = $("#modal-copy");
  var currentWork = null;
  var teardownPlayer = null;

  function workUrl(work) {
    return location.href.split("#")[0] + "#" + work.id;
  }

  function openWork(work) {
    var video = parseVideo(work.video);
    if (!video) return;
    if (video.type === "link") { window.open(video.src, "_blank", "noopener"); return; }

    currentWork = work;
    modal.classList.toggle("modal--vertical", !!work.vertical);
    $("#modal-category").textContent = work.category || "";
    $("#modal-title").textContent = work.title || "";
    $("#modal-desc").textContent = work.description || "";
    $("#modal-tools").textContent = work.tools ? "Инструменты: " + work.tools : "";
    copyBtn.textContent = "Скопировать ссылку";

    modalMedia.textContent = "";
    var player;
    if (video.type === "youtube") {
      teardownPlayer = mountYouTube(modalMedia, video.id, work);
    } else if (video.type === "video") {
      player = document.createElement("video");
      player.src = video.src;
      player.controls = true;
      player.autoplay = true;
      player.playsInline = true;
      if (work.cover) player.poster = work.cover;
    } else {
      player = document.createElement("iframe");
      player.src = video.src;
      player.title = work.title || "Видео";
      player.allow = "autoplay; fullscreen; picture-in-picture; encrypted-media";
      player.allowFullscreen = true;
    }
    if (player) modalMedia.appendChild(player);

    if (typeof modal.showModal === "function") modal.showModal();
    else modal.setAttribute("open", "");
    if (work.id) history.replaceState(null, "", "#" + work.id);
  }

  function closeModal() {
    if (typeof modal.close === "function") modal.close();
    else { modal.removeAttribute("open"); onClosed(); }
  }

  function onClosed() {
    if (teardownPlayer) { teardownPlayer(); teardownPlayer = null; }
    modalMedia.textContent = ""; // останавливает воспроизведение
    currentWork = null;
    history.replaceState(null, "", location.pathname + location.search);
  }

  modal.addEventListener("close", onClosed);
  $("#modal-close").addEventListener("click", closeModal);
  modal.addEventListener("click", function (e) {
    if (e.target === modal) closeModal(); // клик по затемнению
  });

  copyBtn.addEventListener("click", function () {
    if (!currentWork) return;
    var url = workUrl(currentWork);
    var done = function () { copyBtn.textContent = "Ссылка скопирована"; };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(url).then(done, function () { window.prompt("Ссылка на работу:", url); });
    } else {
      window.prompt("Ссылка на работу:", url);
    }
  });

  // Прямая ссылка на работу: сайт/#id
  function openFromHash() {
    var id = decodeURIComponent(location.hash.slice(1));
    if (!id) return;
    var work = works.filter(function (w) { return w.id === id; })[0];
    if (work && !modal.open) openWork(work);
  }
  window.addEventListener("hashchange", openFromHash);
  openFromHash();

  /* ---------- Контакты ---------- */
  var contacts = $("#contacts");
  var links = [
    ["Написать в WhatsApp", site.whatsapp],
    ["Telegram", site.telegram],
    ["Instagram", site.instagram],
    [site.email, site.email ? "mailto:" + site.email : ""]
  ].filter(function (l) { return l[1]; });

  links.forEach(function (l, i) {
    var a = el("a", "btn " + (i === 0 ? "btn--light" : "btn--outline-light"), l[0]);
    a.href = l[1];
    if (l[1].indexOf("mailto:") !== 0) { a.target = "_blank"; a.rel = "noopener"; }
    contacts.appendChild(a);
  });

  /* ---------- Подвал: контакты и документы ---------- */
  var footerContacts = $("#footer-contacts");
  [
    ["WhatsApp: +7 776 198 58 79", site.whatsapp],
    ["Telegram", site.telegram],
    ["Instagram", site.instagram],
    [site.email, site.email ? "mailto:" + site.email : ""]
  ].forEach(function (l) {
    if (!l[1]) return;
    var li = el("li");
    var a = el("a", "", l[0]);
    a.href = l[1];
    if (l[1].indexOf("mailto:") !== 0) { a.target = "_blank"; a.rel = "noopener"; }
    li.appendChild(a);
    footerContacts.appendChild(li);
  });

  var docModal = $("#doc-modal");
  var docMail = $("#doc-mail");
  document.querySelectorAll("[data-doc]").forEach(function (link) {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      var name = link.dataset.doc;
      $("#doc-title").textContent = name;
      if (site.email) {
        docMail.href = "mailto:" + site.email + "?subject=" + encodeURIComponent("Запрос документа: " + name);
      }
      if (typeof docModal.showModal === "function") docModal.showModal();
      else docModal.setAttribute("open", "");
    });
  });
  function closeDoc() {
    if (typeof docModal.close === "function") docModal.close();
    else docModal.removeAttribute("open");
  }
  $("#doc-close").addEventListener("click", closeDoc);
  docMail.addEventListener("click", closeDoc);
  docModal.addEventListener("click", function (e) { if (e.target === docModal) closeDoc(); });

  /* ---------- Шапка и появление блоков ---------- */
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var nav = $("#nav");
  var hero = $("#hero");
  var heroContent = $(".hero__content");
  var ticking = false;

  function onScroll() {
    ticking = false;
    var y = window.scrollY;
    var h = hero.offsetHeight;
    nav.classList.toggle("is-dark", y < h - 48);
    nav.classList.toggle("is-scrolled", y > 8);
    // Первый экран плавно уходит вглубь при прокрутке
    if (!reduceMotion && y <= h) {
      var p = y / h;
      heroContent.style.transform = "translate3d(0," + (y * 0.25).toFixed(1) + "px,0) scale(" + (1 - p * 0.08).toFixed(4) + ")";
      heroContent.style.opacity = Math.max(0, 1 - p * 1.5).toFixed(3);
    }
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  /* Появление блоков — соседние элементы выходят по очереди */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var observer = new IntersectionObserver(function (entries) {
      var entering = [];
      entries.forEach(function (entry) {
        var node = entry.target;
        if (entry.isIntersecting && entry.intersectionRatio >= 0.12) {
          if (!node.classList.contains("is-visible")) entering.push(node);
        } else if (!entry.isIntersecting) {
          // Ушёл за экран — прячем, чтобы при возврате анимация сыграла снова.
          // Если ушёл вверх, вернётся движением сверху вниз.
          node.style.transitionDelay = "";
          node.classList.remove("is-visible");
          node.classList.toggle("from-top", entry.boundingClientRect.top < 0);
        }
      });
      // При прокрутке вверх соседние элементы выходят в обратном порядке
      if (entering.length && entering[0].classList.contains("from-top")) entering.reverse();
      entering.forEach(function (node, i) {
        var delay = Math.min(i, 5) * 90;
        node.style.transitionDelay = delay + "ms";
        node.classList.add("is-visible");
        clearTimeout(node._revealTimer);
        node._revealTimer = setTimeout(function () { node.style.transitionDelay = ""; }, delay + 1000);
      });
    }, { threshold: [0, 0.12], rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(function (n) { observer.observe(n); });
  } else {
    revealEls.forEach(function (n) { n.classList.add("is-visible"); });
  }

  /* Счётчик проектов */
  var counter = $("#counter");
  if (counter && "IntersectionObserver" in window && !reduceMotion) {
    var target = parseInt(counter.dataset.to, 10) || 0;
    counter.textContent = "0";
    var counterObserver = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      counterObserver.disconnect();
      var start = null;
      var duration = 1800;
      (function tick(now) {
        if (start === null) start = now;
        var t = Math.min((now - start) / duration, 1);
        var eased = 1 - Math.pow(1 - t, 3);
        counter.textContent = Math.round(target * eased);
        if (t < 1) requestAnimationFrame(tick);
      })(performance.now());
    }, { threshold: 0.4 });
    counterObserver.observe(counter);
  }

  /* Наклон карточек и подсветка за курсором (только мышь) */
  if (!reduceMotion && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    document.querySelectorAll(".card, .tile").forEach(function (node) {
      var isCard = node.classList.contains("card");
      var surface = isCard ? node.querySelector(".card__media") : node;
      node.addEventListener("pointermove", function (e) {
        var r = surface.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width;
        var y = (e.clientY - r.top) / r.height;
        surface.style.setProperty("--mx", (x * 100).toFixed(1) + "%");
        surface.style.setProperty("--my", (y * 100).toFixed(1) + "%");
        if (isCard) {
          surface.style.transform = "perspective(900px) rotateX(" + ((0.5 - y) * 6).toFixed(2) + "deg) rotateY(" + ((x - 0.5) * 6).toFixed(2) + "deg)";
        }
      });
      node.addEventListener("pointerleave", function () {
        if (isCard) surface.style.transform = "";
      });
    });
  }
})();
