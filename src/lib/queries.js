import { sanityClient } from "./sanity";

export async function getCertificates() {
  try {
    return await sanityClient.fetch(`
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
  } catch (error) {
    console.warn("Could not fetch certificates from Sanity:", error);
    return null;
  }
}

export async function getProjects() {
  try {
    return await sanityClient.fetch(`
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
  } catch (error) {
    console.warn("Could not fetch projects from Sanity:", error);
    return null;
  }
}

export async function getExperience() {
  try {
    return await sanityClient.fetch(`
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
  } catch (error) {
    console.warn("Could not fetch experience from Sanity:", error);
    return null;
  }
}

export async function getAbout() {
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
    return data;
  } catch (error) {
    console.warn(
      "Could not fetch about document from Sanity, falling back to defaults:",
      error,
    );
    return null;
  }
}

export async function getResume() {
  try {
    const data = await sanityClient.fetch(`
      *[_type == "resume"] | order(_updatedAt desc, _createdAt desc) {
        _id,
        "pdfUrl": coalesce(resumeFile.asset->url, resumePdf.asset->url, file.asset->url),
        "originalFilename": coalesce(resumeFile.asset->originalFilename, resumePdf.asset->originalFilename, file.asset->originalFilename)
      }[defined(pdfUrl)][0]
    `);
    return data;
  } catch (error) {
    console.warn("Could not fetch resume from Sanity:", error);
    return null;
  }
}

