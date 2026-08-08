import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // next/image's remotePatterns.hostname only supports a single `*`
    // wildcard (unlike pathname, which supports `**`) - the previous
    // `**.s3.amazonaws.com` / `**.s3.*.amazonaws.com` patterns were invalid
    // and silently matched nothing, so next/image quietly 400'd on every
    // real S3-hosted photo. Never caught earlier because no product ever
    // had a real uploaded photo until category thumbnails did.
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "8000", pathname: "/media/**" },
      { protocol: "https", hostname: "*.cloudfront.net" },
      { protocol: "https", hostname: "*.s3.amazonaws.com" },
      { protocol: "https", hostname: "*.s3.ap-south-1.amazonaws.com" },
    ],
  },
};

export default nextConfig;
