/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  // Performance optimizations
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error'] } : false,
  },
  // Bundle analysis and optimization
  experimental: {
    optimizePackageImports: ['lucide-react'],
    optimizeCss: true,
    serverMinification: true,
    webVitalsAttribution: ['CLS', 'FCP', 'FID', 'INP', 'LCP', 'TTFB'],
  },
  // Turbopack configuration (moved from experimental.turbo)
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000, // 1 year
  },
  // Headers for caching and performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)'
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; style-src 'self' 'unsafe-inline' fonts.googleapis.com; font-src 'self' fonts.gstatic.com data:; img-src 'self' data: blob:; script-src 'self' 'unsafe-eval' 'unsafe-inline'; connect-src 'self'"
          }
        ]
      },
      {
        source: '/fonts/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      }
    ]
  },
  // Webpack optimizations for mobile performance
  webpack: (config, { dev, isServer, webpack }) => {
    // Production optimizations
    if (!dev && !isServer) {
      // Tree shaking for JSON files
      config.optimization.usedExports = true;
      
      // Advanced bundle splitting for mobile
      config.optimization.splitChunks = {
        chunks: 'all',
        minSize: 20000,
        maxSize: 244000,
        cacheGroups: {
          // Framework code (React, Next.js)
          framework: {
            chunks: 'all',
            name: 'framework',
            test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
            priority: 40,
            enforce: true,
          },
          // Third-party libraries
          lib: {
            test: /[\\/]node_modules[\\/]/,
            name: 'lib',
            priority: 30,
            chunks: 'all',
            maxSize: 170000,
          },
          // App-specific utilities and components
          commons: {
            name: 'commons',
            minChunks: 2,
            priority: 20,
            chunks: 'all',
            enforce: true,
          },
          // Waste data and heavy components
          wasteData: {
            test: /[\\/](thailand-waste-categories\.json|WasteScanner|GameificationPanel)/,
            name: 'waste-features',
            chunks: 'all',
            priority: 10,
          },
        },
      };

      // Mobile-specific optimizations
      config.optimization.moduleIds = 'deterministic';
      config.optimization.chunkIds = 'deterministic';
      
      // Reduce bundle size for mobile networks
      if (config.mode === 'production') {
        config.optimization.minimize = true;
      }
    }

    // Mobile performance plugins
    config.plugins.push(
      new webpack.DefinePlugin({
        '__DEV__': dev,
        '__MOBILE_BUILD__': true,
      })
    );

    // Optimize for mobile devices
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    return config;
  },
}

module.exports = nextConfig