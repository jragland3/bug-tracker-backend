// tRPC router

import { router, procedure } from "./_app";
import { prisma } from "../../prismaClient";
import { z } from 'zod';
import { TRPCError } from "@trpc/server";

const updateBugInput = z.object({
  id: z.number(),
  title: z.string().trim().optional(),
  description: z.string().trim().optional(),
  status: z.string().trim().optional(),
})

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
        if (err.code === 'P2025') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `Bug with provided ID does not exist`
          });
        }
        throw err;
      }
    }),
  updateBug: procedure
    .input(updateBugInput)
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      
      if (Object.keys(data).length === 0) {
        throw new Error('No fields provided to update');
      }
      const updatedBug = await prisma.bug.update({
        where: { id },
        data
      });

      return updatedBug;
    }),
});
