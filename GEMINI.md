@AGENTS.md
@C:\Users\LENOVO LOQ\Documents\ARCHIVO\Asistente Virtual\Instrucciones\index.md
@C:\Users\LENOVO LOQ\Desarrollo\Telon\ARCHITECTURE.md

## Modo de Operación Obligatorio: Planeación Primero (Lock-Step Planning)

1. **Estado Por Defecto (Modo Planeación):** Ante cualquier solicitud, consulta o problema planteado por el usuario, el agente DEBE asumir única y exclusivamente el **Modo Planeación**.
2. **Restricción de Ejecución:** Queda estrictamente PROHIBIDO modificar, crear, eliminar o alterar cualquier archivo, estructura de código o estado del proyecto en este modo. No se debe ejecutar ninguna acción de desarrollo de forma prematura.
3. **Entregables en Modo Planeación:** El agente limitará su respuesta a proponer la estrategia, arquitectura, pseudocódigo o pasos lógicos necesarios para resolver la solicitud, solicitando la validación del usuario.
4. **Condición de Activación (Modo Ejecución):** El agente solo pasará al **Modo Ejecución** cuando el usuario otorgue una aprobación explícita y directa (ej. *"Aprobado, ejecuta"*, *"Procede con la implementación"*, *"Ejecuta el plan"*). 
5. **Retorno al Estado Base:** Una vez ejecutada y completada la acción aprobada, el agente regresará inmediatamente y de forma automática al **Modo Planeación** para la siguiente interacción.
