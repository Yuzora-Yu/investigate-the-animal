# Architectural decisions

## 2026-08-25 — Local-first VoiceRecipe V1

- Runtime audio capture, analysis, transformation, and synthesis stay in the browser.
- The network boundary accepts structured `VoiceRecipeV1` only. Raw PCM, WAV, WebM, Blob payloads, identity hints, and source labels are rejected by a strict schema.
- Noise and all synthetic fixture generation use stored seeds so the same recipe is deterministic.
- The initial animal pack is synthetic and license-clean. Real animal recordings may be added only with source URL, author, license, attribution, and `sourceFamilyId` metadata.
- `AUDIO_TRANSPORT_MODE` remains conceptually `VOICE_RECIPE`. Temporary processed audio is not implemented while the recipe approach is under validation.

## 2026-08-25 — First playable scope

- The first playable is solo “さがしてみる”: eight animal slots, one human-imitation recipe, 60-second timer, private selection, reveal, and replay.
- Multiplayer, D1 contribution storage, and community moderation are deferred until Voice Lab listening tests pass the common-device-quality gate.
- Game rules and audio logic live under `packages/`; pages and interactive presentation live under `app/`.
- Prisma Abyss character portraits are copied without modifying their pixels. This game adds only separate guest-investigator hearing profiles and does not extend their canon.

## 2026-08-25 — Visual and hosting defaults

- Local system Japanese fonts are used; no runtime fonts, CDN assets, analytics, or paid inference APIs are loaded.
- Generated animal art is original, stored locally, and used as a single sprite sheet. UI labels remain accessible HTML/CSS.
- The Cloudflare-compatible site scaffold is retained. Durable Objects are not added before VoiceRecipe quality validation.
