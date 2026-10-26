const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(pointer: fine)").matches;

/* nav: scroll state, progress, active link, mobile toggle */
const nav = document.querySelector(".nav");
const bar = document.querySelector(".progress span");
const toggle = document.querySelector(".nav-toggle");
const links = document.querySelector(".nav-links");

function onScroll() {
  const max = document.documentElement.scrollHeight - innerHeight;
  bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
  nav.classList.toggle("scrolled", scrollY > 30);
}
addEventListener("scroll", onScroll, { passive: true });
onScroll();

toggle.addEventListener("click", () => {
  const open = links.classList.toggle("open");
  toggle.setAttribute("aria-expanded", String(open));
});
links.addEventListener("click", (e) => {
  if (e.target.tagName === "A") {
    links.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  }
});

const navMap = new Map(
  [...links.querySelectorAll('a[href^="#"]')].map((a) => [a.getAttribute("href").slice(1), a])
);
const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      const link = navMap.get(entry.target.id);
      if (link && entry.isIntersecting) {
        navMap.forEach((a) => a.classList.remove("active"));
        link.classList.add("active");
      }
    });
  },
  { rootMargin: "-45% 0px -50% 0px" }
);
navMap.forEach((_, id) => {
  const el = document.getElementById(id);
  if (el) sectionObserver.observe(el);
});

/* reveal + counters */
function countUp(el) {
  const target = Number(el.dataset.count);
  const prefix = el.dataset.prefix || "";
  const suffix = el.dataset.suffix || "";
  if (reduceMotion) {
    el.textContent = prefix + target + suffix;
    return;
  }
  const start = performance.now();
  const dur = 1400;
  (function tick(now) {
    const t = Math.min(1, (now - start) / dur);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = prefix + Math.round(target * eased) + suffix;
    if (t < 1) requestAnimationFrame(tick);
  })(start);
}

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("in");
      entry.target.querySelectorAll("[data-count]").forEach(countUp);
      revealObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
);
document.querySelectorAll(".reveal").forEach((el, i) => {
  el.style.transitionDelay = `${(i % 4) * 70}ms`;
  revealObserver.observe(el);
});

/* role rotator */
const rotator = document.querySelector(".role-rotator");
const roles = JSON.parse(rotator.dataset.roles);
if (!reduceMotion) {
  let r = 0;
  const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
  (async function loop() {
    await sleep(2600);
    for (;;) {
      const current = roles[r];
      for (let k = current.length; k >= 0; k--) {
        rotator.textContent = current.slice(0, k);
        await sleep(18);
      }
      r = (r + 1) % roles.length;
      const next = roles[r];
      for (let k = 1; k <= next.length; k++) {
        rotator.textContent = next.slice(0, k);
        await sleep(40);
      }
      await sleep(2400);
    }
  })();
}

/* hero oscilloscope background */
const hero = document.querySelector(".hero");
const scope = document.getElementById("scope");
const sctx = scope.getContext("2d");
let W = 0;
let H = 0;
let phase = 0;
let heroVisible = true;

function sizeScope() {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  W = hero.clientWidth;
  H = hero.clientHeight;
  scope.width = W * dpr;
  scope.height = H * dpr;
  sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

const traces = [
  { color: "62,230,196", y: 0.28, amp: 26, f: 0.011, speed: 1, kind: "sine" },
  { color: "245,165,36", y: 0.55, amp: 20, f: 0.006, speed: 0.6, kind: "pwm" },
  { color: "110,168,255", y: 0.8, amp: 14, f: 0.018, speed: 1.4, kind: "am" },
];

function traceY(t, x) {
  const p = phase * t.speed;
  if (t.kind === "pwm") {
    const s = Math.sin(x * t.f + p);
    const square = s > -0.5 ? 1 : -1;
    return square * t.amp + Math.sin(x * 0.4 + p * 8) * 1.2;
  }
  if (t.kind === "am") {
    return Math.sin(x * t.f * 3 + p * 3) * t.amp * (0.6 + 0.4 * Math.sin(x * 0.004 + p));
  }
  return Math.sin(x * t.f + p) * t.amp + Math.sin(x * t.f * 3.1 + p * 1.7) * t.amp * 0.18;
}

function drawScope() {
  sctx.clearRect(0, 0, W, H);

  const div = 80;
  sctx.lineWidth = 1;
  sctx.strokeStyle = "rgba(255,255,255,0.035)";
  sctx.beginPath();
  for (let x = (W / 2) % div; x < W; x += div) {
    sctx.moveTo(x + 0.5, 0);
    sctx.lineTo(x + 0.5, H);
  }
  for (let y = (H / 2) % div; y < H; y += div) {
    sctx.moveTo(0, y + 0.5);
    sctx.lineTo(W, y + 0.5);
  }
  sctx.stroke();

  traces.forEach((t) => {
    const base = H * t.y;
    sctx.beginPath();
    for (let x = 0; x <= W; x += 3) {
      const y = base + traceY(t, x);
      x === 0 ? sctx.moveTo(x, y) : sctx.lineTo(x, y);
    }
    sctx.strokeStyle = `rgba(${t.color},0.16)`;
    sctx.lineWidth = 1.4;
    sctx.shadowBlur = 14;
    sctx.shadowColor = `rgba(${t.color},0.5)`;
    sctx.stroke();
  });
  sctx.shadowBlur = 0;

}

function loopScope() {
  if (heroVisible) {
    phase += 0.012;
    drawScope();
  }
  requestAnimationFrame(loopScope);
}

sizeScope();
addEventListener("resize", sizeScope);
if (reduceMotion) {
  drawScope();
} else {
  new IntersectionObserver(([e]) => (heroVisible = e.isIntersecting)).observe(hero);
  loopScope();
}

/* chip tilt */
const pkg = document.querySelector(".tilt");
if (finePointer && !reduceMotion) {
  hero.addEventListener("mousemove", (e) => {
    const r = pkg.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width / 2)) / innerWidth;
    const dy = (e.clientY - (r.top + r.height / 2)) / innerHeight;
    pkg.style.transform = `rotateY(${dx * 14}deg) rotateX(${-dy * 14}deg)`;
  });
  hero.addEventListener("mouseleave", () => (pkg.style.transform = ""));
}

/* magnetic buttons + card spotlight */
if (finePointer && !reduceMotion) {
  document.querySelectorAll(".magnetic").forEach((el) => {
    el.addEventListener("mousemove", (e) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      el.style.transform = `translate(${x * 0.18}px, ${y * 0.25}px)`;
    });
    el.addEventListener("mouseleave", () => (el.style.transform = ""));
  });

  document.querySelectorAll(".glow-card").forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    });
  });
}

/* copy email */
const emailBtn = document.querySelector(".email-btn");
const hint = emailBtn.querySelector(".email-hint");
emailBtn.addEventListener("click", async () => {
  const email = emailBtn.dataset.email;
  try {
    await navigator.clipboard.writeText(email);
    hint.textContent = "copied ✓";
  } catch {
    location.href = `mailto:${email}`;
  }
  setTimeout(() => (hint.textContent = "click to copy"), 1800);
});

/* EMC fault-hunt oscilloscope */
const emcCanvas = document.getElementById("emc-scope");
const ectx = emcCanvas.getContext("2d");
const statusEl = document.querySelector(".scope-status");
const statusLabel = statusEl.querySelector(".state-label");
let emcState = "fault";
let emcPhase = 0;
let emcVisible = false;
let EW = 0;
let EH = 0;

function sizeEmc() {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  EW = emcCanvas.clientWidth;
  EH = emcCanvas.clientHeight;
  emcCanvas.width = EW * dpr;
  emcCanvas.height = EH * dpr;
  ectx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function drawEmc() {
  ectx.clearRect(0, 0, EW, EH);
  const cols = 10;
  const rows = 8;
  ectx.strokeStyle = "rgba(62,230,196,0.09)";
  ectx.lineWidth = 1;
  ectx.beginPath();
  for (let i = 1; i < cols; i++) {
    const x = Math.round((EW / cols) * i) + 0.5;
    ectx.moveTo(x, 0);
    ectx.lineTo(x, EH);
  }
  for (let j = 1; j < rows; j++) {
    const y = Math.round((EH / rows) * j) + 0.5;
    ectx.moveTo(0, y);
    ectx.lineTo(EW, y);
  }
  ectx.stroke();

  const lane = EH / 3;
  const period = EW / 5;
  const fault = emcState === "fault";

  // CH1: OUT7 PWM with injected RF riding on top
  drawTrace("255,216,74", (x) => {
    const high = ((x + emcPhase * 40) % period) / period < 0.8;
    const level = high ? -lane * 0.28 : lane * 0.18;
    const rf = Math.sin(x * 0.9 + emcPhase * 9) * lane * 0.05;
    return lane * 0.55 + level + rf;
  });

  // CH2: FAULT GPIO, high when healthy
  drawTrace("74,216,255", (x) => {
    const n = Math.sin(x * 1.3 + emcPhase * 5) * 0.8;
    if (!fault) return lane * 1.35 + n;
    const dropAt = EW * 0.32;
    return (x < dropAt ? lane * 1.35 : lane * 1.75) + n;
  });

  // CH3: gate driver, 80% duty PWM when healthy, stuck at 12 V on fault
  drawTrace("255,106,213", (x) => {
    const n = Math.sin(x * 1.1 + emcPhase * 7) * 0.8;
    if (fault) return lane * 2.25 + n;
    const high = ((x + emcPhase * 40) % period) / period < 0.8;
    return (high ? lane * 2.25 : lane * 2.75) + n;
  });

  ectx.fillStyle = "rgba(233,238,246,0.45)";
  ectx.font = "10px JetBrains Mono, monospace";
  ectx.fillText("1", 6, lane * 0.55 - lane * 0.28 - 6);
  ectx.fillText("2", 6, lane * 1.35 - 6);
  ectx.fillText("3", 6, lane * 2.25 - 6);
}

function drawTrace(rgb, fn) {
  ectx.beginPath();
  for (let x = 0; x <= EW; x += 1) {
    const y = fn(x);
    x === 0 ? ectx.moveTo(x, y) : ectx.lineTo(x, y);
  }
  ectx.strokeStyle = `rgb(${rgb})`;
  ectx.lineWidth = 1.6;
  ectx.shadowBlur = 8;
  ectx.shadowColor = `rgba(${rgb},0.8)`;
  ectx.stroke();
  ectx.shadowBlur = 0;
}

function loopEmc() {
  if (emcVisible) {
    emcPhase += 0.02;
    drawEmc();
  }
  requestAnimationFrame(loopEmc);
}

sizeEmc();
addEventListener("resize", () => {
  sizeEmc();
  drawEmc();
});
drawEmc();
if (!reduceMotion) {
  new IntersectionObserver(([e]) => (emcVisible = e.isIntersecting)).observe(emcCanvas);
  loopEmc();
}

document.querySelectorAll(".toggle button").forEach((btn) => {
  btn.addEventListener("click", () => {
    emcState = btn.dataset.state;
    document.querySelectorAll(".toggle button").forEach((b) => b.setAttribute("aria-selected", String(b === btn)));
    const ok = emcState === "fixed";
    statusEl.classList.toggle("ok", ok);
    statusLabel.textContent = ok ? "PASS · GD switching normally" : "FAULT · GD stuck high";
    drawEmc();
  });
});
