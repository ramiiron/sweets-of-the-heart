# Sweets of the Heart — Precios y cotizaciones

PWA interna (instalable, funciona sin internet) para manejar los precios de la
pastelería: costos por receta, precio entero y por porción, y cotizador de
catering con descuentos por volumen.

## Estructura

- `index.html` — la app completa (una sola página, sin dependencias)
- `manifest.webmanifest` — configuración de instalación como PWA
- `sw.js` — service worker para uso offline
- `icons/` — iconos 192 y 512 px

## Datos

Los datos se guardan en el `localStorage` del dispositivo (`soth-data-v1`).

- **Precios de venta**: reales, del flyer (pie de limón $23, raspberry $23,
  maracuyá $25, tartaleta $20, tres leches $30, brazo de reina $20).
- **Insumos y recetas**: valores de **ejemplo** — reemplazar con las compras
  reales en la pestaña Insumos. El botón "Restablecer ejemplos" vuelve a los
  valores iniciales.

## Pestañas

1. **Productos** — precio entero, porciones, empaque y factor por producto;
   muestra costo de receta, costo total, precio sugerido (costo × factor),
   precio por porción y un indicador de margen.
2. **Recetas** — ingredientes y cantidades por producto, con costo calculado.
3. **Insumos** — lista de ingredientes con precio de compra y costo unitario;
   editable y ampliable.
4. **Cotizar** — cotizador de catering: personas, porciones por persona,
   descuento automático (30–49: 5%, 50–99: 10%, 100+: 15%), delivery y botón
   para copiar la cotización lista para WhatsApp.

## Probar local

```bash
cd sweets-of-the-heart && python3 -m http.server 8000
# abrir http://localhost:8000
```

(El service worker requiere http://localhost o HTTPS; abrir el archivo
directo con `file://` funciona para la app, pero sin offline.)
