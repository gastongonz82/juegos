# VLADYERIK Arcade Online — Sites test

Site Worker for the trial room. It uses the same Sites Worker + D1 pattern recovered from Truco/UNO/Chinchón/Loba/Culo Sucio. D1 is authoritative; the browser polls the same-origin HTTP API. No Node server, third-party hosting or WebSocket endpoint is required.

`index.html` is the Site UI, `client.js` handles player presence, rooms, invitations and the two-player naval match, and `worker/index.js` serves the UI and validates every API request. The D1 migration creates only this trial project's `online_*` tables. Other games remain visibly marked as in preparation.

From this directory, run `npm run build`, `npm run validate`, and `npm test`. Package/deploy only from the Sites source checkout after its `.openai/hosting.json` contains the project ID returned by Sites and the `DB` binding.
