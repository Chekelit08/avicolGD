# Decisiones

Cada decisión importante, con su motivo. La más reciente va abajo de su sección.

## Fase 0 (17/10/2026)

### Medio de pago: solo efectivo o digital

**Decisión:** `medio_pago` es un enum de dos valores, `efectivo` | `digital`. Se usa en ventas, egresos y pagos a empleados.
**Por qué:** lo pidió Ezequiel. En el mostrador se piensa así, y para el arqueo solo importa qué fue efectivo.
**Costo:** no se puede saber cuánto entró por transferencia, Mercado Pago, débito o crédito por separado, ni conciliar cada uno contra su resumen. Si hace falta más adelante, se agrega una columna opcional `detalle_digital` sin romper lo existente.

### El tipo de pago se elige siempre, y elegirlo guarda la venta

**Decisión:** no hay botón "Guardar venta" ni medio preseleccionado. Debajo del teclado hay dos botones, EFECTIVO y DIGITAL; tocar uno guarda la venta con ese tipo.
**Por qué:** un valor por defecto se termina guardando por inercia cuando el local está lleno. Así el tipo es obligatorio y la venta se carga igual en importe + 1 toque.
**Resguardos:** botones grandes, separados y de distinto color; con importe $ 0 están deshabilitados; un error se corrige con "Anular" dentro de los 10 minutos.

### Una cuenta compartida "Mostrador"

**Decisión:** quienes atienden usan una sola cuenta con rol `cajero`. Los admins tienen cuenta propia.
**Costo:** en la auditoría y en "registrada por" figura "Mostrador", no la persona. La regla del brief "un cajero anula su propia venta de menos de 10 minutos" queda como: la cuenta Mostrador anula ventas de Mostrador de menos de 10 minutos en la jornada abierta.
**Resguardo:** si alguien deja de trabajar, un admin cambia la contraseña de Mostrador.

### Nombre "Avícola GD" con el logo Gonza

**Decisión:** la app se llama "Avícola GD" (login, encabezado, título PWA, PDFs). El logo Gonza (mesa de trabajo 1 de `brand/logo.pdf`) se muestra como imagen. El ícono de la app es la silueta de la vaca sobre bordó, porque el wordmark no se lee a 48 px.

### Paleta derivada del logo

Medidos en el PDF: bordó `#511611` (vaca y cinta) y tinta `#261110` (texto "GONZA").

| Token   | Hex       | Uso                                                                 |
| ------- | --------- | ------------------------------------------------------------------- |
| Bordó   | `#511611` | marca, botón Efectivo, cinta del encabezado                         |
| Tinta   | `#261110` | texto, fondo del modo oscuro                                        |
| Azulejo | `#FAF9F9` | fondo claro (blanco, no crema)                                      |
| Pizarra | `#2E4A5A` | botón Digital, contraparte fría del bordó                           |
| Fósforo | `#7CF5C8` | dígitos del visor, solo ahí                                         |
| Alerta  | `#D9432B` | errores, "Sin internet", "Cerrar el día"; siempre con texto o ícono |

Para gráficos, los colores de botón son demasiado oscuros y apagados. Se usan tonos medios de los mismos matices, validados con el script de la skill `dataviz` (banda de luminosidad, croma, separación para daltonismo ΔE ≥ 19, contraste ≥ 3:1):

- Claro: Efectivo `#A3352A`, Digital `#2B7BB5`.
- Oscuro (sobre Tinta): Efectivo `#C9503F`, Digital `#3D8BC4`.

### Tipografías

- **Big Shoulders Display** (800): títulos y rótulos tipo cartel comercial, con mesura.
- **Atkinson Hyperlegible Next** (400/700): todo el texto y los montos. Está diseñada para leerse bien con poca visión, y eso ayuda con reflejos y apuro.
- **DSEG7 Classic** (OFL): solo el visor del importe. Imita el display de 7 segmentos de la balanza.
  Todas se sirven desde la app, sin Google Fonts, para que carguen offline y rápido.

### Elemento firma: el visor de balanza

El importe que se tipea aparece en un visor oscuro con dígitos verde fósforo y los segmentos apagados visibles (`8.888.888`), como la balanza del mostrador. Tiene 7 dígitos, así que el máximo por venta es $ 9.999.999. Las teclas imitan la membrana de la balanza.

### Sin centavos en la carga

**Decisión:** el teclado no tiene coma; tiene la tecla `000`. La base guarda `numeric(12,2)` igual.
**Por qué:** en el mostrador los precios se cobran en pesos enteros, y una coma suma toques y errores.

### Fondo de caja inicial

Opcional al abrir el día, $ 0 por defecto. Entra en el efectivo esperado.

### Sin fiado

Queda fuera por ahora (opcional futuro).

### Hosting: Cloudflare Pages

El plan gratuito no cobra por ancho de banda, deploya desde GitHub y el fallback de SPA se resuelve con un archivo `_redirects`. Netlify también serviría, pero su plan gratis limita el ancho de banda y los minutos de build.

### Registro cerrado

`enable_signup = false` en Supabase: las cuentas las crea un admin. Contraseña mínima de 10 caracteres.

### Herramientas

- ESLint 9 (no 10) porque `eslint-plugin-jsx-a11y` todavía no soporta 10.
- El template de Vite trae oxlint; lo reemplacé por ESLint + Prettier, como pide el brief.

## Fases 1 a 4 (17/10/2026)

### Las escrituras de la caja pasan por funciones SQL

`abrir_jornada`, `registrar_venta`, `anular_venta`, `cerrar_jornada` y `reabrir_jornada` son `security definer` y validan todas las reglas. Las tablas `jornadas` y `ventas` no tienen políticas de insert/update/delete: no se pueden tocar directo desde la app. Además hay triggers que bloquean modificar ventas de días cerrados, editar importes y borrar ventas, aunque lo intente alguien con acceso a la base.

### El cajero ve el resumen del día que acaba de cerrar

`resumen_jornada` deja al cajero resumir el día abierto o el de hoy (aunque ya no vea sus ventas por RLS). Los días anteriores son solo para admins.

### Las ventas se cargan solo en el día abierto de hoy

Si quedó abierto un día anterior, `registrar_venta` lo rechaza y la app pide cerrarlo. Así las ventas de hoy nunca se mezclan con las de ayer.

### Comparaciones justas en períodos en curso

El mes (o la semana) que todavía no terminó se compara contra los mismos días del período anterior (1 al 17 contra 1 al 17), no contra el mes completo.

### Personal se cuenta por fecha de pago en la ganancia

En "Ingresos vs egresos" el personal entra el mes en que se pagó (lo que salió de caja). En la pantalla Personal, por el mes al que corresponde (período).

### Gestión de usuarios con una Edge Function sin dependencias

Crear cuentas y cambiar contraseñas necesita la clave de servicio, así que lo hace la función `usuarios`, que primero verifica que quien llama sea admin activo. Usa `fetch` directo a las APIs de Auth y REST (sin `supabase-js`): arranca más rápido y no depende de bajar paquetes de npm. Desactivar un usuario lo marca inactivo (RLS lo bloquea) **y** lo banea en Auth para que no pueda ni iniciar sesión.

### Alta de cuentas con contraseña temporal

El admin crea la cuenta con una clave temporal fácil de dictar ("pollo-asado-4821"). En el primer ingreso la app obliga a cambiarla. No se usan invitaciones por email: el plan gratuito limita los emails y en el local es más simple dictar la clave.

### Rol desde app_metadata

El rol inicial viene de `app_metadata` (solo lo escribe el servidor), nunca de `user_metadata` (lo puede cambiar el usuario). Como Auth escribe `app_metadata` después del insert, un trigger lo sincroniza al perfil sin dejar ruido en la auditoría.

### Paleta de gráficos para ingresos, egresos y personal

Verde azulado `#13976A`, naranja `#D95926` y violeta `#6250D6` (oscuro: `#199E70`, `#E0652F`, `#9085E9`), validados con la skill dataviz. Distintos de Efectivo/Digital para que cada color signifique siempre lo mismo.

### Cada gráfico tiene su tabla

"Ver los datos" abajo de cada gráfico muestra los números, para leerlos sin depender del color ni del mouse.

### PWA: caché de la app, nunca de los datos

El service worker guarda HTML, JS, CSS y fuentes para que abra rápido con mala señal. Las llamadas a Supabase son `NetworkOnly`: si no hay internet, la venta falla y se avisa; nunca se "guarda" en el celular para mandar después (podría duplicarse o perderse sin que nadie se entere). Lo de exportar (PDF/Excel) no se precarga.

### Sin centavos en el visor, pero sí en la base y en los egresos

El teclado de la caja carga pesos enteros. Los egresos y pagos aceptan centavos ("12.500,50").

### Seguridad del sitio

`public/_headers` define una política de contenido que solo permite conectarse a `*.supabase.co`, y bloquea iframes y permisos del navegador que no se usan. El tema se aplica con `public/tema.js` (no un script inline) para no aflojar la política.

## Rediseño y base en la nube (17/10/2026)

### Estética limpia en lugar de "mostrador de avícola"

A Ezequiel no le gustó la estética del visor de balanza, el teclado de membrana y la cinta. Se reemplazó por un estilo de la familia de **Square POS, Mercado Pago (cobrar) y Stripe Dashboard**: fondo gris muy claro, tarjetas blancas con borde fino y sombra suave, **Inter** para todo, íconos `lucide-react` y barra lateral en escritorio. El bordó del logo queda como único color de marca (botón principal, Efectivo y ítem activo). Digital pasa a azul `#1F5FD1`. Los colores de gráficos validados con dataviz no cambian.

### La venta se carga con el teclado físico

Se eliminó el teclado numérico en pantalla. Un campo grande, siempre con el foco, acepta solo dígitos y los muestra con puntos de miles. **Enter = Efectivo**, **+ = Digital** (con una sola mano sobre el teclado numérico) y **Esc** borra. Elegir el tipo sigue siendo obligatorio y es lo que guarda. Mientras guarda, el campo queda en solo lectura (no deshabilitado) para no perder el foco ni duplicar ventas. El aviso de "Venta guardada" tiene **Deshacer**, que anula la venta con el motivo "Deshecha al cargar". El cierre del día usa el mismo campo: Enter para revisar y Enter para cerrar.

### Escritorio primero

La caja se usa en una compu o notebook con teclado. En celular sigue andando: menú arriba, teclado numérico del sistema y botones Efectivo/Digital grandes.

### Base creada en Supabase

Proyecto `avicola-gd` (ref `anadbauxypifiplihpje`, São Paulo, plan Free) en la organización "Eze Denett". Las migraciones se aplicaron con el conector de Supabase, con los mismos contenidos que `supabase/migrations/`. El linter de seguridad marcó funciones internas expuestas por la API: se les sacó el permiso (`20261017000006_permisos.sql`). Lo que queda marcado son las operaciones de la app, que validan rol y reglas por dentro.

### Auto-registro inofensivo

Si el registro público quedara prendido por error, la cuenta nace **inactiva**: solo se activa cuando el servidor le asigna un rol en `app_metadata`, cosa que el usuario no puede hacer (`20261017000007_registro_seguro.sql`, con test).

## Mejoras para que la caja trabaje sola (18/10/2026)

### Salidas de efectivo desde la caja

**Decisión:** con el día abierto se puede **sacar efectivo** (tecla **−** o el botón "Sacar efectivo"): importe + motivo (pago a proveedor, retiro del dueño, gasto del local, otro). Se restan del efectivo esperado (regla 7 actualizada, `efectivo_esperado()`).
**Por qué:** en un local de barrio se le paga al proveedor del pollo con la plata del cajón. Sin esto el arqueo daba "faltan" todos los días y la diferencia dejaba de significar algo.
**Detalles:** el pago a proveedor y el gasto del local también crean un **egreso** (categoría Mercadería u Otros) para que el dueño no lo cargue dos veces; ese egreso solo se anula desde la caja (`egresos.salida_caja_id`). El retiro del dueño no es un gasto: solo sale de la caja. Las salidas siguen las mismas reglas que las ventas: no se borran, se anulan con motivo (el cajero, las suyas de menos de 10 minutos) y quedan en la auditoría.
