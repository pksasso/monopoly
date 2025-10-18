import Phaser from 'phaser';

interface PlayerSelectionOverlayConfig {
  scene: Phaser.Scene;
  onSelect: (playerCount: number) => void;
}

export class PlayerSelectionOverlay {
  private readonly scene: Phaser.Scene;

  private readonly onSelect: (playerCount: number) => void;

  private container?: Phaser.GameObjects.Container;

  constructor({ scene, onSelect }: PlayerSelectionOverlayConfig) {
    this.scene = scene;
    this.onSelect = onSelect;
  }

  show(): void {
    this.destroy();

    const { width, height } = this.scene.scale;
    const panelWidth = Math.min(1380, width * 0.92);
    const panelHeight = Math.min(1020, height * 0.9);
    const centerX = width / 2;
    const centerY = height / 2;

    const elements: Phaser.GameObjects.GameObject[] = [];

    const backdrop = this.scene.add
      .rectangle(centerX, centerY, width, height, 0x000000, 0.55)
      .setOrigin(0.5)
      .setInteractive()
      .setDepth(1000);
    elements.push(backdrop);

    const panel = this.scene.add
      .rectangle(centerX, centerY, panelWidth, panelHeight, 0xf7f2e9, 0.98)
      .setStrokeStyle(5, 0x1e6f5c, 0.9)
      .setDepth(1001);
    elements.push(panel);

    const title = this.scene.add
      .text(centerX, centerY - panelHeight / 2 + 110, 'Selecione quantos jogadores humanos participarão', {
        fontFamily: 'sans-serif',
        fontSize: '55px',
        color: '#1a1a1a'
      })
      .setOrigin(0.5)
      .setDepth(1001);
    elements.push(title);

    const subtitle = this.scene.add
      .text(centerX, title.y + 70, 'Escolha de 0 a 4 jogadores humanos (os demais serão bots)', {
        fontFamily: 'sans-serif',
        fontSize: '40px',
        color: '#4a4a4a'
      })
      .setOrigin(0.5)
      .setDepth(1001);
    elements.push(subtitle);

    const buttonCounts = [0, 1, 2, 3, 4];
    const buttonSpacing = 180;
    const buttonY = centerY + 50;

    buttonCounts.forEach((count, index) => {
      const x = centerX + (index - (buttonCounts.length - 1) / 2) * buttonSpacing;

      const button = this.scene.add
        .rectangle(x, buttonY, 190, 130, 0x1e6f5c, 1)
        .setStrokeStyle(5, 0x0b3b2e, 1)
        .setInteractive({ useHandCursor: true })
        .setDepth(1001);

      button.on('pointerover', () => button.setFillStyle(0x218c74));
      button.on('pointerout', () => button.setFillStyle(0x1e6f5c));
      button.on('pointerdown', () => this.handleSelection(count));

      const label = this.scene.add
        .text(x, buttonY, `${count}`, {
          fontFamily: 'sans-serif',
          fontSize: '76px',
          color: '#ffffff'
        })
        .setOrigin(0.5)
        .setDepth(1001);

      elements.push(button, label);
    });

    const hint = this.scene.add
      .text(centerX, centerY + panelHeight / 2 - 90, 'Você poderá alterar a quantidade reiniciando a cena.', {
        fontFamily: 'sans-serif',
        fontSize: '38px',
        color: '#5a5a5a'
      })
      .setOrigin(0.5)
      .setDepth(1001);
    elements.push(hint);

    this.container = this.scene.add.container(0, 0, elements).setDepth(1000);
  }

  destroy(): void {
    this.container?.destroy(true);
    this.container = undefined;
  }

  private handleSelection(count: number): void {
    this.onSelect(count);
    this.destroy();
  }
}
