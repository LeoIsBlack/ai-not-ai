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
    document.querySelectorAll("[data-site-name]").forEach(function (n) { n.textContent = site.name; });
    document.title = site.name + " — портфолио ИИ-видео";
  }
  $("#year").textContent = new Date().getFullYear();

  /* ---------- Разбор ссылки на видео ---------- */
  function parseVideo(url) {
    if (!url) return null;
    var m;
    if ((m = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{11})/))) {
      return {
        type: "iframe",
        src: "https://www.youtube-nocookie.com/embed/" + m[1] + "?autoplay=1&rel=0&playsinline=1",
        cover: "https://i.ytimg.com/vi/" + m[1] + "/hqdefault.jpg"
      };
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
      img.src = cover;
      img.alt = "";
      img.loading = "lazy";
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
          if (!card.hidden) card.classList.add("is-visible");
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
    if (video.type === "video") {
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
    modalMedia.appendChild(player);

    if (typeof modal.showModal === "function") modal.showModal();
    else modal.setAttribute("open", "");
    if (work.id) history.replaceState(null, "", "#" + work.id);
  }

  function closeModal() {
    if (typeof modal.close === "function") modal.close();
    else { modal.removeAttribute("open"); onClosed(); }
  }

  function onClosed() {
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

  /* ---------- Шапка и появление блоков ---------- */
  var nav = $("#nav");
  var onScroll = function () { nav.classList.toggle("is-scrolled", window.scrollY > 8); };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(function (n) { observer.observe(n); });
  } else {
    revealEls.forEach(function (n) { n.classList.add("is-visible"); });
  }
})();
