# Carpeta `docs`

Esta carpeta contiene la **documentación transversal** del monorepo: guías de arquitectura, decisiones técnicas, convenciones, procesos, y cualquier material compartido entre aplicaciones, pipelines, agentes y workflows.

- **Propósito principal**: tener un punto único para la documentación “global” del proyecto (no específica de una sola app/agente).
- **Recomendación**: organiza la documentación por temas (arquitectura, despliegue, datos, seguridad, observabilidad, etc.) y mantén enlaces desde los READMEs de cada componente hacia estas guías.

## Documentos

| Documento | Tema | Estado |
| --- | --- | --- |
| [`ARCHITECTURE_PROPOSAL.md`](./ARCHITECTURE_PROPOSAL.md) | Arquitectura del backend para la API central en FastAPI (`services/api`): patrón, estructura de carpetas, routers, separación frontend/backend, riesgos (documento en inglés) | Borrador para revisión del CTO |
