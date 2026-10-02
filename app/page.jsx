import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Marquee from '@/components/Marquee';
import Protocol from '@/components/Protocol';
import Mechanism from '@/components/Mechanism';
import Vault from '@/components/Vault';
import Network from '@/components/Network';
import Terminal from '@/components/Terminal';
import Roadmap from '@/components/Roadmap';
import Buy from '@/components/Buy';
import Footer from '@/components/Footer';

export default function Page() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Marquee />
        <Protocol />
        <Mechanism />
        <Vault />
        <Network />
        <Terminal />
        <Roadmap />
        <Buy />
      </main>
      <Footer />
    </>
  );
}
