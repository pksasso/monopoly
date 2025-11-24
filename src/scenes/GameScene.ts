import Phaser from 'phaser';
import boardTexture from '../assets/board.png';
import token0Texture from '../assets/token-0.png';
import token1Texture from '../assets/token-1.png';
import token2Texture from '../assets/token-2.png';
import token3Texture from '../assets/token-3.png';
import { MONOPOLY_TILES, Tile, GoTile } from '../data/tiles';
import { BoardRenderer } from '../board/BoardRenderer';
import { TokenController } from '../board/TokenController';
import { TileHoverPreview } from '../board/TileHoverPreview';
import { computeBoardMetrics } from '../board/layout';
import { DicePanel } from '../ui/DicePanel';
import { InfoPanel } from '../ui/InfoPanel';
import { PlayerSelectionOverlay } from '../ui/PlayerSelectionOverlay';
import { APP_VERSION } from '../config/version';
import { preloadPropertyCards } from '../assets/propertyCards';
import { PlayerManager } from '../board/PlayerManager';

const PANEL_WIDTH = 300;
const PANEL_MARGIN = 40;

interface SceneData {
  playerPositions?: number[];
  activePlayerIndex?: number;
  humanPlayerCount?: number;
}

export default class GameScene extends Phaser.Scene {
  private boardRenderer!: BoardRenderer;

  private tokenController!: TokenController;

  private dicePanel!: DicePanel;

  private infoPanel!: InfoPanel;

  private tileHoverPreview!: TileHoverPreview;

  private playerManager!: PlayerManager;

  private currentTile: Tile | null = null;

  private activeTileIndex = 0;

  private activePlayerIndex = 0;

  private readonly totalPlayers = 4;

  private humanPlayerCount = 0;

  private playersReady = false;

  private isMoving = false;

  private autoRollTimer: Phaser.Time.TimerEvent | null = null;

  private playerSelectionOverlay?: PlayerSelectionOverlay;

  private readonly jailTileIndex = MONOPOLY_TILES.findIndex((tile) => tile.type === 'jail');

  private readonly goPayoutAmount =
    (MONOPOLY_TILES.find((tile) => tile.type === 'go') as GoTile | undefined)?.payout ?? 200;

  private readonly jailFineAmount = 50;

  preload(): void {
    this.load.image('board', boardTexture);
    this.load.image('token-0', token0Texture); 
    this.load.image('token-1', token1Texture);
    this.load.image('token-2', token2Texture);
    this.load.image('token-3', token3Texture);
    preloadPropertyCards(this.load, MONOPOLY_TILES);
  }

  create(data: SceneData = {}): void {
    this.humanPlayerCount = Phaser.Math.Clamp(
      data.humanPlayerCount ?? this.humanPlayerCount,
      0,
      this.totalPlayers
    );

    // Inicializar PlayerManager
    this.playerManager = new PlayerManager();

    const metrics = computeBoardMetrics(
      this.scale.width,
      this.scale.height,
      PANEL_WIDTH,
      PANEL_MARGIN
    );

    this.boardRenderer = new BoardRenderer({ scene: this, metrics });
    this.boardRenderer.render();

    this.tileHoverPreview = new TileHoverPreview({
      scene: this,
      tiles: MONOPOLY_TILES,
      tilePositions: this.boardRenderer.getTilePositions(),
      tileSize: metrics.tileSize
    });
    this.tileHoverPreview.create();

    this.add
      .text(12, 12, `v${APP_VERSION}`, {
        fontFamily: 'sans-serif',
        fontSize: '15px',
        color: '#4a4a4a98'
      })
      .setOrigin(0, 0)
      .setDepth(100);

    this.infoPanel = new InfoPanel({
      scene: this,
      boardCenterX: metrics.offsetX + metrics.boardSize * 0.5,
      boardTopY: metrics.offsetY,
      boardBottomY: metrics.offsetY + metrics.boardSize,
      boardWidth: metrics.boardSize
    });
    this.infoPanel.create('Selecione quantos jogadores humanos irão participar.');

    this.tokenController = new TokenController({
      scene: this,
      tilePositions: this.boardRenderer.getTilePositions(),
      tileSize: metrics.tileSize,
      tiles: MONOPOLY_TILES,
      onPlayerTileChanged: (playerIndex, tile, index) => this.handlePlayerTileChanged(playerIndex, tile, index)
    });

    this.dicePanel = new DicePanel({
      scene: this,
      panelX: metrics.offsetX + metrics.boardSize + PANEL_MARGIN,
      panelY: metrics.offsetY,
      panelWidth: PANEL_WIDTH,
      panelHeight: metrics.boardSize,
      canRoll: () => !this.isMoving && this.playersReady,
      onRollFinished: (dieOne, dieTwo) => this.handleDiceResult(dieOne, dieTwo)
    });
    this.dicePanel.create();

    if (data.playerPositions && data.playerPositions.length > 0) {
      this.initializePlayers(this.totalPlayers, {
        tileIndices: data.playerPositions,
        activePlayerIndex: data.activePlayerIndex ?? 0
      });
    }

    if (!this.playersReady) {
      this.showPlayerSelectionOverlay();
    }

    this.input.keyboard?.on('keydown-SPACE', () => this.dicePanel.requestRoll());

    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this);
      this.playerSelectionOverlay?.destroy();
      this.clearAutoRollTimer();
    });
  }

  private handlePlayerTileChanged(playerIndex: number, tile: Tile, index: number): void {
    if (playerIndex !== this.activePlayerIndex) {
      return;
    }

    this.currentTile = tile;
    this.activeTileIndex = index;
    this.updateActivePlayerInfo();
  }

  private handleDiceResult(dieOne: number, dieTwo: number): void {
    if (!this.playersReady || !this.playerManager) {
      return;
    }

    this.clearAutoRollTimer();
    const playerIndex = this.activePlayerIndex;

    if (this.playerManager.isPlayerInJail(playerIndex)) {
      this.handleJailRoll(dieOne, dieTwo);
      return;
    }

    this.handleNormalRoll(dieOne, dieTwo);
  }

  private handleNormalRoll(dieOne: number, dieTwo: number): void {
    if (!this.playerManager) {
      return;
    }

    const playerIndex = this.activePlayerIndex;
    const isDouble = dieOne === dieTwo;

    if (isDouble) {
      const count = this.playerManager.incrementConsecutiveDoubles(playerIndex);
      if (count >= 3) {
        this.playerManager.resetConsecutiveDoubles(playerIndex);
        this.sendActivePlayerToJail('three-doubles');
        return;
      }
    } else {
      this.playerManager.resetConsecutiveDoubles(playerIndex);
    }

    this.moveActivePlayerAndResolve(dieOne + dieTwo, {
      isDouble,
      allowExtraTurnOnDouble: true
    });
  }

  private handleJailRoll(dieOne: number, dieTwo: number): void {
    if (!this.playerManager) {
      return;
    }

    const playerIndex = this.activePlayerIndex;
    const isDouble = dieOne === dieTwo;

    if (isDouble) {
      this.playerManager.releasePlayerFromJail(playerIndex);
      this.moveActivePlayerAndResolve(dieOne + dieTwo, {
        isDouble,
        allowExtraTurnOnDouble: false
      });
      return;
    }

    const turnsServed = this.playerManager.incrementJailTurns(playerIndex);
    let unableToPayFine = false;

    if (turnsServed >= 3) {
      const paid = this.playerManager.subtractMoney(playerIndex, this.jailFineAmount);
      if (paid) {
        this.playerManager.releasePlayerFromJail(playerIndex);
        this.updateMoneyDisplay();
        this.moveActivePlayerAndResolve(dieOne + dieTwo, {
          isDouble: false,
          allowExtraTurnOnDouble: false
        });
        return;
      }

      // Jogador não conseguiu pagar, reinicia contagem e permanece preso.
      this.playerManager.resetJailTurns(playerIndex);
      unableToPayFine = true;
    }

    this.handlePlayerStayedInJail(unableToPayFine);
  }

  private moveActivePlayerAndResolve(
    steps: number,
    options: { isDouble: boolean; allowExtraTurnOnDouble: boolean }
  ): void {
    if (steps <= 0) {
      this.resolveLandingAfterMovement({
        passedGo: false,
        isDouble: options.isDouble,
        allowExtraTurnOnDouble: options.allowExtraTurnOnDouble
      });
      return;
    }

    const startIndex = this.activeTileIndex;
    const passedGo = this.didPassGo(startIndex, steps);

    this.isMoving = true;
    this.tokenController.moveActivePlayerBySteps(steps, () => {
      this.isMoving = false;
      this.resolveLandingAfterMovement({
        passedGo,
        isDouble: options.isDouble,
        allowExtraTurnOnDouble: options.allowExtraTurnOnDouble
      });
    });
  }

  private resolveLandingAfterMovement(options: {
    passedGo: boolean;
    isDouble: boolean;
    allowExtraTurnOnDouble: boolean;
  }): void {
    if (!this.playerManager) {
      return;
    }

    if (options.passedGo) {
      this.playerManager.addMoney(this.activePlayerIndex, this.goPayoutAmount);
    }

    const landedTile = this.currentTile ?? this.tokenController.getActiveTile();
    if (landedTile) {
      this.processTileTransaction(landedTile, { skipGoPayout: options.passedGo });
    }

    this.updateMoneyDisplay();

    if (landedTile?.type === 'go-to-jail') {
      this.sendActivePlayerToJail('go-to-jail');
      return;
    }

    if (options.allowExtraTurnOnDouble && options.isDouble) {
      this.handleTurnStart();
    } else {
      this.advanceTurn();
    }
  }

  private didPassGo(startIndex: number, steps: number): boolean {
    const totalTiles = MONOPOLY_TILES.length;
    if (totalTiles === 0) {
      return false;
    }

    const targetIndex = (startIndex + steps) % totalTiles;
    return targetIndex < startIndex;
  }

  private sendActivePlayerToJail(reason: 'go-to-jail' | 'three-doubles'): void {
    if (!this.playerManager || this.jailTileIndex < 0) {
      this.advanceTurn();
      return;
    }

    const playerIndex = this.activePlayerIndex;
    this.playerManager.sendPlayerToJail(playerIndex);

    this.isMoving = true;
    this.tokenController.moveActivePlayerToTile(this.jailTileIndex, () => {
      this.isMoving = false;
      this.currentTile = this.tokenController.getActiveTile();
      this.updateActivePlayerInfo();
      this.updateMoneyDisplay();

      const playerLabel = `Jogador ${playerIndex + 1}`;
      const reasonLabel =
        reason === 'three-doubles'
          ? 'tirou três duplas seguidas e foi enviado para a prisão.'
          : 'foi enviado diretamente para a prisão.';
      this.infoPanel.updateDescription(`${playerLabel} ${reasonLabel}`);

      this.advanceTurn();
    });
  }

  private handlePlayerStayedInJail(wasBroke = false): void {
    if (!this.playerManager) {
      return;
    }

    const player = this.playerManager.getPlayer(this.activePlayerIndex);
    if (player) {
      const attemptsLeft = Math.max(0, 3 - player.jailTurnsServed);
      const attemptLabel = wasBroke
        ? 'Sem dinheiro suficiente para pagar a fiança.'
        : `Ainda restam ${attemptsLeft} tentativa(s) para tirar dupla antes da fiança.`;
      this.infoPanel.updateDescription(
        `Jogador ${player.id + 1} permanece na prisão. ${attemptLabel}`
      );
    }

    this.advanceTurn();
  }

  private handleResize(): void {
    if (this.isMoving) {
      this.isMoving = false;
    }

    this.clearAutoRollTimer();

    const hasPlayers = this.playersReady && this.tokenController?.getPlayerCount?.() > 0;
    const state = hasPlayers ? this.tokenController.getState() : null;

    this.scene.restart({
      playerPositions: state?.tileIndices,
      activePlayerIndex: state?.activePlayerIndex,
      humanPlayerCount: this.humanPlayerCount
    });
  }

  private initializePlayers(playerCount: number, options: { tileIndices?: number[]; activePlayerIndex?: number } = {}): void {
    const normalizedCount = Math.max(0, Math.min(playerCount, this.totalPlayers));

    this.humanPlayerCount = Phaser.Math.Clamp(this.humanPlayerCount, 0, normalizedCount);

    // Inicializar PlayerManager
    this.playerManager.initializePlayers(normalizedCount, this.humanPlayerCount);

    this.tokenController.initializePlayers(normalizedCount, options);
    this.playersReady = normalizedCount > 0;
    this.activePlayerIndex = Math.min(
      options.activePlayerIndex ?? 0,
      Math.max(normalizedCount - 1, 0)
    );
    this.currentTile = this.tokenController.getActiveTile();
    this.activeTileIndex = this.tokenController.getActiveTileIndex();

    // Atualizar display de dinheiro
    this.updateMoneyDisplay();

    this.handleTurnStart();
  }

  private advanceTurn(): void {
    if (!this.playersReady) {
      return;
    }

    const previousPlayer = this.activePlayerIndex;
    this.activePlayerIndex = this.tokenController.advanceToNextPlayer();
    this.playerManager.setActivePlayerIndex(this.activePlayerIndex);
    this.playerManager.resetConsecutiveDoubles(previousPlayer);
    this.updateMoneyDisplay();
    this.handleTurnStart();
  }

  private updateActivePlayerInfo(): void {
    if (!this.playersReady || !this.currentTile) {
      return;
    }

    this.infoPanel.updateDescription(this.formatTileMessage(this.currentTile));
  }

  private showPlayerSelectionOverlay(): void {
    this.clearAutoRollTimer();
    this.playerSelectionOverlay?.destroy();
    this.playerSelectionOverlay = new PlayerSelectionOverlay({
      scene: this,
      onSelect: (count) => {
        this.humanPlayerCount = Phaser.Math.Clamp(count, 0, this.totalPlayers);
        this.initializePlayers(this.totalPlayers);
        this.playerSelectionOverlay?.destroy();
        this.playerSelectionOverlay = undefined;
      }
    });

    this.playerSelectionOverlay.show();
    this.dicePanel.setManualControl(false, 'Seleção de jogadores');
  }

  private formatTileMessage(tile: Tile): string {
    const roleLabel = this.isCurrentPlayerHuman() ? 'Humano' : 'Bot';
    const baseMessage = `Jogador ${this.activePlayerIndex + 1} (${roleLabel}) está em ${tile.name}`;

    const player = this.playerManager?.getPlayer(this.activePlayerIndex);
    if (player?.isInJail) {
      const attempts = player.jailTurnsServed;
      const attemptLabel =
        attempts === 0 ? 'Ainda não tentou sair.' : `${attempts} tentativa(s) usadas para sair.`;
      return `${baseMessage}\nNa prisão • ${attemptLabel}`;
    }

    const details = this.getTileDetails(tile);
    return details ? `${baseMessage}\n${details}` : baseMessage;
  }

  private getTileDetails(tile: Tile): string | null {
    if ('description' in tile && tile.description) {
      return tile.description;
    }

    if (tile.type === 'go') {
      return `Receba $${tile.payout} ao passar pelo Go.`;
    }

    if (tile.type === 'property') {
      return `Preço $${tile.cost} • Aluguel base $${tile.rent.base}`;
    }

    if (tile.type === 'railroad') {
      return `Preço $${tile.cost} • Aluguel inicial $${tile.rent.one}`;
    }

    if (tile.type === 'utility') {
      return `Preço $${tile.cost} • Multiplicador x${tile.rentMultiplier.oneUtility}`;
    }

    if (tile.type === 'tax' || tile.type === 'luxury-tax') {
      return `Pague $${tile.amount} ao banco.`;
    }

    return null;
  }

  private applyActivePlayerTheme(): void {
    const color = this.tokenController.getPlayerColor(this.activePlayerIndex) ?? 0x1e6f5c;
    this.dicePanel.setPlayerTheme(color);
  }

  private handleTurnStart(): void {
    if (!this.playersReady) {
      return;
    }

    if (!this.dicePanel) {
      return;
    }

    this.playerManager.setActivePlayerIndex(this.activePlayerIndex);
    this.clearAutoRollTimer();
    this.applyActivePlayerTheme();

    if (!this.currentTile) {
      this.currentTile = this.tokenController.getActiveTile();
    }

    this.updateActivePlayerInfo();

    const isHuman = this.isCurrentPlayerHuman();
    const isInJail = this.playerManager.isPlayerInJail(this.activePlayerIndex);
    const label = isInJail
      ? isHuman
        ? 'Na prisão: Jogar Dados'
        : 'Bot preso: aguardando'
      : isHuman
        ? 'Humano: Jogar Dados'
        : 'Bot: Aguardando';
    this.dicePanel.setManualControl(isHuman, label);

    if (!isHuman) {
      this.autoRollTimer = this.time.delayedCall(900, () => {
        this.autoRollTimer = null;
        this.dicePanel.forceRoll();
      });
    }
  }

  private isCurrentPlayerHuman(): boolean {
    return this.activePlayerIndex < this.humanPlayerCount;
  }

  private clearAutoRollTimer(): void {
    this.autoRollTimer?.remove(false);
    this.autoRollTimer = null;
  }

  private updateMoneyDisplay(): void {
    if (this.infoPanel && this.playerManager) {
      this.infoPanel.updateMoneyDisplay(
        this.playerManager.getPlayers(),
        this.activePlayerIndex
      );
    }
  }

  private processTileTransaction(tile: Tile, options: { skipGoPayout?: boolean } = {}): void {
    if (!this.playerManager) return;

    const playerIndex = this.activePlayerIndex;

    switch (tile.type) {
      case 'go':
        if (!options.skipGoPayout) {
          // Jogador recebe dinheiro ao passar ou pousar no Go
          this.playerManager.addMoney(playerIndex, tile.payout);
        }
        break;
        
      case 'tax':
      case 'luxury-tax':
        // Jogador paga imposto
        this.playerManager.subtractMoney(playerIndex, tile.amount);
        break;
        
      case 'property':
      case 'railroad':
      case 'utility':
        // Por enquanto, apenas mostrar o preço (compra será implementada depois)
        // this.playerManager.subtractMoney(playerIndex, tile.cost);
        break;
        
      default:
        // Outros tiles não afetam dinheiro diretamente
        break;
    }
  }
}
