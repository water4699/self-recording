import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  headers() {
    // FHEVM requires COEP for SharedArrayBuffer support
    // Base Account SDK requires COOP to NOT be 'same-origin'
    // Using 'unsafe-none' to satisfy Base Account SDK while keeping COEP for FHEVM
    return Promise.resolve([
      {
        source: '/',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'unsafe-none',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
        ],
      },
    ]);
  }
};

export default nextConfig;

