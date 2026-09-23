/** Builds a sized Unsplash CDN URL from a bare `photo-<id>` reference. */
export function unsplashImage(photoId: string, width = 800): string {
  return `https://images.unsplash.com/${photoId}?w=${width}&q=80&auto=format&fit=crop`;
}
