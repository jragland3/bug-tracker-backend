import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from './routers/v1/appRouter';

Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);

    if (url.pathname.startsWith('/v1/trpc')) {
      return fetchRequestHandler({
        req,
        router: appRouter,
        createContext: () => ({}),
        endpoint: '/v1/trpc',
      });
    }

    return new Response('Not Found', { status: 404 });
  },
});

console.log('Server running on http://localhost:3000');
