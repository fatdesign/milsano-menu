/**
 * ============================================
 * DIGITAL MENU - CENTRAL SETTINGS (MILSANO)
 * ============================================
 */

const SETTINGS = {
    // 1. BRANDING
    restaurantName: "MILSANO ADMIN",
    tagline: "Restaurant Milsano",
    metaDescription: "Digitales Mittagsmenü vom Restaurant Milsano. Dienstag bis Freitag 11:45 – 13:45 Uhr.",
    footerText: "2026 Restaurant Milsano",

    // 2. DESIGN TOKENS (Brand Matching Milsano Palette)
    theme: {
        bgPrimary: "#011826",    // Deep Navy
        bgHeader: "#034159",     // Accent Navy
        accentPink: "#BF7245",   // Fire Gold (Primary Accent)
        accentTeal: "#A66F6F",   // Fire Red (Secondary Accent)
        textPrimary: "#F2F2F2",  // Off White (Logo Color)
        textSecondary: "rgba(242, 242, 242, 0.7)",
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
