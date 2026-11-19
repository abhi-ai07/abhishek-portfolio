import { createClient } from "@sanity/client";
import imageUrlBuilder, { createImageUrlBuilder } from "@sanity/image-url";

export const projectId = import.meta.env.VITE_SANITY_PROJECT_ID || "og5nj822";
export const dataset = import.meta.env.VITE_SANITY_DATASET || "production";
export const apiVersion = import.meta.env.VITE_SANITY_API_VERSION || "2025-01-01";

export const sanityClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
});

const imageBuilderFactory =
  typeof createImageUrlBuilder === "function" ? createImageUrlBuilder : imageUrlBuilder;
const builder = imageBuilderFactory(sanityClient);

export function urlFor(source) {
  if (!source) return null;
  return builder.image(source);
}
