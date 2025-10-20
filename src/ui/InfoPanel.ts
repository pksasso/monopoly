import Phaser from 'phaser';
import { Player } from '../board/PlayerManager';

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
  private moneyDisplay!: Phaser.GameObjects.Container;

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
        fontSize: '20px',
        color: '#1a1a1a'
      })
      .setOrigin(0.5);

    // Criar display de dinheiro dos jogadores
    this.createMoneyDisplay();

    const bottomLimit = this.scene.scale.height - 40;
    const infoY = Math.min(bottomLimit, this.boardBottomY + 40);

    this.currentTileLabel = this.scene.add
      .text(this.boardCenterX, infoY, initialDescription, {
        fontFamily: 'sans-serif',
        fontSize: '12px',
        color: '#1a1a1a',
        align: 'center'
      })
      .setOrigin(0.5)
      .setWordWrapWidth(this.boardWidth * 0.95);
  }

  updateDescription(description: string): void {
    this.currentTileLabel.setText(description);
  }

  createMoneyDisplay(): void {
    this.moneyDisplay = this.scene.add.container(0, 0);
    this.moneyDisplay.setDepth(50);
  }

  updateMoneyDisplay(players: Player[], activePlayerIndex: number): void {
    if (!this.moneyDisplay) return;

    // Limpar display anterior
    this.moneyDisplay.removeAll(true);

    // Posicionar na parte direita da tela, dispostos verticalmente
    const rightMargin = 20;
    const startX = this.scene.scale.width - rightMargin - 120; // 120px de largura para cada jogador
    const startY = 80; // Começar abaixo da mensagem de instruções
    const verticalSpacing = 60; // Espaçamento vertical entre jogadores

    players.forEach((player, index) => {
      const x = startX;
      const y = startY + (index * verticalSpacing);
      
      // Círculo colorido do jogador
      const circle = this.scene.add.circle(x - 40, y, 12, player.color);
      circle.setStrokeStyle(3, 0x0b3b2e, 1);
      
      // Número do jogador
      const playerNumber = this.scene.add.text(x - 40, y, `${index + 1}`, {
        fontFamily: 'sans-serif',
        fontSize: '12px',
        color: '#ffffff'
      }).setOrigin(0.5);
      
      // Nome do jogador
      const playerName = this.scene.add.text(x - 20, y - 8, player.name, {
        fontFamily: 'sans-serif',
        fontSize: '11px',
        color: '#1a1a1a'
      }).setOrigin(0, 0.5);
      
      // Dinheiro do jogador
      const moneyText = this.scene.add.text(x - 20, y + 8, `R$ ${player.money.toLocaleString('pt-BR')}`, {
        fontFamily: 'sans-serif',
        fontSize: '10px',
        color: '#1a1a1a'
      }).setOrigin(0, 0.5);
      
      // Destacar jogador ativo
      if (index === activePlayerIndex) {
        circle.setStrokeStyle(4, 0xff0000, 1);
        playerName.setStyle({ color: '#ff0000' });
        moneyText.setStyle({ color: '#ff0000' });
      }
      
      this.moneyDisplay.add([circle, playerNumber, playerName, moneyText]);
    });
  }
}
