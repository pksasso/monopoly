import Phaser from 'phaser';
import { Tile } from '../data/tiles';
import { TilePosition } from './types';

interface TokenControllerConfig {
  scene: Phaser.Scene;
  tilePositions: TilePosition[];
  tileSize: number;
  tiles: Tile[];
  onPlayerTileChanged: (playerIndex: number, tile: Tile, tileIndex: number) => void;
}

interface PlayerToken {
  id: number;
  token: Phaser.GameObjects.Sprite;
  tileIndex: number;
  color: number;
}

interface InitializeOptions {
  tileIndices?: number[];
  activePlayerIndex?: number;
}

const PLAYER_COLORS = [0x7B68EE, 0xABC703, 0xFFC266, 0xCC0000];

export class TokenController {
  private readonly scene: Phaser.Scene;

  private readonly tilePositions: TilePosition[];

  private readonly tileSize: number;

  private readonly tiles: Tile[];

  private readonly onPlayerTileChanged: (playerIndex: number, tile: Tile, tileIndex: number) => void;

  private players: PlayerToken[] = [];

  private activePlayerIndex = 0;

  constructor(config: TokenControllerConfig) {
    this.scene = config.scene;
    this.tilePositions = config.tilePositions;
    this.tileSize = config.tileSize;
    this.tiles = config.tiles;
    this.onPlayerTileChanged = config.onPlayerTileChanged;
  }

  initializePlayers(playerCount: number, options: InitializeOptions = {}): void {
    this.destroyTokens();

    if (playerCount <= 0) {
      this.players = [];
      this.activePlayerIndex = 0;
      return;
    }

    this.players = new Array(playerCount).fill(null).map((_, index) => {
      const tileIndex = options.tileIndices?.[index] ?? 0;
      const position = this.getTokenCoordinates(tileIndex, index, playerCount);
      const tokenKey = `token-${index % PLAYER_COLORS.length}`
      const token = this.scene.add.sprite(
        position.x,
        position.y,
        tokenKey,
        PLAYER_COLORS[index % PLAYER_COLORS.length]
      );

      token.setScale(0.4)
      return {
        id: index,
        token,
        tileIndex,
        color: PLAYER_COLORS[index % PLAYER_COLORS.length]
      } satisfies PlayerToken;
    });

    this.activePlayerIndex = Math.min(options.activePlayerIndex ?? 0, this.players.length - 1);
    this.updateTokenStyles();

    const activePlayer = this.players[this.activePlayerIndex];
    if (activePlayer) {
      this.onPlayerTileChanged(
        this.activePlayerIndex,
        this.tiles[activePlayer.tileIndex],
        activePlayer.tileIndex
      );
    }
  }

  moveActivePlayerBySteps(steps: number, onComplete: () => void): void {
    if (steps <= 0) {
      onComplete();
      return;
    }

    const player = this.players[this.activePlayerIndex];
    if (!player) {
      onComplete();
      return;
    }

    const nextTileIndex = (player.tileIndex + 1) % this.tilePositions.length;
    const nextPosition = this.getTokenCoordinates(nextTileIndex, this.activePlayerIndex, this.players.length);

    this.scene.tweens.add({
      targets: player.token,
      x: nextPosition.x,
      y: nextPosition.y,
      duration: 260,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        player.tileIndex = nextTileIndex;
        this.onPlayerTileChanged(
          this.activePlayerIndex,
          this.tiles[player.tileIndex],
          player.tileIndex
        );

        this.moveActivePlayerBySteps(steps - 1, onComplete);
      }
    });
  }

  advanceToNextPlayer(): number {
    if (!this.players.length) {
      return 0;
    }

    this.activePlayerIndex = (this.activePlayerIndex + 1) % this.players.length;
    this.updateTokenStyles();

    const activePlayer = this.players[this.activePlayerIndex];
    if (activePlayer) {
      this.onPlayerTileChanged(
        this.activePlayerIndex,
        this.tiles[activePlayer.tileIndex],
        activePlayer.tileIndex
      );
    }

    return this.activePlayerIndex;
  }

  getActivePlayerIndex(): number {
    return this.activePlayerIndex;
  }

  getActiveTile(): Tile | null {
    const activePlayer = this.players[this.activePlayerIndex];
    return activePlayer ? this.tiles[activePlayer.tileIndex] : null;
  }

  getActiveTileIndex(): number {
    const activePlayer = this.players[this.activePlayerIndex];
    return activePlayer ? activePlayer.tileIndex : 0;
  }

  getPlayerCount(): number {
    return this.players.length;
  }

  getState(): { tileIndices: number[]; activePlayerIndex: number } {
    return {
      tileIndices: this.players.map((player) => player.tileIndex),
      activePlayerIndex: this.activePlayerIndex
    };
  }

  getPlayerColor(index: number): number | null {
    return this.players[index]?.color ?? null;
  }

  private destroyTokens(): void {
    this.players.forEach((player) => player.token.destroy());
  }

  private updateTokenStyles(): void {
    this.players.forEach((player, index) => {
      const isActive = index === this.activePlayerIndex;
      player.token.setAlpha(isActive ? 1.0 : 0.7);
      player.token.setScale(isActive ? 0.45 : 0.4);
      player.token.setDepth(isActive ? 2 : 1);

      const tilePosition = this.getTokenCoordinates(player.tileIndex, index, this.players.length);
      player.token.setPosition(tilePosition.x, tilePosition.y);
    });
  }

  private getTokenCoordinates(tileIndex: number, playerIndex: number, totalPlayers: number): { x: number; y: number } {
    const tilePosition = this.tilePositions[tileIndex];
    const lateralVector = this.getLateralVector(tilePosition.orientation);
    const forwardVector = this.getForwardVector(tilePosition.orientation);

    const offsets = this.getOffsetPattern(totalPlayers)[playerIndex] ?? { lateral: 0, forward: 0 };
    const lateralDistance = this.tileSize * 0.25;
    const forwardDistance = this.tileSize * 0.22;

    const offsetX =
      tilePosition.x +
      lateralVector.x * lateralDistance * offsets.lateral +
      forwardVector.x * forwardDistance * offsets.forward;
    const offsetY =
      tilePosition.y +
      lateralVector.y * lateralDistance * offsets.lateral +
      forwardVector.y * forwardDistance * offsets.forward;

    return { x: offsetX, y: offsetY };
  }

  private getOffsetPattern(totalPlayers: number): Array<{ lateral: number; forward: number }> {
    switch (totalPlayers) {
      case 1:
        return [{ lateral: 0, forward: 0 }];
      case 2:
        return [
          { lateral: -0.75, forward: 0.6 },
          { lateral: 0.75, forward: 0.6 }
        ];
      case 3:
        return [
          { lateral: -0.75, forward: 0.6 },
          { lateral: 0.75, forward: 0.6 },
          { lateral: 0, forward: 1.3 }
        ];
      default:
        return [
          { lateral: -0.75, forward: 0.6 },
          { lateral: 0.75, forward: 0.6 },
          { lateral: -0.75, forward: 1.4 },
          { lateral: 0.75, forward: 1.4 }
        ];
    }
  }

  private getLateralVector(orientation: TilePosition['orientation']): { x: number; y: number } {
    if (orientation === 'left' || orientation === 'right') {
      return { x: 0, y: 1 };
    }

    return { x: 1, y: 0 };
  }

  private getForwardVector(orientation: TilePosition['orientation']): { x: number; y: number } {
    switch (orientation) {
      case 'bottom':
        return { x: 0, y: -1 };
      case 'top':
        return { x: 0, y: 1 };
      case 'left':
        return { x: 1, y: 0 };
      case 'right':
        return { x: -1, y: 0 };
      default:
        return { x: 0, y: 0 };
    }
  }
}
