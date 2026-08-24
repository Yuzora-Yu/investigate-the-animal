import VoiceLabClient from './voice-lab-client';

export const metadata = {
  title: 'Voice Lab | 異界どうぶつ調査局',
  description: '音声分析装置のローカル技術検証画面',
};

export default function VoiceLabPage() {
  return <VoiceLabClient />;
}
