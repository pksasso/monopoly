import Phaser from 'phaser';
import { Tile } from '../data/tiles';
import { TilePosition } from './types';

interface TokenControllerConfig {
  scene: Phaser.Scene;
  tilePositions: TilePosition[];
  tileSize: number;
  tiles: Tile[];
  onTileChanged: (tile: Tile, index: number) => void;
}

export class TokenController {
  private readonly scene: Phaser.Scene;

  private readonly tilePositions: TilePosition[];

  private readonly tileSize: number;

  private readonly tiles: Tile[];

  private readonly onTileChanged: (tile: Tile, index: number) => void;

  private token!: Phaser.GameObjects.Arc;

  private activeTileIndex = 0;

  constructor(config: TokenControllerConfig) {
    this.scene = config.scene;
    this.tilePositions = config.tilePositions;
    this.tileSize = config.tileSize;
    this.tiles = config.tiles;
    this.onTileChanged = config.onTileChanged;
  }

  spawn(startIndex = 0): void {
    this.activeTileIndex = startIndex;
    const position = this.tilePositions[this.activeTileIndex];

    this.token = this.scene.add.circle(
      position.x,
      position.y,
      this.tileSize * 0.22,
      0x1e6f5c
    );
    this.token.setStrokeStyle(3, 0x0b3b2e, 1);

    this.onTileChanged(this.tiles[this.activeTileIndex], this.activeTileIndex);
  }

  moveBySteps(steps: number, onComplete: () => void): void {
    if (steps <= 0) {
      onComplete();
      return;
    }

    this.activeTileIndex = (this.activeTileIndex + 1) % this.tilePositions.length;
    const nextPosition = this.tilePositions[this.activeTileIndex];

    this.scene.tweens.add({
      targets: this.token,
      x: nextPosition.x,
      y: nextPosition.y,
      duration: 260,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this.onTileChanged(this.tiles[this.activeTileIndex], this.activeTileIndex);
        this.moveBySteps(steps - 1, onComplete);
      }
    });
  }

  getActiveTile(): Tile {
    return this.tiles[this.activeTileIndex];
  }

  getActiveIndex(): number {
    return this.activeTileIndex;
  }
}
