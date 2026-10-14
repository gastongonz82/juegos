(() => {
  const ALPHABET = 'ABCDEFGHIJKLMNOPRSTUVY';
  const WORDS = {
    'tutti-frutti': { rounds: 5, seconds: 60, categories: ['Nombre', 'Animal', 'País o provincia', 'Comida', 'Color', 'Objeto'] },
    basta: { rounds: 5, seconds: 35, categories: ['Nombre', 'Animal', 'Lugar', 'Comida', 'Marca', 'Famoso'] }
  };
  const COMPUTER_WORD_BANK = {
    nombre:'Ana Bruno Carla Diego Elena Facundo Gabriela Hugo Ines Joaquin Karen Lucas Marta Nicolas Olivia Pedro Quimey Rocio Santiago Tomas Ursula Valeria Walter Ximena Yolanda Zoe'.split(' '),
    animal:'aguila ballena caballo delfin elefante foca gato hipopotamo iguana jirafa koala leon mono nutria oso perro quetzal raton serpiente tortuga urraca vaca wombat xerus yak zorro'.split(' '),
    lugar:'Argentina Bolivia Chile Formosa Guatemala Honduras India Japon Kenia Lima Mexico Neuquen Oman Paraguay Quito Rosario Salta Tucuman Uruguay Venezuela Washington Xalapa Yemen Zaragoza'.split(' '),
    country:'Argentina Bolivia Chile Dinamarca Ecuador Francia Grecia Haiti Italia Japon Kenia Laos Mexico Noruega Oman Paraguay Qatar Rusia Suecia Turquia Uruguay Vietnam Yemen Zambia'.split(' '),
    comida:'arroz batata canelones durazno empanada fideos guiso humita isla jamon kiwi lentejas milanesa osobuco pizza queso ravioles sopa tortilla uvas verduras wok yogurt zapallo'.split(' '),
    color:'azul blanco celeste dorado escarlata fucsia gris habano indigo jade kaki lila marron negro ocre plateado rojo salmon turquesa uva verde whisky xantico yellow zafiro'.split(' '),
    objeto:'anillo botella cuchara dado escoba frasco guitarra hacha iman jarra llave mochila navaja olla pelota quitasol reloj silla taza uniforme ventilador wok xilofono yoyo zapato'.split(' '),
    marca:'Adidas Baggio Chevrolet Danone Epson Fiat Gillette Honda Isadora Jumbo Kodak Lego Motorola Nike Oreo Pepsi Quilmes Renault Samsung Toyota Uber Visa Whirlpool Xerox Yamaha Zara'.split(' '),
    famoso:'Alberto Borges Charly Diego Einstein Frida Gardel Homero Isabel Messi Newton Oprah Picasso Quino Ricky Shakira Tita Ulises Violeta Walt Xuxa Yupanqui Zitarrosa'.split(' ')
  };
  const BOARD = [
    { name: 'Salida', kind: 'start', color: '#d3b36c' },
    { name: 'Formosa', kind: 'property', group: 0, price: 120, rent: 20, color: '#7ca58a' },
    { name: 'Suerte', kind: 'chance', color: '#8d70aa' },
    { name: 'Chaco', kind: 'property', group: 0, price: 140, rent: 24, color: '#7ca58a' },
    { name: 'Impuesto', kind: 'tax', amount: 100, color: '#a95246' },
    { name: 'Corrientes', kind: 'property', group: 0, price: 160, rent: 28, color: '#7ca58a' },
    { name: 'Ferrocarril', kind: 'station', price: 180, rent: 45, color: '#788e9d' },
    { name: 'Misiones', kind: 'property', group: 1, price: 180, rent: 32, color: '#6b9eb0' },
    { name: 'Banco', kind: 'bank', amount: 100, color: '#547d68' },
    { name: 'Entre Ríos', kind: 'property', group: 1, price: 200, rent: 36, color: '#6b9eb0' },
    { name: 'Policía', kind: 'police', color: '#687886' },
    { name: 'Córdoba', kind: 'property', group: 2, price: 220, rent: 40, color: '#c39a55' },
    { name: 'Suerte', kind: 'chance', color: '#8d70aa' },
    { name: 'Santa Fe', kind: 'property', group: 2, price: 240, rent: 44, color: '#c39a55' },
    { name: 'Impuesto', kind: 'tax', amount: 120, color: '#a95246' },
    { name: 'Buenos Aires', kind: 'property', group: 3, price: 280, rent: 52, color: '#bd7460' },
    { name: 'Ferrocarril', kind: 'station', price: 220, rent: 55, color: '#788e9d' },
    { name: 'Mendoza', kind: 'property', group: 3, price: 260, rent: 48, color: '#bd7460' },
    { name: 'Banco', kind: 'bank', amount: 150, color: '#547d68' },
    { name: 'Salta', kind: 'property', group: 4, price: 220, rent: 40, color: '#9a84b4' },
    { name: 'Descanso', kind: 'rest', color: '#66899a' },
    { name: 'Neuquén', kind: 'property', group: 4, price: 300, rent: 56, color: '#9a84b4' },
    { name: 'Suerte', kind: 'chance', color: '#8d70aa' },
    { name: 'Tucumán', kind: 'property', group: 5, price: 240, rent: 44, color: '#7c9e57' },
    { name: 'Santa Cruz', kind: 'property', group: 5, price: 320, rent: 60, color: '#7c9e57' },
    { name: 'Ferrocarril', kind: 'station', price: 260, rent: 65, color: '#788e9d' },
    { name: 'Jujuy', kind: 'property', group: 6, price: 280, rent: 52, color: '#c17c9b' },
    { name: 'A la Policía', kind: 'goto-police', color: '#687886' }
  ];
  const clampCapacity = (capacity, min = 2, max = 8) => Number.isInteger(capacity) && capacity >= min && capacity <= max;
  const cleanAnswer = value => String(value || '').trim().replace(/[<>\u0000-\u001f]/g, '').slice(0, 60);
  const norm = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').replace(/[^a-z0-9]/g, '');
  function computerAnswers(gameId, letter, pick = Math.random, missChance = .16) {
    const keys = gameId === 'basta' ? ['nombre','animal','lugar','comida','marca','famoso'] : ['nombre','animal','country','comida','color','objeto'];
    if (!WORDS[gameId] || !Array.isArray(letter) && typeof letter !== 'string') return [];
    return keys.map(key => { const matches=COMPUTER_WORD_BANK[key].filter(word => word[0].normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase()===letter); return !matches.length || pick()<missChance ? '' : matches[Math.floor(pick()*matches.length)]; });
  }
  function newWords(gameId, capacity, host) {
    const config = WORDS[gameId];
    if (!config || !clampCapacity(capacity)) throw new RangeError('Cantidad de jugadores inválida.');
    return { players: [host, ...Array(capacity - 1).fill(null)], capacity, gameId, scores: Array(capacity).fill(0), round: 0, phase: 'waiting', letter: null, deadline: null, answers: Array(capacity).fill(null), submitted: Array(capacity).fill(false), results: null, winner: null, lastEvent: 'Esperando que se complete la mesa.' };
  }
  function startWords(game, now, pick = Math.random) {
    if (!game.players.length || game.players.some(player => !player)) return null;
    game.round = 1;
    return startWordRound(game, now, pick);
  }
  function startWordRound(game, now, pick = Math.random) {
    const config = WORDS[game.gameId];
    if (!config) return null;
    game.letter = ALPHABET[Math.floor(pick() * ALPHABET.length) % ALPHABET.length];
    game.deadline = now + config.seconds * 1000;
    game.answers = Array(game.capacity).fill(null);
    game.submitted = Array(game.capacity).fill(false);
    game.results = null;
    game.phase = 'answering';
    game.lastEvent = `Ronda ${game.round}: letra ${game.letter}. ¡A jugar!`;
    return game;
  }
  function scoreWords(game) {
    const categories = WORDS[game.gameId].categories;
    const normalized = game.players.map((_, seat) => categories.map((_, index) => norm(game.answers[seat]?.[index])));
    const results = game.players.map((_, seat) => categories.map((_, index) => {
      const answer = cleanAnswer(game.answers[seat]?.[index]);
      const key = normalized[seat][index];
      if (!key || !key.startsWith(game.letter.toLocaleLowerCase('es'))) return { answer, points: 0, reason: answer ? 'letra' : 'vacía' };
      const same = normalized.reduce((count, row) => count + (row[index] === key ? 1 : 0), 0);
      return { answer, points: same > 1 ? 5 : 10, reason: same > 1 ? 'repetida' : 'única' };
    }));
    for (let seat = 0; seat < game.capacity; seat++) game.scores[seat] += results[seat].reduce((sum, item) => sum + item.points, 0);
    game.results = results;
    game.phase = 'results';
    game.deadline = null;
    game.lastEvent = `Terminó la ronda ${game.round}. Revisen las respuestas y los puntos.`;
    if (game.round >= WORDS[game.gameId].rounds) {
      game.phase = 'finished';
      const max = Math.max(...game.scores);
      const winners = game.scores.map((score, seat) => score === max ? seat : -1).filter(seat => seat >= 0);
      game.winner = winners.length === 1 ? winners[0] : -1;
      game.lastEvent = winners.length === 1 ? `¡${game.players[winners[0]].nickname} ganó con ${max} puntos!` : `Empate con ${max} puntos.`;
    }
    return game;
  }
  function submitWords(game, seat, answers, now, stop = false, pick = Math.random) {
    if (!WORDS[game.gameId] || game.phase !== 'answering' || !Number.isInteger(seat) || !game.players[seat] || game.submitted[seat]) return false;
    if (now >= game.deadline) { scoreWords(game); return false; }
    if (!Array.isArray(answers) || answers.length !== WORDS[game.gameId].categories.length) return false;
    game.answers[seat] = answers.map(cleanAnswer);
    game.submitted[seat] = true;
    if (stop) {
      game.lastEvent = `${game.players[seat].nickname} dijo ¡BASTA! Se cierra la ronda.`;
      scoreWords(game);
    } else if (game.submitted.every(Boolean)) scoreWords(game);
    else game.lastEvent = `${game.players[seat].nickname} entregó. Esperando al resto…`;
    return true;
  }
  function nextWordsRound(game, seat, now, pick = Math.random) {
    if (!WORDS[game.gameId] || game.phase !== 'results' || seat !== 0) return false;
    game.round += 1;
    startWordRound(game, now, pick);
    return true;
  }

  const randomInt = (random, max) => Math.floor(random() * max);
  const estancieroPlayer = player => ({ ...player, money: 1500, position: 0, properties: [], upgrades: [], bankrupt: false, jailed: false });
  function newEstanciero(capacity, host) {
    if (!clampCapacity(capacity, 2, 6)) throw new RangeError('Cantidad de jugadores inválida.');
    return { players: [host, ...Array(capacity - 1).fill(null)].map(player => player ? estancieroPlayer(player) : null), capacity, turn: 0, phase: 'waiting', dice: null, pending: null, winner: null, lastEvent: 'Esperando que se complete la mesa.' };
  }
  const active = player => !!player && !player.bankrupt;
  const assetOwner = (game, tile) => game.players.findIndex(player => active(player) && player.properties.includes(tile));
  function bankrupt(game, seat, reason) {
    const debtor = game.players[seat]; debtor.bankrupt = true;
    const creditor = Number.isInteger(game.pending?.creditor) ? game.pending.creditor : -1;
    if (creditor >= 0 && game.players[creditor]) for (const tile of debtor.properties) game.players[creditor].properties.push(tile);
    else debtor.properties = [];
    game.lastEvent = `${debtor.nickname} no pudo pagar ${reason} y quedó fuera de la partida.`;
    const alive = game.players.map((player, index) => active(player) ? index : -1).filter(index => index >= 0);
    if (alive.length === 1) { game.winner = alive[0]; game.phase = 'finished'; game.lastEvent += ` ${game.players[alive[0]].nickname} ganó.`; }
    else game.phase = 'end';
  }
  function pay(game, from, to, amount, label) {
    const payer = game.players[from];
    if (payer.money < amount) { game.pending = { creditor: to, amount, label }; bankrupt(game, from, label); return false; }
    payer.money -= amount;
    if (to >= 0) game.players[to].money += amount;
    game.lastEvent = `${payer.nickname} pagó $${amount} ${label}${to >= 0 ? ` a ${game.players[to].nickname}` : ' al banco'}.`;
    game.phase = 'end';
    return true;
  }
  function rollEstanciero(game, seat, dice, chance = 0) {
    if (game.phase !== 'roll' || game.turn !== seat || !active(game.players[seat]) || !Array.isArray(dice) || dice.length !== 2 || dice.some(value => !Number.isInteger(value) || value < 1 || value > 6)) return null;
    const player = game.players[seat];
    game.dice = dice.slice();
    const total = dice[0] + dice[1];
    if (player.jailed) { player.jailed = false; game.phase = 'end'; game.lastEvent = `${player.nickname} cumple su turno en la Policía y queda libre.`; return game; }
    const old = player.position, next = (old + total) % BOARD.length;
    if (old + total >= BOARD.length) { player.money += 200; game.lastEvent = `${player.nickname} pasó por Salida y cobró $200. `; }
    player.position = next;
    const tile = BOARD[next], owner = assetOwner(game, next);
    if (tile.kind === 'property' || tile.kind === 'station') {
      game.pending = { tile: next, creditor: owner, amount: tile.price, label: tile.name };
      if (owner === -1) { game.phase = 'buy'; game.lastEvent = `${player.nickname} cayó en ${tile.name}, disponible por $${tile.price}.`; }
      else if (owner === seat) { game.phase = 'own'; game.lastEvent = `${player.nickname} llegó a su propiedad ${tile.name}.`; }
      else { const rent = tile.rent * (tile.kind === 'station' ? game.players[owner].properties.filter(i => BOARD[i].kind === 'station').length : 1) * (game.players[owner].upgrades.includes(next) ? 2 : 1);game.pending.amount=rent;pay(game,seat,owner,rent,`de alquiler en ${tile.name}`); }
    } else if (tile.kind === 'start') { game.phase = 'end'; game.lastEvent = `${player.nickname} cayó en Salida.`; }
    else if (tile.kind === 'bank') { player.money += tile.amount; game.phase = 'end'; game.lastEvent = `${player.nickname} cobró $${tile.amount} del Banco.`; }
    else if (tile.kind === 'tax') pay(game,seat,-1,tile.amount,`de impuesto en ${tile.name}`);
    else if (tile.kind === 'chance') {
      const cards = [
        { money: 100, text: 'Cobrás $100 por una buena cosecha.' }, { money: -100, text: 'Pagás $100 por reparaciones.' },
        { money: 150, text: 'El Banco te entrega un premio de $150.' }, { money: -150, text: 'Pagás $150 de contribución.' },
        { money: 200, text: 'Recibís $200 por la venta de ganado.' }, { money: -200, text: 'Pagás $200 por una multa rural.' }
      ];
      const card = cards[randomInt(() => chance, cards.length)];
      if (card.money > 0) { player.money += card.money; game.phase = 'end'; game.lastEvent = `Suerte: ${card.text}`; }
      else if (card.money < 0) pay(game,seat,-1,-card.money,'por una carta de Suerte');
    } else if (tile.kind === 'police' || tile.kind === 'goto-police') { player.position = 10; player.jailed = true; game.phase = 'end'; game.lastEvent = `${player.nickname} va a la Policía y pierde su próximo turno.`; }
    else { game.phase = 'end'; game.lastEvent = `${player.nickname} descansa en ${tile.name}.`; }
    return game;
  }
  function buyEstanciero(game, seat, buy) {
    if (game.turn !== seat || game.phase !== 'buy' || !game.pending || game.pending.creditor !== -1) return false;
    const player=game.players[seat],tile=BOARD[game.pending.tile];
    if (buy && player.money < tile.price) return false;
    if (buy) { player.money-=tile.price;player.properties.push(game.pending.tile);game.lastEvent=`${player.nickname} compró ${tile.name} por $${tile.price}.`; }
    else game.lastEvent=`${player.nickname} dejó pasar ${tile.name}.`;
    game.pending=null;game.phase='end';return true;
  }
  function buildEstanciero(game, seat) {
    if (game.turn!==seat||game.phase!=='own'||!game.pending) return false;
    const player=game.players[seat],tile=BOARD[game.pending.tile],cost=160;
    if (tile.kind!=='property'||player.upgrades.includes(game.pending.tile)||player.money<cost) return false;
    player.money-=cost;player.upgrades.push(game.pending.tile);game.phase='end';game.lastEvent=`${player.nickname} mejoró ${tile.name} con una estancia por $${cost}.`;game.pending=null;return true;
  }
  function endEstanciero(game, seat) {
    if (game.phase!=='end'||game.turn!==seat||game.winner!==null) return false;
    for(let count=0;count<game.capacity;count++){
      game.turn=(game.turn+1)%game.capacity;
      if(active(game.players[game.turn]))break;
    }
    game.dice=null;game.pending=null;
    if(!active(game.players[game.turn])){game.phase='finished';return false;}
    game.phase='roll';game.lastEvent+=` Turno de ${game.players[game.turn].nickname}.`;
    return true;
  }
  function computerEstancieroAction(game, seat, pick = Math.random) {
    if (!game || game.turn !== seat || !active(game.players[seat]) || game.phase === 'finished') return null;
    if (game.phase === 'roll') return { type:'roll', dice:[randomInt(pick,6)+1,randomInt(pick,6)+1], chance:pick() };
    if (game.phase === 'buy') { const amount=game.pending?.amount||0; return { type:game.players[seat].money>amount+250?'buy':'skip' }; }
    if (game.phase === 'own') { const tile=BOARD[game.pending?.tile]; return tile?.kind==='property'&&!game.players[seat].upgrades.includes(game.pending.tile)&&game.players[seat].money>480?{type:'build'}:{type:'end'}; }
    if (game.phase === 'end') return { type:'end' };
    return null;
  }
  return { WORDS, ALPHABET, BOARD, clampCapacity, newWords, startWords, startWordRound, scoreWords, submitWords, nextWordsRound, computerAnswers, estancieroPlayer, newEstanciero, rollEstanciero, buyEstanciero, buildEstanciero, endEstanciero, computerEstancieroAction, norm };
})()
