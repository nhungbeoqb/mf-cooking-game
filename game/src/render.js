// Midnight Noodle Cart — render.js
// One clear job: draw everything on the canvas — the title screen, the
// order board, the counter, the stove, the bowl on its plate, the timer
// and the end-of-night screens. Bright first, mood second: big type,
// flat readable colours, nothing murky.

import { CANVAS_W, CANVAS_H, INGREDIENTS, RECIPES, PALETTE, NIGHTS, AFTER_HOURS } from './config.js';
import { isNightUnlocked, starsForCoins } from './state.js';

// Layout boxes, shared with input.js hit-testing.
export const LAYOUT = {
  header: { x: 0, y: 0, w: 1280, h: 64 },
  orderBoard: { x: 16, y: 80, w: 296, h: 580 },
  counter: { x: 328, y: 420, w: 624, h: 200 },
  stove: { x: 968, y: 420, w: 296, h: 200 },
  bowl: { x: 328, y: 80, w: 624, h: 324 },
  trash: { x: 1184, y: 640, w: 80, h: 56 },
  serveHint: { x: 328, y: 640, w: 624, h: 56 },
};

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, weight = 'bold', align = 'left') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Trebuchet MS", Verdana, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(str, x, y);
}

function star(ctx, cx, cy, r, filled) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const x = cx + Math.cos(a) * rad;
    const y = cy + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = filled ? PALETTE.gold : '#D8C9A8';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#8A6D2B';
  ctx.stroke();
}

function patienceColor(frac) {
  if (frac > 0.5) return PALETTE.good;
  if (frac > 0.25) return PALETTE.warn;
  return PALETTE.bad;
}

function formatClock(totalSec) {
  const s = Math.max(0, Math.ceil(totalSec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// One customer's face, drawn from their hat + colours. Patience bends the mouth.
export function drawCustomerFace(ctx, customer, frac, cx, cy, r) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = customer.skin;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#2B2118';
  ctx.stroke();
  // Hair or hat.
  ctx.fillStyle = customer.hair;
  if (customer.hat === 'beanie') {
    ctx.beginPath();
    ctx.arc(cx, cy - r * 0.45, r * 0.95, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(cx - r, cy - r * 0.55, r * 2, r * 0.28);
    ctx.fillStyle = PALETTE.accent;
    ctx.fillRect(cx - r, cy - r * 0.55, r * 2, r * 0.12);
  } else if (customer.hat === 'cap') {
    ctx.beginPath();
    ctx.arc(cx, cy - r * 0.5, r * 0.9, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(cx, cy - r * 0.55, r * 1.15, r * 0.22);
  } else if (customer.hat === 'fedora') {
    ctx.fillRect(cx - r * 1.05, cy - r * 0.62, r * 2.1, r * 0.2);
    ctx.beginPath();
    ctx.arc(cx, cy - r * 0.55, r * 0.62, Math.PI, 0);
    ctx.fill();
  } else if (customer.hat === 'peaked') {
    ctx.fillRect(cx - r * 1.05, cy - r * 0.6, r * 2.1, r * 0.18);
    ctx.beginPath();
    ctx.arc(cx, cy - r * 0.5, r * 0.7, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = PALETTE.gold;
    ctx.fillRect(cx - r * 0.3, cy - r * 0.6, r * 0.6, r * 0.1);
  } else if (customer.hat === 'bandana') {
    ctx.beginPath();
    ctx.arc(cx, cy - r * 0.5, r * 0.85, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#D7263D';
    ctx.fillRect(cx - r * 0.9, cy - r * 0.62, r * 1.8, r * 0.22);
  } else if (customer.hat === 'scrubs') {
    ctx.beginPath();
    ctx.arc(cx, cy - r * 0.5, r * 0.85, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#2E9E8B';
    ctx.fillRect(cx - r * 0.9, cy - r * 0.62, r * 1.8, r * 0.22);
  } else {
    ctx.beginPath();
    ctx.arc(cx, cy - r * 0.42, r * 0.88, Math.PI * 0.95, Math.PI * 2.05);
    ctx.fill();
  }
  // Eyes.
  ctx.fillStyle = '#2B2118';
  ctx.beginPath();
  ctx.arc(cx - r * 0.36, cy - r * 0.05, r * 0.11, 0, Math.PI * 2);
  ctx.arc(cx + r * 0.36, cy - r * 0.05, r * 0.11, 0, Math.PI * 2);
  ctx.fill();
  // Mouth: smile while patient, flat then worried as patience drains.
  ctx.strokeStyle = '#2B2118';
  ctx.lineWidth = 3;
  ctx.beginPath();
  if (frac > 0.5) {
    ctx.arc(cx, cy + r * 0.25, r * 0.42, Math.PI * 0.15, Math.PI * 0.85);
  } else if (frac > 0.25) {
    ctx.moveTo(cx - r * 0.35, cy + r * 0.45);
    ctx.lineTo(cx + r * 0.35, cy + r * 0.45);
  } else {
    ctx.arc(cx, cy + r * 0.75, r * 0.4, Math.PI * 1.15, Math.PI * 1.85);
  }
  ctx.stroke();
  ctx.restore();
}

function drawLantern(ctx, x, y, size, sway) {
  ctx.save();
  ctx.translate(x + Math.sin(sway) * 3, y);
  ctx.strokeStyle = '#2B2118';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -14);
  ctx.lineTo(0, 0);
  ctx.stroke();
  ctx.fillStyle = '#D7263D';
  ctx.beginPath();
  ctx.ellipse(0, size * 0.55, size * 0.42, size * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#F2C14E';
  ctx.beginPath();
  ctx.ellipse(0, size * 0.55, size * 0.2, size * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.gold;
  ctx.fillRect(-size * 0.2, -2, size * 0.4, 5);
  ctx.fillRect(-size * 0.2, size * 1.05, size * 0.4, 5);
  ctx.restore();
}

export function drawHeader(ctx, run, save) {
  const h = LAYOUT.header;
  ctx.fillStyle = PALETTE.header;
  ctx.fillRect(h.x, h.y, h.w, h.h);
  ctx.fillStyle = PALETTE.accent;
  ctx.fillRect(0, 60, 1280, 4);
  text(ctx, '🍜 MIDNIGHT NOODLE CART', 20, 42, 26, PALETTE.headerInk);
  if (run) {
    // Shift timer: the one the judge must feel.
    const label = run.night.lengthSec === Infinity ? 'AFTER HOURS' : formatClock(run.timeLeftSec);
    const urgent = run.night.lengthSec !== Infinity && run.timeLeftSec <= 30;
    ctx.fillStyle = urgent ? PALETTE.bad : '#123F3F';
    roundRect(ctx, 660, 12, 140, 40, 8);
    ctx.fill();
    text(ctx, `⏱ ${label}`, 730, 41, 24, urgent ? '#FFFFFF' : PALETTE.gold, 'bold', 'center');
    text(ctx, `🪙 ${run.coins}`, 830, 41, 24, PALETTE.headerInk);
    // Hearts.
    for (let i = 0; i < 3; i++) {
      ctx.font = '22px "Trebuchet MS", Verdana, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(i < run.hearts ? '❤️' : '🤍', 930 + i * 30, 41);
    }
    const nightLabel = run.night.id === 0 ? 'After Hours' : `Night ${run.night.id}`;
    text(ctx, run.rush ? '🔥 RUSH' : nightLabel, 1105, 30, 15, run.rush ? '#FFD23F' : '#BFE3D8', 'bold', 'right');
    text(ctx, `served ${run.served} · combo x${Math.max(1, run.combo)}`, 1105, 50, 12, '#BFE3D8', 'bold', 'right');
  } else {
    text(ctx, 'open 2am–5am · no closing time for the hungry', 400, 40, 15, '#BFE3D8');
    text(ctx, 'A cooking game about the 2am crowd', 1105, 40, 15, '#BFE3D8', 'bold', 'right');
  }
  void save;
}

function drawTicket(ctx, ticket, x, y, w, h, flash) {
  const frac = Math.max(0, ticket.patienceSec / ticket.patienceMaxSec);
  ctx.save();
  if (flash) {
    ctx.shadowColor = PALETTE.gold;
    ctx.shadowBlur = 18;
  }
  ctx.fillStyle = PALETTE.ticket;
  roundRect(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.restore();
  ctx.lineWidth = 2;
  ctx.strokeStyle = frac <= 0.25 ? PALETTE.bad : PALETTE.ticketEdge;
  roundRect(ctx, x, y, w, h, 10);
  ctx.stroke();
  // Ticket header: recipe name on its colour band.
  ctx.fillStyle = ticket.recipe.color;
  roundRect(ctx, x, y, w, 28, 10);
  ctx.fill();
  ctx.fillRect(x, y + 18, w, 10);
  text(ctx, ticket.recipe.name.toUpperCase(), x + 10, y + 20, 15, '#FFFFFF');
  text(ctx, `$${ticket.recipe.price}`, x + w - 10, y + 20, 15, '#FFFFFF', 'bold', 'right');
  // Face + customer.
  drawCustomerFace(ctx, ticket.customer, frac, x + 30, y + 52, 20);
  text(ctx, ticket.customer.name, x + 56, y + 48, 15, PALETTE.ink);
  text(ctx, ticket.customer.role, x + 56, y + 66, 11, PALETTE.muted);
  text(ctx, `"${ticket.customer.quirk}"`, x + 10, y + 86, 11, PALETTE.muted, 'normal', 'left');
  // Required ingredients as labelled chips.
  let cx = x + 8;
  for (const id of ticket.recipe.needs) {
    const ing = INGREDIENTS.find((i) => i.id === id);
    ctx.fillStyle = ing.color;
    roundRect(ctx, cx, y + 92, 48, 20, 6);
    ctx.fill();
    ctx.fillStyle = id === 'nori' || id === 'broth' ? '#FFFFFF' : '#2B2118';
    ctx.font = 'bold 9px "Trebuchet MS", Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(ing.name, cx + 24, y + 106);
    cx += 51;
  }
  // Patience bar.
  ctx.fillStyle = '#EFE3C8';
  roundRect(ctx, x + 10, y + h - 12, w - 20, 8, 4);
  ctx.fill();
  ctx.fillStyle = patienceColor(frac);
  roundRect(ctx, x + 10, y + h - 12, (w - 20) * frac, 8, 4);
  ctx.fill();
}

export function drawOrderBoard(ctx, run) {
  const b = LAYOUT.orderBoard;
  ctx.fillStyle = '#FFFDF6';
  roundRect(ctx, b.x, b.y, b.w, b.h, 12);
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = PALETTE.ticketEdge;
  roundRect(ctx, b.x, b.y, b.w, b.h, 12);
  ctx.stroke();
  text(ctx, '📋 ORDER BOARD', b.x + 14, b.y + 28, 18, PALETTE.ink);
  if (run.tickets.length === 0) {
    text(ctx, 'No orders yet —', b.x + 148, b.y + 90, 16, PALETTE.muted, 'normal', 'center');
    text(ctx, 'the night is young.', b.x + 148, b.y + 114, 16, PALETTE.muted, 'normal', 'center');
  }
  run.tickets.forEach((ticket, i) => {
    drawTicket(ctx, ticket, b.x + 10, b.y + 40 + i * 132, b.w - 20, 124, run.servedFlashId === ticket.id);
  });
}

function drawBowlContents(ctx, bowl, cx, cy) {
  // Broth fills the bowl's inner ellipse; noodles wave across it.
  if (bowl.includes('broth')) {
    ctx.fillStyle = '#C96F2E';
    ctx.beginPath();
    ctx.ellipse(cx, cy, 122, 54, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  if (bowl.includes('noodles')) {
    ctx.strokeStyle = '#F2C14E';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    for (let i = 0; i < 4; i++) {
      const yy = cy - 30 + i * 20;
      ctx.beginPath();
      ctx.moveTo(cx - 95, yy);
      for (let px = -95; px <= 95; px += 12) {
        ctx.lineTo(cx + px, yy + Math.sin(px * 0.09 + i * 1.7) * 5);
      }
      ctx.stroke();
    }
  }
  const toppings = bowl.filter((id) => id !== 'broth' && id !== 'noodles');
  const spots = [
    [-0.45, -0.35], [0.45, -0.35], [-0.45, 0.35], [0.45, 0.35], [0, 0],
  ];
  toppings.forEach((id, i) => {
    const [dx, dy] = spots[i % spots.length];
    const ing = INGREDIENTS.find((x) => x.id === id);
    ctx.fillStyle = ing.color;
    ctx.beginPath();
    ctx.arc(cx + dx * 110, cy + dy * 44, 17, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#2B2118';
    ctx.stroke();
  });
}

export function drawAssemblyBowl(ctx, run) {
  const b = LAYOUT.bowl;
  ctx.save();
  if (run.shakeTimerSec > 0) {
    ctx.translate((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 6);
  }
  // The kitchen wall: warm tiles + a window on the night street.
  ctx.fillStyle = '#FFE9C2';
  roundRect(ctx, b.x, b.y, b.w, b.h, 12);
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = PALETTE.ticketEdge;
  roundRect(ctx, b.x, b.y, b.w, b.h, 12);
  ctx.stroke();
  // Window: the street outside, lanterns swaying.
  ctx.fillStyle = '#123F5C';
  roundRect(ctx, b.x + 18, b.y + 14, 200, 110, 8);
  ctx.fill();
  ctx.fillStyle = '#F2C14E';
  ctx.beginPath();
  ctx.arc(b.x + 170, b.y + 38, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0E5A5A';
  ctx.fillRect(b.x + 18, b.y + 96, 200, 28);
  text(ctx, '2:47 AM · the street is awake', b.x + 28, b.y + 114, 12, '#BFE3D8');
  drawLantern(ctx, b.x + 300, b.y + 20, 26, run.elapsedSec * 0.8);
  drawLantern(ctx, b.x + 360, b.y + 14, 20, run.elapsedSec * 0.8 + 2);
  text(ctx, 'ASSEMBLY — build the bowl, then click its ticket', b.x + 420, b.y + 34, 14, PALETTE.muted);
  // The plate, then the bowl on it.
  const cx = b.x + b.w / 2;
  const cy = b.y + 190;
  ctx.fillStyle = PALETTE.plate;
  ctx.beginPath();
  ctx.ellipse(cx, cy + 62, 190, 34, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#D8C9A8';
  ctx.stroke();
  ctx.fillStyle = PALETTE.bowl;
  ctx.beginPath();
  ctx.ellipse(cx, cy, 150, 78, 0, 0, Math.PI);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx, cy, 150, 78, 0, Math.PI, Math.PI * 2);
  ctx.fillStyle = '#8E2B20';
  ctx.fill();
  ctx.fillStyle = '#EFE3C8';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 136, 64, 0, 0, Math.PI * 2);
  ctx.fill();
  drawBowlContents(ctx, run.bowl, cx, cy);
  // Steam over the bowl.
  for (const s of run.steam) {
    ctx.globalAlpha = Math.max(0, s.lifeSec / 1.4) * 0.5;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  // Match readout: what the bowl is, and what it still needs.
  const match = run.tickets.find((t) => {
    const needs = t.recipe.needs;
    return run.bowl.length > 0 && run.bowl.every((id) => needs.includes(id)) && run.bowl.length <= needs.length;
  });
  if (run.bowl.length === 0) {
    text(ctx, 'Bowl is empty — boil noodles, then add toppings.', cx, b.y + 300, 15, PALETTE.muted, 'normal', 'center');
  } else if (match && run.bowl.length === match.recipe.needs.length) {
    text(ctx, `✓ ${match.recipe.name} — CLICK ITS TICKET TO SERVE!`, cx, b.y + 300, 17, PALETTE.good, 'bold', 'center');
  } else if (match) {
    const missing = match.recipe.needs.filter((id) => !run.bowl.includes(id));
    text(ctx, `On the way to ${match.recipe.name} — still needs: ${missing.join(', ')}`, cx, b.y + 300, 15, PALETTE.ink, 'normal', 'center');
  } else {
    text(ctx, 'That mix matches no ticket — trash it (🗑) and start again.', cx, b.y + 300, 15, PALETTE.bad, 'normal', 'center');
  }
  ctx.restore();
}

export function drawIngredientCounter(ctx, run) {
  const c = LAYOUT.counter;
  ctx.fillStyle = PALETTE.wood;
  roundRect(ctx, c.x, c.y, c.w, c.h, 12);
  ctx.fill();
  ctx.fillStyle = PALETTE.woodDark;
  ctx.fillRect(c.x, c.y, c.w, 34);
  text(ctx, '🥕 INGREDIENTS — click a bin (or press 1–8)', c.x + 14, c.y + 23, 15, '#FFFFFF');
  text(ctx, 'noodles come from the pots →', c.x + c.w - 14, c.y + 23, 12, '#F2C14E', 'normal', 'right');
  INGREDIENTS.forEach((ing, i) => {
    const x = c.x + 12 + i * 76;
    const y = c.y + 46;
    const inBowl = run.bowl.includes(ing.id);
    ctx.fillStyle = inBowl ? '#D8C9A8' : PALETTE.counter;
    roundRect(ctx, x, y, 68, 118, 10);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = inBowl ? PALETTE.good : '#E8D9B8';
    roundRect(ctx, x, y, 68, 118, 10);
    ctx.stroke();
    ctx.font = '34px "Trebuchet MS", Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(ing.emoji, x + 34, y + 48);
    text(ctx, ing.name, x + 34, y + 74, 13, PALETTE.ink, 'bold', 'center');
    text(ctx, ing.note, x + 34, y + 92, 10, PALETTE.muted, 'normal', 'center');
    ctx.fillStyle = '#2B2118';
    roundRect(ctx, x + 22, y + 98, 24, 16, 4);
    ctx.fill();
    text(ctx, ing.key, x + 34, y + 111, 11, '#FFFFFF', 'bold', 'center');
    if (inBowl) {
      ctx.fillStyle = PALETTE.good;
      ctx.beginPath();
      ctx.arc(x + 58, y + 10, 11, 0, Math.PI * 2);
      ctx.fill();
      text(ctx, '✓', x + 58, y + 14, 13, '#FFFFFF', 'bold', 'center');
    }
  });
}

export function drawStovePots(ctx, run) {
  const s = LAYOUT.stove;
  ctx.fillStyle = '#3B3B3B';
  roundRect(ctx, s.x, s.y, s.w, s.h, 12);
  ctx.fill();
  text(ctx, '🔥 STOVE — click a pot', s.x + 14, s.y + 26, 15, '#FFFFFF');
  text(ctx, 'noodles boil 6s · burn at 13s', s.x + 14, s.y + 46, 11, '#BFBFBF');
  run.pots.forEach((pot, i) => {
    const x = s.x + 16 + i * 138;
    const y = s.y + 58;
    // Pot body.
    ctx.fillStyle = '#5A5A5A';
    roundRect(ctx, x, y, 122, 96, 10);
    ctx.fill();
    ctx.fillStyle = '#2B2B2B';
    roundRect(ctx, x + 6, y + 6, 110, 84, 8);
    ctx.fill();
    let status = '';
    if (pot.state === 'empty') {
      text(ctx, 'EMPTY', x + 61, y + 40, 14, '#8A8A8A', 'bold', 'center');
      text(ctx, 'click to boil', x + 61, y + 62, 11, '#8A8A8A', 'normal', 'center');
      status = '';
    } else {
      const frac = pot.state === 'boiling'
        ? pot.timerSec / 6
        : pot.state === 'ready'
          ? Math.min(1, (pot.timerSec - 6) / 7)
          : 1;
      ctx.fillStyle = pot.state === 'burnt' ? '#1A1A1A' : '#E8A33D';
      ctx.beginPath();
      ctx.ellipse(x + 61, y + 45, 48, 26, 0, 0, Math.PI * 2);
      ctx.fill();
      if (pot.state === 'boiling') {
        ctx.strokeStyle = '#F2C14E';
        ctx.lineWidth = 4;
        for (let k = 0; k < 3; k++) {
          ctx.beginPath();
          ctx.arc(x + 40 + k * 20, y + 40, 5 + Math.sin(run.elapsedSec * 6 + k) * 2, 0, Math.PI * 2);
          ctx.stroke();
        }
        status = `BOILING ${Math.ceil(6 - pot.timerSec)}s`;
      } else if (pot.state === 'ready') {
        ctx.fillStyle = '#F2C14E';
        ctx.font = '22px "Trebuchet MS", Verdana, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🍜', x + 61, y + 52);
        status = 'READY — click to add!';
      } else {
        text(ctx, '🔥 BURNT', x + 61, y + 40, 14, '#FF8A7A', 'bold', 'center');
        status = 'BURNT — click to dump';
      }
      // Boil / burn progress ring.
      ctx.strokeStyle = pot.state === 'burnt' ? PALETTE.bad : PALETTE.gold;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(x + 61, y + 45, 56, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
      ctx.stroke();
    }
    text(ctx, status, x + 61, y + 112, 11, pot.state === 'ready' ? PALETTE.gold : '#FFFFFF', 'bold', 'center');
  });
  // Trash can.
  const t = LAYOUT.trash;
  ctx.fillStyle = '#8A5A2B';
  roundRect(ctx, t.x, t.y, t.w, t.h, 8);
  ctx.fill();
  text(ctx, '🗑 TRASH', t.x + 40, t.y + 24, 13, '#FFFFFF', 'bold', 'center');
  text(ctx, 'empty bowl', t.x + 40, t.y + 42, 10, '#FFE9C2', 'normal', 'center');
}

export function drawServeHint(ctx, run) {
  const h = LAYOUT.serveHint;
  ctx.fillStyle = '#123F3F';
  roundRect(ctx, h.x, h.y, h.w, h.h, 10);
  ctx.fill();
  const ready = run.tickets.find((t) => run.bowl.length === t.recipe.needs.length && run.bowl.every((id) => t.recipe.needs.includes(id)));
  if (ready) {
    const label = run.combo >= 2
      ? `✓ ${ready.recipe.name} complete — click its ticket!`
      : `✓ ${ready.recipe.name} is complete — click its ticket (or press SPACE) to serve!`;
    text(ctx, label, h.x + 18, h.y + 34, 16, PALETTE.gold);
  } else {
    text(ctx, '1–8 ingredients · SPACE serve · T trash · P pause · M mute', h.x + 18, h.y + 34, 14, '#BFE3D8');
  }
  if (run.combo >= 2) {
    ctx.fillStyle = PALETTE.accent;
    roundRect(ctx, h.x + h.w - 150, h.y + 8, 136, 40, 8);
    ctx.fill();
    text(ctx, `COMBO x${run.combo} 🔥`, h.x + h.w - 82, h.y + 34, 16, '#FFFFFF', 'bold', 'center');
  }
}

export function drawMessage(ctx, run) {
  if (run.messageTimerSec > 0 && run.message) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, run.messageTimerSec);
    ctx.fillStyle = '#2B2118';
    roundRect(ctx, 390, 68, 500, 42, 12);
    ctx.fill();
    text(ctx, run.message, 640, 96, 18, '#FFFFFF', 'bold', 'center');
    ctx.restore();
  }
  for (const f of run.floaters) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, f.lifeSec / 1.2);
    text(ctx, f.text, f.x, f.y - (1.2 - f.lifeSec) * 40, 28, f.color, 'bold', 'center');
    ctx.restore();
  }
}

export function drawTitle(ctx, save, tSec) {
  ctx.fillStyle = PALETTE.bg;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  // Night street band across the top.
  ctx.fillStyle = '#123F5C';
  ctx.fillRect(0, 64, 1280, 150);
  ctx.fillStyle = '#F2C14E';
  ctx.beginPath();
  ctx.arc(1120, 120, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0E5A5A';
  for (let i = 0; i < 12; i++) {
    const bx = 40 + i * 105;
    ctx.fillRect(bx, 150, 70, 64);
    ctx.fillStyle = i % 3 === 0 ? '#F2C14E' : '#123F5C';
    ctx.fillRect(bx + 8, 160, 14, 14);
    ctx.fillRect(bx + 30, 160, 14, 14);
    ctx.fillStyle = '#0E5A5A';
  }
  drawLantern(ctx, 180, 84, 34, tSec * 0.9);
  drawLantern(ctx, 560, 78, 26, tSec * 0.9 + 1.5);
  drawLantern(ctx, 940, 84, 30, tSec * 0.9 + 3);
  // The cart itself, front and centre.
  ctx.fillStyle = PALETTE.wood;
  roundRect(ctx, 340, 250, 600, 150, 14);
  ctx.fill();
  ctx.fillStyle = PALETTE.accent;
  roundRect(ctx, 340, 250, 600, 44, 14);
  ctx.fill();
  ctx.fillRect(340, 280, 600, 14);
  text(ctx, '🍜  THE 2AM NOODLE CART  🍜', 640, 282, 30, '#FFFFFF', 'bold', 'center');
  text(ctx, 'One cart. Five nights. The city that never sleeps — eats.', 640, 330, 17, '#2B2118', 'normal', 'center');
  text(ctx, 'Boil the noodles · build the bowl · serve before patience runs out', 640, 358, 15, '#3A2A18', 'normal', 'center');
  text(ctx, '🪙 Earn coins · ⭐ Earn stars · 🔓 Unlock nights, recipes and After Hours', 640, 384, 15, '#2B2118', 'bold', 'center');
  // Night select buttons.
  const nights = [...NIGHTS, AFTER_HOURS];
  nights.forEach((night, i) => {
    const x = 100 + i * 184;
    const y = 430;
    const unlocked = isNightUnlocked(save, night.id);
    const stars = save.stars[night.id] || 0;
    ctx.fillStyle = unlocked ? '#FFFFFF' : '#E8DCC2';
    roundRect(ctx, x, y, 168, 120, 12);
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = unlocked ? night.id === 0 ? '#7B2D8B' : PALETTE.header : '#C9B98F';
    roundRect(ctx, x, y, 168, 120, 12);
    ctx.stroke();
    if (!unlocked) {
      text(ctx, '🔒', x + 84, y + 62, 36, '#8A7A5F', 'normal', 'center');
      text(ctx, night.id === 0 ? 'After Hours' : `Night ${night.id}`, x + 84, y + 100, 14, '#8A7A5F', 'bold', 'center');
    } else {
      text(ctx, night.id === 0 ? '🌙 After Hours' : `Night ${night.id}`, x + 84, y + 30, 15, PALETTE.ink, 'bold', 'center');
      text(ctx, night.name.split('·')[1] ? night.name.split('·')[1].trim() : '', x + 84, y + 52, 12, PALETTE.muted, 'normal', 'center');
      for (let s = 0; s < 3; s++) star(ctx, x + 54 + s * 30, y + 78, 12, s < stars);
      text(ctx, (save.bestCoins[night.id] || 0) > 0 ? `best ${save.bestCoins[night.id]} coins` : 'not played yet', x + 84, y + 106, 11, PALETTE.muted, 'normal', 'center');
    }
  });
  text(ctx, 'Click a night to play · your stars and best coins are saved on this machine', 640, 590, 14, PALETTE.muted, 'normal', 'center');
  text(ctx, 'How to play: 1–8 add ingredients · pots boil noodles (6s) · click a ticket to serve a matching bowl', 640, 616, 14, PALETTE.ink, 'normal', 'center');
  text(ctx, 'Wrong order costs patience · a customer who waits too long walks away (♥ lost) · last 45s is RUSH HOUR', 640, 640, 14, PALETTE.ink, 'normal', 'center');
  text(ctx, 'Made with plain canvas + WebAudio. No network, no libraries.', 640, 676, 12, PALETTE.muted, 'normal', 'center');
}

export function drawNightEnd(ctx, run, save) {
  ctx.fillStyle = 'rgba(14, 90, 90, 0.92)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = '#FFFFFF';
  roundRect(ctx, 340, 120, 600, 460, 16);
  ctx.fill();
  const failed = run.screen === 'failed';
  text(ctx, failed ? '💔 THE CART CLOSES EARLY' : '🌙 NIGHT COMPLETE!', 640, 190, 34, failed ? PALETTE.bad : PALETTE.header, 'bold', 'center');
  text(ctx, run.night.name, 640, 226, 20, PALETTE.muted, 'normal', 'center');
  if (!failed) {
    for (let s = 0; s < 3; s++) star(ctx, 550 + s * 90, 300, 34, s < run.starsEarned);
    text(ctx, `You earned ${run.starsEarned} star${run.starsEarned === 1 ? '' : 's'}`, 640, 360, 20, PALETTE.ink, 'bold', 'center');
    const bars = run.night.stars;
    text(ctx, `Stars at ${bars[0]} / ${bars[1]} / ${bars[2]} coins`, 640, 388, 14, PALETTE.muted, 'normal', 'center');
  } else {
    text(ctx, 'Three hungry customers walked away.', 640, 300, 18, PALETTE.ink, 'normal', 'center');
    text(ctx, 'The cart packs up. Try the night again.', 640, 330, 16, PALETTE.muted, 'normal', 'center');
  }
  text(ctx, `🪙 ${run.coins} coins  ·  🍜 ${run.served} bowls served  ·  🔥 best combo x${Math.max(1, run.bestCombo)}`, 640, 424, 17, PALETTE.ink, 'bold', 'center');
  if (!failed && run.night.unlocks) {
    text(ctx, `🔓 ${run.night.unlocks}`, 640, 456, 16, PALETTE.good, 'bold', 'center');
  }
  // Buttons.
  const buttons = failed
    ? [{ label: '↻ TRY AGAIN', x: 440 }, { label: '☰ MENU', x: 700 }]
    : [{ label: '↻ REPLAY', x: 440 }, { label: '☰ MENU', x: 640 }, { label: 'NEXT NIGHT →', x: 840 }];
  for (const b of buttons) {
    ctx.fillStyle = PALETTE.accent;
    roundRect(ctx, b.x - 85, 490, 170, 52, 10);
    ctx.fill();
    text(ctx, b.label, b.x, 524, 17, '#FFFFFF', 'bold', 'center');
  }
  text(ctx, 'Saved on this machine — your stars stay for the next visit.', 640, 566, 13, PALETTE.muted, 'normal', 'center');
}

export function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(43, 33, 24, 0.55)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  text(ctx, '⏸ PAUSED', 640, 340, 44, '#FFFFFF', 'bold', 'center');
  text(ctx, 'Press P or click anywhere to keep cooking', 640, 386, 18, '#FFE9C2', 'normal', 'center');
}

export function drawGame(ctx, run, save, tSec) {
  ctx.fillStyle = PALETTE.bg;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  drawHeader(ctx, run, save);
  drawOrderBoard(ctx, run);
  drawAssemblyBowl(ctx, run);
  drawIngredientCounter(ctx, run);
  drawStovePots(ctx, run);
  drawServeHint(ctx, run);
  drawMessage(ctx, run);
  if (run.screen === 'paused') drawPaused(ctx);
  if (run.screen === 'nightEnd' || run.screen === 'failed') drawNightEnd(ctx, run, save);
}
