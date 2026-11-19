# Portal de consulta de políticas de RRHH con RAG multiagente
**Café Montaña S.A. — Aporte de Persona 1**  
18 de noviembre de 2026 | borrador para consolidar con Persona 2

## Parte A. Investigación documental
La organización ficticia produce y comercializa café en Costa Rica. Se plantea una plantilla simulada de al menos 50 personas. Los colaboradores realizan consultas recurrentes y el área de RRHH concentra los documentos oficiales en una carpeta compartida. El objetivo es reducir búsquedas manuales sin reemplazar el criterio de RRHH para casos particulares. El alcance separa las políticas generales de los registros de personas, que pertenecen a la base de datos operacional.

### Vacaciones y feriados
El Código de Trabajo establece un descanso mínimo periódico de dos semanas por cada 50 semanas continuas. Las condiciones de acumulación y fraccionamiento se sujetan a los artículos 158 y 159. La empresa ficticia propone ampliar el beneficio a quince días hábiles y solicitar vacaciones con diez días hábiles de antelación. El trámite incluye aprobación y registro, sin que una política interna pueda limitar un derecho legal. El calendario 2026 distingue feriados de pago obligatorio y no obligatorio; el tratamiento salarial depende de la modalidad de pago. Dado que la planilla simulada es quincenal, se contempla el pago doble cuando se trabaja un feriado. El saldo personal debe salir de SQL, nunca de una estimación del RAG.

### Permisos y licencias
Las licencias protegen necesidades familiares y personales. El artículo 95 reconoce, en el caso ordinario, cuatro meses de maternidad y dos días semanales de paternidad biológica durante las primeras cuatro semanas. La Ley 10589 establece licencias remuneradas por fallecimiento según grado de parentesco. La empresa propone un beneficio adicional para familiares de segundo grado, tres días de matrimonio y hasta cuatro horas mensuales de estudio con aprobación. Las solicitudes planificadas se presentan con anticipación; las emergencias se notifican cuanto antes, sin condicionar derechos legales. Los permisos sin goce se tramitan mediante acuerdo escrito. El agente debe distinguir los beneficios de empresa de los mínimos legales.

### Incapacidades
Es importante separar enfermedad común, gestionada por la CCSS, y riesgos del trabajo, gestionados mediante el INS. Según criterios del MTSS, los primeros tres días de una incapacidad inicial común se reconocen por el patrono al 50%, y desde el cuarto se aplica el subsidio de la CCSS según condiciones de cobertura. La cuantía usual es 60% del salario de referencia cuando se cumplen requisitos. Para riesgos laborales, el INS contempla el 60% durante los primeros 45 días y un cálculo específico posteriormente. La organización propone notificación inmediata o dentro de 24 horas cuando sea posible, registro de fechas y manejo privado de la constancia. El RAG no determina montos individuales ni solicita diagnósticos.

### Jornada y asistencia
Los artículos 135 a 140 regulan los límites de jornada y el trabajo extraordinario, cuyo pago incluye un recargo del 50%. La propuesta interna fija un horario administrativo de ocho horas efectivas diarias de lunes a viernes, de 8 a 17 horas con una hora de almuerzo libre. Los puestos elegibles pueden realizar hasta dos días semanales de teletrabajo por acuerdo, respetando derechos, seguridad y desconexión. El control de asistencia requiere registrar marcas y notificar errores. El diseño documental permite localizar cada regla sin mezclarla con la asistencia de una persona concreta.

### Remuneración
El aguinaldo del sector privado se calcula a partir de las remuneraciones salariales del período diciembre-noviembre, divididas entre doce, y se paga dentro de los primeros veinte días de diciembre. La política interna fija el día diez. Se propone pago el quince y el último día del mes, adelantado si cae en día no hábil administrativo. Las deducciones deben tener fundamento legal y se detallan en el comprobante. Se usa Google Sheets para el calendario y los conceptos salariales; así el agente de ingesta debe procesar un formato tabular además del texto.

### Fuentes y criterios
- MTSS. Asuntos laborales: https://www.mtss.go.cr/temas-laborales/
- MTSS. Código de Trabajo: https://www.mtss.go.cr/elministerio/marco-legal/documentos/codigo_trabajo_cr.pdf
- MTSS. Calendario de feriados 2026: https://www.mtss.go.cr/temas-laborales/feriados/feriados_calendario_2026.pdf
- PGR. Ley 10589: https://www.pgrweb.go.cr/DOCS/NORMAS/1/VIGENTE/L/2020-2029/2020-2024/2024/193D8/170861.HTML
- MTSS. Criterio de incapacidad DAJ-AE-155-06: https://www.mtss.go.cr/elministerio/estructura/direccion-asuntos-juridicos/pronunciamientos/daj-ae-155-06%20%20pago%20primeros%20tres%20dias.pdf
- PGR. Criterio sobre subsidio CCSS: https://www.pgrweb.go.cr/DOCS/DICTAMENES/1/P/D/2010-2019/2015-2019/2017/1159C4.HTML
- INS. Beneficios económicos por riesgos del trabajo: https://salud.grupoins.com/riesgos-del-trabajo/beneficios-economicos-rt/

## Parte B. Informe técnico
### Diseño y arquitectura
El sistema separa un flujo documental y un flujo conversacional. La ingesta es el único módulo que accede a Drive, con una cuenta de servicio de solo lectura. MySQL con embeddings en columnas JSON guarda documentos, fragmentos, vectores y estado de sincronización. El agente de políticas recupera evidencia de esas tablas y solicita al LLM una respuesta en español. El orquestador compartido deberá integrar datos personales y políticas; el prototipo de Persona 1 utiliza reglas como puente temporal. La interfaz utiliza React + Vite, componentes, páginas y rutas; el backend Express organiza modelos, controladores y rutas.

### Extracción, fragmentación y sincronización
La API de Drive permite descargar PDF y exportar Google Docs a texto y Google Sheets a XLSX, conservando todas las pestañas. El parser también admite DOCX, XLSX, CSV y texto. Cada encabezado numerado produce un bloque, que se divide en ventanas de hasta 2400 caracteres con 250 de solapamiento; suele corresponder a varios cientos de tokens, pero no se mide tokenización exacta. Se guarda ID, revisión de Drive, nombre, enlace, sección y versión. Los fragmentos se reemplazan en una transacción por documento; no se recalculan documentos sin cambios. El token de changes.list permite observar cambios y la reconciliación completa de hijos directos detecta archivos fuera de la carpeta. La ejecución diaria está programada a las 06:00 locales. No se admite OCR ni carpetas recursivas en esta versión.

### Recuperación y generación
Gemini genera vectores de 768 dimensiones diferenciando consulta y documento. La búsqueda por similitud coseno calculada en Node.js ordena los cinco fragmentos más cercanos y filtra con un umbral inicial de 0,45. Se envían los fragmentos recuperados a DeepSeek junto con un prompt que restringe respuestas a evidencia disponible, prohíbe datos personales y requiere JSON. La aplicación valida los números de fragmento usados y construye las citas a partir de los metadatos almacenados. Cuando no hay evidencia o citas válidas, informa que no encontró la política y deriva a RRHH. Esta validación no verifica por sí sola todas las afirmaciones del LLM; debe evaluarse fidelidad con preguntas reales.

### Seguridad e integración
Las claves se leen desde variables de entorno; la clave de servicio queda fuera de Git. SQL usa parámetros y el chat renderiza contenido mediante React sin HTML crudo. El modo demo permite solo consultar políticas sin autenticación y no debe desplegarse. La integración debe sustituir el orquestador temporal por el definitivo, verificar JWT y roles, y registrar consultas en el esquema operacional acordado. La tabla rag_logs registra trazas técnicas adicionales. El prototipo solo trabaja con una carpeta de políticas y datos simulados. El acceso a documentos citados sigue sujeto a permisos de Drive.

### Evaluación y limitaciones
Se diseñaron diez preguntas adicionales diferentes de las base, con respuesta esperada y fuente. Se incluyen pruebas unitarias de fragmentación, similitud y umbral. Las tres pruebas unitarias pasaron en Node 22. La instalación de dependencias y las pruebas con Drive, API de IA y MySQL no se ejecutaron en el entorno de entrega. Durante la demo se debe medir exactitud, citas, abstención, privacidad, latencia y sincronización. El banco conjunto debe contener 45 preguntas; el objetivo es al menos 80% de aciertos y 90% de respuestas debajo de ocho segundos, sin fugas de datos. No se reportan métricas no medidas. Incorporar aquí los resultados reales y las evidencias tras la integración.

### Referencias técnicas
- Drive API, recuperación de cambios: https://developers.google.com/workspace/drive/api/guides/manage-changes
- Gemini embeddings: https://ai.google.dev/api/embeddings
- DeepSeek Chat Completions: https://api-docs.deepseek.com/api/create-chat-completion/
- MySQL JSON: https://dev.mysql.com/doc/refman/8.4/en/json.html
