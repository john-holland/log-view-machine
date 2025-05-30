/// <reference types="react" />
/// <reference types="react-dom" />

declare module 'react' {
  export type ReactNode = ReactElement | string | number | boolean | null | undefined;

  export interface FC<P = {}> {
    (props: P): ReactElement | null;
  }

  export interface ReactElement {
    type: string | ComponentType<any>;
    props: any;
    key: string | number | null;
  }

  export interface ComponentType<P = {}> {
    (props: P): ReactElement | null;
  }

  export interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
    className?: string;
  }

  export interface ButtonHTMLAttributes<T> extends HTMLAttributes<T> {
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset';
  }

  export interface DetailedHTMLProps<E extends HTMLAttributes<T>, T> extends E {
    ref?: Ref<T>;
  }

  export function useState<T>(initialState: T | (() => T)): [T, (newState: T | ((prevState: T) => T)) => void];
}

declare global {
  namespace JSX {
    interface Element extends React.ReactElement {}
    interface IntrinsicElements {
      div: React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
      h2: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
      h3: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
      button: React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>;
    }
  }
} 