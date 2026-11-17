import { createClient } from "@sanity/client";
import imageUrlBuilder, { createImageUrlBuilder } from "@sanity/image-url";

export const sanityClient = createClient({
  projectId: "og5nj822",
  dataset: "production",
  apiVersion: "2025-01-01",
  useCdn: true,
});

const imageBuilderFactory = typeof createImageUrlBuilder === "function" ? createImageUrlBuilder : imageUrlBuilder;
const builder = imageBuilderFactory(sanityClient);

export function urlFor(source) {
  if (!source) return null;
  return builder.image(source);
}

