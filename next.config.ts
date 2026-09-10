import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Course cover images and lesson images are uploaded by the admin
    // dashboard to Supabase Storage (public bucket `course-assets`), NOT
    // Firebase Storage — Firestore only stores the resulting public URL.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "fsbdvcwttmlxtcjyupne.supabase.co",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
      },
    ],
  },
};

export default nextConfig;