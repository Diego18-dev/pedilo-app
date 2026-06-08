# Pedilo — Guía del Proyecto

## Qué es Pedilo

Pedilo es una aplicación móvil (iOS/Android) de delivery y servicios de transporte diseñada para la ciudad de **Sucre, Bolivia**. Su propósito es digitalizar el flujo de delivery informal que ya existe en la ciudad: personas que llaman por WhatsApp a repartidores locales para que vayan a restaurantes, tiendas, farmacias o supermercados a buscar lo que necesitan.

El modelo **no involucra a los restaurantes ni tiendas**: es una conexión directa entre el usuario final y el repartidor independiente. El pago siempre es **a contraentrega (cash on delivery)**. No hay pagos digitales en esta fase.

A largo plazo, Pedilo expandirá sus servicios a carreras en moto, taxis y taxis compartidos.

## Mercado y modelo de negocio

- **Ciudad inicial:** Sucre, Bolivia
- **Usuarios:** Población general de Sucre
- **Repartidores:** Delivery riders independientes que ya operan informalmente
- **Monetización:** Los repartidores recargan saldo en su cuenta dentro de la app. Por cada pedido completado se descuenta una comisión de ese saldo. Los clientes no pagan dentro de la app.

## Stack tecnológico

| Capa | Tecnología |
|------|------------|
| Mobile | React Native 0.81.5 + Expo SDK 54 |
| Routing | Expo Router v6 (file-based) |
| Lenguaje | TypeScript (strict mode) |
| Backend | Supabase (PostgreSQL 17) |
| Geoespacial | PostGIS + índice GIST |
| Autenticación | Supabase Auth |
| Tiempo real | Supabase Realtime (WebSockets) |
| Almacenamiento | Supabase Storage |
| GPS | expo-location |
| Mapas | react-native-maps |

## Arquitectura del proyecto

```
src/
├── app/                    # Pantallas (Expo Router, file-based)
│   ├── _layout.tsx         # Layout raíz: AuthProvider + guard de sesión
│   ├── (auth)/             # Pantallas sin sesión
│   │   ├── _layout.tsx
│   │   └── login.tsx
│   ├── (tabs)/             # Pantallas principales con tab bar
│   │   ├── _layout.tsx
│   │   ├── index.tsx       # Enruta a ClientDashboard o DriverDashboard según rol
│   │   └── profile.tsx
│   └── modal.tsx           # Placeholder de opciones
├── components/             # Componentes de pantalla completa
│   ├── ClientDashboard.tsx # Mapa + formulario de pedido para clientes
│   └── DriverDashboard.tsx # Mapa + lista de pedidos para repartidores
├── hooks/                  # Custom hooks
│   ├── useOrders.ts        # CRUD de pedidos + suscripción en tiempo real
│   ├── useLocation.ts      # GPS one-shot para centrar el mapa
│   └── useDriverLocation.ts# GPS continuo del repartidor hacia Supabase
├── store/                  # Estado global
│   └── AuthContext.tsx     # Sesión, usuario y perfil (exporta useAuth)
├── services/               # Clientes de servicios externos
│   └── supabase.ts         # Cliente Supabase (singleton)
└── types/                  # Tipos TypeScript globales
    └── index.ts            # Order, OrderStatus
```

### Flujo de datos principal

1. El cliente abre la app → `AuthContext` restaura sesión desde `AsyncStorage`.
2. El guard en `_layout.tsx` redirige a `(auth)/login` o `(tabs)` según sesión activa.
3. `(tabs)/index.tsx` renderiza `ClientDashboard` o `DriverDashboard` según `profile.role`.
4. El cliente crea un pedido → `useOrders.createOrder` llama al RPC `buscar_repartidores_cercanos` → si hay cobertura, inserta en `orders`.
5. El repartidor ve el pedido vía `useOrders` (Realtime WebSocket) → acepta → `status = 'accepted'`.
6. El cliente ve la ubicación del repartidor en tiempo real via suscripción al canal de tracking.

## Base de datos

### Tabla: `profiles`
Extiende `auth.users` de Supabase. Se crea automáticamente al registrarse vía trigger.

| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | UUID PK | Espeja `auth.users.id` |
| `full_name` | TEXT | |
| `phone` | TEXT | |
| `role` | ENUM | `client` · `driver` · `admin` |
| `avatar_url` | TEXT | URL pública en bucket `avatars` |
| `current_location` | geography(Point, 4326) | Posición GPS actual (PostGIS) |
| `last_location_update` | TIMESTAMPTZ | Última actualización de GPS |
| `created_at` | TIMESTAMPTZ | |

### Tabla: `orders`

| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | UUID PK | |
| `client_id` | UUID → profiles | |
| `driver_id` | UUID → profiles | Nullable hasta que un driver acepte |
| `description` | TEXT | Descripción del pedido |
| `origin_address` | TEXT | Dirección de recojo (texto) |
| `destination_address` | TEXT | Dirección de entrega (texto) |
| `pickup_location` | TEXT | Coordenadas WKT del recojo (`POINT(lng lat)`) |
| `status` | ENUM | `pending` · `accepted` · `in_progress` · `completed` · `cancelled` |
| `price` | DECIMAL(10,2) | Se define al momento de la entrega (contra-pago) |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

### Funciones RPC (PostGIS)

| Función | Parámetros | Descripción |
|---------|-----------|-------------|
| `update_driver_location` | `new_lat`, `new_lng` | Actualiza `current_location` del driver autenticado |
| `buscar_repartidores_cercanos` | `pickup_lat`, `pickup_lng`, `radio_metros` | Retorna drivers ordenados por proximidad |
| `get_nearby_pending_orders` | `radio_metros` | Retorna pedidos `pending` cercanos al driver autenticado |

### Seguridad (RLS)

- Cada usuario solo puede ver y editar su propio perfil.
- Los clientes solo ven sus propios pedidos.
- Los repartidores ven pedidos `pending` + pedidos donde son `driver_id`.
- Solo clientes autenticados pueden crear pedidos con `client_id = auth.uid()`.
- Los repartidores pueden actualizar pedidos `pending` (aceptarlos) o los que ya son suyos.

### Storage

- Bucket `avatars` (público). Ruta: `{user_id}/{timestamp}_avatar.jpg`.

## Convenciones de código

### Formato
- Indentación: **2 espacios**
- Comillas: **simples** en JS/TS
- Punto y coma: **obligatorio**
- Nueva línea al final de cada archivo

### Nomenclatura

| Elemento | Convención | Ejemplo |
|----------|-----------|---------|
| Componentes React | PascalCase | `ClientDashboard` |
| Hooks | camelCase con prefijo `use` | `useOrders` |
| Tipos / Interfaces | PascalCase, sin prefijo `I` | `Order`, `Profile` |
| Funciones | camelCase | `handleCreate`, `fetchOrders` |
| Constantes globales | SCREAMING_SNAKE_CASE | `MAX_RADIO_METROS` |
| Archivos de componente | PascalCase | `ClientDashboard.tsx` |
| Archivos de hook / servicio | camelCase | `useOrders.ts` |
| RPCs de Supabase | snake_case | `update_driver_location` |
| Tablas de base de datos | snake_case plural | `orders`, `profiles` |

### Imports
- **No importar `React`** por defecto (React 17+ JSX transform lo maneja).
- Sí importar hooks y utilidades: `import { useState, useEffect } from 'react'`.
- Usar **path aliases** (`@/`) para imports internos, nunca rutas relativas.

### Comentarios
- Idioma: **español**.
- Solo cuando el "por qué" no es obvio. Nunca documentar el "qué".
- Sin comentarios de seguimiento de cambios (para eso existe git).

### Componentes y estilos
- Solo componentes funcionales. Sin class components.
- Estilos con `StyleSheet.create()` al final del archivo.
- Estilos inline en JSX solo para overrides dinámicos de un único valor.

### Manejo de errores
- `console.error()` para errores reales.
- `console.warn()` para advertencias recuperables.
- Sin `console.log()` en código de producción.
- Errores al usuario mediante `Alert.alert()`.

## Flujo de trabajo con Git

```
main          → código funcional, listo para producción
dev           → integración de features en desarrollo
feature/xxx   → nueva funcionalidad (rama desde dev)
fix/xxx       → corrección de bug (rama desde dev o main)
```

- `main` siempre debe estar en estado funcional.
- Todo desarrollo va en rama `feature/` o `fix/`.
- Merge a `dev` vía Pull Request.
- Merge `dev → main` solo cuando el bloque de features está probado.
- Commits en español, en imperativo: `Agregar pantalla de historial`, `Corregir tracking de GPS`.

## Problemas conocidos

| Archivo | Descripción |
|---------|-------------|
| `ClientDashboard.tsx` | Ciudad hardcodeada como "Santa Cruz de la Sierra". Pendiente parametrizar a "Sucre". |
| `useOrders.ts` y componentes | El tipo de `orders` es `any[]`. Debe migrarse a `Order[]`. |
| `supabase/migrations/` | Las migraciones pueden no reflejar el estado exacto de la BD. La fuente de verdad es el dashboard de Supabase. |

## Decisiones de arquitectura

- **Pago a contraentrega:** Sin integración de pagos en esta fase. El sistema de comisiones al driver se implementará después.
- **Sin intermediarios con restaurantes:** El trato es repartidor-usuario, no plataforma-restaurante.
- **PostGIS nativo:** Se eligió PostGIS (dentro de Supabase) para matching geoespacial en lugar de APIs externas (Google Maps Distance Matrix), para evitar costos adicionales en la etapa inicial.
- **Expo Router:** Se eligió sobre React Navigation directo para alinearse con el patrón de Next.js y facilitar la incorporación de futuros desarrolladores.

## Roadmap

El proyecto está en fase MVP. Próximas funcionalidades (sin orden de prioridad definido):

- Sistema de saldo/wallet para drivers (tabla de transacciones, comisiones)
- Push notifications (Expo Notifications + FCM/APNs)
- Historial de pedidos para clientes
- Sistema de calificaciones (cliente ↔ driver)
- Fase 2: carreras en moto y taxi
- Infraestructura de producción: Supabase hosted (Pro), EAS Build para App Store / Play Store

## Reglas para asistentes de IA

1. **Preguntar antes de asumir.** Si algo del negocio o la arquitectura no está claro, preguntar antes de implementar.
2. **Seguir referencias del mercado.** Para nuevas funcionalidades, tomar como referencia cómo lo resuelven apps similares (Rappi, inDriver, Uber Eats) y proponer un enfoque alineado con esos estándares.
3. **No agregar dependencias** sin mencionar y justificar primero.
4. **No cambiar la estructura de carpetas** sin acordarlo antes.
5. **No modificar migraciones existentes.** Siempre crear una nueva migración.
6. **Sugerir refactors** cuando se detecten oportunidades, pero no implementarlos sin aprobación explícita.
7. **El pago es a contraentrega.** No proponer flujos de pago digital hasta que el desarrollador lo indique.
8. **Idioma del código:** comentarios y mensajes al usuario en español.
