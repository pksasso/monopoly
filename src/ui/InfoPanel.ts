import Phaser from 'phaser';

interface InfoPanelConfig {
  scene: Phaser.Scene;
  boardCenterX: number;
  boardTopY: number;
  boardBottomY: number;
  boardWidth: number;
}

export class InfoPanel {
  private readonly scene: Phaser.Scene;

  private readonly boardCenterX: number;

  private readonly boardTopY: number;

  private readonly boardBottomY: number;

  private readonly boardWidth: number;

  private currentTileLabel!: Phaser.GameObjects.Text;

  constructor({ scene, boardCenterX, boardTopY, boardBottomY, boardWidth }: InfoPanelConfig) {
    this.scene = scene;
    this.boardCenterX = boardCenterX;
    this.boardTopY = boardTopY;
    this.boardBottomY = boardBottomY;
    this.boardWidth = boardWidth;
  }

  create(initialDescription: string): void {
    const topTextY = Math.max(30, this.boardTopY - 30);

    this.scene.add
      .text(this.boardCenterX, topTextY, 'Clique no botão ou use a barra de espaço para rolar os dados', {
        fontFamily: 'sans-serif',
        fontSize: '34px',
        color: '#1a1a1a'
      })
      .setOrigin(0.5);

    const bottomLimit = this.scene.scale.height - 40;
    const infoY = Math.min(bottomLimit, this.boardBottomY + 40);

    this.currentTileLabel = this.scene.add
      .text(this.boardCenterX, infoY, initialDescription, {
        fontFamily: 'sans-serif',
        fontSize: '28px',
        color: '#1a1a1a',
        align: 'center'
      })
      .setOrigin(0.5)
      .setWordWrapWidth(this.boardWidth * 0.95);
  }

  updateDescription(description: string): void {
    this.currentTileLabel.setText(description);
  }
}
