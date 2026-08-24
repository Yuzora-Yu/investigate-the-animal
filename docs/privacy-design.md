# Privacy design

- Microphone permission is requested only after a button press.
- Captured samples live in page memory and disappear on reload or navigation.
- No recorder output is written to localStorage, IndexedDB, a server, analytics, or object storage.
- The strict multiplayer draft schema permits only `VoiceRecipeV1`; tests reject raw-audio and identity-related fields.
- There is no account, chat, voice chat, image upload, public search, or public matchmaking in the first playable.
- Community contribution will require an explicit opt-in and will send only the validated recipe and minimal animal/quality metadata.
