# Desplegar el frontend en Vercel

Vercel solo sirve el **frontend** (React + Vite). El **backend** (Node/Express) debe estar en otro servicio (Render, Railway, Fly.io, etc.) con URL pública y CORS permitido.

## 1. Tener el backend en internet

Antes de Vercel, despliega el backend y anota la URL, por ejemplo:

`https://web3-pdf-registry-backend.onrender.com`

En las variables de entorno del backend pon las mismas que en local: `SEPOLIA_RPC_URL`, `PRIVATE_KEY`, `CONTRACT_ADDRESS`, `PINATA_JWT`.

## 2. Conectar GitHub con Vercel

1. Entra en [vercel.com](https://vercel.com) e inicia sesión.
2. **Add New… → Project**.
3. **Import** el repositorio `JesusPerez27/Web3_App_PDF` (u otro).
4. En **Configure Project**:
   - Si usas el `vercel.json` de la raíz del repo, Vercel puede detectar solo “Other”. Revisa que el **Build Command** sea:  
     `cd frontend && npm install && npm run build`  
     y **Output Directory**: `frontend/dist`  
     Si no aparece, configúralo a mano en **Settings → General → Build & Development Settings**.
   - **Alternativa más simple:** en **Root Directory** elige `frontend`, deja el preset **Vite**, Build `npm run build`, Output `dist`.

## 3. Variable de entorno en Vercel (obligatoria)

En el proyecto → **Settings → Environment Variables**:

| Nombre | Valor | Entornos |
|--------|--------|----------|
| `VITE_BACKEND_URL` | `https://tu-backend.onrender.com` | Production (y Preview si quieres) |

Sin `https://`, sin barra al final.

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
