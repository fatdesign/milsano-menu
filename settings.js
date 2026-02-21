/**
 * ============================================
 * DIGITAL MENU - CENTRAL SETTINGS (MILSANO)
 * ============================================
 */

const SETTINGS = {
    // 1. BRANDING
    restaurantName: "M I L S A N O",
    tagline: "Genuss im Herzen von Mils",
    metaDescription: "Digitales Menü vom Restaurant Milsano. Entdecken Sie unsere Mittags- und Abendkarte.",
    footerText: "2026 Restaurant Milsano",

    // 2. DESIGN TOKENS (Premium Milsano Theme)
    theme: {
        bgPrimary: "#0f0f0f",    // Deep Black
        bgHeader: "#1a1a1a",     // Dark Grey
        accentPink: "#d4af37",   // Gold
        accentTeal: "#ffffff",   // White
        textPrimary: "#ffffff",
        textSecondary: "#b0b0b0",
        fontHeading: "'Outfit', sans-serif",
        fontBody: "'Outfit', sans-serif"
    },

    // 3. API & STORAGE
    proxyUrl: "https://milsano-menu-proxy.f-klavun.workers.dev", // Needs deployment
    storageKey: "milsano_lang",

    // 4. FEATURES
    languages: ["de", "en"],
    defaultLang: "de"
};
