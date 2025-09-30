import Phaser from 'phaser';

interface InfoPanelConfig {
  scene: Phaser.Scene;
  boardCenterX: number;
  boardTopY: number;
  boardBottomY: number;
  boardWidth: number;
  uiScale?: number;
}

export class InfoPanel {
  private readonly scene: Phaser.Scene;

  private readonly boardCenterX: number;

  private readonly boardTopY: number;

  private readonly boardBottomY: number;

  private readonly boardWidth: number;

  private currentTileLabel!: Phaser.GameObjects.Text;

  private readonly uiScale: number;

  constructor({ scene, boardCenterX, boardTopY, boardBottomY, boardWidth, uiScale = 1 }: InfoPanelConfig) {
    this.scene = scene;
    this.boardCenterX = boardCenterX;
    this.boardTopY = boardTopY;
    this.boardBottomY = boardBottomY;
    this.boardWidth = boardWidth;
    this.uiScale = uiScale;
  }

  create(initialDescription: string): void {
    const scaledOffset = 48 * Math.min(this.uiScale, 2.4);
    const topTextY = Math.max(36 * this.uiScale, this.boardTopY - scaledOffset);
    const textResolution = Math.min(window.devicePixelRatio || 1, 2);
    const centerX = Math.round(this.boardCenterX);
    const headerY = Math.round(topTextY);

    const scaleManager = this.scene.scale;
    const displaySize = scaleManager.displaySize;
    const dpr = window.devicePixelRatio || 1;
    const displayHeight = displaySize ? displaySize.height : scaleManager.height / dpr;

    this.scene.add
      .text(centerX, headerY, 'Clique no botão ou use a barra de espaço para rolar os dados', {
        fontFamily: 'sans-serif',
        fontSize: `${Math.round(28 * Math.min(this.uiScale, 2.6))}px`,
        color: '#1a1a1a'
      })
      .setOrigin(0.5)
      .setResolution(textResolution);

    const bottomLimit = Math.round(displayHeight - 40);
    const infoY = Math.min(bottomLimit, this.boardBottomY + 60 * Math.min(this.uiScale, 2.2));

    const infoX = Math.round(this.boardCenterX);
    const infoTextY = Math.round(infoY);

    this.currentTileLabel = this.scene.add
      .text(infoX, infoTextY, initialDescription, {
        fontFamily: 'sans-serif',
        fontSize: `${Math.round(24 * Math.min(this.uiScale, 2.6))}px`,
        color: '#1a1a1a',
        align: 'center'
      })
      .setOrigin(0.5)
      .setResolution(textResolution)
      .setWordWrapWidth(this.boardWidth * 0.95);
  }

  updateDescription(description: string): void {
    this.currentTileLabel.setText(description);
  }
}
