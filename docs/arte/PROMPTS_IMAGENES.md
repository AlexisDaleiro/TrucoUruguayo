# Prompts y procedencia del arte

Modo utilizado: ImageGen nativo de Codex, sin API key ni llamadas de pago configuradas por el proyecto. Originales conservados en la biblioteca local de imágenes generadas; copias en assets-src. Referencia 01 solo informa el lenguaje visual. No se usaron sus personajes, marca, botellas ni composición.

## Bloque de estilo fijo
Original 2D cutout cartoon illustration for a Uruguayan neighborhood bar card game. Bold charcoal ink contours, hand-drawn expressive shapes, saturated earthy colors, two-tone cel shading, warm amber light, large expressive heads and hands. Clean production-ready edges. No existing characters, trademarks, logos, text, watermarks or photorealism. Keep the same character identity and proportions across every part. Transparent PNG with genuine alpha for character parts.

## Washington — hoja base
Apply the fixed style. Original 65-year-old Uruguayan man, weathered tan skin, gray moustache and eyebrows, olive beret, olive plaid shirt and dark brown vest. One square transparent 4x4 cutout sheet, sixteen equal cells, ample padding, no grid or labels. Exact row-major parts: blank front head with ears, front torso, left upper arm, right upper arm; left forearm, right forearm, left resting hand, right resting hand; front beret and hair, back head and nape, back torso, two hands holding three blank cream cards; open eyes pair, neutral eyebrows pair, neutral mouth, nose with gray moustache. No facial features baked into blank head.

## Marta — hoja base
Same fixed style, layout and exact sixteen cells as Washington. Original 50-year-old Uruguayan woman, warm tan skin, dark brown hair in a bun, teal cardigan over ochre blouse. No hat, no moustache. Front hair with bun and back hair with bun replace beret parts. Keep separate blank head, eyes, brows, mouth and nose.

## Expresiones A — una hoja por personaje
Attach that character's base sheet as the identity reference. Apply fixed style. Create one transparent 4x4 sprite sheet of sixteen isolated facial overlays, equal cells and 15% clear padding, no full head silhouette, text or grid. Exact row-major content: open eyes pair, half-lidded eyes pair, closed eyes pair, right wink eyes pair; left wink eyes pair, eyes looking left pair, eyes looking right pair, raised eyebrows pair; furrowed eyebrows pair, neutral eyebrows pair, wrinkled nose (Washington includes gray moustache; Marta no moustache), two inflated cheek overlays; neutral mouth, smile, wide shouting mouth, O-shaped speaking mouth. Preserve identity and align feature scale.

## Expresiones B y manos — una hoja por personaje
Attach that character's base sheet. Apply fixed style. Transparent 4x4 sheet, sixteen equal cells, no labels or grid. Exact row-major content: puckered kissing mouth, biting lower lip with teeth, tongue tip sticking out, licking upper lip; lips pursed right, lips pursed left, slightly open talking mouth, angry frown; empty hand gripping imaginary cards with no cards drawn, palm slamming an imaginary card with no card drawn, hand in chin pose without face, pointing hand; hand gripping imaginary mate without cup, back left upper arm and forearm together in sleeve, back right upper arm and forearm together in sleeve, neck and nape skin patch. Natural five-finger hands. Washington olive plaid sleeves, Marta teal cardigan.

## Piezas individuales de reemplazo en 2048 px
Attach the relevant character sheet. Apply fixed style. Render ONLY {PART_NAME} for {CHARACTER}, matching its exact front or back camera view, pose and proportions from the sheet. One transparent 2048x2048 PNG. Reference origin at 50% width, 34.375% height; full reference canvas 320x320 design units. Keep all other layers absent. Do not bake shadows belonging to another body part. The import tool crops, cleans alpha and aligns to rig.json; do not stretch the source.

## Entornos por capas
Pared (generada): apply fixed style, empty wide terracotta brick wall with irregular mortar, dark timber beam across top, warm daylight, no objects, characters, window, table, television or text. Original hand-inked texture, 16:9.

Ventana: isolated rustic wooden four-pane window with daylight and rural foliage, fixed style, transparent 2048px, no room wall. Night variant dark blue panes and warm rim light.

Tele: isolated unbranded old CRT television shell, knobs and rabbit-ear aerial, transparent 2048px, empty green screen for separately rendered procedural football, no real club colors or logos.

Estantes: isolated worn wooden shelves and irregular unlabeled bottle silhouettes, transparent 2048px, no room wall.

Mesa: top/front perspective of a worn round wooden table for 1v1, or trapezoidal rectangular table for 2v2; transparent 2048px, no players, hands, cards or props. Keep center clear.

Objetos: individual transparent 2048px mate gourd, metal bombilla, small glass, loose matchsticks, lamp; each independent image. No branding. The current shipped versions of these layers are original code-drawn illustrations; image prompts are optional replacement specifications.

## Cartas
Twelve original cartoon Spanish deck figures: sota (10), mounted caballero (11), rey (12), each of oro, copa, espada and basto. Bold ink and flat cream/red/celeste/gold palette, number and suit legible at 40px, no copied deck illustrations. SVG is the authoritative format: tools/art/cards.tsx currently draws the figures and pips in code, then rasterizes the two complete skins for AssetPack. A generated bitmap is only a visual reference for a future SVG redraw.

## Archivos generados
- Washington: base-sheet.png, expressions-a.png, expressions-b.png; Marta: los mismos tres nombres en su carpeta.
- Galpón: wall.png; noche usa corrección de color del mismo original y otras luces/capas.
- Los originales se generaron a 1254px de lado (pared 1672x941). No se declara que el modelo haya entregado 2048px: el pipeline produce piezas alineadas @1x/@2x sin afirmar resolución de detalle inexistente.
- Rig: lienzo común320x320, origen160/110, jerarquía torso/cabeza/brazos/manos. AssetPack1.7.0, Sharp0.34.5 compartido para evitar conflicto libvips. Alpha limpio por componentes, cejas separadas por lado, packing sin rotación, validación de atlas no vacíos.
