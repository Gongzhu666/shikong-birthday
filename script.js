const scenes = [...document.querySelectorAll(".scene")];
const dots = [...document.querySelectorAll(".dot")];
const nextButtons = [...document.querySelectorAll(".primary-action")];
const restartButton = document.querySelector(".restart-action");
const musicToggle = document.querySelector(".music-toggle");
const particleLayer = document.querySelector(".particle-layer");
const transitionFlash = document.querySelector(".transition-flash");

let currentScene = 0;
let isTransitioning = false;
let audioContext = null;
let masterGain = null;
let musicTimer = null;
let musicStarted = false;
let musicEnabled = false;

const confettiColors = ["#70a9dc", "#3172b2", "#efb63e", "#ffe3a6", "#ffffff"];
const melody = [
  ["G4", 0.28], ["G4", 0.28], ["A4", 0.56], ["G4", 0.56], ["C5", 0.56], ["B4", 1.06],
  ["G4", 0.28], ["G4", 0.28], ["A4", 0.56], ["G4", 0.56], ["D5", 0.56], ["C5", 1.06],
  ["G4", 0.28], ["G4", 0.28], ["G5", 0.56], ["E5", 0.56], ["C5", 0.56], ["B4", 0.56], ["A4", 1.06],
  ["F5", 0.28], ["F5", 0.28], ["E5", 0.56], ["C5", 0.56], ["D5", 0.56], ["C5", 1.22]
];

const noteMap = {
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  G4: 392,
  A4: 440,
  B4: 493.88,
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  F5: 698.46,
  G5: 783.99
};

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

function setupAudio() {
  if (audioContext) return;

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    if (musicToggle) {
      musicToggle.textContent = "×";
      musicToggle.setAttribute("aria-label", "当前浏览器不支持背景音乐");
    }
    return;
  }

  audioContext = new AudioContextClass();
  masterGain = audioContext.createGain();
  masterGain.gain.value = 0.16;
  masterGain.connect(audioContext.destination);
}

function playTone(note, startTime, duration) {
  if (!audioContext || !masterGain) return;

  const frequency = noteMap[note];
  if (!frequency) return;

  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const shimmer = audioContext.createOscillator();
  const shimmerGain = audioContext.createGain();

  osc.type = "sine";
  osc.frequency.value = frequency;
  shimmer.type = "triangle";
  shimmer.frequency.value = frequency * 2;

  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(0.32, startTime + 0.025);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + Math.max(0.08, duration * 0.82));

  shimmerGain.gain.setValueAtTime(0.0001, startTime);
  shimmerGain.gain.exponentialRampToValueAtTime(0.06, startTime + 0.018);
  shimmerGain.gain.exponentialRampToValueAtTime(0.0001, startTime + Math.max(0.08, duration * 0.58));

  osc.connect(gain);
  gain.connect(masterGain);
  shimmer.connect(shimmerGain);
  shimmerGain.connect(masterGain);

  osc.start(startTime);
  shimmer.start(startTime);
  osc.stop(startTime + duration);
  shimmer.stop(startTime + duration);
}

function scheduleMelody() {
  if (!audioContext || !musicEnabled) return;

  let cursor = audioContext.currentTime + 0.06;
  melody.forEach(([note, duration]) => {
    playTone(note, cursor, duration);
    cursor += duration;
  });
  musicTimer = window.setTimeout(scheduleMelody, Math.max(1000, (cursor - audioContext.currentTime - 0.12) * 1000));
}

async function startMusic() {
  setupAudio();
  if (!audioContext) return;

  if (audioContext.state === "suspended") {
    await audioContext.resume();
  }

  if (musicEnabled) return;
  musicEnabled = true;
  musicStarted = true;
  if (masterGain) {
    masterGain.gain.cancelScheduledValues(audioContext.currentTime);
    masterGain.gain.setTargetAtTime(0.16, audioContext.currentTime, 0.04);
  }
  if (musicToggle) {
    musicToggle.classList.add("is-playing");
    musicToggle.textContent = "♫";
    musicToggle.setAttribute("aria-label", "暂停背景音乐");
  }
  scheduleMelody();
}

async function toggleMusic() {
  setupAudio();
  if (!audioContext) return;

  if (!musicEnabled) {
    await startMusic();
    return;
  }

  musicEnabled = false;
  if (musicTimer) {
    window.clearTimeout(musicTimer);
    musicTimer = null;
  }
  if (masterGain) {
    masterGain.gain.cancelScheduledValues(audioContext.currentTime);
    masterGain.gain.setTargetAtTime(0.0001, audioContext.currentTime, 0.04);
  }
  if (musicToggle) {
    musicToggle.classList.remove("is-playing");
    musicToggle.textContent = "♪";
    musicToggle.setAttribute("aria-label", "开启背景音乐");
  }
}

nextButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (!musicStarted) {
      startMusic().catch(() => {
        if (musicToggle) {
          musicToggle.textContent = "♪";
          musicToggle.setAttribute("aria-label", "开启背景音乐");
        }
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
  musicToggle.addEventListener("click", toggleMusic);
}

window.addEventListener("resize", updateViewportHeight);
window.addEventListener("orientationchange", () => {
  window.setTimeout(updateViewportHeight, 250);
});

window.addEventListener("load", () => {
  updateViewportHeight();
  updateScenes();
  const activeAction = scenes[0]?.querySelector(".primary-action");
  if (activeAction) {
    window.setTimeout(() => burstFrom(activeAction, 22, false), 420);
  }
});
