import Phaser from 'phaser';
import { MONOPOLY_TILES, Tile } from '../data/tiles';
import { BoardRenderer } from '../board/BoardRenderer';
import { TokenController } from '../board/TokenController';
import { computeBoardMetrics } from '../board/layout';
import { DicePanel } from '../ui/DicePanel';
import { InfoPanel } from '../ui/InfoPanel';

const PANEL_WIDTH = 220;
const PANEL_MARGIN = 40;

interface SceneData {
  activeTileIndex?: number;
}

export default class GameScene extends Phaser.Scene {
  private boardRenderer!: BoardRenderer;

  private tokenController!: TokenController;

  private dicePanel!: DicePanel;

  private infoPanel!: InfoPanel;

  private currentTile: Tile = MONOPOLY_TILES[0];

  private activeTileIndex = 0;

  private isMoving = false;

  create(data: SceneData = {}): void {
    this.activeTileIndex = data.activeTileIndex ?? 0;
    this.currentTile = MONOPOLY_TILES[this.activeTileIndex];

    const metrics = computeBoardMetrics(
      this.scale.width,
      this.scale.height,
      PANEL_WIDTH,
      PANEL_MARGIN
    );

    this.boardRenderer = new BoardRenderer({ scene: this, metrics });
    this.boardRenderer.render(MONOPOLY_TILES);

    this.infoPanel = new InfoPanel({
      scene: this,
      boardCenterX: metrics.offsetX + metrics.boardSize * 0.5,
      boardTopY: metrics.offsetY,
      boardBottomY: metrics.offsetY + metrics.boardSize,
      boardWidth: metrics.boardSize
    });

    this.tokenController = new TokenController({
      scene: this,
      tilePositions: this.boardRenderer.getTilePositions(),
      tileSize: metrics.tileSize,
      tiles: MONOPOLY_TILES,
      onTileChanged: (tile, index) => this.handleTileChanged(tile, index)
    });
    this.tokenController.spawn(this.activeTileIndex);

    this.dicePanel = new DicePanel({
      scene: this,
      panelX: metrics.offsetX + metrics.boardSize + PANEL_MARGIN,
      panelY: metrics.offsetY,
      panelWidth: PANEL_WIDTH,
      panelHeight: metrics.boardSize,
      canRoll: () => !this.isMoving,
      onRollFinished: (dieOne, dieTwo) => this.handleDiceResult(dieOne, dieTwo)
    });
    this.dicePanel.create();

    this.input.keyboard?.on('keydown-SPACE', () => this.dicePanel.requestRoll());

    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this);
    });
  }

  private handleTileChanged(tile: Tile, index: number): void {
    this.currentTile = tile;
    this.activeTileIndex = index;
  }

  private handleDiceResult(dieOne: number, dieTwo: number): void {
    const steps = dieOne + dieTwo;
    this.isMoving = true;

    this.tokenController.moveBySteps(steps, () => {
      this.isMoving = false;
    });
  }

  private handleResize(): void {
    if (this.isMoving) {
      this.isMoving = false;
    }

    const index = this.tokenController?.getActiveIndex?.() ?? this.activeTileIndex;
    this.scene.restart({ activeTileIndex: index });
  }
}
