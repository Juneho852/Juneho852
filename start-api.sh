#!/bin/sh
set -e
cd apps/api
npx prisma migrate deploy
npx ts-node --transpile-only -r tsconfig-paths/register src/main.ts
