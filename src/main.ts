import Phaser from 'phaser';
import GameScene from './scenes/GameScene';

type HighResGameConfig = Phaser.Types.Core.GameConfig & { resolution?: number };

const resolution = Math.min(window.devicePixelRatio || 1, 2);

const applyHighDpiCanvas = (game: Phaser.Game): void => {
  if (resolution <= 1) {
    return;
  }

  const canvas = game.canvas;
  const scaleManager = game.scale;

  if (!canvas || !scaleManager) {
    return;
  }

  const displaySize = scaleManager.displaySize;
  const displayWidth = Math.round(
    displaySize ? displaySize.width : scaleManager.width / resolution
  );
  const displayHeight = Math.round(
    displaySize ? displaySize.height : scaleManager.height / resolution
  );
  const pixelWidth = Math.round(displayWidth * resolution);
  const pixelHeight = Math.round(displayHeight * resolution);

  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }

  if (canvas.style.width !== `${displayWidth}px`) {
    canvas.style.width = `${displayWidth}px`;
  }

  if (canvas.style.height !== `${displayHeight}px`) {
    canvas.style.height = `${displayHeight}px`;
  }

  const renderer = game.renderer as
    | Phaser.Renderer.Canvas.CanvasRenderer
    | Phaser.Renderer.WebGL.WebGLRenderer;

  if (renderer && typeof renderer.resize === 'function') {
    renderer.resize(pixelWidth, pixelHeight);
  }
};

const config: HighResGameConfig = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  parent: 'game-container',
  backgroundColor: '#f5f0dc',
  resolution,
  render: {
    antialias: true,
    pixelArt: false,
    roundPixels: false
  },
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [GameScene]
};

declare global {
  interface Window {
    monopolyGame?: Phaser.Game;
    monopolyUiScale?: number;
    monopolyUiScaleOverride?: number;
  }
}

window.addEventListener('load', () => {
  const game = new Phaser.Game(config);
  window.monopolyGame = game;

  if (resolution > 1) {
    const updateResolution = () => applyHighDpiCanvas(game);

    if (game.isBooted) {
      updateResolution();
    } else {
      game.events.once(Phaser.Core.Events.BOOT, updateResolution);
    }

    game.scale.on(Phaser.Scale.Events.RESIZE, updateResolution);
    window.addEventListener('resize', updateResolution);

    game.events.once(Phaser.Core.Events.DESTROY, () => {
      game.scale.off(Phaser.Scale.Events.RESIZE, updateResolution);
      window.removeEventListener('resize', updateResolution);
    });
  }
});
