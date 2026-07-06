const totalSteps = 5;
const storageKey = "shikong-birthday-progress";
const messages = [
  "第一份礼物正在等你。",
  "头像祝福已点亮。",
  "专属生日主角出现啦。",
  "四个闪光瞬间已经解锁。",
  "生日愿望卡已经送达。",
  "全部礼物都打开了。"
];

const giftButton = document.querySelector(".gift-button");
const giftButtonText = document.querySelector(".gift-button-text");
const currentMessage = document.querySelector(".current-message");
const progressFill = document.querySelector(".progress-fill");
const progressCount = document.querySelector(".progress-count");
const particleLayer = document.querySelector(".particle-layer");
const unlockItems = document.querySelectorAll("[data-step]");
const restartButton = document.querySelector(".restart-button");

let progress = readProgress();

function readProgress() {
  const stored = Number.parseInt(window.localStorage.getItem(storageKey) || "0", 10);
  if (Number.isNaN(stored)) return 0;
  return Math.min(Math.max(stored, 0), totalSteps);
}

function writeProgress(value) {
  progress = Math.min(Math.max(value, 0), totalSteps);
  window.localStorage.setItem(storageKey, String(progress));
  renderProgress();
}

function renderProgress() {
  const percent = `${(progress / totalSteps) * 100}%`;
  document.documentElement.style.setProperty("--progress", percent);
  if (progressFill) progressFill.style.width = percent;
  if (progressCount) progressCount.textContent = `${progress} / ${totalSteps}`;
  if (currentMessage) currentMessage.textContent = messages[progress];

  unlockItems.forEach((item) => {
    const step = Number.parseInt(item.dataset.step || "0", 10);
    item.classList.toggle("is-unlocked", step <= progress);
  });

  if (giftButtonText) {
    giftButtonText.textContent = progress >= totalSteps ? "礼物已全部打开" : `拆开第 ${progress + 1} 份礼物`;
  }
  if (giftButton) {
    giftButton.setAttribute("aria-label", progress >= totalSteps ? "礼物已全部打开" : `拆开第 ${progress + 1} 份礼物`);
  }
}

function createConfetti(x, y, intense = false) {
  if (!particleLayer) return;

  const palette = ["#6fa8dc", "#3475b5", "#f0b83f", "#ffe0a2", "#ffffff"];
  const piece = document.createElement("span");
  const size = Math.round((intense ? 8 : 6) + Math.random() * (intense ? 14 : 10));
  const moveX = Math.round((Math.random() - 0.5) * (intense ? 420 : 260));
  const moveY = Math.round(-130 - Math.random() * (intense ? 340 : 220));
  const duration = Math.round(900 + Math.random() * (intense ? 1050 : 700));
  const spin = `${Math.round((Math.random() - 0.5) * 720)}deg`;

  piece.className = `confetti${Math.random() > 0.78 ? " is-star" : ""}`;
  piece.style.setProperty("--start-x", `${x}px`);
  piece.style.setProperty("--start-y", `${y}px`);
  piece.style.setProperty("--move-x", `${moveX}px`);
  piece.style.setProperty("--move-y", `${moveY}px`);
  piece.style.setProperty("--size", `${size}px`);
  piece.style.setProperty("--duration", `${duration}ms`);
  piece.style.setProperty("--spin", spin);
  piece.style.setProperty("--color", palette[Math.floor(Math.random() * palette.length)]);

  particleLayer.appendChild(piece);
  window.setTimeout(() => piece.remove(), duration + 120);
}

function burstFrom(element, count = 42, intense = false) {
  const rect = element.getBoundingClientRect();
  const baseX = rect.left + rect.width / 2;
  const baseY = rect.top + rect.height * 0.42;

  for (let i = 0; i < count; i += 1) {
    window.setTimeout(() => {
      createConfetti(
        baseX + (Math.random() - 0.5) * rect.width * 0.7,
        baseY + (Math.random() - 0.5) * rect.height * 0.25,
        intense
      );
    }, i * 13);
  }
}

function scrollToUnlockedStep(step) {
  const selector = step === totalSteps ? ".finale" : `[data-step="${step}"]`;
  const target = document.querySelector(selector);
  if (!target) return;

  window.setTimeout(() => {
    target.scrollIntoView({ behavior: "smooth", block: "center" });
  }, 360);
}

function openGift() {
  if (!giftButton) return;

  const nextStep = progress >= totalSteps ? totalSteps : progress + 1;
  giftButton.classList.remove("is-opening");
  void giftButton.offsetWidth;
  giftButton.classList.add("is-opening");
  burstFrom(giftButton, nextStep === totalSteps ? 88 : 48, nextStep === totalSteps);

  window.setTimeout(() => {
    giftButton.classList.remove("is-opening");
  }, 820);

  if (progress < totalSteps) {
    writeProgress(nextStep);
    scrollToUnlockedStep(nextStep);
  } else {
    scrollToUnlockedStep(totalSteps);
  }
}

function restartExperience() {
  writeProgress(0);
  window.scrollTo({ top: 0, behavior: "smooth" });
  if (giftButton) burstFrom(giftButton, 36, false);
}

if (giftButton) {
  giftButton.addEventListener("click", openGift);
}

if (restartButton) {
  restartButton.addEventListener("click", restartExperience);
}

window.addEventListener("load", () => {
  renderProgress();
  if (giftButton) {
    window.setTimeout(() => burstFrom(giftButton, 20, false), 360);
  }
});
