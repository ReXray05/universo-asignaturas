# Instrucciones persistentes para agentes

## Regla principal: ampliación acumulativa

Este es el portal permanente **Universo de Asignaturas**. Cualquier clase nueva se añade a ESTE proyecto y a SU repositorio existente. NUNCA crees otro repositorio, otro portal, otra portada o una copia del menú para incorporar una clase. NUNCA borres clases anteriores. No modifiques visualizaciones previas salvo necesidad demostrada y explicada.

Repositorio autorizado: `https://github.com/ReXray05/universo-asignaturas.git`. Portal: `https://rexray05.github.io/universo-asignaturas/`. Rama de publicación: `main`. Reutiliza estas identidades en conversaciones futuras.

Antes de trabajar, localiza este archivo, inspecciona `git remote -v`, la rama y los cambios pendientes. Si se trabaja desde otra conversación, busca primero el proyecto existente en lugar de iniciar uno nuevo. El remoto de este checkout es la fuente de verdad. Si falta el remoto, pide al propietario que elija uno; no crees un repositorio remoto sin su autorización explícita. Conserva los cambios ajenos.

## Incorporación de una clase

1. Inspecciona los archivos originales, la asignatura y el título solicitado. Mantén la interactividad, las dependencias y la estructura de recursos. No sustituyas el programa por imágenes.
2. Lee `src/data/subjects.json` y `src/data/lessons.json`. Comprueba conflictos de identificador, ruta y título antes de copiar nada. Usa la asignatura existente; no inventes clases ni contenido académico.
3. Si el programa necesita compilación, comprueba sus instrucciones y compílalo en su proyecto de origen con rutas relativas. Importa la salida estática que contiene `index.html`.
4. Usa `npm run lesson:add -- --subject <subjectId> --title "Título" --source "<carpeta>"`. Añade descripción, fecha conocida, categoría y etiquetas cuando corresponda. El script añade únicamente la entrada de registro y los archivos de esa clase; el grafo se actualiza automáticamente. No edites componentes gráficos para añadir una clase.
5. Para actualizar una clase existente, confirma que es la misma y conserva su identificador. Usa `--update --id <id-existente>`; el script conserva una copia anterior en `work/`. No dupliques la clase para eludir un conflicto. No cambies una URL permanente al cambiar un título.
6. Ejecuta `npm test`, `npm run validate` y `npm run build`. Comprueba la nueva visualización en navegador, su enlace compartible, recursos y controles, el retorno al universo y el acceso a clases previas. Las pruebas automáticas no verifican recursos generados dinámicamente ni toda la interacción del programa.
7. Revisa el diff: deben figurar los archivos nuevos y la entrada correspondiente, o una actualización justificada. No elimines ni reformatees contenido ajeno sin necesidad.
8. Haz commit y push al MISMO remoto cuando haya autorización y permisos. Revisa el workflow de GitHub Pages y comprueba la web pública. Comunica por separado lo preparado, lo subido y lo publicado; confirma únicamente acciones verificadas.
9. Devuelve la URL real del portal y `<portal>/#/lesson/<id>`. No inventes un usuario, un remoto ni una URL pública. Si falta acceso a GitHub, deja el proyecto listo e indica la intervención exacta necesaria.

## Arquitectura y límites

- Sigue la dirección visual del propietario conservada en `docs/visual-direction.md`: papel cálido, tinta, tipografía de sistema, rótulos monoespaciados, marcos rectangulares y controles legibles de al menos 44 px. El tema claro es la base; ambos temas deben estar completos. El color identifica asignaturas y estados; evita halos, brillos y adorno orbital. No alteres el diseño interno de las clases al retocar el portal.
- Los once colores de asignatura fueron elegidos expresamente por el propietario y están en `subjects.json`; conserva sus tonos definidos, sin diluirlos con superficies neutras. Las abreviaturas usan tinta calculada con contraste mínimo 4.5:1 sobre su color. El control «Textos» junto al zoom oculta etiquetas y datos del grafo, nunca las abreviaturas, y recuerda la preferencia en el navegador.

- React + TypeScript + Vite. Portal estático para GitHub Pages, sin servicios permanentes ni dependencias de pago.
- Asignaturas en `src/data/subjects.json`; clases en `src/data/lessons.json`; archivos en `public/lessons/<id>/index.html` con sus recursos.
- Categorías: `notas-clase`, `apuntes-estudio`, `laboratorio`. Fecha opcional `YYYY-MM-DD`; no inventar fechas.
- Rutas públicas relativas a la base de Vite. Compartibles mediante `#/lesson/<id>` para soportar acceso directo en Pages. Las visualizaciones viven en iframe y conservan sus controles.
- El mapa debe mantener posiciones estables y detener la simulación. Una clase nueva no debe reorganizar drásticamente las anteriores. Se deben mantener los once planetas iniciales y los estados vacíos.
- El workflow publica `main`; respeta una rama o dominio diferente si ya está configurado. No introduzcas tokens ni secretos en el código.
- Nunca añadas datos ficticios como contenido permanente para una prueba. Los tests de incorporación utilizan carpetas temporales.
- Mantén el README sin referencias al nombre de ninguna skill de generación de visualizaciones.
- No publiques `work/`, copias de seguridad, dependencias locales, archivos de credenciales ni fuentes que no deban ser públicas.

## Interacción y tamaño del mapa

- Arrastrar inmediatamente sobre un planeta desplaza la cámara. Mantener 320 ms sin superar 6 px de desplazamiento arma el arrastre del planeta; después mueve también sus satélites. Conserva esta distinción, la captura del puntero, el zoom con dos dedos y la supresión del clic posterior al arrastre.
- Al soltar, una simulación breve desplaza vecinos para resolver colisiones y se detiene. No devuelve los nodos a las coordenadas iniciales ni recentra la cámara. Guarda posiciones inmediatamente y al terminar; conserva también las ocultas por filtros. Alt + flechas ofrece una alternativa de teclado.
- La guía contiene «Tamaño según número de clases», experimental, desactivada inicialmente y persistida localmente. Usa el total real de clases de cada asignatura, sin variar al filtrar: radio 39 + min(39, 4 × sqrt(clases)). Ajusta etiquetas, encuadre y colisiones al radio. No añadas clases ficticias para mostrar el efecto.
- El control «Textos» debe mantenerse discreto, sin fondo sólido al estar activo.
