import Phaser from 'phaser';

interface DicePanelConfig {
  scene: Phaser.Scene;
  panelX: number;
  panelY: number;
  panelWidth: number;
  panelHeight: number;
  onRollFinished: (dieOne: number, dieTwo: number) => void;
  canRoll?: () => boolean;
}

export class DicePanel {
  private readonly scene: Phaser.Scene;

  private readonly panelWidth: number;

  private readonly panelHeight: number;

  private readonly onRollFinished: (dieOne: number, dieTwo: number) => void;

  private readonly canRoll?: () => boolean;

  private readonly panelX: number;

  private readonly panelY: number;

  private rollButton!: Phaser.GameObjects.Rectangle;

  private diceGraphics: Phaser.GameObjects.Graphics[] = [];

  private diceCenters: { x: number; y: number }[] = [];

  private diceAnimationEvent: Phaser.Time.TimerEvent | null = null;

  private readonly diceSize = 90;

  private rolling = false;

  constructor({ scene, panelX, panelY, panelWidth, panelHeight, onRollFinished, canRoll }: DicePanelConfig) {
    this.scene = scene;
    this.panelX = panelX;
    this.panelY = panelY;
    this.panelWidth = panelWidth;
    this.panelHeight = panelHeight;
    this.onRollFinished = onRollFinished;
    this.canRoll = canRoll;
  }

  create(): void {
    const panelCenterX = this.panelX + this.panelWidth / 2;

    this.scene.add
      .rectangle(this.panelX + this.panelWidth / 2, this.panelY + this.panelHeight / 2, this.panelWidth, this.panelHeight, 0xf7f2e9, 0.98)
      .setStrokeStyle(2, 0x999999, 0.8);

    this.rollButton = this.scene.add
      .rectangle(panelCenterX, this.panelY + 80, this.panelWidth - 40, 60, 0x1e6f5c, 1)
      .setStrokeStyle(2, 0x0b3b2e, 1)
      .setInteractive({ useHandCursor: true });

    this.scene.add
      .text(panelCenterX, this.panelY + 80, 'Jogar Dados', {
        fontFamily: 'sans-serif',
        fontSize: '20px',
        color: '#ffffff'
      })
      .setOrigin(0.5);

    this.rollButton.on('pointerover', () => {
      if (!this.rolling) {
        this.rollButton.setFillStyle(0x218c74);
      }
    });
    this.rollButton.on('pointerout', () => this.rollButton.setFillStyle(0x1e6f5c));
    this.rollButton.on('pointerdown', () => this.requestRoll());

    this.initializeDiceDisplay(panelCenterX);

    this.scene.add
      .text(panelCenterX, this.panelY + 360, 'Atalho: tecla Espaço', {
        fontFamily: 'sans-serif',
        fontSize: '14px',
        color: '#555555'
      })
      .setOrigin(0.5);
  }

  isRolling(): boolean {
    return this.rolling;
  }

  requestRoll(): void {
    if (this.rolling) {
      return;
    }

    if (this.canRoll && !this.canRoll()) {
      return;
    }

    const dieOneFinal = Phaser.Math.Between(1, 6);
    const dieTwoFinal = Phaser.Math.Between(1, 6);

    this.rolling = true;
    this.rollButton.setFillStyle(0x1e6f5c);

    this.animateDice(dieOneFinal, dieTwoFinal, () => {
      this.rolling = false;
      this.onRollFinished(dieOneFinal, dieTwoFinal);
    });
  }

  private initializeDiceDisplay(panelCenterX: number): void {
    const diceSpacing = this.diceSize + 20;
    const diceY = this.panelY + 220;

    this.diceCenters = [
      { x: panelCenterX - diceSpacing / 2, y: diceY },
      { x: panelCenterX + diceSpacing / 2, y: diceY }
    ];

    this.diceGraphics = [this.scene.add.graphics(), this.scene.add.graphics()];
    this.diceGraphics.forEach((_, index) => this.renderDice(index, 0));
  }

  private animateDice(finalOne: number, finalTwo: number, onComplete: () => void): void {
    const frames = 12;
    let currentFrame = 0;

    this.diceAnimationEvent?.remove(false);
    this.diceAnimationEvent = this.scene.time.addEvent({
      delay: 90,
      repeat: frames - 1,
      callback: () => {
        const isLastFrame = currentFrame === frames - 1;
        const valueOne = isLastFrame ? finalOne : Phaser.Math.Between(1, 6);
        const valueTwo = isLastFrame ? finalTwo : Phaser.Math.Between(1, 6);

        this.renderDice(0, valueOne);
        this.renderDice(1, valueTwo);

        currentFrame += 1;

        if (isLastFrame) {
          this.diceAnimationEvent = null;
          onComplete();
        }
      }
    });
  }

  private renderDice(index: number, value: number): void {
    const graphics = this.diceGraphics[index];
    const center = this.diceCenters[index];

    if (!graphics || !center) {
      return;
    }

    graphics.clear();

    const halfSize = this.diceSize / 2;
    const radius = 12;

    graphics.fillStyle(0xffffff, 1);
    graphics.fillRoundedRect(
      center.x - halfSize,
      center.y - halfSize,
      this.diceSize,
      this.diceSize,
      radius
    );
    graphics.lineStyle(3, 0x222222, 1);
    graphics.strokeRoundedRect(
      center.x - halfSize,
      center.y - halfSize,
      this.diceSize,
      this.diceSize,
      radius
    );

    if (value <= 0) {
      return;
    }

    const offset = this.diceSize * 0.28;
    const pipRadius = this.diceSize * 0.07;

    const pipPositions = {
      center: { x: center.x, y: center.y },
      topLeft: { x: center.x - offset, y: center.y - offset },
      topRight: { x: center.x + offset, y: center.y - offset },
      midLeft: { x: center.x - offset, y: center.y },
      midRight: { x: center.x + offset, y: center.y },
      bottomLeft: { x: center.x - offset, y: center.y + offset },
      bottomRight: { x: center.x + offset, y: center.y + offset }
    } as const;

    const layoutMap: Record<number, Array<keyof typeof pipPositions>> = {
      1: ['center'],
      2: ['topLeft', 'bottomRight'],
      3: ['topLeft', 'center', 'bottomRight'],
      4: ['topLeft', 'topRight', 'bottomLeft', 'bottomRight'],
      5: ['topLeft', 'topRight', 'center', 'bottomLeft', 'bottomRight'],
      6: ['topLeft', 'topRight', 'midLeft', 'midRight', 'bottomLeft', 'bottomRight']
    };

    const positions = layoutMap[value] ?? [];

    graphics.fillStyle(0x1a1a1a, 1);
    positions.forEach((key) => {
      const pip = pipPositions[key];
      graphics.fillCircle(pip.x, pip.y, pipRadius);
    });
  }
}
