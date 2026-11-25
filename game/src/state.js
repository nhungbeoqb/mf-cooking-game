// Midnight Noodle Cart — state.js
// One clear job: the cart's state — screen, tickets, bowl, pots,
// coins, hearts, combos, stars and the save file. No drawing here.

import { NIGHTS, AFTER_HOURS, RECIPES, CUSTOMERS, TUNING, ING_BY_ID } from './config.js';

const SAVE_KEY = 'midnight-noodle-cart-save-v1';

// A tiny seeded RNG so screenshots stage the same way every run.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return { stars: {}, bestCoins: {}, endlessUnlocked: false, totalServed: 0 };
    const parsed = JSON.parse(raw);
    return {
      stars: parsed.stars || {},
      bestCoins: parsed.bestCoins || {},
      endlessUnlocked: !!parsed.endlessUnlocked,
      totalServed: parsed.totalServed || 0,
    };
  } catch {
    return { stars: {}, bestCoins: {}, endlessUnlocked: false, totalServed: 0 };
  }
}

export function storeSave(save) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch {
    // A hosted page that blocks storage still plays; progress just is not kept.
  }
}

export function starsForCoins(night, coins) {
  let stars = 0;
  for (const bar of night.stars) if (coins >= bar) stars++;
  return stars;
}

export function nightById(id) {
  if (id === 0) return AFTER_HOURS;
  return NIGHTS.find((n) => n.id === id) || NIGHTS[0];
}

// A fresh run of one night. `rng` drives spawns and customer picks.
export function newRun(night, rng) {
  return {
    screen: 'playing', // title | playing | paused | nightEnd | failed
    night,
    rng,
    timeLeftSec: night.lengthSec,
    elapsedSec: 0,
    spawnTimerSec: 2.5,
    tickets: [],
    nextTicketId: 1,
    bowl: [], // ingredient ids currently in the active bowl
    pots: [
      { state: 'empty', timerSec: 0 }, // empty | boiling | ready | burnt
      { state: 'empty', timerSec: 0 },
    ],
    coins: 0,
    served: 0,
    bestCombo: 0,
    combo: 0,
    comboTimerSec: 0,
    hearts: TUNING.hearts,
    rush: false,
    rushAnnounced: false,
    message: '',
    messageTimerSec: 0,
    shakeTimerSec: 0,
    starsEarned: 0,
    steam: [],
    floaters: [], // "+18" coin popups
    servedFlashId: null,
    endReason: '',
  };
}

function pickRecipe(night, rng) {
  const list = night.recipes;
  return list[Math.floor(rng() * list.length)];
}

function pickCustomer(rng) {
  return CUSTOMERS[Math.floor(rng() * CUSTOMERS.length)];
}

export function spawnOrder(run) {
  const recipe = RECIPES[pickRecipe(run.night, run.rng)];
  const customer = pickCustomer(run.rng);
  const patience = run.night.patienceSec;
  run.tickets.push({
    id: run.nextTicketId++,
    recipe,
    customer,
    patienceSec: patience,
    patienceMaxSec: patience,
    bornAtSec: run.elapsedSec,
  });
  return run.tickets[run.tickets.length - 1];
}

// The bowl matches a ticket when it holds exactly the recipe's set.
export function bowlMatchesTicket(bowl, ticket) {
  const needs = ticket.recipe.needs;
  if (bowl.length !== needs.length) return false;
  return needs.every((id) => bowl.includes(id));
}

export function bowlMatchesAnyTicket(run) {
  return run.tickets.find((t) => bowlMatchesTicket(run.bowl, t)) || null;
}

export function addIngredientToBowl(run, ingredientId) {
  if (run.screen !== 'playing') return false;
  if (run.bowl.includes(ingredientId)) return false;
  if (ingredientId === 'noodles') return false; // noodles only come from a pot
  run.bowl.push(ingredientId);
  return true;
}

export function startBoiling(run, potIndex) {
  const pot = run.pots[potIndex];
  if (!pot || run.screen !== 'playing') return 'no';
  if (pot.state === 'empty') {
    pot.state = 'boiling';
    pot.timerSec = 0;
    return 'started';
  }
  if (pot.state === 'ready') {
    if (run.bowl.includes('noodles')) return 'no';
    run.bowl.push('noodles');
    pot.state = 'empty';
    pot.timerSec = 0;
    return 'added';
  }
  if (pot.state === 'burnt') {
    pot.state = 'empty';
    pot.timerSec = 0;
    return 'dumped';
  }
  return 'no';
}

export function clearBowl(run) {
  run.bowl = [];
}

// Serve the bowl to a ticket. Returns an outcome object for feedback.
export function serveBowlToTicket(run, ticketId) {
  const ticket = run.tickets.find((t) => t.id === ticketId);
  if (!ticket || run.screen !== 'playing') return { ok: false, reason: 'no-ticket' };
  if (run.bowl.length === 0) return { ok: false, reason: 'empty-bowl' };
  if (!bowlMatchesTicket(run.bowl, ticket)) {
    for (const t of run.tickets) t.patienceSec *= 1 - TUNING.wrongServePatiencePenalty;
    run.shakeTimerSec = 0.35;
    run.combo = 0;
    run.comboTimerSec = 0;
    return { ok: false, reason: 'wrong-order', ticket };
  }
  const patienceLeft = Math.max(0, ticket.patienceSec / ticket.patienceMaxSec);
  const tip = Math.round(patienceLeft * TUNING.tipMax);
  run.combo = run.comboTimerSec > 0 ? Math.min(run.combo + 1, TUNING.maxCombo) : 1;
  run.comboTimerSec = TUNING.comboWindowSec;
  run.bestCombo = Math.max(run.bestCombo, run.combo);
  const rushMult = run.rush ? TUNING.rushCoinMult : 1;
  const earned = (ticket.recipe.price + tip) * run.combo * rushMult;
  run.coins += earned;
  run.served++;
  run.tickets = run.tickets.filter((t) => t.id !== ticketId);
  run.bowl = [];
  run.servedFlashId = ticketId;
  run.floaters.push({ text: `+${earned}`, x: 640, y: 300, lifeSec: 1.2, color: '#2E9E5B' });
  return { ok: true, earned, combo: run.combo, tip, ticket };
}

export function tickRun(run, dtSec) {
  if (run.screen !== 'playing') return;
  run.elapsedSec += dtSec;
  if (run.night.lengthSec !== Infinity) {
    run.timeLeftSec = Math.max(0, run.night.lengthSec - run.elapsedSec);
  }
  // RUSH HOUR: the last stretch of the shift.
  if (!run.rush && run.night.lengthSec !== Infinity && run.timeLeftSec <= TUNING.rushAtSecLeft) {
    run.rush = true;
    run.rushAnnounced = true;
    run.message = 'RUSH HOUR — the 3am crowd!';
    run.messageTimerSec = 2.5;
  }
  // Pots boil, then burn. One clock runs from the boil start: ready at
  // boilSec, burnt at burnSec — the timer is never reset between stages.
  for (const pot of run.pots) {
    if (pot.state === 'boiling') {
      pot.timerSec += dtSec;
      if (pot.timerSec >= TUNING.boilSec) {
        pot.state = 'ready';
      }
    } else if (pot.state === 'ready') {
      pot.timerSec += dtSec;
      if (pot.timerSec >= TUNING.burnSec) {
        pot.state = 'burnt';
        pot.timerSec = TUNING.burnSec;
      }
    }
  }
  // Patience drains; an empty ticket walks away angry.
  const drainMult = run.rush ? TUNING.rushPatienceMult : 1;
  for (const ticket of [...run.tickets]) {
    ticket.patienceSec -= dtSec * drainMult;
    if (ticket.patienceSec <= 0) {
      run.tickets = run.tickets.filter((t) => t.id !== ticket.id);
      run.hearts--;
      run.combo = 0;
      run.comboTimerSec = 0;
      run.message = `${ticket.customer.name} walked away hungry…`;
      run.messageTimerSec = 2.2;
    }
  }
  // New orders arrive on a timer.
  run.spawnTimerSec -= dtSec;
  const interval = run.night.spawnEverySec * (run.rush ? TUNING.rushSpawnMult : 1);
  if (run.spawnTimerSec <= 0 && run.tickets.length < run.night.maxTickets) {
    spawnOrder(run);
    run.spawnTimerSec = interval * (0.85 + run.rng() * 0.3);
  }
  // Combo clock.
  if (run.comboTimerSec > 0) {
    run.comboTimerSec -= dtSec;
    if (run.comboTimerSec <= 0) run.combo = 0;
  }
  if (run.messageTimerSec > 0) run.messageTimerSec -= dtSec;
  if (run.shakeTimerSec > 0) run.shakeTimerSec -= dtSec;
  for (const f of run.floaters) f.lifeSec -= dtSec;
  run.floaters = run.floaters.filter((f) => f.lifeSec > 0);
  // Steam drifts off the pots and the bowl.
  if (Math.random() < 0.35) {
    run.steam.push({ x: 560 + Math.random() * 260, y: 470, r: 4 + Math.random() * 5, lifeSec: 1.4 });
  }
  for (const s of run.steam) {
    s.y -= 26 * dtSec;
    s.lifeSec -= dtSec;
  }
  run.steam = run.steam.filter((s) => s.lifeSec > 0);
  // End of the shift.
  if (run.night.lengthSec !== Infinity && run.timeLeftSec <= 0) {
    finishNight(run, 'time');
  }
  if (run.hearts <= 0) {
    finishNight(run, 'hearts');
  }
}

export function finishNight(run, reason) {
  run.endReason = reason;
  run.starsEarned = reason === 'time' ? starsForCoins(run.night, run.coins) : 0;
  run.screen = reason === 'time' ? 'nightEnd' : 'failed';
}

export function recordNightResult(save, run) {
  if (run.night.id === 0) {
    save.bestCoins[0] = Math.max(save.bestCoins[0] || 0, run.coins);
  } else {
    const prev = save.stars[run.night.id] || 0;
    save.stars[run.night.id] = Math.max(prev, run.starsEarned);
    save.bestCoins[run.night.id] = Math.max(save.bestCoins[run.night.id] || 0, run.coins);
    if (run.night.id === 5 && run.starsEarned >= 1) save.endlessUnlocked = true;
  }
  save.totalServed += run.served;
  storeSave(save);
  return save;
}

export function isNightUnlocked(save, nightId) {
  if (nightId === 1) return true;
  if (nightId === 0) return save.endlessUnlocked;
  return (save.stars[nightId - 1] || 0) >= 1;
}

export function ingredientLabel(id) {
  return ING_BY_ID[id] ? ING_BY_ID[id].name : id;
}
