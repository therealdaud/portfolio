import { Routes, Route } from 'react-router-dom';
import './index.css';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Skills from './components/Skills';
import Experience from './components/Experience';
import Projects from './components/Projects';
import Blog from './components/Blog';
import Contact from './components/Contact';
import Footer from './components/Footer';
import CommandPalette from './components/CommandPalette';
import DijkstraPage from './pages/DijkstraPage';
import QuietSpotPage from './pages/QuietSpotPage';

function PortfolioHome() {
  return (
    <>
      <Navbar />
      <CommandPalette />
      <main>
        <Hero />
        <About />
        <Skills />
        <Experience />
        <Projects />
        <Blog />
        <Contact />
      </main>
      <Footer />
    </>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<PortfolioHome />} />
      <Route path="/projects/dijkstra"   element={<DijkstraPage />} />
      <Route path="/projects/quietspot" element={<QuietSpotPage />} />
    </Routes>
  );
}

export default App;
