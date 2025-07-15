import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      '127.0.0.1', // Local Supabase development
      'localhost', // Alternative localhost
      'supabase.co', // Production Supabase
      'cwmckkfkcjxznkpdxgie.supabase.co', // Replace with your actual project ID
    ],
  },
};

export default nextConfig;
