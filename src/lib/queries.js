import { sanityClient, projectId, dataset } from "./sanity";

// In-memory and SessionStorage cache to eliminate redundant network requests
const memoryCache = new Map();
const CACHE_PREFIX = "devabhi_cache_";
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache validity

function getCached(key) {
  if (memoryCache.has(key)) {
    return memoryCache.get(key);
  }
  if (typeof window !== "undefined" && window.sessionStorage) {
    try {
      const item = window.sessionStorage.getItem(CACHE_PREFIX + key);
      if (item) {
        const { data, timestamp } = JSON.parse(item);
        if (Date.now() - timestamp < CACHE_TTL_MS) {
          memoryCache.set(key, data);
          return data;
        }
      }
    } catch {
      // Ignore cache parsing errors
    }
  }
  return null;
}

function setCached(key, data) {
  if (!data) return;
  memoryCache.set(key, data);
  if (typeof window !== "undefined" && window.sessionStorage) {
    try {
      window.sessionStorage.setItem(
        CACHE_PREFIX + key,
        JSON.stringify({ data, timestamp: Date.now() })
      );
    } catch {
      // Ignore cache storage errors
    }
  }
}

function logSanityError(entity, error) {
  const origin = typeof window !== "undefined" ? window.location.origin : "current origin";
  const isCorsOrNetwork =
    error?.message?.includes("Failed to fetch") ||
    error?.message?.includes("NetworkError") ||
    error?.statusCode === 403;

  if (isCorsOrNetwork) {
    console.error(
      `[Sanity CMS] Failed to fetch ${entity}. Potential CORS or Network restriction.\n` +
      `Ensure origin "${origin}" is added to Sanity CORS Origins in https://sanity.io/manage/project/${projectId}/api#cors\n` +
      `Project ID: ${projectId} | Dataset: ${dataset}`
    );
  } else {
    console.warn(`[Sanity CMS] Could not fetch ${entity}:`, error?.message || error);
  }
}

export async function getCertificates() {
  const cached = getCached("certificates");
  if (cached) return cached;

  try {
    const data = await sanityClient.fetch(`
      *[_type == "certificate" && published != false] | order(order asc, issueDate desc, _createdAt desc) {
        _id,
        title,
        issuer,
        issueDate,
        credentialId,
        credentialUrl,
        certificateImage,
        certificatePdf,
        description,
        skills,
        order,
        published
      }
    `);
    if (data) setCached("certificates", data);
    return data;
  } catch (error) {
    logSanityError("certificates", error);
    return cached || null;
  }
}

export async function getProjects() {
  const cached = getCached("projects");
  if (cached) return cached;

  try {
    const data = await sanityClient.fetch(`
      *[_type == "project" && published != false] | order(featured desc, order asc, title asc) {
        _id,
        title,
        slug,
        description,
        subtitle,
        category,
        alt,
        stats,
        technologies,
        deliverables,
        githubUrl,
        liveUrl,
        featured,
        order,
        published,
        thumbnail
      }
    `);
    if (data) setCached("projects", data);
    return data;
  } catch (error) {
    logSanityError("projects", error);
    return cached || null;
  }
}

export async function getExperience() {
  const cached = getCached("experience");
  if (cached) return cached;

  try {
    const data = await sanityClient.fetch(`
      *[_type == "experience" && published != false && hidden != true] | order(order asc) {
        _id,
        title,
        panelKind,
        order,
        eyebrow,
        heading,
        body,
        dateLabel,
        backgroundDate,
        badge,
        parallaxFactor,
        tickerTop,
        tickerBottom,
        phaseOrigin,
        phaseLearning,
        phaseBUILDING,
        jumpLearningLabel,
        jumpBUILDINGLabel,
        jumpLearningProgress,
        jumpBUILDINGProgress,
        milestones[]{label, text},
        image
      }
    `);
    if (data) setCached("experience", data);
    return data;
  } catch (error) {
    logSanityError("experience", error);
    return cached || null;
  }
}

export async function getAbout() {
  const cached = getCached("about");
  if (cached) return cached;

  try {
    const data = await sanityClient.fetch(`
      *[_type == "about"][0] {
        _id,
        name,
        role,
        shortBio,
        fullBio,
        profileImage,
        email,
        location,
        github,
        linkedin,
        instagram,
        headline,
        disciplines,
        disciplinesLabel,
        titleFirst,
        titleRest,
        subtitle,
        scrollPrompt,
        bgImage,
        mediaImage,
        ctaText,
        ctaLink,
        secondaryCtaText,
        secondaryCtaLink,
        stage1Headline,
        stage2Headline,
        stage2Bio1,
        stage2Bio2,
        stage3Headline,
        stage3Bio1,
        stage3Bio2
      }
    `);
    if (data) setCached("about", data);
    return data;
  } catch (error) {
    logSanityError("about", error);
    return cached || null;
  }
}

export async function getResume() {
  const cached = getCached("resume");
  if (cached) return cached;

  try {
    const data = await sanityClient.fetch(`
      *[_type == "resume"] | order(_updatedAt desc, _createdAt desc) {
        _id,
        "pdfUrl": coalesce(resumeFile.asset->url, resumePdf.asset->url, file.asset->url),
        "originalFilename": coalesce(resumeFile.asset->originalFilename, resumePdf.asset->originalFilename, file.asset->originalFilename)
      }[defined(pdfUrl)][0]
    `);
    if (data) setCached("resume", data);
    return data;
  } catch (error) {
    logSanityError("resume", error);
    return cached || null;
  }
}
