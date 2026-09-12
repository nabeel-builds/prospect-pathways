/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Mongoose is a server-only dependency; keep it out of the client bundle.
  serverExternalPackages: ["mongoose", "bcryptjs"],
};

export default nextConfig;
