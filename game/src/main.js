// Midnight Noodle Cart — main.js
// One clear job: boot the cart, run the frame loop, and own the `game`
// object input.js acts on. The title screen, the nights and the save
// file all start here.

import { CANVAS_W, CANVAS_H, NIGHTS, AFTER_HOURS } from './config.js';
import { loadSave, storeSave, newRun, nightById, tickRun, finishNight, recordNightResult, mulberry32 } from './state.js';
import { drawHeader, drawGame, drawTitle } from './render.js';
import { attachInput } from './input.js';
import { ensureAudio, startMusic, sfx, isMuted } from './audio.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const game = {
  save: loadSave(),
  run: null,
  frozen: false, // screenshots freeze the clock after staging
};

function titleRun() {
  return { screen: 'title', night: NIGHTS[0], elapsedSec: 0, tickets: [], bowl: [], pots: [], coins: 0, served: 0, combo: 0, hearts: 3, rush: false, message: '', messageTimerSec: 0, shakeTimerSec: 0, steam: [], floaters: [] };
}

game.startNight = function startNight(nightId) {
  const night = nightById(nightId);
  const seed = (Date.now() % 2147483647) || 7;
  game.run = newRun(night, mulberry32(seed));
  ensureAudio();
  startMusic();
  sfx.ticketArrives();
};

game.toTitle = function toTitle() {
  game.run = titleRun();
};

game.run = titleRun();
attachInput(canvas, game);

let lastTs = performance.now();

function frame(ts) {
  const dtSec = Math.min(0.05, (ts - lastTs) / 1000);
  lastTs = ts;
  const run = game.run;
  if (run.screen === 'title') {
    run.elapsedSec += dtSec;
    drawTitle(ctx, game.save, run.elapsedSec);
    drawHeader(ctx, null, game.save);
  } else {
    if (!game.frozen) {
      const before = run.screen;
      tickRun(run, dtSec);
      // A pot just finished boiling: ding once.
      for (const pot of run.pots) {
        if (pot.state === 'ready' && pot.timerSec >= 6 && pot.timerSec - dtSec < 6) sfx.noodlesReady();
      }
      if (run.screen !== before && (run.screen === 'nightEnd' || run.screen === 'failed')) {
        recordNightResult(game.save, run);
        if (run.screen === 'nightEnd') sfx.nightClear();
        else sfx.customerLeaves();
      }
    }
    drawGame(ctx, run, game.save, run.elapsedSec);
  }
  // Mute state, top-right of the header.
  ctx.fillStyle = '#123F3F';
  ctx.beginPath();
  ctx.roundRect(1120, 8, 40, 48, 8);
  ctx.fill();
  ctx.font = '22px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(isMuted() ? '🔇' : '🔊', 1140, 40);
  requestAnimationFrame(frame);
}

// ?shot=start|play|rush|end stages a fixed scene for screenshots.
const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) {
  const seed = parseInt(params.get('seed') || '7', 10);
  stageShot(game, shot, seed);
  game.frozen = true;
  // Draw once immediately so a fast screenshot still catches the scene.
  requestAnimationFrame(frame);
} else {
  requestAnimationFrame(frame);
}

// Expose the game for play-testing from the console.
window.__cart = game;
