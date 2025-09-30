import Phaser from 'phaser';
import boardTexture from '../assets/board.png';
import { MONOPOLY_TILES, Tile } from '../data/tiles';
import { BoardRenderer } from '../board/BoardRenderer';
import { TokenController } from '../board/TokenController';
import { TileHoverPreview } from '../board/TileHoverPreview';
import { computeBoardMetrics } from '../board/layout';
import { DicePanel } from '../ui/DicePanel';
import { InfoPanel } from '../ui/InfoPanel';
import { preloadPropertyCards } from '../assets/propertyCards';

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

  private tileHoverPreview!: TileHoverPreview;

  private currentTile: Tile = MONOPOLY_TILES[0];

  private activeTileIndex = 0;

  private isMoving = false;

  preload(): void {
    this.load.image('board', boardTexture);
    preloadPropertyCards(this.load, MONOPOLY_TILES);
  }

  create(data: SceneData = {}): void {
    this.activeTileIndex = data.activeTileIndex ?? 0;
    this.currentTile = MONOPOLY_TILES[this.activeTileIndex];

    const scaleManager = this.scale;
    const displaySize = scaleManager.displaySize;
    const dpr = window.devicePixelRatio || 1;
    const canvasWidth = displaySize ? displaySize.width : scaleManager.width / dpr;
    const canvasHeight = displaySize ? displaySize.height : scaleManager.height / dpr;

    const deviceScale = window.devicePixelRatio || 1;
    const overrideScale = window.monopolyUiScaleOverride;
    const baseScale = deviceScale > 1.1 ? deviceScale * 1.9 : 1.6;
    const uiScale = Math.min(
      Math.max(
        typeof overrideScale === 'number' && overrideScale > 0 ? overrideScale : baseScale,
        1.5
      ),
      3.2
    );
    window.monopolyUiScale = uiScale;

    const panelScale = Math.min(uiScale * 1.2, 3);
    const panelWidth = Math.max(PANEL_WIDTH * 1.4, PANEL_WIDTH * panelScale);

    const metrics = computeBoardMetrics(canvasWidth, canvasHeight, panelWidth, PANEL_MARGIN);

    this.boardRenderer = new BoardRenderer({ scene: this, metrics });
    this.boardRenderer.render();

    this.tileHoverPreview = new TileHoverPreview({
      scene: this,
      tiles: MONOPOLY_TILES,
      tilePositions: this.boardRenderer.getTilePositions(),
      tileSize: metrics.tileSize
    });
    this.tileHoverPreview.create();

    this.infoPanel = new InfoPanel({
      scene: this,
      boardCenterX: metrics.offsetX + metrics.boardSize * 0.5,
      boardTopY: metrics.offsetY,
      boardBottomY: metrics.offsetY + metrics.boardSize,
      boardWidth: metrics.boardSize,
      uiScale
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
      panelWidth,
      panelHeight: metrics.boardSize,
      canRoll: () => !this.isMoving,
      onRollFinished: (dieOne, dieTwo) => this.handleDiceResult(dieOne, dieTwo),
      uiScale
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
