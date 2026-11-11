// Language selection stays in the URL, including links between the two pages.
(function () {
  "use strict";
  var url = new URL(location.href);
  var asked = url.searchParams.get("lang");
  var lang = asked === "ru" || asked === "en" ? asked
    : ((navigator.language || "en").toLowerCase().indexOf("ru") === 0 ? "ru" : "en");
  document.documentElement.lang = lang;
  var picker = document.getElementById("language");
  if (picker) {
    picker.value = lang;
    picker.addEventListener("change", function () {
      if (picker.value !== "ru" && picker.value !== "en") return;
      var next = new URL(location.href);
      next.searchParams.set("lang", picker.value);
      location.assign(next.href);
    });
  }
  document.querySelectorAll("[data-localized-link]").forEach(function (link) {
    var next = new URL(link.getAttribute("href"), location.href);
    next.searchParams.set("lang", lang);
    link.href = next.href;
  });
})();
