// tRPC router

import { router, procedure } from "./_app";
import { prisma } from "../../prismaClient";
import { z } from 'zod';
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

export const bugRouter = router({
  getBugs: procedure.query(async () => {
    return prisma.bug.findMany({ orderBy: { id: 'asc' } });
  }),
  createBug: procedure
    .input(z.object({
      title: z.string().trim().min(1),
      description: z.string().trim().optional(),
      status: z.string().trim(),
    }))
    .mutation(async ({ input }) => {
      return prisma.bug.create({ data: input })
    }),
  deleteBug: procedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      try {
        return await prisma.bug.delete({ where: { id: input.id } });
      } catch (err:any) {
        if (err instanceof PrismaClientKnownRequestError && err.code === 'P2025') {
          throw new Error(`Bug with provided ID does not exist`);
        }
        throw err;
      }
    }),
});
