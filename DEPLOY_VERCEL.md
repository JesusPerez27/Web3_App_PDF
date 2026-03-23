# Desplegar el frontend en Vercel

Vercel solo sirve el **frontend** (React + Vite). El **backend** (Node/Express) debe estar en otro servicio (Render, Railway, Fly.io, etc.) con URL pública y CORS permitido.

## 1. Tener el backend en internet

Tu API en Render (ejemplo de este proyecto):

`https://web3-app-pdf.onrender.com`

En las variables de entorno del backend pon las mismas que en local: `SEPOLIA_RPC_URL`, `PRIVATE_KEY`, `CONTRACT_ADDRESS`, `PINATA_JWT`.

## 2. Conectar GitHub con Vercel

1. Entra en [vercel.com](https://vercel.com) e inicia sesión.
2. **Add New… → Project**.
3. **Import** el repositorio `JesusPerez27/Web3_App_PDF` (u otro).
4. En **Configure Project** deja la **raíz del repo** (no pongas Root Directory en `frontend` si quieres usar el `vercel.json` de la raíz). Vercel leerá:
   - **Install Command:** `cd frontend && npm install`
   - **Build Command:** `cd frontend && npm run build`
   - **Output Directory:** `frontend/dist`  
   Si no se rellenan solos, ve a **Settings → General → Build & Development Settings** y cópialos ahí.
   - **Alternativa:** Root Directory = `frontend`, Framework **Vite**, Build `npm run build`, Output `dist` (entonces puedes borrar o ignorar overrides del `vercel.json`).

## 3. Variable de entorno en Vercel (obligatoria)

En el proyecto → **Settings → Environment Variables**:

| Nombre | Valor | Entornos |
|--------|--------|----------|
| `VITE_BACKEND_URL` | `https://web3-app-pdf.onrender.com` | Production (y Preview si quieres) |

Con **`https://`**, **sin** barra al final (`/`), sin espacios.

**Importante:** las variables `VITE_*` se “hornan” en el build. Tras cambiarlas, haz **Redeploy** (Deployments → … → Redeploy).

## 4. Deploy

Guarda, pulsa **Deploy**. Cuando termine, tendrás una URL tipo `https://web3-app-pdf.vercel.app`.

## 5. CORS en el backend

El backend ya usa `cors()` abierto; si en producción restringes orígenes, añade el dominio de Vercel (`https://tu-app.vercel.app`).

## Resumen

| Qué | Dónde |
|-----|--------|
| Frontend (esta app) | **Vercel** |
| Backend API | **Render** (u otro) |
| Variable en Vercel | `VITE_BACKEND_URL` = URL del backend |
