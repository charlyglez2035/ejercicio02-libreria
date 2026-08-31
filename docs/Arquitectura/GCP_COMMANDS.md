# GCP_COMMANDS.md
## Infraestructura GCP para la Aplicación Web Monolítica de una Librería

**Materia:** Integración de Aplicaciones Computacionales  
**Documento:** Comandos de infraestructura de Google Cloud Platform (Parte 4, punto 9)  
**Fecha:** 30/08/26

---

## 1. Objetivo y alcance

Este documento registra los comandos utilizados para preparar la infraestructura del ejercicio mediante
**Google Cloud SDK CLI (`gcloud`)**. La solución utiliza una sola instancia de **Google Compute Engine**
con **CentOS Stream 10**, destinada a ejecutar PostgreSQL, la aplicación monolítica Node.js/Express/EJS
y posteriormente Apache o NGINX como reverse proxy.

El entorno corresponde a una práctica académica y no a una carga productiva. Por esta razón no se
implementan balanceadores de carga, grupos administrados de instancias ni alta disponibilidad multizona.

No se incluyen en este documento contraseñas, tokens, llaves privadas, archivos `.env`, credenciales de
PostgreSQL ni otros secretos.

---

## 2. Comandos previos de administración de GCP

Antes de crear la instancia se utilizaron comandos de `gcloud` para revisar la cuenta activa, proyectos y
configuración disponible.

### 2.1 Consultar las cuentas autenticadas

```bash
gcloud auth list
```

Este comando muestra las cuentas de Google Cloud registradas en el equipo e identifica cuál se encuentra
activa.

### 2.2 Iniciar sesión con otra cuenta

```bash
gcloud auth login
```

Se utiliza cuando es necesario autenticar una cuenta diferente en Google Cloud SDK CLI.

### 2.3 Consultar organizaciones disponibles

```bash
gcloud organizations list
```

Permite verificar las organizaciones asociadas a la cuenta autenticada.

### 2.4 Crear un proyecto

El formato utilizado para crear un proyecto desde la terminal es:

```bash
gcloud projects create PROJECT_ID --name="NOMBRE_DEL_PROYECTO"
```

`PROJECT_ID` y `NOMBRE_DEL_PROYECTO` deben sustituirse por los valores correspondientes al proyecto.

### 2.5 Consultar proyectos existentes

```bash
gcloud projects list
```

Permite visualizar los proyectos disponibles para la cuenta activa.

### 2.6 Eliminar un proyecto

En caso de requerirse la eliminación de un proyecto de prueba:

```bash
gcloud projects delete PROJECT_ID
```

Este comando debe utilizarse con precaución porque elimina el proyecto seleccionado y sus recursos
asociados.

---

## 3. Región y zona seleccionadas

La instancia se creó en la siguiente ubicación:

| Elemento | Valor |
|---|---|
| Región | `northamerica-south1` |
| Zona | `northamerica-south1-c` |

La zona fue indicada directamente en el comando de creación de la instancia mediante:

```bash
--zone=northamerica-south1-c
```

### Justificación

Se seleccionó `northamerica-south1-c`, perteneciente a la región `northamerica-south1`, por ser una
ubicación adecuada para un entorno académico desplegado en Google Cloud.

El ejercicio requiere una sola máquina virtual y no especifica alta disponibilidad entre distintas zonas.
Por lo tanto, utilizar una única zona reduce la complejidad de la infraestructura y es suficiente para
desarrollo, pruebas y demostración de la aplicación.

---

## 4. Creación de la instancia de Compute Engine

La instancia de Compute Engine se creó con el siguiente comando:

```bash
gcloud compute instances create maquina02   --machine-type=e2-standard-2   --image-family=centos-stream-10   --image-project=centos-cloud   --zone=northamerica-south1-c
```

### 4.1 Configuración seleccionada

| Elemento | Configuración |
|---|---|
| Nombre de la instancia | `maquina02` |
| Servicio | Google Compute Engine |
| Sistema operativo | CentOS Stream 10 |
| Familia de imagen | `centos-stream-10` |
| Proyecto de imagen | `centos-cloud` |
| Tipo de máquina | `e2-standard-2` |
| vCPU | 2 |
| Memoria RAM | 8 GB |
| Región | `northamerica-south1` |
| Zona | `northamerica-south1-c` |

### 4.2 Justificación del dimensionamiento

Se seleccionó el tipo de máquina **`e2-standard-2`**, con **2 vCPU y 8 GB de memoria RAM**, para disponer
de recursos suficientes para ejecutar simultáneamente los componentes requeridos por el ejercicio:

- CentOS Stream 10.
- PostgreSQL.
- Node.js.
- Express.
- EJS.
- Apache o NGINX como reverse proxy.

El volumen de datos previsto es pequeño y corresponde a un entorno de prueba, por lo que no se espera alta
concurrencia ni una carga de procesamiento elevada. Sin embargo, ejecutar la aplicación, PostgreSQL y el
servidor web en la misma máquina requiere memoria suficiente para evitar que el entorno de desarrollo y
demostración quede limitado por recursos.

La instancia `e2-standard-2` ofrece un margen cómodo para estas tareas sin introducir la complejidad de una
arquitectura con múltiples servidores. Para un entorno productivo real sería necesario volver a evaluar el
dimensionamiento con base en métricas de uso, concurrencia, disponibilidad y costo.

---

## 5. Verificación de la instancia

Para consultar las instancias de Compute Engine disponibles en el proyecto:

```bash
gcloud compute instances list
```

Este comando permite verificar, entre otros datos:

- nombre de la instancia;
- zona;
- tipo de máquina;
- dirección IP;
- estado de ejecución.

Para consultar la configuración detallada de `maquina02`:

```bash
gcloud compute instances describe maquina02   --zone=northamerica-south1-c
```

---

## 6. Conexión mediante SSH

Para conectarse a la instancia mediante Google Cloud SDK CLI:

```bash
gcloud compute ssh maquina02   --zone=northamerica-south1-c
```

También puede utilizarse el formato con usuario explícito cuando sea necesario:

```bash
gcloud compute ssh USUARIO@maquina02   --zone=northamerica-south1-c
```

Una vez conectado a la máquina virtual, el sistema operativo puede verificarse con:

```bash
cat /etc/os-release
```

La salida debe identificar el sistema como **CentOS Stream 10**.

---

## 7. Reglas de firewall necesarias

La infraestructura requiere acceso a los siguientes puertos:

| Puerto | Protocolo | Función |
|---:|---|---|
| 22 | TCP | Administración remota mediante SSH |
| 80 | TCP | Tráfico HTTP hacia Apache/NGINX |
| 443 | TCP | Tráfico HTTPS hacia Apache/NGINX |

### 7.1 Regla para HTTPS

Comando utilizado:

```bash
gcloud compute firewall-rules create default-allow-https   --allow tcp:443   --source-ranges=0.0.0.0/0
```

### 7.2 Regla para HTTP

Comando utilizado:

```bash
gcloud compute firewall-rules create default-allow-http   --allow tcp:80   --source-ranges=0.0.0.0/0
```

### 7.3 Verificación de reglas

Antes de crear una regla con un nombre existente, se debe revisar la configuración actual:

```bash
gcloud compute firewall-rules list
```

Esto evita intentar crear nuevamente una regla que ya exista en el proyecto.

### 7.4 Consideración sobre SSH

El puerto TCP/22 se utiliza para la administración de la instancia mediante SSH. La regla correspondiente
debe existir en la red utilizada por la máquina virtual.

---

## 8. Decisión de no exponer el puerto 3000

La aplicación Node.js no debe ser accesible directamente desde Internet.

Node.js deberá escuchar únicamente en:

```text
127.0.0.1:3000
```

El flujo esperado para el despliegue es:

```text
Navegador
    |
    v
Internet
    |
    v
TCP 80 / 443
    |
    v
Apache / NGINX
    |
    v
127.0.0.1:3000
    |
    v
Node.js / Express
    |
    v
PostgreSQL
```

Por esta razón **no se crea una regla pública de firewall para TCP/3000**. Apache o NGINX será el punto
de entrada público y funcionará como reverse proxy hacia la aplicación Node.js.

Esta decisión es consistente con el requisito de despliegue que establece que Node.js debe ejecutarse en
`127.0.0.1:3000` y publicarse únicamente mediante reverse proxy bajo el prefijo `/library`.

---

## 9. Comandos de administración de la instancia

### 9.1 Consultar estado

```bash
gcloud compute instances list
```

### 9.2 Encender la instancia

```bash
gcloud compute instances start maquina02   --zone=northamerica-south1-c
```

### 9.3 Apagar la instancia

```bash
gcloud compute instances stop maquina02   --zone=northamerica-south1-c
```

### 9.4 Conectarse mediante SSH

```bash
gcloud compute ssh maquina02   --zone=northamerica-south1-c
```

---

## 10. Riesgos y consideraciones de seguridad

| Riesgo | Control aplicado |
|---|---|
| Publicación accidental de credenciales | No documentar contraseñas, tokens, `.env` ni cadenas de conexión. |
| Exposición de llaves SSH | No almacenar ni publicar llaves privadas en el repositorio. |
| Exposición directa de Node.js | No abrir TCP/3000; Node.js escucha únicamente en `127.0.0.1`. |
| Acceso web no controlado | El tráfico externo se recibe mediante Apache/NGINX en 80/443. |
| Cambios accidentales en recursos GCP | Revisar proyecto y zona antes de ejecutar comandos destructivos. |
| Eliminación accidental del proyecto | Utilizar `gcloud projects delete` únicamente cuando se haya verificado el `PROJECT_ID`. |

---

## 11. Evidencias recomendadas

Para demostrar la creación y configuración de la infraestructura se conservarán capturas de pantalla de:

1. `gcloud compute instances list`, mostrando `maquina02`, zona, tipo de máquina y estado.
2. `gcloud compute instances describe maquina02 --zone=northamerica-south1-c`, mostrando la configuración.
3. `gcloud compute firewall-rules list`, mostrando las reglas necesarias.
4. Conexión mediante `gcloud compute ssh maquina02 --zone=northamerica-south1-c`.
5. `cat /etc/os-release`, mostrando CentOS Stream 10.

Las evidencias deben mostrar únicamente la información técnica necesaria y no deben incluir tokens,
contraseñas, llaves privadas ni otras credenciales.

---

## 12. Resumen de decisiones de infraestructura

| Decisión | Selección | Justificación |
|---|---|---|
| Plataforma | Google Compute Engine | Servicio requerido por el ejercicio y suficiente para alojar el monolito completo. |
| Sistema operativo | CentOS Stream 10 | Sistema operativo requerido para la instancia del ejercicio. |
| Región | `northamerica-south1` | Región adecuada para el entorno académico. |
| Zona | `northamerica-south1-c` | Una sola zona es suficiente porque no se requiere alta disponibilidad. |
| Tipo de máquina | `e2-standard-2` | 2 vCPU y 8 GB RAM ofrecen margen para Node.js, PostgreSQL y Apache/NGINX. |
| Acceso administrativo | SSH, TCP/22 | Permite administrar remotamente la instancia. |
| Acceso web | TCP/80 y TCP/443 | Permite publicar la aplicación mediante Apache/NGINX. |
| Puerto Node.js | No público | Node.js permanece en `127.0.0.1:3000` detrás del reverse proxy. |

---
