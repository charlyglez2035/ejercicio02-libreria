# DB_VERIFICATION.md
## Verificación de Stored Procedures, Triggers, Vistas, Conteos, Relaciones e Integridad
### Aplicación Web Monolítica para Gestión de una Librería

**Materia:** Integración de Aplicaciones Computacionales
**Documento:** Parte 4, punto 10 — Verificación de base de datos mediante `psql`
**Fecha:** 31/08/26

---

## 1. Objetivo y alcance

Este documento registra la verificación, mediante `psql`, de los objetos de base de datos definidos para
el ejercicio: 3 stored procedures/funciones, 3 triggers, 3 vistas, conteos por tabla, relaciones (llaves
foráneas) e integridad referencial. La metodología es **antes/después**: se documenta primero el estado
base del esquema (solo tablas, restricciones y datos semilla) y después el estado una vez creados los
procedimientos, triggers y vistas, para dejar evidencia explícita de qué agregó cada script.

No se incluyen en este documento contraseñas, hashes, tokens ni otros datos sensibles. Las capturas de
pantalla referenciadas se anexan por separado en `docs/evidence/`.

---

## 2. Orden de ejecución de los scripts

| # | Script | Contenido | Estado |
|---|--------|-----------|--------|
| 1 | `db/00_create_database.sql` | Rol de aplicación `library_app` y base de datos `library_db`. | ✅ Ejecutado previamente |
| 2 | `db/01_schema.sql` | Esquema normalizado a 4FN: 11 tablas, PK/FK/UNIQUE/CHECK, índices únicos parciales. | ✅ Ejecutado previamente |
| 3 | `db/02_seed_30_per_table.sql` | Datos sintéticos (≥30 filas por tabla base). | ✅ Ejecutado previamente |
| 4 | `db/03_all_quieries_before_stored_procedures.sql` | Verificación de línea base (estructura, conteos, relaciones, integridad) **antes** de crear sp/triggers/vistas. | ☐ Pendiente de captura |
| 5 | `db/04_stored_procedures.sql` | 2 stored procedures + 1 función. | ☐ Pendiente de captura |
| 6 | `db/05_triggers.sql` | 3 triggers + tabla de auditoría. | ☐ Pendiente de captura |
| 7 | `db/06_views.sql` | 3 vistas. | ☐ Pendiente de captura |
| 8 | `db/03_all_quieries_before_stored_procedures.sql` (segunda corrida) | Misma verificación, ahora **después** de 04-06, para contraste. | ☐ Pendiente de captura |

> Marca cada casilla y agrega la ruta real de la captura correspondiente conforme vayas ejecutando los
> comandos del paso a paso.

---

## 3. Metodología de verificación

Toda la verificación se realizó mediante `psql` conectado a `library_db` como administrador de la base de
datos (`postgres`), dado que `library_app` no tiene privilegios `CREATE` (principio de mínimo privilegio,
RNF-13). Se combinaron:

- **Comandos meta de `psql`** (`\dt`, `\d+`, `\df`, `\dv`, `\du`) para inspeccionar catálogo del sistema.
- **Consultas SQL contra `information_schema`** para listar triggers y llaves foráneas de forma tabular y
  reproducible.
- **Pruebas funcionales** (`CALL`, `SELECT * FROM vista/función`) para demostrar que cada objeto no solo
  existe, sino que se comporta según el requisito funcional que lo origina.
- **Pruebas negativas** (N1–N6) para demostrar que las restricciones de integridad rechazan datos inválidos.

---

## 4. Stored Procedures y Funciones (`db/04_stored_procedures.sql`)

| Objeto | Tipo | RF/RNF que satisface | Propósito |
|--------|------|----------------------|-----------|
| `sp_create_book_with_relations` | PROCEDURE | RF-06, RF-12, RF-13 | Crea un libro y sus asociaciones N:M con autores y géneros en una sola unidad transaccional. |
| `sp_set_book_cover` | PROCEDURE | RF-16 | Marca una imagen como portada de un libro, validando pertenencia; delega en el trigger de portada única el des-marcado automático de la anterior. |
| `fn_search_books` | FUNCTION | RF-05 | Búsqueda de libros por ISBN exacto o coincidencia parcial de título, reutilizable desde `services/libroService.js`. |

### 4.1 Verificación de existencia

```sql
\df public.*
```

📸 **Evidencia:** `docs/evidence/04_functions_list.png`
*(Debe mostrar `sp_create_book_with_relations` y `sp_set_book_cover` con Type = `proc`, y `fn_search_books`
con Type = `func`.)*

### 4.2 Prueba funcional

```sql
CALL sp_create_book_with_relations(
    '9780000000999','Libro de Prueba',2026,15.00,5,1,1,
    ARRAY[1,2]::BIGINT[], ARRAY[1]::BIGINT[], NULL
);

SELECT * FROM v_book_catalog WHERE isbn = '9780000000999';

SELECT * FROM fn_search_books('tolkien');  -- ajustar al dato real del seed
```

📸 **Evidencia:** `docs/evidence/04_functional_test.png`

> Nota: esta prueba inserta una fila real en `books`. Si se quiere conservar la base en su estado de
> semilla, eliminarla después con `DELETE FROM books WHERE isbn = '9780000000999';` (el `ON DELETE CASCADE`
> limpia automáticamente sus filas en `book_authors`/`book_genres`).

---

## 5. Triggers (`db/05_triggers.sql`)

| Objeto | Evento | RF/RNF que satisface | Propósito |
|--------|--------|----------------------|-----------|
| `trg_book_images_single_cover` | `BEFORE INSERT OR UPDATE` en `book_images` | RF-16 | Al marcar una imagen como portada, desmarca automáticamente la portada anterior del mismo libro. |
| `trg_users_single_admin` | `BEFORE INSERT OR UPDATE` en `users` | RF-20, RNF-06 | Defensa adicional (independiente del índice único parcial) contra un segundo Administrador, con mensaje de error propio. |
| `trg_books_audit_price_stock` | `AFTER UPDATE` en `books` | RNF-10, RF-18, RF-19 | Registra cada cambio de precio o stock en `book_price_stock_audit` para trazabilidad. |

### 5.1 Verificación de existencia

```sql
SELECT event_object_table AS tabla, trigger_name, event_manipulation, action_timing
FROM information_schema.triggers
ORDER BY event_object_table, trigger_name;
```

📸 **Evidencia:** `docs/evidence/05_triggers_list.png`

### 5.2 Pruebas funcionales

**Portada automática:**
```sql
SELECT image_id, is_cover FROM book_images WHERE book_id = 1;
CALL sp_set_book_cover(1, 2);  -- usar un image_id real perteneciente al libro 1
SELECT image_id, is_cover FROM book_images WHERE book_id = 1;
```
📸 `docs/evidence/05_cover_before_after.png`

**Administrador único:**
```sql
INSERT INTO users (email, password_hash, role)
VALUES ('segundo.admin@example.edu', 'hash_de_prueba', 'ADMIN');
```
📸 `docs/evidence/05_single_admin_error.png`
*(El error debe mostrar el mensaje propio del trigger, no el genérico de PostgreSQL.)*

**Auditoría de precio/stock:**
```sql
UPDATE books SET stock = stock - 1 WHERE book_id = 1;
SELECT * FROM book_price_stock_audit ORDER BY audit_id DESC LIMIT 1;
```
📸 `docs/evidence/05_audit_row.png`

---

## 6. Vistas (`db/06_views.sql`)

| Objeto | RF/RNF que satisface | Propósito |
|--------|----------------------|-----------|
| `v_book_catalog` | RF-04, RF-05 | Listado de catálogo con formato, categoría, portada, autores y géneros agregados en una sola fila por libro. |
| `v_book_concepts_detail` | RF-14 | Definiciones de conceptos por libro, con nombre del concepto. |
| `v_users_safe` | RNF-01 | Listado de usuarios sin exponer `password_hash`. |

### 6.1 Verificación de existencia

```sql
\dv
```

📸 **Evidencia:** `docs/evidence/06_views_list.png`

### 6.2 Prueba funcional

```sql
SELECT * FROM v_book_catalog LIMIT 5;
SELECT * FROM v_book_concepts_detail LIMIT 5;
SELECT * FROM v_users_safe LIMIT 5;
```
📸 `docs/evidence/06_views_output.png`
*(Confirmar visualmente que `v_users_safe` no incluye la columna `password_hash`.)*

---

## 7. Conteos por tabla

Valores esperados según `db/02_seed_30_per_table.sql` (todas las tablas base con ≥30 filas; las tablas
puente con más de 30 para poder probar relaciones N:M):

| Tabla | Filas esperadas (seed) | Filas reales (captura) |
|-------|------------------------:|--------------------------|
| formats | 30 | _completar_ |
| categories | 30 | _completar_ |
| authors | 30 | _completar_ |
| genres | 30 | _completar_ |
| concepts | 30 | _completar_ |
| users | 30 | _completar_ |
| books | 31 | _completar_ |
| book_authors | 60 | _completar_ |
| book_genres | 60 | _completar_ |
| book_concepts | 69 | _completar_ |
| book_images | 61 | _completar_ |

```sql
SELECT 'formats' AS tabla, count(*) FROM formats
UNION ALL SELECT 'categories', count(*) FROM categories
UNION ALL SELECT 'authors', count(*) FROM authors
UNION ALL SELECT 'genres', count(*) FROM genres
UNION ALL SELECT 'concepts', count(*) FROM concepts
UNION ALL SELECT 'users', count(*) FROM users
UNION ALL SELECT 'books', count(*) FROM books
UNION ALL SELECT 'book_authors', count(*) FROM book_authors
UNION ALL SELECT 'book_genres', count(*) FROM book_genres
UNION ALL SELECT 'book_concepts', count(*) FROM book_concepts
UNION ALL SELECT 'book_images', count(*) FROM book_images
ORDER BY 1;
```

📸 **Evidencia:** `docs/evidence/07_row_counts.png`

> Nota: si ya ejecutaste las pruebas funcionales de la sección 4.2 (que insertan un libro de prueba) antes
> de tomar esta captura, `books`, `book_authors` y `book_genres` mostrarán una fila adicional respecto al
> valor esperado del seed. Documenta esa diferencia en vez de forzarla a coincidir.

---

## 8. Relaciones e integridad referencial

Llaves foráneas definidas en `db/01_schema.sql` y `db/05_triggers.sql`, con su regla `ON DELETE`:

| Tabla origen | Columna | Tabla referenciada | Columna referenciada | ON DELETE | Justificación |
|---|---|---|---|---|---|
| books | format_id | formats | format_id | RESTRICT | Protege el catálogo de formatos mientras existan libros que lo usen. |
| books | category_id | categories | category_id | RESTRICT | Protege el catálogo de categorías mientras existan libros que lo usen. |
| book_authors | book_id | books | book_id | CASCADE | Al borrar un libro, sus asociaciones de autoría dejan de tener sentido. |
| book_authors | author_id | authors | author_id | RESTRICT | Protege a un autor que aún está referenciado por algún libro. |
| book_genres | book_id | books | book_id | CASCADE | Al borrar un libro, sus asociaciones de género dejan de tener sentido. |
| book_genres | genre_id | genres | genre_id | RESTRICT | Protege un género que aún está referenciado por algún libro. |
| book_concepts | book_id | books | book_id | CASCADE | La definición del concepto pertenece exclusivamente a ese libro. |
| book_concepts | concept_id | concepts | concept_id | RESTRICT | Protege un concepto reutilizable que aún está referenciado. |
| book_images | book_id | books | book_id | CASCADE | Las imágenes son metadatos dependientes del libro. |
| book_price_stock_audit | book_id | books | book_id | CASCADE | El historial de auditoría pertenece al libro que lo originó. |

Consulta usada para generar/confirmar esta tabla:
```sql
SELECT
    tc.table_name, kcu.column_name,
    ccu.table_name AS tabla_referenciada, ccu.column_name AS columna_referenciada,
    rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
     ON tc.constraint_name = ccu.constraint_name AND tc.table_schema = ccu.table_schema
JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name;
```

📸 **Evidencia:** `docs/evidence/08_foreign_keys.png`

### 8.1 Restricciones CHECK / UNIQUE relevantes

| Tabla | Restricción | Tipo | Regla de negocio |
|---|---|---|---|
| books | uq_books_isbn | UNIQUE | ISBN no se repite (RF-06). |
| books | chk_books_price_nonnegative | CHECK | `price >= 0` (RF-19). |
| books | chk_books_stock_nonnegative | CHECK | `stock >= 0` (RF-18). |
| users | uq_users_email | UNIQUE | Correo como identificador de login. |
| users | chk_users_role | CHECK | Solo roles `USER`/`ADMIN`. |
| users | uq_users_single_admin (índice único parcial) | UNIQUE parcial | Máximo un Administrador (RF-20). |
| book_images | uq_book_images_one_cover_per_book (índice único parcial) | UNIQUE parcial | Máximo una portada activa por libro (RF-16), reforzado por `trg_book_images_single_cover`. |

---

## 9. Pruebas negativas de integridad (N1–N6)

Definidas al final de `db/01_schema.sql`. Descomentar y ejecutar una por una; **todas deben fallar**.

| # | Prueba | Restricción que la rechaza | Resultado esperado |
|---|--------|------------------------------|---------------------|
| N1 | ISBN duplicado | `uq_books_isbn` | Error de violación de unicidad. |
| N2 | Stock negativo | `chk_books_stock_nonnegative` | Error de violación de CHECK. |
| N3 | Precio negativo | `chk_books_price_nonnegative` | Error de violación de CHECK. |
| N4 | FK inexistente (`format_id` = 999999) | `fk_books_format` | Error de violación de llave foránea. |
| N5 | Borrar un autor referenciado | `fk_book_authors_author` (`ON DELETE RESTRICT`) | Error de violación de llave foránea. |
| N6 | Segundo Administrador | `uq_users_single_admin` **y** `trg_users_single_admin` | Error (mensaje propio del trigger si se ejecuta después de `db/05_triggers.sql`). |

📸 **Evidencia:** `docs/evidence/09_negative_test_N1.png` … `docs/evidence/09_negative_test_N6.png`
*(una captura por prueba, mostrando el mensaje de error completo)*

---

## 10. Checklist de evidencia fotográfica

- [ ] `03_baseline_before.png` — salida completa de `db/03_all_quieries_before_stored_procedures.sql` (antes)
- [ ] `04_functions_list.png` — `\df public.*`
- [ ] `04_functional_test.png` — `CALL sp_create_book_with_relations(...)`
- [ ] `05_triggers_list.png` — consulta a `information_schema.triggers`
- [ ] `05_cover_before_after.png` — portada antes/después
- [ ] `05_single_admin_error.png` — error de segundo Administrador
- [ ] `05_audit_row.png` — fila nueva en `book_price_stock_audit`
- [ ] `06_views_list.png` — `\dv`
- [ ] `06_views_output.png` — `SELECT * FROM` cada vista
- [ ] `07_row_counts.png` — conteos por tabla
- [ ] `08_foreign_keys.png` — llaves foráneas y `ON DELETE`
- [ ] `09_negative_test_N1.png` … `N6.png` — las 6 pruebas negativas
- [ ] `03_baseline_after.png` — segunda corrida de `db/03_all_quieries_before_stored_procedures.sql` (después)

---

## 11. Resumen de trazabilidad

| Entregable | RF/RNF relacionado | Script | Sección de este documento |
|---|---|---|---|
| Verificación de línea base | RNF-06, RNF-10 | `db/03_all_quieries_before_stored_procedures.sql` | §7, §8 |
| Stored procedures / funciones | RF-05, RF-06, RF-12, RF-13, RF-16 | `db/04_stored_procedures.sql` | §4 |
| Triggers | RF-16, RF-20, RNF-06, RNF-10 | `db/05_triggers.sql` | §5 |
| Vistas | RF-04, RF-05, RF-14, RNF-01 | `db/06_views.sql` | §6 |
| Pruebas de integridad | RNF-06 | `db/01_schema.sql` (N1–N6) | §9 |
