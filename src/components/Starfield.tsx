/**
 * Subtle STATIC starfield background. Rendered once at the app root, sits
 * behind all content (z-index: -1). Intentionally not animated — a quiet
 * texture, per the brand's calm "space" aesthetic.
 */
export default function Starfield() {
  return <div className="starfield" aria-hidden="true" />;
}
