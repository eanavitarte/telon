# Contribuir a Telon 🎭

¡Gracias por tu interés en contribuir a **Telon**! Este proyecto es de código abierto y agradecemos cualquier ayuda para mejorar la conectividad de agentes en el navegador.

---

## 🛠️ Cómo Empezar

### Requisitos Previos

Asegúrate de tener instalado:
*   [Node.js](https://nodejs.org/) (Versión 18 o superior).
*   `npm` (o `pnpm` / `yarn`).
*   [Git](https://git-scm.com/).

### Clonar y Configurar

1.  Bifurca (Fork) y clona el repositorio:
    ```bash
    git clone https://github.com/tu-usuario/Telon.git
    cd Telon
    ```
2.  Instala las dependencias:
    ```bash
    npm install
    ```
3.  Prueba compilar el código en local:
    ```bash
    npm run build
    ```

---

## 📋 Reglas y Estilo de Código

*   **TypeScript**: Todo el código principal debe escribirse en TypeScript con tipado fuerte. Evita usar `any` a menos que sea estrictamente necesario.
*   **Formato de Código**: Usamos la configuración estándar de TypeScript y ESLint. Asegúrate de formatear tus archivos antes de subir cambios.
*   **Mensajes de Commit**: Te recomendamos seguir el estándar de *Conventional Commits*:
    *   `feat: ...` para nuevas características.
    *   `fix: ...` para corrección de bugs.
    *   `docs: ...` para cambios en documentación.
    *   `refactor: ...` para reestructuraciones de código sin cambios funcionales.

---

## 🚀 Proceso para Enviar un Pull Request (PR)

1.  Crea una rama descriptiva para tu cambio:
    ```bash
    git checkout -b feature/nueva-capacidad
    # o
    git checkout -b bugfix/corregir-handshake
    ```
2.  Realiza tus cambios y asegúrate de que compilan sin errores.
3.  Haz commit de tus cambios:
    ```bash
    git commit -m "feat: agrega soporte para..."
    ```
4.  Sube tu rama y abre un Pull Request en el repositorio principal explicando tus cambios de forma clara y detallada.
