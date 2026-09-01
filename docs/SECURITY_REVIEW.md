# SECURITY_REVIEW.md
## Revisión de Seguridad
### Aplicación Web Monolítica para Gestión de una Librería

**Materia:** Integración de Aplicaciones Computacionales  
**Ejercicio:** Ejercicio 02  
**Fecha:** 31/08/2026  

---

## 1. Objetivo

Este documento registra la revisión de seguridad de la aplicación web monolítica de librería desarrollada con Node.js, Express, EJS y PostgreSQL.

La revisión identifica amenazas relevantes para la aplicación, los controles implementados y la evidencia utilizada para comprobar su funcionamiento.

Los principales riesgos considerados son:

- Robo o exposición de contraseñas.
- SQL Injection.
- Acceso no autorizado.
- Elevación de privilegios.
- Exposición de credenciales.
- Manipulación de sesiones.
- Subida de archivos no permitidos.
- Exposición de errores internos.
- Uso excesivo de privilegios en PostgreSQL.
- Publicación accidental de secretos.
- Violación de restricciones de integridad.
- Creación de más de un Administrador.

---

## 2. Resumen de controles

| ID | Amenaza | Control aplicado | Evidencia esperada | Estado |
|---|---|---|---|---|
| SEC-01 | Exposición de contraseñas | Hash con bcrypt antes de almacenar contraseñas | Consulta a `users` mostrando `password_hash` | Implementado |
| SEC-02 | Contraseñas débiles | Política mínima de 8 caracteres y validación server-side | Registro con contraseña menor a 8 caracteres rechazado | Implementado |
| SEC-03 | Exposición de secretos | Credenciales y secreto de sesión almacenados en `.env` | `git check-ignore -v .env` | Implementado |
| SEC-04 | SQL Injection | Consultas parametrizadas con `$1`, `$2`, etc. mediante `pg` | Revisión de `services/` y prueba con caracteres especiales | Implementado |
| SEC-05 | Manipulación de validaciones HTML | Validación server-side antes de ejecutar consultas | Precio/stock inválidos rechazados en servidor | Implementado |
| SEC-06 | Acceso administrativo no autorizado | Middleware de autenticación y autorización separado | Usuario `USER` recibe HTTP 403 al entrar a `/admin` | Implementado |
| SEC-07 | Secuestro o reutilización de sesión | Cookies `httpOnly`, `sameSite`, expiración, regeneración al login y destrucción al logout | Login/logout y acceso posterior a ruta privada | Implementado |
| SEC-08 | Subida de archivos peligrosos | Multer valida extensión, MIME, tamaño y genera nombre interno | JPG/PNG/WebP aceptado y archivo inválido rechazado | Implementado |
| SEC-09 | Exposición de información interna | Middleware centralizado de errores y mensajes controlados | Error de ISBN duplicado sin mostrar SQL de PostgreSQL | Implementado |
| SEC-10 | Compromiso de PostgreSQL | Usuario `library_app` sin privilegios de superusuario | `SELECT current_user` y revisión de roles | Implementado |
| SEC-11 | Segundo Administrador | Índice único parcial en PostgreSQL y control de aplicación | Intento de segundo `ADMIN` rechazado | Implementado |
| SEC-12 | Valores inválidos en BD | Restricciones PK, FK, UNIQUE y CHECK | Pruebas negativas de integridad | Implementado |
| SEC-13 | Publicación de secretos | `.env`, llaves y tokens excluidos de Git/publicación | Revisión de `.gitignore` y archivos rastreados | Implementado |
| SEC-14 | Exposición directa de Node.js | Node escucha en `127.0.0.1:3000` | Terminal mostrando dirección de escucha | Implementado localmente |

---

# 3. Revisión detallada

## SEC-01 — Hash seguro de contraseñas

### Amenaza

Si las contraseñas fueran almacenadas en texto plano, una persona con acceso a la base de datos podría conocer inmediatamente las credenciales de todos los usuarios.

### Control aplicado

Las contraseñas son procesadas mediante `bcrypt` antes de ser almacenadas.

Durante el registro se utiliza:

```text
bcrypt.hash(password, SALT_ROUNDS)