import Phaser from 'phaser';
import GameScene from './scenes/GameScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 900,
  height: 900,
  parent: 'game-container',
  backgroundColor: '#f5f0dc',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [GameScene]
};

window.addEventListener('load', () => {
  new Phaser.Game(config);
});
