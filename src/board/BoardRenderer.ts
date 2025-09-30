import Phaser from 'phaser';
import { BoardMetrics, computeTilePositions } from './layout';
import { TilePosition } from './types';

interface BoardRendererConfig {
  scene: Phaser.Scene;
  metrics: BoardMetrics;
}

export class BoardRenderer {
  private readonly scene: Phaser.Scene;

  private readonly metrics: BoardMetrics;

  private readonly tilePositions: TilePosition[];

  private boardImage?: Phaser.GameObjects.Image;

  constructor({ scene, metrics }: BoardRendererConfig) {
    this.scene = scene;
    this.metrics = metrics;
    this.tilePositions = computeTilePositions(metrics.boardSize, metrics.offsetX, metrics.offsetY);
  }

  render(): void {
    this.drawBoardBackground();
  }

  getTilePosition(index: number): TilePosition {
    return this.tilePositions[index];
  }

  getTilePositions(): TilePosition[] {
    return this.tilePositions.slice();
  }

  private drawBoardBackground(): void {
    const { boardSize, offsetX, offsetY } = this.metrics;
    const centerX = Math.round(offsetX + boardSize * 0.5);
    const centerY = Math.round(offsetY + boardSize * 0.5);

    this.boardImage?.destroy();
    this.boardImage = this.scene.add.image(centerX, centerY, 'board');
    this.boardImage.setDisplaySize(Math.round(boardSize), Math.round(boardSize));
    this.boardImage.setOrigin(0.5);
  }
}
