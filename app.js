const BEST_RUN_KEY = "govagent-panic-arcade-best";
const RUN_DAYS = 5;
const WAVE_DURATION = 30;
const BOSS_TRIGGER_TIME = 18;
const AUTOPLAY_QUERY = new URLSearchParams(window.location.search).get("autoplay") === "1";

const MODE_CONFIG = {
  platform: {
    key: "1",
    label: "Platform",
    short: "PLATFORM",
    color: "#3fc8be",
    glow: "rgba(63, 200, 190, 0.35)",
    description: "Compute, data, queue floods, and outages.",
  },
  guardrails: {
    key: "2",
    label: "Guardrails",
    short: "GUARDRAILS",
    color: "#f0bc57",
    glow: "rgba(240, 188, 87, 0.35)",
    description: "Security, audit, prompt abuse, and credentials.",
  },
  comms: {
    key: "3",
    label: "Stakeholders",
    short: "STAKEHOLDERS",
    color: "#45d07b",
    glow: "rgba(69, 208, 123, 0.35)",
    description: "Political heat, demos, trust, and optics.",
  },
};

const MODE_LIST = ["platform", "guardrails", "comms"];
const LOW_IS_BAD = new Set(["latency", "burn", "politics"]);

const METRIC_CONFIG = [
  { key: "latency", label: "Latency", formatter: (value) => `${Math.round(value)} ms`, min: 160, max: 1000, start: 260 },
  { key: "burn", label: "Burn", formatter: (value) => `$${Math.round(value)}k`, min: 10, max: 100, start: 24 },
  { key: "security", label: "Security", formatter: (value) => `${Math.round(value)}/100`, min: 0, max: 100, start: 84 },
  { key: "politics", label: "Politics", formatter: (value) => `${Math.round(value)}/100`, min: 0, max: 100, start: 12 },
  { key: "trust", label: "Trust", formatter: (value) => `${Math.round(value)}/100`, min: 0, max: 100, start: 82 },
  { key: "morale", label: "Morale", formatter: (value) => `${Math.round(value)}/100`, min: 0, max: 100, start: 76 },
];

const CHARACTER_ROSTER = {
  pm: {
    name: "Mabel Tan",
    role: "Overconfident PM",
    avatar: "./assets/avatars/mabel.svg",
  },
  security: {
    name: "R. K. Pillai",
    role: "Security officer",
    avatar: "./assets/avatars/pillai.svg",
  },
  researcher: {
    name: "Dr. Inez Park",
    role: "Model researcher",
    avatar: "./assets/avatars/inez.svg",
  },
  serverless: {
    name: "Darren Khoo",
    role: "Just use serverless guy",
    avatar: "./assets/avatars/darren.svg",
  },
  ally: {
    name: "Asha Menon",
    role: "Legendary docs reader",
    avatar: "./assets/avatars/asha.svg",
  },
};

const ENEMY_LIBRARY = {
  gpu: {
    id: "gpu",
    label: "GPU Meltdown",
    weakMode: "platform",
    secondaryMode: "guardrails",
    score: 120,
    radius: 20,
    hp: 44,
    speed: 84,
    pattern: "curve",
    color: "#ee8a40",
    accent: "#3fc8be",
    short: "GPU",
    pressure: { latency: 1.9, burn: 0.9, morale: -0.05 },
    leak: { latency: 14, burn: 8, morale: -3 },
    chatterCharacter: "serverless",
    chatterCopy: "One node died and the queue is now visible from orbit.",
  },
  csv: {
    id: "csv",
    label: "Forty Million Rows",
    weakMode: "platform",
    secondaryMode: "comms",
    score: 110,
    radius: 19,
    hp: 40,
    speed: 74,
    pattern: "line",
    color: "#f0bc57",
    accent: "#3fc8be",
    short: "CSV",
    pressure: { latency: 1.6, burn: 0.8, trust: -0.04 },
    leak: { latency: 12, burn: 7, trust: -4 },
    chatterCharacter: "serverless",
    chatterCopy: "Someone uploaded a CSV the size of a constitutional crisis.",
  },
  audit: {
    id: "audit",
    label: "Surprise Audit",
    weakMode: "guardrails",
    secondaryMode: "comms",
    score: 118,
    radius: 21,
    hp: 48,
    speed: 72,
    pattern: "pulse",
    color: "#f0bc57",
    accent: "#f1665d",
    short: "AUD",
    pressure: { security: -1.0, politics: 0.55, morale: -0.04 },
    leak: { security: -16, politics: 11, morale: -4 },
    chatterCharacter: "security",
    chatterCopy: "Audit is downstairs and the TODO comment is still in prod.",
  },
  prompt: {
    id: "prompt",
    label: "Prompt Injection",
    weakMode: "guardrails",
    secondaryMode: "platform",
    score: 116,
    radius: 18,
    hp: 36,
    speed: 98,
    pattern: "zigzag",
    color: "#f1665d",
    accent: "#f0bc57",
    short: "INJ",
    pressure: { security: -1.15, trust: -0.5, politics: 0.28 },
    leak: { security: -15, trust: -10, politics: 7 },
    chatterCharacter: "security",
    chatterCopy: "The intern found prompt injection and posted it in chat.",
  },
  minister: {
    id: "minister",
    label: "Minister Visit",
    weakMode: "comms",
    secondaryMode: "guardrails",
    score: 122,
    radius: 20,
    hp: 42,
    speed: 86,
    pattern: "curve",
    color: "#45d07b",
    accent: "#f1665d",
    short: "VIP",
    pressure: { politics: 1.25, trust: -0.6, morale: -0.03 },
    leak: { politics: 15, trust: -8, morale: -4 },
    chatterCharacter: "pm",
    chatterCopy: "The minister is walking toward the dashboard right now.",
  },
  procurement: {
    id: "procurement",
    label: "Sentient Procurement",
    weakMode: "comms",
    secondaryMode: "guardrails",
    score: 126,
    radius: 22,
    hp: 52,
    speed: 78,
    pattern: "spiral",
    color: "#3fc8be",
    accent: "#45d07b",
    short: "RFP",
    pressure: { politics: 0.95, trust: -0.8, burn: 0.45 },
    leak: { politics: 13, trust: -12, burn: 5 },
    chatterCharacter: "researcher",
    chatterCopy: "The summarizer has opinions about procurement now.",
  },
};

const ENEMY_LIST = Object.values(ENEMY_LIBRARY);

const BOSS_LIBRARY = {
  1: {
    title: "The 40M CSV",
    copy: "A monstrous bulk import is marching straight into inference. Burn it down before lunch traffic arrives.",
    tags: ["platform", "queue flood", "cost"],
    weakCycle: ["platform", "platform", "guardrails"],
    hp: 520,
    radius: 64,
    speed: 62,
    orbitRadius: 230,
    pulseEvery: 2.8,
    pulseDamage: { latency: 7, burn: 5, morale: -2 },
    spawnEvery: 3.8,
    spawns: ["gpu", "csv"],
    score: 1800,
  },
  2: {
    title: "Surprise Audit",
    copy: "Audit has manifested as an actual boss. It wants lineage, logs, evidence, and your evening.",
    tags: ["guardrails", "audit", "security"],
    weakCycle: ["guardrails", "guardrails", "comms"],
    hp: 620,
    radius: 66,
    speed: 66,
    orbitRadius: 240,
    pulseEvery: 2.6,
    pulseDamage: { security: -9, politics: 6, morale: -2 },
    spawnEvery: 3.6,
    spawns: ["audit", "prompt"],
    score: 2200,
  },
  3: {
    title: "Minister Visit",
    copy: "The dashboard must look calm while reality remains dramatically uncalm.",
    tags: ["stakeholders", "politics", "demo day"],
    weakCycle: ["comms", "platform", "comms"],
    hp: 760,
    radius: 68,
    speed: 70,
    orbitRadius: 246,
    pulseEvery: 2.4,
    pulseDamage: { politics: 9, trust: -6, morale: -3 },
    spawnEvery: 3.2,
    spawns: ["minister", "gpu"],
    score: 2700,
  },
  4: {
    title: "Sentient Procurement",
    copy: "The model has become spiritually expensive and is now weaponizing committee language.",
    tags: ["hallucination", "procurement", "trust"],
    weakCycle: ["comms", "guardrails", "platform"],
    hp: 940,
    radius: 72,
    speed: 74,
    orbitRadius: 250,
    pulseEvery: 2.25,
    pulseDamage: { politics: 7, trust: -8, burn: 4 },
    spawnEvery: 2.9,
    spawns: ["procurement", "audit", "prompt"],
    score: 3300,
  },
  5: {
    title: "Demo Day Apocalypse",
    copy: "Everything is on fire, three leaders are watching, and the model has chosen spectacle.",
    tags: ["all channels", "demo", "survive"],
    weakCycle: ["platform", "guardrails", "comms"],
    hp: 1320,
    radius: 78,
    speed: 78,
    orbitRadius: 255,
    pulseEvery: 1.95,
    pulseDamage: { latency: 6, burn: 4, politics: 8, trust: -6, morale: -3 },
    spawnEvery: 2.45,
    spawns: ["gpu", "csv", "audit", "prompt", "minister", "procurement"],
    score: 5200,
  },
};

const ABILITY_LIBRARY = {
  overdrive: {
    key: "Q",
    label: "Shadow Cluster",
    description: "Massive fire-rate boost and harder hits. Finance can hear this from orbit.",
    cooldown: 16,
    color: "#3fc8be",
  },
  certs: {
    key: "W",
    label: "Cert Storm",
    description: "Freeze security-class threats and spike security posture.",
    cooldown: 18,
    color: "#f0bc57",
  },
  docs: {
    key: "E",
    label: "Docs Hero",
    description: "Asha chain-resolves fragile incidents and restores trust.",
    cooldown: 20,
    color: "#45d07b",
  },
  blame: {
    key: "R",
    label: "Blame Networking",
    description: "Shockwave everything outward. Politics falls, trust pays the bill.",
    cooldown: 15,
    color: "#f1665d",
  },
};

function buildUpgradePool() {
  return [
    {
      id: "espresso",
      name: "War Room Espresso",
      description: "+18% fire rate. The room gets louder and more effective.",
      apply(target) {
        target.mods.fireRate *= 1.18;
      },
    },
    {
      id: "gpu-cache",
      name: "Sovereign Cache",
      description: "+28% Platform damage. Compute incidents stop feeling invincible.",
      apply(target) {
        target.mods.damage.platform *= 1.28;
      },
    },
    {
      id: "audit-trail",
      name: "Audit Trail",
      description: "+26% Guardrails damage and slower security decay.",
      apply(target) {
        target.mods.damage.guardrails *= 1.26;
        target.mods.securityRegen += 0.22;
      },
    },
    {
      id: "minister-whisperer",
      name: "Minister Whisperer",
      description: "+24% Stakeholder damage and less politics from leaks.",
      apply(target) {
        target.mods.damage.comms *= 1.24;
        target.mods.politicsResist += 0.16;
      },
    },
    {
      id: "load-shedding",
      name: "Load Shedding",
      description: "Latency and burn recover faster whenever your combo stays hot.",
      apply(target) {
        target.mods.comboRecovery += 0.85;
      },
    },
    {
      id: "foam",
      name: "Kill-Switch Foam",
      description: "Start each day with a panic shield that absorbs one leak.",
      apply(target) {
        target.mods.extraShields += 1;
        target.shields += 1;
      },
    },
    {
      id: "receipts",
      name: "Asha's Receipts",
      description: "Docs Hero cooldown drops and trust gains hit harder.",
      apply(target) {
        target.mods.docsCooldownMult *= 0.78;
        target.mods.trustGain += 0.18;
      },
    },
    {
      id: "switchblade",
      name: "Hot Swap Kernel",
      description: "Switching modes fires a free burst in the new channel.",
      apply(target) {
        target.mods.switchBurst = true;
      },
    },
    {
      id: "spinroom",
      name: "Press Room Smoke Machine",
      description: "Blame Networking becomes safer and politics leaks soften.",
      apply(target) {
        target.mods.blameTrustPenalty *= 0.55;
        target.mods.politicsResist += 0.08;
      },
    },
    {
      id: "overclock",
      name: "Rogue Scheduler",
      description: "Global damage up, but passive burn climbs a little every second.",
      apply(target) {
        target.mods.globalDamage *= 1.12;
        target.mods.passiveBurn += 0.18;
      },
    },
  ];
}

const dom = {
  canvas: document.querySelector("#game-canvas"),
  statusLine: document.querySelector("#status-line"),
  waveLabel: document.querySelector("#wave-label"),
  scoreLabel: document.querySelector("#score-label"),
  comboLabel: document.querySelector("#combo-label"),
  modeLabel: document.querySelector("#mode-label"),
  metricsRibbon: document.querySelector("#metrics-ribbon"),
  incidentFeed: document.querySelector("#incident-feed"),
  chatterFeed: document.querySelector("#chatter-feed"),
  objectiveTitle: document.querySelector("#objective-title"),
  objectiveCopy: document.querySelector("#objective-copy"),
  objectiveTags: document.querySelector("#objective-tags"),
  upgradeList: document.querySelector("#upgrade-list"),
  modeBar: document.querySelector("#mode-bar"),
  abilityBar: document.querySelector("#ability-bar"),
  modal: document.querySelector("#modal"),
  modalKicker: document.querySelector("#modal-kicker"),
  modalTitle: document.querySelector("#modal-title"),
  modalCopy: document.querySelector("#modal-copy"),
  modalActions: document.querySelector("#modal-actions"),
  primaryAction: document.querySelector("#primary-action"),
  secondaryAction: document.querySelector("#secondary-action"),
  choiceGrid: document.querySelector("#choice-grid"),
};

const ctx = dom.canvas.getContext("2d");

const state = {
  autoPlay: AUTOPLAY_QUERY,
  phase: "intro",
  paused: false,
  lastTime: 0,
  uiAccumulator: 0,
  uiDirty: true,
  width: 1600,
  height: 900,
  dpr: 1,
  center: { x: 800, y: 450 },
  pointer: { x: 800, y: 450, down: false, inside: false },
  selectedMode: "platform",
  audio: {
    unlocked: false,
    ctx: null,
    hitThrottle: 0,
  },
  bestRun: loadBestRun(),
  modalMode: "intro",
  run: createRunState(),
};

init();

function createRunState() {
  return {
    day: 1,
    waveTimer: 0,
    score: 0,
    combo: 0,
    comboTimer: 0,
    overdriveTimer: 0,
    shields: 0,
    fireCooldown: 0,
    metricFlash: {},
    metrics: Object.fromEntries(
      METRIC_CONFIG.map((metric) => [metric.key, metric.start]),
    ),
    abilities: Object.fromEntries(
      Object.entries(ABILITY_LIBRARY).map(([key, ability]) => [
        key,
        { remaining: 0, cooldown: ability.cooldown },
      ]),
    ),
    mods: {
      fireRate: 1,
      globalDamage: 1,
      damage: { platform: 1, guardrails: 1, comms: 1 },
      securityRegen: 0,
      politicsResist: 0,
      trustGain: 0,
      passiveBurn: 0,
      comboRecovery: 0,
      docsCooldownMult: 1,
      switchBurst: false,
      blameTrustPenalty: 1,
      extraShields: 0,
    },
    installedUpgrades: [],
    upgradeIds: new Set(),
    enemies: [],
    projectiles: [],
    particles: [],
    texts: [],
    boss: null,
    bossSpawned: false,
    bossDefeated: false,
    spawnTimer: 0.55,
    chatter: [],
    shake: 0,
    autoplayDecisionTimer: 0,
    pendingChoices: [],
    incidentCounter: 1,
  };
}

function init() {
  bindEvents();
  resizeCanvas();
  seedIntro();
  if (state.autoPlay) {
    startRun();
  }
  requestAnimationFrame(loop);
}

function bindEvents() {
  window.addEventListener("resize", resizeCanvas);

  dom.canvas.addEventListener("pointerdown", (event) => {
    updatePointerFromEvent(event);
    state.pointer.down = true;
    state.pointer.inside = true;
    unlockAudio();
  });

  window.addEventListener("pointermove", (event) => {
    updatePointerFromEvent(event);
  });

  window.addEventListener("pointerup", () => {
    state.pointer.down = false;
  });

  dom.canvas.addEventListener("pointerleave", () => {
    state.pointer.inside = false;
  });

  window.addEventListener("keydown", (event) => {
    if (event.code === "Space") {
      event.preventDefault();
      if (state.phase === "running") {
        state.paused = !state.paused;
        state.uiDirty = true;
      }
      return;
    }

    if (state.phase === "upgrade" || state.phase === "gameover" || state.phase === "victory") {
      return;
    }

    if (event.code === "Digit1") {
      switchMode("platform");
    }
    if (event.code === "Digit2") {
      switchMode("guardrails");
    }
    if (event.code === "Digit3") {
      switchMode("comms");
    }

    if (event.code === "KeyQ") {
      useAbility("overdrive");
    }
    if (event.code === "KeyW") {
      useAbility("certs");
    }
    if (event.code === "KeyE") {
      useAbility("docs");
    }
    if (event.code === "KeyR") {
      useAbility("blame");
    }
  });

  dom.primaryAction.addEventListener("click", handlePrimaryAction);
  dom.secondaryAction.addEventListener("click", handleSecondaryAction);
  dom.choiceGrid.addEventListener("click", handleChoiceClick);
}

function handlePrimaryAction() {
  if (state.modalMode === "intro") {
    startRun();
    return;
  }

  if (state.modalMode === "gameover" || state.modalMode === "victory") {
    startRun();
  }
}

function handleSecondaryAction() {
  state.autoPlay = !state.autoPlay;
  if (state.modalMode === "intro") {
    dom.secondaryAction.textContent = state.autoPlay ? "Autoplay: On" : "Autoplay: Off";
  } else if (state.modalMode === "gameover" || state.modalMode === "victory") {
    startRun();
  }
}

function handleChoiceClick(event) {
  const button = event.target.closest("[data-upgrade-id]");
  if (!button || state.modalMode !== "upgrade") {
    return;
  }
  chooseUpgrade(button.dataset.upgradeId);
}

function resizeCanvas() {
  const rect = dom.canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  state.dpr = dpr;
  state.width = rect.width;
  state.height = rect.height;
  state.center = { x: rect.width / 2, y: rect.height / 2 };
  dom.canvas.width = Math.round(rect.width * dpr);
  dom.canvas.height = Math.round(rect.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  state.uiDirty = true;
}

function seedIntro() {
  state.modalMode = "intro";
  dom.modal.classList.add("visible");
  dom.modalKicker.textContent = "CRISIS START";
  dom.modalTitle.textContent = "Defend the sovereign AI core.";
  dom.modalCopy.textContent =
    "Incoming requests swarm the platform in real time. Hold pointer to fire, swap response channels, burn your cooldowns at the right moment, and survive five brutal workdays.";
  dom.modalActions.hidden = false;
  dom.primaryAction.hidden = false;
  dom.secondaryAction.hidden = false;
  dom.primaryAction.textContent = "Start Shift";
  dom.secondaryAction.textContent = state.autoPlay ? "Autoplay: On" : "Autoplay: Off";
  dom.choiceGrid.innerHTML = "";
  state.uiDirty = true;
}

function startRun() {
  state.phase = "running";
  state.paused = false;
  state.run = createRunState();
  state.run.shields = state.run.mods.extraShields;
  closeModal();
  switchMode("platform", true);
  addChatter("pm", "Keep the stack alive. Nobody upstairs knows how any of this works.");
  addChatter("security", "Please avoid creating a new audit finding while solving the current ones.");
  setObjectiveFromWave();
  state.uiDirty = true;
}

function closeModal() {
  dom.modal.classList.remove("visible");
  dom.choiceGrid.innerHTML = "";
}

function openUpgradeModal() {
  state.phase = "upgrade";
  state.modalMode = "upgrade";
  state.paused = true;
  const choices = pickUpgradeChoices();
  state.run.pendingChoices = choices;

  dom.modal.classList.add("visible");
  dom.modalKicker.textContent = `DAY ${state.run.day} COMPLETE`;
  dom.modalTitle.textContent = "Choose a platform mutation.";
  dom.modalCopy.textContent =
    "The room survived long enough to justify one irresponsible improvement. Pick carefully.";
  dom.modalActions.hidden = true;
  dom.choiceGrid.innerHTML = choices
    .map(
      (choice) => `
        <button class="choice-button" type="button" data-upgrade-id="${choice.id}">
          <strong>${choice.name}</strong>
          <p>${choice.description}</p>
        </button>
      `,
    )
    .join("");

  if (state.autoPlay) {
    const picked = autoPickUpgrade(choices);
    window.setTimeout(() => chooseUpgrade(picked.id), 250);
  }

  state.uiDirty = true;
}

function openEndModal(victory, summary) {
  state.phase = victory ? "victory" : "gameover";
  state.modalMode = victory ? "victory" : "gameover";
  state.paused = true;
  maybeStoreBestRun(victory);
  dom.modal.classList.add("visible");
  dom.modalKicker.textContent = victory ? "PLATFORM SAVED" : "PLATFORM COLLAPSE";
  dom.modalTitle.textContent = victory
    ? "The office remains operational."
    : "The office has become an inquiry.";
  dom.modalCopy.textContent = `${summary} Final score ${Math.round(state.run.score)}. Best ${Math.round(state.bestRun?.score ?? state.run.score)}.`;
  dom.modalActions.hidden = false;
  dom.primaryAction.hidden = false;
  dom.secondaryAction.hidden = false;
  dom.primaryAction.textContent = "Run It Again";
  dom.secondaryAction.textContent = state.autoPlay ? "Autoplay: On" : "Autoplay: Off";
  dom.choiceGrid.innerHTML = "";
  state.uiDirty = true;
}

function chooseUpgrade(upgradeId) {
  const upgrade = buildUpgradePool().find((item) => item.id === upgradeId);
  if (!upgrade) {
    return;
  }
  if (state.run.upgradeIds.has(upgrade.id)) {
    return;
  }
  upgrade.apply(state.run);
  state.run.installedUpgrades.push({ name: upgrade.name, description: upgrade.description });
  state.run.upgradeIds.add(upgrade.id);
  addFloatingText(state.center.x, state.center.y - 90, upgrade.name, "#45d07b", 28);
  addChatter("researcher", `${upgrade.name} is now installed. This feels defensible on a technicality.`);
  state.run.day += 1;
  state.run.waveTimer = 0;
  state.run.spawnTimer = 0.55;
  state.run.boss = null;
  state.run.bossSpawned = false;
  state.run.bossDefeated = false;
  state.run.shields += state.run.mods.extraShields;
  setObjectiveFromWave();
  closeModal();
  state.phase = "running";
  state.paused = false;
  state.uiDirty = true;
}

function loop(timestamp) {
  if (!state.lastTime) {
    state.lastTime = timestamp;
  }
  const dt = Math.min(0.033, (timestamp - state.lastTime) / 1000);
  state.lastTime = timestamp;

  update(dt);
  render();

  state.uiAccumulator += dt;
  if (state.uiDirty || state.uiAccumulator >= 0.14) {
    syncUI();
    state.uiAccumulator = 0;
    state.uiDirty = false;
  }

  requestAnimationFrame(loop);
}

function update(dt) {
  if (state.phase !== "running" || state.paused) {
    decayVisuals(dt);
    return;
  }

  const run = state.run;
  run.waveTimer += dt;
  run.comboTimer = Math.max(0, run.comboTimer - dt);
  if (run.comboTimer === 0) {
    run.combo = 0;
  }

  updateAudioThrottle(dt);
  updateAbilities(dt);

  if (state.autoPlay) {
    updateAutoplay(dt);
  }

  updateFiring(dt);
  updateProjectiles(dt);
  updateSpawning(dt);
  updateEnemies(dt);
  updateBoss(dt);
  updateParticles(dt);
  updateTexts(dt);
  applyPressure(dt);
  applyComboRecovery(dt);
  checkWaveProgress();
  checkLoseState();
  decayVisuals(dt);
}

function updateAudioThrottle(dt) {
  state.audio.hitThrottle = Math.max(0, state.audio.hitThrottle - dt);
}

function updateAbilities(dt) {
  Object.keys(runAbilities()).forEach((key) => {
    runAbilities()[key].remaining = Math.max(0, runAbilities()[key].remaining - dt);
  });
  state.run.overdriveTimer = Math.max(0, state.run.overdriveTimer - dt);
}

function updateAutoplay(dt) {
  const run = state.run;
  run.autoplayDecisionTimer -= dt;
  const target = chooseAutoTarget();
  if (target) {
    state.pointer.x = target.x;
    state.pointer.y = target.y;
    state.pointer.down = true;
    switchMode(target.weakMode, true);
  } else {
    state.pointer.x = state.center.x + Math.cos(run.waveTimer * 2) * 180;
    state.pointer.y = state.center.y + Math.sin(run.waveTimer * 2.4) * 140;
    state.pointer.down = false;
  }

  if (run.autoplayDecisionTimer <= 0) {
    if (run.boss && runAbilities().overdrive.remaining === 0) {
      useAbility("overdrive", true);
    }
    if (currentMetric("security") < 48 && runAbilities().certs.remaining === 0) {
      useAbility("certs", true);
    }
    if (currentMetric("trust") < 42 && runAbilities().docs.remaining === 0) {
      useAbility("docs", true);
    }
    if (run.enemies.length > 10 && runAbilities().blame.remaining === 0) {
      useAbility("blame", true);
    }
    run.autoplayDecisionTimer = 0.35;
  }
}

function chooseAutoTarget() {
  const boss = state.run.boss;
  if (boss) {
    return boss;
  }
  if (!state.run.enemies.length) {
    return null;
  }
  return [...state.run.enemies].sort((left, right) => enemyUrgency(right) - enemyUrgency(left))[0];
}

function enemyUrgency(enemy) {
  const dist = distance(enemy.x, enemy.y, state.center.x, state.center.y);
  return (enemy.leakThreat ?? 1) * 3000 / Math.max(140, dist) + enemy.hp * -0.2;
}

function updateFiring(dt) {
  const run = state.run;
  run.fireCooldown -= dt;
  const firing = state.pointer.down || state.autoPlay;
  if (!firing) {
    return;
  }
  while (run.fireCooldown <= 0) {
    spawnProjectile();
    run.fireCooldown += fireInterval();
  }
}

function spawnProjectile(modeOverride) {
  const mode = modeOverride ?? state.selectedMode;
  const config = MODE_CONFIG[mode];
  const angle = Math.atan2(state.pointer.y - state.center.y, state.pointer.x - state.center.x);
  const speed = 620 * state.run.mods.fireRate * (state.run.overdriveTimer > 0 ? 1.22 : 1);
  const damage =
    20 *
    state.run.mods.globalDamage *
    state.run.mods.damage[mode] *
    (state.run.overdriveTimer > 0 ? 1.35 : 1);

  state.run.projectiles.push({
    x: state.center.x + Math.cos(angle) * 48,
    y: state.center.y + Math.sin(angle) * 48,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    mode,
    color: config.color,
    life: 1.1,
    radius: 4.5,
    damage,
  });

  if (Math.random() < 0.3) {
    playTone("shoot", 0.028, config.color);
  }
}

function updateProjectiles(dt) {
  const remaining = [];
  for (const projectile of state.run.projectiles) {
    projectile.x += projectile.vx * dt;
    projectile.y += projectile.vy * dt;
    projectile.life -= dt;

    let hit = false;
    if (state.run.boss && circleHit(projectile, state.run.boss)) {
      damageBoss(projectile);
      hit = true;
    }

    if (!hit) {
      for (const enemy of state.run.enemies) {
        if (circleHit(projectile, enemy)) {
          damageEnemy(enemy, projectile);
          hit = true;
          break;
        }
      }
    }

    if (
      !hit &&
      projectile.life > 0 &&
      projectile.x > -100 &&
      projectile.x < state.width + 100 &&
      projectile.y > -100 &&
      projectile.y < state.height + 100
    ) {
      remaining.push(projectile);
    }
  }
  state.run.projectiles = remaining;
}

function damageEnemy(enemy, projectile) {
  const multiplier =
    projectile.mode === enemy.weakMode
      ? 1
      : projectile.mode === enemy.secondaryMode
        ? 0.62
        : 0.18;
  const damage = projectile.damage * multiplier;
  enemy.hp -= damage;
  enemy.hitFlash = 0.12;
  enemy.freeze = Math.max(0, enemy.freeze);
  burst(enemy.x, enemy.y, projectile.color, 6 + Math.round(multiplier * 8), 22);
  if (state.audio.hitThrottle === 0) {
    playTone("hit", 0.03, projectile.color);
    state.audio.hitThrottle = 0.05;
  }
  if (enemy.hp <= 0) {
    destroyEnemy(enemy, projectile.mode);
  }
}

function destroyEnemy(enemy, mode) {
  removeEnemy(enemy);
  const baseScore = enemy.score ?? 90;
  state.run.combo += 1;
  state.run.comboTimer = 3.2;
  const comboMultiplier = 1 + Math.min(1.5, state.run.combo * 0.08);
  state.run.score += baseScore * comboMultiplier;
  applyMetricDelta(enemy.reward ?? rewardForMode(mode));
  addFloatingText(enemy.x, enemy.y, `+${Math.round(baseScore * comboMultiplier)}`, MODE_CONFIG[mode].color, 18);
  burst(enemy.x, enemy.y, MODE_CONFIG[mode].color, 18, enemy.radius * 2.4);
  state.run.shake = Math.max(state.run.shake, 8);
  playTone("kill", 0.05, MODE_CONFIG[mode].color);

  if (Math.random() < 0.16) {
    addChatter(enemy.chatterCharacter, enemy.chatterCopy);
  }

  if (enemy.isBossMinion) {
    state.run.score += 40;
  }
}

function rewardForMode(mode) {
  if (mode === "platform") {
    return { latency: -2.2, burn: -0.85 };
  }
  if (mode === "guardrails") {
    return { security: 1.8, politics: -0.75 };
  }
  return { trust: 1.5 + state.run.mods.trustGain, politics: -1.15, morale: 0.45 };
}

function damageBoss(projectile) {
  const boss = state.run.boss;
  if (!boss) {
    return;
  }
  const multiplier = projectile.mode === boss.weakMode ? 1 : 0.28;
  boss.hp -= projectile.damage * multiplier * 0.82;
  boss.hitFlash = 0.14;
  burst(projectile.x, projectile.y, projectile.color, 10, 26);
  if (boss.hp <= 0) {
    destroyBoss();
  }
}

function destroyBoss() {
  const boss = state.run.boss;
  if (!boss) {
    return;
  }
  state.run.score += boss.score;
  state.run.boss = null;
  state.run.bossDefeated = true;
  applyMetricDelta({ trust: 10, morale: 8, politics: -8, latency: -12 });
  addFloatingText(state.center.x, state.center.y - 130, "BOSS SHREDDED", "#45d07b", 34);
  burst(state.center.x, state.center.y, "#45d07b", 48, 180);
  state.run.shake = 24;
  playTone("boss", 0.12, "#45d07b");
  addChatter("pm", "That actually looked intentional. Keep moving.");
}

function updateSpawning(dt) {
  const run = state.run;
  if (run.bossSpawned) {
    return;
  }

  run.spawnTimer -= dt;
  if (run.waveTimer >= BOSS_TRIGGER_TIME) {
    spawnBoss();
    return;
  }

  if (run.spawnTimer <= 0) {
    const cluster =
      1 +
      (run.day >= 2 && Math.random() < 0.32 ? 1 : 0) +
      (run.day >= 4 && Math.random() < 0.2 ? 1 : 0);
    for (let index = 0; index < cluster; index += 1) {
      const blueprint = pickEnemyType();
      spawnEnemy(blueprint.id, index === 0 ? {} : { scaleHp: 0.84, speedMult: 1.08, leakThreat: 0.82 });
    }
    run.spawnTimer = Math.max(0.22, 0.82 - run.day * 0.09 + Math.random() * 0.18);
  }
}

function pickEnemyType() {
  const pool =
    state.run.day === 1
      ? [ENEMY_LIBRARY.gpu, ENEMY_LIBRARY.csv, ENEMY_LIBRARY.minister]
      : state.run.day === 2
        ? [ENEMY_LIBRARY.audit, ENEMY_LIBRARY.prompt, ENEMY_LIBRARY.gpu, ENEMY_LIBRARY.csv]
        : state.run.day === 3
          ? [ENEMY_LIBRARY.minister, ENEMY_LIBRARY.gpu, ENEMY_LIBRARY.audit, ENEMY_LIBRARY.procurement]
          : state.run.day === 4
            ? [ENEMY_LIBRARY.procurement, ENEMY_LIBRARY.prompt, ENEMY_LIBRARY.audit, ENEMY_LIBRARY.minister]
            : ENEMY_LIST;
  return pickRandom(pool);
}

function spawnEnemy(typeId, options = {}) {
  const blueprint = ENEMY_LIBRARY[typeId];
  if (!blueprint) {
    return;
  }
  const spawn = spawnPoint();
  const enemy = {
    ...blueprint,
    id: `enemy-${state.run.incidentCounter++}`,
    x: spawn.x,
    y: spawn.y,
    angle: Math.atan2(state.center.y - spawn.y, state.center.x - spawn.x),
    entryAngle: spawn.angle,
    hp: blueprint.hp * (1 + (state.run.day - 1) * 0.13) * (options.scaleHp ?? 1),
    maxHp: blueprint.hp * (1 + (state.run.day - 1) * 0.13) * (options.scaleHp ?? 1),
    speed: blueprint.speed * (1 + (state.run.day - 1) * 0.05) * (options.speedMult ?? 1),
    wobble: Math.random() * Math.PI * 2,
    wobbleAmp: 10 + Math.random() * 16,
    freeze: 0,
    hitFlash: 0,
    spawnFlash: 0.75,
    rotation: Math.random() * Math.PI * 2,
    leakThreat: options.leakThreat ?? 1,
    isBossMinion: Boolean(options.isBossMinion),
  };
  state.run.enemies.push(enemy);
  state.uiDirty = true;
}

function spawnBoss() {
  const blueprint = BOSS_LIBRARY[state.run.day];
  const spawn = { x: state.center.x, y: -140 };
  state.run.boss = {
    ...blueprint,
    x: spawn.x,
    y: spawn.y,
    radius: blueprint.radius,
    hp: blueprint.hp,
    maxHp: blueprint.hp,
    weakMode: blueprint.weakCycle[0],
    weakIndex: 0,
    weakTimer: 0,
    pulseTimer: blueprint.pulseEvery,
    spawnTimer: blueprint.spawnEvery,
    orbitAngle: -Math.PI / 2,
    rotation: 0,
    entry: true,
    hitFlash: 0,
  };
  state.run.bossSpawned = true;
  state.uiDirty = true;
  addFloatingText(state.center.x, 92, blueprint.title, "#f1665d", 30);
  addChatter("pm", `Boss incoming: ${blueprint.title}. This is now an optics problem.`);
  playTone("boss", 0.08, "#f1665d");
}

function updateEnemies(dt) {
  const survivors = [];
  for (const enemy of state.run.enemies) {
    enemy.hitFlash = Math.max(0, enemy.hitFlash - dt);
    enemy.spawnFlash = Math.max(0, enemy.spawnFlash - dt);
    enemy.rotation += dt * 1.6;
    if (enemy.freeze > 0) {
      enemy.freeze -= dt;
    } else {
      moveEnemy(enemy, dt);
    }
    applyPressureDelta(enemy.pressure, dt);

    if (distance(enemy.x, enemy.y, state.center.x, state.center.y) <= enemy.radius + 68) {
      leakEnemy(enemy);
      continue;
    }

    survivors.push(enemy);
  }
  state.run.enemies = survivors;
}

function moveEnemy(enemy, dt) {
  const vectorToCenter = Math.atan2(state.center.y - enemy.y, state.center.x - enemy.x);
  enemy.wobble += dt * (enemy.pattern === "zigzag" ? 7.2 : enemy.pattern === "spiral" ? 4.4 : 3.5);

  let moveAngle = vectorToCenter;
  let extra = 0;
  if (enemy.pattern === "curve") {
    extra = Math.sin(enemy.wobble) * 0.65;
  } else if (enemy.pattern === "zigzag") {
    extra = Math.sign(Math.sin(enemy.wobble)) * 0.55;
  } else if (enemy.pattern === "spiral") {
    extra = 0.82;
  } else if (enemy.pattern === "pulse") {
    extra = Math.sin(enemy.wobble) * 0.25;
  }
  moveAngle += extra;

  const speedMod = enemy.pattern === "pulse" ? 0.72 + Math.max(0, Math.sin(enemy.wobble)) * 0.55 : 1;
  enemy.x += Math.cos(moveAngle) * enemy.speed * speedMod * dt;
  enemy.y += Math.sin(moveAngle) * enemy.speed * speedMod * dt;
}

function leakEnemy(enemy) {
  if (state.run.shields > 0) {
    state.run.shields -= 1;
    addFloatingText(state.center.x, state.center.y, "SHIELD SAVED IT", "#3fc8be", 20);
    burst(state.center.x, state.center.y, "#3fc8be", 20, 110);
    playTone("hit", 0.08, "#3fc8be");
  } else {
    applyMetricDelta(enemy.leak);
    addFloatingText(state.center.x, state.center.y, enemy.label.toUpperCase(), "#f1665d", 18);
    burst(state.center.x, state.center.y, "#f1665d", 24, 120);
    state.run.shake = Math.max(state.run.shake, 20);
    playTone("boss", 0.06, "#f1665d");
    addChatter(enemy.chatterCharacter, enemy.chatterCopy);
  }
  state.uiDirty = true;
}

function removeEnemy(enemy) {
  state.run.enemies = state.run.enemies.filter((item) => item.id !== enemy.id);
  state.uiDirty = true;
}

function updateBoss(dt) {
  const boss = state.run.boss;
  if (!boss) {
    return;
  }

  boss.hitFlash = Math.max(0, boss.hitFlash - dt);
  boss.rotation += dt * 0.6;
  boss.weakTimer += dt;
  if (boss.weakTimer >= 3) {
    boss.weakTimer = 0;
    boss.weakIndex = (boss.weakIndex + 1) % boss.weakCycle.length;
    boss.weakMode = boss.weakCycle[boss.weakIndex];
    addFloatingText(boss.x, boss.y - boss.radius - 22, `${MODE_CONFIG[boss.weakMode].label}!`, MODE_CONFIG[boss.weakMode].color, 16);
  }

  if (boss.entry) {
    const target = {
      x: state.center.x + Math.cos(-Math.PI / 2) * boss.orbitRadius,
      y: state.center.y + Math.sin(-Math.PI / 2) * boss.orbitRadius,
    };
    const angle = Math.atan2(target.y - boss.y, target.x - boss.x);
    boss.x += Math.cos(angle) * boss.speed * dt;
    boss.y += Math.sin(angle) * boss.speed * dt;
    if (distance(boss.x, boss.y, target.x, target.y) < 10) {
      boss.entry = false;
    }
  } else {
    boss.orbitAngle += dt * 0.56;
    boss.x = state.center.x + Math.cos(boss.orbitAngle) * boss.orbitRadius;
    boss.y = state.center.y + Math.sin(boss.orbitAngle) * boss.orbitRadius;
  }

  applyPressureDelta(scaleDelta(boss.pulseDamage, 0.045), dt);

  boss.pulseTimer -= dt;
  if (boss.pulseTimer <= 0) {
    boss.pulseTimer = boss.pulseEvery;
    if (state.run.shields > 0) {
      state.run.shields -= 1;
      addFloatingText(state.center.x, state.center.y, "PANIC SHIELD", "#3fc8be", 20);
    } else {
      applyMetricDelta(boss.pulseDamage);
      state.run.shake = Math.max(state.run.shake, 18);
      burst(state.center.x, state.center.y, "#f1665d", 28, 150);
    }
    playTone("boss", 0.09, "#f1665d");
  }

  boss.spawnTimer -= dt;
  if (boss.spawnTimer <= 0) {
    boss.spawnTimer = boss.spawnEvery;
    const typeId = pickRandom(boss.spawns);
    spawnEnemy(typeId, { isBossMinion: true, scaleHp: 1.1, speedMult: 1.08, leakThreat: 1.2 });
  }
}

function updateParticles(dt) {
  state.run.particles = state.run.particles.filter((particle) => {
    particle.life -= dt;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vx *= 0.98;
    particle.vy *= 0.98;
    return particle.life > 0;
  });
}

function updateTexts(dt) {
  state.run.texts = state.run.texts.filter((text) => {
    text.life -= dt;
    text.y -= text.rise * dt;
    return text.life > 0;
  });
}

function applyPressure(dt) {
  const enemyCount = state.run.enemies.length;
  applyMetricDelta({
    latency: dt * (0.55 + enemyCount * 0.04),
    burn: dt * (0.42 + state.run.day * 0.08 + state.run.mods.passiveBurn + (state.run.overdriveTimer > 0 ? 1.6 : 0)),
    security: dt * state.run.mods.securityRegen,
    politics: -dt * state.run.mods.politicsResist,
    morale: -dt * (enemyCount > 8 ? 0.7 : 0),
  });
}

function applyComboRecovery(dt) {
  if (state.run.combo >= 5) {
    applyMetricDelta({
      latency: -dt * (0.55 + state.run.mods.comboRecovery),
      burn: -dt * (0.22 + state.run.mods.comboRecovery * 0.35),
      trust: dt * (0.22 + state.run.mods.comboRecovery * 0.18),
    });
  }
}

function checkWaveProgress() {
  if (state.run.bossDefeated && !state.run.enemies.length) {
    if (state.run.day >= RUN_DAYS) {
      openEndModal(true, "You held the line through all five workdays.");
      return;
    }
    openUpgradeModal();
  }
}

function checkLoseState() {
  if (currentMetric("latency") >= metricMeta("latency").max) {
    openEndModal(false, "Latency blew through the ceiling and the queue became a culture war.");
    return;
  }
  if (currentMetric("burn") >= metricMeta("burn").max) {
    openEndModal(false, "Burn crossed a number finance uses in cautionary tales.");
    return;
  }
  if (currentMetric("security") <= metricMeta("security").min) {
    openEndModal(false, "Security collapsed and now even the interns are threat models.");
    return;
  }
  if (currentMetric("politics") >= metricMeta("politics").max) {
    openEndModal(false, "Political damage reached ministerial briefing threshold.");
    return;
  }
  if (currentMetric("trust") <= metricMeta("trust").min) {
    openEndModal(false, "Users went back to spreadsheets with visible relief.");
    return;
  }
  if (currentMetric("morale") <= metricMeta("morale").min) {
    openEndModal(false, "Team morale flatlined and the rota became folklore.");
  }
}

function decayVisuals(dt) {
  state.run.shake = Math.max(0, state.run.shake - dt * 26);
}

function switchMode(mode, silent = false) {
  if (!MODE_CONFIG[mode]) {
    return;
  }
  if (state.selectedMode === mode && !silent) {
    return;
  }
  state.selectedMode = mode;
  state.uiDirty = true;
  if (state.phase === "running" && state.run.mods.switchBurst && !silent) {
    for (let count = 0; count < 5; count += 1) {
      spawnProjectile(mode);
    }
  }
  if (!silent) {
    playTone("switch", 0.03, MODE_CONFIG[mode].color);
  }
}

function useAbility(key, silent = false) {
  if (state.phase !== "running") {
    return;
  }
  const ability = runAbilities()[key];
  if (!ability || ability.remaining > 0) {
    return;
  }

  if (key === "overdrive") {
    ability.remaining = ABILITY_LIBRARY.overdrive.cooldown;
    state.run.overdriveTimer = 4.6;
    addChatter("researcher", "Shadow cluster online. This invoice will have lore.");
    burst(state.center.x, state.center.y, "#3fc8be", 22, 120);
  }

  if (key === "certs") {
    ability.remaining = ABILITY_LIBRARY.certs.cooldown;
    state.run.enemies.forEach((enemy) => {
      if (enemy.weakMode === "guardrails") {
        enemy.freeze = Math.max(enemy.freeze, 3.2);
      }
    });
    if (state.run.boss) {
      state.run.boss.pulseTimer += 0.6;
    }
    applyMetricDelta({ security: 12, politics: -3 });
    addChatter("security", "Cert storm deployed. Everybody reauthenticate and stop complaining.");
    burst(state.center.x, state.center.y, "#f0bc57", 26, 140);
  }

  if (key === "docs") {
    ability.remaining = ABILITY_LIBRARY.docs.cooldown * state.run.mods.docsCooldownMult;
    const targets = [...state.run.enemies]
      .sort((left, right) => enemyUrgency(right) - enemyUrgency(left))
      .slice(0, 5);
    targets.forEach((enemy, index) => {
      enemy.hp -= 32 + state.run.day * 4 + index * 4;
      enemy.hitFlash = 0.18;
      burst(enemy.x, enemy.y, "#45d07b", 12, 30);
      if (enemy.hp <= 0) {
        destroyEnemy(enemy, "comms");
      }
    });
    applyMetricDelta({ trust: 8 + state.run.mods.trustGain * 10, morale: 4, politics: -4 });
    addChatter("ally", "Asha has receipts, screenshots, and a documented path through the mess.");
  }

  if (key === "blame") {
    ability.remaining = ABILITY_LIBRARY.blame.cooldown;
    state.run.enemies.forEach((enemy) => {
      const angle = Math.atan2(enemy.y - state.center.y, enemy.x - state.center.x);
      enemy.x += Math.cos(angle) * 110;
      enemy.y += Math.sin(angle) * 110;
      enemy.freeze = Math.max(enemy.freeze, 0.35);
    });
    if (state.run.boss) {
      state.run.boss.pulseTimer += 0.35;
    }
    applyMetricDelta({ politics: -12, trust: -6 * state.run.mods.blameTrustPenalty, morale: 2 });
    addChatter("pm", "Tasteful graphs have been exported. Reality is now delayed.");
    burst(state.center.x, state.center.y, "#f1665d", 28, 180);
  }

  if (!silent) {
    playTone("ability", 0.05, ABILITY_LIBRARY[key].color);
  }
  state.uiDirty = true;
}

function runAbilities() {
  return state.run.abilities;
}

function updatePointerFromEvent(event) {
  const rect = dom.canvas.getBoundingClientRect();
  state.pointer.x = event.clientX - rect.left;
  state.pointer.y = event.clientY - rect.top;
  state.pointer.inside =
    state.pointer.x >= 0 &&
    state.pointer.x <= rect.width &&
    state.pointer.y >= 0 &&
    state.pointer.y <= rect.height;
}

function applyMetricDelta(delta) {
  for (const [key, value] of Object.entries(delta)) {
    const meta = metricMeta(key);
    let next = state.run.metrics[key] + value;

    if (key === "politics" && value > 0) {
      next -= value * state.run.mods.politicsResist;
    }
    if (key === "trust" && value > 0) {
      next += value * state.run.mods.trustGain;
    }

    state.run.metrics[key] = clamp(next, meta.min, meta.max);
    state.run.metricFlash[key] = 0.3;
  }
  state.uiDirty = true;
}

function applyPressureDelta(delta, dt) {
  const scaled = Object.fromEntries(
    Object.entries(delta).map(([key, value]) => [key, value * dt]),
  );
  applyMetricDelta(scaled);
}

function scaleDelta(delta, factor) {
  return Object.fromEntries(
    Object.entries(delta).map(([key, value]) => [key, value * factor]),
  );
}

function fireInterval() {
  const base = 0.13 / state.run.mods.fireRate;
  return base / (state.run.overdriveTimer > 0 ? 1.9 : 1);
}

function metricMeta(key) {
  return METRIC_CONFIG.find((metric) => metric.key === key);
}

function currentMetric(key) {
  return state.run.metrics[key];
}

function setObjectiveFromWave() {
  const boss = BOSS_LIBRARY[state.run.day];
  state.uiDirty = true;
  if (boss) {
    addChatter(
      "pm",
      `Day ${state.run.day} briefing: ${boss.title} is on the schedule and nobody can cancel it.`,
    );
  }
}

function syncUI() {
  dom.waveLabel.textContent = `Day ${state.run.day}`;
  dom.scoreLabel.textContent = Math.round(state.run.score).toString();
  dom.comboLabel.textContent = `x${Math.max(1, state.run.combo)}`;
  dom.modeLabel.textContent = MODE_CONFIG[state.selectedMode].label;
  dom.statusLine.textContent = buildStatusLine();
  renderMetrics();
  renderIncidentFeed();
  renderChatter();
  renderObjective();
  renderUpgrades();
  renderModeBar();
  renderAbilityBar();
}

function buildStatusLine() {
  if (state.phase === "upgrade") {
    return "Quietly mutate the platform before the next shift hits.";
  }
  if (state.phase === "gameover") {
    return "The room is now a hearing.";
  }
  if (state.phase === "victory") {
    return "The platform survived all five workdays.";
  }
  if (state.run.boss) {
    return `${state.run.boss.title} active. Weak channel: ${MODE_CONFIG[state.run.boss.weakMode].label}.`;
  }
  if (state.autoPlay) {
    return `Autoplay engaged. Wave timer ${Math.max(0, WAVE_DURATION - state.run.waveTimer).toFixed(0)}s.`;
  }
  return `Wave timer ${Math.max(0, WAVE_DURATION - state.run.waveTimer).toFixed(0)}s. Hold pointer to fire.`;
}

function renderMetrics() {
  dom.metricsRibbon.innerHTML = METRIC_CONFIG.map((metric) => {
    const value = currentMetric(metric.key);
    const ratio = metricRatio(metric.key, value);
    const tone = ratio > 0.68 ? "var(--green)" : ratio > 0.38 ? "var(--amber)" : "var(--red)";
    const descriptor = ratio > 0.68 ? "stable" : ratio > 0.38 ? "strained" : "critical";
    return `
      <div class="metric-card">
        <div class="metric-head">
          <span class="score-label">${metric.label}</span>
          <strong>${metric.formatter(value)}</strong>
        </div>
        <small>${descriptor}</small>
        <div class="metric-bar">
          <span class="metric-fill" style="width:${Math.round(ratio * 100)}%; background:${tone};"></span>
        </div>
      </div>
    `;
  }).join("");
}

function renderIncidentFeed() {
  const threats = buildThreatFeed();
  dom.incidentFeed.innerHTML = threats
    .map((threat) => {
      const meta = threat.isBoss
        ? `<span class="severity-pill">${MODE_CONFIG[threat.weakMode].label}</span>`
        : `<span class="severity-pill">${threat.short}</span>`;
      return `
        <div class="incident-card" style="border-left-color:${threat.color}">
          <div class="incident-head">
            <div>
              <strong>${threat.label}</strong>
              <p>${threat.copy}</p>
            </div>
            ${meta}
          </div>
          <div class="incident-meta">
            <span class="tag-chip">Weak: ${MODE_CONFIG[threat.weakMode].label}</span>
            <span class="tag-chip">${threat.isBoss ? `${Math.round((threat.hp / threat.maxHp) * 100)}% hp` : `${Math.round(threat.hp)} hp`}</span>
          </div>
        </div>
      `;
    })
    .join("");
}

function buildThreatFeed() {
  const threats = [];
  if (state.run.boss) {
    threats.push({
      ...state.run.boss,
      copy: state.run.boss.copy,
      color: "#f1665d",
      isBoss: true,
    });
  }

  const urgent = [...state.run.enemies]
    .sort((left, right) => enemyUrgency(right) - enemyUrgency(left))
    .slice(0, 4)
    .map((enemy) => ({
      ...enemy,
      copy: enemy.chatterCopy,
      isBoss: false,
    }));

  return [...threats, ...urgent];
}

function renderChatter() {
  dom.chatterFeed.innerHTML = state.run.chatter
    .slice(0, 5)
    .map((entry) => {
      const character = CHARACTER_ROSTER[entry.character];
      return `
        <div class="chatter-card">
          <img class="avatar" src="${character.avatar}" alt="${character.name}" />
          <div>
            <div class="chatter-head">
              <strong>${character.name}</strong>
              <span class="score-label">${character.role}</span>
            </div>
            <p>${entry.text}</p>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderObjective() {
  const boss = state.run.boss;
  const blueprint = BOSS_LIBRARY[state.run.day];
  if (boss) {
    dom.objectiveTitle.textContent = boss.title;
    dom.objectiveCopy.textContent = boss.copy;
    dom.objectiveTags.innerHTML = [
      `<span class="tag-chip">Weak: ${MODE_CONFIG[boss.weakMode].label}</span>`,
      `<span class="tag-chip">${Math.round((boss.hp / boss.maxHp) * 100)}% hp</span>`,
      ...boss.tags.map((tag) => `<span class="tag-chip">${tag}</span>`),
    ].join("");
  } else {
    dom.objectiveTitle.textContent = blueprint.title;
    dom.objectiveCopy.textContent = blueprint.copy;
    dom.objectiveTags.innerHTML = [
      `<span class="tag-chip">${Math.max(0, WAVE_DURATION - state.run.waveTimer).toFixed(0)}s until boss</span>`,
      `<span class="tag-chip">${state.run.enemies.length} live threats</span>`,
      ...blueprint.tags.map((tag) => `<span class="tag-chip">${tag}</span>`),
    ].join("");
  }
}

function renderUpgrades() {
  if (!state.run.installedUpgrades.length) {
    dom.upgradeList.innerHTML = `
      <div class="upgrade-chip">
        <strong>No mutations yet</strong>
        <p>Survive a day and the room will invent something irresponsible.</p>
      </div>
    `;
    return;
  }

  dom.upgradeList.innerHTML = state.run.installedUpgrades
    .slice(-6)
    .map(
      (upgrade) => `
        <div class="upgrade-chip">
          <strong>${upgrade.name}</strong>
          <p>${upgrade.description}</p>
        </div>
      `,
    )
    .join("");
}

function renderModeBar() {
  dom.modeBar.innerHTML = MODE_LIST.map((mode) => {
    const config = MODE_CONFIG[mode];
    return `
      <button class="mode-card ${state.selectedMode === mode ? "is-active" : ""}" type="button" data-mode="${mode}" style="color:${config.color}">
        <div class="mode-head">
          <strong>${config.label}</strong>
          <span class="score-label">${config.key}</span>
        </div>
        <p>${config.description}</p>
      </button>
    `;
  }).join("");

  dom.modeBar.querySelectorAll("[data-mode]").forEach((button) => {
    button.addEventListener("click", () => switchMode(button.dataset.mode));
  });
}

function renderAbilityBar() {
  dom.abilityBar.innerHTML = Object.entries(ABILITY_LIBRARY)
    .map(([key, ability]) => {
      const remaining = runAbilities()[key].remaining;
      return `
        <button class="ability-card ${remaining > 0 ? "is-cooling" : ""}" type="button" data-ability="${key}" style="color:${ability.color}">
          <div class="ability-head">
            <strong>${ability.label}</strong>
            <span class="cooldown">${remaining > 0 ? `${remaining.toFixed(1)}s` : ability.key}</span>
          </div>
          <p>${ability.description}</p>
        </button>
      `;
    })
    .join("");

  dom.abilityBar.querySelectorAll("[data-ability]").forEach((button) => {
    button.addEventListener("click", () => useAbility(button.dataset.ability));
  });
}

function render() {
  const shake = state.run.shake;
  const shakeX = shake > 0 ? randomRange(-shake, shake) : 0;
  const shakeY = shake > 0 ? randomRange(-shake, shake) : 0;

  ctx.save();
  ctx.clearRect(0, 0, state.width, state.height);
  ctx.translate(shakeX, shakeY);

  drawArenaBackground();
  drawThreatTrails();
  drawMetricNodes();
  drawProjectiles();
  drawEnemies();
  drawBoss();
  drawCore();
  drawDangerFrame();
  drawCombatHud();
  drawParticles();
  drawTexts();
  drawReticle();

  ctx.restore();
}

function drawArenaBackground() {
  const gradient = ctx.createRadialGradient(
    state.center.x,
    state.center.y,
    40,
    state.center.x,
    state.center.y,
    state.height * 0.6,
  );
  gradient.addColorStop(0, "rgba(38, 51, 59, 0.16)");
  gradient.addColorStop(1, "rgba(5, 7, 8, 0.86)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, state.width, state.height);

  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 1;
  const spacing = Math.max(48, state.width / 20);
  for (let x = spacing * 0.5; x < state.width; x += spacing) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, state.height);
    ctx.stroke();
  }
  for (let y = spacing * 0.5; y < state.height; y += spacing) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(state.width, y);
    ctx.stroke();
  }

  for (let ring = 1; ring <= 5; ring += 1) {
    ctx.beginPath();
    ctx.arc(state.center.x, state.center.y, ring * 90, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255,255,255,${0.02 + ring * 0.01})`;
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.arc(state.center.x, state.center.y, 280, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(63, 200, 190, 0.09)";
  ctx.lineWidth = 2;
  ctx.stroke();

  const sweep = (state.run.waveTimer * 0.26) % 1;
  const sweepX = -state.width * 0.2 + (state.width * 1.4) * sweep;
  const sweepGradient = ctx.createLinearGradient(sweepX - 120, 0, sweepX + 120, 0);
  sweepGradient.addColorStop(0, "rgba(63, 200, 190, 0)");
  sweepGradient.addColorStop(0.5, "rgba(63, 200, 190, 0.08)");
  sweepGradient.addColorStop(1, "rgba(63, 200, 190, 0)");
  ctx.fillStyle = sweepGradient;
  ctx.fillRect(0, 0, state.width, state.height);
}

function drawThreatTrails() {
  const threats = state.run.boss ? [state.run.boss, ...state.run.enemies] : state.run.enemies;
  for (const threat of threats) {
    const config = MODE_CONFIG[threat.weakMode];
    const alpha = threat === state.run.boss ? 0.24 : 0.08 + threat.spawnFlash * 0.18;
    const width = threat === state.run.boss ? 3.4 : 1.6;
    const gradient = ctx.createLinearGradient(threat.x, threat.y, state.center.x, state.center.y);
    gradient.addColorStop(0, hexWithAlpha(config.color, alpha));
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.strokeStyle = gradient;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(threat.x, threat.y);
    ctx.lineTo(state.center.x, state.center.y);
    ctx.stroke();

    if (threat !== state.run.boss && threat.spawnFlash > 0) {
      const pulse = threat.radius + 18 + threat.spawnFlash * 22;
      ctx.beginPath();
      ctx.arc(threat.x, threat.y, pulse, 0, Math.PI * 2);
      ctx.strokeStyle = hexWithAlpha(config.color, 0.16 + threat.spawnFlash * 0.22);
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
}

function drawMetricNodes() {
  const positions = [
    { key: "latency", x: state.width * 0.18, y: state.height * 0.17 },
    { key: "burn", x: state.width * 0.82, y: state.height * 0.17 },
    { key: "security", x: state.width * 0.14, y: state.height * 0.5 },
    { key: "politics", x: state.width * 0.86, y: state.height * 0.5 },
    { key: "trust", x: state.width * 0.2, y: state.height * 0.83 },
    { key: "morale", x: state.width * 0.8, y: state.height * 0.83 },
  ];

  positions.forEach((position) => {
    const ratio = metricRatio(position.key, currentMetric(position.key));
    const tone = ratio > 0.68 ? "#45d07b" : ratio > 0.38 ? "#f0bc57" : "#f1665d";
    const pulse = 16 + (1 - ratio) * 18 + Math.sin(state.run.waveTimer * 4) * 3;
    ctx.beginPath();
    ctx.moveTo(state.center.x, state.center.y);
    ctx.lineTo(position.x, position.y);
    ctx.strokeStyle = `rgba(255,255,255,${0.08 + (1 - ratio) * 0.1})`;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(position.x, position.y, pulse, 0, Math.PI * 2);
    ctx.fillStyle = hexWithAlpha(tone, 0.18);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(position.x, position.y, 10, 0, Math.PI * 2);
    ctx.fillStyle = tone;
    ctx.fill();

    ctx.fillStyle = "#edf3f8";
    ctx.font = "600 12px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(metricMeta(position.key).label.toUpperCase(), position.x, position.y + 34);
  });
}

function drawCore() {
  const pulse = 84 + Math.sin(state.run.waveTimer * 3.5) * 8;
  const angle = Math.atan2(state.pointer.y - state.center.y, state.pointer.x - state.center.x);

  ctx.beginPath();
  ctx.arc(state.center.x, state.center.y, pulse, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(10, 15, 18, 0.9)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 2;
  ctx.stroke();

  MODE_LIST.forEach((mode, index) => {
    const config = MODE_CONFIG[mode];
    ctx.beginPath();
    ctx.arc(
      state.center.x,
      state.center.y,
      58 + index * 9,
      angle + index * 2.1,
      angle + index * 2.1 + Math.PI * 0.9,
    );
    ctx.strokeStyle = state.selectedMode === mode ? config.color : hexWithAlpha(config.color, 0.35);
    ctx.lineWidth = state.selectedMode === mode ? 7 : 4;
    ctx.stroke();
  });

  const turretLength = 64;
  ctx.beginPath();
  ctx.moveTo(state.center.x, state.center.y);
  ctx.lineTo(
    state.center.x + Math.cos(angle) * turretLength,
    state.center.y + Math.sin(angle) * turretLength,
  );
  ctx.strokeStyle = MODE_CONFIG[state.selectedMode].color;
  ctx.lineWidth = 8;
  ctx.lineCap = "round";
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(state.center.x, state.center.y, 32, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(18, 25, 28, 0.96)";
  ctx.fill();
  ctx.strokeStyle = MODE_CONFIG[state.selectedMode].color;
  ctx.lineWidth = 3;
  ctx.stroke();

  if (state.run.overdriveTimer > 0) {
    ctx.beginPath();
    ctx.arc(state.center.x, state.center.y, 102 + Math.sin(state.run.waveTimer * 16) * 4, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(63, 200, 190, 0.55)";
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  if (state.run.shields > 0) {
    ctx.beginPath();
    ctx.arc(state.center.x, state.center.y, 116, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(63, 200, 190, 0.4)";
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.fillStyle = "#3fc8be";
    ctx.font = "700 14px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`SHIELD x${state.run.shields}`, state.center.x, state.center.y + 6);
  }
}

function drawDangerFrame() {
  const liveThreats = state.run.enemies.length + (state.run.boss ? 5 : 0);
  const urgency = clamp(liveThreats / 12, 0.08, 1);
  const countdown = Math.max(0, BOSS_TRIGGER_TIME - state.run.waveTimer);
  const tone =
    state.run.boss || countdown < 4
      ? "#f1665d"
      : state.run.combo >= 5
        ? "#45d07b"
        : "#f0bc57";

  ctx.strokeStyle = hexWithAlpha(tone, 0.12 + urgency * 0.18);
  ctx.lineWidth = 2;
  roundedRect(ctx, 10, 10, state.width - 20, state.height - 20, 12);
  ctx.stroke();

  const corners = [
    [18, 18, 72, 18, 18, 72],
    [state.width - 18, 18, state.width - 72, 18, state.width - 18, 72],
    [18, state.height - 18, 72, state.height - 18, 18, state.height - 72],
    [state.width - 18, state.height - 18, state.width - 72, state.height - 18, state.width - 18, state.height - 72],
  ];
  ctx.strokeStyle = hexWithAlpha(tone, 0.34 + urgency * 0.26);
  ctx.lineWidth = 4;
  for (const [x1, y1, x2, y2, x3, y3] of corners) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.stroke();
  }
}

function drawCombatHud() {
  const countdown = Math.max(0, BOSS_TRIGGER_TIME - state.run.waveTimer);
  const topY = 26;
  const comboBanner = state.run.combo >= 4;
  const warning = !state.run.boss && countdown <= 8;
  const panels = [
    {
      title: "THREATS",
      value: `${state.run.enemies.length}${state.run.boss ? " + BOSS" : ""}`,
      color: state.run.boss ? "#f1665d" : "#f0bc57",
    },
    {
      title: comboBanner ? "COMBO" : "BOSS ETA",
      value: comboBanner ? `x${state.run.combo}` : `${countdown.toFixed(0)}s`,
      color: comboBanner ? "#45d07b" : "#3fc8be",
    },
  ];

  const totalWidth = 266;
  const x = state.center.x - totalWidth / 2;
  roundedRect(ctx, x, topY, totalWidth, 56, 12);
  ctx.fillStyle = "rgba(8, 12, 14, 0.8)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.09)";
  ctx.lineWidth = 1;
  ctx.stroke();

  panels.forEach((panel, index) => {
    const panelX = x + index * 133;
    if (index > 0) {
      ctx.beginPath();
      ctx.moveTo(panelX, topY + 10);
      ctx.lineTo(panelX, topY + 46);
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.stroke();
    }
    ctx.fillStyle = "#8e9aa6";
    ctx.font = "600 11px Inter, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(panel.title, panelX + 16, topY + 20);
    ctx.fillStyle = panel.color;
    ctx.font = "800 22px Inter, sans-serif";
    ctx.fillText(panel.value, panelX + 16, topY + 43);
  });

  if (warning) {
    const pulse = 0.42 + Math.sin(state.run.waveTimer * 10) * 0.08;
    const bannerWidth = Math.min(420, state.width * 0.34);
    const bannerX = state.center.x - bannerWidth / 2;
    const bannerY = 92;
    roundedRect(ctx, bannerX, bannerY, bannerWidth, 34, 999);
    ctx.fillStyle = `rgba(241, 102, 93, ${pulse})`;
    ctx.fill();
    ctx.fillStyle = "#fff4f2";
    ctx.font = "800 15px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`BOSS INCOMING  ${countdown.toFixed(0)}s`, state.center.x, bannerY + 22);
  }
}

function drawProjectiles() {
  for (const projectile of state.run.projectiles) {
    ctx.beginPath();
    ctx.moveTo(projectile.x, projectile.y);
    ctx.lineTo(projectile.x - projectile.vx * 0.024, projectile.y - projectile.vy * 0.024);
    ctx.strokeStyle = hexWithAlpha(projectile.color, 0.22);
    ctx.lineWidth = 7;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(projectile.x, projectile.y, projectile.radius, 0, Math.PI * 2);
    ctx.fillStyle = projectile.color;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(projectile.x, projectile.y);
    ctx.lineTo(projectile.x - projectile.vx * 0.016, projectile.y - projectile.vy * 0.016);
    ctx.strokeStyle = hexWithAlpha(projectile.color, 0.45);
    ctx.lineWidth = 3;
    ctx.stroke();
  }
}

function drawEnemies() {
  for (const enemy of state.run.enemies) {
    drawEnemyCard(enemy);
  }
}

function drawEnemyCard(enemy) {
  ctx.save();
  ctx.translate(enemy.x, enemy.y);
  ctx.rotate(enemy.rotation * 0.12);
  const width = enemy.radius * 2.4;
  const height = enemy.radius * 1.9;

  ctx.beginPath();
  ctx.arc(0, 0, enemy.radius + 10 + enemy.spawnFlash * 10, 0, Math.PI * 2);
  ctx.fillStyle = hexWithAlpha(enemy.color, 0.08 + enemy.spawnFlash * 0.14);
  ctx.fill();

  ctx.fillStyle = "rgba(10, 14, 17, 0.94)";
  ctx.strokeStyle = enemy.hitFlash > 0 ? "#ffffff" : enemy.color;
  ctx.lineWidth = enemy.freeze > 0 ? 4 : 2;
  roundedRect(ctx, -width / 2, -height / 2, width, height, 8);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = enemy.freeze > 0 ? "#edf3f8" : enemy.color;
  ctx.font = "700 12px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(enemy.short, 0, 4);

  ctx.fillStyle = hexWithAlpha(enemy.color, 0.18);
  roundedRect(ctx, -width / 2, height / 2 + 6, width, 6, 4);
  ctx.fill();
  roundedRect(ctx, -width / 2, height / 2 + 6, width * clamp(enemy.hp / enemy.maxHp, 0, 1), 6, 4);
  ctx.fillStyle = enemy.color;
  ctx.fill();
  ctx.restore();
}

function drawBoss() {
  const boss = state.run.boss;
  if (!boss) {
    return;
  }

  ctx.save();
  ctx.translate(boss.x, boss.y);
  ctx.rotate(boss.rotation);

  ctx.beginPath();
  ctx.arc(0, 0, boss.radius + 18, 0, Math.PI * 2);
  ctx.strokeStyle = hexWithAlpha(MODE_CONFIG[boss.weakMode].color, 0.35);
  ctx.lineWidth = 5;
  ctx.stroke();

  roundedRect(ctx, -boss.radius * 1.2, -boss.radius * 0.8, boss.radius * 2.4, boss.radius * 1.6, 18);
  ctx.fillStyle = "rgba(14, 19, 23, 0.96)";
  ctx.fill();
  ctx.strokeStyle = boss.hitFlash > 0 ? "#ffffff" : "#f1665d";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = MODE_CONFIG[boss.weakMode].color;
  ctx.font = "800 18px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(boss.title, 0, -6);
  ctx.font = "700 13px Inter, sans-serif";
  ctx.fillText(`WEAK: ${MODE_CONFIG[boss.weakMode].short}`, 0, 18);
  ctx.restore();

  const barWidth = Math.min(460, state.width * 0.42);
  const x = state.center.x - barWidth / 2;
  const y = 24;
  roundedRect(ctx, x, y, barWidth, 12, 999);
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fill();
  roundedRect(ctx, x, y, barWidth * clamp(boss.hp / boss.maxHp, 0, 1), 12, 999);
  ctx.fillStyle = "#f1665d";
  ctx.fill();
}

function drawParticles() {
  for (const particle of state.run.particles) {
    ctx.globalAlpha = clamp(particle.life / particle.maxLife, 0, 1);
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    ctx.fillStyle = particle.color;
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function drawTexts() {
  ctx.textAlign = "center";
  for (const text of state.run.texts) {
    ctx.globalAlpha = clamp(text.life / text.maxLife, 0, 1);
    ctx.fillStyle = text.color;
    ctx.font = `700 ${text.size}px Inter, sans-serif`;
    ctx.fillText(text.text, text.x, text.y);
    ctx.globalAlpha = 1;
  }
}

function drawReticle() {
  const pointer = state.pointer;
  const color = MODE_CONFIG[state.selectedMode].color;
  ctx.beginPath();
  ctx.arc(pointer.x, pointer.y, 16, 0, Math.PI * 2);
  ctx.strokeStyle = hexWithAlpha(color, 0.6);
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(pointer.x - 24, pointer.y);
  ctx.lineTo(pointer.x + 24, pointer.y);
  ctx.moveTo(pointer.x, pointer.y - 24);
  ctx.lineTo(pointer.x, pointer.y + 24);
  ctx.strokeStyle = hexWithAlpha(color, 0.35);
  ctx.stroke();
}

function addChatter(character, text) {
  state.run.chatter.unshift({ character, text });
  state.run.chatter = state.run.chatter.slice(0, 8);
  state.uiDirty = true;
}

function addFloatingText(x, y, text, color, size = 18) {
  state.run.texts.push({
    x,
    y,
    text,
    color,
    size,
    life: 0.95,
    maxLife: 0.95,
    rise: 24 + size * 0.35,
  });
}

function burst(x, y, color, count, spread) {
  for (let index = 0; index < count; index += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * spread + 10;
    const radius = Math.random() * 3 + 1.5;
    state.run.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius,
      color,
      life: 0.45 + Math.random() * 0.35,
      maxLife: 0.8,
    });
  }
}

function pickUpgradeChoices() {
  const pool = buildUpgradePool().filter((upgrade) => !state.run.upgradeIds.has(upgrade.id));
  return shuffle(pool).slice(0, 3);
}

function autoPickUpgrade(choices) {
  return (
    choices.find((choice) => choice.id === "espresso") ||
    choices.find((choice) => choice.id === "gpu-cache") ||
    choices[0]
  );
}

function maybeStoreBestRun(victory) {
  const score = state.run.score;
  if (!state.bestRun || score > state.bestRun.score) {
    state.bestRun = {
      score,
      day: state.run.day,
      victory,
      upgrades: state.run.installedUpgrades.length,
    };
    localStorage.setItem(BEST_RUN_KEY, JSON.stringify(state.bestRun));
  }
}

function loadBestRun() {
  try {
    return JSON.parse(localStorage.getItem(BEST_RUN_KEY) ?? "null");
  } catch {
    return null;
  }
}

function unlockAudio() {
  if (state.audio.unlocked) {
    return;
  }
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      return;
    }
    state.audio.ctx = new AudioContextClass();
    state.audio.unlocked = true;
  } catch {
    state.audio.unlocked = false;
  }
}

function playTone(type, duration, color) {
  if (!state.audio.unlocked || !state.audio.ctx) {
    return;
  }
  const context = state.audio.ctx;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.connect(gain);
  gain.connect(context.destination);

  const now = context.currentTime;
  oscillator.type =
    type === "boss" ? "sawtooth" : type === "kill" ? "triangle" : "square";
  oscillator.frequency.value =
    type === "shoot"
      ? 280
      : type === "hit"
        ? 180
        : type === "kill"
          ? 420
          : type === "switch"
            ? 320
            : 160;

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.045, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  oscillator.start(now);
  oscillator.stop(now + duration);
}

function metricRatio(key, value) {
  const meta = metricMeta(key);
  if (LOW_IS_BAD.has(key)) {
    return clamp((meta.max - value) / (meta.max - meta.min), 0, 1);
  }
  return clamp((value - meta.min) / (meta.max - meta.min), 0, 1);
}

function spawnPoint() {
  const side = Math.floor(Math.random() * 4);
  if (side === 0) {
    return { x: Math.random() * state.width, y: -40, angle: -Math.PI / 2 };
  }
  if (side === 1) {
    return { x: state.width + 40, y: Math.random() * state.height, angle: 0 };
  }
  if (side === 2) {
    return { x: Math.random() * state.width, y: state.height + 40, angle: Math.PI / 2 };
  }
  return { x: -40, y: Math.random() * state.height, angle: Math.PI };
}

function circleHit(left, right) {
  return distance(left.x, left.y, right.x, right.y) <= left.radius + right.radius;
}

function distance(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by);
}

function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function hexWithAlpha(color, alpha) {
  const hex = color.replace("#", "");
  const integer = Number.parseInt(hex, 16);
  const red = (integer >> 16) & 255;
  const green = (integer >> 8) & 255;
  const blue = integer & 255;
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function shuffle(items) {
  const clone = [...items];
  for (let index = clone.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [clone[index], clone[swapIndex]] = [clone[swapIndex], clone[index]];
  }
  return clone;
}

function roundedRect(target, x, y, width, height, radius) {
  const safeRadius = Math.max(0, Math.min(radius, width / 2, height / 2));
  target.beginPath();
  target.moveTo(x + safeRadius, y);
  target.lineTo(x + width - safeRadius, y);
  target.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  target.lineTo(x + width, y + height - safeRadius);
  target.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
  target.lineTo(x + safeRadius, y + height);
  target.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  target.lineTo(x, y + safeRadius);
  target.quadraticCurveTo(x, y, x + safeRadius, y);
  target.closePath();
}
