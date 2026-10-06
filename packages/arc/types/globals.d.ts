// Ambient types for typechecking the registry on its own, without the docs app's Next.js setup.
/// <reference types="next" />
/// <reference types="next/image-types/global" />

// A CSS module import resolves to an object of class names.
declare module "*.module.css" {
  const classes: Record<string, string>;
  export default classes;
}