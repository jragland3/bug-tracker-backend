// E2E tests
import { afterAll, beforeAll, beforeEach, test, expect, describe } from 'bun:test';
import { prisma } from '../app/prismaClient';
import { spawn } from 'child_process';
import type { TrpcResponse } from './helpers/testTypes';

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

  // -------------------
  // getBugs tests
  // -------------------
  test('getBugs returns an empty array', async () => {
    const res = await fetch(`${API_URL}/bugs.getBugs`);
    const json = (await res.json()) as {
      result?: { data?: any };
      error?: { message?: string };
    };

    expect(res.status).toBe(200);
    expect(json.result?.data).toEqual([]);
  });

  // -------------------
  // createBug tests
  // -------------------
  test('createBug creates a new bug', async () => {
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
    expect(json.result?.data?.status).toBe('open');
  });

  test('createBug accepts long and special character titles', async () => {
    const bugTitle = '🔥 Very long title with !@#$%^&*() characters — and it still works ✅';
    const bugDescription = 'via E2E';
    const bugStatus = 'open';
    const res = await fetch(`${API_URL}/bugs.createBug`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: bugTitle,
        description: bugDescription, 
        status: bugStatus,
      }),
    });

    const json = (await res.json()) as {
      result?: { data?: any },
      error?: { message?: any },
    };

    expect(res.status).toBe(200);
    expect(json.result?.data?.title).toBe(bugTitle);
    expect(json.result?.data?.description).toBe(bugDescription);
    expect(json.result?.data?.status).toBe(bugStatus);    
  });

  test('createBug throws an error with invalid input (missing title)', async () => {
    const res = await fetch(`${API_URL}/bugs.createBug`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: 'via E2E', 
        status: 'open',
      }),
    });

    const json = await res.json() as TrpcResponse<any[]>;

    expect(res.status).toBe(400);
    expect(json.error?.message).toContain('Invalid input: expected string, received undefined');
  });

  // -------------------
  // deleteBug tests
  // -------------------
  test('deleteBug deletes a bug', async () => {
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

    expect(res.status).toBe(404);
    expect(json.error?.message).toContain('Bug with provided ID does not exist')
  })

  // -------------------
  // updateBug tests
  // -------------------
  test('updateBug updates only the title', async () => {
    const originalTitle = 'E2E Update bug'
    const originalDescription = 'before update'
    const originalStatus = 'open'

    // Create bug
    const createRes = await fetch(`${API_URL}/bugs.createBug`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: originalTitle,
        description: originalDescription,
        status: originalStatus,
      }),
    });

    const createJson = (await createRes.json() as {
      result?: { data?: any };
      error?: { message?: string };
    });
    const bugId = createJson.result?.data?.id;
    const newBugTitle = 'E2E Updated title';
    expect(bugId).toBeDefined();

    // Send update
    const updateRes = await fetch(`${API_URL}/bugs.updateBug`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: bugId,
        title: newBugTitle,
      }),
    });

    expect(updateRes.status).toBe(200);
    const updateJson = (await updateRes.json()) as {
      result?: { data?: any };
      error?: { message?: string };
    };

    // Validate the response
    const updatedBug = updateJson.result?.data;
    expect(updatedBug.id).toBe(bugId);
    expect(updatedBug.title).toBe(newBugTitle);

    // Verify via GET
    const getRes = await fetch(`${API_URL}/bugs.getBugs`);
    const getJson = await getRes.json() as TrpcResponse<any[]>;
    const retrieved = getJson.result?.data?.find((b: any) => b.id === bugId);
    expect(retrieved.title).toBe(newBugTitle);
    expect(retrieved.description).toBe(originalDescription);
    expect(retrieved.status).toBe(originalStatus);
  });

  test('updateBug updates only the description', async () => {
    const originalTitle = 'E2E Update bug'
    const originalDescription = 'before update'
    const originalStatus = 'open'

    // Create bug
    const createRes = await fetch(`${API_URL}/bugs.createBug`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: originalTitle,
        description: originalDescription,
        status: originalStatus,
      }),
    });

    const createJson = (await createRes.json() as {
      result?: { data?: any };
      error?: { message?: string };
    });
    const bugId = createJson.result?.data?.id;
    const newBugDescription = 'E2E Updated description';
    expect(bugId).toBeDefined();

    // Send update for description
    const updateRes = await fetch(`${API_URL}/bugs.updateBug`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: bugId,
        description: newBugDescription,
      }),
    });

    expect(updateRes.status).toBe(200);
    const updateJson = (await updateRes.json()) as {
      result?: { data?: any };
      error?: { message?: string };
    };

    // Validate the response
    const updatedBug = updateJson.result?.data;
    expect(updatedBug.id).toBe(bugId);
    expect(updatedBug.description).toBe(newBugDescription);

    // Verify via GET
    const getRes = await fetch(`${API_URL}/bugs.getBugs`);
    const getJson = await getRes.json() as TrpcResponse<any[]>;
    const retrieved = getJson.result?.data?.find((b: any) => b.id === bugId);
    expect(retrieved.title).toBe(originalTitle);
    expect(retrieved.description).toBe(newBugDescription);
    expect(retrieved.status).toBe(originalStatus);
  });

  test('updateBug updates only the status', async () => {
    const originalTitle = 'E2E Update bug'
    const originalDescription = 'before update'
    const originalStatus = 'open'

    // Create bug
    const createRes = await fetch(`${API_URL}/bugs.createBug`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: originalTitle,
        description: originalDescription,
        status: originalStatus,
      }),
    });

    const createJson = (await createRes.json() as {
      result?: { data?: any };
      error?: { message?: string };
    });
    const bugId = createJson.result?.data?.id;
    const newBugStatus = 'resolved';
    expect(bugId).toBeDefined();

    // Send update
    const updateRes = await fetch(`${API_URL}/bugs.updateBug`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: bugId,
        status: newBugStatus,
      }),
    });

    expect(updateRes.status).toBe(200);
    const updateJson = (await updateRes.json()) as {
      result?: { data?: any };
      error?: { message?: string };
    };

    // Validate the response
    const updatedBug = updateJson.result?.data;
    expect(updatedBug.id).toBe(bugId);
    expect(updatedBug.title).toBe(originalTitle);
    expect(updatedBug.description).toBe(originalDescription)
    expect(updatedBug.status).toBe(newBugStatus);

    // Verify via GET
    const getRes = await fetch(`${API_URL}/bugs.getBugs`);
    const getJson = await getRes.json() as TrpcResponse<any[]>;
    const retrieved = getJson.result?.data?.find((b: any) => b.id === bugId);
    expect(retrieved.title).toBe(originalTitle);
    expect(retrieved.description).toBe(originalDescription);
    expect(retrieved.status).toBe(newBugStatus);
  });

  test('updateBug updates all fields together', async () => {
    const originalTitle = 'E2E Update bug'
    const originalDescription = 'before update'
    const originalStatus = 'open'

    // Create bug
    const createRes = await fetch(`${API_URL}/bugs.createBug`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: originalTitle,
        description: originalDescription,
        status: originalStatus,
      }),
    });

    const createJson = (await createRes.json() as {
      result?: { data?: any };
      error?: { message?: string };
    });
    const bugId = createJson.result?.data?.id;
    const newBugTitle = 'E2E Updated Title';
    const newBugDescription = 'E2E Updated description';
    const newBugStatus = 'resolved'
    expect(bugId).toBeDefined();

    // Send update
    const updateRes = await fetch(`${API_URL}/bugs.updateBug`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: bugId,
        title: newBugTitle,
        description: newBugDescription,
        status: newBugStatus,
      }),
    });

    expect(updateRes.status).toBe(200);
    const updateJson = (await updateRes.json()) as {
      result?: { data?: any };
      error?: { message?: string };
    };

    // Validate the response
    const updatedBug = updateJson.result?.data;
    expect(updatedBug.id).toBe(bugId);
    expect(updatedBug.title).toBe(newBugTitle);
    expect(updatedBug.description).toBe(newBugDescription);
    expect(updatedBug.status).toBe(newBugStatus);

    // Verify via GET
    const getRes = await fetch(`${API_URL}/bugs.getBugs`);
    const getJson = await getRes.json() as TrpcResponse<any[]>;
    const retrieved = getJson.result?.data?.find((b: any) => b.id === bugId);
    expect(retrieved.title).toBe(newBugTitle);
    expect(retrieved.description).toBe(newBugDescription);
    expect(retrieved.status).toBe(newBugStatus);
  });

  test('updateBug returns an error when no fields are provided', async () => {
    const originalTitle = 'E2E Update bug'
    const originalDescription = 'before update'
    const originalStatus = 'open'

    // Create bug
    const createRes = await fetch(`${API_URL}/bugs.createBug`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: originalTitle,
        description: originalDescription,
        status: originalStatus,
      }),
    });

    const createJson = (await createRes.json() as {
      result?: { data?: any };
      error?: { message?: string };
    });
    const bugId = createJson.result?.data?.id;
    expect(bugId).toBeDefined();

    // Send update
    const updateRes = await fetch(`${API_URL}/bugs.updateBug`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: bugId,
      }),
    });

    const updateJson = (await updateRes.json()) as TrpcResponse<any[]>;

    expect(updateRes.status).toBeGreaterThanOrEqual(400);
    expect(updateJson.error?.message).toContain('No fields provided to update');
  });

  test('updateBug returns an error when bug does not exist', async () => {
    const res = await fetch(`${API_URL}/bugs.updateBug`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 9999, title: 'Nonexistent' }),
    });

    const json = await res.json() as TrpcResponse<any[]>;
    expect(res.status).toBe(500);
    expect(json.error?.message).toContain('No record was found for an update');
  });
});
