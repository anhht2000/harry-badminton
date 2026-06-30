export default {
  reactStrictMode: true,
  images: {
    // Anh co key UUID bat bien -> giu ban da optimize lau (mac dinh chi 4h).
    minimumCacheTTL: 31536000,
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "*.s3.us-east-1.amazonaws.com" },
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" }
    ]
  }
};
