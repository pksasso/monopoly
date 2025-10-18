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

  private panelBackground!: Phaser.GameObjects.Rectangle;

  private accentBar!: Phaser.GameObjects.Rectangle;

  private diceGraphics: Phaser.GameObjects.Graphics[] = [];

  private diceCenters: { x: number; y: number }[] = [];

  private diceAnimationEvent: Phaser.Time.TimerEvent | null = null;

  private readonly diceSize = 130;

  private rolling = false;

  private rollButtonBaseColor = 0x1e6f5c;

  private rollButtonHoverColor = 0x218c74;

  private rollButtonBorderColor = 0x0b3b2e;

  private rollButtonLabel!: Phaser.GameObjects.Text;

  private manualControlEnabled = true;

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

    this.panelBackground = this.scene.add
      .rectangle(
        this.panelX + this.panelWidth / 2,
        this.panelY + this.panelHeight / 2,
        this.panelWidth,
        this.panelHeight,
        0xf7f2e9,
        0.98
      )
      .setStrokeStyle(3, this.rollButtonBorderColor, 0.9)
      .setDepth(0);

    this.accentBar = this.scene.add
      .rectangle(panelCenterX, this.panelY + 30, this.panelWidth - 40, 16, this.rollButtonBaseColor, 1)
      .setOrigin(0.5)
      .setDepth(1);

    this.rollButton = this.scene.add
      .rectangle(panelCenterX, this.panelY + 110, this.panelWidth - 40, 70, this.rollButtonBaseColor, 1)
      .setStrokeStyle(3, this.rollButtonBorderColor, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(2);

    this.rollButtonLabel = this.scene.add
      .text(panelCenterX, this.panelY + 110, 'Jogar Dados', {
        fontFamily: 'sans-serif',
        fontSize: '45px',
        color: '#ffffff'
      })
      .setOrigin(0.5)
      .setDepth(3);

    this.rollButton.on('pointerover', () => {
      if (!this.rolling && this.manualControlEnabled) {
        this.rollButton.setFillStyle(this.rollButtonHoverColor);
      }
    });
    this.rollButton.on('pointerout', () => this.applyControlVisuals());
    this.rollButton.on('pointerdown', () => this.requestRoll());

    this.initializeDiceDisplay(panelCenterX);

    this.scene.add
      .text(panelCenterX, this.panelY + 360, 'Atalho: tecla Espaço', {
        fontFamily: 'sans-serif',
        fontSize: '24px',
        color: '#555555'
      })
      .setOrigin(0.5)
      .setDepth(3);

    this.setPlayerTheme(this.rollButtonBaseColor);
  }

  isRolling(): boolean {
    return this.rolling;
  }

  requestRoll(): void {
    if (!this.manualControlEnabled) {
      return;
    }

    if (this.rolling) {
      return;
    }

    if (this.canRoll && !this.canRoll()) {
      return;
    }

    this.startRoll();
  }

  forceRoll(): void {
    if (this.rolling) {
      return;
    }

    if (this.canRoll && !this.canRoll()) {
      return;
    }

    this.startRoll();
  }

  setPlayerTheme(color: number): void {
    this.rollButtonBaseColor = color;
    this.rollButtonHoverColor = DicePanel.lightenColor(color, 0.2);
    this.rollButtonBorderColor = DicePanel.darkenColor(color, 0.3);

    const panelFillColor = DicePanel.lightenColor(color, 0.75);

    if (this.rollButton) {
      this.rollButton.setStrokeStyle(3, this.rollButtonBorderColor, 1);
    }

    if (this.rollButtonLabel) {
      this.rollButtonLabel.setColor('#ffffff');
      this.rollButtonLabel.setShadow(0, 2, '#000000', 0, true, true);
    }

    if (this.panelBackground) {
      this.panelBackground.setFillStyle(panelFillColor, 0.94);
      this.panelBackground.setStrokeStyle(3, this.rollButtonBorderColor, 0.85);
    }

    if (this.accentBar) {
      this.accentBar.setFillStyle(this.rollButtonBaseColor, 1);
    }

    this.applyControlVisuals();
  }

  setManualControl(enabled: boolean, label?: string): void {
    this.manualControlEnabled = enabled;

    if (this.rollButton) {
      if (enabled) {
        this.rollButton.setInteractive({ useHandCursor: true });
      } else {
        this.rollButton.disableInteractive();
      }
    }

    if (this.rollButtonLabel) {
      const fallback = enabled ? 'Jogar Dados' : 'Lançamento Automático';
      this.rollButtonLabel.setText(label ?? fallback);
    }

    this.applyControlVisuals();
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

  private startRoll(): void {
    const dieOneFinal = Phaser.Math.Between(1, 6);
    const dieTwoFinal = Phaser.Math.Between(1, 6);

    this.rolling = true;

    if (this.rollButton) {
      this.rollButton.setFillStyle(this.rollButtonBaseColor);
    }

    if (this.accentBar) {
      this.accentBar.setFillStyle(this.rollButtonBaseColor, 1);
    }

    this.animateDice(dieOneFinal, dieTwoFinal, () => {
      this.rolling = false;
      this.applyControlVisuals();
      this.onRollFinished(dieOneFinal, dieTwoFinal);
    });
  }

  private applyControlVisuals(): void {
    const baseColor = this.rollButtonBaseColor;
    const disabledColor = DicePanel.lightenColor(baseColor, 0.35);

    if (this.rollButton) {
      const fillColor = this.manualControlEnabled || this.rolling ? baseColor : disabledColor;
      this.rollButton.setFillStyle(fillColor);
      this.rollButton.setStrokeStyle(3, this.rollButtonBorderColor, 1);
    }

    if (this.accentBar) {
      const accentColor = this.manualControlEnabled || this.rolling
        ? baseColor
        : DicePanel.lightenColor(baseColor, 0.25);
      this.accentBar.setFillStyle(accentColor, 1);
    }

    if (this.rollButtonLabel) {
      this.rollButtonLabel.setAlpha(this.manualControlEnabled ? 1 : 0.95);
    }
  }

  private static lightenColor(color: number, intensity: number): number {
    const { r, g, b } = Phaser.Display.Color.IntegerToRGB(color);
    const clamped = Phaser.Math.Clamp(intensity, 0, 1);
    return Phaser.Display.Color.GetColor(
      Math.round(r + (255 - r) * clamped),
      Math.round(g + (255 - g) * clamped),
      Math.round(b + (255 - b) * clamped)
    );
  }

  private static darkenColor(color: number, intensity: number): number {
    const { r, g, b } = Phaser.Display.Color.IntegerToRGB(color);
    const clamped = Phaser.Math.Clamp(intensity, 0, 1);
    return Phaser.Display.Color.GetColor(
      Math.round(r * (1 - clamped)),
      Math.round(g * (1 - clamped)),
      Math.round(b * (1 - clamped))
    );
  }
}
