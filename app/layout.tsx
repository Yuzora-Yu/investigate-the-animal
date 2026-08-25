import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://yu-zora.com/games/investigate-the-animal/'),
  title: '異界どうぶつ調査局',
  description: 'この8匹の中に、動物に化けた異界人がいる！ 声をきいて見つけよう。',
  icons: {
    icon: '/games/investigate-the-animal/favicon.svg',
  },
  openGraph: {
    title: '異界どうぶつ調査局',
    description: '声をきいて、ニセモノを見つけよう。',
    images: [{ url: '/games/investigate-the-animal/og.png', width: 1672, height: 936, alt: '草原に並ぶ8匹を音声分析装置で調査するゲーム' }],
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '異界どうぶつ調査局',
    description: '声をきいて、ニセモノを見つけよう。',
    images: ['/games/investigate-the-animal/og.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
