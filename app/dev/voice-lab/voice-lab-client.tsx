'use client';

import Link from 'next/link';
import { useMemo, useRef, useState } from 'react';
import { analyzePcmToRecipe, preprocessPcm } from '../../../packages/audio/analyzer';
import { playRecipe } from '../../../packages/audio/browser';
import { createAnimalRecipe } from '../../../packages/audio/fixtures';
import { startLocalRecorder, type LocalRecorder } from '../../../packages/audio/recorder';
import { renderRecipeToPcm } from '../../../packages/audio/synth';
import { assertRecipeSafe, recipeByteSize, type VoiceRecipeV1, type VoiceTransform } from '../../../packages/audio/types';
import { pcmToWavBlob } from '../../../packages/audio/wav';
import Waveform from './waveform';

const DEFAULT_TRANSFORM: VoiceTransform = { height: 0, thickness: 0, speed: 1, roughness: 0 };

export default function VoiceLabClient() {
  const [recipe, setRecipe] = useState<VoiceRecipeV1>(() => createAnimalRecipe('cat', 44021));
  const [raw, setRaw] = useState<Float32Array>(new Float32Array());
  const [sampleRate, setSampleRate] = useState(24000);
  const [recording, setRecording] = useState(false);
  const [message, setMessage] = useState('マイクか音声ファイルを使って、分析装置をためせます。');
  const [transform, setTransform] = useState<VoiceTransform>(DEFAULT_TRANSFORM);
  const [jsonDraft, setJsonDraft] = useState('');
  const recorderRef = useRef<LocalRecorder | null>(null);
  const autoStopRef = useRef<number | null>(null);
  const synthesized = useMemo(() => renderRecipeToPcm(recipe, sampleRate, transform), [recipe, sampleRate, transform]);

  const stopRecording = async () => {
    if (!recorderRef.current) return;
    if (autoStopRef.current) window.clearTimeout(autoStopRef.current);
    const recorder = recorderRef.current;
    recorderRef.current = null;
    const captured = await recorder.stop();
    const cleaned = preprocessPcm(captured.pcm);
    const next = analyzePcmToRecipe(cleaned, captured.sampleRate, Date.now() & 0x7fffffff);
    setRaw(cleaned);
    setSampleRate(captured.sampleRate);
    setRecipe(next);
    setJsonDraft(JSON.stringify(next, null, 2));
    setRecording(false);
    setMessage(`分析できました。${next.durationMs}ms / ${next.frames.length}フレーム`);
  };

  const toggleRecording = async () => {
    if (recording) {
      await stopRecording();
      return;
    }
    try {
      recorderRef.current = await startLocalRecorder();
      setRecording(true);
      setMessage('録音中… もう一度押すと止まります（最大3秒）');
      autoStopRef.current = window.setTimeout(() => void stopRecording(), 3000);
    } catch {
      setMessage('マイクを使えませんでした。ファイル読込は使えます。');
    }
  };

  const playRaw = () => {
    if (!raw.length) return;
    const url = URL.createObjectURL(pcmToWavBlob(raw, sampleRate));
    const audio = new Audio(url);
    audio.addEventListener('ended', () => URL.revokeObjectURL(url), { once: true });
    void audio.play();
  };

  const importAudio = async (file: File) => {
    const context = new AudioContext();
    const decoded = await context.decodeAudioData(await file.arrayBuffer());
    const channel = new Float32Array(decoded.getChannelData(0));
    const cleaned = preprocessPcm(channel);
    const next = analyzePcmToRecipe(cleaned, decoded.sampleRate, 78123);
    await context.close();
    setRaw(cleaned);
    setSampleRate(decoded.sampleRate);
    setRecipe(next);
    setJsonDraft(JSON.stringify(next, null, 2));
    setMessage(`${file.name} を端末内で分析しました。`);
  };

  const exportJson = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(recipe, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `voice-recipe-v1-${recipe.seed}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importJson = () => {
    try {
      const next = assertRecipeSafe(JSON.parse(jsonDraft));
      setRecipe(next);
      setMessage('VoiceRecipe JSONを読み込みました。');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'JSONを読み込めませんでした。');
    }
  };

  return (
    <main className="lab-shell">
      <header className="lab-header">
        <Link href="/">← ゲームへ</Link>
        <div><p>DEVELOPMENT CONSOLE</p><h1>Voice Lab</h1></div>
        <span>VOICE_RECIPE / V1</span>
      </header>
      <section className="lab-notice" role="status"><span className={recording ? 'recording-dot' : ''} />{message}</section>
      <div className="lab-grid">
        <section className="lab-card capture-card">
          <div className="lab-card-title"><span>01</span><h2>こえを分析</h2></div>
          <button className={`record-button ${recording ? 'active' : ''}`} type="button" onClick={toggleRecording}>
            <span>{recording ? '■' : '●'}</span>{recording ? '録音をとめる' : 'こえをとる'}
          </button>
          <label className="file-button">音声ファイルを読み込む<input type="file" accept="audio/*" onChange={(event) => event.target.files?.[0] && void importAudio(event.target.files[0])} /></label>
          <div className="dual-actions"><button type="button" disabled={!raw.length} onClick={playRaw}>▶ 生音声</button><button type="button" onClick={() => void playRecipe(recipe, transform)}>▶ 再合成音</button></div>
          <dl className="lab-stats"><div><dt>長さ</dt><dd>{recipe.durationMs} ms</dd></div><div><dt>フレーム</dt><dd>{recipe.frames.length}</dd></div><div><dt>データ量</dt><dd>{(recipeByteSize(recipe) / 1024).toFixed(1)} KB</dd></div><div><dt>送信</dt><dd>JSONのみ</dd></div></dl>
        </section>

        <section className="lab-card transform-card">
          <div className="lab-card-title"><span>02</span><h2>こえをへんしん</h2></div>
          <LabSlider label="たかさ" left="ひくい" right="たかい" min={-1} max={1} step={.01} value={transform.height} onChange={(height) => setTransform({ ...transform, height })} />
          <LabSlider label="ふとさ" left="ほそい" right="ふとい" min={-1} max={1} step={.01} value={transform.thickness} onChange={(thickness) => setTransform({ ...transform, thickness })} />
          <LabSlider label="はやさ" left="ゆっくり" right="はやい" min={.72} max={1.28} step={.01} value={transform.speed} onChange={(speed) => setTransform({ ...transform, speed })} />
          <LabSlider label="ガサガサ" left="なめらか" right="ガサガサ" min={-1} max={1} step={.01} value={transform.roughness} onChange={(roughness) => setTransform({ ...transform, roughness })} />
          <button className="reset-button" type="button" onClick={() => setTransform(DEFAULT_TRANSFORM)}>まんなかにもどす</button>
        </section>

        <section className="lab-card waveform-card">
          <div className="lab-card-title"><span>03</span><h2>波形をくらべる</h2></div>
          <Waveform data={raw} color="#ffd06d" label="生音声（端末内のみ）" />
          <Waveform data={synthesized} color="#66f4e6" label="VoiceRecipe 再合成" />
        </section>

        <section className="lab-card json-card">
          <div className="lab-card-title"><span>04</span><h2>VoiceRecipe JSON</h2></div>
          <textarea value={jsonDraft || JSON.stringify(recipe, null, 2)} spellCheck={false} onChange={(event) => setJsonDraft(event.target.value)} aria-label="VoiceRecipe JSON" />
          <div className="json-actions"><button type="button" onClick={importJson}>JSONを読み込む</button><button type="button" onClick={exportJson}>JSONを書き出す</button></div>
        </section>
      </div>
      <footer className="lab-footer"><strong>PRIVACY CHECK</strong><span>録音PCM / WAV / WebM はネットワークへ送信しません。生音声はページを閉じると消えます。</span></footer>
    </main>
  );
}

function LabSlider({ label, left, right, min, max, step, value, onChange }: { label: string; left: string; right: string; min: number; max: number; step: number; value: number; onChange: (value: number) => void }) {
  return <label className="lab-slider"><strong>{label}</strong><input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} /><span><small>{left}</small><small>{right}</small></span></label>;
}
