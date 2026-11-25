# Midnight Noodle Cart

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/nhungbeoqb/mf-cooking-game/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/nhungbeoqb/mf-cooking-game/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

One cart. Five nights. The city that never sleeps — eats.

**Midnight Noodle Cart** is a cooking game about a ramen cart that only opens
from 2am to 5am. Boil noodles in the pots, build each bowl on the plate from
the eight ingredient bins, and serve it to the right ticket on the order
board before the customer's patience runs out. The regulars are strange —
a lighthouse keeper who takes extra chili, an insomniac poet, a night nurse
on a twelve-hour shift — and the last 45 seconds of every shift is RUSH HOUR.

Five nights, each unlocking a new recipe and a new regular, with stars, best
coins and progress saved on the machine. Clear Night 5 to unlock After Hours,
the endless mode. Keyboard and mouse, plain canvas + WebAudio, no libraries,
no network.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

Or open `game/index.html` through any static server. `?shot=start|play|rush|end`
stages a fixed scene (used for the screenshots).

## How to play

- **1–8** add an ingredient to the bowl (noodles come from the pots, not the bins)
- **Click a pot** (or **Q** / **W**) to boil noodles — 6 seconds, burnt at 13
- **Click a ticket** (or **SPACE**) to serve a bowl that matches it exactly
- **T** empties the bowl into the trash · **P** pauses · **M** mutes
- Serve fast for tips, chain serves for combos (up to x3), and watch the
  patience bars: a customer who waits too long walks away and costs a heart.
  Lose three hearts and the cart closes early.

---

<sub>Entered on [make.fun](https://make.fun/?ref=bg2sw27v&utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>
