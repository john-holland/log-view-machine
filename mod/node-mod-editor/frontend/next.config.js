/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['log-view-machine', 'next-cave-adapter'],
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
        path: false,
        os: false,
        stream: false,
        http: false,
        https: false,
        zlib: false,
        util: false,
        buffer: false,
        async_hooks: false,
        ...config.resolve.fallback,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
