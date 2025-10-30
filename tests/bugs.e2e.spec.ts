// E2E tests
import { afterAll, beforeAll, beforeEach, test, expect, describe } from 'bun:test';
import { prisma } from '../app/prismaClient';
import { spawn } from 'child_process';

const API_URL = 'http://localhost:3000/v1/trpc';

let server: any;

describe('BugRouter E2E API tests', () => {
  beforeAll(async () => {
    // Start backend server in test mode
    server = spawn('bun', ['run', 'app/server.ts'], {
      env: { ...process.env, NODE_ENV: 'test' },
      stdio: 'inherit',
    });

    // Allow time for server start
    await new Promise((r) => setTimeout(r, 2000));
  });

  beforeEach(async () => {
    await prisma.bug.deleteMany();
  });

  afterAll(() => {
    server.kill();
  });

  test('GET /v1/trpc/bugs.getBugs returns an empty array', async () => {
    const res = await fetch(`${API_URL}/bugs.getBugs`);
    const json = (await res.json()) as {
      result?: { data?: any };
      error?: { message?: string };
    };

    expect(res.status).toBe(200);
    expect(json.result?.data).toEqual([]);
  });

  test('POST /v1/trpc/bugs.createBug creates a new bug', async () => {
    const res = await fetch(`${API_URL}/bugs.createBug`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'E2E Bug', 
        description: 'via E2E', 
        status: 'open',
      }),
    });

    const json = (await res.json()) as {
      result?: { data?: any };
      error?: { message?: string };
    };
    expect(res.status).toBe(200);
    expect(json.result?.data?.title).toBe('E2E Bug');
    expect(json.result?.data?.description).toBe('via E2E');
    expect(json.result?.data?.status).toBe('open')
  });

  test('DELETE /v1/trpc/bugs.deleteBug deletes a bug', async () => {
    // Create bug
    const createRes = await fetch(`${API_URL}/bugs.createBug`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'To Delete', 
        description: 'delete me', 
        status: 'open',
      }),
    });
    const created = (await createRes.json()) as {
      result?: { data?: any };
      error?: { message?: string };
    };
    const bugId = created.result?.data?.id;

    // Delete bug
    const deleteRes = await fetch(`${API_URL}/bugs.deleteBug`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: bugId }),
    })
    expect(deleteRes.status).toBe(200);
    
    // Verify deletion
    const getRes = await fetch(`${API_URL}/bugs.getBugs`);
    const getJson = (await getRes.json()) as {
      result: { data: any };
      error: { message: string };
    };
    expect(getJson.result.data.some((b: any) => b.id === bugId)).toBe(false);
  });

  test('deleteBug returns an error when bug does not exist', async () => {
    const res = await fetch(`${API_URL}/bugs.deleteBug`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 9999 }),
    });
    const json = (await res.json()) as {
      result: { data: any },
      error?: { message: string },
    };

    expect(res.status).toBe(500);
    expect(json.error?.message).toContain('Bug with provided ID does not exist')
  })
});
