# Audio design V1

Voice Lab is available at `/dev/voice-lab`.

The analyzer captures mono samples locally, removes DC offset, trims edge silence, normalizes with a fixed safety ceiling, and converts roughly 32 frames per second into pitch, amplitude, voicing, noise, and sixteen spectral-band values. The JSON is validated and capped at 32 KiB.

The synthesizer combines a deterministic voiced oscillator and seed-driven colored noise. A browser dynamics compressor is the final safety stage. The current implementation is a technical baseline; the pass/fail listening test is whether a real animal and a human imitation both sound like they passed through the same fictional analyzer without losing the target animal identity.

Synthetic fixtures are deliberately not presented as licensed real animal recordings. Adding a production recording requires metadata and an Animal Lab review.
