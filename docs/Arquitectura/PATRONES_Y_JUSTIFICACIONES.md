# Patrones y Justificaciones
## Aplicación Web Monolítica para Gestión de una Librería

**Documento correspondiente a:** Parte 2, puntos 4 y 5 del ejercicio guiado
**Fecha:** 30/08/26

---

## 4. Patrón de presentación y organización del código

### 4.1 Patrón seleccionado

Se adopta una variante **server-side de MVC (Model–View–Controller)**, adaptada a las restricciones del
ejercicio (sin ORM obligatorio, acceso directo a PostgreSQL mediante `pg`, vistas renderizadas con EJS).
La variante utilizada separa el código en cinco responsabilidades claramente delimitadas: **rutas**
(entrada HTTP), **middleware** (aspectos transversales), **servicios** (lógica de negocio, hace las veces
de "controlador" ampliado), **acceso a datos** (equivalente al "modelo") y **vistas** (EJS).

No se usa un framework MVC completo (como NestJS con decoradores) porque el ejercicio exige explícitamente
Node.js + Express + EJS de forma directa y explicable, sin abstracciones adicionales que dificulten
justificar cada decisión. La variante elegida conserva el principio esencial de MVC —separación entre
presentación, lógica y datos— sin forzar una capa de "modelo" orientada a objetos que no aporta valor
cuando se trabaja con SQL parametrizado directo.

### 4.2 Alternativas consideradas

| Alternativa | Descripción | Por qué no se eligió |
|---|---|---|
| Todo en `app.js` | Rutas, validaciones, consultas SQL y lógica de negocio en un solo archivo. | Viola RNF-05 (mantenibilidad); dificulta pruebas, revisión de código y localización de errores; el ejercicio prohíbe explícitamente concentrar lógica en `app.js`. |
| MVC con ORM (Sequelize/Prisma) | Modelo como clases mapeadas a tablas, controladores delgados. | El ejercicio exige acceso directo a PostgreSQL mediante `pg` y SQL parametrizado explícito, no abstracción vía ORM; además introduce una dependencia adicional no justificada por los requisitos. |
| Arquitectura hexagonal / Clean Architecture completa | Puertos y adaptadores, casos de uso desacoplados de Express. | Sobre-ingeniería para el alcance del ejercicio (una sola unidad desplegable, equipo de una persona); el costo de abstracción no se compensa con el beneficio esperado en este contexto académico. |
| MVC server-side simplificado (elegido) | Rutas → middleware → servicios → acceso a datos → vistas EJS. | Cumple la separación de responsabilidades exigida, es explicable por completo, no agrega dependencias no justificadas y es coherente con "consultas SQL parametrizadas" como requisito explícito. |

### 4.3 Responsabilidad de cada carpeta

| Elemento | Responsabilidad esperada | Debe evitar |
|---|---|---|
| `app.js` | Inicialización de Express, registro de middleware general, montaje de rutas y arranque controlado del servidor. | Contener lógica de negocio, consultas SQL o validaciones específicas de una entidad. |
| `config/` | Configuración de la aplicación y conexión centralizada a PostgreSQL (`config/db.js`), lectura de variables de entorno. | Exponer credenciales embebidas en el código; debe leer siempre desde `.env`. |
| `routes/` | Recepción de solicitudes HTTP, mapeo de verbo+ruta a una función de servicio, y envío de la respuesta (render de vista o redirect). | Contener consultas SQL directas o reglas de negocio complejas; una ruta no debe decidir, solo coordinar. |
| `services/` (o `controllers/`) | Reglas de aplicación: validación de reglas de negocio (ej. "solo un Administrador", "stock ≥ 0"), orquestación de llamadas al acceso a datos, transformación de datos hacia la vista. | Manejar directamente el objeto `req`/`res` de Express (eso es responsabilidad de `routes/`); no debe acoplarse al framework HTTP. |
| `middleware/` | Autenticación (verificar sesión), autorización (verificar rol), validaciones transversales (sanitización de entradas) y manejo centralizado de errores (`errorHandler`). | Contener lógica de negocio específica de una entidad (ej. reglas de precio de un libro). |
| `views/` | Plantillas EJS que reciben datos ya procesados y los presentan como HTML. | Contener consultas SQL, cálculos de negocio o llamadas a `pg`; una vista solo itera y muestra datos. |
| `public/` | Recursos estáticos: CSS, JavaScript de interfaz (validaciones de UX no críticas), imágenes de la plantilla del sitio. | Servir como almacenamiento de imágenes subidas por usuarios (eso es `uploads/`). |
| `uploads/` | Almacenamiento físico de archivos cargados por el Administrador (imágenes de libros), con nombres generados por el sistema. | Ser accesible con nombres de archivo originales del usuario; no debe ejecutar código. |
| `db/` | Scripts SQL versionados: creación de base de datos, esquema, seeds, stored procedures, triggers y vistas. | Contener lógica de aplicación; son artefactos puramente declarativos de PostgreSQL. |
| `docs/` | Documentación de ingeniería del proyecto (requisitos, decisiones, seguridad, pruebas, diagramas). | Contener código ejecutable. |

### 4.4 Flujo de una solicitud típica (ejemplo: crear un libro)

1. El navegador envía un `POST /libros` con los datos del formulario.
2. `routes/libros.js` recibe la solicitud y la delega, pasando primero por `middleware/auth.js`
   (¿hay sesión?) y `middleware/authorize.js` (¿rol Administrador?).
3. La ruta invoca `services/libroService.js`, que valida las reglas de negocio (ISBN no vacío,
   precio y stock válidos, autores/géneros existentes).
4. `services/libroService.js` llama a `config/db.js` (acceso a datos) para ejecutar el `INSERT`
   parametrizado y las inserciones en las tablas puente `libro_autor` y `libro_genero`.
5. El servicio retorna el resultado a la ruta, que renderiza `views/libros/detalle.ejs` o redirige
   al listado con un mensaje de éxito/error.

Esto demuestra que **ninguna capa concentra todo el trabajo**: cada módulo tiene una única razón para
cambiar, lo cual es el objetivo de la separación de responsabilidades exigida por el ejercicio.

---

## 5. Registro de las decisiones arquitectónicas

Se documentan a continuación las decisiones exigidas: elección de arquitectura
monolítica, acceso directo a PostgreSQL, y renderizado server-side con EJS.

### 5.1 Decisión: Arquitectura monolítica (Node.js + Express + EJS en una sola unidad desplegable)

- **Necesidad o problema:** Construir y desplegar en un tiempo acotado un sistema completo (CRUD,
  autenticación, carga de imágenes) para un entorno de ejercicio académico con un solo desarrollador.
- **Alternativas consideradas:** (a) microservicios separados por dominio (usuarios, catálogo, imágenes);
  (b) frontend desacoplado (SPA) consumiendo una API REST/GraphQL; (c) monolito server-side con
  renderizado en el servidor (elegida).
- **Decisión tomada:** Monolito server-side: una sola aplicación Node.js/Express que renderiza HTML,
  contiene la lógica de negocio y accede directamente a PostgreSQL.
- **Justificación técnica:** El ejercicio restringe explícitamente el uso de APIs REST/GraphQL/SOAP y
  microservicios. Además, para el tamaño del equipo (una persona) y el alcance funcional, un monolito
  reduce la complejidad operativa: un solo proceso que desplegar, un solo repositorio, sin necesidad de
  orquestación, service discovery ni contratos de API entre servicios.
- **Riesgo o limitación:** Acoplamiento fuerte entre presentación, lógica y datos; un cambio en un módulo
  puede requerir volver a desplegar toda la aplicación; el escalamiento debe hacerse de la aplicación
  completa y no de un módulo específico (por ejemplo, no se puede escalar solo "carga de imágenes").
- **Condición futura que justificaría cambiar:** Si el sistema creciera a múltiples equipos de desarrollo
  trabajando en paralelo, si un módulo (ej. procesamiento de imágenes) necesitara escalar de forma
  independiente por alta demanda, o si se requiriera exponer el catálogo a aplicaciones móviles/terceros,
  sería razonable evolucionar hacia servicios desacoplados con una API explícita.

### 5.2 Decisión: Acceso directo a PostgreSQL mediante el driver `pg` y SQL parametrizado

- **Necesidad o problema:** Persistir y consultar datos relacionales (libros, autores, géneros, imágenes,
  conceptos) con integridad garantizada y protección contra inyección SQL.
- **Alternativas consideradas:** (a) ORM (Sequelize, Prisma, TypeORM); (b) query builder (Knex);
  (c) acceso directo con el driver `pg` y consultas parametrizadas (elegida).
- **Decisión tomada:** Uso del driver oficial `pg`, centralizando la conexión en `config/db.js`, con
  consultas SQL explícitas y parametrizadas (`$1, $2, ...`) en la capa de acceso a datos.
- **Justificación técnica:** El ejercicio exige explícitamente "acceso directo a PostgreSQL mediante el
  controlador pg y consultas SQL parametrizadas", como parte de los objetivos de aprendizaje de
  Integración de Aplicaciones Computacionales (dominar SQL y no depender de abstracciones). Un ORM
  ocultaría el comportamiento real de las consultas y dificultaría justificar decisiones de modelado
  relacional (4FN, triggers, stored procedures) que el ejercicio pide implementar y explicar.
- **Riesgo o limitación:** Mayor cantidad de código repetitivo (boilerplate) en la capa de acceso a datos;
  responsabilidad manual de mantener la coherencia entre el esquema SQL y el código; mayor probabilidad de
  errores humanos en consultas complejas si no se centraliza bien el acceso.
- **Condición futura que justificaría cambiar:** Si el equipo creciera y necesitara mayor velocidad de
  desarrollo sobre el modelo de datos, o si el esquema cambiara con mucha frecuencia, un ORM con
  migraciones automatizadas podría justificarse a cambio de perder control fino sobre el SQL generado.

### 5.3 Decisión: Renderizado server-side con EJS (sin frontend desacoplado ni intercambio JSON/XML)

- **Necesidad o problema:** Presentar la interfaz de usuario (catálogo, formularios CRUD, detalle de
  libros) de forma simple, sin introducir una capa de API adicional.
- **Alternativas consideradas:** (a) SPA con React/Vue consumiendo una API JSON; (b) plantillas server-side
  con Pug o Handlebars; (c) EJS renderizado en el servidor (elegida).
- **Decisión tomada:** Las vistas se generan completamente en el servidor con EJS; los formularios HTML
  envían datos directamente al monolito mediante `POST` tradicional (no `fetch`/AJAX con JSON).
- **Justificación técnica:** El ejercicio prohíbe explícitamente JSON/XML como mecanismo de intercambio
  entre frontend y backend (salvo `package.json`, requerido por npm), y exige que "las vistas se generarán
  en el servidor". EJS se eligió sobre Pug/Handlebars porque su sintaxis es HTML nativo con
  interpolación `<%= %>`, lo que reduce la curva de aprendizaje y facilita auditar que las vistas no
  contengan lógica de negocio ni consultas SQL, cumpliendo la separación de responsabilidades exigida.
- **Riesgo o limitación:** Experiencia de usuario menos fluida que una SPA (recarga completa de página en
  cada acción); mayor acoplamiento entre backend y presentación; dificulta reutilizar la misma lógica para
  un futuro cliente móvil o de terceros sin duplicar código de presentación.
- **Condición futura que justificaría cambiar:** Si se requiriera una experiencia de usuario más dinámica
  (actualizaciones parciales sin recarga), soporte multiplataforma (app móvil nativa) o consumo del
  catálogo por sistemas externos, sería razonable introducir una API (REST/GraphQL) y desacoplar el
  frontend, evolucionando el monolito hacia una arquitectura de backend-for-frontend o de servicios.

---

## 6. Resumen de trazabilidad

| Decisión | Requisito/restricción que la origina | Documento relacionado |
|---|---|---|
| Monolito server-side | Restricciones arquitectónicas del ejercicio; RNF-05, RNF-11 | `docs/ARCHITECTURE_MONOLITHIC.png` |
| Acceso directo a PostgreSQL con `pg` | Restricción del ejercicio; RNF-02, RNF-06 | `db/01_schema.sql`, `docs/DB_DESIGN_ER_4FN.png` |
| Renderizado server-side con EJS | Restricción del ejercicio (prohibición de JSON/XML) | `views/`, `docs/REQUIREMENTS.md` |
| Organización tipo MVC server-side | RNF-05 (mantenibilidad); punto 4 del ejercicio | Estructura de carpetas `routes/`, `services/`, `middleware/`, `views/` |