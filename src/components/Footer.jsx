import {
  FaGithub,
  FaLinkedinIn,
  FaWhatsapp,
  FaEnvelope,
} from "react-icons/fa6";

const SOCIAL_LINKS = [
  {
    name: "GitHub",
    href: "https://github.com/abhi-ai07",
    icon: FaGithub,
    ariaLabel: "Visit Abhishek Kashyap's GitHub profile",
    isExternal: true,
  },
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/in/abhishek-kashyap-878b383a6",
    icon: FaLinkedinIn,
    ariaLabel: "Visit Abhishek Kashyap's LinkedIn profile",
    isExternal: true,
  },
  {
    name: "WhatsApp",
    href: "https://wa.me/919690353196",
    icon: FaWhatsapp,
    ariaLabel: "Chat with Abhishek Kashyap on WhatsApp",
    isExternal: true,
  },
  {
    name: "Email",
    href: "mailto:abhi1730k@gmail.com",
    icon: FaEnvelope,
    ariaLabel: "Send an email to Abhishek Kashyap",
    isExternal: false,
  },
];

const Footer = () => {
  return (
    <footer
      id="contact"
      role="contentinfo"
      aria-label="Footer and Contact Information"
      className="relative w-full bg-[#070709] text-white pt-20 pb-12 sm:pt-24 sm:pb-14 md:pt-32 md:pb-16 px-6 md:px-14 border-t border-white/[0.08] overflow-hidden selection:bg-[#ff2a2a] selection:text-white"
    >
      {/* Ambient Background Effects */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        aria-hidden="true"
      >
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[320px] sm:w-[650px] sm:h-[400px] rounded-full blur-[120px] opacity-20"
          style={{
            background:
              "radial-gradient(circle, rgba(255, 42, 42, 0.35) 0%, rgba(255, 42, 42, 0) 70%)",
          }}
        />

        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      {/* Main Footer Content */}
      <div className="max-w-[1200px] mx-auto relative z-10 flex flex-col items-center text-center">
        {/* Eyebrow Badge */}
        <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ff2a2a] animate-pulse" />

          <span className="text-[10px] sm:text-[11px] font-mono tracking-widest uppercase text-neutral-300">
            GET IN TOUCH
          </span>
        </div>

        {/* Main Heading */}
        <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black uppercase tracking-tight text-white leading-none">
          LET'S CONNECT<span className="text-[#ff2a2a]">.</span>
        </h2>

        {/* Supporting Text */}
        <p className="mt-4 sm:mt-5 text-sm sm:text-base md:text-lg text-neutral-400 font-normal max-w-md sm:max-w-lg mx-auto">
          Have something in mind? Feel free to reach out.
        </p>

        {/* Social Icons */}
        <div
          className="mt-8 sm:mt-10 md:mt-12 flex flex-row items-center justify-center gap-6 sm:gap-9 md:gap-12"
          role="list"
          aria-label="Social and Contact Links"
        >
          {SOCIAL_LINKS.map((link) => {
            const Icon = link.icon;

            return (
              <a
                key={link.name}
                href={link.href}
                target={link.isExternal ? "_blank" : undefined}
                rel={link.isExternal ? "noopener noreferrer" : undefined}
                aria-label={link.ariaLabel}
                title={link.name}
                role="listitem"
                className="group relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-white hover:text-[#ff2a2a] transition-colors duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff2a2a] rounded-full"
              >
                {/* Hover Glow */}
                <span
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full bg-[#ff2a2a]/0 group-hover:bg-[#ff2a2a]/10 blur-md transition-all duration-300 ease-out pointer-events-none scale-75 group-hover:scale-125 motion-reduce:transition-none"
                />

                {/* Icon */}
                <Icon
                  aria-hidden="true"
                  className="relative z-10 text-2xl sm:text-3xl md:text-[2.2rem] transform transition-all duration-300 ease-out group-hover:scale-115 group-hover:drop-shadow-[0_0_12px_rgba(255,42,42,0.65)] motion-reduce:transform-none motion-reduce:transition-none"
                />
              </a>
            );
          })}
        </div>
      </div>

      {/* Full Width Bottom Copyright Area */}
      <div className="relative z-10 w-full mt-16 sm:mt-20 md:mt-24 pt-8 md:pt-10">
        {/* Full Screen Divider */}
        <div
          aria-hidden="true"
          className="absolute top-0 left-1/2 -translate-x-1/2 w-screen border-t border-white/[0.06]"
        />

        {/* Corner Aligned Text */}
        <div className="w-full flex flex-row items-center justify-between gap-3 text-xs font-mono text-neutral-500">
          <p className="pl-0 md:pl-0">© 2026 Abhishek Kashyap</p>

          <p className="text-[10px] sm:text-[11px] uppercase tracking-wider text-neutral-600 text-right">
            Portfolio Editorial Design
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
