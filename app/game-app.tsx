'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { playRecipe, stopActiveRecipe, unlockAudio } from '../packages/audio/browser';
import { createAnimalRecipe, type AnimalId } from '../packages/audio/fixtures';
import { ANIMALS, createInvestigation } from '../packages/game/animals';
import { CPU_CHARACTERS, cpuSelect } from '../packages/game/cpu';

type Screen = 'home' | 'hunt' | 'result';

const spritePositions = [
  ['0%', '0%'], ['33.333%', '0%'], ['66.666%', '0%'], ['100%', '0%'],
  ['0%', '100%'], ['33.333%', '100%'], ['66.666%', '100%'], ['100%', '100%'],
] as const;

export default function GameApp() {
  const investigation = useMemo(() => createInvestigation(20260825), []);
  const [screen, setScreen] = useState<Screen>('home');
  const [selected, setSelected] = useState<AnimalId | null>(null);
  const [playing, setPlaying] = useState<AnimalId | null>(null);
  const [seconds, setSeconds] = useState(60);
  const [soundReady, setSoundReady] = useState(false);
  const sequenceToken = useRef(0);

  const references = useMemo(() => Object.fromEntries(ANIMALS.map((animal, index) => [
    animal.id,
    [createAnimalRecipe(animal.id, 7100 + index), createAnimalRecipe(animal.id, 9100 + index)],
  ])) as Record<AnimalId, ReturnType<typeof createAnimalRecipe>[]>, []);

  const cpuVotes = useMemo(() => CPU_CHARACTERS.map((cpu, index) => ({
    cpu,
    animalId: cpuSelect(investigation.slots, references, cpu, 1, 3000 + index).ids[0],
  })), [investigation.slots, references]);

  const begin = useCallback(async () => {
    try {
      await unlockAudio();
      setSoundReady(true);
    } catch {
      setSoundReady(false);
    }
    setSelected(null);
    setSeconds(60);
    setScreen('hunt');
  }, []);

  const finish = useCallback(() => {
    sequenceToken.current += 1;
    stopActiveRecipe();
    setPlaying(null);
    setScreen('result');
  }, []);

  useEffect(() => {
    if (screen !== 'hunt') return;
    const timer = window.setInterval(() => {
      setSeconds((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          window.setTimeout(finish, 0);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [finish, screen]);

  const listen = useCallback(async (animalId: AnimalId) => {
    sequenceToken.current += 1;
    const slot = investigation.slots.find((candidate) => candidate.animal.id === animalId);
    if (!slot) return;
    setPlaying(animalId);
    try {
      const duration = await playRecipe(slot.recipe);
      window.setTimeout(() => setPlaying((current) => current === animalId ? null : current), duration + 80);
    } catch {
      setSoundReady(false);
      setPlaying(null);
    }
  }, [investigation.slots]);

  const listenAll = useCallback(async () => {
    const token = ++sequenceToken.current;
    for (const slot of investigation.slots) {
      if (token !== sequenceToken.current) return;
      setPlaying(slot.animal.id);
      const duration = await playRecipe(slot.recipe);
      await new Promise((resolve) => window.setTimeout(resolve, duration + 260));
    }
    if (token === sequenceToken.current) setPlaying(null);
  }, [investigation.slots]);

  if (screen === 'home') {
    return (
      <main className="home-shell">
        <div className="home-scan" aria-hidden="true" />
        <section className="hero-console">
          <p className="eyebrow">IKAI SOUND INVESTIGATION</p>
          <h1><span>異界どうぶつ</span>調査局</h1>
          <p className="hero-copy">この8匹の中に、<em>動物に化けた異界人</em>がいる！</p>
          <div className="animal-line" aria-hidden="true">
            {ANIMALS.map((animal, index) => <AnimalSprite key={animal.id} index={index} compact />)}
          </div>
          <button className="primary-action" type="button" onClick={begin}>
            <span>ひとりであそぶ</span>
            <small>8匹の声をきいて、異界人を見つけよう！</small>
          </button>
          <div className="home-actions">
            <button type="button" disabled><span>ともだちとあそぶ</span><small>ただいま準備中</small></button>
            <Link href="/dev/voice-lab"><span>Voice Lab</span><small>音声分析装置をためす</small></Link>
          </div>
          <p className="privacy-note">🎙 録った声はこの機器の中で分析します。生の声は送信しません。</p>
        </section>
      </main>
    );
  }

  if (screen === 'result') {
    const correct = selected === investigation.anomalyId;
    const anomaly = ANIMALS.find((animal) => animal.id === investigation.anomalyId)!;
    return (
      <main className={`result-shell ${correct ? 'win' : 'miss'}`}>
        <section className="result-console">
          <p className="mission-label">けっか発表！</p>
          <h1>{correct ? '調査成功！' : '異界人にげきられた！'}</h1>
          <p>{selected ? `あなたがえらんだのは「${ANIMALS.find((animal) => animal.id === selected)?.name}」` : '時間切れで、えらべなかった…'}</p>
          <div className="identity-card">
            <div className="scan-beam" aria-hidden="true" />
            <AnimalSprite index={ANIMALS.findIndex((animal) => animal.id === anomaly.id)} />
            <span>SCAN COMPLETE</span>
            <strong>{anomaly.name}が異界人だった！</strong>
          </div>
          <div className="guest-votes">
            <h2>ゲスト調査員の見立て</h2>
            <div>
              {cpuVotes.map(({ cpu, animalId }) => (
                <figure key={cpu.id}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={cpu.icon} alt="" />
                  <figcaption><strong>{cpu.name}</strong><span>→ {ANIMALS.find((animal) => animal.id === animalId)?.name}</span></figcaption>
                </figure>
              ))}
            </div>
          </div>
          <div className="result-actions">
            <button className="primary-action" type="button" onClick={begin}>もう一回あそぶ</button>
            <button className="secondary-action" type="button" onClick={() => setScreen('home')}>タイトルへ</button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="game-shell">
      <div className="sky-glow" aria-hidden="true" />
      <header className="topbar">
        <button className="back-button" type="button" aria-label="タイトルへ戻る" onClick={() => setScreen('home')}>‹</button>
        <div>
          <p className="eyebrow">IKAI SOUND INVESTIGATION</p>
          <h1>異界どうぶつ調査局</h1>
        </div>
        <div className={`timer ${seconds <= 10 ? 'danger' : ''}`} aria-label={`のこり時間${seconds}秒`}><span>のこり</span><strong>{seconds}</strong></div>
      </header>
      <section className="mission-panel">
        <div className="scan-dot" aria-hidden="true" />
        <div>
          <p className="mission-label">きょうの調査</p>
          <h2>あやしい動物を1匹えらぼう！</h2>
          <p>{soundReady ? '動物をタップすると声をきけるよ。' : '音が出ないときは、もう一度「きく」をタップしてね。'}</p>
        </div>
        <button className="listen-all" type="button" onClick={listenAll}>▶ 8匹を順番にきく</button>
      </section>
      <section className="animal-grid" aria-label="調査する動物">
        {investigation.slots.map((slot, index) => {
          const isSelected = selected === slot.animal.id;
          const isPlaying = playing === slot.animal.id;
          return (
            <article className={`animal-card ${isSelected ? 'selected' : ''} ${isPlaying ? 'playing' : ''}`} key={slot.animal.id}>
              <div className="card-scan" aria-hidden="true" />
              <span className="specimen-no">0{index + 1}</span>
              <button className="animal-stage" type="button" aria-label={`${slot.animal.name}の声をきく`} onClick={() => listen(slot.animal.id)}>
                <AnimalSprite index={index} />
                <span className="sound-wave" aria-hidden="true">)))</span>
              </button>
              <div className="animal-info">
                <strong>{slot.animal.name}</strong>
                <button className="play-button" type="button" onClick={() => listen(slot.animal.id)}>{isPlaying ? '♪ さいせい中' : '▶ きく'}</button>
              </div>
              <button className="suspect-button" type="button" aria-pressed={isSelected} onClick={() => setSelected(isSelected ? null : slot.animal.id)}>
                <span aria-hidden="true">{isSelected ? '✓' : '◇'}</span>{isSelected ? 'えらんだ！' : 'あやしい'}
              </button>
            </article>
          );
        })}
      </section>
      <footer className="decision-dock">
        <div className="selection-count"><span>あやしい</span><strong>{selected ? 1 : 0} / 1</strong></div>
        <button className="decide-button" type="button" disabled={!selected} onClick={finish}>これで決定！</button>
      </footer>
    </main>
  );
}

function AnimalSprite({ index, compact = false }: { index: number; compact?: boolean }) {
  return <span className={`generated-animal ${compact ? 'compact' : ''}`} style={{ '--sprite-x': spritePositions[index][0], '--sprite-y': spritePositions[index][1] } as React.CSSProperties} aria-hidden="true" />;
}
