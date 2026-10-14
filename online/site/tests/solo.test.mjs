import test from 'node:test';
import assert from 'node:assert/strict';
import '../solo-engine.js';
const game = globalThis.VladyerikSolo;

test('solo fleets follow the same five-ship lengths and never overlap', () => {
  for (let i = 0; i < 30; i++) {
    const ships = game.makeFleet();
    assert.deepEqual(ships.map(ship => ship.length), [5,4,3,3,2]);
    assert.equal(new Set(ships.flat()).size, 17);
    assert.ok(ships.flat().every(cell => cell >= 0 && cell < 100));
  }
});

test('solo shot rules reject repeats and victory requires every ship cell', () => {
  const fleet = [[10,11],[80]];
  const shots = [];
  assert.equal(game.resolveShot(fleet, shots, 10).hit, true);
  assert.equal(game.resolveShot(fleet, shots, 10), null);
  assert.equal(game.allSunk(fleet, shots), false);
  assert.equal(game.resolveShot(fleet, shots, 11).sunk, true);
  game.resolveShot(fleet, shots, 80);
  assert.equal(game.allSunk(fleet, shots), true);
});

test('AI chooses only unshot cells, and easy difficulty never uses the fleet', () => {
  const shots = [0,1,2,3];
  const cell = game.chooseAiShot({ shots, hits: [] }, 'easy');
  assert.ok(cell >= 0 && cell < 100 && !shots.includes(cell));
  assert.equal(game.chooseAiShot({ shots: Array.from({length:100},(_,i)=>i), hits: [] }, 'normal'), null);
});

test('normal and hard difficulty hunt adjacent to discovered hits without repeating shots', () => {
  const memory = { shots: [44], hits: [44] };
  for (const difficulty of ['normal','hard']) {
    const cell = game.chooseAiShot(memory, difficulty, () => 0);
    assert.ok([34,54,43,45].includes(cell), `${difficulty} selected ${cell}`);
  }
  const aligned = { shots: [44,45], hits: [44,45] };
  const hard = game.chooseAiShot(aligned, 'hard', () => 0);
  assert.ok([43,46].includes(hard));
});

test('computer shot selection accepts only public memory and difficulty, never a fleet', () => {
  const signature = game.chooseAiShot.toString();
  assert.match(signature, /memory/);
  assert.doesNotMatch(signature, /fleet|playerShips|computerShips/);
  const memory = { shots: [5, 15], hits: [15] };
  const next = game.chooseAiShot(memory, 'normal', () => 0);
  assert.ok([5,14,16,25].includes(next));
});

test('a complete local match resolves turns and victory against each difficulty', () => {
  for (const difficulty of ['easy', 'normal', 'hard']) {
    for (let seed = 1; seed <= 12; seed++) {
      let state = seed >>> 0;
      const rng = () => { state ^= state << 13; state ^= state >>> 17; state ^= state << 5; return (state >>> 0) / 4294967296; };
      const playerFleet = game.makeFleet(rng), computerFleet = game.makeFleet(rng);
      const playerShots = [], computerShots = [], ai = { shots: [], hits: [] };
      let winner = null;
      for (let turn = 0; turn < 100 && !winner; turn++) {
        const playerCell = game.availableShots(playerShots)[0];
        const playerResult = game.resolveShot(computerFleet, playerShots, playerCell);
        assert.ok(playerResult);
        if (game.allSunk(computerFleet, playerShots)) { winner = 'player'; break; }
        const aiCell = game.chooseAiShot({ shots: [...ai.shots], hits: [...ai.hits] }, difficulty, rng);
        assert.ok(aiCell !== null && !computerShots.some(shot => shot.cell === aiCell));
        const aiResult = game.resolveShot(playerFleet, computerShots.map(shot => shot.cell), aiCell);
        assert.ok(aiResult);
        computerShots.push(aiResult);
        ai.shots.push(aiCell);
        if (aiResult.hit) ai.hits.push(aiCell);
        if (aiResult.sunk) ai.hits = ai.hits.filter(hit => !aiResult.sunkCells.includes(hit));
        if (game.allSunk(playerFleet, computerShots.map(shot => shot.cell))) winner = 'computer';
      }
      assert.ok(winner, `${difficulty}, seed ${seed}: match did not finish`);
      assert.equal(new Set(playerShots).size, playerShots.length);
      assert.equal(new Set(computerShots.map(shot => shot.cell)).size, computerShots.length);
    }
  }
});
