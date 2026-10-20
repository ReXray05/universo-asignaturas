# Universo de Asignaturas

Un único portal de estudio, acumulativo y estático, con once asignaturas de ingeniería. Las clases se añaden como aplicaciones interactivas independientes. El registro empieza vacío: no hay clases de ejemplo publicadas.

Repositorio permanente: https://github.com/ReXray05/universo-asignaturas

Dirección de publicación: https://rexray05.github.io/universo-asignaturas/

## Desarrollo local

Requiere Node.js 22.18 o posterior y npm.

```sh
npm ci
npm run dev
```

Abre la dirección que muestra Vite. Para comprobar una versión de producción:

```sh
npm test
npm run build
npm run preview
```

`npm run build` valida primero los datos, los archivos de las clases y sus dependencias locales estáticas. Después comprueba TypeScript y genera `dist/`. Los tests usan carpetas temporales; no crean clases en el portal.

## Un repositorio, un portal

Este directorio es el proyecto permanente. Reutiliza siempre su repositorio y su URL. No crees otro repositorio ni otra portada para añadir una clase. El remoto elegido se consulta con `git remote -v`; si no hay ninguno, el propietario debe elegir el repositorio antes de conectarlo. El proyecto no contiene credenciales.

Estructura principal:

```text
src/data/subjects.json       asignaturas, colores y posiciones iniciales
src/data/lessons.json        registro acumulativo de clases
public/lessons/<id>/         aplicación completa de cada clase
scripts/lesson-add.mjs       incorporación y actualización segura
scripts/validate.mjs         validación de datos y dependencias
AGENTS.md                   reglas persistentes para futuras incorporaciones
.github/workflows/deploy.yml publicación automática
```

El mapa genera sus nodos y conexiones a partir de estos dos archivos JSON. Incorporar una clase no requiere cambiar los componentes del grafo. El curso lo determina la asignatura. Las categorías de clases son `notas-clase`, `apuntes-estudio` y `laboratorio`.

## Añadir una clase

Prepara una carpeta autocontenida con `index.html` y sus recursos. Conserva su estructura de archivos y usa rutas relativas (`./assets/...`). Si el programa tiene un proceso de compilación, ejecútalo en su proyecto de origen con una base relativa y utiliza su carpeta de salida, por ejemplo `dist/`. El portal incorpora programas ya compilados; no instala ni ejecuta dependencias arbitrarias de los programas durante el despliegue.

```sh
npm run lesson:add -- --subject tmm --title "Nombre de la clase" --source "./ruta/al/programa"
```

Opciones:

```sh
npm run lesson:add -- --subject termica --title "Nombre de la clase" --source "./ruta/dist" --id termica-nombre-estable --description "Descripción breve" --date 2026-10-20 --category apuntes-estudio --tags "calor,energía"
```

El comando copia todos los archivos, valida la asignatura y los recursos estáticos, rechaza rutas que salgan de la carpeta y evita identificadores, rutas y títulos duplicados en una misma asignatura. El identificador predeterminado combina la asignatura y el título normalizado. Es permanente: no lo cambies al corregir un título. No se sobreescriben carpetas que no estén registradas. Ejecuta una incorporación cada vez.

Los identificadores de asignatura disponibles son:

| Curso | Identificador | Asignatura |
| --- | --- | --- |
| 3 | `tmm` | Teoría de Máquinas y Mecanismos |
| 3 | `termica` | Ingeniería Térmica |
| 3 | `electronica` | Electrónica |
| 3 | `maquinas-electricas` | Máquinas Eléctricas |
| 3 | `materiales` | Ingeniería de Materiales |
| 4 | `efvm` | Elementos Finitos y Vibraciones Mecánicas |
| 4 | `fabricacion` | Ingeniería de Fabricación |
| 4 | `motores` | Motores Alternativos |
| 4 | `oficina-tecnica` | Oficina Técnica |
| 4 | `metrologia` | Metrología y Calidad |
| 4 | `sff` | Sistemas de Fabricación Flexible |

Para corregir una clase existente utiliza expresamente su identificador:

```sh
npm run lesson:add -- --subject tmm --title "Título corregido" --source "./programa-actualizado" --id tmm-nombre-estable --update
```

La actualización conserva la carpeta anterior y el registro anterior en `work/import-…/`. Si falla, restaura ambos automáticamente. Las copias de trabajo no se publican y se deben conservar hasta revisar el resultado. Las demás clases no se modifican.

Después de incorporar o actualizar:

1. Ejecuta `npm test` y `npm run build`.
2. Abre la nueva clase desde el mapa y desde su URL compartible; comprueba controles, gráficos y recursos. Revisa también clases anteriores.
3. Revisa el cambio, haz commit y push al mismo repositorio cuando dispongas de permisos.
4. Comprueba que GitHub Actions termina correctamente y abre la URL pública antes de afirmar que está publicada.

La comprobación automática reconoce referencias locales comunes de HTML, CSS y módulos JavaScript. Recursos construidos dinámicamente, llamadas de red, importaciones especiales y funciones interactivas necesitan una comprobación en navegador. Una aplicación que dependa de un servidor no se vuelve estática al copiarla.

## Enlaces permanentes y aislamiento

Cada entrada tiene `id`, `subjectId`, `title`, `description`, `path` y, opcionalmente, `date` (ISO `YYYY-MM-DD`), `category` y `tags`. Ejemplo de estructura —no es una clase preinstalada—:

```json
{
  "id": "tmm-nombre-estable",
  "subjectId": "tmm",
  "title": "Nombre de la clase",
  "description": "Descripción breve",
  "path": "lessons/tmm-nombre-estable/index.html",
  "category": "notas-clase",
  "tags": []
}
```

El enlace compartible es `<URL-del-portal>/#/lesson/<id>`. El uso de un fragmento evita errores 404 al abrir directamente en GitHub Pages. La vista de clase mantiene el retorno al universo y muestra el programa en un iframe, aislando su CSS y su contexto JavaScript. Abre únicamente programas de confianza; el aislamiento de interfaz no equivale a alojarlos en otro dominio. La ruta directa de archivos es `<URL-del-portal>/lessons/<id>/index.html`.

## Publicación en GitHub Pages

La publicación queda preparada en GitHub Actions. Elegir o crear un remoto corresponde al propietario; este proyecto no crea repositorios automáticamente.

1. Usa un único repositorio público de GitHub. Conecta este proyecto y sube su contenido, incluido `package-lock.json`, a la rama `main`. Si reutilizas otra rama, ajusta `on.push.branches` en el workflow.
2. En GitHub, abre **Settings → Pages → Build and deployment → Source → GitHub Actions**. Habilita Actions si la organización o el repositorio lo requieren.
3. Haz push a `main` o ejecuta manualmente el workflow. El trabajo comprueba los datos, ejecuta los tests, compila y publica `dist/`.
4. Consulta la URL real en **Settings → Pages** o en el entorno `github-pages` del workflow. Habitualmente será `https://<usuario>.github.io/<repositorio>/`.
5. Comprueba el menú, una recarga directa y, cuando existan clases, sus dos rutas: `/#/lesson/<id>` y `/lessons/<id>/index.html` bajo el prefijo del repositorio.

El workflow deduce automáticamente el prefijo del nombre del repositorio; los repositorios `<usuario>.github.io` usan `/`. Para un dominio propio, configura el dominio y DNS en GitHub y añade la variable de repositorio `PAGES_CUSTOM_DOMAIN` con el dominio, sin protocolo ni barra final. El workflow utilizará `/` y generará `CNAME`.

Para reproducir una compilación bajo un prefijo:

```sh
npm run build -- --base=/nombre-del-repositorio/
npm run preview
```

El portal funciona sin base de datos, cuentas, servicios de pago ni servidor permanente. El navegador conserva las preferencias de tema y las posiciones guardadas localmente; esas preferencias no se sincronizan entre dispositivos.
