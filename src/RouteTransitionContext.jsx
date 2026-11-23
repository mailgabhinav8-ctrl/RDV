import { createContext, useContext } from "react";

export const RouteTransitionContext = createContext((path) => window.location.assign(path));

export function useRouteTransition() {
  return useContext(RouteTransitionContext);
}
