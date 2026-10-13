/// <reference types="vite/client" />


// The Usage snippets call into the reader's own app (`api`, a router, an OAuth helper). The viewer stands in for them.
declare global {
  const api: { subscribe(email: string): Promise<void>; signup(details: unknown): Promise<void> };
}

declare module "vue" {
  interface ComponentCustomProperties {
    $router: { push(to: string): void };
    startOAuth(provider: string): void;
  }
}

export {};
