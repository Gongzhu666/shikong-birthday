const scenes = [...document.querySelectorAll(".scene")];
const dots = [...document.querySelectorAll(".dot")];
const nextButtons = [...document.querySelectorAll(".primary-action")];
const restartButton = document.querySelector(".restart-action");
const musicToggle = document.querySelector(".music-toggle");
const particleLayer = document.querySelector(".particle-layer");
const transitionFlash = document.querySelector(".transition-flash");
const photoButtons = [...document.querySelectorAll(".memory-photo")];
const lightbox = document.querySelector(".photo-lightbox");
const lightboxImage = document.querySelector(".lightbox-image");
const lightboxCloseButtons = document.querySelectorAll(".lightbox-close, .lightbox-backdrop");

const birthdayAudio = document.createElement("audio");
birthdayAudio.src = "生日快乐.mp3";
birthdayAudio.loop = true;
birthdayAudio.preload = "auto";
birthdayAudio.volume = 0.58;
birthdayAudio.className = "birthday-audio";
birthdayAudio.setAttribute("playsinline", "");
birthdayAudio.setAttribute("aria-hidden", "true");
birthdayAudio.style.display = "none";
document.body.appendChild(birthdayAudio);
window.birthdayAudio = birthdayAudio;
window.birthdayAudioState = { lastError: "" };

let currentScene = 0;
let isTransitioning = false;
let musicStarted = false;
let musicEnabled = false;

const confettiColors = ["#70a9dc", "#3172b2", "#efb63e", "#ffe3a6", "#ffffff"];

function updateViewportHeight() {
  document.documentElement.style.setProperty("--vh", `${window.innerHeight}px`);
}

function updateScenes() {
  scenes.forEach((scene, index) => {
    scene.classList.toggle("is-active", index === currentScene);
    scene.classList.toggle("is-before", index < currentScene);
  });
  dots.forEach((dot, index) => {
    dot.classList.toggle("is-active", index === currentScene);
  });
}

function createConfetti(x, y, intense = false) {
  if (!particleLayer) return;

  const piece = document.createElement("span");
  const size = Math.round((intense ? 8 : 6) + Math.random() * (intense ? 14 : 10));
  const moveX = Math.round((Math.random() - 0.5) * (intense ? 420 : 260));
  const moveY = Math.round(-120 - Math.random() * (intense ? 340 : 220));
  const duration = Math.round(900 + Math.random() * (intense ? 1050 : 700));
  const spin = `${Math.round((Math.random() - 0.5) * 720)}deg`;

  piece.className = `confetti${Math.random() > 0.76 ? " is-star" : ""}`;
  piece.style.setProperty("--start-x", `${x}px`);
  piece.style.setProperty("--start-y", `${y}px`);
  piece.style.setProperty("--move-x", `${moveX}px`);
  piece.style.setProperty("--move-y", `${moveY}px`);
  piece.style.setProperty("--size", `${size}px`);
  piece.style.setProperty("--duration", `${duration}ms`);
  piece.style.setProperty("--spin", spin);
  piece.style.setProperty("--color", confettiColors[Math.floor(Math.random() * confettiColors.length)]);

  particleLayer.appendChild(piece);
  window.setTimeout(() => piece.remove(), duration + 120);
}

function burstFrom(element, count = 44, intense = false) {
  const rect = element.getBoundingClientRect();
  const baseX = rect.left + rect.width / 2;
  const baseY = rect.top + rect.height * 0.45;

  for (let i = 0; i < count; i += 1) {
    window.setTimeout(() => {
      createConfetti(
        baseX + (Math.random() - 0.5) * rect.width * 0.8,
        baseY + (Math.random() - 0.5) * rect.height * 0.35,
        intense
      );
    }, i * 13);
  }
}

function flashTransition() {
  if (!transitionFlash) return;
  transitionFlash.classList.remove("is-flashing");
  void transitionFlash.offsetWidth;
  transitionFlash.classList.add("is-flashing");
}

function goToScene(nextScene, sourceElement) {
  if (isTransitioning) return;

  const clamped = Math.min(Math.max(nextScene, 0), scenes.length - 1);
  if (clamped === currentScene) return;

  isTransitioning = true;
  if (sourceElement) burstFrom(sourceElement, clamped === scenes.length - 1 ? 90 : 48, clamped === scenes.length - 1);
  flashTransition();

  window.setTimeout(() => {
    currentScene = clamped;
    updateScenes();
  }, 150);

  window.setTimeout(() => {
    isTransitioning = false;
  }, 820);
}

function openLightbox(button) {
  if (!lightbox || !lightboxImage) return;

  const src = button.dataset.previewSrc;
  const alt = button.dataset.previewAlt || button.querySelector("img")?.alt || "照片预览";
  if (!src) return;

  lightboxImage.src = src;
  lightboxImage.alt = alt;
  lightbox.classList.add("is-open");
  lightbox.setAttribute("aria-hidden", "false");
}

function closeLightbox() {
  if (!lightbox || !lightboxImage) return;

  lightbox.classList.remove("is-open");
  lightbox.setAttribute("aria-hidden", "true");
  window.setTimeout(() => {
    if (!lightbox.classList.contains("is-open")) {
      lightboxImage.removeAttribute("src");
      lightboxImage.alt = "";
    }
  }, 240);
}

function setMusicButton(isPlaying) {
  if (!musicToggle) return;

  musicToggle.classList.toggle("is-playing", isPlaying);
  musicToggle.textContent = isPlaying ? "♫" : "♪";
  musicToggle.setAttribute("aria-label", isPlaying ? "暂停背景音乐" : "开启背景音乐");
}

async function startMusic() {
  if (musicEnabled) return;

  if (!musicStarted) {
    birthdayAudio.currentTime = 0;
  }

  birthdayAudio.dataset.playAttempted = "true";
  musicStarted = true;
  musicEnabled = true;
  setMusicButton(true);

  try {
    await birthdayAudio.play();
    birthdayAudio.dataset.lastError = "";
    window.birthdayAudioState.lastError = "";
  } catch (error) {
    const message = error?.message || String(error);
    birthdayAudio.dataset.lastError = message;
    window.birthdayAudioState.lastError = message;
    musicEnabled = false;
    musicStarted = false;
    setMusicButton(false);
    throw error;
  }
}

async function toggleMusic() {
  if (!musicEnabled) {
    await startMusic();
    return;
  }

  birthdayAudio.pause();
  musicEnabled = false;
  setMusicButton(false);
}

nextButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (!musicStarted) {
      startMusic().catch(() => {
        musicStarted = false;
        musicEnabled = false;
        setMusicButton(false);
      });
    }
    goToScene(currentScene + 1, button);
  });
});

if (restartButton) {
  restartButton.addEventListener("click", () => {
    goToScene(0, restartButton);
  });
}

if (musicToggle) {
  musicToggle.addEventListener("click", () => {
    toggleMusic().catch(() => setMusicButton(false));
  });
}

birthdayAudio.addEventListener("pause", () => {
  if (birthdayAudio.ended) return;
  musicEnabled = false;
  setMusicButton(false);
});

birthdayAudio.addEventListener("play", () => {
  musicStarted = true;
  musicEnabled = true;
  setMusicButton(true);
});

photoButtons.forEach((button) => {
  button.addEventListener("click", () => openLightbox(button));
});

lightboxCloseButtons.forEach((button) => {
  button.addEventListener("click", closeLightbox);
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && lightbox?.classList.contains("is-open")) {
    closeLightbox();
  }
});

window.addEventListener("resize", updateViewportHeight);
window.addEventListener("orientationchange", () => {
  window.setTimeout(updateViewportHeight, 250);
});

window.addEventListener("load", () => {
  updateViewportHeight();
  updateScenes();
  setMusicButton(false);
  const activeAction = scenes[0]?.querySelector(".primary-action");
  if (activeAction) {
    window.setTimeout(() => burstFrom(activeAction, 22, false), 420);
  }
});
