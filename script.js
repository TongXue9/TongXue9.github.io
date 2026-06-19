const revealItems = document.querySelectorAll("[data-reveal]");

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);

revealItems.forEach((item) => revealObserver.observe(item));

const canvas = document.querySelector("#signal-canvas");
const context = canvas.getContext("2d");
let width = 0;
let height = 0;
let phase = 0;

function resizeCanvas() {
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * pixelRatio);
  canvas.height = Math.floor(height * pixelRatio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
}

function drawSignal() {
  context.clearRect(0, 0, width, height);
  context.lineWidth = 1.2;

  for (let lane = 0; lane < 4; lane += 1) {
    const yBase = height * (0.18 + lane * 0.19);
    const amplitude = 18 + lane * 4;
    const hue = lane % 2 === 0 ? "84, 230, 211" : "242, 168, 75";

    context.beginPath();
    for (let x = -20; x <= width + 20; x += 8) {
      const y =
        yBase +
        Math.sin(x * 0.012 + phase + lane * 1.7) * amplitude +
        Math.sin(x * 0.034 + phase * 0.7) * 5;

      if (x === -20) {
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }
    }
    context.strokeStyle = `rgba(${hue}, ${0.09 + lane * 0.018})`;
    context.shadowBlur = 18;
    context.shadowColor = `rgba(${hue}, 0.24)`;
    context.stroke();
  }

  context.shadowBlur = 0;
  phase += 0.006;
  window.requestAnimationFrame(drawSignal);
}

resizeCanvas();
drawSignal();
window.addEventListener("resize", resizeCanvas);
