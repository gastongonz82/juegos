# VLADYERIK Arcade Online — Sites test

Site Worker for the trial room. It uses the same Sites Worker + D1 pattern recovered from Truco/UNO/Chinchón/Loba/Culo Sucio. D1 is authoritative; the browser polls the same-origin HTTP API. No Node server, third-party hosting or WebSocket endpoint is required.

`index.html` is the Site UI, `client.js` handles player presence, rooms, invitations, Naval Battle, Argentine Draughts and Ludo Matic. The Worker validates turns and moves before writing room state to this trial project's existing D1 `online_*` tables. Argentine Draughts uses a 10×10 board, 15 pieces per side, mandatory captures, maximum capture value, multi-capture sequences, flying kings and promotion. Ludo Matic supports 2–4 online seats, private/public rooms, invitations and solo play against 1–3 computer opponents. Both games use their shared rules engine in the client and Worker. The home screen first asks the player to choose a game, then offers solo or online modes. Tutti Frutti, ¡Basta! and Estanciero remain in preparation.

From this directory, run `npm run build`, `npm run validate`, and `npm test`. Package/deploy only from the Sites source checkout after its `.openai/hosting.json` contains the project ID returned by Sites and the `DB` binding.
