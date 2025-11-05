// tRPC procedure unit/integration tests

import { bugRouter } from './bugs';
import { prisma } from '../../prismaClient';
import { afterAll, beforeEach, test, expect, describe } from 'bun:test';


const caller = bugRouter.createCaller({});

describe('bugRouter tRPC tests', () => {
  beforeEach(async () => {
    await prisma.bug.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // -------------------
  // getBugs tests
  // -------------------
  test('getBugs returns an empty array when no bugs exist', async () => {
    const bugs = await caller.getBugs();
    expect(bugs).toEqual([]);
  });

  test('getBugs returns multiple bugs', async () => {
    await Promise.all([
      caller.createBug({title:'Bug1', status:'Active'}),
      caller.createBug({title:'Bug2', status:'Active'}),
    ]);

    const bugs = (await caller.getBugs()).map((bug: any) => ({
      ...bug,
      createdAt: bug.createdAt.toISOString(),
    }));
    expect(bugs.length).toBe(2);
    expect(bugs.map((b: { title: string }) => b.title)).toContain('Bug1');
  });

  // -------------------
  // createBug tests
  // -------------------
  test('createBug creates a new bug', async () => {
    const input = {
      title: 'Test Bug',
      description: 'Demo Bug',
      status: 'Active'
    }
    const bug = await caller.createBug(input);
    expect(bug).toMatchObject(input);
    const all = await caller.getBugs();
    expect(all.length).toBe(1);
  });

  test('createBug throws an error on invalid input (missing title)', async () => {
    const input = {
      title: '',
      description: 'No title test',
      status: 'Active'
    }
    try {
      await caller.createBug(input);
      throw new Error('an error was expected but did not occur');
    } catch (err:any) {
      expect(err.message).toContain('title');
    }
  });

  test('createBug accepts long and special character titles', async () => {
    const input = {
      title: '🔥 Very long title with !@#$%^&*() characters — and it still works ✅',
      status: 'Active',
      description: 'Edge case description',
    };

    const bug = await caller.createBug(input);
    expect(bug.title).toBe(input.title);
  })

  // -------------------
  // deleteBug tests
  // -------------------
  test('deleteBug removes a bug', async () => {
    const bug = await caller.createBug({ title: 'ToDelete', status: "Active"});
    const allBefore = await caller.getBugs();
    expect(allBefore.length).toBe(1);

    await caller.deleteBug({ id: bug.id });
    const allAfter = await caller.getBugs();
    expect(allAfter.length).toBe(0);
  });

  test('deleteBug throws error if bug does not exist', async () => {
    try {
      await caller.deleteBug({ id: 9999 });
      throw new Error('Expected error but none occurred');
    } catch (err:any) {
      expect(err.message).toContain('Bug with provided ID does not exist');
    }
  });
});