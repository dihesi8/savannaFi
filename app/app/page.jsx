import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FarmApp from '@/components/FarmApp';

export const metadata = {
  title: 'Yield farms | SavannaFi',
  description: 'Stake SVN into stock liquidity pools on Robinhood Chain.',
};

export default function AppPage() {
  return (
    <>
      <Header />
      <FarmApp />
      <Footer />
    </>
  );
}
