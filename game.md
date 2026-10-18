```md
# Bhaag Dipke Bhaag — how the game is made

Handoff for another agent. Read this before changing the runner. The game is an endless chase down a straight Delhi road. Dipke is not a 3D body. He is a photo that flips through running frames.

## Stack

- Vite + React 19 + TanStack Start + Tailwind.
- The whole game is one Three.js scene in src/game/runner.ts. The page shell and HUD are in src/routes/index.tsx.
- Three.js version in the project is 0.170. Right-handed. The player runs toward negative Z. The chase camera sits at positive Z and looks toward negative Z.
- Dev server is port 8080. Do not add a new framework or a second scene.

## The picture is the character

Dipke, the Delhi cop, and the RAF cop are flat cards (THREE.PlaneGeometry + THREE.MeshBasicMaterial). There is no skeleton, no bones, and no mixamo clip. Arms and legs move because the texture changes.

Each person is two cards glued back to back:

- Back card faces the chase camera. Its texture is the back-view run.
- Front card is rotated rotation.y = Math.PI and sits 0.08 in front. Its texture is the front-view run.
- Material: transparent true, alphaTest 0.15, FrontSide. The background of every frame must be transparent. If it is not, you see a rectangle.

Height is about 2.95 world units. The feet are lined up with footDrop so the soles sit on the road, not inside it. A squash on landing is just scale.y on the same card (poseSprite). It is not a rig.

dipkeLimbs groups still exist from an older attempt. The run does not use them. Do not start swinging those groups. The user rejected a 3D body.

## How a still photo becomes a run

One run cycle is a grid of photos of the same person, each a different stride.

| Who | Sheet | Grid | Frames |
| --- | --- | --- | --- |
| Dipke | public/characters/sheets/dipke-front.webp and dipke-back.webp | 4 columns, 3 rows | 12 |
| Delhi cop | public/characters/sheets/delhi-front.webp and delhi-back.webp | 4 columns, 2 rows | 8 |
| RAF cop | public/characters/sheets/raf-front.webp and raf-back.webp | 4 columns, 2 rows | 8 |
| Caught trio | public/characters/caught/hold/00.webp through 07.webp | separate files | 8 |

Loose frames also live in public/characters/bearded/front, bearded/back, and public/characters/cops. The live run uses the sheets, not those loose files. The loose files are the source the sheets were packed from.

Playback:

1. player.runAnimTime increases with speed (dt * currentSpeed * 0.42 while playing, a bit slower in the intro).
2. showRunFrame calls paintDipke(Math.floor(animTime * 3.15)).
3. putFrame does not swap images. It moves the texture UV window onto one cell of the sheet.
4. tex.repeat is one cell. tex.offset is that cell. A 1px pad keeps a neighbour frame from bleeding in.
5. Both the front sheet and the back sheet show the same index, so a camera that swings around does not show a mismatched stride.

Jump and land are not extra drawings. The code just holds one cell (showPoseFrame(3) going up, 8 coming down) and tilts the card with rotation.x. Flight is a single still (fly-front / fly-back). While flying, do not keep the run cycle going. That was a bug: legs kept running in the air.

A custom photo from the menu (coverPhoto) replaces both maps and sets photoOverride. While that is on, the sheet is not applied. The uploaded picture is one still, so it will not stride.

## Why it can look like a thin image

A plane has no thickness. If the camera orbits past the edge, you see a line. That is what the user kept calling "a thin image".

The fix is camera timing, not a mesh:

- During play the camera stays behind: camera.position.z = player.z + 7.5, look at player.z - 12. You only see the back card.
- During the intro (updateCutscene) the camera rides a list of keyframes from a high side view, down to a front view, then up and around to the chase view. samplePath blends those keys.
- While the camera crosses the edge (p.z between about -1.15 and 2.6), Dipke and both cops are visible = false. The shot is of the road and the metro, not of the card's edge.
- Intro length is the last key, t: 16.4 seconds. CUTSCENE_DURATION must match that last key.

Do not replace this with a 3D body. It was tried and rejected.

## Boot, so the start button is not frozen

Start used to wait for every frame. It now waits for three small posters only:

- /characters/bearded/front/00.webp
- /characters/cops/delhi/front/00.webp
- /characters/cops/raf/front/00.webp

The sheets stream in after that (streamSheet). Until a sheet arrives, the poster is the texture, so the first seconds can be a still. Then the run cycle appears by itself. A tap during boot is remembered (pendingStart) and the intro starts as soon as those three are in. Do not block the button on all 56 frames again.

## Game loop

mountGame owns the scene. The frame loop uses a fixed step around 1/60.

States: menu, cutscene, playing, caught, game over.

Each playing frame, in order:

1. Speed. Base 21, climbs with distance (+ distance * 0.008), caps at 38. Metro speed is 1.45x. Jetpack is 1.6x.
2. Move. player.z -= speed * dt. Distance shown on the HUD is speed * dt * 0.25, not raw metres of Z. Do not treat HUD metres and world Z as the same number.
3. Lane spring, jump, sprite, police, traffic, metro, camera, pickups, collision, spawns.

World motion is the player moving through a still road, plus road segments recycling when they fall behind the camera.

## Lanes, jump, hit

Three lanes: LANES = [-3.2, 0, 3.2].

Left and right (A/D, arrows, swipe, the on-screen buttons) call moveLane. That only sets targetX. stepLane is a spring: mass 72, k 9000, damping 1100, acceleration clamped to 240, velocity clamped to 18. The lean on the card is -vx * 0.032. Lane changes play public/sfx/lee.mp3 through audio.playSlide. There is no slide move. Down arrow and swipe-down must not slide. Do not put the slide back.

Jump: vy = 11.5, gravity 30 (arcade, not 9.8). Coyote time 0.12s, jump buffer 0.14s. Peak is a bit over 2 world units, which clears a barricade of height 1.1 and does not clear a bus.

Collision is a swept Z test so a fast frame cannot skip a thin board. An obstacle hits when the Z intervals overlap and |player.x - obs.x| is inside both widths. userData on every obstacle is { type, width, height, length, canJumpOver }. If canJumpOver and player.y >= height, it is a clean jump. Flying, or y > 3, skips collision.

Spawn rule that must stay: every cluster leaves one lane empty. lanesBlockedNear plus a chosen freeLane. Moving traffic is clamped to anchorZ so it cannot drift over and seal the last gap. If all three lanes are blocked, that is a bug.

## What is on the road

Spawned as obstacles in spawnCluster, every 30 world units, only after distance 40:

- DTC bus (createDtcBus). Green or blue, windows, wheels, headlights, side label. Not a plain box. Hitbox is not jumpable.
- Auto (createAutoRickshaw). Rear faces +Z, toward the chase camera, so you run up behind it. Yellow back with a window, shallow curved roof, green skirt, two rear wheels, one front wheel down the road, red tail lamps. Hitbox width 1.9, height 2.1, length 2.8. Not jumpable.
- Police barricade (createPoliceBarricade). Yellow board, jumpable at height 1.1. The words दिल्ली पुलिस are red (#dc2626) on a canvas texture, font Yatra One. The texture is cached. If you change the colour, change both the first paint and the document.fonts.load repaint.

Samosas are the score. Golden samosas and sky rings sit up high for the jetpack. Powerups: metro speed, magnet, chai (2x samosas), jetpack after distance 200.

Roadside dressing is parented to road segments. It is not in the obstacles array, so it cannot catch Dipke. That includes the protest banners, the waving flag, the closed Central Park board, the shuttered metro, the chai stall, and the detention bus. Do not move those people or boards into the lanes. The user had a flag line and a cop with a lathi removed from the road on purpose.

There is no cow. There is no cockroach, and no cockroach score. There is no Janpath/Palika fork and no triangle monument. Do not add those back unless the user asks again.

## Police chase

Two billboards follow Dipke: Delhi on the left, RAF on the right. Same sheet trick as Dipke, picked from front or back based on whether the camera is in front of them.

They are not a collision volume. The catch during a run is hitting an obstacle, which calls triggerPoliceTackle. The "police gap" number on the HUD is a displayed distance, not a real cop position.

After HUD distance 25 they fade out over 16 metres and slide sideways so they leave the frame. Do not pop them off in one frame.

## Caught scene

On a hit, state becomes CAUGHT for 4.2 seconds.

- Dipke, his shadow, both cops, every obstacle, and every pickup are hidden.
- One wide plane, caughtTrio, is placed at the crash. It flips caught/hold/00 through 07 at 5 fps.
- The camera sits in front of that plane and looks at it.
- Then the normal game-over card.

The hold frames are the only animation of the arrest. Do not go back to a biting UI banner. Do not show a tie on the khaki cop. The frames should read as the two officers holding Dipke, RAF with a victory sign, Dipke upset. If a frame is wrong, replace the image. Do not rebuild it as three separate characters unless the user asks, because their placement kept coming apart.

## Intro camera, in one pass

updateCutscene keyframes, times in seconds, offsets from the player:

1. High and to the side, near the metro bridge. A scripted train passes on the bridge. The train must sit on the bridge, not float. The bridge is extended so the train has track.
2. Drop toward the road and show Dipke and the two cops from the front for a few seconds.
3. Lift off to the side while the three cards are hidden, so nobody sees the edge.
4. Settle into the chase camera behind them. Then state becomes PLAYING and the HUD appears.

The train pass is linear in Z. Do not make the camera chase the train. That read as lag.

## Sound

Almost everything is Web Audio written in the audio object at the top of runner.ts. The metro is layers: wheel clacks, a band-pass hiss, a low hum. It must not be a buzzing sweep. Lane changes decode lee.mp3 once and replay that buffer. Siren, crash, pickup, jump, and the jetpack are oscillators or noise. Mute must silence all of them.

## HUD

The DOM in index.tsx is not inside the canvas. The runner writes text with getElementById. Samosas, distance, landmark, police gap, power-up bar, jump and lane buttons, boot bar, game-over card. Game-over copy comes from HINDI_QUIPS plus a reason string. High scores are localStorage keys bhaag_best_dist and bhaag_best_coins.

## If you change art

- Keep the person readable at the size of the card. Face, beard, white shirt, a little belly. Same face on every frame.
- Paint on a flat colour, then knock that colour out so the webp alpha is real. Magenta or a flat backdrop is fine if it is fully removed. A halo reads as a sticker.
- Stride frames must share the same canvas size and the same foot line. If the feet jump between frames, he will bounce.
- Pack a sheet in row-major order, left to right, top to bottom, and match cols, rows, and count in the streamSheet call.
- Back-view and front-view frames must be the same stride index. Frame 3 on the back is the same moment as frame 3 on the front.
- Do not draw a new 3D character. Do not put scenery in the three lanes unless it is a real obstacle with a free lane left open.

## Files an agent actually edits

| File | What it is |
| --- | --- |
| src/game/runner.ts | Scene, physics, sprites, spawns, intro, audio, catch |
| src/routes/index.tsx | Menu, HUD, buttons, boot copy |
| public/characters/sheets/*.webp | Run cycles the game plays |
| public/characters/caught/hold/*.webp | Arrest flipbook |
| public/sfx/lee.mp3 | Lane-change sound |
```