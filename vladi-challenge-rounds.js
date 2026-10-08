(() => {
  const upper = s => s.toLocaleUpperCase("es-AR");
  const shuffled = list => {
    const a = [...list];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  };
  const makeCaja = G => {
    const items = [
      ["ESCUELA","📚","LIBRO","TIENE PÁGINAS LLENAS DE LETRAS","SIRVE PARA LEER CUENTOS Y APRENDER"],
      ["ESCUELA","📒","CUADERNO","SUS HOJAS SE LLENAN CON NOTAS Y DIBUJOS","SUELE IR EN LA MOCHILA"],
      ["ESCUELA","✏️","LÁPIZ","TIENE UNA PUNTA QUE SE PUEDE SACAR","SIRVE PARA ESCRIBIR Y DIBUJAR"],
      ["ESCUELA","🧽","GOMA","BORRA LO QUE ESCRIBISTE CON LÁPIZ","ES PEQUEÑA Y VA EN LA CARTUCHERA"],
      ["ESCUELA","📏","REGLA","TIENE MARQUITAS PARA MEDIR","AYUDA A DIBUJAR LÍNEAS DERECHAS"],
      ["ESCUELA","✂️","TIJERA","TIENE DOS AROS PARA LOS DEDOS","SIRVE PARA CORTAR PAPEL"],
      ["ESCUELA","🧴","PEGAMENTO","ES VISCOSO Y PEGA PAPEL","SE USA EN TRABAJOS MANUALES"],
      ["ESCUELA","🎒","MOCHILA","SE LLEVA COLGADA EN LA ESPALDA","GUARDA ÚTILES Y CUADERNOS"],
      ["ESCUELA","🖍️","CRAYONES","VIENEN EN VARIOS COLORES","SIRVEN PARA PINTAR SOBRE PAPEL"],
      ["ESCUELA","🔪","SACAPUNTAS","TIENE UN AGUJERO Y UNA CUCHILLA","AFILA LA PUNTA DEL LÁPIZ"],
      ["ESCUELA","📁","CARPETA","GUARDA HOJAS SIN QUE SE PIERDAN","PUEDE TENER ANILLOS O SOLAPAS"],
      ["ESCUELA","🖌️","PINCEL","TIENE CERDAS SUAVES EN LA PUNTA","SIRVE PARA PINTAR CON TÉMPERA"],
      ["ESCUELA","🎨","PINTURA","VIENE EN FRASCOS O PASTILLAS DE COLOR","SE MEZCLA CON AGUA PARA PINTAR"],
      ["ESCUELA","🗺️","MAPA","MUESTRA PAÍSES, RÍOS O CAMINOS","AYUDA A UBICAR LUGARES"],
      ["ESCUELA","🧮","CALCULADORA","TIENE TECLAS CON NÚMEROS","AYUDA A HACER CUENTAS"],
      ["ANIMALES","🐱","GATO","RONRONEA Y DICE MIAU","LE GUSTA DORMIR AL SOL"],
      ["ANIMALES","🐶","PERRO","LADRA Y MUEVE LA COLA","PUEDE SER UN GRAN COMPAÑERO"],
      ["ANIMALES","🦁","LEÓN","TIENE UNA GRAN MELENA","ES CONOCIDO COMO EL REY DE LA SELVA"],
      ["ANIMALES","🐘","ELEFANTE","TIENE UNA TROMPA LARGA","ES MUY GRANDE Y TIENE BUENA MEMORIA"],
      ["ANIMALES","🦒","JIRAFA","TIENE EL CUELLO MUY LARGO","SU CUERPO TIENE MANCHAS"],
      ["ANIMALES","🐸","RANA","DA GRANDES SALTOS Y HACE CROAC","VIVE CERCA DEL AGUA"],
      ["ANIMALES","🐝","ABEJA","VUELA DE FLOR EN FLOR","AYUDA A PRODUCIR MIEL"],
      ["ANIMALES","🦋","MARIPOSA","TIENE ALAS DE MUCHOS COLORES","VUELA DE FLOR EN FLOR"],
      ["ANIMALES","🐢","TORTUGA","TIENE UN CAPARAZÓN","CAMINA DESPACITO"],
      ["ANIMALES","🐧","PINGÜINO","TIENE PLUMAS BLANCAS Y NEGRAS","CAMINA ERGUIDO Y NADA MUY BIEN"],
      ["ANIMALES","🐟","PEZ","TIENE ALETAS Y ESCAMAS","VIVE Y RESPIRA BAJO EL AGUA"],
      ["ANIMALES","🐰","CONEJO","TIENE OREJAS LARGAS","LE GUSTAN LAS ZANAHORIAS"],
      ["ANIMALES","🐴","CABALLO","TIENE CRIN Y CUATRO PATAS","PUEDE GALOPAR MUY RÁPIDO"],
      ["ANIMALES","🐮","VACA","DA LECHE Y DICE MUU","COME PASTO EN EL CAMPO"],
      ["ANIMALES","🦆","PATO","TIENE PICO ANCHO Y PATAS PALMEADAS","LE GUSTA NADAR EN EL AGUA"],
      ["ANIMALES","🦉","BÚHO","TIENE OJOS GRANDES","SUELE ESTAR DESPIERTO DE NOCHE"],
      ["ANIMALES","🦊","ZORRO","TIENE OREJAS PUNTIAGUDAS Y COLA ESPONJOSA","ES ASTUTO Y CAMINA POR EL BOSQUE"],
      ["ANIMALES","🐵","MONO","SE BALANCEA ENTRE LOS ÁRBOLES","LE GUSTAN LAS BANANAS"],
      ["ANIMALES","🐬","DELFIN","ES MUY INTELIGENTE Y JUGUETÓN","SALTA SOBRE LAS OLAS"],
      ["ANIMALES","🐑","OVEJA","TIENE MUCHA LANA","VIVE EN EL CAMPO Y DICE BEEE"],
      ["COMIDA","🍌","BANANA","ES AMARILLA Y SE PELA PARA COMER","A LOS MONOS LES GUSTA MUCHO"],
      ["COMIDA","🍊","NARANJA","ES UNA FRUTA REDONDA Y CÍTRICA","SE PUEDE EXPRIMIR PARA HACER JUGO"],
      ["COMIDA","🍎","MANZANA","PUEDE SER ROJA O VERDE","CRUJE CUANDO LE DAS UN MORDISCO"],
      ["COMIDA","🍐","PERA","ES VERDE O AMARILLA Y MÁS ANCHA ABAJO","TIENE UNA SEMILLA EN EL CENTRO"],
      ["COMIDA","🍓","FRUTILLA","ES ROJA Y TIENE SEMILLITAS AFUERA","QUEDA RICA CON CREMA"],
      ["COMIDA","🍇","UVAS","CRECEN EN RACIMOS","PUEDEN SER VERDES O MORADAS"],
      ["COMIDA","🍉","SANDÍA","TIENE CÁSCARA VERDE Y PULPA ROJA","ES GRANDE Y MUY JUGOSA"],
      ["COMIDA","🥕","ZANAHORIA","ES NARANJA Y CRECE BAJO TIERRA","ES CRUJIENTE Y LE GUSTA AL CONEJO"],
      ["COMIDA","🍅","TOMATE","ES ROJO Y JUGOSO","SE USA EN ENSALADAS Y SALSAS"],
      ["COMIDA","🌽","CHOCLO","TIENE GRANOS AMARILLOS EN UNA MAZORCA","SE PUEDE COMER CON MANTECA"],
      ["COMIDA","🍞","PAN","SE HACE CON HARINA Y LEVADURA","VA MUY BIEN EN UN SÁNDWICH"],
      ["COMIDA","🧀","QUESO","SE HACE CON LECHE","PUEDE SER BLANDO O DURO"],
      ["COMIDA","🥚","HUEVO","TIENE CÁSCARA Y YEMA","SE PUEDE COCINAR FRITO O HERVIDO"],
      ["COMIDA","🥛","LECHE","ES BLANCA Y SE GUARDA EN LA HELADERA","SE TOMA EN EL DESAYUNO"],
      ["COMIDA","🍕","PIZZA","TIENE MASA, SALSA Y QUESO","SE CORTA EN PORCIONES TRIANGULARES"],
      ["COMIDA","🥣","SOPA","SE SIRVE CALIENTE EN UN PLATO HONDO","PUEDE TENER FIDEOS Y VERDURAS"],
      ["COMIDA","🍪","GALLETITA","ES DULCE Y PUEDE TENER CHIPS","SE MOJA EN LA LECHE"],
      ["COMIDA","🎂","TORTA","SUELE TENER VELITAS EN LOS CUMPLEAÑOS","SE CORTA EN PORCIONES"],
      ["COMIDA","🍯","MIEL","ES DORADA Y MUY DULCE","LA HACEN LAS ABEJAS"],
      ["COMIDA","🍋","LIMÓN","ES AMARILLO Y MUY ÁCIDO","SE USA PARA HACER LIMONADA"],
      ["TRANSPORTE","🚗","AUTO","TIENE CUATRO RUEDAS","TE LLEVA POR LA CALLE"],
      ["TRANSPORTE","🚌","COLECTIVO","LLEVA A MUCHAS PERSONAS","SE DETIENE EN LAS PARADAS"],
      ["TRANSPORTE","🚲","BICICLETA","TIENE DOS RUEDAS Y PEDALES","AVANZA CUANDO PEDALEÁS"],
      ["TRANSPORTE","🚂","TREN","AVANZA SOBRE RIELES","PUEDE LLEVAR MUCHOS VAGONES"],
      ["TRANSPORTE","✈️","AVIÓN","TIENE ALAS Y VUELA MUY ALTO","TRANSPORTA PERSONAS POR EL CIELO"],
      ["TRANSPORTE","🚚","CAMIÓN","TIENE UNA CAJA GRANDE ATRÁS","TRANSPORTA CARGAS POR LA RUTA"],
      ["TRANSPORTE","🚜","TRACTOR","TIENE RUEDAS GRANDES Y POTENTES","AYUDA A TRABAJAR EN EL CAMPO"],
      ["TRANSPORTE","🚕","TAXI","ES UN AUTO QUE LLEVA PASAJEROS","EL CONDUCTOR TE LLEVA A DESTINO"],
      ["TRANSPORTE","🚑","AMBULANCIA","TIENE SIRENA Y LUCES","LLEVA PERSONAS AL HOSPITAL"],
      ["TRANSPORTE","🚒","CAMIÓN DE BOMBEROS","ES ROJO Y LLEVA UNA ESCALERA","AYUDA A APAGAR INCENDIOS"],
      ["TRANSPORTE","🚁","HELICÓPTERO","TIENE ASPAS QUE GIRAN ARRIBA","PUEDE QUEDARSE QUIETO EN EL AIRE"],
      ["TRANSPORTE","🛶","BOTE","FLOTA Y AVANZA POR EL AGUA","PUEDE MOVERSE CON REMOS"],
      ["TRANSPORTE","🚢","BARCO","ES GRANDE Y NAVEGA POR EL MAR","PUEDE LLEVAR CARGA O PASAJEROS"],
      ["TRANSPORTE","🛴","MONOPATÍN","TIENE UNA PLATAFORMA Y MANUBRIO","SE IMPULSA CON UN PIE"],
      ["TRANSPORTE","🛹","PATINETA","TIENE CUATRO RUEDITAS","SE USA PARA ANDAR Y HACER TRUCOS"],
      ["HOGAR","🛏️","CAMA","TIENE COLCHÓN Y ALMOHADA","SIRVE PARA DORMIR Y DESCANSAR"],
      ["HOGAR","🪑","SILLA","TIENE ASIENTO Y RESPALDO","SIRVE PARA SENTARSE A LA MESA"],
      ["HOGAR","🪵","MESA","TIENE UNA SUPERFICIE PLANA","SIRVE PARA COMER, ESTUDIAR O APOYAR COSAS"],
      ["HOGAR","💡","LÁMPARA","SE ENCIENDE CUANDO HAY POCA LUZ","PUEDE ESTAR SOBRE UNA MESA"],
      ["HOGAR","🪞","ESPEJO","REFLEJA TODO LO QUE TIENE ENFRENTE","TE AYUDA A VERTE LA CARA"],
      ["HOGAR","🛌","ALMOHADA","ES BLANDA Y SE APOYA SOBRE LA CAMA","DESCANSÁS LA CABEZA ENCIMA"],
      ["HOGAR","☕","TAZA","TIENE UN ASA PARA AGARRARLA","SIRVE PARA TOMAR LECHE O CHOCOLATE"],
      ["HOGAR","🍽️","PLATO","ES REDONDO Y POCO PROFUNDO","SIRVE PARA SERVIR LA COMIDA"],
      ["HOGAR","🥄","CUCHARA","TIENE UN MANGO Y UNA PARTE CÓNCAVA","SIRVE PARA COMER SOPA"],
      ["HOGAR","🔑","LLAVE","ES DE METAL Y TIENE DIENTES","ABRE UNA PUERTA O UN CANDADO"],
      ["HOGAR","📱","TELÉFONO","TIENE UNA PANTALLA Y MUCHAS APLICACIONES","SIRVE PARA LLAMAR Y MANDAR MENSAJES"],
      ["HOGAR","⏰","RELOJ","TIENE NÚMEROS O MANECILLAS","TE DICE QUÉ HORA ES"],
      ["HOGAR","🧼","JABÓN","HACE ESPUMA CUANDO SE MOJA","SIRVE PARA LAVARSE LAS MANOS"],
      ["HOGAR","🧻","TOALLA","ABSORBE EL AGUA","SIRVE PARA SECARSE DESPUÉS DEL BAÑO"],
      ["HOGAR","💇","PEINE","TIENE MUCHOS DIENTES JUNTOS","AYUDA A ORDENAR EL PELO"],
      ["HOGAR","🪥","CEPILLO DE DIENTES","TIENE CERDAS PEQUEÑAS","SE USA CON PASTA PARA LIMPIAR LOS DIENTES"],
      ["HOGAR","☂️","PARAGUAS","SE ABRE SOBRE TU CABEZA","TE PROTEGE CUANDO LLUEVE"],
      ["HOGAR","🌀","VENTILADOR","SUS ASPAS GIRAN","MUEVE EL AIRE EN LOS DÍAS DE CALOR"],
      ["HOGAR","🧊","HELADERA","SE MANTIENE FRÍA POR DENTRO","CONSERVA LA COMIDA Y LAS BEBIDAS"],
      ["HOGAR","♨️","HORNO","SE CALIENTA POR DENTRO","SIRVE PARA COCINAR O CALENTAR COMIDA"],
      ["JUEGOS Y NATURALEZA","⚽","PELOTA","ES REDONDA Y PUEDE REBOTAR","SE USA PARA JUGAR"],
      ["JUEGOS Y NATURALEZA","🌙","LUNA","SALE DE NOCHE Y BRILLA EN EL CIELO","A VECES PARECE UNA MEDIALUNA"],
      ["JUEGOS Y NATURALEZA","☀️","SOL","NOS DA LUZ Y CALOR","SE VE DURANTE EL DÍA"],
      ["JUEGOS Y NATURALEZA","⭐","ESTRELLA","BRILLA EN EL CIELO OSCURO","PARECE TENER PUNTAS"],
      ["JUEGOS Y NATURALEZA","☁️","NUBE","FLOTÁ EN EL CIELO","PUEDE TRAER LLUVIA"],
      ["JUEGOS Y NATURALEZA","🌈","ARCOÍRIS","APARECE CUANDO SE JUNTAN SOL Y LLUVIA","TIENE MUCHOS COLORES"],
      ["JUEGOS Y NATURALEZA","🌻","GIRASOL","ES UNA FLOR GRANDE Y AMARILLA","SU TALLO SIGUE LA LUZ DEL SOL"],
      ["JUEGOS Y NATURALEZA","🌳","ÁRBOL","TIENE TRONCO, RAMAS Y HOJAS","DA SOMBRA Y PUEDE DAR FRUTOS"],
      ["JUEGOS Y NATURALEZA","🍃","HOJA","CRECE EN LAS RAMAS DE UNA PLANTA","PUEDE CAER EN OTOÑO"],
      ["JUEGOS Y NATURALEZA","🪁","BARRILETE","TIENE UNA COLA LARGA","VUELA SI HAY VIENTO"],
      ["JUEGOS Y NATURALEZA","🐚","CARACOL DE MAR","TIENE UNA CONCHA EN ESPIRAL","SE ENCUENTRA EN LA PLAYA"]
    ];
    const existing = [...G.rounds];
    const used = new Set(existing.map(r => upper(r.answer[1])));
    const extra = items.filter(x => !used.has(x[2])).slice(0, 100 - existing.length).map((x, i, all) => {
      const peers = items.filter(y => y[0] === x[0] && y[2] !== x[2]);
      const a = peers[(i * 3 + 1) % peers.length], b = peers[(i * 5 + 3) % peers.length];
      const second = a === b ? peers[(i * 5 + 4) % peers.length] : b;
      return { clues: [x[3] + ".", x[4] + "."], answer: [x[1], x[2]], options: [[x[1], x[2]], [a[1], a[2]], [second[1], second[2]]] };
    });
    return shuffled([...existing, ...extra]).slice(0, 100);
  };
  const makeSequences = G => {
    const motifs = [
      ["🔴","🔵","🟡"],["⭐","🌙","☀️"],["🍎","🍌","🍇"],["🐶","🐱","🐰"],["🚗","🚌","🚲"],
      ["🌼","🌻","🌷"],["🟩","🟦","🟨"],["🍓","🍊","🍐"],["🐠","🐢","🐬"],["⚽","🏀","🎾"],
      ["☁️","🌧️","🌈"],["🎈","🎁","🎉"],["🦋","🐝","🐞"],["🍕","🍔","🍟"],["🚀","🪐","🌟"],
      ["🧸","🪁","🪀"],["🥕","🌽","🥦"],["🐧","🦊","🐻"],["💜","💚","🧡"],["🚲","🛴","🛹"]
    ];
    const patterns = [[0,1],[0,0,1],[0,1,1],[0,1,2],[0,2,1],[0,1,0,2],[0,0,1,2],[0,1,1,2]];
    const rounds = [...G.rounds], seen = new Set(rounds.map(r => r.seq.join("")+"?"+r.answer));
    for (const pattern of patterns) for (const motif of motifs) {
      if (rounds.length >= 100) break;
      const seq = [0,1,2,3].map(i => motif[pattern[i % pattern.length]]);
      const answer = motif[pattern[4 % pattern.length]];
      const key = seq.join("")+"?"+answer;
      if (seen.has(key)) continue;
      seen.add(key);
      const options = shuffled([...motif]);
      rounds.push({ seq, answer, options });
    }
    return rounds.slice(0, 100);
  };
  const makeChanges = G => {
    const catalog = [
      ["🍎","MANZANA"],["🍐","PERA"],["🍋","LIMÓN"],["🍌","BANANA"],["🍓","FRUTILLA"],["🍇","UVAS"],["🍉","SANDÍA"],["🥕","ZANAHORIA"],
      ["🍅","TOMATE"],["🥦","BRÓCOLI"],["🌽","CHOCLO"],["🥑","PALTA"],["⚽","PELOTA"],["🏀","BALÓN"],["🧸","OSO"],["🪁","BARRILETE"],
      ["🚗","AUTO"],["🚲","BICICLETA"],["🚂","TREN"],["✈️","AVIÓN"],["🚀","COHETE"],["🐱","GATO"],["🐶","PERRO"],["🐰","CONEJO"],
      ["🐢","TORTUGA"],["🐸","RANA"],["🦋","MARIPOSA"],["🐟","PEZ"],["🌻","GIRASOL"],["🌈","ARCOÍRIS"],["⭐","ESTRELLA"],["🌙","LUNA"],
      ["🥛","LECHE"],["🍕","PIZZA"],["🎂","TORTA"],["👒","SOMBRERO"],["👟","ZAPATILLA"],["🎈","GLOBO"],["🔑","LLAVE"],["📚","LIBRO"],
      ["🪑","SILLA"],["⏰","RELOJ"],["🧦","MEDIA"],["🪥","CEPILLO"],["🐝","ABEJA"],["🦉","BÚHO"],["🍪","GALLETITA"],["🎨","PINTURA"]
    ];
    const rounds = [...G.rounds], seen = new Set();
    const signature = r => r.items.map(x => x[1]).sort().join("|")+":"+r.index+":"+r.to[1];
    rounds.forEach(r => seen.add(signature(r)));
    let attempt = 0;
    while (rounds.length < 100 && attempt < 4000) {
      const pool = shuffled(catalog);
      const items = pool.slice(0, 6), index = Math.floor(Math.random() * items.length), to = pool[6];
      const round = { items, index, to };
      const key = signature(round);
      if (!seen.has(key)) { seen.add(key); rounds.push(round); }
      attempt++;
    }
    return rounds.slice(0, 100);
  };
  const makeStories = G => {
    const plants = ["GIRASOL","ROSA","TULIPÁN","MARGARITA","CACTUS","TOMATE","ZANAHORIA","MANZANA","NARANJA","LIMÓN","PERA","UVA","FRUTILLA","SANDÍA","CHOCLO","POROTO","CALABAZA","LAVANDA","PINO","BAMBÚ"];
    const plantEmojis = ["🌻","🌹","🌷","🌼","🌵","🍅","🥕","🍎","🍊","🍋","🍐","🍇","🍓","🍉","🌽","🫘","🎃","💜","🌲","🎋"];
    const animals = [
      ["GALLINA","🐔","🐣"],["PATO","🦆","🐥"],["TORTUGA","🐢","🐢"],["COCODRILO","🐊","🐊"],["PINGÜINO","🐧","🐧"],
      ["AVESTRUZ","🪶","🐤"],["MARIPOSA","🦋","🐛"],["POLILLA","🦋","🐛"],["RANA","🐸","🐸"],["SALAMANDRA","🦎","🦎"],
      ["ABEJA","🐝","🐛"],["HORMIGA","🐜","🐛"],["MARIQUITA","🐞","🐛"],["PEZ","🐟","🐠"],["SALMÓN","🐟","🐠"],
      ["SERPIENTE","🐍","🐍"],["LAGARTIJA","🦎","🦎"],["GECKO","🦎","🦎"],["CODORNIZ","🐦","🐣"],["CISNE","🦢","🐣"]
    ];
    const dishes = [
      ["PIZZA","🍕"],["GALLETITAS","🍪"],["TORTA","🎂"],["PAN","🍞"],["LIMONADA","🍋"],["JUGO DE NARANJA","🍊"],
      ["ENSALADA","🥗"],["SOPA","🥣"],["POCHOCLO","🍿"],["SÁNDWICH","🥪"],["HELADO","🍦"],["ENSALADA DE FRUTAS","🍓"],
      ["PANQUEQUES","🥞"],["TORTILLA","🍳"],["LICUADO","🥤"],["EMPANADAS","🥟"],["FIDEOS","🍝"],["MERMELADA","🍯"],
      ["YOGUR","🥛"],["CHOCOLATE","🍫"]
    ];
    const crafts = [
      ["AVIÓN DE PAPEL","✈️"],["BARQUITO DE PAPEL","⛵"],["BARRILETE","🪁"],["MACETA DE BARRO","🏺"],["DIBUJO","🖼️"],
      ["PINTURA","🎨"],["PULSERA","📿"],["COLLAR","📿"],["ROMPECABEZAS","🧩"],["ROBOT","🤖"],
      ["CASTILLO DE CARTÓN","🏰"],["MÁSCARA","🎭"],["CORONA","👑"],["FLOR DE PAPEL","🌸"],["TÍTERE","🧸"],
      ["CASITA PARA PÁJAROS","🏠"],["MOLINO DE PAPEL","🌬️"],["AUTITO DE JUGUETE","🚗"],["CARTUCHERA","✏️"],["TARJETA DE REGALO","💌"]
    ];
    const routines = [
      ["DIENTES","🦷","🪥","SONRISA LIMPIA"],["MANOS","🧼","🫧","MANOS LIMPIAS"],["CAMA","🛏️","🛌","CAMA TENDIDA"],["MOCHILA","🎒","📚","MOCHILA PREPARADA"],["CORDONES","👟","🪢","CORDONES ATADOS"],
      ["FLORES","🌷","💧","FLORES REGADAS"],["PLANTAS","🪴","🚿","PLANTAS REGADAS"],["GATO","🐱","🥣","GATO ALIMENTADO"],["PERRO","🐕","🦮","PERRO PASEADO"],["MESA","🍽️","🥄","MESA PUESTA"],
      ["JUGUETES","🧸","🧺","JUGUETES ORDENADOS"],["TAZA","☕","🧽","TAZA LIMPIA"],["VENTANA","🪟","✨","VENTANA LIMPIA"],["ROPA","👕","🧺","ROPA DOBLADA"],["ABRIGO","🧥","🧣","ABRIGO PUESTO"],
      ["MERIENDA","🍎","🥪","MERIENDA PREPARADA"],["MUÑECO DE NIEVE","☃️","❄️","MUÑECO TERMINADO"],["HOJAS","🍂","🧹","HOJAS JUNTAS"],["CUADRO","🖼️","🔨","CUADRO COLGADO"],["VALIJA","🧳","👕","VALIJA PREPARADA"]
    ];
    const rounds = [...G.rounds];
    const seen = new Set(rounds.map(r => r.steps.map(s => s[1]).join("|")));
    const add = steps => {
      const key = steps.map(s => s[1]).join("|");
      if (!seen.has(key) && rounds.length < 100) { seen.add(key); rounds.push({ steps }); }
    };
    plants.forEach((name,i) => add([["🌰","SEMILLA DE "+name],["🌱","BROTE DE "+name],[plantEmojis[i],"CRECIÓ: "+name]]));
    animals.forEach(([name,adult,baby]) => add([["🥚","HUEVO DE "+name], [baby,"NACIÓ LA CRÍA"], [adult,"CRECIÓ: "+name]]));
    dishes.forEach(([name,emoji]) => add([["🧺","INGREDIENTES PARA "+name],["🥣","PREPARANDO "+name],[emoji,"¡A COMER: "+name+"!"]]));
    crafts.forEach(([name,emoji]) => add([["🧩","PIEZAS PARA "+name],["🛠️","ARMANDO "+name],[emoji,"QUEDÓ LISTO: "+name]]));
    routines.forEach(([name,before,after,done]) => add([[before,name+" ANTES"],["👐","HACIENDO "+name],[after,done]]));
    return shuffled(rounds).slice(0,100);
  };
  window.VladiChallengeRounds = G => {
    if (G.rounds.length >= 100) return G.rounds.slice(0,100);
    if (G.slug === "vladi-caja-misteriosa") return makeCaja(G);
    if (G.slug === "vladi-secuencias") return makeSequences(G);
    if (G.slug === "vladi-cambios") return makeChanges(G);
    if (G.slug === "vladi-historias") return makeStories(G);
    return G.rounds;
  };
})();