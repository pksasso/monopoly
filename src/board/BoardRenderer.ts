import Phaser from 'phaser';
import { Tile } from '../data/tiles';
import { buildTileLabel } from '../utils/tileText';
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

  constructor({ scene, metrics }: BoardRendererConfig) {
    this.scene = scene;
    this.metrics = metrics;
    this.tilePositions = computeTilePositions(
      metrics.boardSize,
      metrics.tileSize,
      metrics.offsetX,
      metrics.offsetY
    );
  }

  render(tiles: Tile[]): void {
    this.drawBoardBackground();
    this.drawTiles(tiles);
    this.drawBoardTitle();
  }

  getTilePosition(index: number): TilePosition {
    return this.tilePositions[index];
  }

  getTilePositions(): TilePosition[] {
    return this.tilePositions.slice();
  }

  private drawBoardBackground(): void {
    const { boardSize, offsetX, offsetY } = this.metrics;

    this.scene.add
      .rectangle(offsetX + boardSize * 0.5, offsetY + boardSize * 0.5, boardSize, boardSize, 0xffffff, 0.95)
      .setStrokeStyle(6, 0x333333, 0.9);
  }

  private drawTiles(tiles: Tile[]): void {
    tiles.forEach((tile, index) => {
      const { x, y, orientation } = this.tilePositions[index];
      const { tileSize } = this.metrics;

      const rect = this.scene.add.rectangle(
        x,
        y,
        tileSize,
        tileSize,
        tile.displayColor ?? 0xffffff,
        0.92
      );
      rect.setStrokeStyle(2, 0x1a1a1a, 0.8);

      const label = this.scene.add.text(x, y, buildTileLabel(tile), {
        fontFamily: 'sans-serif',
        fontSize: '11px',
        color: '#1a1a1a',
        align: 'center',
        wordWrap: { width: tileSize - 12 }
      });
      label.setOrigin(0.5);

      if (orientation === 'left') {
        label.setAngle(-90);
      } else if (orientation === 'top') {
        label.setAngle(180);
      } else if (orientation === 'right') {
        label.setAngle(90);
      }
    });
  }

  private drawBoardTitle(): void {
    const { boardSize, offsetX, offsetY } = this.metrics;

    this.scene.add
      .text(offsetX + boardSize * 0.5, offsetY + boardSize * 0.5, 'Monopoly', {
        fontFamily: 'serif',
        fontSize: `${Math.floor(boardSize * 0.08)}px`,
        color: '#1a1a1a',
        fontStyle: 'bold'
      })
      .setOrigin(0.5);
  }
}
