# Refactor Plan

## Objetivos

- Reducir deuda técnica sin breaking changes
- Mejorar mantenibilidad del código multi-tenant
- Optimizar performance de build (<1.5s objetivo)
- Estandarizar tipado y convenciones
- Facilitar onboarding de nuevos desarrolladores

## Alcance

### Qué entra

- Tipado TypeScript (strict mode)
- Estructura de state management
- Optimización de CSS y JS
- Mejoras de accesibilidad críticas
- Estandarización de componentes

### Qué NO entra

- Migración a frameworks (React, Vue, etc.)
- Cambios en arquitectura multi-tenant
- Reescritura de sistema de temas
- Migración de CMS (Google Sheets)
- Cambios en estructura de carpetas principal

## Principios

- **Zero downtime**: Cada refactor debe ser deployable individualmente
- **Backward compatibility**: No breaking changes en APIs públicas
- **Incremental**: Cada paso debe mejorar sin afectar funcionalidad existente
- **Testable**: Cada cambio debe ser validable con build + test manual
- **Multi-tenant safe**: No afectar configuración de tenants existentes

## Refactors Propuestos

### 1. TypeScript Strict Mode

**Descripción**: Activar tipado estricto progresivamente
**Problema que resuelve**: Errores de tipo no detectados, mejor autocompletado
**Impacto**: High
**Riesgo**: Medium
**Archivos afectados**:

- `tsconfig.json`
- `src/lib/types.ts`
- `src/lib/mappers.ts`
- `src/lib/loadTenant.ts`
  **Orden recomendado**: 1

### 2. State Management Centralizado

**Descripción**: Migrar estado global de archivos sueltos a store estructurado
**Problema que resuelve**: Estado disperso, difícil de debuggear, race conditions
**Impacto**: High
**Riesgo**: Medium
**Archivos afectados**:

- `public/scripts/state.js`
- `public/scripts/events.js`
- `public/scripts/actions.js`
- `src/components/Modal.astro`
- `src/components/template/PedidoPage.astro`
  **Orden recomendado**: 2

### 3. CSS Optimization

**Descripción**: Implementar purging y critical CSS
**Problema que resuelve**: Bundle CSS hasta 41KB, unused CSS
**Impacto**: Medium
**Riesgo**: Low
**Archivos afectados**:

- `astro.config.mjs`
- `src/layouts/BaseLayout.astro`
- `src/components/sections/Menu.astro`
  **Orden recomendado**: 3

### 4. Component Accessibility

**Descripción**: Añadir focus management y ARIA faltante
**Problema que resuelve**: WCAG compliance, keyboard navigation
**Impacto**: Medium
**Riesgo**: Low
**Archivos afectados**:

- `src/components/Modal.astro`
- `src/components/sections/CategoryNav.astro`
- `src/layouts/Header.astro`
- `src/components/features/Reviews.astro`
  **Orden recomendado**: 4

### 5. Error Handling

**Descripción**: Implementar manejo de errores y fallbacks
**Problema que resuelve**: Fallos silenciosos, mala UX en errores
**Impacto**: Medium
**Riesgo**: Low
**Archivos afectados**:

- `src/lib/loadCMS.ts`
- `src/lib/buildTenantData.ts`
- `public/scripts/events.js`
  **Orden recomendado**: 5

### 6. Image Optimization

**Descripción**: Implementar lazy loading y formatos modernos
**Problema que resuelve**: Performance de carga, Core Web Vitals
**Impacto**: Medium
**Riesgo**: Low
**Archivos afectados**:

- `src/components/sections/Menu.astro`
- `src/layouts/Head.astro`
- `astro.config.mjs`
  **Orden recomendado**: 6

### 7. SEO Meta Tags

**Descripción**: Completar meta tags críticos y structured data
**Problema que resuelve**: SEO incompleto, falta de canonical URLs
**Impacto**: Low
**Riesgo**: Low
**Archivos afectados**:

- `src/layouts/Head.astro`
- `src/pages/index.astro`
  **Orden recomendado**: 7

### 8. Code Splitting

**Descripción**: Optimizar carga de JS por página
**Problema que resuelve**: JS innecesario en páginas simples
**Impacto**: Low
**Riesgo**: Low
**Archivos afectados**:

- `src/components/template/MenuPage.astro`
- `src/components/template/PedidoPage.astro`
- `astro.config.mjs`
  **Orden recomendado**: 8

## Performance

### Build Time

- **Actual**: 1.39s
- **Objetivo**: <1.2s
- **Prioridades**: CSS purging, TypeScript strict, code splitting

### JS en Cliente

- **Actual**: ~30KB total distribuido
- **Objetivo**: <25KB total
- **Prioridades**: State management, lazy loading, tree shaking

### Assets

- **Actual**: CSS hasta 41KB por página
- **Objetivo**: <20KB por página
- **Prioridades**: Critical CSS, purging, compression

## Checklist de Validación

### Build

- [ ] `npm run build` exitoso sin warnings
- [ ] Tiempo de build <1.5s
- [ ] Bundle size reducido vs baseline
- [ ] No errores de TypeScript

### SEO

- [ ] Meta tags completos en todas las páginas
- [ ] Canonical URLs implementadas
- [ ] Structured data para restaurante
- [ ] Open Graph funcionando

### Performance

- [ ] Lighthouse performance >90
- [ ] First Contentful Paint <1.5s
- [ ] Largest Contentful Paint <2.5s
- [ ] Cumulative Layout Shift <0.1

### Regresiones

- [ ] Funcionalidad carrito intacta
- [ ] Navegación por categorías funcionando
- [ ] Multi-tenant configuración preservada
- [ ] Sistema de temas funcionando
- [ ] Responsive design mantenido

## Ejecución

### Fase 1 (Foundation)

1. TypeScript Strict Mode
2. State Management

### Fase 2 (Optimization)

3. CSS Optimization
4. Component Accessibility
5. Error Handling

### Fase 3 (Polish)

6. Image Optimization
7. SEO Meta Tags
8. Code Splitting

Cada refactor debe ser:

- Commit separado con descripción clara
- Deployable individualmente
- Validado con checklist correspondiente
- Documentado cambios breaking (si aplica)
