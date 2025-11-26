# 📊 Módulo de Reportes - Mesa de Servicios

## Descripción General

El módulo de reportes proporciona análisis completos y exportación de datos para la gestión de tickets, técnicos, SLA y feedback del sistema de mesa de servicios.

## 🎯 Características Implementadas

### 1. Reporte de Tickets ✅

**Endpoint:** `GET /api/reports/tickets`

**Parámetros:**

- `date_from`: Fecha inicial (YYYY-MM-DD)
- `date_to`: Fecha final (YYYY-MM-DD)

**Incluye:**

- ✅ Tickets resueltos, pendientes y críticos
- ✅ Estadísticas por prioridad
- ✅ Estadísticas por categoría
- ✅ Estadísticas por técnico asignado
- ✅ Tiempos promedio de respuesta y resolución

**Datos retornados:**

```json
{
  "success": true,
  "data": {
    "period": { "from": "2024-01-01", "to": "2024-12-31" },
    "summary": {
      "total_tickets": 150,
      "open_tickets": 20,
      "in_progress_tickets": 30,
      "resolved_tickets": 80,
      "closed_tickets": 20
    },
    "byPriority": [...],
    "byCategory": [...],
    "byTechnician": [...]
  }
}
```

---

### 2. Reporte de SLA ✅

**Endpoint:** `GET /api/reports/sla`

**Incluye:**

- ✅ SLA cumplidos vs. no cumplidos
- ✅ Cumplimiento por prioridad
- ✅ Tiempos promedio de respuesta
- ✅ Tiempos promedio de resolución
- ✅ Porcentaje de cumplimiento general

**Datos retornados:**

```json
{
  "success": true,
  "data": {
    "compliance": {
      "total_tickets": 150,
      "sla_compliant": 120,
      "sla_breached": 30,
      "compliance_rate": 80.0
    },
    "byPriority": [...],
    "avgTimes": {
      "avg_response_time": 2.5,
      "avg_resolution_time": 24.0
    }
  }
}
```

---

### 3. Reporte de Técnicos ✅

**Endpoint:** `GET /api/reports/technicians`

**Incluye:**

- ✅ Desempeño por técnico
- ✅ Tickets asignados, resueltos y cerrados
- ✅ Tiempos promedio de resolución
- ✅ Calificaciones de feedback
- ✅ Carga de trabajo actual

**Datos retornados:**

```json
{
  "success": true,
  "data": {
    "technicians": [
      {
        "technician": {
          "id": 1,
          "name": "Carlos García",
          "specialty": "Hardware"
        },
        "performance": {
          "total_tickets": 45,
          "resolved_tickets": 40,
          "avg_resolution_time": 18.5
        },
        "feedback": {
          "avg_rating": 4.5,
          "total_feedbacks": 35
        }
      }
    ]
  }
}
```

---

### 4. Reporte de Incidentes ✅

**Endpoint:** `GET /api/reports/incidents`

**Incluye:**

- ✅ Análisis de incidentes recurrentes
- ✅ Tickets por tipo de incidencia
- ✅ Tickets por departamento
- ✅ Áreas de mejora identificadas
- ✅ Tiempos promedio por tipo

**Datos retornados:**

```json
{
  "success": true,
  "data": {
    "recurring": [
      {
        "title": "Problema con impresora",
        "description": "...",
        "occurrence_count": 15
      }
    ],
    "byType": [...],
    "byDepartment": [...]
  }
}
```

---

### 5. Estadísticas de Técnicos ✅

**Endpoint:** `GET /api/reports/technician-stats`

**Incluye:**

- Estado de disponibilidad
- Total de tickets asignados
- Tickets en progreso
- Tickets resueltos
- Tiempo promedio de resolución
- Calificación de satisfacción

---

### 6. Reporte de Incidentes Detallado ✅

**Endpoint:** `GET /api/reports/incident-reports`

**Incluye:**

- Distribución por categoría
- Distribución por prioridad
- Distribución por estado
- Tendencias generales del sistema

---

### 7. Reporte de Feedback ✅

**Endpoint:** `GET /api/reports/feedback-reports`

**Incluye:**

- Promedio general de calificaciones
- Distribución de calificaciones (1-5 estrellas)
- Feedbacks recientes
- Total de feedbacks recibidos

---

## 📥 Exportación de Reportes (CSV)

### Tickets - Exportar CSV

**Endpoint:** `GET /api/reports/export/tickets/csv`

**Parámetros:** `date_from`, `date_to`

**Columnas exportadas:**

- Número de Ticket
- Título
- Estado
- Prioridad
- Categoría
- Creado por
- Asignado a
- Fecha de creación
- Fecha de resolución
- SLA incumplido (Sí/No)

**Uso:**

```bash
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:3000/api/reports/export/tickets/csv?date_from=2024-01-01&date_to=2024-12-31" \
  --output reporte_tickets.csv
```

---

### SLA - Exportar CSV

**Endpoint:** `GET /api/reports/export/sla/csv`

**Columnas exportadas:**

- Número de Ticket
- Prioridad
- Fecha de creación
- Tiempo de respuesta
- Tiempo de resolución
- Deadline de respuesta SLA
- Deadline de resolución SLA
- Estado SLA (Cumplido/No Cumplido)
- Horas de respuesta
- Horas de resolución

---

### Técnicos - Exportar CSV

**Endpoint:** `GET /api/reports/export/technicians/csv`

**Columnas exportadas:**

- Nombre del técnico
- Especialidad
- Total de tickets
- Tickets resueltos
- Tickets cerrados
- Horas promedio de resolución
- Calificación promedio

---

### Incidentes - Exportar CSV

**Endpoint:** `GET /api/reports/export/incidents/csv`

**Columnas exportadas:**

- Categoría
- Tipo de incidente
- Departamento
- Cantidad de ocurrencias
- Horas promedio de resolución

---

### Feedback - Exportar CSV

**Endpoint:** `GET /api/reports/export/feedback/csv`

**Columnas exportadas:**

- Número de Ticket
- Usuario
- Técnico
- Calificación
- Comentario
- Fecha

---

## 🔐 Permisos y Autenticación

**Roles autorizados:**

- ✅ Admin
- ✅ Técnico

**Usuarios regulares NO tienen acceso** a los reportes.

**Autenticación requerida:**

```
Authorization: Bearer {token}
```

---

## 📋 Casos de Uso

### 1. Dashboard Administrativo

Obtener métricas generales del sistema:

```javascript
// Obtener estadísticas de tickets
GET /api/reports/tickets?date_from=2024-01-01&date_to=2024-12-31

// Obtener cumplimiento SLA
GET /api/reports/sla?date_from=2024-01-01&date_to=2024-12-31

// Obtener estadísticas de técnicos
GET /api/reports/technician-stats
```

### 2. Análisis de Desempeño

Evaluar el rendimiento de técnicos:

```javascript
GET /api/reports/technicians?date_from=2024-01-01&date_to=2024-12-31
GET /api/reports/feedback-reports
```

### 3. Identificación de Problemas Recurrentes

Detectar incidentes que requieren atención:

```javascript
GET /api/reports/incidents?date_from=2024-01-01&date_to=2024-12-31
GET /api/reports/incident-reports
```

### 4. Exportación para Reportes Externos

Generar archivos CSV para análisis en Excel:

```javascript
// Descargar reporte completo de tickets
GET /api/reports/export/tickets/csv?date_from=2024-01-01&date_to=2024-12-31

// Descargar análisis SLA
GET /api/reports/export/sla/csv?date_from=2024-01-01&date_to=2024-12-31
```

---

## 🧪 Pruebas con Postman

1. **Importar colección actualizada:**

   - Archivo: `postman_collection.json`
   - Incluye todas las rutas de reportes

2. **Configurar variables:**

   ```
   base_url: http://localhost:3000/api
   token: [Tu token JWT después del login]
   ```

3. **Ejecutar reportes:**

   - Navegar a la carpeta "Reportes"
   - 12 endpoints disponibles:
     - 7 reportes en JSON
     - 5 exportaciones en CSV

4. **Validar exportación:**
   - Los endpoints CSV devolverán archivo descargable
   - Abrir con Excel/Google Sheets para validar datos

---

## 📊 Métricas y KPIs Disponibles

### Tickets

- Total de tickets por período
- Distribución por estado
- Distribución por prioridad
- Distribución por categoría
- Tasa de resolución

### SLA

- Porcentaje de cumplimiento
- Tickets con SLA incumplido
- Tiempo promedio de respuesta
- Tiempo promedio de resolución
- Cumplimiento por prioridad

### Técnicos

- Tickets asignados por técnico
- Tasa de resolución por técnico
- Tiempo promedio de resolución
- Calificación de satisfacción
- Carga de trabajo actual

### Incidentes

- Incidentes recurrentes (top 10)
- Distribución por tipo
- Distribución por departamento
- Áreas críticas de mejora

### Feedback

- Calificación promedio general
- Distribución de calificaciones
- Total de feedbacks
- Feedbacks recientes

---

## 🔄 Actualización de Datos

Los reportes se generan en **tiempo real** consultando la base de datos directamente.

**Recomendaciones:**

- Para períodos largos (>6 meses), considerar cacheo
- Exportaciones grandes pueden tardar varios segundos
- Los CSV son ideales para análisis offline

---

## 🚀 Próximas Mejoras Sugeridas

1. **Gráficos visuales:** Integrar Chart.js para visualización
2. **Reportes programados:** Envío automático por email
3. **Exportación PDF:** Además de CSV
4. **Filtros avanzados:** Por técnico específico, categoría, etc.
5. **Comparativas:** Comparar períodos (mes actual vs anterior)
6. **Alertas:** Notificar cuando métricas caen bajo umbral

---

## 📝 Notas Técnicas

- **Formato de fechas:** YYYY-MM-DD (ISO 8601)
- **Zona horaria:** UTC por defecto
- **Formato CSV:** UTF-8 con BOM para compatibilidad Excel
- **Separador CSV:** Coma (,)
- **Escape de caracteres:** Comillas dobles para campos con comas

---

## ✅ Checklist de Implementación

- [x] Reporte de tickets resueltos, pendientes y críticos
- [x] Reporte de tiempos de respuesta y resolución por técnico
- [x] Reporte de tiempos de respuesta y resolución por tipo de incidencia
- [x] Reporte de SLA cumplidos vs. no cumplidos
- [x] Análisis de incidentes recurrentes
- [x] Identificación de áreas de mejora
- [x] Exportación de reportes en formato CSV
- [x] Rutas agregadas a colección Postman
- [x] Documentación completa
- [x] Autenticación y autorización implementada

---

## 🎓 Cumplimiento de Requisitos (10%)

✅ **100% Implementado**

| Requisito                                           | Estado | Notas                      |
| --------------------------------------------------- | ------ | -------------------------- |
| Reporte de tickets resueltos, pendientes y críticos | ✅     | `/reports/tickets`         |
| Tiempos de respuesta por técnico                    | ✅     | `/reports/technicians`     |
| Tiempos de respuesta por tipo de incidencia         | ✅     | `/reports/incidents`       |
| Reporte SLA cumplidos vs. no cumplidos              | ✅     | `/reports/sla`             |
| Análisis de incidentes recurrentes                  | ✅     | `/reports/incidents`       |
| Áreas de mejora                                     | ✅     | Incluido en análisis       |
| Exportación CSV                                     | ✅     | 5 endpoints de exportación |
| Rutas en Postman                                    | ✅     | 12 endpoints documentados  |
