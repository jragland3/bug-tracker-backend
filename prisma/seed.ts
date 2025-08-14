import { prisma } from "../app/prismaClient";

await prisma.bug.create({
  data: {
    title: 'Seed Bug',
    status: 'Active',
    description: 'This is a seed bug',
  }
});