import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from './routers/v1/appRouter';

const allowedOrigin = process.env.FRONTEND_ORIGIN

Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);

    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': allowedOrigin,
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        },
      });
    };

    if (url.pathname.startsWith('/v1/trpc')) {
      const res = await fetchRequestHandler({
        req,
        router: appRouter,
        createContext: () => ({}),
        endpoint: '/v1/trpc',
      });

      return new Response(res.body, {
        status: res.status,
        headers: {
          ...Object.fromEntries(res.headers),
          'Access-Control-Allow-Origin': allowedOrigin,
        },
      });
    };


    if (url.pathname === '/health') {
      return new Response('ok', {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': allowedOrigin,
        },
      });
    };

    return new Response('Not Found', { status: 404 });
  },
});

console.log('Server running on http://localhost:3000');
