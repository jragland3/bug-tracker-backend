import { router, procedure } from "../_app";
import { prisma } from "../prismaClient";
import { z } from 'zod';

export const bugRouter = router({
  getBugs: procedure.query(async () => {
    return prisma.bug.findMany({ orderBy: { createdAt: 'asc' } });
  }),
  createBug: procedure
    .input(z.object({
      title: z.string().min(1),
      status: z.string(),
    }))
    .mutation(async ({ input }) => {
      return prisma.bug.create({ data: input })
    })
});
