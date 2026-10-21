# Revisión del hub inmersivo

final result: passed

## Referencia y alcance

Imagen adjunta del propietario: 1672 × 941. Referencia estética, no copia literal. Se compararon las vistas renderizadas de escritorio (1672 × 941 y 1280 × 720), móvil (390 × 844) y móvil estrecho (320 × 800), en los temas claro y oscuro. Los datos reales son once asignaturas y dos clases; los satélites adicionales de la referencia no se inventan.

## Hallazgos corregidos

- El primer encuadre dejaba el universo demasiado pequeño y concentrado. Se amplió el volumen de los cuerpos, se redujeron márgenes y se adaptó la proyección horizontal en escritorio y vertical en móvil. No se cambiaron posiciones guardadas.
- Las etiquetas secundarias competían con el grafo. Los nombres siguen controlados por Textos; los datos secundarios aparecen al enfocar o ampliar. Las once abreviaturas permanecen siempre.
- Los controles estrechos de la navegación se ajustaron para caber a 320 px conservando sus nombres accesibles. Sin desbordamiento horizontal.

## Superficies revisadas

- Tipografía: fuentes de sistema, jerarquía sobria, abreviaturas contrastadas y nombres largos con saltos de línea.
- Espaciado: lienzo sin marco ni cabecera de gran tamaño, controles flotantes y zonas de encuadre protegidas.
- Color: paleta original exacta, profundidad e iluminación separadas del relleno base, texto adaptado a ambos temas.
- Recursos: textura mineral local comprimida; nodos y conexiones reales interactivos. Componente de cristal JS-CSS original del registro solicitado, sin dependencias adicionales.
- Contenido: no se alteraron asignaturas, registros, rutas ni los HTML de las clases.

## Comprobaciones de interacción

Búsqueda de Brayton, filtro de laboratorio, apertura de su iframe y retorno al universo, índice de once asignaturas, selección de Ingeniería Térmica, guía y opción experimental de tamaño, control Textos, temas, zoom y ajuste de pantalla. Parallax comprobado con desplazamientos distintos por profundidad. Los tests verifican rangos relativos, crecimiento igual en todas las asignaturas, persistencia de posiciones, arrastre, zoom táctil y compensación de las proyecciones de pantalla.

## Límites

La preferencia de movimiento reducido y la detección de puntero táctil se respetan en código y CSS; no se cambió la configuración global del sistema para probarlos. La referencia contiene texturas y composiciones distintas: se conserva su dirección visual adaptada al grafo real.
