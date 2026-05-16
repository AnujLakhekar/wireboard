import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['polotno', '@blueprintjs/core', '@meronex/icons', 'swr', 'react-window'],
};

export default nextConfig;
