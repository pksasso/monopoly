import Phaser from 'phaser';
import { Tile } from '../data/tiles';
import {
  hasPropertyCardAsset,
  getPropertyCardTextureKey,
  computePropertyCardDimensions
} from '../assets/propertyCards';
import { TilePosition } from './types';

type Orientation = TilePosition['orientation'];

interface TileHoverPreviewConfig {
  scene: Phaser.Scene;
  tiles: Tile[];
  tilePositions: TilePosition[];
  tileSize: number;
}

export class TileHoverPreview {
  private readonly scene: Phaser.Scene;

  private readonly tiles: Tile[];

  private readonly tilePositions: TilePosition[];

  private readonly tileSize: number;

  private previewImage?: Phaser.GameObjects.Image;

  private readonly zones: Phaser.GameObjects.Zone[] = [];

  constructor({ scene, tiles, tilePositions, tileSize }: TileHoverPreviewConfig) {
    this.scene = scene;
    this.tiles = tiles;
    this.tilePositions = tilePositions;
    this.tileSize = tileSize;
  }

  create(): void {
    this.tiles.forEach((tile, index) => {
      const position = this.tilePositions[index];
      if (!position) {
        return;
      }

      const { width, height } = this.getZoneSize(position.orientation);
      const zone = this.scene.add.zone(position.x, position.y, width, height);
      zone.setInteractive({ useHandCursor: tile.type === 'property' });

      zone.on('pointerover', () => {
        if (tile.type === 'property') {
          this.showPropertyCard(tile, position);
        } else {
          this.hidePreview();
        }
      });

      zone.on('pointerout', () => {
        this.hidePreview();
      });

      this.zones.push(zone);
    });

    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
  }

  destroy(): void {
    this.previewImage?.destroy();
    this.previewImage = undefined;
    this.zones.forEach((zone) => zone.destroy());
    this.zones.length = 0;
  }

  private showPropertyCard(tile: Tile, position: TilePosition): void {
    if (tile.type !== 'property' || !hasPropertyCardAsset(tile.name)) {
      this.hidePreview();
      return;
    }

    const textureKey = getPropertyCardTextureKey(tile.name);
    if (!this.scene.textures.exists(textureKey)) {
      this.hidePreview();
      return;
    }

    if (!this.previewImage) {
      this.previewImage = this.scene.add.image(position.x, position.y, textureKey);
      this.previewImage.setDepth(30);
    } else {
      this.previewImage.setTexture(textureKey);
    }

    const texture = this.scene.textures.get(textureKey);
    const desiredHeight = this.tileSize * 4.2;
    const { width: displayWidth, height: displayHeight } = computePropertyCardDimensions(
      texture,
      desiredHeight
    );

    this.previewImage.setDisplaySize(displayWidth, displayHeight);

    const { x, y } = this.getPreviewPosition(position, displayWidth, displayHeight);
    this.previewImage.setPosition(x, y);

    this.previewImage.setVisible(true);
  }

  private hidePreview(): void {
    this.previewImage?.setVisible(false);
  }

  private getZoneSize(orientation: Orientation): { width: number; height: number } {
    const base = this.tileSize;

    if (orientation === 'top' || orientation === 'bottom') {
      return { width: base * 1.6, height: base * 0.95 };
    }

    return { width: base * 0.95, height: base * 1.6 };
  }

  private getPreviewPosition(
    position: TilePosition,
    previewWidth: number,
    previewHeight: number
  ): { x: number; y: number } {
    const margin = this.tileSize * 0.5;
    switch (position.orientation) {
      case 'bottom':
        return {
          x: position.x,
          y: position.y - previewHeight * 0.5 - margin
        };
      case 'top':
        return {
          x: position.x,
          y: position.y + previewHeight * 0.5 + margin
        };
      case 'left':
        return {
          x: position.x + previewWidth * 0.5 + margin,
          y: position.y
        };
      case 'right':
      default:
        return {
          x: position.x - previewWidth * 0.5 - margin,
          y: position.y
        };
    }
  }
}
