# Tote Frontend

Aplicación Vue.js para gestionar la lista de totes del sistema.

## 🚀 Desarrollo

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo (con proxy al backend)
npm run serve
```

La aplicación estará disponible en `http://localhost:8080`

## 📦 Build para Producción

```bash
# Compilar y copiar al backend
npm run build:backend
```

Esto compilará la aplicación Vue y la copiará a `../Tote_backend/public/app/`

## 🔗 Acceso en Producción

Una vez compilado, el frontend estará disponible en:
- **Local**: `http://localhost:3000/app/`
- **Docker**: `http://localhost:3000/app/`

## 📋 Características

### Vista de Totes
- Lista completa de todos los totes registrados
- Auto-refresh cada 30 segundos
- Estadísticas en tiempo real:
  - Total de totes
  - Total de pescado (kg)
  - Total de hielo dispensado (kg)
  - Total de agua dispensada (kg)

### Información por Tote
- ID único
- Peso del pescado
- Hielo entrada/salida
- Agua entrada/salida
- Peso del tote
- Raw weight
- Temperatura de salida
- Fechas de creación y actualización

## 🛠️ Tecnologías

- Vue 3
- Vue Router 4
- Vuex 4
- SCSS

## 📡 API Backend

El frontend consume los siguientes endpoints:

- `GET /api/totes` - Lista de todos los totes

## 🔧 Configuración

La configuración se encuentra en `vue.config.js`:
- `outputDir`: Directorio de salida de la compilación (`../Tote_backend/public/app`)
- `publicPath`: Ruta base de la aplicación (`/app/`)
- `proxy`: Configuración del proxy para desarrollo

