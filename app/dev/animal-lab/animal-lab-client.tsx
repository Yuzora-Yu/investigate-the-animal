'use client';

import Link from 'next/link';
import { useState } from 'react';
import { analyzePcmToRecipe, preprocessPcm } from '../../../packages/audio/analyzer';
import { playRecipe } from '../../../packages/audio/browser';
import { createAnimalRecipe, type AnimalId } from '../../../packages/audio/fixtures';
import { recipeByteSize, type VoiceRecipeV1 } from '../../../packages/audio/types';
import { ANIMALS } from '../../../packages/game/animals';

export default function AnimalLabClient() {
  const [animalId, setAnimalId] = useState<AnimalId>('cat');
  const [recipe, setRecipe] = useState<VoiceRecipeV1>(() => createAnimalRecipe('cat', 6101));
  const [familyId, setFamilyId] = useState('synthetic-cat-001');
  const [author, setAuthor] = useState('Development synthetic fixture');
  const [license, setLicense] = useState('Original / project-owned');
  const [sourceUrl, setSourceUrl] = useState('local://synthetic-fixture');
  const [message, setMessage] = useState('現在はライセンス不要の合成フィクスチャを使用しています。');

  const importAudio = async (file: File) => {
    const context = new AudioContext();
    const decoded = await context.decodeAudioData(await file.arrayBuffer());
    const next = analyzePcmToRecipe(preprocessPcm(new Float32Array(decoded.getChannelData(0))), decoded.sampleRate, 6203);
    await context.close();
    setRecipe(next);
    setMessage(`${file.name} を端末内でVoiceRecipe化しました。`);
  };

  const exportPackItem = () => {
    const data = { animalId, sourceFamilyId: familyId, author, license, sourceUrl, attribution: author, recipe };
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${animalId}-${familyId}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="lab-shell simple-lab">
      <header className="lab-header"><Link href="/">← ゲームへ</Link><div><p>DEVELOPMENT CONSOLE</p><h1>Animal Lab</h1></div><Link href="/dev/cpu-lab">CPU Lab →</Link></header>
      <section className="lab-notice"><span />{message}</section>
      <div className="lab-grid animal-lab-grid">
        <section className="lab-card">
          <div className="lab-card-title"><span>01</span><h2>音源と動物</h2></div>
          <label className="field-label">動物<select value={animalId} onChange={(event) => { const id = event.target.value as AnimalId; setAnimalId(id); setRecipe(createAnimalRecipe(id, 6101)); setFamilyId(`synthetic-${id}-001`); }}>{ANIMALS.map((animal) => <option value={animal.id} key={animal.id}>{animal.name}</option>)}</select></label>
          <label className="file-button">動物音源を読み込む<input type="file" accept="audio/*" onChange={(event) => event.target.files?.[0] && void importAudio(event.target.files[0])} /></label>
          <button className="preview-button" type="button" onClick={() => void playRecipe(recipe)}>▶ 分析後の音をきく</button>
          <dl className="lab-stats"><div><dt>長さ</dt><dd>{recipe.durationMs} ms</dd></div><div><dt>データ量</dt><dd>{(recipeByteSize(recipe) / 1024).toFixed(1)} KB</dd></div></dl>
        </section>
        <section className="lab-card">
          <div className="lab-card-title"><span>02</span><h2>出典とライセンス</h2></div>
          <MetadataField label="sourceFamilyId" value={familyId} onChange={setFamilyId} />
          <MetadataField label="author" value={author} onChange={setAuthor} />
          <MetadataField label="license" value={license} onChange={setLicense} />
          <MetadataField label="source URL" value={sourceUrl} onChange={setSourceUrl} />
          <button className="preview-button gold" type="button" onClick={exportPackItem}>JSONを書き出す</button>
        </section>
      </div>
    </main>
  );
}

function MetadataField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="field-label">{label}<input value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}
