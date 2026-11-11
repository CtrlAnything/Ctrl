// The device switcher: each button shows its own remote in the phone. site.js keeps the picture in the page's
// language from the image's data-shot and data-i18n-alt, so a switch only has to change those.
(function () {
  "use strict";
  var locales = window.CursorAppLocales;
  var buttons = document.querySelectorAll("[data-device]");
  var image = document.querySelector(".phone img");
  var lights = document.querySelector(".phone .lights");
  if (!locales || !buttons.length || !image || !lights) return;
  function show(chosen) {
    Array.prototype.forEach.call(buttons, function (button) {
      button.setAttribute("aria-pressed", String(button === chosen));
    });
    var shot = chosen.dataset.shot;
    image.hidden = !shot;
    lights.hidden = !!shot;
    if (!shot) return;
    var language = locales[document.documentElement.lang] ? document.documentElement.lang : "en";
    image.dataset.shot = shot;
    image.dataset.i18nAlt = chosen.dataset.alt;
    image.alt = locales[language][chosen.dataset.alt];
    image.setAttribute("src", shot + "-" + (language === "ru" ? "ru" : "en") + ".webp");
  }
  Array.prototype.forEach.call(buttons, function (button) {
    button.addEventListener("click", function () { show(button); });
  });
})();
