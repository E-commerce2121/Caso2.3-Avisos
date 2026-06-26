# Sistema de Casos — Bloque 2

Sistema web completo con backend Node.js + base de datos SQLite para los 3 casos del Bloque 2.

## Casos incluidos

| Caso | Descripción |
|------|-------------|
| **2.1** | Transferencia de dinero entre usuarios (con alias y billetera) |
| **2.2** | Acceso al gimnasio (validación de credencial por fecha de vencimiento) |
| **2.3** | Cola de avisos de stock (se envía al primero en la fila) |

## Estructura del proyecto

```
sistema-casos/
├── server.js              # Servidor Express (punto de entrada)
├── db/
│   └── database.js        # Capa de persistencia — sql.js (SQLite en memoria/archivo)
├── routes/
│   ├── transferencias.js  # API Caso 2.1
│   ├── gimnasio.js        # API Caso 2.2
│   └── avisos.js          # API Caso 2.3
└── public/
    ├── index.html         # Frontend (única página con 3 pestañas)
    ├── css/
    │   └── style.css      # Estilos
    └── js/
        └── app.js         # Lógica del frontend
```

## Cómo correr el proyecto

### Requisitos
- Node.js v16 o superior

### Instalación

```bash
cd sistema-casos
npm install
npm start
```

Luego abrí el navegador en: **http://localhost:3000**

## API REST

### Caso 2.1 — Transferencias

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/transferencias/usuarios` | Lista de usuarios |
| POST | `/api/transferencias/transferir` | Realizar transferencia |
| GET | `/api/transferencias/historial` | Historial |

**Body para transferir:**
```json
{ "alias_origen": "ana123", "alias_destino": "carlos99", "monto": 500 }
```

### Caso 2.2 — Gimnasio

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/gimnasio/credenciales` | Lista de credenciales |
| POST | `/api/gimnasio/validar` | Validar acceso |
| GET | `/api/gimnasio/historial` | Historial de accesos |

**Body para validar:**
```json
{ "credencial": "CRED-001" }
```

### Caso 2.3 — Avisos de Stock

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/avisos/cola` | Cola actual |
| POST | `/api/avisos/agregar` | Agregar/actualizar posición |
| POST | `/api/avisos/procesar` | Enviar aviso al primero |
| GET | `/api/avisos/log` | Log de enviados |
| DELETE | `/api/avisos/limpiar` | Limpiar cola |

**Body para agregar:**
```json
{ "correo": "cliente@email.com", "posicion_actual": 3 }
```

## Usuarios de prueba (precargados)

| Nombre | Alias | Saldo | Credencial | Vencimiento |
|--------|-------|-------|------------|-------------|
| Ana García | ana123 | $5.000 | CRED-001 | 31/12/2027 ✅ |
| Carlos Ruiz | carlos99 | $3.000 | CRED-002 | 01/01/2024 ❌ |
| Marta López | marta_lp | $8.000 | CRED-003 | 30/06/2027 ✅ |
| Juan Pérez | juanp | $1.500 | CRED-004 | 15/09/2027 ✅ |

## Base de datos

Se usa **sql.js** (SQLite compilado en WebAssembly), sin necesidad de instalar nada extra.
El archivo `sistema.db` se crea automáticamente en la carpeta `db/`.

### Tablas

- `usuarios` — datos de usuarios con alias, saldo, credencial y vencimiento
- `transferencias` — historial de todas las transferencias con su estado
- `accesos_gimnasio` — historial de accesos al gimnasio
- `cola_avisos` — cola de avisos pendientes de stock
- `log_avisos` — log de avisos enviados
