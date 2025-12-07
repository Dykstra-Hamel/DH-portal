import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    domains: [
      '127.0.0.1', // Local Supabase development
      'localhost', // Alternative localhost
      'supabase.co', // Production Supabase
      'cwmckkfkcjxznkpdxgie.supabase.co', // Replace with your actual project ID
      // OAuth provider avatars
      'lh3.googleusercontent.com', // Google avatars
      'platform-lookaside.fbsbx.com', // Facebook avatars
      'avatars.githubusercontent.com', // GitHub avatars
      'cdn.discordapp.com', // Discord avatars
    ],
  },
};

export default nextConfig;
