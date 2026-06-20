/** @type {import('next').NextConfig} */
const withBundleAnalyzer = process.env.ANALYZE === "true"
  ? require("@next/bundle-analyzer")({ enabled: true })
  : (config) => config;

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

export default withBundleAnalyzer(nextConfig);
