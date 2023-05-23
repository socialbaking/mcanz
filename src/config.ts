// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.

export const SITE_TITLE = "MCANZ";
export const SITE_DESCRIPTION =
  "Medical Cannabis Awareness New Zealand";
export const TWITTER_HANDLE = "";
export const MY_NAME = "";

// setup in astro.config.mjs
const BASE_URL = new URL(import.meta.env.SITE);
export const SITE_URL = BASE_URL.origin;

export const SITE_BANNER_URL = `${SITE_URL}/wp-content/uploads/2022/04/Logo-Wide2-2.png`;