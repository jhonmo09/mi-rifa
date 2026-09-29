# Mi Rifa · Talonario digital

Dos caras en una sola app:

- **Panel privado** (`/panel`) para quien organiza: crea la rifa, publica el link, ve quién apartó
  cada número y marca los pagos.
- **Talonario público** (`/r/[slug]`) para quien participa: entra desde el celular, toca el número
  que quiere y lo aparta con su nombre y su WhatsApp. **Sin cuenta, sin contraseña.**

Stack: Next.js 15 (App Router) · React 19 · Tailwind CSS 4 · Supabase (Postgres + Auth).

---

## Puesta en marcha

### 1. Crear el proyecto en Supabase

Entra a [supabase.com](https://supabase.com), crea un proyecto nuevo y anota de
**Project Settings → API**:

- `Project URL`
- `anon public key`

### 2. Cargar el esquema

En **SQL Editor**, pega y ejecuta completo el archivo [`supabase/schema.sql`](supabase/schema.sql).
Crea las tablas, las políticas de RLS, la vista pública y la función `reserve_numbers`.

### 3. Configurar el login por correo

En **Authentication → URL Configuration**:

- **Site URL**: `http://localhost:3000` (en producción, tu dominio)
- **Redirect URLs**: agrega `http://localhost:3000/auth/callback` y el equivalente de producción

El proyecto usa enlace mágico por correo, así que no hay contraseñas que guardar. En desarrollo el
correo de Supabase tiene un límite bajo de envíos; si lo pasas, configura tu propio SMTP en
**Authentication → Emails**.

### 4. Variables de entorno

```bash
cp -n .env.example .env.local
```

El `-n` es a propósito: **no pisa un `.env.local` que ya exista**. Si lo copias sin esa bandera
sobre un archivo ya configurado, vuelves a dejar los valores de ejemplo y la app falla con un
`fetch failed` que no dice nada útil.

Y llena:

```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

`NEXT_PUBLIC_SITE_URL` es la que se usa para armar el link que compartes y para el callback del
login. En producción tiene que ser tu dominio real.

Si te quedan los valores de ejemplo, la app te lo dice con todas sus letras en vez de fallar con un
error de red: la validación vive en [`src/lib/env.ts`](src/lib/env.ts).

### 5. Arrancar

```bash
npm install && npm run dev
```

---

## Cómo funciona

### El recorrido de un número

1. El organizador crea la rifa (queda en **borrador**, solo él ve el link).
2. Le da **Publicar** y comparte `https://tusitio.com/r/rifa-pro-viaje-a1b2`.
3. Alguien abre el link, toca los números libres que quiere y deja nombre + WhatsApp.
   El número queda **apartado** (amarillo).
4. Esa persona le escribe al organizador por WhatsApp con el comprobante del pago
   (el botón ya va con el mensaje escrito).
5. El organizador marca **Pagó** en su panel y el número pasa a **pagado** (verde).

El organizador también puede anotar boletas a mano, para quien le pagó en efectivo sin pasar por el
link, y liberar un número si alguien se arrepintió.

### Modelo de datos

| Tabla     | Para qué                                                                   |
| --------- | -------------------------------------------------------------------------- |
| `raffles` | Una rifa: premio, precio, fecha, cuántos números, datos de contacto, estado |
| `tickets` | Una boleta: número, nombre, WhatsApp, si está apartada o pagada             |

Los números van de `0` a `total_numbers - 1` y se muestran con ceros a la izquierda según el tamaño
del talonario (100 números → `00`–`99`, 1000 → `000`–`999`).

### Seguridad

Lo importante aquí es que **los datos personales de quien compra no quedan expuestos**, aunque la
página sea pública y sin login:

- `tickets` tiene RLS: solo el dueño de la rifa puede leer nombres y teléfonos.
- El público lee la vista `public_tickets`, que expone **únicamente** `number` y `status`. Nunca
  nombre ni WhatsApp.
- Reservar no es un `INSERT` directo: pasa por la función `reserve_numbers`, que valida que la rifa
  esté publicada, que los números existan y estén libres, que se respete el máximo por persona, y
  que el nombre y el teléfono tengan sentido. Nadie puede insertar una boleta ya marcada como
  pagada.
- Dos personas tocando el mismo número al mismo tiempo: la función bloquea la fila de la rifa
  (`select ... for update`) antes de insertar, así que solo una gana. A la otra le avisa cuál número
  se le adelantó y le limpia la selección.

---

## Desplegar en Vercel

1. Sube el repo y conéctalo en Vercel.
2. Carga las tres variables de entorno (con `NEXT_PUBLIC_SITE_URL` apuntando a tu dominio).
3. En Supabase, agrega `https://tudominio.com/auth/callback` a las **Redirect URLs** y pon el
   dominio como **Site URL**.

---

## Estructura

```
src/
  app/
    page.tsx                 Portada
    login/                   Entrada por enlace mágico
    auth/                    Callback, confirmación y cierre de sesión
    panel/                   Panel privado del organizador
      [id]/                  Detalle de una rifa (mapa, boletas, pagos)
    r/[slug]/                Talonario público
  actions/                   Server actions (rifas y boletas)
  components/                Grilla de números, formularios, botones
  lib/                       Clientes de Supabase, tipos y utilidades
supabase/schema.sql          Todo el esquema, RLS y la función de reserva
```
