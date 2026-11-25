// Midnight Noodle Cart — input.js
// One clear job: turn mouse clicks and key presses into game actions.
// Hit-testing reuses the layout boxes render.js draws.

import { INGREDIENTS, NIGHTS, AFTER_HOURS } from './config.js';
import { LAYOUT } from './render.js';
import { newRun, addIngredientToBowl, startBoiling, clearBowl, serveBowlToTicket, bowlMatchesAnyTicket, isNightUnlocked } from './state.js';
import { sfx, ensureAudio, toggleMute, startMusic } from './audio.js';

function inside(x, y, box) {
  return x >= box.x && x <= box.x + box.w && y >= box.y && y <= box.y + box.h;
}

function ticketBox(run, i) {
  const b = LAYOUT.orderBoard;
  return { x: b.x + 10, y: b.y + 40 + i * 132, w: b.w - 20, h: 124 };
}

function ingredientBox(i) {
  const c = LAYOUT.counter;
  return { x: c.x + 12 + i * 76, y: c.y + 46, w: 68, h: 118 };
}

function potBox(i) {
  const s = LAYOUT.stove;
  return { x: s.x + 16 + i * 138, y: s.y + 58, w: 122, h: 96 };
}

function nightButtonBox(i) {
  return { x: 100 + i * 184, y: 430, w: 168, h: 120 };
}

function endButtonBoxes(run) {
  if (run.screen === 'failed') {
    return [
      { label: 'retry', x: 440 - 85, y: 490, w: 170, h: 52 },
      { label: 'menu', x: 700 - 85, y: 490, w: 170, h: 52 },
    ];
  }
  return [
    { label: 'replay', x: 440 - 85, y: 490, w: 170, h: 52 },
    { label: 'menu', x: 640 - 85, y: 490, w: 170, h: 52 },
    { label: 'next', x: 840 - 85, y: 490, w: 170, h: 52 },
  ];
}

// Wire the canvas up. `game` is the object main.js owns.
export function attachInput(canvas, game) {
  canvas.addEventListener('click', (ev) => {
    ensureAudio();
    const rect = canvas.getBoundingClientRect();
    const x = ((ev.clientX - rect.left) / rect.width) * 1280;
    const y = ((ev.clientY - rect.top) / rect.height) * 720;
    handleClick(game, x, y);
  });

  window.addEventListener('keydown', (ev) => {
    if (ev.repeat) return;
    ensureAudio();
    handleKey(game, ev.key.toLowerCase());
  });
}

function handleClick(game, x, y) {
  const { run, save } = game;
  if (!run) return;

  if (run.screen === 'title') {
    const nights = [...NIGHTS, AFTER_HOURS];
    for (let i = 0; i < nights.length; i++) {
      if (inside(x, y, nightButtonBox(i)) && isNightUnlocked(save, nights[i].id)) {
        game.startNight(nights[i].id);
        return;
      }
    }
    return;
  }

  if (run.screen === 'paused') {
    run.screen = 'playing';
    return;
  }

  if (run.screen === 'nightEnd' || run.screen === 'failed') {
    for (const b of endButtonBoxes(run)) {
      if (inside(x, y, b)) {
        if (b.label === 'menu') game.toTitle();
        else if (b.label === 'replay' || b.label === 'retry') game.startNight(run.night.id);
        else if (b.label === 'next') {
          const nextId = run.night.id === 0 ? 0 : run.night.id + 1;
          game.startNight(nextId <= 5 ? nextId : 0);
        }
        return;
      }
    }
    return;
  }

  if (run.screen !== 'playing') return;

  // Mute button lives in the header, right side.
  if (inside(x, y, { x: 1120, y: 8, w: 40, h: 48 })) {
    toggleMute();
    return;
  }

  // Click a ticket to serve the bowl to it.
  for (let i = 0; i < run.tickets.length; i++) {
    if (inside(x, y, ticketBox(run, i))) {
      const outcome = serveBowlToTicket(run, run.tickets[i].id);
      if (outcome.ok) sfx.serveGood();
      else if (outcome.reason === 'wrong-order') sfx.serveWrong();
      else sfx.click();
      return;
    }
  }

  // Click an ingredient bin to add it to the bowl.
  for (let i = 0; i < INGREDIENTS.length; i++) {
    if (inside(x, y, ingredientBox(i))) {
      const ing = INGREDIENTS[i];
      if (ing.id === 'noodles') {
        run.message = 'Noodles come from the pots — boil them first!';
        run.messageTimerSec = 1.8;
        sfx.click();
      } else if (addIngredientToBowl(run, ing.id)) {
        sfx.addIngredient();
      } else {
        sfx.click();
      }
      return;
    }
  }

  // Click a pot: start boiling, take ready noodles, or dump a burnt pot.
  for (let i = 0; i < 2; i++) {
    if (inside(x, y, potBox(i))) {
      const result = startBoiling(run, i);
      if (result === 'started') sfx.boilStart();
      else if (result === 'added') sfx.plop();
      else if (result === 'dumped') sfx.burnt();
      else sfx.click();
      return;
    }
  }

  // Trash can empties the bowl.
  if (inside(x, y, LAYOUT.trash)) {
    clearBowl(run);
    sfx.plop();
  }
}

function handleKey(game, key) {
  const { run } = game;
  if (!run) return;

  if (key === 'm') {
    toggleMute();
    return;
  }

  if (run.screen === 'title') {
    const nights = [...NIGHTS, AFTER_HOURS];
    const n = parseInt(key, 10);
    if (n >= 1 && n <= 5 && isNightUnlocked(game.save, n)) game.startNight(n);
    if (key === 'enter') game.startNight(1);
    return;
  }

  if (key === 'p' || key === 'escape') {
    if (run.screen === 'playing') {
      run.screen = 'paused';
      sfx.click();
    } else if (run.screen === 'paused') {
      run.screen = 'playing';
      sfx.click();
    }
    return;
  }

  if (run.screen !== 'playing') {
    if (key === 'enter' && (run.screen === 'nightEnd' || run.screen === 'failed')) {
      game.toTitle();
    }
    return;
  }

  // 1-8: ingredients. Noodles (1) reminds you to use the pots.
  const ing = INGREDIENTS.find((i) => i.key === key);
  if (ing) {
    if (ing.id === 'noodles') {
      run.message = 'Noodles come from the pots — boil them first!';
      run.messageTimerSec = 1.8;
    } else if (addIngredientToBowl(run, ing.id)) {
      sfx.addIngredient();
    }
    return;
  }

  if (key === ' ') {
    const match = bowlMatchesAnyTicket(run);
    if (match) {
      const outcome = serveBowlToTicket(run, match.id);
      if (outcome.ok) sfx.serveGood();
    } else if (run.bowl.length > 0) {
      sfx.serveWrong();
      run.message = 'That bowl matches no ticket yet.';
      run.messageTimerSec = 1.6;
    }
    return;
  }

  if (key === 't') {
    clearBowl(run);
    sfx.plop();
  }

  if (key === 'q' || key === 'w') {
    const result = startBoiling(run, key === 'q' ? 0 : 1);
    if (result === 'started') sfx.boilStart();
    else if (result === 'added') sfx.plop();
    else if (result === 'dumped') sfx.burnt();
  }
}
