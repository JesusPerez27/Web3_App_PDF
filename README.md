# Web3 PDF Registry

Registro y verificación de contratos PDF (IPFS + Pinata + Sepolia).

## Local

1. `backend/.env` y `frontend/.env` a partir de los `.env.example`.
2. `cd backend && npm install && npm run dev`
3. `cd frontend && npm install && npm run dev`

Deploy del contrato: `cd frontend && npm run compile:contracts && npm run deploy:sepolia`

## Producción

- API: **Render** — raíz del repo, carpeta `backend` (`render.yaml`).
- Frontend: **Vercel** — `vercel.json` en la raíz; variable `VITE_BACKEND_URL` = URL pública del API.
