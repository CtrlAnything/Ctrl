// Shared by every Ctrl page: localized content, the signed GitHub release download and section reveals.
// The page sets window.CursorAppLocales; <html data-manifest> names its latest.json (default: next to the page).
(function () {
  "use strict";
  var locales = window.CursorAppLocales;
  if (!locales || !locales.en) return;
  var url = new URL(location.href);
  var picker = document.getElementById("language");
  var buttons = document.querySelectorAll("[data-download]");
  var labels = document.querySelectorAll(".download-label");
  var metas = document.querySelectorAll(".release-meta");
  var phase = "loading";
  var release = null;
  function supported(value) {
    if (!value) return null;
    var lower = value.toLowerCase();
    var exact = Object.keys(locales).find(function (key) { return key.toLowerCase() === lower; });
    if (exact) return exact;
    if (/^zh(?:-(?:hans|cn|sg))?(?:-|$)/.test(lower) && !/^zh-(?:hant|tw|hk|mo)/.test(lower)) return "zh-Hans";
    if (/^pt(?:-|$)/.test(lower)) return "pt-BR";
    var base = lower.split("-")[0];
    return locales[base] ? base : null;
  }
  var language = supported(url.searchParams.get("lang"));
  if (!language) {
    (navigator.languages || [navigator.language]).some(function (candidate) {
      language = supported(candidate);
      return !!language;
    });
  }
  language = language || "en";
  function each(list, body) { Array.prototype.forEach.call(list, body); }
  function renderRelease() {
    var text = locales[language];
    var ready = phase === "ready";
    var label = ready || phase === "local" ? text.download : phase === "soon" ? text.soon : phase === "error" ? text.unavailable : text.checking;
    each(labels, function (element) { element.textContent = label; });
    var meta = "";
    if (ready) {
      var size = new Intl.NumberFormat(language, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(release.size / 1048576);
      meta = text.version.replace("{version}", release.version).replace("{size}", size);
    } else if (phase === "soon") {
      meta = text.soonDetail;
    } else if (phase === "error") {
      meta = text.retry;
    }
    each(metas, function (element) {
      element.textContent = ready && "statusOnly" in element.dataset ? "" : meta;
    });
    each(document.querySelectorAll(".download-fallback"), function (element) {
      element.hidden = phase !== "error" && phase !== "soon";
    });
  }
  function applyLanguage() {
    var text = locales[language];
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.title = text.title;
    document.querySelector('meta[name="description"]').content = text.description;
    picker.value = language;
    each(document.querySelectorAll("[data-i18n]"), function (element) {
      element.textContent = text[element.dataset.i18n];
    });
    each(document.querySelectorAll("[data-i18n-label]"), function (element) {
      element.setAttribute("aria-label", text[element.dataset.i18nLabel]);
    });
    each(document.querySelectorAll("[data-i18n-alt]"), function (element) {
      element.alt = text[element.dataset.i18nAlt];
    });
    each(document.querySelectorAll("[data-localized-link]"), function (link) {
      var next = new URL(link.getAttribute("href"), location.href);
      next.searchParams.set("lang", language);
      link.href = next.href;
    });
    // The privacy policy exists in Russian and English; each link keeps its own relative path.
    each(document.querySelectorAll(".privacy-link"), function (link) {
      var privacy = new URL(link.getAttribute("href"), location.href);
      privacy.searchParams.set("lang", language === "ru" ? "ru" : "en");
      link.href = privacy.href;
    });
    // Native captures exist in Russian and English; every other language shows English.
    // data-shot is the path without the language suffix, relative to the page.
    var suffix = language === "ru" ? "ru" : "en";
    each(document.querySelectorAll("img[data-shot]"), function (image) {
      var source = image.dataset.shot + "-" + suffix + ".webp";
      if (image.getAttribute("src") !== source) image.setAttribute("src", source);
    });
    renderRelease();
    document.dispatchEvent(new CustomEvent("site:language", { detail: language }));
  }
  picker.addEventListener("change", function () {
    if (!locales[picker.value]) return;
    language = picker.value;
    var next = new URL(location.href);
    next.searchParams.set("lang", language);
    try { history.replaceState(null, "", next.href); } catch (_) { /* Some local-file viewers restrict history. */ }
    applyLanguage();
  });
  if (location.protocol === "file:") {
    phase = "local";
    applyLanguage();
    return;
  }
  each(buttons, function (button) {
    button.removeAttribute("href");
    button.setAttribute("aria-disabled", "true");
  });
  applyLanguage();
  function unavailable() {
    phase = "error";
    each(buttons, function (button) { button.dataset.state = "unavailable"; });
    renderRelease();
  }
  fetch(document.documentElement.dataset.manifest || "latest.json", { cache: "no-cache" })
    .then(function (response) { if (!response.ok) throw new Error("manifest"); return response.json(); })
    .then(function (info) {
      if (info && info.version === "0.0.0" && !info.url) {
        phase = "soon";
        each(buttons, function (button) { button.dataset.state = "unavailable"; });
        renderRelease();
        return;
      }
      if (!info || !/^\d+\.\d+(?:\.\d+)?$/.test(info.version) || info.version === "0.0.0"
        || !Number.isSafeInteger(info.build) || info.build <= 0
        || !Number.isSafeInteger(info.size) || info.size <= 0
        || !/^[a-f0-9]{64}$/i.test(info.sha256)
        || !/^\d+(?:\.\d+){0,2}$/.test(info.minimumSystemVersion)) throw new Error("manifest");
      // Legacy 1.1–1.3 releases shipped as CursorApp-Helper-* or Ctrl-Helper-*.dmg.
      var folder = "https://github.com/CtrlAnything/Ctrl/releases/download/helper-" + info.version + "/";
      var expected = folder + "Ctrl-for-Mac-" + info.version + ".dmg";
      if (info.url === folder + "Ctrl-Helper-" + info.version + ".dmg"
        || info.url === folder + "CursorApp-Helper-" + info.version + ".dmg") expected = info.url;
      if (info.url !== expected) throw new Error("asset");
      release = info;
      phase = "ready";
      each(buttons, function (button) {
        button.href = expected;
        button.removeAttribute("aria-disabled");
        button.setAttribute("download", "");
      });
      var sha = document.getElementById("sha");
      var shaBox = document.getElementById("sha-box");
      if (sha) sha.textContent = info.sha256;
      if (shaBox) shaBox.hidden = false;
      renderRelease();
    })
    .catch(unavailable);
})();


// Sections reveal once as they scroll in; without the observer everything shows at once.
(function () {
  "use strict";
  document.documentElement.classList.add("reveal-ready");

  var reveals = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -10% 0px" });
    reveals.forEach(function (element) { observer.observe(element); });
  } else {
    reveals.forEach(function (element) { element.classList.add("is-in"); });
  }
})();
