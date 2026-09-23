import { GameEngine } from './packages/engine';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
  if (!canvas) throw new Error('Game canvas not found');

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D context not available');

  ctx.imageSmoothingEnabled = false;

  const engine = new GameEngine();

  // Check URL query parameters for test navigation
  const urlParams = new URLSearchParams(window.location.search);
  const qKid = urlParams.get('kid');
  const qRoom = urlParams.get('room');
  if (qKid) {
    engine.eventDispatcher.switchToKid(qKid);
  }
  if (qRoom) {
    engine.roomManager.setCurrentRoom(qRoom);
    const active = engine.actorManager.getActiveActor();
    active.roomId = qRoom;
    engine.roomManager.updateCamera(active.x, engine.roomManager.getCurrentRoom().width);
  }

  function getInternalCoordinates(e: MouseEvent): [number, number] {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const internalX = Math.floor((e.clientX - rect.left) * scaleX);
    const internalY = Math.floor((e.clientY - rect.top) * scaleY);
    return [
      Math.max(0, Math.min(canvas.width - 1, internalX)),
      Math.max(0, Math.min(canvas.height - 1, internalY)),
    ];
  }

  canvas.addEventListener('mousemove', (e) => {
    const [x, y] = getInternalCoordinates(e);
    engine.handleMouseMove(x, y);
  });

  canvas.addEventListener('click', (e) => {
    const [x, y] = getInternalCoordinates(e);
    engine.handleClick(x, y);
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === '1') {
      engine.eventDispatcher.switchToKid('dave');
    } else if (e.key === '2') {
      engine.eventDispatcher.switchToKid('bernard');
    } else if (e.key === '3') {
      engine.eventDispatcher.switchToKid('syd');
    } else if (e.key.toLowerCase() === 'w') {
      engine.sentenceConstructor.setVerb('WALK_TO');
    } else if (e.key.toLowerCase() === 'p') {
      engine.sentenceConstructor.setVerb('PICK_UP');
    } else if (e.key.toLowerCase() === 'u') {
      engine.sentenceConstructor.setVerb('USE');
    } else if (e.key.toLowerCase() === 'o') {
      engine.sentenceConstructor.setVerb('OPEN');
    } else if (e.key.toLowerCase() === 'l') {
      engine.sentenceConstructor.setVerb('LOOK_AT');
    }
  });

  let lastTime = performance.now();
  function gameLoop(now: number) {
    const dtSeconds = Math.min(0.1, (now - lastTime) / 1000);
    lastTime = now;

    engine.update(dtSeconds);
    engine.render(ctx!);

    requestAnimationFrame(gameLoop);
  }

  requestAnimationFrame(gameLoop);
});
