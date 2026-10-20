# Dirección visual para una web inspirada en Anatomy

Documento autónomo para adjuntar a un agente de diseño o desarrollo. Incluye el criterio visual, los valores de referencia y su aplicación a una interfaz web. No requiere acceso a la skill original.

## 1. Instrucción para el agente

Diseña o adapta la web siguiendo esta dirección visual. Busca una apariencia editorial, técnica, precisa y serena: superficies de papel ligeramente cálidas, estructura clara, líneas finas, tipografía sobria y objetos explicativos con volumen cuando aporten información.

Aplica estas reglas a la página completa y a sus estados interactivos. Conserva el contenido, las funciones y los recorridos necesarios del producto. Resuelve las decisiones visuales no especificadas con los criterios de este documento. Si existe una marca establecida, conserva su nombre, logotipo y significado de los colores de estado; integra el lenguaje visual de esta guía alrededor de ellos.

La referencia es Anatomy, una skill para crear figuras técnicas isométricas. Esta guía adapta su lenguaje a una web. Las medidas de interfaz, los componentes y los ajustes de legibilidad que se indican aquí son decisiones de adaptación, no reglas originales del repositorio.

## 2. Carácter visual

La página debe recordar a una publicación técnica bien editada y a un instrumento construido con cuidado.

- *Precisión:* alineaciones exactas, medidas consistentes, datos y estados comprensibles.
- *Calma:* paleta reducida, movimiento suave y una jerarquía fácil de recorrer.
- *Materialidad:* diferencias sutiles entre fondo, superficie, borde y sombra; volumen reservado a los objetos que lo necesitan.
- *Detalle con función:* cada división, etiqueta, icono o pieza ayuda a entender o utilizar algo.
- *Veracidad:* los valores y las representaciones interactivas corresponden al estado real del producto.

La firma visual resulta de combinar papel claro, tinta oscura, rótulos monoespaciados, paneles rectangulares y una ilustración técnica cuidadosamente construida cuando el contenido lo justifique.

## 3. Composición y jerarquía

Diseña primero el tema claro y la lectura en móvil. Utiliza una retícula estable, con un eje evidente para títulos, textos y controles. Agrupa por proximidad y separa mediante espacio; añade bordes cuando ayuden a reconocer una unidad funcional.

En una página de presentación, una composición apropiada es: navegación discreta; título y explicación breve; una acción principal; figura o demostración enmarcada; secciones que desarrollan el contenido; cierre con la siguiente acción. Adapta esta secuencia a la finalidad real de la web. En una aplicación, prioriza la tarea y la información activa sobre la ilustración.

Valores iniciales para la interfaz, ajustables al contenido:

| Elemento | Referencia |
|---|---|
| Ancho máximo general | 1120–1200 px |
| Columna de lectura | 60–72 caracteres |
| Márgenes laterales | 20 px en móvil; 32–48 px en escritorio |
| Espaciado | Escala de 4, 8, 12, 16, 24, 32, 48, 64 y 96 px |
| Separación entre secciones | 64–96 px en escritorio; 40–64 px en móvil |
| Interior de paneles | 24–32 px en escritorio; 16–20 px en móvil |

Evita convertir cada párrafo en una tarjeta. Alterna texto abierto, separadores y paneles para crear jerarquía. La densidad de detalle de una ilustración puede ser alta; la interfaz que la acompaña debe seguir siendo sencilla de leer.

## 4. Paleta y temas

### Valores originales de Anatomy

Estos valores proceden de kit/iso.css. Sirven como base para conservar el carácter de la referencia.

| Función original | Claro | Oscuro |
|---|---|---|
| Fondo de página | #f2f2ef | #0b0b0b |
| Tarjeta / papel | #fbfbfa | #131313 |
| Texto | #57575a | #a3a3a3 |
| Texto destacado | #18181a | #e6e6e6 |
| Texto atenuado | #8c8c90 | #6e6e6e |
| Cara del objeto | #ffffff | #1b1b1b |
| Superficie superior | #ffffff | #1c1c1c |
| Sombra 0 | #dcdcd9 | #0f0f0f |
| Sombra 1 | #e5e5e2 | #121212 |
| Sombra 2 | #ededea | #151515 |
| Sombra 3 | #f4f4f1 | #181818 |
| Línea intensa | #26262a | #d4d4d4 |
| Línea media | #8a8a8f | #6a6a6a |
| Línea tenue | #b4b4b8 | #3e3e3e |
| Línea muy tenue | #d4d4d6 | #2a2a2a |
| Foco de la figura | #000000 | #ffffff |
| Rojo | #e5484d | #ff6b6b |
| Verde | #30a46c | #6be0a0 |
| Azul | #3e63dd | #6b9bff |

### Aplicación a una web

Mantén la mayor parte de la interfaz en neutros. Da protagonismo a una acción por grupo mediante contraste. Usa el color para comunicar selección, estado o una distinción que el usuario necesite entender. Los colores rojo, verde y azul son referencias disponibles; no es necesario utilizarlos todos.

Los tonos atenuados originales y las líneas de una ilustración no garantizan legibilidad como texto o controles. Para la interfaz, usa los tokens de texto accesibles propuestos abajo y verifica el contraste en el contexto final. Reserva los tonos más tenues para decoración no informativa. Los estados deben incluir texto, icono o forma además del color.

No basta con invertir los colores para crear el tema oscuro. Ajusta superficies, sombras e ilustraciones manteniendo su volumen y jerarquía. Si el producto no necesita tema oscuro, entrega un tema claro completo.

## 5. Tipografía

Usa una sans serif de sistema para navegación, títulos y lectura. Usa monoespaciada para rótulos técnicos, unidades, códigos, índices y datos. Estas familias reflejan las utilizadas por el kit:

css
--font-sans: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
--font-mono: ui-monospace, "SF Mono", Menlo, Consolas, monospace;


Escala inicial adaptada a la web:

| Uso | Tamaño / interlineado | Tratamiento |
|---|---|---|
| Título principal | clamp(36px, 5vw, 64px) / 1.08–1.15 | Peso 500–600; espaciado ligeramente cerrado |
| Título de sección | 28–36 px / 1.2 | Peso 500–600 |
| Título de componente | 18–22 px / 1.3 | Peso 500–600 |
| Texto de lectura | 16–18 px / 1.55–1.7 | Peso 400 |
| Controles y navegación | 14–16 px / 1.4 | Peso 400–500 |
| Rótulo técnico | 11–12 px / 1.4 | Mono; espaciado 0.04–0.1 em |
| Dato numérico | Según jerarquía | Cifras tabulares |

Limita las mayúsculas a rótulos breves. Los textos de uso frecuente deben tener un tamaño cómodo. La referencia utiliza rótulos de esquina de 10.5 px en sus figuras: no traslades ese tamaño al texto de navegación o a formularios.

## 6. Superficies, bordes e iconos

El panel característico de Anatomy es rectangular, con esquinas rectas, fondo apenas distinto del papel y un contorno fino. Conserva esa geometría en los grandes contenedores. Para botones y campos, utiliza radios discretos de 4–6 px cuando mejoren la interacción. Reserva la forma circular para elementos que lo requieran, como avatares o indicadores.

En la interfaz, usa bordes de 1 px. El trazo de 0.6 px de Anatomy corresponde al dibujo SVG y se reserva para él. Evita sombras grandes; una separación de superficie o una sombra corta y tenue suele ser suficiente. El halo bajo una máquina ilustrada pertenece a esa figura.

Usa iconos de una misma familia, de contorno sencillo y grosor consistente. Acompáñalos con texto cuando su función sea ambigua. Mantén los rótulos técnicos dentro de su panel y alineados con su contenido.

## 7. Componentes

| Componente | Regla visual y de comportamiento |
|---|---|
| Navegación | Altura contenida, alineación clara y separación inferior sutil. Estado activo visible mediante texto, subrayado o superficie. |
| Botón principal | Fondo tinta oscura y texto claro en tema claro; contraste equivalente en oscuro. Una acción dominante por grupo. |
| Botón secundario | Superficie neutra, borde fino y texto legible. Mantén el mismo tamaño y alineación que el principal. |
| Enlace | Identificable en reposo; en texto corrido, usa subrayado. |
| Campo | Etiqueta persistente, borde reconocible, ayuda próxima y error junto al campo. El placeholder es un ejemplo, no la etiqueta. |
| Pestañas | Rótulos breves y selección inequívoca mediante línea o superficie. |
| Tabla | Cabecera clara, divisores finos, cifras alineadas y unidades explícitas. |
| Indicador de estado | Texto breve con punto o icono; color moderado y significado consistente. |
| Panel explicativo | Título, contenido principal y pie o lectura de estado; separa los controles de la zona ilustrada. |
| Modal | Superficie sólida, jerarquía compacta y cierre evidente; conserva el foco y la operación con teclado. |

Define reposo, hover, foco, pulsación, selección, deshabilitado, carga y error para los componentes que los necesiten. El hover puede modificar el borde o la superficie ligeramente. El foco debe reconocerse de inmediato.

## 8. Ilustraciones y diagramas

Cuando una ilustración explique algo, representa un objeto físico reconocible cuyo funcionamiento permita entender la idea: un instrumento, un armario, un mecanismo, un banco de pruebas. Construye la complejidad mediante piezas con función, uniones y soportes coherentes.

- Usa perspectiva isométrica coherente. Referencia inicial: azimut de 45° y elevación de 30°; ajusta la cámara para mostrar el mecanismo.
- Representa espesor real, caras superiores claras, cuatro tonos próximos en los laterales y contornos finos.
- Ordena las piezas de atrás hacia delante. Las tuberías, cables y soportes deben conectar y respetar la geometría de los demás elementos.
- Mantén una paleta casi monocroma. Destaca una pieza principal por estado mediante el tono de mayor contraste.
- Usa detalles como tornillos, juntas o escalas cuando refuercen la construcción y se lean al tamaño final.
- Evita objetos formados por losas flotantes, cajas transparentes sin motivo, etiquetas suspendidas y líneas que terminan en el aire.
- Coloca las explicaciones en el marco, la leyenda o el pie. Dentro del objeto, admite como máximo una pequeña etiqueta grabada.
- Reserva aproximadamente el 55–65 % del marco para el objeto, con aire alrededor. Comprueba la lectura a 390 px de ancho.

El marco puede llevar un identificador arriba a la izquierda, un título corto arriba a la derecha, una indicación de interacción abajo a la izquierda y un dato real abajo a la derecha. En móvil, redistribuye estos elementos para evitar solapes.

Una web puede aplicar esta dirección visual sin añadir una ilustración en cada sección. Elige los lugares donde la figura explique una función o una idea central.

## 9. Movimiento

El movimiento debe ayudar a seguir una relación, reconocer un cambio o comprender un mecanismo. Mantén estable el resto de la página.

Curva original de Anatomy: cubic-bezier(.32,.72,0,1).

Valores iniciales adaptados:

| Uso | Duración orientativa |
|---|---|
| Cambio de color, borde o superficie | 120–180 ms |
| Apertura o transición de un componente | 180–280 ms |
| Desplazamiento de una pieza ilustrada | 300–700 ms, según recorrido |

Evita rebotes decorativos, parallax generalizado y entradas escalonadas de todo el contenido. En mecanismos interactivos, la pieza sigue suavemente el objetivo; un resorte puede oscilar si eso representa su comportamiento real. Los datos mostrados deben salir del mismo modelo que mueve la figura.

Detén animaciones al estabilizarse o salir de pantalla. Bajo prefers-reduced-motion: reduce, elimina recorridos automáticos, pulsos y movimiento no esencial; conserva todos los controles y resultados. Las funciones deben estar disponibles con teclado y mediante toque, además del puntero.

## 10. Luz y efectos

Usa WebGL, brillos, fuego, reflejos o partículas cuando el fenómeno forme parte de lo explicado. Integra su perspectiva, profundidad y color con el objeto. En tema claro, diseña el efecto sobre papel desde el principio: núcleo claro, cuerpo de color controlado y soporte físico cuando sea necesario.

Los efectos deben desaparecer suavemente antes de sus límites y conservar continuidad durante los cambios de estado. Incluye una representación estática o SVG útil cuando WebGL no esté disponible. Evita que un efecto dificulte la lectura o el uso de controles.

## 11. Base CSS autónoma

Tokens de interfaz adaptados a partir de la paleta original. Los colores de texto secundario y el foco se han reforzado para la web. Usa data-visual-theme="dark" en el elemento raíz si se implementa el tema oscuro. Si integras ilustraciones del kit, conserva sus variables --anatomy-* y vincúlalas explícitamente cuando corresponda.

css
:root {
  color-scheme: light;
  --page: #f2f2ef;
  --surface: #fbfbfa;
  --surface-raised: #ffffff;
  --text: #57575a;
  --text-strong: #18181a;
  --text-secondary: #656569;
  --border-decorative: #d4d4d6;
  --border-control: #8a8a8f;
  --action: #18181a;
  --on-action: #fbfbfa;
  --focus: #3e63dd;
  --font-sans: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  --font-mono: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
  --ease: cubic-bezier(.32,.72,0,1);
  --radius-panel: 0;
  --radius-control: 4px;
  --shadow-subtle: 0 1px 2px rgb(0 0 0 / 4%), 0 4px 12px rgb(0 0 0 / 3%);
}

:root[data-visual-theme="dark"] {
  color-scheme: dark;
  --page: #0b0b0b;
  --surface: #131313;
  --surface-raised: #1b1b1b;
  --text: #a3a3a3;
  --text-strong: #e6e6e6;
  --text-secondary: #a0a0a4;
  --border-decorative: #2a2a2a;
  --border-control: #757579;
  --action: #e6e6e6;
  --on-action: #131313;
  --focus: #6b9bff;
  --shadow-subtle: 0 1px 2px rgb(0 0 0 / 16%), 0 4px 12px rgb(0 0 0 / 12%);
}

body {
  margin: 0;
  background: var(--page);
  color: var(--text);
  font: 16px/1.6 var(--font-sans);
}

h1, h2, h3 { color: var(--text-strong); }

.technical-label {
  font: 12px/1.4 var(--font-mono);
  letter-spacing: .06em;
  font-variant-numeric: tabular-nums;
}

.panel {
  background: var(--surface);
  border: 1px solid var(--border-decorative);
  border-radius: var(--radius-panel);
  padding: clamp(16px, 3vw, 32px);
}

:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 3px;
}

@media (prefers-reduced-motion: reduce) {
  /* Aplicar a las clases de movimiento no esencial del proyecto. */
  .motion-decorative { animation: none; transition: none; }
  html { scroll-behavior: auto; }
}


Este bloque aporta una base visual; el agente debe completar los estilos de los componentes y sus estados. Los colores de estado, si se necesitan, requieren tokens propios y verificación según su uso como texto, icono o fondo.

## 12. Responsive y accesibilidad

En móvil, conserva el orden de lectura y agrupa cada control con aquello que modifica. Las columnas pasan a una cuando falta espacio. La navegación debe seguir siendo accesible sin depender de hover. Evita desplazamiento horizontal de la página; una tabla extensa puede tener su propio contenedor desplazable identificado.

Mantén áreas de interacción de aproximadamente 44 × 44 px para controles táctiles. Comprueba contraste de texto normal de al menos 4.5:1 y de texto grande de al menos 3:1; controles, estados y foco deben ser distinguibles. Los rótulos decorativos tenues nunca deben ser la única vía para conocer una instrucción o un estado.

Usa HTML semántico, etiquetas visibles y nombres accesibles. En ilustraciones interactivas, ofrece una descripción del objeto y controles con roles adecuados. Anuncia cambios relevantes de fase; evita anunciar cifras en cada fotograma. Mantén una versión comprensible con movimiento reducido.

## 13. Criterios de revisión

Antes de entregar, inspecciona la web a 390 px, en un ancho intermedio y en escritorio. Revisa también contenido largo, foco de teclado y los estados que realmente existan en el producto.

- ¿La jerarquía se entiende sin interacción?
- ¿Predominan papel, tinta y superficies neutras, con color funcional?
- ¿La tipografía de lectura y los rótulos técnicos cumplen funciones distintas?
- ¿Los márgenes, bordes, radios y tamaños se repiten con coherencia?
- ¿Hay una acción principal clara en cada contexto?
- ¿Los textos secundarios, controles y estados se leen con suficiente contraste?
- ¿Cada adorno o movimiento tiene una función reconocible?
- ¿Las ilustraciones mantienen volumen, conexiones y proporciones a su tamaño real?
- ¿Los datos y las animaciones representan el mismo estado?
- ¿Se puede completar la tarea con teclado, toque y movimiento reducido?
- ¿Ambos temas funcionan, si se ofrecen?

Corrige solapes, recortes accidentales, etiquetas ilegibles y estados ambiguos antes de añadir detalle visual.

## 14. Procedencia y alcance

Adaptación de Anatomy, de wheresryan22: https://github.com/wheresryan22/anatomy, revisión consultada 1482e8469b0a9e0d8cc18ea2740a01423d29ae80.

Fuentes utilizadas: references/craft.md para dirección artística, tonos, composición y temas; kit/iso.css para colores, tipografía, trazo y marco; references/motion.md para movimiento e interacción; kit/iso-kit.mjs para presentación de páginas y figuras; SKILL.md para principios generales y resumen de efectos.

Las reglas para navegación, botones, formularios, retícula, tamaños de interfaz, contraste y tokens web son una adaptación específica de esta guía. Este documento no sustituye un manual de marca con logotipo, tono verbal y activos propios.

El código original de Anatomy se distribuye bajo licencia MIT. Si se copian o distribuyen su código o partes sustanciales, conserva el aviso de copyright y la licencia del repositorio.