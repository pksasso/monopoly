import Phaser from 'phaser';
import {
  MONOPOLY_TILES,
  PropertyTile,
  RailroadTile,
  Tile,
  UtilityTile,
  TaxTile
} from '../data/tiles';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0
});

type TileOrientation = 'bottom' | 'left' | 'top' | 'right';

interface TilePosition {
  x: number;
  y: number;
  orientation: TileOrientation;
}

export default class GameScene extends Phaser.Scene {
  private boardSize = 0;

  private tileSize = 0;

  private tilePositions: TilePosition[] = [];

  private activeTileIndex = 0;

  private token!: Phaser.GameObjects.Arc;

  private currentTileLabel!: Phaser.GameObjects.Text;

  constructor() {
    super('GameScene');
  }

  create(): void {
    this.boardSize = Math.min(this.scale.width, this.scale.height) * 0.88;
    this.tileSize = this.boardSize / 11;

    const offsetX = (this.scale.width - this.boardSize) / 2;
    const offsetY = (this.scale.height - this.boardSize) / 2;

    this.tilePositions = this.computeTilePositions(offsetX, offsetY);

    this.drawBoard(offsetX, offsetY);
    this.createToken();
    this.createUi();

    this.input.keyboard?.on('keydown-SPACE', () => this.advanceToken());
    this.input.on('pointerdown', () => this.advanceToken());
  }

  private drawBoard(offsetX: number, offsetY: number): void {
    this.add
      .rectangle(
        this.scale.width * 0.5,
        this.scale.height * 0.5,
        this.boardSize,
        this.boardSize,
        0xffffff,
        0.95
      )
      .setStrokeStyle(6, 0x333333, 0.9);

    MONOPOLY_TILES.forEach((tile, index) => {
      const { x, y, orientation } = this.tilePositions[index];

      const rect = this.add.rectangle(
        x,
        y,
        this.tileSize,
        this.tileSize,
        tile.displayColor ?? 0xffffff,
        0.92
      );
      rect.setStrokeStyle(2, 0x1a1a1a, 0.8);

      const label = this.add.text(x, y, this.getTileLabel(tile), {
        fontFamily: 'sans-serif',
        fontSize: '11px',
        color: '#1a1a1a',
        align: 'center',
        wordWrap: { width: this.tileSize - 12 }
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

    this.add
      .text(this.scale.width * 0.5, offsetY + this.boardSize * 0.5, 'Monopoly', {
        fontFamily: 'serif',
        fontSize: `${Math.floor(this.boardSize * 0.08)}px`,
        color: '#1a1a1a',
        fontStyle: 'bold'
      })
      .setOrigin(0.5);
  }

  private createToken(): void {
    const startPosition = this.tilePositions[0];
    this.token = this.add.circle(
      startPosition.x,
      startPosition.y,
      this.tileSize * 0.22,
      0x1e6f5c
    );
    this.token.setStrokeStyle(3, 0x0b3b2e, 1);
    this.activeTileIndex = 0;
  }

  private createUi(): void {
    this.add
      .text(this.scale.width * 0.5, 30, 'Clique ou aperte espaço para mover o peão', {
        fontFamily: 'sans-serif',
        fontSize: '18px',
        color: '#1a1a1a'
      })
      .setOrigin(0.5);

    this.currentTileLabel = this.add
      .text(
        this.scale.width * 0.5,
        this.scale.height - 60,
        this.getTileDescription(MONOPOLY_TILES[this.activeTileIndex]),
        {
          fontFamily: 'sans-serif',
          fontSize: '16px',
          color: '#1a1a1a',
          align: 'center'
        }
      )
      .setOrigin(0.5);
  }

  private advanceToken(): void {
    this.activeTileIndex = (this.activeTileIndex + 1) % this.tilePositions.length;
    const nextPosition = this.tilePositions[this.activeTileIndex];

    this.tweens.add({
      targets: this.token,
      x: nextPosition.x,
      y: nextPosition.y,
      duration: 260,
      ease: 'Sine.easeInOut'
    });

    const currentTile = MONOPOLY_TILES[this.activeTileIndex];
    this.currentTileLabel.setText(this.getTileDescription(currentTile));
  }

  private getTileLabel(tile: Tile): string {
    if (tile.type === 'property') {
      return `${tile.name}\n${currencyFormatter.format(tile.cost)}`;
    }

    if (tile.type === 'railroad') {
      return `${tile.name}\n${currencyFormatter.format(tile.cost)}`;
    }

    if (tile.type === 'utility') {
      return `${tile.name}\n${currencyFormatter.format(tile.cost)}`;
    }

    if (tile.type === 'tax' || tile.type === 'luxury-tax') {
      return `${tile.name}\nPague ${currencyFormatter.format(tile.amount)}`;
    }

    if (tile.type === 'go') {
      return `${tile.name}\nReceba ${currencyFormatter.format(tile.payout)}`;
    }

    return tile.name;
  }

  private getTileDescription(tile: Tile): string {
    switch (tile.type) {
      case 'property':
        return this.describeProperty(tile);
      case 'railroad':
        return this.describeRailroad(tile);
      case 'utility':
        return this.describeUtility(tile);
      case 'tax':
      case 'luxury-tax':
        return `${tile.name}: pague ${currencyFormatter.format(tile.amount)} ao banco.`;
      case 'go':
        return `${tile.name}: receba ${currencyFormatter.format(tile.payout)} ao passar.`;
      case 'community-chest':
      case 'chance':
        return `${tile.name}: compre a carta correspondente.`;
      case 'jail':
        return `${tile.name}: apenas visitando.`;
      case 'free-parking':
        return `${tile.name}: zona de descanso.`;
      case 'go-to-jail':
        return `${tile.name}: vá direto para a cadeia.`;
      default:
        return 'Empty';
    }
  }

  private describeProperty(tile: PropertyTile): string {
    return [
      `${tile.name} (${tile.colorGroup})`,
      `Preço: ${currencyFormatter.format(tile.cost)} | Casa: ${currencyFormatter.format(tile.houseCost)}`,
      `Aluguéis: base ${currencyFormatter.format(tile.rent.base)}, mono ${currencyFormatter.format(tile.rent.monopoly)}, ` +
      `1c ${currencyFormatter.format(tile.rent.house1)}, 2c ${currencyFormatter.format(tile.rent.house2)}, ` +
      `3c ${currencyFormatter.format(tile.rent.house3)}, 4c ${currencyFormatter.format(tile.rent.house4)}, ` +
      `hotel ${currencyFormatter.format(tile.rent.hotel)}`
    ].join('\n');
  }

  private describeRailroad(tile: RailroadTile): string {
    return [
      `${tile.name} (Ferrovia)`,
      `Preço: ${currencyFormatter.format(tile.cost)}`,
      `Aluguéis: 1 ${currencyFormatter.format(tile.rent.one)}, 2 ${currencyFormatter.format(tile.rent.two)}, ` +
      `3 ${currencyFormatter.format(tile.rent.three)}, 4 ${currencyFormatter.format(tile.rent.four)}`
    ].join('\n');
  }

  private describeUtility(tile: UtilityTile): string {
    return [
      `${tile.name} (Companhia)`,
      `Preço: ${currencyFormatter.format(tile.cost)}`,
      `Aluguel: ${tile.rentMultiplier.oneUtility}x o valor dos dados, ` +
      `${tile.rentMultiplier.bothUtilities}x se possuir as duas.`
    ].join('\n');
  }

  private computeTilePositions(offsetX: number, offsetY: number): TilePosition[] {
    const positions: TilePosition[] = [];
    const startX = offsetX + this.boardSize - this.tileSize * 0.5;
    const startY = offsetY + this.boardSize - this.tileSize * 0.5;

    for (let i = 0; i < 11; i += 1) {
      positions.push({
        x: startX - i * this.tileSize,
        y: startY,
        orientation: 'bottom'
      });
    }

    for (let i = 1; i < 10; i += 1) {
      positions.push({
        x: offsetX + this.tileSize * 0.5,
        y: startY - i * this.tileSize,
        orientation: 'left'
      });
    }

    for (let i = 0; i < 11; i += 1) {
      positions.push({
        x: offsetX + this.tileSize * 0.5 + i * this.tileSize,
        y: offsetY + this.tileSize * 0.5,
        orientation: 'top'
      });
    }

    for (let i = 1; i < 10; i += 1) {
      positions.push({
        x: startX,
        y: offsetY + this.tileSize * 0.5 + i * this.tileSize,
        orientation: 'right'
      });
    }

    return positions;
  }
}
