# Deployment

*Priest MD — Developed by Inkora Systems*

## Prerequisites

- Node.js 18+ (recommended 20)
- MongoDB (local or Atlas)
- Telegram bot token
- A phone number to pair

## Production install

```bash
cd PriestMD
npm install --production
cp .env.example .env   # configure secrets
npm start
```

## Process manager (PM2)

```bash
npm install -g pm2
pm2 start index.js --name priest-md
pm2 save
pm2 startup
pm2 logs priest-md
```

PM2 keeps the process alive and restarts it on crash or boot.

## Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm install --production
CMD ["node", "index.js"]
```

Mount `sessions/` and `logs/` as persistent volumes — session credentials live on disk.

```bash
docker run -d --name priest-md \
  -v $(pwd)/sessions:/app/sessions \
  -v $(pwd)/logs:/app/logs \
  --env-file .env \
  priest-md
```

## Recommended environment

- A small VPS (1 vCPU / 1 GB RAM is fine) or a container platform.
- MongoDB Atlas free tier for the database.

## Security notes

- Keep `.env` out of version control (add to `.gitignore`).
- Only add trusted users to `TELEGRAM_ADMINS` — the panel has full control.
- Back up `sessions/` regularly (see Backups).
