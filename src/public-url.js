/** Resolve public files relative to the deployment, including GitHub project pages. */
export function resolvePublicPath(path, base = "/") {
  return `${base.replace(/\/*$/, "/")}${path.replace(/^\/+/, "")}`;
}

export function publicUrl(path = "") {
  const base = import.meta.env ? import.meta.env.BASE_URL : "/";
  return resolvePublicPath(path, base);
}
