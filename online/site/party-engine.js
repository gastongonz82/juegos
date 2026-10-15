(() => {
  const ALPHABET = 'ABCDEFGHIJKLMNOPRSTUVY';
  const WORDS = {
    'tutti-frutti': { rounds: 5, seconds: 60, categories: ['Nombre', 'Animal', 'País o provincia', 'Comida', 'Color', 'Objeto'] },
    basta: { rounds: 3, seconds: 15, categories: ['Una palabra de la tarjeta'] }
  };
  const CATEGORY_WORDS = {
    nombre:`Agustín|Alberto|Alejandro|Alicia|Ana|Andrés|Antonio|Ariel|Beatriz|Benjamín|Brenda|Bruno|Camila|Carla|Carlos|Carmen|Cecilia|Clara|Claudio|Daniel|Dario|David|Diego|Dolores|Eduardo|Elena|Emilia|Emilio|Esteban|Eva|Facundo|Federico|Felipe|Fernanda|Francisco|Gabriel|Gabriela|Gastón|Gerardo|Gonzalo|Guadalupe|Guillermo|Héctor|Hugo|Ignacio|Inés|Irene|Isabel|Iván|Jacinta|Javier|Jazmín|Jesús|Joaquín|Jorge|José|Juan|Julieta|Julio|Karen|Lautaro|Laura|Leandro|Leonardo|Lilian|Lorenzo|Lucía|Lucas|Luis|Manuel|Marcela|Marcos|María|Mariano|Marta|Martín|Mateo|Matías|Micaela|Miguel|Milagros|Nahuel|Nicolás|Noelia|Octavio|Olivia|Omar|Oscar|Pablo|Paula|Pedro|Priscila|Rafael|Ramiro|Raúl|Ricardo|Roberto|Rocío|Rodrigo|Rosa|Sabrina|Samuel|Sandra|Santiago|Sergio|Silvia|Sofía|Tadeo|Tamara|Tatiana|Teodoro|Tomás|Valentina|Valeria|Vanesa|Vicente|Victoria|Walter|Ximena|Yamila|Yesica|Yolanda|Zoe`.split('|'),
    animal:`Abeja|Águila|Alce|Anaconda|Anchoa|Ardilla|Armadillo|Atún|Avestruz|Ballena|Bisonte|Búho|Burro|Caballo|Cabra|Caimán|Calamar|Camello|Canario|Cangrejo|Caracol|Castor|Cebra|Cerdo|Ciervo|Cisne|Cocodrilo|Colibrí|Cóndor|Conejo|Cordero|Cuervo|Delfín|Dragón de Komodo|Elefante|Erizo|Escarabajo|Escorpión|Faisán|Flamenco|Foca|Gallina|Gallo|Gato|Gacela|Gaviota|Gorila|Grillo|Guacamayo|Guanaco|Hámster|Hiena|Hipopótamo|Hormiga|Iguana|Jabalí|Jaguar|Jirafa|Koala|Lagarto|Langosta|León|Liebre|Llama|Lobo|Lombriz|Loro|Mamut|Mapache|Mariposa|Medusa|Merluza|Mono|Mosca|Murciélago|Nutria|Ñandú|Ocelote|Orca|Ornitorrinco|Oso|Oveja|Pato|Pavo|Pavo real|Pez|Pingüino|Polilla|Puma|Pulpo|Quetzal|Rana|Ratón|Rinoceronte|Salmón|Sapo|Sardina|Serpiente|Suricata|Tarántula|Tiburón|Tigre|Topo|Tortuga|Tucán|Urraca|Vaca|Venado|Víbora|Vizcacha|Wapití|Wombat|Xerus|Yak|Yacaré|Zorro`.split('|'),
    country:`Afganistán|Albania|Alemania|Andorra|Angola|Arabia Saudita|Argelia|Argentina|Armenia|Australia|Austria|Bahamas|Bangladés|Barbados|Bélgica|Belice|Benín|Bielorrusia|Bolivia|Brasil|Bulgaria|Camerún|Canadá|Chile|China|Chipre|Colombia|Corea del Norte|Corea del Sur|Costa Rica|Croacia|Cuba|Dinamarca|Ecuador|Egipto|El Salvador|Emiratos Árabes Unidos|Eslovaquia|Eslovenia|España|Estados Unidos|Estonia|Etiopía|Filipinas|Finlandia|Francia|Grecia|Guatemala|Haití|Honduras|Hungría|India|Indonesia|Irak|Irán|Irlanda|Islandia|Israel|Italia|Jamaica|Japón|Jordania|Kenia|Letonia|Líbano|Lituania|Luxemburgo|Malasia|Marruecos|México|Mónaco|Mongolia|Nepal|Nicaragua|Nigeria|Noruega|Nueva Zelanda|Países Bajos|Pakistán|Panamá|Paraguay|Perú|Polonia|Portugal|Reino Unido|República Dominicana|Rumania|Rusia|Senegal|Serbia|Singapur|Siria|Sudáfrica|Suecia|Suiza|Tailandia|Taiwán|Tanzania|Túnez|Turquía|Ucrania|Uruguay|Venezuela|Vietnam|Zambia|Zimbabue|Buenos Aires|Catamarca|Chaco|Chubut|Córdoba|Corrientes|Entre Ríos|Formosa|Jujuy|La Pampa|La Rioja|Mendoza|Misiones|Neuquén|Río Negro|Salta|San Juan|San Luis|Santa Cruz|Santa Fe|Santiago del Estero|Tierra del Fuego|Tucumán`.split('|'),
    place:`Argentina|Asunción|Bariloche|Berlín|Bogotá|Buenos Aires|Córdoba|Corrientes|Curitiba|Formosa|Goya|La Plata|Lima|Londres|Madrid|Mar del Plata|Mendoza|Montevideo|Neuquén|Nueva York|París|Posadas|Resistencia|Río de Janeiro|Rosario|Salta|San Pablo|Santa Fe|Santiago|Santiago del Estero|Tokio|Tucumán|Ushuaia|Valencia|Viena|Washington|Zaragoza|Catamarca|Chaco|Chubut|Entre Ríos|Jujuy|La Pampa|La Rioja|Misiones|Río Negro|San Juan|San Luis|Santa Cruz|Tierra del Fuego`.split('|'),
    food:`Aceituna|Acelga|Achura|Alfajor|Ananá|Arroz|Asado|Atún|Baguette|Banana|Batata|Berenjena|Bizcochuelo|Budín|Canelones|Carne|Cebolla|Cereza|Choclo|Chorizo|Chocolate|Churro|Ciruela|Coco|Dulce de leche|Durazno|Empanada|Ensalada|Espinaca|Fideos|Flan|Frambuesa|Frutilla|Galleta|Garbanzos|Guiso|Hamburguesa|Harina|Helado|Higo|Huevo|Humita|Jamón|Jugo|Kiwi|Lasaña|Leche|Lentejas|Limón|Mandarina|Mango|Manzana|Manteca|Mayonesa|Medialuna|Melón|Merluza|Milanesa|Morcilla|Naranja|Nuez|Ñoquis|Omelette|Pan|Papa|Pascualina|Pastel|Pera|Pescado|Picada|Pizza|Polenta|Pollo|Poroto|Queso|Quinoa|Ravioles|Remolacha|Repollo|Riñón|Rúcula|Salame|Sándwich|Sandía|Sopa|Tallarines|Tarta|Tortilla|Torta|Uva|Vainilla|Verdura|Yogur|Zapallo|Zanahoria`.split('|'),
    color:`Amarillo|Ámbar|Azul|Beige|Bermellón|Blanco|Bordó|Bronce|Burdeos|Caqui|Celeste|Cian|Cobre|Coral|Dorado|Escarlata|Esmeralda|Fucsia|Granate|Gris|Índigo|Jade|Lavanda|Lila|Magenta|Marrón|Naranja|Negro|Ocre|Oliva|Púrpura|Rojo|Rosa|Salmón|Turquesa|Violeta|Verde`.split('|'),
    object:`Abanico|Abrelatas|Aguja|Álbum|Alfombra|Almohada|Anillo|Antena|Arco|Armario|Aspiradora|Azucarera|Balanza|Bandeja|Baraja|Bastón|Batería|Bicicleta|Bolígrafo|Bolso|Botella|Bufanda|Cacerola|Cajón|Calculadora|Cama|Cámara|Camisa|Candado|Carpeta|Carretilla|Carta|Cartuchera|Casco|Cenicero|Cepillo|Cerradura|Cesto|Chaleco|Cinturón|Clavo|Cocina|Colador|Colchón|Cometa|Computadora|Copa|Cuchara|Cuchillo|Cuaderno|Cuadro|Dado|Delantal|Destornillador|Disco|Escalera|Escoba|Espejo|Estante|Fanal|Faro|Frazada|Frasco|Fuelle|Gafas|Gargantilla|Goma|Gorra|Grapadora|Guante|Guitarra|Hacha|Heladera|Hilo|Horno|Imán|Impresora|Jabón|Jarra|Jarrón|Juguete|Lámpara|Lata|Lavadora|Lentes|Libro|Licuadora|Llave|Lona|Lupa|Madera|Maleta|Manguera|Manta|Martillo|Mate|Mazo|Mesa|Micrófono|Mochila|Moneda|Motor|Muñeca|Navaja|Nevera|Obra|Olla|Ómnibus|Organizador|Pala|Palangana|Pañuelo|Papel|Paraguas|Parlante|Pava|Peine|Pelota|Persiana|Piano|Pinza|Pincel|Plato|Pluma|Puerta|Pulsera|Radio|Rallador|Reloj|Remera|Repasador|Revista|Rifle|Ropero|Sábana|Sacacorchos|Sartén|Silla|Sillón|Sombrero|Soga|Sombrilla|Tacho|Taza|Teclado|Teléfono|Televisor|Tenedor|Termo|Tijera|Tornillo|Trapo|Trípode|Trompeta|Tubo|Vaso|Vela|Ventilador|Vestido|Vidrio|Violín|Yoyo|Zapatilla|Zapato`.split('|'),
    brand:`Adidas|Acer|Apple|Arcor|Armani|Asus|Audi|Baggio|Bancor|Barbie|Bic|BMW|Brahma|Burger King|Canon|Carrefour|Chevrolet|Coca-Cola|Colgate|Converse|Danone|Dell|Dove|Dyson|Epson|Fanta|Ferrari|Fiat|Ford|Fujifilm|Gillette|Google|Gucci|H&M|Honda|HP|Hyundai|Ikea|Intel|Isadora|JBL|Jeep|John Deere|Kellogg's|Kodak|Lacoste|Lego|Lenovo|Levi's|L'Oréal|Mango|Mastercard|McDonald's|Mercedes-Benz|Microsoft|Mitsubishi|Motorola|Netflix|Nike|Nintendo|Nivea|Nokia|Oreo|Panasonic|Pepsi|Philips|Pirelli|Puma|Quilmes|Rexona|Renault|Rolex|Samsung|Sony|Sprite|Subway|Suzuki|Tefal|Toyota|Uber|Under Armour|Unilever|Vans|Visa|Volkswagen|Volvo|Whirlpool|Xiaomi|Xerox|Yamaha|Zara`.split('|'),
    famous:`Ada Lovelace|Albert Einstein|Alberto Sordi|Alejandro Sanz|Atahualpa Yupanqui|Barack Obama|Carlos Gardel|Charles Darwin|Charly García|Cristiano Ronaldo|Diego Maradona|Duki|Edith Piaf|Elvis Presley|Emilia Mernes|Eva Perón|Frida Kahlo|Gabriel García Márquez|Gustavo Cerati|Harry Potter|Isaac Newton|Jorge Luis Borges|Lionel Messi|Luis Miguel|Madonna|Manu Ginóbili|Marie Curie|Marilyn Monroe|Mercedes Sosa|Michael Jackson|Mirtha Legrand|Napoleón|Nelson Mandela|Nikola Tesla|Pablo Picasso|Paulo Dybala|Pedro Almodóvar|Quino|Rafael Nadal|Ricardo Darín|Robert De Niro|Roger Federer|Shakira|Soda Stereo|Taylor Swift|Tini Stoessel|Vincent van Gogh|Violeta Parra|Walt Disney|Xuxa|Yoko Ono|Zinedine Zidane`.split('|')
  };
  const GAME_CATEGORIES = {
    'tutti-frutti':['nombre','animal','country','food','color','object'],
    basta:['nombre','animal','place','food','brand','famous']
  };
  const BASTA_CARDS = [
    {label:'Nombre masculino',key:'masculineName'}, {label:'Nombre femenino',key:'feminineName'},
    {label:'Algo que vuele',key:'thingFlies'}, {label:'Un animal',key:'animal'},
    {label:'Una fruta',key:'fruit'}, {label:'Una comida',key:'food'},
    {label:'Una provincia o país',key:'country'}, {label:'Una ciudad',key:'city'},
    {label:'Una marca de ropa',key:'clothingBrand'}, {label:'Una marca conocida',key:'brand'},
    {label:'Un cantante famoso',key:'singer'}, {label:'Una persona famosa',key:'famous'},
    {label:'Algo que hay en una casa',key:'object'}, {label:'Un color',key:'color'},
    {label:'Una bebida',key:'drink'}, {label:'Un deporte',key:'sport'},
    {label:'Un oficio',key:'job'}, {label:'Algo que se come en el desayuno',key:'breakfast'}
  ];
  CATEGORY_WORDS.masculineName=`Agustín|Alberto|Alejandro|Andrés|Antonio|Ariel|Benjamín|Bruno|Carlos|Claudio|Daniel|David|Diego|Eduardo|Esteban|Facundo|Felipe|Francisco|Gabriel|Gastón|Gonzalo|Guillermo|Héctor|Hugo|Ignacio|Javier|Jesús|Joaquín|Jorge|José|Juan|Julio|Lautaro|Leandro|Leonardo|Lorenzo|Luis|Manuel|Marcos|Mariano|Martín|Mateo|Matías|Miguel|Nahuel|Nicolás|Octavio|Omar|Oscar|Pablo|Pedro|Ramiro|Ricardo|Roberto|Rodrigo|Samuel|Santiago|Sergio|Tomás|Vicente|Walter`.split('|');
  CATEGORY_WORDS.feminineName=`Alicia|Ana|Beatriz|Brenda|Camila|Carla|Carmen|Cecilia|Clara|Dolores|Elena|Emilia|Eva|Fernanda|Gabriela|Guadalupe|Inés|Irene|Isabel|Jacinta|Jazmín|Julieta|Karen|Laura|Lucía|Marcela|María|Marta|Micaela|Milagros|Noelia|Olivia|Paula|Priscila|Rocío|Rosa|Sabrina|Sandra|Silvia|Sofía|Tamara|Tatiana|Valentina|Valeria|Vanesa|Victoria|Ximena|Yamila|Yesica|Yolanda|Zoe`.split('|');
  CATEGORY_WORDS.thingFlies=`Avión|Albatros|Abeja|Águila|Barrilete|Búho|Canario|Colibrí|Cometa|Dron|Faisán|Flamenco|Gaviota|Globo|Golondrina|Helicóptero|Mariposa|Mosca|Murciélago|Pájaro|Papagayo|Paloma|Pato|Pelícano|Polilla|Quetzal|Tucán`.split('|');
  CATEGORY_WORDS.fruit=`Ananá|Banana|Cereza|Ciruela|Coco|Damasco|Durazno|Frambuesa|Frutilla|Granada|Higo|Kiwi|Limón|Mandarina|Mango|Manzana|Melón|Naranja|Pera|Pomelo|Sandía|Uva`.split('|');
  CATEGORY_WORDS.clothingBrand=`Adidas|Asics|Converse|Fila|Gap|H&M|Kappa|Lacoste|Levi's|Mango|New Balance|Nike|Puma|Reebok|Topper|Under Armour|Vans|Zara`.split('|');
  CATEGORY_WORDS.city=`Asunción|Bariloche|Berlín|Bogotá|Buenos Aires|Córdoba|Corrientes|Curitiba|Formosa|Goya|La Plata|Lima|Londres|Madrid|Mar del Plata|Mendoza|Montevideo|Neuquén|Nueva York|París|Posadas|Resistencia|Río de Janeiro|Rosario|Salta|San Pablo|Santa Fe|Santiago|Tokio|Tucumán|Ushuaia|Valencia|Viena|Washington|Zaragoza`.split('|');
  CATEGORY_WORDS.singer=`Abel Pintos|Alejandro Sanz|Andrés Calamaro|Bad Bunny|Charly García|Duki|Ed Sheeran|Emilia Mernes|Fito Páez|Gilda|Gustavo Cerati|Joaquín Sabina|Lali|Luis Miguel|Madonna|Mercedes Sosa|Ricky Martin|Shakira|Tini Stoessel`.split('|');
  CATEGORY_WORDS.drink=`Agua|Aguardiente|Bebida cola|Café|Cerveza|Chocolate|Fernet|Gaseosa|Jugo|Licuado|Limonada|Mate|Té|Tereré|Vino`.split('|');
  CATEGORY_WORDS.sport=`Atletismo|Básquet|Boxeo|Ciclismo|Fútbol|Gimnasia|Hockey|Natación|Pádel|Rugby|Tenis|Vóley`.split('|');
  CATEGORY_WORDS.job=`Abogado|Arquitecto|Carpintero|Cocinero|Docente|Electricista|Enfermero|Futbolista|Ingeniero|Jardinero|Mecánico|Médico|Panadero|Peluquero|Policía|Veterinario`.split('|');
  CATEGORY_WORDS.breakfast=`Avena|Bizcocho|Café|Cereal|Churro|Facturas|Galleta|Leche|Manteca|Medialuna|Mermelada|Pan|Tostada|Yogur`.split('|');
  const norm = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').trim().replace(/\s+/g, ' ');
  const CATEGORY_SETS = Object.fromEntries(Object.entries(CATEGORY_WORDS).map(([key,words])=>[key,new Set(words.map(norm))]));
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
  function computerAnswers(gameId, letter, pick = Math.random, missChance = .16) {
    if (!WORDS[gameId] || !Array.isArray(letter) && typeof letter !== 'string') return [];
    return GAME_CATEGORIES[gameId].map(key => { const matches=CATEGORY_WORDS[key].filter(word => norm(word).startsWith(letter.toLocaleLowerCase('es'))); return !matches.length || pick()<missChance ? '' : matches[Math.floor(pick()*matches.length)]; });
  }
  function newWords(gameId, capacity, host) {
    const config = WORDS[gameId];
    if (!config || !clampCapacity(capacity)) throw new RangeError('Cantidad de jugadores inválida.');
    return { players: [host, ...Array(capacity - 1).fill(null)], capacity, gameId, scores: Array(capacity).fill(0), round: 0, phase: 'waiting', letter: null, deadline: null, answers: Array(capacity).fill(null), submitted: Array(capacity).fill(false), results: null, winner: null, availableLetters:[], alive:Array(capacity).fill(false), turn:0, roundWinner:null, card:null, turns:0, lastEvent: 'Esperando que se complete la mesa.' };
  }
  function startWords(game, now, pick = Math.random) {
    if (!game.players.length || game.players.some(player => !player)) return null;
    game.round = 1;
    return startWordRound(game, now, pick);
  }
  function startWordRound(game, now, pick = Math.random) {
    const config = WORDS[game.gameId];
    if (!config) return null;
    if (game.gameId === 'basta') return startBastaRound(game, now, pick);
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
      if (!key) return { answer, points: 0, reason: 'vacía' };
      if (!key.startsWith(game.letter.toLocaleLowerCase('es'))) return { answer, points: 0, reason: 'letra' };
      if (!CATEGORY_SETS[GAME_CATEGORIES[game.gameId][index]]?.has(key)) return { answer, points: 0, reason: 'categoría' };
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
    if (!WORDS[game.gameId] || game.gameId === 'basta' || game.phase !== 'answering' || !Number.isInteger(seat) || !game.players[seat] || game.submitted[seat]) return false;
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

  function startBastaRound(game, now, pick = Math.random) {
    const card=BASTA_CARDS[Math.floor(pick()*BASTA_CARDS.length)%BASTA_CARDS.length];
    game.round+=game.round===0?1:0;game.card={...card};game.availableLetters=ALPHABET.split('');game.alive=game.players.map(Boolean);game.turn=Math.floor(pick()*game.capacity)%game.capacity;while(!game.alive[game.turn])game.turn=(game.turn+1)%game.capacity;
    game.turns=0;game.lastSuccessfulSeat=null;game.roundWinner=null;game.winner=null;game.phase='answering';game.deadline=now+WORDS.basta.seconds*1000;game.lastEvent=`Tarjeta: ${card.label}. Turno de ${game.players[game.turn].nickname}. Decí una respuesta y usá su letra inicial.`;game.answers=Array(game.capacity).fill(null);game.history=[];game.submitted=Array(game.capacity).fill(false);game.results=null;return game;
  }
  function finishBastaRound(game,winner){
    game.roundWinner=winner;game.deadline=null;game.phase='results';if(winner>=0)game.scores[winner]++;if(winner>=0&&game.scores[winner]>=WORDS.basta.rounds){game.winner=winner;game.phase='finished';game.lastEvent=`${game.players[winner].nickname} ganó ${game.scores[winner]} rondas y es el campeón de ¡Basta!`}
    else game.lastEvent=winner>=0?`${game.players[winner].nickname} gana esta ronda. ¡Primero en ganar 3 rondas se lleva la partida!`:'La ronda terminó empatada.';return game;
  }
  function advanceBastaTurn(game,now){
    const alive=game.alive.reduce((n,isAlive)=>n+(isAlive?1:0),0);if(alive<=1)return finishBastaRound(game,game.alive.findIndex(Boolean));
    if(!game.availableLetters.length)return finishBastaRound(game,game.lastSuccessfulSeat??-1);
    for(let steps=0;steps<game.capacity;steps++){game.turn=(game.turn+1)%game.capacity;if(game.alive[game.turn])break;}
    game.deadline=now+WORDS.basta.seconds*1000;game.lastEvent+=` Turno de ${game.players[game.turn].nickname}.`;return game;
  }
  function eliminateBastaPlayer(game,seat,reason,now){
    game.alive[seat]=false;game.lastEvent=`${game.players[seat].nickname} queda fuera: ${reason}.`;return advanceBastaTurn(game,now);
  }
  function playBastaTurn(game,seat,letter,now,spokenWord=''){
    if(!game||game.gameId!=='basta'||game.phase!=='answering'||!Number.isInteger(seat)||seat!==game.turn||!game.players[seat]||!game.alive[seat])return false;
    if(now>=game.deadline){expireBastaTurn(game,now);return false;}
    const value=cleanAnswer(spokenWord),selected=String(letter||'').toLocaleUpperCase('es');
    if(!game.availableLetters.includes(selected))return !!eliminateBastaPlayer(game,seat,'esa letra ya fue usada',now);
    game.availableLetters=game.availableLetters.filter(item=>item!==selected);game.turns++;game.lastSuccessfulSeat=seat;game.answers[seat]={answer:value,letter:selected,card:game.card.label};game.history.push({seat,answer:value,letter:selected});game.lastEvent=`${game.players[seat].nickname} respondió y gastó la letra ${selected}.`;return !!advanceBastaTurn(game,now);
  }
  function expireBastaTurn(game,now){if(!game||game.gameId!=='basta'||game.phase!=='answering'||now<game.deadline)return false;eliminateBastaPlayer(game,game.turn,'no respondió a tiempo',now);return true;}
  function computerBastaTurn(game,seat,pick=Math.random){
    if(!game||game.gameId!=='basta'||game.phase!=='answering'||game.turn!==seat||!game.alive[seat])return null;const choices=[];
    for(const letter of game.availableLetters){for(const answer of CATEGORY_WORDS[game.card.key]||[]){if(norm(answer).startsWith(letter.toLocaleLowerCase('es')))choices.push({answer,letter})}}
    if(!choices.length)return {answer:'',letter:game.availableLetters[0]||''};return choices[Math.floor(pick()*choices.length)%choices.length];
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
  return { WORDS, ALPHABET, BOARD, CATEGORY_WORDS, BASTA_CARDS, clampCapacity, newWords, startWords, startWordRound, scoreWords, submitWords, nextWordsRound, computerAnswers, startBastaRound, playBastaTurn, expireBastaTurn, computerBastaTurn, estancieroPlayer, newEstanciero, rollEstanciero, buyEstanciero, buildEstanciero, endEstanciero, computerEstancieroAction, norm };
})()
