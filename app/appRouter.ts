import { router } from './_app';
import { bugRouter } from './routers/bugs';

export const appRouter = router({
  bugs: bugRouter,
});

export type AppRouter = typeof appRouter;
