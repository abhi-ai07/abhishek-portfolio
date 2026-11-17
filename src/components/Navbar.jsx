import { useRef, useState, useEffect } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const Navbar = () => {
  const navRef = useRef(null);
  const logoRef = useRef(null);
  const linksRef = useRef([]);
  const menuRef = useRef(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { label: "PROJECTS", href: "#projects" },
    { label: "CERTIFICATES", href: "#certificates" },
    { label: "ABOUT", href: "#about" },
    { label: "EXPERIENCE", href: "#experience" },
    { label: "CONTACT", href: "#contact" },
  ];

  // Original entrance animation
  useGSAP(() => {
    const tl = gsap.timeline({ delay: 0.2 });

    tl.fromTo(
      logoRef.current,
      { x: -30, opacity: 0 },
      { x: 0, opacity: 1, duration: 1, ease: "expo.out" },
    )
      .fromTo(
        linksRef.current,
        { y: -15, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.1,
          ease: "expo.out",
        },
        "-=0.8",
      )
      .fromTo(
        menuRef.current,
        { x: 30, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 1,
          ease: "expo.out",
        },
        "-=0.8",
      );
  }, []);

  // Show Navbar ONLY while Hero section is visible
  useEffect(() => {
    const navbar = navRef.current;
    const hero = document.getElementById("hero");

    if (!navbar || !hero) return;

    gsap.set(navbar, {
      yPercent: 0,
      autoAlpha: 1,
    });

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isHeroVisible = entry.isIntersecting;

        if (!isHeroVisible) {
          setMobileOpen(false);
        }

        gsap.to(navbar, {
          yPercent: isHeroVisible ? 0 : -120,
          autoAlpha: isHeroVisible ? 1 : 0,
          duration: 0.55,
          ease: isHeroVisible ? "power3.out" : "power3.inOut",
          overwrite: "auto",
        });
      },
      {
        root: null,
        threshold: 0,
      },
    );

    observer.observe(hero);

    return () => {
      observer.disconnect();
      gsap.killTweensOf(navbar);
    };
  }, []);

  const handleLinkClick = (e, href) => {
    setMobileOpen(false);

    const target = document.querySelector(href);

    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      <nav
        ref={navRef}
        className="fixed top-0 left-0 w-full h-[80px] z-[100] flex items-center justify-between px-8 md:px-16 bg-transparent"
      >
        {/* LEFT: Logo */}
        <div
          ref={logoRef}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="relative z-10 text-[#ff2a2a] font-bold text-[15px] md:text-[16px] tracking-[-0.04em] cursor-pointer transition-transform duration-500 hover:scale-[1.02]"
          style={{ fontFamily: '"Inter", "Outfit", sans-serif' }}
        >
          ABHI
        </div>

        {/* RIGHT SIDE */}
        <div className="relative z-10 flex items-center">
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-12 mr-16">
            {navLinks.map((link, index) => (
              <a
                key={link.label}
                ref={(el) => (linksRef.current[index] = el)}
                href={link.href}
                onClick={(e) => handleLinkClick(e, link.href)}
                className="relative text-white text-[12px] uppercase tracking-[2px] transition-colors duration-300 ease-in-out hover:text-[#ff2a2a] group"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Hamburger */}
          <button
            ref={menuRef}
            onClick={() => setMobileOpen((prev) => !prev)}
            className="group flex flex-col justify-center items-end space-y-[6px] w-8 h-8 cursor-pointer"
            aria-label="Menu"
            aria-expanded={mobileOpen}
          >
            <span
              className={`block h-[1px] bg-[#ff2a2a] transition-all duration-300 ease-out ${
                mobileOpen
                  ? "w-7 rotate-45 translate-y-[7px] bg-white"
                  : "w-8 group-hover:w-5 group-hover:bg-white"
              }`}
            />

            <span
              className={`block h-[1px] bg-[#ff2a2a] transition-all duration-300 ease-out ${
                mobileOpen ? "opacity-0" : "w-8 group-hover:bg-white"
              }`}
            />

            <span
              className={`block h-[1px] bg-[#ff2a2a] transition-all duration-300 ease-out ${
                mobileOpen
                  ? "w-7 -rotate-45 -translate-y-[7px] bg-white"
                  : "w-5 group-hover:w-8 group-hover:bg-white"
              }`}
            />
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-[95] bg-black/80 backdrop-blur-md flex flex-col justify-between p-8 pt-28 md:hidden transition-opacity duration-300 animate-[fadeIn_200ms_ease-out]"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setMobileOpen(false);
            }
          }}
        >
          <div className="flex flex-col space-y-6">
            <span className="text-[10px] font-bold tracking-widest uppercase text-neutral-500 border-b border-white/10 pb-2">
              NAVIGATION
            </span>

            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleLinkClick(e, link.href)}
                className="text-2xl font-bold tracking-wider text-white hover:text-[#ff2a2a] transition-colors uppercase"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="pt-6 border-t border-white/10 text-xs text-neutral-400 flex flex-col space-y-1">
            <span className="font-semibold text-white tracking-widest uppercase">
              ABHISHEK
            </span>
            <span>CREATIVE DEVELOPER & DESIGNER</span>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
