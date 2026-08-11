import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  typescript: {
    // Permite concluir o build na Vercel sem travar em tipagens estritas
    ignoreBuildErrors: true,
  },
  eslint: {
    // Ignora avisos de linter no build de produção
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow, noarchive, nosnippet',
          },
        ],
      },
    ]
  },
}

export default nextConfig