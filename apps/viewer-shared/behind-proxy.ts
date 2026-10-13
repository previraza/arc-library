import type { Plugin } from "vite";

/**
 * The docs site serves the viewers through a rewrite (/preview/<framework>), and Next rewrites a query like `?vue&type=style&lang.css`
 * into `?vue=&type=style&lang.css=`. Vite recognises a stylesheet or a `?import` by the bare key, so the trailing `lang.css=`
 * would be answered as an unknown file. Put the bare keys back before Vite looks at the URL.
 */
export function behindProxy(): Plugin {
  return {
    name: "manicat:behind-proxy",
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (req.url?.includes("=")) req.url = req.url.replace(/([?&][^=&]+)=(?=&|$)/g, "$1");
        next();
      });
    },
  };
}
