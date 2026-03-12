# bug-tracker-backend
This repository serves as the backend component of the Bug Tracker application. It is designed to be used in conjunction with the frontend repository available at github.com/jragland3/bug-tracker-frontend.

## Table of Contents

    [Installation](#installation)
    [Running the Application](#running-the-application)
    [Prisma Database Setup](#prisma-database-setup)
    [Testing](#testing)
    [API Endpoints](#api-endpoints)
    [Technologies Used](#technologies-used)

## Installation
To install dependencies:

```bash
bun install
```

## Running the Application
To run:

```bash
bun run app/server.ts
```

To run using the test database:
```bash
DATABASE_URL="file:./test.db" bun run app/server.ts
```

This project was created using `bun init` in bun v1.2.20. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.

## Prisma Database Setup
`npm install prisma --save-dev`
`npm install @prisma/client`
`npx prisma init`

### Resetting the database
- for dev db:
`bunx prisma migrate reset --force`
- for test db:
`DATABASE_URL="file:./test.db" bunx prisma migrate reset --force`
- then
`bunx prisma generate`

- Sometimes it helps to remove `node_modules` and reinstall using bun

## Testing
### To run a test script (from package.json):
`bun --env-file=.env.test test:prepare`
- This sets up `prisma/test.db` and seeds it using `prisma/seed.ts`
- To run a test file:
```bash
NODE_ENV=test bun test tests/bugs.e2e.spec.ts
```
### To run a specific test file:
```bash
NODE_ENV=test bun test tests/bugs.e2e.spec.ts
```

## API Endpoints
- Uses tRPC
- GET
  - /v1/trpc/bugs.getBugs: Retrieve all bugs
  - /v1/trpc/bugs.createBug: Create a new bug
    - requires:
      - 'title'
      - 'status'
    - optional:
      - 'description'
  - /v1/trpc/bugs.deleteBug: Delete a bug by ID
    - requires:
      - 'id'
  - /v1/trpc/bugs.updateBug: Update a bug by ID
    - requires:
      - 'id'
    - optional:
      - 'title'
      - 'description'
      - 'status'

## Technologies Used
- Backend Framework: Bun
- Database: Prisma with SQLite/PostgreSQL
- Testing: Bun: test
- CI/CD: GitHub Actions
