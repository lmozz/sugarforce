# Dizucar - SugarForce (Prototipo)

SugarForce es una plataforma integral diseñada para centralizar y sistematizar los procesos clave de **Dizucar**, abarcando desde la gestión de mercadeo y producción hasta la comunicación interna mediante señalización digital.

> [!WARNING]
> **Aviso de Prototipo:** Este es un prototipo conceptual. Actualmente, toda la información se guarda de manera **local** (localStorage) y no se sincroniza con una base de datos externa. No es un producto final apto para despliegue corporativo inmediato; su desarrollo funcional completo requeriría una infraestructura de servidor y base de datos robusta.

---

## 🏛️ Estructura por Departamentos

El proyecto se divide en tres bloques fundamentales, cada uno atendiendo necesidades específicas de la empresa:

### 📢 Mercadeo (Marketing)
**Finalidad:** Centralizar la consulta y gestión de información de los pasos involucrados en el desarrollo de empaques y nuevos productos.
*   **Módulos:** `pasos`, `clasificacion`, `procesos`.
*   **Objetivo:** Eliminar la dependencia excesiva del correo electrónico, proporcionando un canal único donde se puedan visualizar cambios de fases, designar encargados y monitorear el progreso. Además, integra una conexión con datos de ventas para visualizar el desempeño comercial de los productos.

### 🏭 Producción (Production)
**Finalidad:** Sistematizar y digitalizar la generación de Certificados de Análisis (COA).
*   **Módulos:** `coa`, `param-coa`, `notes-coa`, `product`, `presentation`, `cliente`, `cellar`, `clasificacion`.
*   **Objetivo:** Reemplazar los procesos manuales tradicionales. Permite definir productos, presentaciones y parámetros técnicos del azúcar para generar e imprimir certificados digitales con precisión y trazabilidad.

### 👥 Recursos Humanos (Human Resources)
**Finalidad:** Plataforma interna de comunicación y señalización digital (Digital Signage).
*   **Módulos:** `pantallas`, `comentarios`.
*   **Objetivo:** Sustituir servicios de proveedores externos por una solución propia y gratuita. Permite gestionar anuncios en pantallas ubicadas en oficinas, bodegas y centros de empaque, con programación horaria flexible y un muro de comentarios para empleados.

---

## 🤖 Zucaron IA: El Corazón del Sistema

Todos los módulos de SugarForce cuentan con integración de Inteligencia Artificial mediante **Zucaron IA**.

*   **Capacidades:**
    *   **Consulta:** Análisis y búsqueda inteligente de información dentro de los módulos.
    *   **Acciones Complejas:** Capacidad para crear, editar, filtrar y cambiar estados de registros a través de comandos naturales.
    *   **Moderación:** En el módulo de Recursos Humanos, la IA audita automáticamente los comentarios de los trabajadores para garantizar un ambiente laboral sano e inapropiado.
    *   **Interfaz Dinámica:** Control de temas (Claro/Oscuro) y generación de gráficos SVG/reportes PDF bajo demanda.

---

## 🚀 Visión a Futuro (Versión Real)

Si SugarForce se desarrollara como un ecosistema completo, incluiría:
1.  **IA Robusta:** Un asistente virtual presente en cada módulo con capacidades predictivas de mercado.
2.  **Blockchain:** Implementación de tecnología de cadena de bloques para los certificados COA, garantizando su veracidad, inalcanzabilidad y certificación absoluta de la información.
3.  **Análisis Predictivo:** IA capaz de predecir comportamientos del mercado para optimizar el inventario de productos.
4.  **Sincronización Total:** Base de datos centralizada con seguridad de nivel empresarial y acceso remoto seguro.

---

### 🎨 Diseño y UX
SugarForce utiliza una estética **Glassmorphic** moderna inspirada en macOS, con un sistema de diseño premium que garantiza una experiencia de usuario fluida y visualmente impactante.
