#!/bin/sh
set -e
cd apps/api
npx tsc -p tsconfig.build.json
npx prisma migrate deploy
node dist/main.js
