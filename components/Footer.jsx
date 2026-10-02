import { Mark } from './Art';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-row">
          <a className="brand" href="#top"><Mark /> SavannaFi</a>
          <nav className="footer-links" aria-label="Footer">
            <a href="#protocol">Protocol</a>
            <a href="#mechanism">Mechanism</a>
            <a href="#vault">Vault</a>
            <a href="#network">Network</a>
            <a href="#terminal">Terminal</a>
            <a href="#roadmap">Roadmap</a>
          </nav>
        </div>
        <small>Digital assets carry risk. Nothing on this site is financial advice. 2026 SavannaFi.</small>
      </div>
    </footer>
  );
}
