'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useMemo, useState } from 'react';
import { createAnimalRecipe, type AnimalId } from '../../../packages/audio/fixtures';
import { ANIMALS, createInvestigation } from '../../../packages/game/animals';
import { CPU_CHARACTERS, cpuSelect } from '../../../packages/game/cpu';

export default function CpuLabClient() {
  const [cpuId, setCpuId] = useState(CPU_CHARACTERS[0].id);
  const cpu = CPU_CHARACTERS.find((candidate) => candidate.id === cpuId)!;
  const investigation = useMemo(() => createInvestigation(20260825), []);
  const references = useMemo(() => Object.fromEntries(ANIMALS.map((animal, index) => [animal.id, [createAnimalRecipe(animal.id, 400 + index), createAnimalRecipe(animal.id, 800 + index)]])) as Record<AnimalId, ReturnType<typeof createAnimalRecipe>[]>, []);
  const simulation = useMemo(() => {
    const detections = Object.fromEntries(ANIMALS.map((animal) => [animal.id, 0])) as Record<AnimalId, number>;
    let currentScores = {} as Record<AnimalId, number>;
    for (let run = 0; run < 100; run += 1) {
      const result = cpuSelect(investigation.slots, references, cpu, 1, 10000 + run);
      detections[result.ids[0]] += 1;
      if (!run) currentScores = result.scores;
    }
    return { detections, currentScores };
  }, [cpu, investigation.slots, references]);

  return (
    <main className="lab-shell simple-lab">
      <header className="lab-header"><Link href="/">← ゲームへ</Link><div><p>DEVELOPMENT CONSOLE</p><h1>CPU Lab</h1></div><Link href="/dev/voice-lab">Voice Lab →</Link></header>
      <section className="lab-card cpu-picker">
        <div className="lab-card-title"><span>01</span><h2>ゲスト調査員</h2></div>
        <div className="cpu-tabs">{CPU_CHARACTERS.map((character) => <button className={character.id === cpu.id ? 'active' : ''} type="button" key={character.id} onClick={() => setCpuId(character.id)}><Image src={character.icon} alt="" width={52} height={52} /><span>{character.name}</span></button>)}</div>
        <p>{cpu.dialogueStyle}</p>
      </section>
      <section className="lab-card simulation-card">
        <div className="lab-card-title"><span>02</span><h2>100回シミュレーション</h2></div>
        <p className="lab-help">同じ8音を100回聞かせたとき、各動物を疑った割合です。正解情報はCPUへ渡していません。</p>
        <div className="score-list">{ANIMALS.map((animal) => <div key={animal.id}><strong>{animal.name}</strong><span><i style={{ width: `${simulation.detections[animal.id]}%` }} /></span><b>{simulation.detections[animal.id]}%</b><small>score {simulation.currentScores[animal.id]?.toFixed(2)}</small></div>)}</div>
        <p className="answer-note">検証用の異界人：{ANIMALS.find((animal) => animal.id === investigation.anomalyId)?.name}</p>
      </section>
    </main>
  );
}
