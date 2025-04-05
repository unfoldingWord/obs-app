// Type declarations for non-standard modules or features
declare module '*.jpg';
declare module '*.png';

// Add type definitions for webpack's require.context
interface RequireContext {
  keys(): string[];
  <T>(id: string): T;
  resolve(id: string): string;
  id: string;
}

declare namespace NodeJS {
  interface Global {
    require: {
      context(
        directory: string,
        useSubdirectories: boolean,
        regExp: RegExp
      ): RequireContext;
    };
  }
}

declare var require: {
  context(
    directory: string,
    useSubdirectories: boolean,
    regExp: RegExp
  ): RequireContext;
}; 