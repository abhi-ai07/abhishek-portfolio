import { useLayoutEffect } from "react";

import Hero from "./components/Hero";
import About from "./components/About";
import Experience from "./components/Experience";
import Projects from "./components/Projects";
import Certificates from "./components/Certificates";
import Footer from "./components/Footer";

function App() {
  useLayoutEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const target = document.querySelector(hash);
      if (target) {
        requestAnimationFrame(() => {
          target.scrollIntoView({ behavior: "instant" });
        });
        return;
      }
    }

    const scrollToHero = () => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "instant",
      });
    };

    // Reset immediately after React mounts
    scrollToHero();

    // Reset again after browser layout updates
    const firstFrame = requestAnimationFrame(() => {
      scrollToHero();
    });

    // Handle browser page restoration
    window.addEventListener("pageshow", scrollToHero);

    return () => {
      cancelAnimationFrame(firstFrame);
      window.removeEventListener("pageshow", scrollToHero);
    };
  }, []);

  return (
    <>
      <Hero />
      <About />
      <Experience />
      <Projects />
      <Certificates />
      <Footer />
    </>
  );
}

export default App;
