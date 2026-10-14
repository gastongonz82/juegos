/* Reglas locales de Batalla Naval. Este módulo nunca recibe la flota enemiga al elegir tiros. */
globalThis.VladyerikSolo = (() => {
  const SHIP_LENGTHS = [5, 4, 3, 3, 2];
  const CELLS = 100;

  function makeFleet(rng = Math.random) {
    const ships = [];
    const occupied = new Set();
    for (const length of SHIP_LENGTHS) {
      let placed = false;
      while (!placed) {
        const horizontal = rng() < 0.5;
        const row = Math.floor(rng() * 10);
        const col = Math.floor(rng() * 10);
        if (horizontal ? col + length > 10 : row + length > 10) continue;
        const ship = Array.from({ length }, (_, i) => horizontal ? row * 10 + col + i : (row + i) * 10 + col);
        if (ship.some(cell => occupied.has(cell))) continue;
        ship.forEach(cell => occupied.add(cell));
        ships.push(ship);
        placed = true;
      }
    }
    return ships;
  }

  function availableShots(shots) {
    const fired = new Set(shots);
    return Array.from({ length: CELLS }, (_, cell) => cell).filter(cell => !fired.has(cell));
  }

  function pick(cells, rng) { return cells[Math.floor(rng() * cells.length)]; }
  function neighbors(cell, shots) {
    const row = Math.floor(cell / 10), col = cell % 10, fired = new Set(shots);
    return [[row - 1, col], [row + 1, col], [row, col - 1], [row, col + 1]]
      .filter(([r, c]) => r >= 0 && r < 10 && c >= 0 && c < 10)
      .map(([r, c]) => r * 10 + c).filter(next => !fired.has(next));
  }

  // memory contains only the computer's own shots and hits revealed by those shots.
  function chooseAiShot(memory, difficulty, rng = Math.random) {
    const candidates = availableShots(memory.shots);
    if (!candidates.length) return null;
    if (difficulty === 'easy' || !memory.hits.length) {
      if (difficulty === 'hard') {
        const parity = candidates.filter(cell => (Math.floor(cell / 10) + cell % 10) % 2 === 0);
        return pick(parity.length ? parity : candidates, rng);
      }
      return pick(candidates, rng);
    }
    if (difficulty === 'hard') {
      const rows = new Map(), cols = new Map();
      for (const hit of memory.hits) {
        const row = Math.floor(hit / 10), col = hit % 10;
        rows.set(row, [...(rows.get(row) || []), hit]);
        cols.set(col, [...(cols.get(col) || []), hit]);
      }
      for (const [lines, horizontal] of [[rows, true], [cols, false]]) {
        for (const line of lines.values()) {
          if (line.length < 2) continue;
          const ordered = [...line].sort((a, b) => a - b), first = ordered[0], last = ordered.at(-1);
          const ends = horizontal ? [first - 1, last + 1] : [first - 10, last + 10];
          const valid = ends.filter(cell => cell >= 0 && cell < CELLS &&
            (horizontal ? Math.floor(cell / 10) === Math.floor(first / 10) : cell % 10 === first % 10) &&
            !memory.shots.includes(cell));
          if (valid.length) return pick(valid, rng);
        }
      }
    }
    const targets = [...new Set(memory.hits.flatMap(cell => neighbors(cell, memory.shots)))];
    if (targets.length) return pick(targets, rng);
    const parity = difficulty === 'hard' ? candidates.filter(cell => (Math.floor(cell / 10) + cell % 10) % 2 === 0) : candidates;
    return pick(parity.length ? parity : candidates, rng);
  }

  function resolveShot(fleet, shots, cell) {
    if (!Number.isInteger(cell) || cell < 0 || cell >= CELLS || shots.includes(cell)) return null;
    shots.push(cell);
    const ship = fleet.find(cells => cells.includes(cell));
    const hit = !!ship;
    const sunk = !!ship && ship.every(position => shots.includes(position));
    return { cell, hit, sunk, sunkCells: sunk ? [...ship] : [] };
  }

  function allSunk(fleet, shots) { return fleet.every(ship => ship.every(cell => shots.includes(cell))); }
  return { SHIP_LENGTHS, makeFleet, chooseAiShot, resolveShot, allSunk, availableShots };
})();
