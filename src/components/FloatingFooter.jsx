import React, { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

import { FaLinkedinIn, FaGithub, FaWhatsapp } from "react-icons/fa";

import { HiOutlineMail } from "react-icons/hi";

gsap.registerPlugin(ScrollTrigger);

const FloatingFooter = () => {
  const footerRef = useRef(null);

  useGSAP(() => {
    // Initially hidden
    gsap.set(footerRef.current, {
      autoAlpha: 0,
      y: 25,
      scale: 0.9,
    });

    // Reveal with the hero text near the end
    gsap.to(footerRef.current, {
      autoAlpha: 1,
      y: 0,
      scale: 1,
      ease: "power2.out",
      scrollTrigger: {
        trigger: ".hero-section",
        start: "top top",
        end: "bottom bottom",
        scrub: 1,
        onUpdate: (self) => {
          const progress = self.progress;

          const revealProgress = gsap.utils.clamp(
            0,
            1,
            (progress - 0.94) / 0.04,
          );

          gsap.set(footerRef.current, {
            autoAlpha: revealProgress,
            y: 25 * (1 - revealProgress),
            scale: 0.9 + 0.1 * revealProgress,
          });
        },
      },
    });
  }, []);

  const socialLinks = [
    {
      name: "LinkedIn",
      icon: <FaLinkedinIn />,
      href: "https://www.linkedin.com/",
    },
    {
      name: "GitHub",
      icon: <FaGithub />,
      href: "https://github.com/",
    },
    {
      name: "Email",
      icon: <HiOutlineMail />,
      href: "mailto:your-email@example.com",
    },
    {
      name: "WhatsApp",
      icon: <FaWhatsapp />,
      href: "https://wa.me/YOUR_NUMBER",
      whatsapp: true,
    },
  ];

  return (
    <div
      ref={footerRef}
      className="
        fixed
        bottom-4
        md:bottom-6
        left-1/2
        -translate-x-1/2
        z-[150]
        invisible
        pointer-events-auto
      "
    >
      <div
        className="
          flex
          items-center
          justify-center
          gap-0
          rounded-full
          border
          border-[#ff2a2a]/60
          bg-[#100b0b]/90
          backdrop-blur-xl
          px-2
          md:px-3
          py-1.5
          md:py-2
          shadow-[0_0_14px_rgba(255,42,42,0.22)]
        "
      >
        {socialLinks.map((social, index) => (
          <React.Fragment key={social.name}>
            {index !== 0 && <span className="h-4 md:h-5 w-px bg-white/20" />}

            <a
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={social.name}
              title={social.name}
              className={`
                flex
                items-center
                justify-center
                w-9 h-8
                md:w-10 md:h-9
                rounded-full
                text-[17px]
                md:text-[19px]
                transition-all
                duration-300
                hover:scale-125
                ${
                  social.whatsapp
                    ? "text-[#25D366] hover:text-[#4aff8c]"
                    : "text-white hover:text-[#ff3535]"
                }
              `}
            >
              {social.icon}
            </a>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default FloatingFooter;
