# Vladi Bowling — gameplay audit

## Problems removed

The previous delivery selected a pin count from aim and force thresholds. A pocket window forced a strike, pin rows could fall without touching, the second ball used different rules, and spin never changed the ball path. Screen-space aim and collision coordinates differed. Gesture force depended on the ball's screen position instead of the actual gesture start. A resize could modify a delivered ball's position.

## Current model

`physics.js` uses metres, an independent world coordinate system and fixed 1/240-second steps. The ball travels, hooks in the dry backend, loses velocity on collision and falls irreversibly into a gutter. Pins tip after an impulse, slide and strike other pins. Fallen pins have finite-length collision bodies and remain visible until the delivery finishes. The second ball uses exactly the same solver with the standing leave. Nothing assigns a strike or a predefined pin count.

The scene and aiming guide project the same world coordinates. Results do not depend on viewport size or rendering frame rate. Position, target, force and hook are independent controls. A tap does not accidentally launch. A forward swipe uses its starting point and overall direction, rather than the last pointer event. Keyboard: left/right aim, up/down force, A/D starting position, Q/E hook, space to bowl, P/Esc pause. The sliders also work with mouse and touch.

This is an accessible **2.5D arcade approximation**, not a full 3D bowling laboratory. Friction, hook acceleration, tipping threshold and kickback response are calibrated game parameters; exact six-degree rigid-body pin dynamics and evolving oil patterns are not simulated. It has no random pin count or strike shortcut.

Scoring uses ten frames, two deliveries unless a strike, strike/spare bonuses, and the proper tenth-frame bonus deliveries. Both delivery marks are visible. Incomplete bonuses remain pending. Existing best scores and audio files are preserved.

## Primary references consulted

- USBC *Equipment Specifications and Certifications Manual*: 60 ft (18.288 m) to the headpin, 12-inch (0.3048 m) equilateral pin spacing, ball/pin dimensions and mass.
  https://bowl.com/getmedia/a5537417-9ef3-4aba-87c2-7c29af2b8da5/23_263-APRIL-23-ES-Manual-Update.pdf
- USBC *Striking 101*: 1–3 and 1–2 pockets, angle, speed and hook.
  https://bowl.com/striking-101-6ab7e4e97bc59c15e4a927a2bd09ce7d
- USBC *Keeping Score*: frame rules, bonus resolution and a complete 150-point worked example.
  https://bowl.com/welcome/keeping-score-7c992ab8f438aa57fac9f9aef753ae44
- Ji, Yang, Dominguez & Bester, *Using Physics Simulations to Find Targeting Strategies in Competitive Bowling* (2022): skid/hook phases and oil/friction dependence. The game's simplified solver does not claim to reproduce the paper's full differential model.
  https://arxiv.org/abs/2210.06753

## Verification

Run `node --test vladi-bowling/tests/*.test.cjs` from the repository root.

14 tests cover geometry; contact-driven central/pocket/side/gutter deliveries; meaningful force and hook; reproducible mirrored shots; corner-pin spare; finite positions; official scores including the USBC 150-point example and perfect 300; tenth-frame bonus handling; tap/swipe controls; pause during a roll; resize during a roll; identical outcomes at 30/60/120 FPS; complete games at 320×740, 390×844, 844×390 and 1363×936.

Static scenery is cached. No scene redraw runs while idle or paused. Sound effects are rate-limited. This audit changes only files inside `vladi-bowling/`.
