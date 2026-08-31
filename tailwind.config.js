/**
 * Tailwind CSS v4 Configuration - Ichava Package
 * 
 * Minimal configuration for Tailwind v4 (CSS-first approach).
 * Theme customization is done in ichava.scss using CSS variables.
 */
export default {
  content: [
    "./resources/**/*.blade.php",
    "./resources/**/*.{vue,js,ts}",
  ],
  plugins: [require("tailwindcss-animate")],
}

