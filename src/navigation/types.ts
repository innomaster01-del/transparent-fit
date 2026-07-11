/**
 * Navigation prop types. We use a minimal hand-rolled navigator (see App.tsx)
 * because react-navigation pulls in a lot of weight we don't need for 5 screens.
 */

export type ScreenName = 'Welcome' | 'PhotoCapture' | 'MarkPoints' | 'LiveTryOn' | 'Snapshot' | 'Settings';

export interface NavProps<P = unknown> {
  nav: {
    push: (screen: ScreenName, params?: any) => void;
    pop: () => void;
    replace: (screen: ScreenName, params?: any) => void;
  };
  params?: P;
}
