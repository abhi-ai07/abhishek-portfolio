import { useEffect, useState, useCallback } from "react";
import FlexCarousel, { DEFAULT_ITEMS } from "./FlexCarousel";
import { getProjects } from "../lib/queries";
import { urlFor } from "../lib/sanity";
import "./Projects.css";

// Modal Component for Project Details
const ProjectModal = ({ project, onClose }) => {
  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    // Prevent background scrolling while modal is open
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  if (!project) return null;

  const category = project.subtitle || project.category || "FEATURED PROJECT";
  const title = project.title || "PROJECT DETAILS";

  return (
    <div
      id="project-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 transition-opacity duration-300"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-project-title"
    >
      <div
        id="project-modal-card"
        className="bg-[#0e0e13] text-white rounded-[32px] max-w-2xl w-full max-h-[90vh] overflow-y-auto no-scrollbar p-6 sm:p-8 md:p-9 shadow-2xl border border-white/10 relative animate-[fadeIn_300ms_ease-out]"
      >
        {/* Header */}
        <div className="relative text-center pb-4 mb-5 border-b border-white/10">
          <span
            id="modal-project-category"
            className="block text-[11px] font-bold tracking-widest uppercase text-[#ff2a2a] mb-1"
          >
            {category}
          </span>
          <h3
            id="modal-project-title"
            className="text-2xl sm:text-3xl font-black uppercase text-white tracking-tight"
          >
            {title}
          </h3>
          <button
            onClick={onClose}
            className="absolute right-0 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full border border-white/10 flex items-center justify-center text-neutral-400 hover:border-[#ff2a2a] hover:text-[#ff2a2a] hover:bg-white/[0.04] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div
          id="modal-project-body"
          className="space-y-5 text-sm text-neutral-300"
        >
          {/* Project Preview Image */}
          {project.src && (
            <div className="w-full h-52 sm:h-64 rounded-2xl overflow-hidden border border-white/10 bg-[#16161c] shadow-inner">
              <img
                src={project.src}
                alt={project.alt || title}
                className="w-full h-full object-cover object-top"
              />
            </div>
          )}

          {/* Description */}
          {project.description && (
            <p className="text-neutral-300 leading-relaxed font-normal text-sm sm:text-base text-center max-w-xl mx-auto">
              {project.description}
            </p>
          )}

          {/* Highlights / Stats */}
          {project.stats && (
            <div className="bg-white/[0.03] p-4 rounded-2xl border border-white/10 text-center">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#ff2a2a] mb-1">
                Key Highlights
              </p>
              <p className="text-xs text-neutral-200 font-medium">
                {project.stats}
              </p>
            </div>
          )}

          {/* Key Deliverables */}
          {project.deliverables && project.deliverables.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-2 text-center">
                Key Deliverables
              </h4>
              <ul className="list-disc pl-5 space-y-1 text-xs text-neutral-300 max-w-md mx-auto marker:text-[#ff2a2a]">
                {project.deliverables.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Technologies & Stack */}
          {project.tools && project.tools.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-2 text-center">
                Technologies &amp; Stack
              </h4>
              <div className="flex flex-wrap justify-center gap-2">
                {project.tools.map((tech, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-white/[0.05] border border-white/10 text-neutral-200 hover:border-[#ff2a2a]/40 text-[10px] font-semibold rounded-full uppercase transition-colors"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Live Link Button */}
          {project.link && (
            <div className="pt-2 flex justify-center items-center">
              <a
                href={project.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-[#ff2a2a] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#e02424] transition-all shadow-lg shadow-[#ff2a2a]/25 hover:scale-105 active:scale-95 cursor-pointer"
              >
                Visit Live Website ↗
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Projects = () => {
  const [projectsList, setProjectsList] = useState(DEFAULT_ITEMS);
  const [selectedProject, setSelectedProject] = useState(null);

  const [isMobile, setIsMobile] = useState(
    () => window.matchMedia("(max-width: 640px)").matches,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 640px)");

    const handleChange = (event) => {
      setIsMobile(event.matches);
    };

    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  // Fetch Sanity Projects
  useEffect(() => {
    let isMounted = true;

    getProjects()
      .then((data) => {
        if (!isMounted) return;
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map((doc) => {
            let imgSrc = "/projects/portfolio-design.png";
            if (doc.thumbnail) {
              try {
                const built = urlFor(doc.thumbnail)
                  ?.width(1200)
                  ?.auto("format")
                  ?.url();
                if (built) imgSrc = built;
              } catch (e) {
                console.warn("Failed to build Sanity image URL:", e);
              }
            }

            return {
              src: imgSrc,
              alt: doc.alt || doc.title,
              title: doc.title,
              subtitle: doc.subtitle || doc.category,
              category: doc.category || doc.subtitle,
              description: doc.description,
              stats: doc.stats,
              deliverables: doc.deliverables || [],
              tools: doc.technologies || [],
              link: doc.liveUrl || doc.githubUrl,
            };
          });

          setProjectsList(mapped);
        }
      })
      .catch((err) => {
        console.warn(
          "Could not load projects from Sanity, using default fallback:",
          err,
        );
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSelectProject = useCallback((item) => {
    setSelectedProject(item);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedProject(null);
  }, []);

  return (
    <section
      className="relative w-full bg-[#070709] text-white py-24 px-6 md:px-14 border-t border-white/[0.06] overflow-hidden"
      data-purpose="featured-projects"
      id="projects"
    >
      {/* Subtle Dark Cinematic Atmospheric Background (Behind entire section) */}
      <div className="projects-ambient-backdrop" aria-hidden="true">
        <div className="projects-glow-red-top" />
        <div className="projects-glow-red-bottom" />
        <div className="projects-glow-charcoal" />
        <div className="projects-film-grain" />
      </div>

      <div className="max-w-[1400px] mx-auto relative z-10">
        {/* Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tight text-white leading-none">
              FEATURED <span className="text-[#ff2a2a]">PROJECTS</span>
            </h2>
          </div>
          <p className="text-xs md:text-sm uppercase font-medium leading-relaxed tracking-wider text-neutral-400 max-w-md">
            Selected full-stack architectures, interactive platforms &amp;
            editorial digital experiences.
          </p>
        </div>

        {/* Dynamic Projects Content Area with FlexCarousel */}
        <div id="projects-content" className="w-full">
          <div
            id="flex-carousel-container"
            className="rounded-3xl border border-[rgba(160,45,50,0.2)] overflow-hidden shadow-2xl relative transition-colors duration-500 hover:border-[rgba(190,50,55,0.32)]"
            style={{
              width: "100%",
              height: "560px",
              position: "relative",
              backgroundImage: "url('/projects/projects-carousel-bg.jpg')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          >
            <FlexCarousel
              items={projectsList}
              preset="liquid"
              intro="rise"
              cardHeight={0.5}
              gap={12}
              radius={16}
              fit="natural"
              captions={true}
              focusOnClick={true}
              bend={isMobile ? 0 : undefined}
              dispersion={isMobile ? 0 : undefined} 
              onSelect={(_, item) => handleSelectProject(item)}
            />
          </div>
        </div>
      </div>

      {/* Project Detail Modal */}
      {selectedProject && (
        <ProjectModal project={selectedProject} onClose={handleCloseModal} />
      )}
    </section>
  );
};

export default Projects;
