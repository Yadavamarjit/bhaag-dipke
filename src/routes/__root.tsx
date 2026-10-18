import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import appCss from "../styles.css?url";

const APP_NAME = "Bhaag Dipke Bhaag";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" },
      { title: "Bhaag Dipke Bhaag — Delhi Protest & Police Chase 3D Runner | Desi Subway Surfers" },
      { name: "theme-color", content: "#f59e0b" },
      {
        name: "description",
        content:
          "Play Bhaag Dipke Bhaag online! Help Dipke escape the Delhi Police through Jantar Mantar protests, dharna barricades, DTC buses, and Delhi Metro trains. The ultimate Indian 3D endless runner inspired by Subway Surfers with desi meme sound effects. Free to play in browser with no download!",
      },
      {
        name: "keywords",
        content:
          "Bhaag Dipke Bhaag, Dipke, Dipke game, Dipke protest game, Jantar Mantar protest, Delhi protest runner, Dharna runner game, Delhi Police chase Dipke, Police vs Dipke, Subway Surfers, Subway Surfers India, Desi Subway Surfers, Subway Surfers online free, Indian 3D endless runner, Temple Run Delhi, Delhi Metro runner 3D, Yellow Line metro game, DTC bus dodge game, Police barricade jump game, धरने में फंस गए Dipke, बैरिकेड तोड़ दी Dipke, अरे Dipke भाई चालान कट गया, भाग दिपके भाग, दिपके गेम, जंतर मंतर प्रोटेस्ट गेम, Aree meme sound game, Ye le meme sound runner, Indian meme video game, Play endless runner online no download, Unblocked 3D runner game, Free browser runner mobile WebGL",
      },
      { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" },
      { name: "application-name", content: "Bhaag Dipke Bhaag" },
      { name: "author", content: "Amarjit Yadav" },
      { name: "category", content: "Games / Endless Runner / Arcade" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "VideoGame",
          name: "Bhaag Dipke Bhaag",
          alternateName: ["Bhag Dipke Bhag", "Dipke Protest Runner", "Desi Subway Surfers"],
          description:
            "Help Dipke sprint away from the Delhi Police through Jantar Mantar protests, dharna barricades, yellow line metro trains, and DTC buses in this high-octane Indian 3D endless runner game.",
          genre: ["Action", "Endless Runner", "Arcade", "Platformer", "Parody"],
          gamePlatform: ["Web Browser", "Mobile Browser", "Desktop"],
          applicationCategory: "Game",
          operatingSystem: "Any",
          inLanguage: ["en", "hi"],
          playMode: "SinglePlayer",
          keywords:
            "Dipke, Bhaag Dipke Bhaag, protest runner, Delhi Police chase, Subway Surfers, Jantar Mantar, desi runner game",
          offers: {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD",
            "availability": "https://schema.org/InStock",
          },
        }),
      },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Bungee&family=Outfit:wght@400;600;800;900&family=Yatra+One&display=swap",
      },
      { rel: "preload", as: "image", href: "/characters/bearded/front/00.webp" },
      { rel: "preload", as: "image", href: "/characters/cops/delhi/front/00.webp" },
      { rel: "preload", as: "image", href: "/characters/cops/raf/front/00.webp" },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
    ],
  }),
  component: () => (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <PreviewHostBridge />
        <AuthProvider>
          <Outlet />
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  ),
});
