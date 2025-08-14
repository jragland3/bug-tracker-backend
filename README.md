# bug-tracker-backend

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.2.20. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.

# Prisma setup
`npm install prisma --save-dev`
`npm install @prisma/client`
`npx prisma init`

### Reset database
- for dev db:
`bunx prisma migrate reset --force`
- for test db:
`DATABASE_URL="file:./test.db" bunx prisma migrate reset --force`
- then
`bunx prisma generate`

- Sometimes it helps to remove `node_modules` and reinstall using bun

### To run a test script (from package.json):
`bun --env-file=.env.test test:prepare`
- This sets up `prisma/test.db` and seeds it using `prisma/seed.ts`