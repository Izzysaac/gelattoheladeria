# Análisis de Performance: Proyecto Astro

## Métricas de Build

**⚡ Tiempos de build**

- **Build total**: 3.53s (4 páginas)
- **Generación estática**: 2.23s
- **Optimización Vite**: 1.13s + 10ms
- **Procesamiento de imágenes**: 2ms

**📦 Peso final del bundle**

- **Total dist**: ~400KB
- **Página más pesada**: pedido (152KB)
- **CSS por página**: 13-41KB
- **JS total**: ~30KB distribuido

## Peso JS por Página

**📊 Distribución JavaScript**

- **index.html**: ~5KB (timeago + scripts de reviews)
- **menu/**: ~8KB (viewimg.js + scripts de menú)
- **pedido/**: ~16KB (pedido.js + 7 scripts modularizados)
- **reserva/**: ~2KB (mínimo JS)

**🔍 Scripts identificados**

- `pedido.js`: 13KB (lógica de carrito)
- `timeago.js`: 616B (utilidad de tiempo)
- `viewimg.js`: 801B (visor de imágenes)
- `scripts/`: 7 archivos modularizados (state, events, actions, etc.)

## Uso de Islands


**🎯 Componentes con JS**

- `Reviews.astro`: timeago + clamp de texto
- `MenuPage.astro`: viewimg.js inline
- `PedidoPage.astro`: scripts de carrito modularizados
- `CategoryNav.astro`: navegación por categorías

## Posibles Cuellos de Botella

**🔴 Críticos**

1. **Google Sheets API**
   - Latencia externa en cada build
   - Sin caché persistente entre builds
   - Punto único de fallo

2. **CSS por página**
   - Sin CSS crítico inline
   - No hay purging de unused CSS

**🟡 Medios** 3. **Imágenes Cloudinary**

- URLs hardcodeadas sin optimización dinámica
- Sin lazy loading sistemático
- Sin formatos modernos (AVIF/WebP)

4. **Scripts globales**
   - `pedido.js` cargado en páginas que no lo usan
   - Sin code splitting por ruta
   - Módulos sin tree-shaking optimizado

## Optimizaciones Concretas

### **HIGH IMPACT (Reducción 30-50%)**

1. **Implementar CSS crítico**

   ```astro
   <style is:global>
     /* Critical CSS inline */
   </style>
   <link rel="preload" href={styles} as="style" onload="this.onload=null;this.rel='stylesheet'">
   ```
