# RestaurantStatusBadge - Componente de Estado Operativo

## Overview

Componente reutilizable para mostrar el estado operativo de restaurantes con soporte para múltiples horarios, zonas horarias y UX optimizada para mobile-first.

## Características

- ✅ **4 estados**: Abierto, Cerrado, Cierra pronto, Abre pronto
- ✅ **Múltiples rangos horarios** por día (ej: 11-3 / 6-9)
- ✅ **Horarios especiales** para fechas específicas
- ✅ **Soporte timezone** para cálculos precisos
- ✅ **SSR-friendly** con client hydration ligero
- ✅ **Accesible** con ARIA roles y focus management
- ✅ **Mobile-first** con bottom sheet y modal desktop
- ✅ **Actualización en tiempo real** cada minuto
- ✅ **Performance optimizado** para Hero con imágenes prioritarias

## Estructura de Archivos

```
src/
├── lib/
│   ├── types.ts                    # Tipos de datos
│   ├── restaurantStatus.ts         # Lógica de cálculo
│   └── exampleData.ts              # Datos de ejemplo
├── components/ui/
│   ├── RestaurantStatusBadge.astro # Componente principal
│   └── RestaurantStatusBadgeClient.ts # Client hydration
└── layouts/
    └── Hero.astro                  # Integración en Hero
```

## Uso Básico

```astro
---
import RestaurantStatusBadge from "@components/ui/RestaurantStatusBadge.astro";
import { exampleRestaurantSchedule, exampleThresholds } from "@lib/exampleData";
---

<RestaurantStatusBadge 
    schedule={exampleRestaurantSchedule}
    thresholds={exampleThresholds}
    address="Calle Ejemplo #123, Ciudad de México"
/>
```

## Props

### RestaurantSchedule

```typescript
interface RestaurantSchedule {
    weekly: DaySchedule[];           // Horario semanal
    specialDates?: SpecialDate[];    // Fechas especiales
    timezone: string;               // Zona horaria (ej: 'America/Mexico_City')
}

interface DaySchedule {
    day: number;                    // 0-6 (Domingo-Sábado)
    ranges: TimeRange[];            // Rangos de horario
    special?: string;               // Notas especiales
}

interface TimeRange {
    open: string;                   // HH:mm
    close: string;                  // HH:mm
}
```

### StatusThresholds

```typescript
interface StatusThresholds {
    closingSoon: number;            // Minutos antes del cierre
    openingSoon: number;            // Minutos antes de apertura
}
```

## Estados y UX

### Estados Visuales

- **🟢 Abierto**: Verde, check icon
- **🔴 Cerrado**: Rojo, X icon  
- **🟠 Cierra pronto**: Naranja, reloj icon
- **🔵 Abre pronto**: Azul, reloj icon

### Interacción

1. **Tap/Click** → Abre modal/bottom sheet
2. **Escape** → Cierra modal
3. **Backdrop click** → Cierra modal
4. **Auto-update** → Cada minuto en cliente

### Mobile UX

- Bottom sheet con swipe gesture ready
- Touch-friendly buttons (44px min)
- Optimizado para one-handed use
- Status visible above-the-fold

## Integración en Hero

El componente está integrado en `Hero.astro` con props opcionales:

```astro
<Hero 
    {...otherProps}
    restaurantSchedule={schedule}
    restaurantAddress={address}
    statusThresholds={thresholds}
/>
```

## Performance Considerations

### SSR Optimizations

- Cálculo de estado en server-side
- Fallback status si falla el cálculo
- Data attributes para client hydration
- Minimal JavaScript para interactividad

### Client Hydration

- Updates cada minuto (no cada segundo)
- Event delegation para múltiples badges
- Cleanup automático en page unload
- Memory efficient con Map structures

### Hero Performance

- Badge renderizado antes de imagen prioritaria
- No bloquea LCP (Largest Contentful Paint)
- CSS animations optimizadas
- Lazy loading del modal content

## Accesibilidad

- **ARIA roles**: `dialog`, `aria-expanded`, `aria-controls`
- **Focus management**: Trap focus en modal
- **Keyboard navigation**: Escape para cerrar
- **Screen reader**: Labels descriptivos
- **Color contrast**: Cumple WCAG AA

## Personalización

### Colores

Los colores se definen via CSS classes:

```css
.text-green-600.bg-green-50.border-green-200  /* Abierto */
.text-red-600.bg-red-50.border-red-200        /* Cerrado */
.text-orange-600.bg-orange-50.border-orange-200 /* Cierra pronto */
.text-blue-600.bg-blue-50.border-blue-200    /* Abre pronto */
```

### Animaciones

```css
@keyframes fadeIn { /* ... */ }
@keyframes slideUp { /* ... */ }
@keyframes scaleIn { /* ... */ }
```

## Testing

### Datos de Ejemplo

```typescript
import { exampleRestaurantSchedule, exampleThresholds } from "@lib/exampleData";
```

### Casos de Test

1. **Horario normal**: 11-3 / 6-9
2. **Día cerrado**: Sin rangos
3. **Fecha especial**: Navidad cerrado
4. **Timezone**: Different zones
5. **Thresholds**: Custom minutes

## Troubleshooting

### Status no actualiza

- Verificar timezone correcto
- Checar formato HH:mm
- Validar client hydration

### Modal no abre

- Verificar IDs únicos
- Checar data attributes
- Validar JavaScript loaded

### Performance issues

- Reducir update frequency
- Optimizar schedule size
- Check memory leaks

## Future Enhancements

- [ ] Geolocation para timezone automático
- [ ] Integration con Google Calendar
- [ ] Real-time updates via WebSocket
- [ ] Analytics de interacción
- [ ] A/B testing de copy
- [ ] Voice announcements
