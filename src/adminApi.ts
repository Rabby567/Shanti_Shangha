export async function apiJson<T = any>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, { credentials: "include", ...options });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success === false) throw new Error(data.message || "অনুরোধটি সম্পন্ন করা যায়নি।");
  return data as T;
}
export const postJson = <T = any>(url: string, body: unknown) => apiJson<T>(url, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) });
