import * as React from 'react';

declare module 'sonner' {
  export interface ToasterProps {
    [key: string]: any;
  }

  export const Toaster: React.ComponentType<ToasterProps>;

  export const toast: {
    (message: string, options?: any): void;
    success: (message: string, options?: any) => void;
    error: (message: string, options?: any) => void;
    info?: (message: string, options?: any) => void;
    warning?: (message: string, options?: any) => void;
  };
}


