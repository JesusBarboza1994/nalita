# nalita3d — tienda online

E-commerce en Next.js 16 (App Router + Tailwind v4) para mostrar productos impresos en 3D.
Checkout con **pago contra entrega** que termina en **WhatsApp** para cerrar la venta.

```bash
pnpm install
cp .env.example .env.local   # pon tu número de WhatsApp
pnpm dev                  # http://localhost:3000
```

## Dónde editar cada cosa

| Qué | Archivo |
| --- | --- |
| Colores (variables CSS) | `src/app/globals.css` → bloque `:root` |
| Nombre, WhatsApp, moneda, textos | `src/config/site.ts` |
| Categorías (mock) | `src/lib/data/categories.ts` |
| Productos y variantes (mock) | `src/lib/data/products.ts` |
| Acceso a datos (cambiar a BD acá) | `src/lib/catalog.ts` |
| Mensaje de WhatsApp del pedido | `src/lib/whatsapp.ts` |
| Buscador | `src/lib/search.ts` |

## Modelo de producto

- `Product`: nombre, descripciones, `categorySlugs` (puede estar en varias), `price`, `compareAtPrice` (oferta),
  `images`, `options` (ej. Color, Tamaño), `variants`, `keywords`, `specs`, `featured`, `isNew`, `customizable`, `leadTimeDays`.
- `ProductVariant`: `sku`, `name`, `options`, y opcionalmente `price`, `compareAtPrice`, `images`, `available`, `keywords`.
  **Si la variante no tiene precio o imágenes, usa los del producto padre** (`resolveVariant` en `src/lib/product-utils.ts`).

## Packs (bundles)

Cualquier producto puede ser un pack agregando `bundle` (ver `ProductBundle` en `src/lib/types.ts`).
Los productos normales no cambian: si no tienen `bundle`, funcionan igual que siempre.

- `items`: productos del catálogo que se pueden elegir (referencia por slug, opcionalmente variante).
  Una unidad grande puede ocupar más de un lugar con `slots` (ej. el nacimiento ocupa 2).
- `includedItemPrice`: precio por lugar ya incluido en el pack; las unidades más caras suman la
  diferencia como recargo (precio − incluido × lugares que ocupa).
- `sizes`: formatos del pack. Cada uno define `slots` (cuántas unidades hay que elegir, se debe completar),
  `price` (precio del pack completo) y opcionalmente `base` (producto incluido, ej. la bandeja).
  Un pack sin base (ej. "3 llaveros") simplemente no define `base`.
- `allowRepeats`: si se puede repetir una unidad.
- `preset`: si existe, el pack viene prearmado (tamaño y contenido fijos); si no, el cliente lo arma.
- `customizeSlug`: desde un prearmado, enlaza al armador.

El ahorro se calcula solo: (precio de la base + precio de cada unidad) − precio del pack.
En el carrito y en el mensaje de WhatsApp el pack aparece con su contenido detallado.
Los productos sueltos que forman parte de un pack muestran "También disponible en packs".

Ejemplo real: `src/lib/data/products-christmas.ts`.
Las portadas de los packs se generan con `node scripts/compose-pack-images.mjs` (collage de las fotos individuales).

## Modelos 3D y colores

Los productos (y variantes) pueden tener `model3d`: el cliente ve la pieza en 3D, cambia colores por parte
y, en los packs, ve las piezas sobre la bandeja y las puede arrastrar.

1. Copia el `.3mf` (Bambu Studio) o `.glb` a `models-src/` (**no** a `public/`: lo de public se puede descargar).
2. Agrégalo a `models-src/models.json`:
   - `.3mf`: cada filamento/extrusor es una parte coloreable (`color_1`, `color_2`…).
   - `.glb`: agrupa nodos con `groups` (ej. `"cuerpo": ["body", "head"]`).
   - `rotateY` para que el frente mire hacia adelante; `fitMm` para generar otro tamaño (ej. bandejas).
3. `node scripts/build-3d-models.mjs` → genera `public/models/*.glb` livianos (≈0,5 MB) e imprime el bloque `model3d`.
4. Pega `model3d` en la data del producto y pon nombres (`label`), color por defecto y si es `editable`.

### Etiqueta con texto (bandeja personalizada)

Un modelo con `labelMount` (corte frontal en mm y tamaño de etiqueta) admite la opción `labelOption`
del producto o del pack: el cliente elige "Clásica / Con etiqueta", escribe hasta `maxLength` caracteres
y elige colores de etiqueta y texto. En 3D se ve la bandeja con el frente recortado (cara plana con
dos agujeros) y la etiqueta insertada con dos cilindros. El recargo es `labelOption.price`.

Los colores disponibles están en `src/config/filaments.ts`. Los colores elegidos viajan en el carrito y en el WhatsApp.
Las piezas sin modelo 3D se muestran en la escena como foto.

## Categorías de temporada

Una categoría con `season: { fromMonth, toMonth, label }` se ve todo el año, pero en esas fechas
se resalta en el navbar (va primera, con color `--highlight`), tiene banner en el home y en su página.
Se calcula con la zona horaria de `siteConfig.timeZone` y se revalida cada hora.

## Productos sin publicar

`published: false` oculta un producto de la tienda (útil para borradores sin precio).

## Búsqueda

Busca sin importar mayúsculas ni acentos en nombre, `keywords` del producto, nombre/`keywords`/SKU de variantes,
categorías y descripción, ordenando por relevancia. Todas las palabras ingresadas deben coincidir.

## Imágenes

Las imágenes actuales son placeholders SVG generados con `node scripts/generate-placeholders.mjs`.
Reemplázalas por fotos reales en `public/products/<producto>/` y actualiza las rutas en la data.

## Rutas

- `/` inicio · `/productos?q=&categoria=&orden=` catálogo con búsqueda y filtros
- `/categoria/[slug]` · `/producto/[slug]` · `/carrito` · `/checkout`

## Archivos de impresión: bandeja con etiqueta

`node scripts/build-label-print.mjs --text "Familia Pérez 2026" [--width 118]` (por ahora bandejas grande y mediana; la chica con `--size chica`)
genera en `print/` (carpeta ignorada por git):

- `bandeja-<tamaño>-etiqueta.3mf`: la bandeja con una zona plana **fija de 50 mm** en el centro del
  frente (sin acanalado, al ras de la punta más saliente de las acanaladuras) y dos agujeros Ø4.3 × 4 mm separados 30 mm, a media altura. No depende del
  texto: se imprime una vez por tamaño.
- `etiqueta-<tamaño>.3mf`: placa (por defecto la mitad del largo de la bandeja × 15.5 × 4 mm) con dos
  agujeros ciegos Ø4.1 × 2.4 mm atrás, texto en relieve de 0.6 mm (parte "texto", filamento 2; se guarda como texto editable de Bambu Studio) y dos
  cilindros Ø4 × 6 mm. Se imprime acostada, con los agujeros contra la cama.

Las medidas y tolerancias están como constantes al inicio del script. El texto se genera con Liberation Sans Bold
(`models-src/fonts`, licencia OFL, mismas medidas que Arial) y queda como Arial negrita al editarlo.
# nalita
