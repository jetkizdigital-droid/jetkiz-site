import type { NextConfig } from "next";

const adminOrigin = "https://admin.jetkiz.asia";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/login",
        destination: `${adminOrigin}/login`,
        permanent: false,
      },
      {
        source: "/layout-20",
        destination: `${adminOrigin}/layout-20`,
        permanent: false,
      },
      {
        source: "/layout-20/:path*",
        destination: `${adminOrigin}/layout-20/:path*`,
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
