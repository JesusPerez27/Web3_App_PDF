# Desplegar el backend en Render

Render ejecuta tu API Node desde la carpeta **`backend`**. El repositorio completo se clona, así que la verificación multi-contrato sigue leyendo **`frontend/deployments/`** sin cambios en el código.

## Opción A: Crear el servicio a mano (recomendado la primera vez)

1. Entra en [render.com](https://render.com), inicia sesión con GitHub.
2. **Dashboard → New + → Web Service**.
3. Conecta el repositorio **`Web3_App_PDF`** (o el que uses).
4. Configura así:

   | Campo | Valor |
   |--------|--------|
   | **Name** | `web3-pdf-registry-api` (o el nombre que quieras) |
   | **Region** | La más cercana (ej. Oregon) |
   | **Branch** | `main` |
   | **Root Directory** | `backend` |
   | **Runtime** | **Node** |
   | **Build Command** | `npm install` |
   | **Start Command** | `npm start` |
   | **Instance type** | **Free** (si aplica) |

5. En **Advanced → Health Check Path** pon: `/health`

6. En **Environment** (variables de entorno), añade **exactamente** las mismas que en tu `backend/.env` local:

   | Key | Valor (ejemplo / notas) |
   |-----|-------------------------|
   | `SEPOLIA_RPC_URL` | URL de Sepolia (Infura / Alchemy) |
   | `PRIVATE_KEY` | Clave privada **sin** `0x` |
   | `CONTRACT_ADDRESS` | Dirección del contrato `PdfRegistry` en Sepolia |
   | `PINATA_JWT` | JWT de Pinata |
   | `PORT` | **No hace falta** — Render asigna `PORT` automáticamente |

   Opcional (si usaste contratos viejos y no están en `frontend/deployments` del repo):

   | `CONTRACT_ADDRESSES_VERIFY` | `0x...,0x...` |

7. Pulsa **Create Web Service**. Espera el primer deploy (varios minutos en plan gratuito).

8. Cuando termine, copia la URL pública, por ejemplo:

   `https://web3-pdf-registry-api.onrender.com`

9. Prueba en el navegador:

   `https://TU-SERVICIO.onrender.com/health`

   Debe responder JSON con `status: "OK"`.

10. **Frontend (local o Vercel):** define  
    `VITE_BACKEND_URL=https://TU-SERVICIO.onrender.com`  
    (sin `/` al final).

---

## Opción B: Blueprint con `render.yaml`

1. **New + → Blueprint**.
2. Conecta el mismo repo y elige la rama `main`.
3. Render detectará `render.yaml` y creará el servicio web.
4. **Añade igualmente** las variables de entorno en el servicio (no van en el YAML por seguridad).

---

## Plan gratuito

- El servicio **se duerme** tras unos minutos sin tráfico; la **primera petición** puede tardar ~30–60 s en despertar.
- Para demos está bien; para producción conviene un plan de pago.

---

## CORS

El backend usa `cors()` abierto; el frontend en Vercel u otro dominio podrá llamar a la API sin cambios. Si más adelante restringes orígenes, añade el dominio del frontend.

---

## Si el deploy falla

- Revisa los **logs** en Render (pestaña **Logs**).
- Confirma que **Root Directory** sea `backend`.
- Confirma que todas las variables de entorno estén definidas (sin comillas raras en los valores).
