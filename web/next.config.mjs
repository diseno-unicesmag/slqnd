// Exportación estática para GitHub Pages. BASE_PATH lo fija el flujo de despliegue (/slqnd).
const base = process.env.BASE_PATH || '';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath: base,
  images: { unoptimized: true },
  env: { NEXT_PUBLIC_BASE: base },
};

export default nextConfig;
