/// <reference types="react" />
/// <reference types="react-dom" />

declare namespace React {
  interface FC<P = {}> {
    (props: P): React.ReactElement | null;
  }

  interface ReactElement {
    type: string | React.ComponentType<any>;
    props: any;
    key: string | number | null;
  }

  interface ComponentType<P = {}> {
    (props: P): ReactElement | null;
  }

  interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
    className?: string;
  }

  interface ButtonHTMLAttributes<T> extends HTMLAttributes<T> {
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset';
  }

  interface DetailedHTMLProps<E extends HTMLAttributes<T>, T> extends E {
    ref?: Ref<T>;
  }
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