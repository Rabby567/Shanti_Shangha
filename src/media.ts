/** Resolve media paths returned by the PHP API.
 *
 * During local development React runs on Vite (5173) while PHP/Apache
 * serves /uploads from the XAMPP project. On production both are normally
 * same-origin, so relative paths remain relative.
 */
export function mediaUrl(path?: string | null): string {
  const value = String(path || "").trim();
  if (!value) return "";
  if (/^(https?:|data:|blob:)/i.test(value)) return value;

  const normalized = value.startsWith("/") ? value : `/${value}`;

  if (/^\/uploads\//i.test(normalized)) {
    const { protocol, hostname, port, origin } = window.location;
    if (port === "5173" || port === "4173") {
      return `${protocol}//${hostname}/shanti-sangha${normalized}`;
    }
    return `${origin}${normalized}`;
  }

  return normalized;
}
