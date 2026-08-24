'use client';

import { mergeChunks } from './analyzer';

export type LocalRecorder = {
  stop: () => Promise<{ pcm: Float32Array; sampleRate: number }>;
};

export async function startLocalRecorder(): Promise<LocalRecorder> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
  });
  const context = new AudioContext({ latencyHint: 'interactive' });
  await context.resume();
  const source = context.createMediaStreamSource(stream);
  const processor = context.createScriptProcessor(2048, 1, 1);
  const silentGain = context.createGain();
  silentGain.gain.value = 0;
  const chunks: Float32Array[] = [];
  processor.onaudioprocess = (event) => {
    chunks.push(new Float32Array(event.inputBuffer.getChannelData(0)));
  };
  source.connect(processor);
  processor.connect(silentGain).connect(context.destination);

  let stopped = false;
  return {
    stop: async () => {
      if (stopped) return { pcm: new Float32Array(), sampleRate: context.sampleRate };
      stopped = true;
      processor.disconnect();
      source.disconnect();
      stream.getTracks().forEach((track) => track.stop());
      const sampleRate = context.sampleRate;
      await context.close();
      return { pcm: mergeChunks(chunks), sampleRate };
    },
  };
}
