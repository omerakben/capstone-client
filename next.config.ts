const config = {
  // Other config options...
  experimental: {
    // Silence workspace root inference warning
    // See: https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack#root-directory
    turbopack: {
      root: __dirname,
    },
  },
};

export default config as any;
