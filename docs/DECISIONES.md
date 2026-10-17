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
