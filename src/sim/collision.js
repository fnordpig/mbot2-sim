import { getMapSizeCm, visitObstaclePixels } from './map.js';

const EPSILON = 1e-7;

// Sweeping a circle against a pixel square means sweeping its centre against
// a rounded rectangle: four offset edges and four radius-sized corner arcs.
// Testing the complete segment prevents thin walls being skipped at high speed.
function sweepCircle(x, y, dx, dy, radius) {
  const size = getMapSizeCm();
  if (!size) return null;
  let hit = null;
  function candidate(time, normalX, normalY, depth = 0, pointX, pointY) {
    if (time < -EPSILON || time > 1 || dx * normalX + dy * normalY >= -EPSILON) return;
    time = Math.max(0, time);
    if (!hit || time < hit.time || (time === hit.time && depth > hit.depth)) {
      hit = { time, normalX, normalY, depth, pointX, pointY };
    }
  }
  if (dx < 0) candidate((radius - x) / dx, 1, 0);
  if (dx > 0) candidate((size.wCm - radius - x) / dx, -1, 0);
  if (dy < 0) candidate((radius - y) / dy, 0, 1);
  if (dy > 0) candidate((size.hCm - radius - y) / dy, 0, -1);
  // Treat existing boundary overlap like a wall overlap: block only movement
  // farther outside, so a tight spawn can still drive back into the map.
  if (x < radius) candidate(0, 1, 0, radius - x, 0, y);
  if (x > size.wCm - radius) candidate(0, -1, 0, x - size.wCm + radius, size.wCm, y);
  if (y < radius) candidate(0, 0, 1, radius - y, x, 0);
  if (y > size.hCm - radius) candidate(0, 0, -1, y - size.hCm + radius, x, size.hCm);

  visitObstaclePixels(
    Math.min(x, x + dx) - radius, Math.min(y, y + dy) - radius,
    Math.max(x, x + dx) + radius, Math.max(y, y + dy) + radius,
    (left, top, right, bottom) => {
      const closestX = Math.max(left, Math.min(right, x));
      const closestY = Math.max(top, Math.min(bottom, y));
      const separation = Math.hypot(x - closestX, y - closestY);
      // A loaded map may put the footprint slightly inside a wall. Let it back
      // out, but do not turn existing penetration into a sideways impulse.
      if (separation > EPSILON && separation < radius - EPSILON) {
        candidate(0, (x - closestX) / separation, (y - closestY) / separation,
          radius - separation, closestX, closestY);
      }
      if (dx !== 0) {
        const time = ((dx > 0 ? left - radius : right + radius) - x) / dx;
        const atY = y + dy * time;
        if (atY >= top && atY <= bottom) candidate(time, dx > 0 ? -1 : 1, 0);
      }
      if (dy !== 0) {
        const time = ((dy > 0 ? top - radius : bottom + radius) - y) / dy;
        const atX = x + dx * time;
        if (atX >= left && atX <= right) candidate(time, 0, dy > 0 ? -1 : 1);
      }
      const lengthSq = dx * dx + dy * dy;
      for (const cornerX of [left, right]) for (const cornerY of [top, bottom]) {
        const offsetX = x - cornerX;
        const offsetY = y - cornerY;
        const along = offsetX * dx + offsetY * dy;
        const discriminant = along * along - lengthSq * (offsetX * offsetX + offsetY * offsetY - radius * radius);
        if (discriminant < 0) continue;
        const time = (-along - Math.sqrt(discriminant)) / lengthSq;
        const normalX = (offsetX + dx * time) / radius;
        const normalY = (offsetY + dy * time) / radius;
        if ((cornerX === left ? normalX <= 0 : normalX >= 0)
          && (cornerY === top ? normalY <= 0 : normalY >= 0)) candidate(time, normalX, normalY);
      }
    },
  );
  return hit;
}

export function moveCircle(x, y, dx, dy, radius, endOnCollision) {
  let collision = null;
  // Several contacts may occur within one frame (for example inside a corner).
  // If a dense raster exhausts the budget, leave the unused displacement rather
  // than allowing the footprint to cross a wall.
  for (let contact = 0; contact < 8 && Math.hypot(dx, dy) > EPSILON; contact++) {
    const hit = sweepCircle(x, y, dx, dy, radius);
    if (!hit) {
      x += dx;
      y += dy;
      break;
    }
    x += dx * hit.time;
    y += dy * hit.time;
    collision ??= { x: hit.pointX ?? x - hit.normalX * radius, y: hit.pointY ?? y - hit.normalY * radius,
      normalX: hit.normalX, normalY: hit.normalY };
    if (endOnCollision) break;
    x += hit.normalX * EPSILON;
    y += hit.normalY * EPSILON;
    dx *= 1 - hit.time;
    dy *= 1 - hit.time;
    // Remove only the component pushing into the surface: v - min(0, v·n)n.
    // Keep its original tangent magnitude; normalising would accelerate sliding.
    const inward = Math.min(0, dx * hit.normalX + dy * hit.normalY);
    dx -= inward * hit.normalX;
    dy -= inward * hit.normalY;
  }
  return { x, y, collision };
}
