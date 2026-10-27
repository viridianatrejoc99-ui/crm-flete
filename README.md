# Flete CRM · prototipo México

Aplicación interna de demostración con Next.js App Router, TypeScript estricto y Tailwind CSS. Identidad visual provisional: el texto y el icono de transporte no son un logotipo oficial.

## Desarrollo

Requisitos: Node.js 24 LTS y npm 11. En la nube se utiliza el checkout existente en `/workspace/crm-flete`; no es necesario crear un worktree.

```sh
cd /workspace/crm-flete
npm ci
npm run dev
```

El servidor utiliza el puerto 3000. `.npmrc` configura una caché escribible en `/workspace/.cache/npm` para esta máquina; fuera de ella se puede usar `npm --cache /ruta/escribible ci`.

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
```

Playwright usa Chromium del sistema si existe `/usr/bin/chromium`. Se puede indicar otra ubicación con `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`. Si no hay un navegador instalado, ejecutar `npx playwright install chromium` con acceso a los dominios oficiales de distribución. No se requieren claves ni variables para ejecutar la aplicación.

Para ejecutar la compilación de producción, usar `npm run build` y después `npm start`.

## Vistas

- `/mis-leads`: cartera propia de asesores; administración y directivos consultan todos los leads de México.
- `/buscador`: todos los leads, con búsqueda por nombre, empresa y teléfono; filtros combinables y exportación Excel.
- `/leads/[id]`: información del prospecto, etapa, seguimientos, resultados de contacto, comentarios y actividad.
- `/dashboard`: indicadores, canales, hitos de conversión, resultados por asesor y señales básicas de retención.
- `/administracion`: activación de asesores, reasignación, reglas, alerta y simulador de asignación.

## Datos y permisos de demostración

Se incluyen 25 prospectos ficticios, cinco asesores, un administrador y los directivos Marco y Bruno. Los nombres de personas y empresas son ejemplos; los emails usan `example.com` y los teléfonos son deliberadamente no operables. WhatsApp y llamada muestran una respuesta simulada, sin abrir servicios externos.

El perfil inicial es Alberto. El control **Cambiar perfil** permite probar los roles:

| Rol           | Lectura | Comentarios | Etapa, contacto y seguimiento | Datos del prospecto y asignación | Administración |
| ------------- | ------- | ----------- | ----------------------------- | -------------------------------- | -------------- |
| Administrador | Todos   | Todos       | Todos                         | Todos                            | Sí             |
| Asesor        | Todos   | Todos       | Solo sus leads                | No                               | No             |
| Directivo     | Todos   | No          | No                            | No                               | No             |

Todos pueden exportar los datos que consultan. Los controles y las funciones de mutación comprueban permisos de demostración, pero no son una barrera de seguridad. No hay autenticación, servidor de datos ni integración con Supabase, HubSpot o BLiP. Nunca ingresar datos reales, contraseñas o credenciales.

Los cambios se guardan en `localStorage` bajo `flete-crm-demo-v1`, validando su estructura al cargarlos. No se sincronizan entre dispositivos ni usuarios. **Restaurar datos** solicita confirmación, regenera los ejemplos y vuelve al perfil Alberto. Si el navegador bloquea el almacenamiento o agota la cuota, se muestra una advertencia y la sesión sigue funcionando en memoria.

## Reglas comerciales

- Nuevo → Contactado → Interesado → Suscrito **o** Publicó cargas → Ganado. Perdido requiere motivo. Las rutas Suscrito y Publicó cargas son alternativas, no etapas consecutivas obligatorias.
- Suscrito: pagó sin publicar. Publicó cargas: publicó sin pagar. Ganado: pagó y publicó. Seleccionar estas etapas actualiza los hechos ficticios de pago y publicación.
- El primer paso a una etapa con pago registra un cobro ficticio de $300 y una fecha de pago. Cambiar después de etapa no duplica ese cobro ni elimina el historial de lo cobrado. No se simula un sistema de facturación o reembolsos.
- No contestó y otros resultados de contacto se registran aparte y no cambian la etapa. El tiempo a primer contacto se mide hasta el primer intento registrado, aunque no haya respuesta.
- Valor estimado: $300 por ID único en Interesado, Suscrito, Publicó cargas o Ganado; excluye Perdido. Incluye Ganado conforme al criterio de “desde Interesado en adelante”. Se muestra separado del cobro ficticio.
- Guadalajara → Gabriel. Monterrey → Tania. Resto de México → Alberto, Yoss y Rodrigo, en ese orden, omitiendo inactivos. Si un asesor fijo está inactivo, se requiere asignación manual; no se inventa una sustitución.
- Reingresos antes de 90 días desde la fecha de entrada conservan responsable. Los clientes activos siempre lo conservan. Hay ejemplos antiguos para probar el límite de 90 días. El simulador no crea ni reasigna leads; su cursor solo avanza en la sesión de simulación.
- Desactivar un asesor no reasigna sus leads existentes. Un administrador puede reasignarlos manualmente con confirmación.
- La alerta visual comienza tras 30 minutos laborales sin primer intento de contacto. Es configurable entre 1 y 480 minutos. Horario provisional y visible: lunes a viernes, 09:00–18:00 en Ciudad de México, sin calendario de festivos. No hay notificaciones reales.

## Dashboard y Excel

Todos los indicadores y exportaciones respetan la cohorte seleccionada por **fecha de entrada** del lead y su **responsable actual**. Las fechas se interpretan en Ciudad de México. No se presentan como movimientos contables ocurridos dentro de un periodo de pago.

- Leads nuevos: entradas en la cohorte; se informa aparte cuántos siguen en etapa Nuevo.
- Suscripciones nuevas: prospectos de la cohorte con primer pago registrado; incluye Ganado y conserva el registro histórico.
- Conversión: personas únicas que alcanzaron cada hito, incluso si retrocedieron o se perdieron. “Pagó o publicó” une las dos rutas sin duplicarlas.
- Tiempo a primer contacto: promedio de minutos naturales desde entrada al primer intento. No se confunde con el reloj laboral de alertas.
- Retención básica: suscriptores activos entre quienes tienen pago, y renovaciones registradas entre suscripciones cuyo vencimiento ya llegó. Son señales ficticias; no es un análisis mensual de retención por cohortes.
- Excel genera archivos `.xlsx` en el navegador, con fechas etiquetadas en CDMX. El reporte incluye resumen, resultados por asesor, canales, hitos y los leads filtrados. La administración exporta usuarios, reglas y su conjunto filtrado de leads. Los textos se escriben como celdas de texto, no como fórmulas.

## Organización

`src/app` contiene las rutas; `components/ui` y `components/layout`, los controles y la navegación; `features`, las vistas y mutaciones; `lib`, permisos, cálculos y exportaciones; `data`, el contrato de persistencia y los ejemplos; `types`, el dominio compartido. Los componentes acceden a datos a través del proveedor, sin importar directamente el listado ficticio.

ExcelJS utiliza únicamente `uuid.v4`; se fija su dependencia transitiva a `uuid@11.1.1` mediante `overrides` para evitar la versión vulnerable original. Las pruebas verifican la lectura real de los Excel descargados tras este ajuste.

Antes de usar información real se necesitarán autenticación, autorización en servidor, políticas RLS, almacenamiento seguro, auditoría persistente y la identidad de marca aprobada. Ninguno de esos servicios forma parte de este prototipo.
