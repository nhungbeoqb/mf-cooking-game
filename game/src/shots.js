// Midnight Noodle Cart — shots.js
// One clear job: stage fixed, deterministic scenes for the screenshots
// (?shot=start|play|rush|end&seed=N). Real game state, real update
// steps — never a mock render. main.js freezes the clock afterwards.

import { NIGHTS, RECIPES } from './config.js';
import { newRun, spawnOrder, mulberry32 } from './state.js';

export function stageShot(game, shot, seed) {
  const rng = mulberry32(seed);
  if (shot === 'start') {
    // Title screen with a played history: stars on nights 1-2, best coins.
    game.save.stars = { 1: 3, 2: 2 };
    game.save.bestCoins = { 1: 152, 2: 131 };
    game.run.screen = 'title';
    game.run.elapsedSec = 12.5;
    return;
  }

  if (shot === 'play') {
    // Night 2, mid-shift: two tickets, a bowl mid-assembly, one pot
    // boiling, the shift timer running, a plate ready to serve.
    const run = newRun(NIGHTS[1], rng);
    run.elapsedSec = 43;
    run.timeLeftSec = 107;
    run.coins = 46;
    run.served = 4;
    run.combo = 2;
    run.comboTimerSec = 5;
    const t1 = spawnOrder(run);
    t1.recipe = RECIPES.shoyu;
    t1.patienceSec = t1.patienceMaxSec * 0.62;
    const t2 = spawnOrder(run);
    t2.recipe = RECIPES.miso;
    t2.patienceSec = t2.patienceMaxSec * 0.81;
    run.bowl = ['noodles', 'broth', 'corn'];
    run.pots[0] = { state: 'boiling', timerSec: 4.2 };
    run.pots[1] = { state: 'ready', timerSec: 7.5 };
    run.steam = [
      { x: 620, y: 430, r: 7, lifeSec: 1.1 },
      { x: 700, y: 410, r: 9, lifeSec: 0.8 },
      { x: 990, y: 470, r: 6, lifeSec: 1.2 },
    ];
    game.run = run;
    return;
  }

  if (shot === 'rush') {
    // Night 4, RUSH HOUR: four tickets, a full bowl, both pots working,
    // combo x3, the timer in the red zone.
    const run = newRun(NIGHTS[3], rng);
    run.elapsedSec = 128;
    run.timeLeftSec = 37;
    run.rush = true;
    run.coins = 214;
    run.served = 15;
    run.combo = 3;
    run.comboTimerSec = 6;
    const t1 = spawnOrder(run);
    t1.recipe = RECIPES.tantan;
    t1.patienceSec = t1.patienceMaxSec * 0.31;
    const t2 = spawnOrder(run);
    t2.recipe = RECIPES.sea;
    t2.patienceSec = t2.patienceMaxSec * 0.55;
    const t3 = spawnOrder(run);
    t3.recipe = RECIPES.shoyu;
    t3.patienceSec = t3.patienceMaxSec * 0.72;
    const t4 = spawnOrder(run);
    t4.recipe = RECIPES.miso;
    t4.patienceSec = t4.patienceMaxSec * 0.44;
    run.bowl = ['noodles', 'broth', 'chili', 'greens'];
    run.pots[0] = { state: 'ready', timerSec: 8.1 };
    run.pots[1] = { state: 'boiling', timerSec: 2.4 };
    run.message = 'RUSH HOUR — the 3am crowd!';
    run.messageTimerSec = 0; // the header already says RUSH; keep the bowl clear
    run.steam = [
      { x: 600, y: 440, r: 8, lifeSec: 1.0 },
      { x: 660, y: 420, r: 10, lifeSec: 0.7 },
      { x: 730, y: 450, r: 6, lifeSec: 1.2 },
      { x: 990, y: 470, r: 7, lifeSec: 0.9 },
    ];
    game.run = run;
    return;
  }

  if (shot === 'end') {
    // Night 2 complete: three stars, the unlock banner, the plate served.
    const run = newRun(NIGHTS[1], rng);
    run.screen = 'nightEnd';
    run.elapsedSec = 150;
    run.timeLeftSec = 0;
    run.coins = 186;
    run.served = 14;
    run.bestCombo = 3;
    run.starsEarned = 3;
    run.endReason = 'time';
    game.run = run;
    return;
  }

  // Unknown shot name: fall back to the title screen.
  game.run.screen = 'title';
  game.run.elapsedSec = 5;
}
