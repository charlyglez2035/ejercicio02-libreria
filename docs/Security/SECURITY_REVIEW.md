# SECURITY_REVIEW.md

**Proyecto:** Aplicación Web Monolítica para Gestión de una Librería
**Parte 6 — Punto 17. Controles mínimos de seguridad**

Para cada control se documenta: **amenaza** que mitiga, **control aplicado** (con detalle técnico de implementación) y **evidencia de prueba** que demuestra que funciona. Las evidencias referenciadas (capturas, logs) deben conservarse en `evidencias/seguridad/` y enlazarse desde la página web final.

---

## 1. Hash de contraseñas y política básica de contraseñas

- **Amenaza:** si la base de datos se filtra o es accedida sin autorización, contraseñas en texto plano permiten comprometer todas las cuentas de inmediato, y reutilización de contraseñas afecta a los usuarios en otros sistemas.
- **Control aplicado:** las contraseñas nunca se almacenan en texto plano. Se usa `bcrypt` (o `argon2`) con salt automático y costo ≥ 10 para generar el hash antes de insertar en `users.password_hash`. Política mínima aplicada en el registro: longitud mínima de 8 caracteres, al menos una letra y un número; el formulario y el backend rechazan contraseñas que no cumplan la política.
- **Evidencia de prueba:** captura de `SELECT password_hash FROM users;` mostrando cadenas tipo `$2b$10$...` (nunca el valor original); prueba funcional de registro con contraseña débil (`"1234"`) devolviendo error de validación; prueba de login exitoso solo con la contraseña correcta después del hash.

---

## 2. Variables de entorno para secretos y credenciales

- **Amenaza:** credenciales de PostgreSQL, claves de sesión u otros secretos expuestos en el código fuente o en el repositorio público permiten acceso no autorizado a la base de datos o a la aplicación.
- **Control aplicado:** todos los secretos (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `SESSION_SECRET`, puerto, etc.) se leen desde `.env` mediante `dotenv`, nunca se hardcodean en `app.js`, `config/db.js` ni en las vistas. `.env` está listado en `.gitignore` y se excluye explícitamente del `.tar.gz` de entrega. Se publica `.env.example` con los nombres de variable sin valores reales.
- **Evidencia de prueba:** `git status` / listado del `.tar.gz` mostrando ausencia de `.env`; captura de `.gitignore` conteniendo la línea `.env`; comparación de `.env.example` vs `.env` mostrando que el primero no contiene valores sensibles.

---

## 3. Consultas SQL parametrizadas

- **Amenaza:** construir SQL concatenando directamente valores del usuario permite ataques de SQL Injection (lectura, modificación o eliminación no autorizada de datos, bypass de autenticación).
- **Control aplicado:** todas las consultas usan el driver `pg` con placeholders (`$1, $2, …`) y arreglo de parámetros; está prohibido el template-string/concatenación de valores de usuario dentro del SQL. Esto se verifica también mediante revisión de código (grep de patrones `+ req.body` dentro de cadenas SQL).
- **Evidencia de prueba:** prueba de login/búsqueda con entrada `' OR '1'='1` y con `'; DROP TABLE books; --` en campos de texto: el sistema los trata como texto literal, sin alterar la consulta ni afectar la tabla; captura de la consulta parametrizada en consola/log junto con el resultado seguro.

---

## 4. Validación server-side de todos los campos

- **Amenaza:** confiar solo en validación HTML/JavaScript del navegador permite que un atacante omita el frontend (Postman, curl, formularios modificados) y envíe datos inválidos o maliciosos directamente al servidor.
- **Control aplicado:** cada ruta que recibe datos (`POST`/`PUT`) revalida tipo, formato, rango y obligatoriedad en el backend (middleware de validación o funciones dedicadas en `services/`), independientemente de la validación `required`/`pattern` del HTML. Los errores de validación regresan un mensaje controlado sin exponer detalles internos.
- **Evidencia de prueba:** envío de una petición directa (curl/Postman) sin pasar por el formulario HTML, con `precio = -50` o `stock = "abc"`: el servidor la rechaza con un mensaje de error controlado y no inserta el registro.

---

## 5. Autorización por rol en cada ruta administrativa

- **Amenaza:** un usuario autenticado pero sin privilegios (o un visitante) podría acceder directamente a URLs administrativas (`/admin/libros/nuevo`, etc.) si solo se ocultan los enlaces en la interfaz, sin protección real en el servidor.
- **Control aplicado:** middleware `requireAuth` (verifica sesión activa) y `requireAdmin` (verifica `req.session.user.rol === 'admin'`) se aplican explícitamente en cada ruta de `routes/admin*.js` antes del controlador. La autenticación (¿quién eres?) está separada de la autorización (¿qué puedes hacer?).
- **Evidencia de prueba:** un usuario registrado (no admin) que solicita directamente `GET /admin/libros/nuevo` recibe HTTP 403 / redirección controlada, no el formulario; un visitante sin sesión que solicita cualquier ruta privada es redirigido a `/login`.

---

## 6. Manejo seguro de sesiones y cierre de sesión

- **Amenaza:** sesiones mal configuradas permiten secuestro de sesión (session hijacking), fijación de sesión, o que un cierre de sesión incompleto deje la cuenta accesible desde el mismo navegador.
- **Control aplicado:** `express-session` con cookie `httpOnly`, `secure` (en producción con HTTPS) y `sameSite: 'lax'`; se regenera el ID de sesión tras el login (`req.session.regenerate`) para evitar fijación; `logout` destruye la sesión en el servidor (`req.session.destroy`) y limpia la cookie del cliente.
- **Evidencia de prueba:** captura de las cabeceras `Set-Cookie` mostrando `HttpOnly`; prueba de que, tras hacer logout, volver a solicitar una ruta privada redirige a `/login` (la sesión ya no es válida en el servidor).

---

## 7. Validación de archivos subidos (extensión, MIME, tamaño y nombre)

- **Amenaza:** permitir la subida de cualquier archivo sin restricción posibilita subir scripts ejecutables o archivos maliciosos disfrazados de imagen (extension spoofing), agotar espacio en disco con archivos gigantes, o sobrescribir archivos existentes si se usa el nombre original del usuario.
- **Control aplicado:** `multer` configurado con `fileFilter` que valida extensión (`.jpg`, `.jpeg`, `.png`, `.webp`) **y** MIME type real; límite de tamaño (`limits: { fileSize }`); el nombre de archivo final es generado por el sistema (UUID o timestamp + extensión validada), nunca el nombre original enviado por el usuario, y se almacena en `uploads/` fuera del árbol servible directamente si aplica.
- **Evidencia de prueba:** intento de subir un archivo `.php` renombrado a `.jpg`: rechazado por validación de MIME real; intento de subir una imagen de 50 MB con límite de 5 MB configurado: rechazado con mensaje controlado; verificación de que el nombre almacenado en disco/BD no coincide con el nombre original del archivo subido.

---

## 8. Mensajes de error controlados

- **Amenaza:** exponer stack traces, mensajes de error de PostgreSQL o rutas internas del servidor al usuario final facilita a un atacante entender la estructura de la base de datos y del sistema (information disclosure) para preparar ataques dirigidos.
- **Control aplicado:** middleware centralizado de manejo de errores en Express que captura cualquier excepción, registra el detalle completo solo en el log del servidor, y devuelve al usuario un mensaje genérico (p. ej. "Ocurrió un error, intenta más tarde") junto con un código HTTP apropiado. `NODE_ENV=production` desactiva cualquier salida detallada de errores.
- **Evidencia de prueba:** forzar un error de base de datos (p. ej. FK inexistente) desde la interfaz: la respuesta al usuario es un mensaje genérico, mientras que el log del servidor (no visible al usuario) contiene el detalle real de PostgreSQL.

---

## 9. Principio de mínimo privilegio para el usuario PostgreSQL

- **Amenaza:** si la aplicación se conecta con un superusuario de PostgreSQL, cualquier vulnerabilidad de inyección SQL o error de lógica podría usarse para crear/eliminar bases de datos, roles, o acceder a esquemas fuera del alcance de la aplicación.
- **Control aplicado:** se crea un rol de aplicación dedicado (p. ej. `library_app`) con privilegios limitados únicamente a `SELECT, INSERT, UPDATE, DELETE` sobre las tablas del esquema de la librería, sin privilegios de `CREATEDB`, `CREATEROLE` ni `SUPERUSER`. La aplicación nunca se conecta como `postgres`.
- **Evidencia de prueba:** captura de `\du` en `psql` mostrando los atributos del rol `library_app` (sin `Superuser`, sin `Create role`, sin `Create DB`); intento desde ese rol de ejecutar `CREATE DATABASE` o `DROP TABLE` fuera del esquema autorizado, devolviendo error de permisos.

---

## 10. No publicar secretos en ubiquitous.udem.edu

- **Amenaza:** publicar por error `.env`, claves SSH, tokens o cadenas de conexión completas (usuario+contraseña+host) en el espacio web público del estudiante expone la infraestructura completa a cualquier visitante de la URL.
- **Control aplicado:** revisión manual antes de publicar del contenido de `~/html/ejercicio02/` verificando que no existan archivos `.env`, `id_rsa`/`id_ed25519`, ni cadenas de conexión con contraseña en claro dentro de `docs/`, `sql/` o capturas de pantalla; las capturas de `psql` se recortan/editan para ocultar contraseñas visibles en el prompt o en comandos ejecutados.
- **Evidencia de prueba:** navegación como usuario externo (ventana de incógnito) por todos los enlaces publicados verificando ausencia de secretos visibles; búsqueda de texto (`grep -ri "password\|secret\|BEGIN.*PRIVATE KEY"`) sobre el contenido publicado antes del despliegue final, sin coincidencias.

---

## Resumen de riesgo residual

| Control | Riesgo residual tras mitigación |
|---|---|
| Hash de contraseñas | Ataques de fuerza bruta si no hay límite de intentos (mitigar con rate limiting a futuro) |
| Variables de entorno | Error humano al copiar `.env` manualmente al servidor de producción |
| SQL parametrizado | No cubre lógica de negocio insegura (p. ej. IDOR si no se valida propiedad del recurso) |
| Validación server-side | No sustituye pruebas exhaustivas de todos los casos límite |
| Autorización por rol | Depende de que el middleware se aplique en *todas* las rutas nuevas que se agreguen |
| Sesiones | Sin HTTPS real en el entorno de práctica, la cookie `secure` no aplica completamente |
| Uploads | Validación de MIME por cabecera puede ser insuficiente ante archivos polyglot muy sofisticados |
| Mensajes de error | Requiere disciplina continua para no reintroducir `console.log(err)` hacia el cliente |
| Mínimo privilegio en PostgreSQL | No protege contra abuso de privilegios legítimos ya otorgados a `library_app` |
| No publicar secretos | Depende de revisión manual antes de cada publicación; recomendable automatizar con un script de verificación |
