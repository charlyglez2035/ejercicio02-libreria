# TEST_PLAN.md

**Proyecto:** Aplicación Web Monolítica para Gestión de una Librería
**Parte 7 — Punto 18. Plan de pruebas**

Cada caso de prueba documenta: ID, requisito relacionado, precondición, entrada, pasos, resultado esperado, resultado observado, estado y evidencia. El campo **Resultado observado** y **Estado** se completan al ejecutar cada prueba sobre el sistema desplegado; una captura sin esta explicación no constituye evidencia por sí sola. El mismo contenido de esta matriz está disponible en formato Excel en `docs/TEST_PLAN.xlsx`.

Leyenda de estado: `Pendiente` (aún no ejecutada) · `Pasó` · `Falló`.

---

| ID | Requisito | Precondición | Entrada | Pasos | Resultado esperado | Resultado observado | Estado | Evidencia |
|---|---|---|---|---|---|---|---|---|
| TC-01 | RF-01 Login | Usuario registrado existe en BD | email + contraseña correctos | 1. Ir a /login 2. Ingresar credenciales 3. Enviar formulario | Sesión creada, redirección a catálogo | Pendiente | Pendiente | screenshots/tc01_login_ok.png |
| TC-02 | RF-01 Login | Usuario registrado existe en BD | email correcto, contraseña incorrecta | 1. Ir a /login 2. Ingresar contraseña errónea 3. Enviar | Error controlado "credenciales inválidas", sin sesión creada | Pendiente | Pendiente | screenshots/tc02_login_fail.png |
| TC-03 | RF-01 Logout | Sesión activa | Click en "Cerrar sesión" | 1. Autenticado, click logout 2. Intentar acceder a ruta privada | Sesión destruida; ruta privada redirige a /login | Pendiente | Pendiente | screenshots/tc03_logout.png |
| TC-04 | RF-03 Búsqueda | Catálogo con libros sembrados | Título parcial existente | 1. Ir a /library 2. Buscar por título | Resultados filtrados que contienen el término | Pendiente | Pendiente | screenshots/tc04_busqueda_titulo.png |
| TC-05 | RF-03 Búsqueda | Catálogo con libros sembrados | ISBN exacto existente | 1. Buscar por campo ISBN | Se muestra el libro correspondiente al ISBN | Pendiente | Pendiente | screenshots/tc05_busqueda_isbn.png |
| TC-06 | RF-04 CRUD Libros (Crear) | Sesión de Administrador | Datos válidos de un libro nuevo | 1. /admin/libros/nuevo 2. Llenar formulario 3. Guardar | Libro insertado, aparece en catálogo | Pendiente | Pendiente | screenshots/tc06_crear_libro.png |
| TC-07 | RF-04 CRUD Libros (Leer) | Libro existente | isbn del libro | 1. Ir al detalle del libro | Se muestran todos los datos del libro (autores, géneros, conceptos, imágenes) | Pendiente | Pendiente | screenshots/tc07_detalle_libro.png |
| TC-08 | RF-04 CRUD Libros (Actualizar) | Sesión Admin, libro existente | Nuevo precio/stock | 1. Editar libro 2. Cambiar precio 3. Guardar | Cambios reflejados en BD y en la vista | Pendiente | Pendiente | screenshots/tc08_editar_libro.png |
| TC-09 | RF-04 CRUD Libros (Eliminar) | Sesión Admin, libro sin dependencias críticas | isbn a eliminar | 1. Eliminar libro 2. Confirmar | Libro eliminado, ya no aparece en catálogo | Pendiente | Pendiente | screenshots/tc09_eliminar_libro.png |
| TC-10 | RF-04 CRUD Autores | Sesión Admin | Nombre de autor nuevo | 1. Crear 2. Editar 3. Eliminar autor sin libros asociados | Cada operación se refleja correctamente | Pendiente | Pendiente | screenshots/tc10_crud_autores.png |
| TC-11 | RF-04 CRUD Géneros | Sesión Admin | Nombre de género nuevo | 1. Crear 2. Editar 3. Eliminar género sin libros asociados | Cada operación se refleja correctamente | Pendiente | Pendiente | screenshots/tc11_crud_generos.png |
| TC-12 | RF-04 CRUD Formatos | Sesión Admin | Nombre de formato nuevo | 1. Crear 2. Editar 3. Eliminar | Cada operación se refleja correctamente | Pendiente | Pendiente | screenshots/tc12_crud_formatos.png |
| TC-13 | RF-04 CRUD Categorías | Sesión Admin | Nombre de categoría nueva | 1. Crear 2. Editar 3. Eliminar | Cada operación se refleja correctamente | Pendiente | Pendiente | screenshots/tc13_crud_categorias.png |
| TC-14 | RF-04 CRUD Conceptos | Sesión Admin, libro existente | Concepto + definición | 1. Agregar concepto a libro 2. Editar definición 3. Eliminar | Concepto y definición asociados correctamente al libro | Pendiente | Pendiente | screenshots/tc14_crud_conceptos.png |
| TC-15 | RNF Seguridad — Autorización Visitante | Sin sesión iniciada | GET a ruta privada (/library) | 1. Sin login, solicitar /library | Redirección a /login, acceso denegado | Pendiente | Pendiente | screenshots/tc15_visitante_bloqueado.png |
| TC-16 | RNF Seguridad — Autorización Usuario registrado | Sesión de usuario no-admin | GET a /admin/libros/nuevo | 1. Autenticado como usuario regular 2. Solicitar ruta admin | HTTP 403 / acceso denegado controlado | Pendiente | Pendiente | screenshots/tc16_usuario_bloqueado.png |
| TC-17 | RNF Seguridad — Autorización Administrador | Sesión de Administrador | GET a cualquier ruta admin | 1. Autenticado como admin 2. Solicitar CRUD administrativo | Acceso concedido, funcionalidad disponible | Pendiente | Pendiente | screenshots/tc17_admin_acceso.png |
| TC-18 | RNF Integridad BD — ISBN único | Libro con isbn "X" ya existe | Insertar libro con mismo isbn "X" | 1. Intentar crear libro duplicado | PostgreSQL rechaza por UNIQUE; mensaje de error controlado al usuario | Pendiente | Pendiente | screenshots/tc18_isbn_duplicado.png |
| TC-19 | RNF Integridad BD — Stock ≥ 0 | Formulario de libro | stock = -5 | 1. Intentar guardar libro con stock negativo | Rechazado por CHECK / validación server-side | Pendiente | Pendiente | screenshots/tc19_stock_negativo.png |
| TC-20 | RNF Integridad BD — Precio válido | Formulario de libro | precio = -100 o no numérico | 1. Intentar guardar libro con precio inválido | Rechazado por CHECK / validación server-side | Pendiente | Pendiente | screenshots/tc20_precio_invalido.png |
| TC-21 | RNF Integridad BD — FK válida | Formulario de libro | id_formato inexistente | 1. Intentar guardar libro con formato inexistente | Rechazado por restricción de FK | Pendiente | Pendiente | screenshots/tc21_fk_inexistente.png |
| TC-22 | RNF Integridad BD — Eliminación protegida | Autor con libros asociados | Eliminar ese autor | 1. Intentar eliminar autor referenciado en book_authors | Rechazado (RESTRICT) o manejado según regla ON DELETE definida y documentada | Pendiente | Pendiente | screenshots/tc22_eliminacion_protegida.png |
| TC-23 | RF-07 Administrador único | Ya existe un usuario con rol admin | Intentar registrar/promover un segundo admin | 1. Crear segundo usuario con rol admin | Rechazado por restricción de BD (índice único parcial / trigger) | Pendiente | Pendiente | screenshots/tc23_segundo_admin.png |
| TC-24 | RNF Seguridad — Validación de campos | Formulario de libro/autor | Campo obligatorio vacío enviado directo al backend (curl/Postman) | 1. POST sin pasar por el HTML, campo requerido vacío | Servidor rechaza con validación propia, no depende del frontend | Pendiente | Pendiente | screenshots/tc24_validacion_server.png |
| TC-25 | RNF Seguridad — Validación de archivos | Formulario de carga de imagen | Archivo .exe renombrado a .jpg | 1. Subir archivo con extensión falsa | Rechazado por validación de MIME real | Pendiente | Pendiente | screenshots/tc25_archivo_invalido.png |
| TC-26 | RNF Seguridad — Tamaño de archivo | Formulario de carga de imagen | Imagen de tamaño mayor al límite configurado | 1. Subir imagen que excede el límite | Rechazado con mensaje controlado | Pendiente | Pendiente | screenshots/tc26_archivo_grande.png |
| TC-27 | RF-05 Relación libro-autor | Libro y ≥2 autores existentes | Asociar 2 autores a un libro | 1. Editar libro 2. Seleccionar múltiples autores 3. Guardar | Ambas relaciones creadas en book_authors, visibles en el detalle | Pendiente | Pendiente | screenshots/tc27_libro_autor.png |
| TC-28 | RF-05 Relación libro-género | Libro y ≥2 géneros existentes | Asociar 2 géneros a un libro | 1. Editar libro 2. Seleccionar múltiples géneros 3. Guardar | Ambas relaciones creadas en book_genres, visibles en el detalle | Pendiente | Pendiente | screenshots/tc28_libro_genero.png |
| TC-29 | RF-06 Relación libro-concepto | Libro de Cloud Computing existente | Conceptos IaaS, PaaS, SaaS con definición propia | 1. Agregar cada concepto con su definición al libro | Cada definición queda asociada específicamente a ese libro (book_concepts) | Pendiente | Pendiente | screenshots/tc29_libro_concepto.png |
| TC-30 | RNF Seguridad — SQL Injection | Cualquier campo de búsqueda o formulario | `' OR '1'='1` y `'; DROP TABLE books; --` | 1. Ingresar payload en campo de búsqueda/login 2. Enviar | Tratado como texto literal; sin alteración de la consulta ni pérdida de datos | Pendiente | Pendiente | screenshots/tc30_sql_injection.png |
| TC-31 | RNF Despliegue — Reverse proxy | Apache/NGINX configurado, Node en 127.0.0.1:3000 | Navegar a http://IP_SERVIDOR/library | 1. Acceso externo vía navegador al prefijo /library | Aplicación funcional completa (rutas, estáticos, formularios, imágenes) bajo el prefijo | Pendiente | Pendiente | screenshots/tc31_reverse_proxy.png |
| TC-32 | RNF Usabilidad — Navegación básica | Sesión de usuario registrado | Navegación por menú principal | 1. Recorrer catálogo, detalle, login/logout desde el menú | Navegación fluida, sin enlaces rotos ni errores 404/500 | Pendiente | Pendiente | screenshots/tc32_navegacion.png |

---

## Cobertura de la matriz respecto a lo solicitado

- Funcionales de login/logout/búsqueda/CRUD → TC-01 a TC-14
- Autorización por rol (visitante, registrado, admin) → TC-15 a TC-17
- Pruebas negativas de BD y restricciones → TC-18 a TC-22
- Administrador único → TC-23
- Validación de campos y archivos → TC-24 a TC-26
- Relaciones libro-autor, libro-género, libro-concepto → TC-27 a TC-29
- SQL con caracteres especiales (parametrización) → TC-30
- Despliegue con reverse proxy → TC-31
- Navegación y usabilidad → TC-32

Total: **32 casos de prueba** (mínimo requerido: 15), cubriendo todas las categorías solicitadas en el punto 18.
