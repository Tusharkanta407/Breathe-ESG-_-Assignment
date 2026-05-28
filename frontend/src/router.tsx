import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export function createAppRouter() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: 2 },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return { router, queryClient };
}

/** @deprecated Use createAppRouter — kept for TanStack Start dev entrypoints */
export const getRouter = () => createAppRouter().router;
