/// <reference types="vite/client" />

// react-native-web ships no types; its surface is the one of react-native.
declare module "react-native-web" {
  export * from "react-native";
}

// The Usage snippets call into the reader's own app (`api`, an OAuth helper). The viewer stands in for them.
declare const api: { subscribe(email: string): Promise<void>; signup(details: unknown): Promise<void> };
declare function startOAuth(provider: string): void;
