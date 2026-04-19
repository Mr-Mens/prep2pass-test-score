/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/start",
        destination: "/assessment",
        permanent: true,
      },
      {
        source: "/start-assessment",
        destination: "/assessment",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
