import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  publicRuntimeConfig: {
    BLOB_READ_WRITE_TOKEN:
      'vercel_blob_rw_YpsJxEvyCQKS0S0S_K1XCafyic3NfQLnbuFBDAO3yiBbVwz',
  },
};

export default nextConfig;
