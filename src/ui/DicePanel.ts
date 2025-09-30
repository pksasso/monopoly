import Phaser from 'phaser';

interface DicePanelConfig {
  scene: Phaser.Scene;
  panelX: number;
  panelY: number;
  panelWidth: number;
  panelHeight: number;
  onRollFinished: (dieOne: number, dieTwo: number) => void;
  canRoll?: () => boolean;
  uiScale?: number;
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

  private readonly baseDiceSize = 150;

  private diceSize = 90;

  private rolling = false;

  private readonly uiScale: number;

  private readonly panelPadding: number;

  private readonly innerWidth: number;

  private innerLeft = 0;

  private innerRight = 0;

  constructor({
    scene,
    panelX,
    panelY,
    panelWidth,
    panelHeight,
    onRollFinished,
    canRoll,
    uiScale = 1
  }: DicePanelConfig) {
    this.scene = scene;
    this.panelX = panelX;
    this.panelY = panelY;
    this.panelWidth = panelWidth;
    this.panelHeight = panelHeight;
    this.onRollFinished = onRollFinished;
    this.canRoll = canRoll;
    this.uiScale = uiScale;
    this.panelPadding = Math.round(24 * Math.min(this.uiScale, 2.4));
    this.innerWidth = Math.max(
      this.panelWidth - this.panelPadding * 2,
      Math.max(160, Math.round(this.panelWidth * 0.55))
    );
    this.diceSize = this.computeDiceSize();
  }

  private computeDiceSize(): number {
    const minSize = Math.max(96, Math.round(120 * Math.min(this.uiScale, 1.4)));
    const spacingExtra = Math.round(32 * Math.min(this.uiScale, 2.3));
    const rawMax = Math.floor((this.innerWidth - spacingExtra) / 2);
    const maxSize = Math.max(minSize, rawMax);
    const desired = Math.round(this.baseDiceSize * Math.min(this.uiScale, 2.4));
    return Phaser.Math.Clamp(desired, minSize, maxSize);
  }

  create(): void {
    const innerLeft = this.panelX + this.panelPadding;
    const innerRight = innerLeft + this.innerWidth;
    const innerTop = this.panelY + this.panelPadding;
    const innerBottom = this.panelY + this.panelHeight - this.panelPadding;

    this.innerLeft = innerLeft;
    this.innerRight = innerRight;

    const panelCenterX = innerLeft + this.innerWidth / 2;
    const textResolution = Math.min(window.devicePixelRatio || 1, 2);

    this.scene.add
      .rectangle(
        Math.round(this.panelX + this.panelWidth / 2),
        Math.round(this.panelY + this.panelHeight / 2),
        Math.round(this.panelWidth),
        Math.round(this.panelHeight),
        0xf7f2e9,
        0.98
      )
      .setStrokeStyle(2, 0x999999, 0.8);

    const buttonX = Math.round(panelCenterX);
    const buttonHeight = Math.max(72, Math.round(76 * Math.min(this.uiScale, 2.4)));
    const buttonY = Math.round(innerTop + buttonHeight / 2);
    const scaledButtonWidth = Math.round((this.innerWidth - 24) * Math.min(this.uiScale, 1.9));
    const maxButtonWidth = Math.round(this.innerWidth - Math.max(24, this.panelPadding * 0.4));
    const buttonWidth = Phaser.Math.Clamp(
      scaledButtonWidth,
      Math.min(240, maxButtonWidth),
      maxButtonWidth
    );

    this.rollButton = this.scene.add
      .rectangle(buttonX, buttonY, buttonWidth, buttonHeight, 0x1e6f5c, 1)
      .setStrokeStyle(2, 0x0b3b2e, 1)
      .setInteractive({ useHandCursor: true });

    this.scene.add
      .text(buttonX, buttonY, 'Jogar Dados', {
        fontFamily: 'sans-serif',
        fontSize: `${Math.round(30 * Math.min(this.uiScale, 2.4))}px`,
        color: '#ffffff'
      })
      .setOrigin(0.5)
      .setResolution(textResolution);

    this.rollButton.on('pointerover', () => {
      if (!this.rolling) {
        this.rollButton.setFillStyle(0x218c74);
      }
    });
    this.rollButton.on('pointerout', () => this.rollButton.setFillStyle(0x1e6f5c));
    this.rollButton.on('pointerdown', () => this.requestRoll());

    const buttonBottom = buttonY + buttonHeight / 2;
    const diceSpacingY = Math.max(36, this.panelPadding * 0.8);
    const desiredDiceCenter = buttonBottom + diceSpacingY + this.diceSize / 2;
    const maxDiceCenter = innerBottom - this.diceSize / 2 - Math.max(36, this.panelPadding * 0.7);
    const diceCenterY = Phaser.Math.Clamp(
      desiredDiceCenter,
      buttonBottom + diceSpacingY,
      Math.max(buttonBottom + diceSpacingY, maxDiceCenter)
    );

    this.initializeDiceDisplay(panelCenterX, diceCenterY);

    const hintSpacing = Math.max(32, this.panelPadding * 0.7);
    const desiredHint = diceCenterY + this.diceSize / 2 + hintSpacing;
    const maxHint = innerBottom - Math.max(20, this.panelPadding * 0.35);
    const hintY = Math.min(desiredHint, maxHint);

    this.scene.add
      .text(Math.round(panelCenterX), hintY, 'Atalho: tecla Espaço', {
        fontFamily: 'sans-serif',
        fontSize: `${Math.round(20 * Math.min(this.uiScale, 2.4))}px`,
        color: '#555555'
      })
      .setOrigin(0.5)
      .setResolution(textResolution);
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

  private initializeDiceDisplay(panelCenterX: number, diceCenterY: number): void {
    const diceMargin = Math.round(
      Math.min(this.innerWidth / 6, 28 * Math.min(this.uiScale, 2.4))
    );

    let leftCenter = this.innerLeft + this.diceSize / 2 + diceMargin;
    let rightCenter = this.innerRight - this.diceSize / 2 - diceMargin;

    if (rightCenter - leftCenter < this.diceSize * 0.6) {
      const offset = this.diceSize * 0.6;
      leftCenter = panelCenterX - offset;
      rightCenter = panelCenterX + offset;
    }

    leftCenter = Phaser.Math.Clamp(
      leftCenter,
      this.innerLeft + this.diceSize / 2,
      this.innerRight - this.diceSize / 2
    );
    rightCenter = Phaser.Math.Clamp(
      rightCenter,
      this.innerLeft + this.diceSize / 2,
      this.innerRight - this.diceSize / 2
    );

    if (rightCenter - leftCenter < this.diceSize * 0.4) {
      leftCenter = panelCenterX - this.diceSize * 0.5;
      rightCenter = panelCenterX + this.diceSize * 0.5;
    }

    this.diceCenters = [
      { x: Math.round(leftCenter), y: Math.round(diceCenterY) },
      { x: Math.round(rightCenter), y: Math.round(diceCenterY) }
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
    const radius = Math.round(Math.min(this.diceSize * 0.18, 28));
    const rectX = Math.round(center.x - halfSize);
    const rectY = Math.round(center.y - halfSize);

    graphics.fillStyle(0xffffff, 1);
    graphics.fillRoundedRect(
      rectX,
      rectY,
      this.diceSize,
      this.diceSize,
      radius
    );
    const borderWidth = Math.max(3, Math.round(3 * Math.min(this.uiScale, 2)));
    graphics.lineStyle(borderWidth, 0x222222, 1);
    graphics.strokeRoundedRect(
      rectX,
      rectY,
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
      center: { x: Math.round(center.x), y: Math.round(center.y) },
      topLeft: { x: Math.round(center.x - offset), y: Math.round(center.y - offset) },
      topRight: { x: Math.round(center.x + offset), y: Math.round(center.y - offset) },
      midLeft: { x: Math.round(center.x - offset), y: Math.round(center.y) },
      midRight: { x: Math.round(center.x + offset), y: Math.round(center.y) },
      bottomLeft: { x: Math.round(center.x - offset), y: Math.round(center.y + offset) },
      bottomRight: { x: Math.round(center.x + offset), y: Math.round(center.y + offset) }
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
