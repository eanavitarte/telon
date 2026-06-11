# Telon 🎭

> **Una forma simple y confiable para conectar agents en el navegador.**

**Telon** es una biblioteca ligera, modular y agnóstica al framework diseñada para posibilitar la comunicación bidireccional y segura entre un panel central (**Orquestador/Host**) y múltiples aplicaciones descentralizadas (**Agentes/Clientes**) a través de `iframes` en el navegador del usuario utilizando el protocolo `MCPOwnStandard`.

Su principal fortaleza es la resolución nativa e integrada del **bloqueo de cookies de terceros y particionamiento de almacenamiento (Storage Partitioning)** en navegadores modernos mediante la implementación transparente de la **Storage Access API**.

---

## Características Principales 🚀

*   **100% Client-Side & Site-Agnostic**: Comunicación directa en el navegador mediante `postMessage`. Funciona con cualquier combinación de dominios o entornos locales de desarrollo.
*   **Gestión de Storage Access API**: Detecta de forma proactiva si el navegador bloquea la sesión del cliente dentro del iframe y ofrece un flujo de interacción de usuario para solicitar y conceder accesos nativamente.
*   **Handshake Seguro**: Validación automática de orígenes (`event.origin`) mediante expresiones regulares y firmas dinámicas (`apiKey`) para evitar ataques de secuestro de iframe (Clickjacking) y XSS/CSRF.
*   **Aislamiento de Diagnósticos**: Facilita el rastreo individualizado de logs de conexión por cada micro-aplicación cliente.
*   **Totalmente Tipado**: Escrito en TypeScript para garantizar autocompletado robusto y seguridad en tiempo de compilación.

---

## Instalación 📦

Instala la biblioteca desde tu registro local o como dependencia:

```bash
npm install telon
```

---

## Uso Rápido 💻

### 1. El Orquestador (`telon/host`)

Instancia `TelonHost` en tu panel principal para registrar clientes e interactuar con ellos:

```typescript
import { TelonHost } from 'telon';

const host = new TelonHost({
  onClientRegister: (client) => {
    console.log(`¡Cliente ${client.name} sincronizado con éxito!`);
  },
  onClientDataUpdate: (client, capability, data) => {
    console.log(`Datos recibidos del cliente ${client.name} [${capability}]:`, data);
  },
  onClientUnauthorized: (client, reason) => {
    console.warn(`Cliente ${client.name} requiere autorización:`, reason);
    // Cambia el estilo del iframe a visible para que el usuario pueda presionar el botón
  }
});

// Registrar un cliente usando su URL e iframe correspondiente
const clientRef = host.register({
  id: 'mantras',
  url: 'https://mantras.lexmente.app/mcp-frame',
  apiKey: 'mi_clave_secreta'
});

// Enviar una acción al agente
clientRef.sendAction('tasks', 'TOGGLE_STATE', { id: 'uuid-123', completed: true });
```

### 2. El Agente Cliente (`telon/client`)

Instancia `TelonClient` en la sub-ruta dedicada a tu iframe (ej. `/mcp-frame`):

```typescript
import { TelonClient } from 'telon';

const client = new TelonClient({
  name: 'Mantras (ZenFlow)',
  description: 'Aplicación de bienestar y meditación diaria.',
  capabilities: ['habits', 'tasks', 'telephone'],
  allowedHostOrigins: [/^http:\/\/localhost(:\d+)?$/, 'https://manager.lexmente.app'],
  
  // Verifica si tu app tiene sesión activa
  checkSession: async () => {
    return !!localStorage.getItem('user_id');
  },
  
  // Retorna la clave para validar la firma de la conexión
  resolveApiKey: async () => {
    return localStorage.getItem('api_key') || 'fallback_key';
  }
});

// Escuchar acciones desde el orquestador
client.onAction('tasks', 'TOGGLE_STATE', async (payload) => {
  await db.updateTask(payload.id, { completed: payload.completed });
  // Responder con los datos actualizados
  client.sendDataUpdate('tasks', await db.getTasks());
});

// Iniciar escuchas del protocolo
client.start();
```

---

## Licencia 📄

Este proyecto está bajo la Licencia **MIT**. Consulta el archivo `LICENSE.md` para más detalles.
