# Sprite Scripting Guide

Wireboard now supports real-time sprite scripting! Write custom movement and behavior logic for your sprites directly in the editor.

## Opening the Script Editor

1. Right-click on a sprite
2. Select "Sprite" → "Edit Script"
3. Write your custom script in the modal editor
4. Click "Save Script" to apply

## Sprite API

Your script has access to a `sprite` object with the following methods and properties:

### Properties
- `sprite.x` - Current X position
- `sprite.y` - Current Y position
- `sprite.rotation` - Current rotation angle
- `sprite.startX` - Initial X position (stored at script start)
- `sprite.startY` - Initial Y position (stored at script start)

### Methods
- `sprite.getX()` - Get current X position
- `sprite.getY()` - Get current Y position
- `sprite.move(dx, dy)` - Move relative to current position
- `sprite.moveTo(x, y)` - Move to absolute position
- `sprite.rotate(angle)` - Rotate by angle (degrees)
- `sprite.setRotation(angle)` - Set absolute rotation (degrees)
- `sprite.setAnimation(name)` - Change animation (e.g., "idle", "punch")
- `sprite.setVelocity(vx, vy)` - Set velocity for automatic movement
- `sprite.getVelocity()` - Get current velocity as `{x, y}`

### Parameters
- `frame` - Frame number (approximately 60fps, increments by 1)
- `time` - Elapsed time in milliseconds since script started

## Script Execution

Scripts run **every frame** (60fps), so you have a lot of control over sprite behavior. The script context is automatically reset when you save a new script, so `time` always starts from 0.

## Examples

### Simple Circular Motion
```javascript
const radius = 100;
const centerX = sprite.startX;
const centerY = sprite.startY;
const angle = (time / 3000) * Math.PI * 2; // Full rotation in 3 seconds
const x = centerX + Math.cos(angle) * radius;
const y = centerY + Math.sin(angle) * radius;
sprite.moveTo(x, y);
```

### Bouncing Movement
```javascript
const speed = 2;
const maxX = sprite.startX + 100;
const minX = sprite.startX - 100;
const currentX = sprite.getX();

if (currentX >= maxX || currentX <= minX) {
  const velocity = sprite.getVelocity();
  sprite.setVelocity(-velocity.x, velocity.y);
} else {
  sprite.setVelocity(speed, 0);
}
```

### Rotating Movement
```javascript
const speed = 2;
sprite.rotate(speed); // Rotate by 2 degrees per frame
sprite.move(1, 0);     // Move right by 1 pixel per frame
```

### Wave Motion
```javascript
const amplitude = 50;
const frequency = 0.05;
const speed = 1;

const x = sprite.startX + (frame * speed);
const y = sprite.startY + Math.sin(frame * frequency) * amplitude;

sprite.moveTo(x, y);
```

### Animation Control
```javascript
// Loop between animations
const interval = 60; // frames per animation
const animationIndex = Math.floor(frame / interval) % 2;

if (animationIndex === 0) {
  sprite.setAnimation("idle");
} else {
  sprite.setAnimation("punch");
}
```

### Spiral Pattern
```javascript
const radius = 50 + (frame * 0.5); // Expanding spiral
const angle = (frame * 5) * (Math.PI / 180); // 5 degrees per frame
const centerX = sprite.startX;
const centerY = sprite.startY;

const x = centerX + Math.cos(angle) * radius;
const y = centerY + Math.sin(angle) * radius;

sprite.moveTo(x, y);
```

### Easing Motion (Ease Out)
```javascript
const duration = 120; // frames
const targetX = sprite.startX + 200;
const t = Math.min(frame / duration, 1);
const eased = 1 - Math.pow(1 - t, 3); // Ease-out cubic

const x = sprite.startX + (targetX - sprite.startX) * eased;
sprite.moveTo(x, sprite.y);
```

### Velocity-Based Movement
```javascript
// Use velocity for smooth continuous movement
if (frame === 0) {
  sprite.setVelocity(3, 1); // Move right and down
}

// Optional: reset velocity after some time
if (frame > 300) {
  sprite.setVelocity(0, 0);
}
```

## Tips & Best Practices

1. **Performance**: Avoid complex calculations in your script - it runs 60 times per second!
2. **Reset Behavior**: The script restarts from `time = 0` whenever you save it
3. **Storing State**: Use `sprite.startX` and `sprite.startY` to reference the initial position
4. **Debugging**: Check browser console (F12) for error messages
5. **Smooth Movement**: Use velocity for constant speed, use position updates for complex paths
6. **Animation Timing**: Remember `frame` is approximately based on ~60fps

## Advanced: Math Functions

All standard JavaScript Math functions are available:
- `Math.sin()`, `Math.cos()`, `Math.tan()`
- `Math.abs()`, `Math.sqrt()`, `Math.pow()`
- `Math.random()` (for randomized behavior)
- `Math.min()`, `Math.max()`
- `Math.floor()`, `Math.ceil()`, `Math.round()`

Example with randomness:
```javascript
if (frame % 30 === 0) { // Every 30 frames
  const randomX = sprite.startX + (Math.random() - 0.5) * 200;
  const randomY = sprite.startY + (Math.random() - 0.5) * 200;
  sprite.moveTo(randomX, randomY);
}
```

## Persistence

Your sprite scripts are automatically saved to IndexedDB along with your drawing, so they persist across sessions!
