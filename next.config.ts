// Next.js config
// Configure Turbopack root to silence workspace root inference warnings
// See: https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack#root-directory
const config = {
  turbopack: {
    root: __dirname,
  },
};

export default config;
