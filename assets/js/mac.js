// The trackpad demo on the Mac page. The page reads complete without it.
(function () {
  "use strict";
  // A pointer on a Mac-sized screen, driven by the real trackpad picture.
  var pad = document.getElementById("pad");
  var screen = document.getElementById("mac-screen");
  var pointer = document.getElementById("mac-pointer");
  if (!pad || !screen || !pointer) return;
  var x = 0.5, y = 0.5, last = null, start = null;
  screen.classList.add("live");
  function draw() {
    pointer.style.transform = "translate(" + x * screen.clientWidth + "px," + y * screen.clientHeight + "px)";
  }
  function move(dx, dy) {
    // Faster strokes travel further, like pointer acceleration on a Mac.
    var gain = 0.9 + Math.min(Math.hypot(dx, dy) / 16, 1.1);
    x = Math.max(0, Math.min(1, x + dx * gain / pad.clientWidth));
    y = Math.max(0, Math.min(1, y + dy * gain / pad.clientHeight));
    draw();
  }
  function click() {
    var ring = document.createElement("span");
    ring.className = "ripple";
    ring.style.transform = pointer.style.transform;
    ring.addEventListener("animationend", function () { ring.remove(); });
    screen.appendChild(ring);
  }
  pad.addEventListener("pointerdown", function (event) {
    pad.setPointerCapture(event.pointerId);
    last = { x: event.clientX, y: event.clientY };
    start = { time: event.timeStamp, travel: 0 };
  });
  pad.addEventListener("pointermove", function (event) {
    if (!last) return;
    var dx = event.clientX - last.x, dy = event.clientY - last.y;
    last = { x: event.clientX, y: event.clientY };
    start.travel += Math.abs(dx) + Math.abs(dy);
    move(dx, dy);
  });
  pad.addEventListener("pointerup", function (event) {
    if (start && start.travel < 8 && event.timeStamp - start.time < 300) click();
    last = start = null;
  });
  pad.addEventListener("pointercancel", function () { last = start = null; });
  pad.addEventListener("keydown", function (event) {
    var step = 12;
    var keys = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (keys[event.key]) move(keys[event.key][0], keys[event.key][1]);
    else if (event.key === "Enter" || event.key === " ") click();
    else return;
    event.preventDefault();
  });
  addEventListener("resize", draw);
  draw();
})();
