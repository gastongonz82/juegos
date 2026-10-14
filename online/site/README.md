# VLADYERIK Arcade Online — Sites test

Site Worker for the trial room. It uses the same Sites Worker + D1 pattern recovered from Truco/UNO/Chinchón/Loba/Culo Sucio. D1 is authoritative; the browser polls the same-origin HTTP API. No Node server, third-party hosting or WebSocket endpoint is required.

`index.html` is the Site UI, `client.js` handles player presence, rooms, invitations, Naval Battle and Argentine Draughts. The Worker validates moves and turns before writing room state to this trial project's existing D1 `online_*` tables. Argentine Draughts uses a 10×10 board, 15 pieces per side, mandatory captures, maximum capture value, multi-capture sequences, flying kings and promotion. Solo Draughts uses the same move engine and offers three computer difficulties. Other games remain visibly marked as in preparation.

From this directory, run `npm run build`, `npm run validate`, and `npm test`. Package/deploy only from the Sites source checkout after its `.openai/hosting.json` contains the project ID returned by Sites and the `DB` binding.
