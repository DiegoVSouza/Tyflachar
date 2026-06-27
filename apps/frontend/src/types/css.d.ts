// Allow TypeScript to import plain CSS files (side-effect imports)
declare module '*.css';

// Allow TypeScript to import CSS Modules
declare module '*.module.css' {
  const classes: Readonly<Record<string, string>>;
  export default classes;
}

declare module '*.module.scss' {
  const classes: Readonly<Record<string, string>>;
  export default classes;
}
