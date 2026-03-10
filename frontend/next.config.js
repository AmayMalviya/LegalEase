/** @type {import('next').NextConfig} */
const nextConfig = {
  // These routes use Supabase Auth and must be rendered dynamically at request time.
  // They cannot be statically prerendered because they depend on user session state.
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
};

module.exports = nextConfig;