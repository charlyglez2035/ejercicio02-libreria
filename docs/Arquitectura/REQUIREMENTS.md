# REQUIREMENTS.md
## Aplicación Web Monolítica para Gestión de una Librería

**Materia:** Integración de Aplicaciones Computacionales
**Documento:** Requisitos funcionales, no funcionales, actores y riesgos
**Fecha:** 30/08/26

---

## 1. Descripción del problema y alcance

El sistema deberá permitir la gestión completa del catálogo de una librería en línea: libros, autores,
géneros, formatos, categorías, imágenes y conceptos/definiciones asociados al contenido de cada libro.
La aplicación es monolítica, server-side (Node.js + Express + EJS), con acceso directo a PostgreSQL
mediante consultas parametrizadas. Solo usuarios registrados pueden operar el sistema, y existe un único
rol de Administrador responsable del CRUD completo del catálogo.

Quedan fuera de alcance: APIs REST/GraphQL/SOAP, microservicios, intercambio de datos vía JSON/XML entre
frontend y backend, pagos en línea, envíos/logística y facturación fiscal.

---

## 2. Requisitos funcionales (RF)

| ID | Requisito | Descripción |
|----|-----------|-------------|
| RF-01 | Registro de usuarios | El sistema debe permitir a un visitante registrarse con correo, contraseña y datos básicos de perfil. |
| RF-02 | Inicio de sesión | El sistema debe permitir a un usuario registrado autenticarse con correo/usuario y contraseña. |
| RF-03 | Cierre de sesión | El sistema debe permitir cerrar la sesión activa e invalidar la cookie de sesión. |
| RF-04 | Consulta de catálogo | Un usuario autenticado debe poder consultar el listado de libros disponibles. |
| RF-05 | Búsqueda de libros | El sistema debe permitir buscar libros por ISBN y por título (coincidencia parcial). |
| RF-06 | CRUD de libros | El Administrador debe poder crear, leer, actualizar y eliminar libros. |
| RF-07 | CRUD de autores | El Administrador debe poder crear, leer, actualizar y eliminar autores. |
| RF-08 | CRUD de géneros | El Administrador debe poder crear, leer, actualizar y eliminar géneros literarios. |
| RF-09 | CRUD de formatos | El Administrador debe poder crear, leer, actualizar y eliminar formatos (ej. pasta dura, digital, audiolibro). |
| RF-10 | CRUD de categorías | El Administrador debe poder crear, leer, actualizar y eliminar categorías de catálogo. |
| RF-11 | CRUD de conceptos | El Administrador debe poder crear, leer, actualizar y eliminar conceptos reutilizables (catálogo de conceptos). |
| RF-12 | Asociación libro-autor (N:M) | El sistema debe permitir asociar múltiples autores a un mismo libro y viceversa. |
| RF-13 | Asociación libro-género (N:M) | El sistema debe permitir asociar múltiples géneros a un mismo libro y viceversa. |
| RF-14 | Conceptos por libro | El sistema debe permitir registrar, para cada libro, una definición específica de un concepto, incluyendo referencia opcional a capítulo o página. |
| RF-15 | Gestión de imágenes | El Administrador debe poder cargar, editar y eliminar imágenes asociadas a un libro. |
| RF-16 | Imagen de portada | El sistema debe permitir marcar exactamente una imagen de cada libro como portada. |
| RF-17 | Texto alternativo de imagen | El sistema debe permitir registrar y editar el texto alternativo (accesibilidad) de cada imagen. |
| RF-18 | Control de stock | El sistema debe registrar y permitir actualizar el stock disponible de cada libro, impidiendo valores negativos. |
| RF-19 | Control de precio | El sistema debe registrar y permitir actualizar el precio de cada libro, impidiendo valores negativos o inválidos. |
| RF-20 | Administrador único | El sistema debe impedir la existencia de más de un usuario con rol Administrador, tanto a nivel de aplicación como de base de datos. |
| RF-21 | Autorización por rol | El sistema debe restringir el acceso a las rutas administrativas exclusivamente al rol Administrador. |
| RF-22 | Mensajes de resultado | Toda operación CRUD debe informar al usuario el resultado (éxito o error controlado) sin exponer detalles internos. |

---

## 3. Requisitos no funcionales (RNF)

| ID | Categoría | Descripción |
|----|-----------|-------------|
| RNF-01 | Seguridad | Las contraseñas se almacenarán con hash seguro (bcrypt o equivalente); nunca en texto plano. |
| RNF-02 | Seguridad | Todas las consultas a PostgreSQL deben ser parametrizadas; queda prohibido concatenar valores de entrada en SQL. |
| RNF-03 | Seguridad | Los secretos (credenciales de BD, claves de sesión) se gestionarán mediante variables de entorno (`.env`) fuera del control de versiones. |
| RNF-04 | Seguridad | Las rutas privadas deben protegerse con middleware de autenticación y, adicionalmente, de autorización por rol. |
| RNF-05 | Mantenibilidad | El código debe organizarse siguiendo separación de responsabilidades (rutas, servicios, middleware, vistas, configuración). |
| RNF-06 | Integridad de datos | La base de datos debe reforzar reglas de negocio mediante PK, FK, UNIQUE, CHECK, triggers y/o stored procedures (ej. ISBN único, stock ≥ 0, un solo Administrador). |
| RNF-07 | Rendimiento básico | Las consultas de catálogo y búsqueda deben responder en un tiempo aceptable para un entorno de prueba (< 2s con el volumen de datos sintéticos definido). |
| RNF-08 | Usabilidad | Las vistas deben ser navegables, con formularios claros y mensajes de error/éxito comprensibles para el usuario final. |
| RNF-09 | Disponibilidad | La aplicación debe permanecer accesible mediante el reverse proxy configurado (Apache/NGINX) durante el periodo de evaluación. |
| RNF-10 | Trazabilidad de errores | Los errores deben registrarse en el servidor (logs) sin exponer stack traces ni mensajes de PostgreSQL al usuario final. |
| RNF-11 | Facilidad de despliegue | La aplicación Node.js debe ejecutarse en `127.0.0.1:3000` y publicarse únicamente a través de un reverse proxy bajo el prefijo `/library`. |
| RNF-12 | Gestión de archivos | Los archivos subidos deben validarse por extensión, tipo MIME y tamaño máximo, y renombrarse mediante un identificador generado por el sistema. |
| RNF-13 | Mínimo privilegio | La aplicación debe conectarse a PostgreSQL con un usuario de aplicación de privilegios mínimos, nunca con un superusuario. |

---

## 4. Supuestos

- El volumen de datos del ejercicio es de prueba/demostración (≈30 registros por tabla), no productivo.
- Existe un único Administrador creado como parte de la carga inicial (seed) o del primer registro protegido.
- Los usuarios registrados no requieren verificación de correo electrónico para efectos del ejercicio.
- El entorno de despliegue es una sola instancia de Compute Engine con CentOS Stream 10.
- No se maneja concurrencia alta ni balanceo de carga; el sistema es de un solo nodo.
- Las imágenes se almacenan en el sistema de archivos local (`uploads/`), no en un bucket externo.

## 5. Restricciones

- Arquitectura monolítica server-side con Node.js, Express y EJS (sin frameworks SPA).
- Acceso a datos exclusivamente mediante el driver `pg` con consultas parametrizadas.
- Prohibido el uso de JSON/XML como mecanismo de intercambio frontend-backend (excepto `package.json`, requerido por npm).
- Los formularios HTML envían datos directamente al monolito (POST tradicional, no fetch/AJAX con JSON).
- Máximo un usuario Administrador en todo momento.
- La aplicación Node.js no debe exponerse directamente a Internet; solo mediante reverse proxy.
- No se deben publicar credenciales, `.env`, llaves privadas ni tokens en el repositorio ni en el sitio público.

## 6. Criterios de aceptación (ejemplos representativos)

| RF relacionado | Criterio de aceptación |
|-----------------|-------------------------|
| RF-01 / RF-02 | Un visitante puede registrarse y, con las mismas credenciales, iniciar sesión exitosamente; credenciales inválidas son rechazadas con mensaje controlado. |
| RF-06 | Al crear un libro con ISBN ya existente, el sistema rechaza la operación y muestra un mensaje de error sin exponer el error crudo de PostgreSQL. |
| RF-12 / RF-13 | Un libro puede guardarse con dos o más autores y dos o más géneros simultáneamente, y estas asociaciones son consultables desde el detalle del libro. |
| RF-16 | Al marcar una nueva imagen como portada, la imagen previamente marcada deja de ser portada automáticamente (solo una portada activa por libro). |
| RF-18 / RF-19 | Intentar guardar stock negativo o precio negativo/no numérico es rechazado antes de llegar a la base de datos (validación server-side) y también por restricciones CHECK en PostgreSQL. |
| RF-20 | Un intento de crear un segundo usuario con rol Administrador es rechazado tanto por la lógica de aplicación como por una restricción/trigger en la base de datos. |
| RF-21 | Un usuario con rol "registrado" que intenta acceder a una ruta administrativa recibe una respuesta de acceso denegado controlada (no un error 500). |

---

## 7. Actores, operaciones y riesgos

### 7.1 Actores y operaciones

| Actor | Operaciones permitidas | Operaciones rechazadas |
|-------|--------------------------|---------------------------|
| **Visitante** (no autenticado) | Acceder a la página de login, acceder a la página de registro, acceder a páginas públicas expresamente autorizadas (ej. landing informativa). | Consultar catálogo, ver detalle de libros, realizar búsquedas, acceder a cualquier ruta de CRUD o administración. |
| **Usuario Registrado** | Iniciar y cerrar sesión, consultar el catálogo completo, ver el detalle de un libro, buscar por ISBN/título, consultar conceptos y definiciones asociadas a un libro. | Crear/editar/eliminar libros, autores, géneros, formatos, categorías o conceptos; gestionar imágenes; acceder al panel de administración; modificar stock o precio. |
| **Administrador** (único) | Todo lo permitido a Usuario Registrado, más: CRUD completo de libros, autores, géneros, formatos, categorías y conceptos; asociación de autores/géneros a libros; carga, edición y eliminación de imágenes; asignación de imagen de portada; control de stock y precio; consulta de registros administrativos. | Crear un segundo usuario Administrador (bloqueado por diseño); eliminar su propia cuenta si deja el sistema sin Administrador. |

### 7.2 Riesgos identificados

| Riesgo | Descripción | Mitigación prevista (ver también SECURITY_REVIEW.md) |
|--------|-------------|----------------------------------------------------------|
| Acceso no autorizado | Un usuario sin sesión o con rol insuficiente accede a funciones restringidas. | Middleware de autenticación + autorización por rol en cada ruta administrativa. |
| SQL Injection | Entrada de usuario manipulada para alterar consultas SQL. | Uso exclusivo de consultas parametrizadas con `pg`; prohibida la concatenación de SQL. |
| Subida de archivos peligrosos | Carga de archivos ejecutables o disfrazados como imágenes. | Validación de extensión, tipo MIME y tamaño; renombrado del archivo con nombre generado por el sistema; almacenamiento fuera de rutas ejecutables. |
| Exposición de credenciales | Publicación accidental de `.env`, contraseñas o cadenas de conexión. | Variables de entorno excluidas del control de versiones y de la publicación; uso de `.env.example` sin valores reales. |
| Eliminación accidental de información | Borrado de registros con relaciones dependientes (libro con imágenes, conceptos o asociaciones). | Restricciones FK con acciones `ON DELETE` explícitas y justificadas; confirmaciones en la interfaz antes de eliminar. |
| Publicación de datos sensibles | Exposición de rutas internas del servidor, logs, contraseñas hasheadas o stack traces al usuario final. | Manejo centralizado de errores; mensajes genéricos al usuario; logs solo en servidor. |
| Creación de un segundo Administrador | Elevación de privilegios no controlada. | Restricción a nivel de aplicación y defensa adicional en base de datos (constraint/trigger). |

---
