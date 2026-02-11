import dynamic from 'next/dynamic';

const FishBurgerClient = dynamic(() => import('./FishBurgerClient'), { ssr: false });

export default function FishBurgerDemoPage() {
  return <FishBurgerClient />;
}
