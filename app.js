const RUN_DAYS = 5;
const TICKS_PER_DAY = 16;
const MINUTES_PER_TICK = 30;
const TICK_MS = 850;
const MAX_QUEUE = 7;
const STORAGE_KEY = "govagent-panic-best-run-v2";

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

const SEVERITY_CONFIG = {
  "SEV-1": { weight: 1.8, score: 90, patiencePenalty: 1 },
  "SEV-2": { weight: 1.35, score: 62, patiencePenalty: 0 },
  "SEV-3": { weight: 1.0, score: 42, patiencePenalty: 0 },
};

const LANE_CONFIG = {
  platform: {
    label: "Platform",
    blurb: "Inference, scaling, rollbacks, infra damage control.",
    color: "var(--teal)",
  },
  governance: {
    label: "Guardrails",
    blurb: "Security, policy, audit, credentialing, approvals.",
    color: "var(--amber)",
  },
  comms: {
    label: "Stakeholders",
    blurb: "PM calming, user reassurance, narrative containment.",
    color: "var(--green)",
  },
};

const KNOB_CONFIG = {
  concurrency: {
    label: "vLLM Concurrency",
    blurb: "More throughput, more fragility.",
    min: 0,
    max: 5,
    initial: 2,
  },
  guardrails: {
    label: "Guardrail Strictness",
    blurb: "Safer answers, slower everything.",
    min: 0,
    max: 5,
    initial: 2,
  },
  observability: {
    label: "Logging Depth",
    blurb: "Better forensics, worse invoices.",
    min: 0,
    max: 5,
    initial: 2,
  },
  spin: {
    label: "Narrative Shield",
    blurb: "Stakeholder calming with truth leakage risk.",
    min: 0,
    max: 5,
    initial: 1,
  },
};

const ACTION_CONFIG = {
  certs: {
    label: "Rotate Certs",
    copy: "Recover security posture fast. Platform work slows for two ticks.",
    cooldown: 7,
  },
  rollback: {
    label: "Rollback Release",
    copy: "Buy back latency and trust. Platform lane gets a free burst.",
    cooldown: 6,
  },
  blame: {
    label: "Blame Networking",
    copy: "Drop political pressure by exporting tasteful graphs and bad faith.",
    cooldown: 4,
  },
  docs: {
    label: "Call the Docs Hero",
    copy: "Asha boosts the selected ticket and steadies the room for three ticks.",
    cooldown: 6,
  },
};

const TICKET_BLUEPRINTS = [
  {
    id: "offline-brief",
    severity: "SEV-2",
    owner: "Citizen Services",
    requester: "pm",
    title: "Accurate, Safe, Offline, Friday",
    message:
      "Can you make the chatbot more accurate but also not know anything sensitive and also work offline and be done by Friday?",
    tags: ["offline", "trust", "politics"],
    demands: { platform: 34, governance: 30, comms: 16 },
    patience: 7,
    resolve: { security: 7, politics: -8, trust: 11, morale: 2 },
    miss: { politics: 16, trust: -12, morale: -5 },
  },
  {
    id: "revoked-key",
    severity: "SEV-1",
    owner: "Payments Sandbox",
    requester: "security",
    title: "Why Is My Key Revoked?",
    message:
      "Our director's key stopped working during a vendor demo. The vendor says your platform has become hostile to productivity.",
    tags: ["security", "identity", "demo"],
    demands: { platform: 20, governance: 38, comms: 18 },
    patience: 6,
    resolve: { security: 14, politics: -10, trust: 8 },
    miss: { security: -18, politics: 18, trust: -9 },
  },
  {
    id: "sovereign-multimodal",
    severity: "SEV-2",
    owner: "Innovation Lab",
    requester: "researcher",
    title: "Sovereign Multimodal by Next Sprint",
    message:
      "We need a sovereign multimodal model by next sprint. It should summarize PDFs, inspect photos, fill forms, and maybe do strategic planning.",
    tags: ["capacity", "pdf", "politics"],
    demands: { platform: 38, governance: 24, comms: 12 },
    patience: 7,
    resolve: { latency: -54, trust: 6, politics: -5, morale: 2 },
    miss: { latency: 88, burn: 12, politics: 11 },
  },
  {
    id: "hide-deploys",
    severity: "SEV-1",
    owner: "Minister Visit Prep",
    requester: "pm",
    title: "Hide the Failed Deployments",
    message:
      "The minister is visiting. Please hide the 17 failed deployments and make the dashboard look calm.",
    tags: ["demo", "politics", "trust"],
    demands: { platform: 24, governance: 18, comms: 34 },
    patience: 5,
    resolve: { politics: -14, trust: 5, morale: 1 },
    miss: { politics: 20, trust: -10, morale: -3 },
  },
  {
    id: "csv-catastrophe",
    severity: "SEV-2",
    owner: "Data Migration Team",
    requester: "serverless",
    title: "Forty Million Rows and a Dream",
    message:
      "Someone uploaded a CSV with 40 million rows and now embeddings are backfilling across every node. Can you keep the chatbot snappy during lunch traffic?",
    tags: ["data", "latency", "cost"],
    demands: { platform: 40, governance: 10, comms: 12 },
    patience: 7,
    resolve: { latency: -70, burn: -8, trust: 5 },
    miss: { latency: 96, burn: 16, morale: -4 },
  },
  {
    id: "audit-fire",
    severity: "SEV-1",
    owner: "Internal Audit",
    requester: "security",
    title: "Surprise Audit Walk-In",
    message:
      "Audit is downstairs asking for model lineage, access trails, and a reason why your redaction service has a TODO comment in prod.",
    tags: ["audit", "security", "politics"],
    demands: { platform: 14, governance: 40, comms: 18 },
    patience: 5,
    resolve: { security: 16, politics: -10, trust: 5 },
    miss: { security: -18, politics: 19, morale: -5 },
  },
  {
    id: "sentient-procurement",
    severity: "SEV-1",
    owner: "Procurement Portal",
    requester: "researcher",
    title: "Model Became Sentient About Procurement",
    message:
      "The summarizer started adding opinions about procurement policy and calling two vendors spiritually expensive.",
    tags: ["hallucination", "politics", "trust"],
    demands: { platform: 18, governance: 30, comms: 22 },
    patience: 6,
    resolve: { trust: 10, politics: -8, security: 4 },
    miss: { trust: -16, politics: 14 },
  },
  {
    id: "pdf-mystery",
    severity: "SEV-2",
    owner: "Records Office",
    requester: "ally",
    title: "Mystery PDF from 1998",
    message:
      "We found a scanned PDF from 1998 with sideways tables, coffee stains, and maybe a legal obligation. The assistant says the annex is a weather report.",
    tags: ["pdf", "hallucination", "compliance"],
    demands: { platform: 26, governance: 26, comms: 10 },
    patience: 8,
    resolve: { trust: 8, security: 6, morale: 2 },
    miss: { trust: -10, politics: 9, security: -6 },
  },
  {
    id: "dashboard-by-lunch",
    severity: "SEV-2",
    owner: "Project Steering Group",
    requester: "pm",
    title: "Dashboard by Lunch",
    message:
      "The project lead wants a dashboard by lunch with uptime, savings, trust score, and one line proving the AI is citizen-centric.",
    tags: ["dashboard", "politics", "trust"],
    demands: { platform: 16, governance: 16, comms: 30 },
    patience: 6,
    resolve: { politics: -8, trust: 8, morale: 1 },
    miss: { politics: 15, trust: -9 },
  },
  {
    id: "gpu-fallover",
    severity: "SEV-1",
    owner: "Inference Cluster",
    requester: "serverless",
    title: "GPU Node Fell Over Again",
    message:
      "One GPU node died, another is pretending not to notice, and the queue is now visible from orbit.",
    tags: ["gpu", "latency", "cost"],
    demands: { platform: 42, governance: 8, comms: 6 },
    patience: 5,
    resolve: { latency: -84, burn: -5, morale: 3 },
    miss: { latency: 110, burn: 18, politics: 8 },
  },
  {
    id: "vapt-drop",
    severity: "SEV-1",
    owner: "VAPT Vendor",
    requester: "security",
    title: "VAPT Finding During Demo Week",
    message:
      "The vendor found prompt injection via a helpful intern, lateral movement via a forgotten sandbox, and one screenshot that should not exist.",
    tags: ["security", "prompt", "audit"],
    demands: { platform: 18, governance: 40, comms: 14 },
    patience: 5,
    resolve: { security: 18, trust: 5, politics: -6 },
    miss: { security: -22, politics: 14, trust: -8 },
  },
  {
    id: "offline-tablet",
    severity: "SEV-2",
    owner: "Field Inspection Team",
    requester: "ally",
    title: "Tablet Agent in a Tunnel",
    message:
      "The inspection crew wants the assistant to work underground, offline, with photo analysis, and no battery drain because they have one charger for six people.",
    tags: ["offline", "vision", "politics"],
    demands: { platform: 34, governance: 20, comms: 16 },
    patience: 7,
    resolve: { trust: 8, politics: -7, morale: 4 },
    miss: { politics: 12, trust: -9, morale: -5 },
  },
];

const EVENTS = [
  {
    headline: "Surprise audit found a staging bucket named final-final-final.",
    effects: { security: -4, politics: 7, morale: -2 },
  },
  {
    headline: "Finance froze discretionary spend after somebody described GPUs as morale infrastructure.",
    effects: { burn: 8, politics: 4, morale: -2 },
  },
  {
    headline: "The intern found prompt injection and announced it in the all-hands chat.",
    effects: { security: -6, politics: 5, trust: -5 },
  },
  {
    headline: "A user who actually read the docs posted a calm workaround in the forum.",
    effects: { trust: 8, politics: -4, morale: 4 },
  },
  {
    headline: "A vendor offered a strategic accelerator deck instead of a fix.",
    effects: { politics: 6, trust: -2, morale: -1 },
  },
  {
    headline: "SEV-1: model became sentient about procurement for six glorious minutes.",
    effects: { politics: 9, trust: -5, morale: 1 },
  },
];

const METER_CONFIG = [
  { key: "latency", label: "P95 Latency", type: "low", formatter: (value) => `${Math.round(value)} ms` },
  { key: "burn", label: "Daily Burn", type: "low", formatter: (value) => `$${Math.round(value)}k` },
  { key: "security", label: "Security", type: "high", formatter: (value) => `${Math.round(value)}/100` },
  { key: "politics", label: "Political Damage", type: "low", formatter: (value) => `${Math.round(value)}/100` },
  { key: "trust", label: "User Trust", type: "high", formatter: (value) => `${Math.round(value)}/100` },
  { key: "morale", label: "Team Morale", type: "high", formatter: (value) => `${Math.round(value)}/100` },
];

const METRIC_LIMITS = {
  latency: { min: 120, max: 1200 },
  burn: { min: 20, max: 220 },
  security: { min: 0, max: 100 },
  politics: { min: 0, max: 100 },
  trust: { min: 0, max: 100 },
  morale: { min: 0, max: 100 },
};

const dom = {
  clockLabel: document.querySelector("#clock-label"),
  scoreLabel: document.querySelector("#score-label"),
  runStatus: document.querySelector("#run-status"),
  pauseButton: document.querySelector("#pause-button"),
  stepButton: document.querySelector("#step-button"),
  restartButton: document.querySelector("#restart-button"),
  meterStrip: document.querySelector("#meter-strip"),
  queueCount: document.querySelector("#queue-count"),
  queuePressure: document.querySelector("#queue-pressure"),
  ticketList: document.querySelector("#ticket-list"),
  selectedTitle: document.querySelector("#selected-title"),
  selectedSeverity: document.querySelector("#selected-severity"),
  selectedOwner: document.querySelector("#selected-owner"),
  selectedPatience: document.querySelector("#selected-patience"),
  selectedAssignments: document.querySelector("#selected-assignments"),
  selectedMessage: document.querySelector("#selected-message"),
  selectedTags: document.querySelector("#selected-tags"),
  demandGrid: document.querySelector("#demand-grid"),
  laneGrid: document.querySelector("#lane-grid"),
  knobGrid: document.querySelector("#knob-grid"),
  actionGrid: document.querySelector("#action-grid"),
  summaryGrid: document.querySelector("#summary-grid"),
  advisorFeed: document.querySelector("#advisor-feed"),
  logFeed: document.querySelector("#log-feed"),
  eventBanner: document.querySelector("#event-banner"),
  bestRun: document.querySelector("#best-run"),
  endDialog: document.querySelector("#end-dialog"),
  endKicker: document.querySelector("#end-kicker"),
  endTitle: document.querySelector("#end-title"),
  endSummary: document.querySelector("#end-summary"),
  endStats: document.querySelector("#end-stats"),
};

let timerId = null;

const state = {
  day: 1,
  tickInDay: 0,
  absoluteTick: 0,
  score: 0,
  paused: false,
  outcome: null,
  tickets: [],
  selectedTicketId: null,
  lanes: { platform: null, governance: null, comms: null },
  knobs: buildInitialKnobs(),
  cooldowns: buildInitialCooldowns(),
  temp: { platformFreeze: 0, docsBoost: 0 },
  metrics: defaultMetrics(),
  currentEvent: EVENTS[0],
  bestRun: loadBestRun(),
  resolvedCount: 0,
  droppedCount: 0,
  ticketIdCounter: 1,
  spawnClock: 0,
  spawnTarget: nextSpawnTarget(1),
  recentBlueprints: [],
  log: [],
};

init();

function init() {
  dom.pauseButton.addEventListener("click", togglePause);
  dom.stepButton.addEventListener("click", handleStep);
  dom.restartButton.addEventListener("click", resetRun);
  dom.endDialog.addEventListener("close", () => {
    if (state.outcome) {
      resetRun();
    }
  });
  window.addEventListener("keydown", handleKeydown);
  timerId = window.setInterval(runTick, TICK_MS);
  resetRun();
}

function resetRun() {
  state.day = 1;
  state.tickInDay = 0;
  state.absoluteTick = 0;
  state.score = 0;
  state.paused = false;
  state.outcome = null;
  state.tickets = [];
  state.selectedTicketId = null;
  state.lanes = { platform: null, governance: null, comms: null };
  state.knobs = buildInitialKnobs();
  state.cooldowns = buildInitialCooldowns();
  state.temp = { platformFreeze: 0, docsBoost: 0 };
  state.metrics = defaultMetrics();
  state.resolvedCount = 0;
  state.droppedCount = 0;
  state.ticketIdCounter = 1;
  state.spawnClock = 0;
  state.spawnTarget = nextSpawnTarget(1);
  state.recentBlueprints = [];
  state.log = [];
  state.currentEvent = randomItem(EVENTS);
  applyEffects(state.currentEvent.effects);
  addLog("Shift opened", state.currentEvent.headline);
  seedInbox();
  selectTicket(state.tickets[0]?.id ?? null);
  closeDialog();
  render();
}

function runTick(manual = false) {
  if ((state.paused && !manual) || state.outcome) {
    return;
  }

  state.absoluteTick += 1;
  state.tickInDay += 1;

  tickCooldowns();
  applyLaneWork();
  resolveCompletedTickets();
  applyTicketPressure();
  applyKnobDrift();
  maybeSpawnTicket();
  maybeTriggerEvent();

  const failure = checkFailure();
  if (failure) {
    finishRun("collapse", failure);
    return;
  }

  if (state.tickInDay >= TICKS_PER_DAY) {
    finishDay();
    if (state.outcome) {
      return;
    }
  }

  render();
}

function finishDay() {
  const dayBonus = Math.max(0, 26 - state.tickets.length * 3 + Math.round(state.metrics.trust / 10));
  state.score += dayBonus;
  addLog("Day closed", `You survived day ${state.day}. Daily bonus ${dayBonus}.`);
  state.day += 1;
  state.tickInDay = 0;
  state.spawnClock = 0;
  state.spawnTarget = nextSpawnTarget(state.day);
  applyEffects({ morale: 5, politics: -4, trust: 3 });

  if (state.day > RUN_DAYS) {
    finishRun("survived", "You kept the platform operational for five full work days.");
    return;
  }

  state.currentEvent = randomItem(EVENTS);
  applyEffects(state.currentEvent.effects);
  addLog(`Day ${state.day} briefing`, state.currentEvent.headline);

  if (state.tickets.length < 2) {
    spawnTicket();
  }
  selectTicket(state.selectedTicketId ?? state.tickets[0]?.id ?? null);
}

function seedInbox() {
  for (let count = 0; count < 3; count += 1) {
    spawnTicket();
  }
}

function spawnTicket(forcedId) {
  if (state.tickets.length >= MAX_QUEUE) {
    state.droppedCount += 1;
    applyEffects({ politics: 9, trust: -7, morale: -5 });
    addLog("Inbox overflow", "A new request hit a full queue and immediately became leadership material.");
    return;
  }

  const blueprint = forcedId
    ? TICKET_BLUEPRINTS.find((item) => item.id === forcedId)
    : pickBlueprint();
  if (!blueprint) {
    return;
  }

  const severity = SEVERITY_CONFIG[blueprint.severity];
  const difficulty = 1 + (state.day - 1) * 0.14;
  const patienceLoss = Math.floor((state.day - 1) * 0.35) + severity.patiencePenalty;
  const ticket = {
    id: `ticket-${state.ticketIdCounter++}`,
    blueprintId: blueprint.id,
    title: blueprint.title,
    owner: blueprint.owner,
    requester: blueprint.requester,
    severity: blueprint.severity,
    message: blueprint.message,
    tags: [...blueprint.tags],
    demands: scaleDemandSet(blueprint.demands, difficulty),
    progress: { platform: 0, governance: 0, comms: 0 },
    patience: Math.max(3, blueprint.patience - patienceLoss + randomInt(-1, 1)),
    maxPatience: Math.max(3, blueprint.patience - patienceLoss + randomInt(-1, 1)),
    resolve: { ...blueprint.resolve },
    miss: { ...blueprint.miss },
    score: severity.score + state.day * 6,
  };

  ticket.maxPatience = ticket.patience;
  state.tickets.push(ticket);
  state.recentBlueprints.push(blueprint.id);
  state.recentBlueprints = state.recentBlueprints.slice(-3);
  addLog("New ticket", `${ticket.title} landed from ${ticket.owner}.`);
  if (!state.selectedTicketId) {
    state.selectedTicketId = ticket.id;
  }
}

function pickBlueprint() {
  const pool = TICKET_BLUEPRINTS.filter(
    (item) => !state.recentBlueprints.includes(item.id),
  );
  return randomItem(pool.length ? pool : TICKET_BLUEPRINTS);
}

function maybeSpawnTicket() {
  state.spawnClock += 1 + state.day * 0.16 + Math.max(0, 3 - state.tickets.length) * 0.55;
  if (state.tickets.length < 2) {
    spawnTicket();
    state.spawnClock = 0;
    state.spawnTarget = nextSpawnTarget(state.day);
    return;
  }

  if (state.spawnClock >= state.spawnTarget) {
    spawnTicket();
    state.spawnClock = 0;
    state.spawnTarget = nextSpawnTarget(state.day);
  }
}

function maybeTriggerEvent() {
  if (state.absoluteTick === 0 || state.absoluteTick % 5 !== 0) {
    return;
  }
  state.currentEvent = randomItem(EVENTS);
  applyEffects(state.currentEvent.effects);
  addLog("Random event", state.currentEvent.headline);
}

function applyLaneWork() {
  Object.keys(LANE_CONFIG).forEach((laneKey) => {
    const ticket = getTicketById(state.lanes[laneKey]);
    if (!ticket) {
      state.lanes[laneKey] = null;
      return;
    }

    const remaining = ticket.demands[laneKey] - ticket.progress[laneKey];
    if (remaining <= 0) {
      return;
    }

    const throughput = getLaneThroughput(laneKey);
    ticket.progress[laneKey] = Math.min(ticket.demands[laneKey], ticket.progress[laneKey] + throughput);
  });
}

function resolveCompletedTickets() {
  const completed = state.tickets.filter((ticket) =>
    Object.keys(LANE_CONFIG).every((laneKey) => ticket.progress[laneKey] >= ticket.demands[laneKey]),
  );

  completed.forEach((ticket) => {
    const quality = ticket.maxPatience ? ticket.patience / ticket.maxPatience : 0.4;
    const multiplier = 0.8 + Math.max(0, quality) * 0.7;
    applyEffects(scaleEffects(ticket.resolve, multiplier));
    state.score += ticket.score * multiplier;
    state.resolvedCount += 1;
    addLog(
      `Closed: ${ticket.title}`,
      quality > 0.45
        ? "You landed it before the room became fully radioactive."
        : "You closed it late, sweaty, and barely ahead of a follow-up meeting.",
    );
    removeTicket(ticket.id);
  });
}

function applyTicketPressure() {
  const missed = [];

  state.tickets.forEach((ticket) => {
    applyEffects(getTicketPressure(ticket));
    ticket.patience -= 1;
    if (ticket.patience <= 0) {
      missed.push(ticket);
    }
  });

  missed.forEach((ticket) => {
    state.droppedCount += 1;
    state.score = Math.max(0, state.score - ticket.score * 0.45);
    applyEffects(scaleEffects(ticket.miss, 1 + (state.day - 1) * 0.12));
    addLog(
      `Escalated: ${ticket.title}`,
      "The queue aged out, leadership noticed, and your platform became a talking point.",
    );
    removeTicket(ticket.id);
  });
}

function applyKnobDrift() {
  const queueCount = state.tickets.length;
  const platformBacklog = countLaneDemandPressure("platform");
  const governanceBacklog = countLaneDemandPressure("governance");
  const commsBacklog = countLaneDemandPressure("comms");

  applyEffects({
    latency:
      5 +
      queueCount * 3 +
      state.knobs.guardrails * 2.3 -
      state.knobs.concurrency * 4.6 +
      (platformBacklog > 1 ? 4 : 0) +
      (state.temp.platformFreeze > 0 ? 20 : 0),
    burn:
      1.4 +
      state.knobs.concurrency * 1.7 +
      state.knobs.observability * 1.9 +
      Math.max(0, queueCount - 3) * 1.4,
    security:
      state.knobs.guardrails * 1.5 +
      state.knobs.observability * 1.7 -
      state.knobs.concurrency * 1.1 -
      Math.max(0, state.knobs.spin - 3) * 1.1 -
      (governanceBacklog > 1 ? 1.4 : 0),
    politics:
      (queueCount > 4 ? 1.8 : 0.5) -
      state.knobs.spin * 1.2 +
      (commsBacklog > 1 ? 1.3 : 0),
    trust:
      state.knobs.guardrails * 0.45 -
      (state.knobs.spin > 3 ? (state.knobs.spin - 3) * 1.45 : 0) -
      (state.metrics.latency > 650 ? 1.4 : 0) -
      (queueCount > 5 ? 1.2 : 0),
    morale:
      (queueCount < 3 ? 0.5 : -0.35) -
      (queueCount > 4 ? 1.5 : 0) -
      (state.metrics.burn > 140 ? 1.1 : 0) -
      (state.knobs.observability > 3 ? 0.4 : 0),
  });
}

function tickCooldowns() {
  Object.keys(state.cooldowns).forEach((key) => {
    if (state.cooldowns[key] > 0) {
      state.cooldowns[key] -= 1;
    }
  });

  if (state.temp.platformFreeze > 0) {
    state.temp.platformFreeze -= 1;
  }
  if (state.temp.docsBoost > 0) {
    state.temp.docsBoost -= 1;
  }
}

function togglePause() {
  state.paused = !state.paused;
  render();
}

function handleStep() {
  if (!state.paused) {
    state.paused = true;
  }
  runTick(true);
}

function handleKeydown(event) {
  if (event.key === " ") {
    event.preventDefault();
    togglePause();
    return;
  }

  if (event.key.toLowerCase() === "n") {
    event.preventDefault();
    handleStep();
    return;
  }

  if (state.outcome || dom.endDialog.open) {
    return;
  }

  if (["1", "2", "3"].includes(event.key)) {
    const laneKeys = ["platform", "governance", "comms"];
    toggleLaneAssignment(laneKeys[Number(event.key) - 1]);
  }
}

function toggleLaneAssignment(laneKey) {
  const selectedTicket = getSelectedTicket();
  if (!selectedTicket || state.outcome) {
    return;
  }

  state.lanes[laneKey] = state.lanes[laneKey] === selectedTicket.id ? null : selectedTicket.id;
  render();
}

function adjustKnob(key, delta) {
  if (state.outcome) {
    return;
  }
  const config = KNOB_CONFIG[key];
  const next = clamp(state.knobs[key] + delta, config.min, config.max);
  state.knobs[key] = next;
  render();
}

function useAction(key) {
  if (state.outcome || state.cooldowns[key] > 0) {
    return;
  }

  const selected = getSelectedTicket();

  if (key === "certs") {
    applyEffects({ security: 18, politics: -4, trust: -2, latency: 35 });
    state.temp.platformFreeze = 2;
    addLog("Rotate certs", "Security posture improved immediately. Platform throughput took a short hit.");
  }

  if (key === "rollback") {
    applyEffects({ latency: -85, trust: 5, burn: -5, morale: -2 });
    state.tickets.forEach((ticket) => {
      ticket.progress.platform = Math.min(ticket.demands.platform, ticket.progress.platform + 14);
    });
    addLog("Rollback release", "The cursed release went away. So did some confidence.");
  }

  if (key === "blame") {
    applyEffects({ politics: -16, trust: -10, morale: 2 });
    addLog("Blame networking", "The room calmed down, but nobody trusted the explanation.");
  }

  if (key === "docs") {
    if (selected) {
      Object.keys(LANE_CONFIG).forEach((laneKey) => {
        const remaining = selected.demands[laneKey] - selected.progress[laneKey];
        if (remaining > 0) {
          selected.progress[laneKey] = Math.min(
            selected.demands[laneKey],
            selected.progress[laneKey] + 10,
          );
        }
      });
      addLog("Call the docs hero", `${CHARACTER_ROSTER.ally.name} found the sane path through ${selected.title}.`);
    } else {
      addLog("Call the docs hero", `${CHARACTER_ROSTER.ally.name} stabilized the room without a selected ticket.`);
    }
    applyEffects({ trust: 8, morale: 4, burn: -2 });
    state.temp.docsBoost = 3;
  }

  state.cooldowns[key] = ACTION_CONFIG[key].cooldown;
  resolveCompletedTickets();
  const failure = checkFailure();
  if (failure) {
    finishRun("collapse", failure);
    return;
  }
  render();
}

function finishRun(kind, summary) {
  state.outcome = kind;
  state.paused = true;
  maybeStoreBestRun();
  render();

  dom.endKicker.textContent = kind === "survived" ? "Shift Complete" : "Platform Collapse";
  dom.endTitle.textContent =
    kind === "survived" ? "You kept the stack breathing." : "The office has entered legend status.";
  dom.endSummary.textContent = summary;
  dom.endStats.innerHTML = [
    buildEndStat("Score", String(Math.round(state.score)), "good-text"),
    buildEndStat("Resolved", String(state.resolvedCount), "good-text"),
    buildEndStat("Escalated", String(state.droppedCount), state.droppedCount > 3 ? "bad-text" : "warn-text"),
    buildEndStat("Final Status", computeRunStatus(), statusToneClass()),
  ].join("");
  dom.endDialog.showModal();
}

function render() {
  dom.clockLabel.textContent = formatClock();
  dom.scoreLabel.textContent = String(Math.round(state.score));
  dom.runStatus.textContent = state.outcome ? (state.outcome === "survived" ? "Cleared" : "Collapsed") : computeRunStatus();
  dom.pauseButton.textContent = state.paused ? "Resume" : "Pause";
  dom.bestRun.textContent = state.bestRun ? `Best ${Math.round(state.bestRun.score)}` : "No clean shift yet";
  dom.eventBanner.textContent = state.currentEvent.headline;

  renderMeters();
  renderQueue();
  renderSelectedTicket();
  renderLanes();
  renderKnobs();
  renderActions();
  renderSummary();
  renderAdvisors();
  renderLog();
}

function renderMeters() {
  dom.meterStrip.innerHTML = "";
  METER_CONFIG.forEach((config) => {
    const value = state.metrics[config.key];
    const ratio = meterRatio(config.key, value);
    const descriptor =
      ratio > 0.7 ? "healthy" : ratio > 0.42 ? "strained" : "critical";
    const tone = ratio > 0.7 ? "var(--green)" : ratio > 0.42 ? "var(--amber)" : "var(--red)";
    const element = document.createElement("div");
    element.className = "meter";
    element.innerHTML = `
      <div class="meter-head">
        <span class="section-label">${config.label}</span>
        <strong>${config.formatter(value)}</strong>
      </div>
      <small>${descriptor}</small>
      <div class="meter-bar">
        <span class="meter-fill" style="width:${Math.round(ratio * 100)}%; background:${tone};"></span>
      </div>
    `;
    dom.meterStrip.append(element);
  });
}

function renderQueue() {
  const sorted = [...state.tickets].sort(compareTickets);
  dom.queueCount.textContent = `${state.tickets.length} / ${MAX_QUEUE} tickets`;
  dom.queuePressure.textContent = queuePressureLabel();
  dom.ticketList.innerHTML = "";

  if (!sorted.length) {
    const idle = document.createElement("div");
    idle.className = "log-item";
    idle.innerHTML = `<strong>Inbox clear</strong><p>Enjoy the silence. It will be brief.</p>`;
    dom.ticketList.append(idle);
    return;
  }

  sorted.forEach((ticket) => {
    const assignments = assignedLanes(ticket.id);
    const card = document.createElement("button");
    card.type = "button";
    card.className = [
      "ticket-card",
      state.selectedTicketId === ticket.id ? "is-selected" : "",
      severityClass(ticket.severity),
    ]
      .filter(Boolean)
      .join(" ");
    card.addEventListener("click", () => selectTicket(ticket.id));
    card.innerHTML = `
      <div class="ticket-head">
        <div>
          <span class="severity-badge">${ticket.severity}</span>
          <strong>${ticket.title}</strong>
        </div>
        <span class="pill">${CHARACTER_ROSTER[ticket.requester].role}</span>
      </div>
      <div class="ticket-subhead">
        <span>${ticket.owner}</span>
        <span>${Math.max(0, ticket.patience)} ticks left</span>
      </div>
      <p>${ticket.message}</p>
      <div class="patience">
        <div class="patience-row">
          <span>Patience</span>
          <span>${Math.max(0, ticket.patience)} / ${ticket.maxPatience}</span>
        </div>
        <div class="patience-bar">
          <span class="patience-fill" style="width:${Math.round(
            (Math.max(0, ticket.patience) / ticket.maxPatience) * 100,
          )}%; background:${patienceTone(ticket)};"></span>
        </div>
      </div>
      <div class="tag-row">${ticket.tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}</div>
      <div class="assignment-row">
        ${
          assignments.length
            ? assignments.map((lane) => `<span class="assignment-chip">${LANE_CONFIG[lane].label}</span>`).join("")
            : `<span class="tag">Unassigned</span>`
        }
      </div>
    `;
    dom.ticketList.append(card);
  });
}

function renderSelectedTicket() {
  const ticket = getSelectedTicket();
  if (!ticket) {
    dom.selectedTitle.textContent = "Select a ticket";
    dom.selectedSeverity.textContent = "SEV-0";
    dom.selectedOwner.textContent = "No requester selected";
    dom.selectedPatience.textContent = "0 / 0";
    dom.selectedAssignments.textContent = "None";
    dom.selectedMessage.textContent =
      "Pick a ticket from the inbox. Route it through Platform, Guardrails, and Stakeholders before it detonates in public.";
    dom.selectedTags.innerHTML = "";
    dom.demandGrid.innerHTML = "";
    return;
  }

  const requester = CHARACTER_ROSTER[ticket.requester];
  dom.selectedTitle.textContent = ticket.title;
  dom.selectedSeverity.textContent = ticket.severity;
  dom.selectedOwner.textContent = `${requester.name} · ${ticket.owner}`;
  dom.selectedPatience.textContent = `${Math.max(0, ticket.patience)} / ${ticket.maxPatience} ticks`;
  dom.selectedAssignments.textContent =
    assignedLanes(ticket.id).map((lane) => LANE_CONFIG[lane].label).join(", ") || "Not routed";
  dom.selectedMessage.textContent = ticket.message;
  dom.selectedTags.innerHTML = ticket.tags.map((tag) => `<span class="tag">${tag}</span>`).join("");
  dom.demandGrid.innerHTML = Object.keys(LANE_CONFIG)
    .map((laneKey) => {
      const demand = ticket.demands[laneKey];
      const progress = ticket.progress[laneKey];
      const ratio = demand ? Math.min(1, progress / demand) : 1;
      return `
        <div class="demand-card">
          <strong>${LANE_CONFIG[laneKey].label}</strong>
          <div class="demand-copy">
            <span>${Math.round(progress)} / ${Math.round(demand)}</span>
            <span>${Math.round(ratio * 100)}%</span>
          </div>
          <div class="demand-bar">
            <span class="demand-fill" style="width:${Math.round(ratio * 100)}%; background:${LANE_CONFIG[laneKey].color};"></span>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderLanes() {
  dom.laneGrid.innerHTML = "";

  Object.keys(LANE_CONFIG).forEach((laneKey) => {
    const lane = LANE_CONFIG[laneKey];
    const occupant = getTicketById(state.lanes[laneKey]);
    const selected = getSelectedTicket();
    const card = document.createElement("div");
    card.className = `lane-card ${occupant ? "active" : ""}`;
    if (occupant) {
      card.addEventListener("click", () => selectTicket(occupant.id));
    }

    const buttonLabel = !selected
      ? "Select a ticket"
      : state.lanes[laneKey] === selected.id
        ? "Remove Selected"
        : `Route Selected`;

    card.innerHTML = `
      <div class="lane-head">
        <div>
          <strong>${lane.label}</strong>
          <p class="action-copy">${lane.blurb}</p>
        </div>
        <span class="pill">${Math.round(getLaneThroughput(laneKey))} / tick</span>
      </div>
      <div class="lane-occupant ${occupant ? "" : "empty"}">
        ${
          occupant
            ? `<strong>${occupant.title}</strong><p>${Math.max(0, occupant.patience)} ticks left</p>`
            : `Idle lane. Click route after selecting a ticket.`
        }
      </div>
      <button class="lane-button" type="button" ${selected ? "" : "disabled"}>
        ${buttonLabel}
      </button>
    `;

    const button = card.querySelector(".lane-button");
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleLaneAssignment(laneKey);
    });

    dom.laneGrid.append(card);
  });
}

function renderKnobs() {
  dom.knobGrid.innerHTML = "";

  Object.entries(KNOB_CONFIG).forEach(([key, config]) => {
    const card = document.createElement("div");
    card.className = "knob-card";
    card.innerHTML = `
      <strong>${config.label}</strong>
      <p class="action-copy">${config.blurb}</p>
      <div class="knob-controls">
        <button class="knob-adjust" type="button" ${state.knobs[key] <= config.min ? "disabled" : ""}>-</button>
        <div class="knob-value">${state.knobs[key]}</div>
        <button class="knob-adjust" type="button" ${state.knobs[key] >= config.max ? "disabled" : ""}>+</button>
      </div>
    `;

    const [minusButton, plusButton] = card.querySelectorAll(".knob-adjust");
    minusButton.addEventListener("click", () => adjustKnob(key, -1));
    plusButton.addEventListener("click", () => adjustKnob(key, 1));
    dom.knobGrid.append(card);
  });
}

function renderActions() {
  dom.actionGrid.innerHTML = "";

  Object.entries(ACTION_CONFIG).forEach(([key, config]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "action-button";
    button.disabled = state.cooldowns[key] > 0;
    button.addEventListener("click", () => useAction(key));
    button.innerHTML = `
      <div class="action-head">
        <strong>${config.label}</strong>
        <span class="cooldown">${state.cooldowns[key] > 0 ? `${state.cooldowns[key]} ticks` : "Ready"}</span>
      </div>
      <p class="action-copy">${config.copy}</p>
    `;
    dom.actionGrid.append(button);
  });
}

function renderSummary() {
  const cards = [
    { label: "Resolved", value: String(state.resolvedCount), tone: "good-text", copy: "Tickets closed before they became folklore." },
    { label: "Escalated", value: String(state.droppedCount), tone: state.droppedCount > 3 ? "bad-text" : "warn-text", copy: "Requests you let mature into politics." },
    { label: "Queue", value: `${state.tickets.length}/${MAX_QUEUE}`, tone: queueToneClass(), copy: queuePressureLabel() },
    { label: "Days Left", value: String(Math.max(0, RUN_DAYS - state.day + 1)), tone: statusToneClass(), copy: "Survive the remaining public-sector daylight." },
    { label: "Lane Load", value: `${Object.values(state.lanes).filter(Boolean).length}/3`, tone: "warn-text", copy: "Active workstreams in flight right now." },
    { label: "Hotkeys", value: "Space · N · 1 2 3", tone: "good-text", copy: "Pause, single-step, route lanes." },
  ];

  dom.summaryGrid.innerHTML = cards
    .map(
      (card) => `
        <div class="summary-card">
          <div class="summary-head">
            <span class="section-label">${card.label}</span>
            <strong class="${card.tone}">${card.value}</strong>
          </div>
          <p>${card.copy}</p>
        </div>
      `,
    )
    .join("");
}

function renderAdvisors() {
  const selected = getSelectedTicket();
  const messages = [
    {
      character: "pm",
      text:
        state.metrics.politics > 60
          ? "Leadership needs a cleaner story in the next five minutes."
          : selected?.tags.includes("demo")
            ? "Can we solve this in a way that also photographs well?"
            : "If you can make this look intentional, I can sell it upstairs.",
    },
    {
      character: "security",
      text:
        state.metrics.security < 40
          ? "We are one shortcut away from becoming a case study."
          : selected?.tags.includes("security") || selected?.tags.includes("audit")
            ? "Document it before audit invents its own version."
            : "I am tolerating this only because the logs still have a pulse.",
    },
    {
      character: "researcher",
      text:
        selected?.tags.includes("capacity") || selected?.tags.includes("gpu")
          ? "This would vanish with six more GPUs and fewer earthly constraints."
          : selected?.tags.includes("hallucination") || selected?.tags.includes("pdf")
            ? "Reality is just badly formatted today."
            : "The model is not wrong. The office is simply low-bandwidth.",
    },
    {
      character: state.metrics.trust < 45 ? "ally" : "serverless",
      text:
        state.metrics.trust < 45
          ? "There is probably already a documented path through this mess."
          : "We could solve half of this by moving the other half somewhere serverless.",
    },
  ];

  dom.advisorFeed.innerHTML = messages
    .map((message) => {
      const person = CHARACTER_ROSTER[message.character];
      return `
        <div class="advisor-card">
          <img class="avatar" src="${person.avatar}" alt="${person.name}" />
          <div>
            <strong>${person.name}</strong>
            <p>${message.text}</p>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderLog() {
  dom.logFeed.innerHTML = "";

  if (!state.log.length) {
    dom.logFeed.innerHTML = `<div class="log-item"><strong>No incidents yet</strong><p>The silence is temporary.</p></div>`;
    return;
  }

  state.log.slice(0, 8).forEach((entry) => {
    const item = document.createElement("div");
    item.className = "log-item";
    item.innerHTML = `<strong>${entry.title}</strong><p>${entry.body}</p>`;
    dom.logFeed.append(item);
  });
}

function selectTicket(ticketId) {
  state.selectedTicketId = ticketId && getTicketById(ticketId) ? ticketId : state.tickets[0]?.id ?? null;
  render();
}

function removeTicket(ticketId) {
  Object.keys(state.lanes).forEach((laneKey) => {
    if (state.lanes[laneKey] === ticketId) {
      state.lanes[laneKey] = null;
    }
  });

  state.tickets = state.tickets.filter((ticket) => ticket.id !== ticketId);
  if (state.selectedTicketId === ticketId) {
    state.selectedTicketId = [...state.tickets].sort(compareTickets)[0]?.id ?? null;
  }
}

function getTicketById(ticketId) {
  return state.tickets.find((ticket) => ticket.id === ticketId) ?? null;
}

function getSelectedTicket() {
  return getTicketById(state.selectedTicketId);
}

function assignedLanes(ticketId) {
  return Object.entries(state.lanes)
    .filter(([, assignedId]) => assignedId === ticketId)
    .map(([laneKey]) => laneKey);
}

function getLaneThroughput(laneKey) {
  if (laneKey === "platform") {
    return Math.max(
      4,
      12 +
        state.knobs.concurrency * 3 -
        state.knobs.guardrails * 1.1 -
        (state.temp.platformFreeze > 0 ? 8 : 0),
    );
  }
  if (laneKey === "governance") {
    return Math.max(
      4,
      10 +
        state.knobs.guardrails * 3 +
        state.knobs.observability * 1.5 -
        state.knobs.concurrency * 0.9,
    );
  }
  return Math.max(
    4,
    10 +
      state.knobs.spin * 3 +
      (state.temp.docsBoost > 0 ? 4 : 0) -
      Math.max(0, state.knobs.spin - 3) * 1.4,
  );
}

function getTicketPressure(ticket) {
  const severity = SEVERITY_CONFIG[ticket.severity].weight;
  const effects = {
    latency: 1 + severity,
    burn: 0.4 + severity * 0.4,
    security: 0,
    politics: 0,
    trust: 0,
    morale: 0,
  };

  if (hasAnyTag(ticket, ["offline", "capacity", "gpu", "latency", "data"])) {
    effects.latency += 3.5 * severity;
    effects.burn += 0.8 * severity;
  }
  if (hasAnyTag(ticket, ["security", "audit", "identity", "prompt", "compliance"])) {
    effects.security -= 1.7 * severity;
    effects.politics += 0.9 * severity;
  }
  if (hasAnyTag(ticket, ["demo", "politics", "dashboard"])) {
    effects.politics += 1.3 * severity;
    effects.trust -= 0.7 * severity;
  }
  if (hasAnyTag(ticket, ["hallucination", "pdf", "trust"])) {
    effects.trust -= 1.5 * severity;
  }
  if (hasAnyTag(ticket, ["cost"])) {
    effects.burn += 1.8 * severity;
  }
  if (ticket.patience <= 2) {
    effects.politics += 2.1 * severity;
    effects.trust -= 1.1 * severity;
    effects.morale -= 0.9 * severity;
  }

  return effects;
}

function checkFailure() {
  if (state.metrics.latency >= 1050) {
    return "P95 latency crossed 1050 ms and every dashboard in the building became a liability.";
  }
  if (state.metrics.burn >= 200) {
    return "Daily burn crossed the number finance uses when careers stop being hypothetical.";
  }
  if (state.metrics.security <= 12) {
    return "Security posture collapsed and now even the interns are threat models.";
  }
  if (state.metrics.politics >= 92) {
    return "Political damage reached ministerial briefing threshold.";
  }
  if (state.metrics.trust <= 10) {
    return "Users gave up and returned to spreadsheets with visible relief.";
  }
  if (state.metrics.morale <= 12) {
    return "Team morale cratered and the on-call rota became folklore.";
  }
  return "";
}

function applyEffects(effects) {
  Object.entries(effects).forEach(([key, value]) => {
    state.metrics[key] = clamp(state.metrics[key] + value, METRIC_LIMITS[key].min, METRIC_LIMITS[key].max);
  });
}

function scaleEffects(effects, factor) {
  return Object.fromEntries(
    Object.entries(effects).map(([key, value]) => [key, value * factor]),
  );
}

function renderStatusClass(value) {
  if (value > 0.7) {
    return "good-text";
  }
  if (value > 0.42) {
    return "warn-text";
  }
  return "bad-text";
}

function meterRatio(key, value) {
  if (key === "latency") {
    return clamp((1050 - value) / 930, 0, 1);
  }
  if (key === "burn") {
    return clamp((200 - value) / 180, 0, 1);
  }
  if (key === "politics") {
    return clamp((100 - value) / 100, 0, 1);
  }
  return clamp(value / 100, 0, 1);
}

function queuePressureLabel() {
  if (state.tickets.length <= 2) {
    return "Stable";
  }
  if (state.tickets.length <= 4) {
    return "Hot";
  }
  if (state.tickets.length <= 6) {
    return "Smoking";
  }
  return "Theatrical";
}

function computeRunStatus() {
  const worstRatio = Math.min(
    ...METER_CONFIG.map((config) => meterRatio(config.key, state.metrics[config.key])),
  );
  if (worstRatio > 0.72 && state.tickets.length <= 3) {
    return "Holding";
  }
  if (worstRatio > 0.48) {
    return "Under Pressure";
  }
  if (worstRatio > 0.28) {
    return "Smoking";
  }
  return "Ministerially Dangerous";
}

function statusToneClass() {
  const worstRatio = Math.min(
    ...METER_CONFIG.map((config) => meterRatio(config.key, state.metrics[config.key])),
  );
  return renderStatusClass(worstRatio);
}

function queueToneClass() {
  if (state.tickets.length <= 2) {
    return "good-text";
  }
  if (state.tickets.length <= 4) {
    return "warn-text";
  }
  return "bad-text";
}

function patienceTone(ticket) {
  const ratio = ticket.maxPatience ? ticket.patience / ticket.maxPatience : 0;
  if (ratio > 0.55) {
    return "var(--green)";
  }
  if (ratio > 0.25) {
    return "var(--amber)";
  }
  return "var(--red)";
}

function countLaneDemandPressure(laneKey) {
  return state.tickets.filter((ticket) => ticket.demands[laneKey] - ticket.progress[laneKey] > 16).length;
}

function formatClock() {
  const totalMinutes = 9 * 60 + state.tickInDay * MINUTES_PER_TICK;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `Day ${Math.min(state.day, RUN_DAYS)} · ${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function addLog(title, body) {
  state.log.unshift({ title, body });
  state.log = state.log.slice(0, 14);
}

function maybeStoreBestRun() {
  if (!state.bestRun || state.score > state.bestRun.score) {
    state.bestRun = {
      score: state.score,
      resolved: state.resolvedCount,
      day: state.day,
      outcome: state.outcome,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.bestRun));
  }
}

function loadBestRun() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
  } catch {
    return null;
  }
}

function compareTickets(left, right) {
  if (!left.id || !right.id) {
    return 0;
  }
  const severityDelta =
    SEVERITY_CONFIG[right.severity].weight - SEVERITY_CONFIG[left.severity].weight;
  if (severityDelta !== 0) {
    return severityDelta;
  }
  return left.patience - right.patience;
}

function severityClass(severity) {
  if (severity === "SEV-1") {
    return "is-sev1";
  }
  if (severity === "SEV-2") {
    return "is-sev2";
  }
  return "is-sev3";
}

function buildEndStat(label, value, tone) {
  return `
    <div class="end-stat">
      <span class="section-label">${label}</span>
      <strong class="${tone}">${value}</strong>
    </div>
  `;
}

function nextSpawnTarget(day) {
  return Math.max(1.9, 3.2 + Math.random() * 1.3 - day * 0.15);
}

function scaleDemandSet(demands, factor) {
  return Object.fromEntries(
    Object.entries(demands).map(([laneKey, value]) => [laneKey, Math.round(value * factor)]),
  );
}

function buildInitialKnobs() {
  return Object.fromEntries(
    Object.entries(KNOB_CONFIG).map(([key, config]) => [key, config.initial]),
  );
}

function buildInitialCooldowns() {
  return Object.fromEntries(
    Object.keys(ACTION_CONFIG).map((key) => [key, 0]),
  );
}

function defaultMetrics() {
  return {
    latency: 390,
    burn: 82,
    security: 72,
    politics: 18,
    trust: 62,
    morale: 66,
  };
}

function closeDialog() {
  if (dom.endDialog.open) {
    dom.endDialog.close();
  }
}

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function hasAnyTag(ticket, tags) {
  return tags.some((tag) => ticket.tags.includes(tag));
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
