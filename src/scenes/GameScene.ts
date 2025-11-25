import Phaser from 'phaser';
import boardTexture from '../assets/board.png';
import { MONOPOLY_TILES, Tile } from '../data/tiles';
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

  preload(): void {
    this.load.image('board', boardTexture);
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
    
    // Processar transações de dinheiro baseadas no tile
    this.processTileTransaction(tile);
    
    this.updateActivePlayerInfo();
    this.updateMoneyDisplay();
  }

  private handleDiceResult(dieOne: number, dieTwo: number): void {
    if (!this.playersReady) {
      return;
    }

    const steps = dieOne + dieTwo;
    this.clearAutoRollTimer();
    this.isMoving = true;

    this.tokenController.moveActivePlayerBySteps(steps, () => {
      this.isMoving = false;
      this.advanceTurn();
    });
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

    this.activePlayerIndex = this.tokenController.advanceToNextPlayer();
    this.playerManager.setActivePlayerIndex(this.activePlayerIndex);
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

    this.clearAutoRollTimer();
    this.applyActivePlayerTheme();

    if (!this.currentTile) {
      this.currentTile = this.tokenController.getActiveTile();
    }

    this.updateActivePlayerInfo();

    const isHuman = this.isCurrentPlayerHuman();
    const label = isHuman ? 'Humano: Jogar Dados' : 'Bot: Aguardando';
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

   private processTileTransaction(tile: Tile): void {
  const playerIndex = this.activePlayerIndex;

  switch (tile.type) {
    case 'go':
      this.playerManager.addMoney(playerIndex, tile.payout);
      return;

    case 'tax':
      this.playerManager.subtractMoney(playerIndex, tile.amount ?? 200);
      return;

    case 'luxury-tax':
      this.playerManager.subtractMoney(playerIndex, tile.amount);
      return;

    case 'property':
      this.handlePropertyMenu(tile);
      return;

    case 'railroad':
    case 'utility':
      // (implementação futura: compra, aluguel etc.)
      return;

    default:
      return;
  }
}

  private handlePropertyMenu(tile: Tile): void {
  const playerIndex = this.activePlayerIndex;
  const owner = tile.owner;

  const choice = window.prompt(
    "Selecione uma opção:\n" +
    "1- Comprar\n" +
    "2- Pagar aluguel\n" +
    "3- Vender para outro jogador\n" +
    "4- Vender para o banco\n" +
    "5- Trocar propriedade\n"
  );

  switch (choice) {
    case '1': // Comprar
      if (!owner) {
        if (window.confirm("Deseja comprar esta propriedade?")) {
          this.playerManager.buyTile(playerIndex, tile.id);
        }
      } else {
        window.alert("Esta propriedade já tem dono.");
      }
      break;

    case '2': // Pagar aluguel
      if (owner != null && owner !== playerIndex) {
        this.playerManager.payRent(playerIndex, tile);
      } else {
        window.alert("Ninguém é dono desta propriedade.");
      }
      break;

    case '3': // Venda para outro jogador
      this.handleSellToPlayer(tile);
      break;

    case '4': // Venda ao banco
      if (owner === playerIndex) {
        if (window.confirm("Confirmar venda ao banco?")) {
          this.playerManager.sellToBank(playerIndex, tile.id);
        }
      } else {
        window.alert("Você não é o dono desta propriedade.");
      }
      break;

    case '5': // Troca
      this.handleTrade(tile);
      break;

    default:
      window.alert("Opção inválida!");
  }

}

private handleTrade(tile: Tile): void {
  const playerId = this.activePlayerIndex;
  const count = this.playerManager.getPlayerCount();

  const otherInput = window.prompt(`Trocar com qual jogador? (1-${count})`);
  if (!otherInput) return;

  const otherId = parseInt(otherInput) - 1;
  if (otherId === playerId || otherId < 0 || otherId >= count) {
    window.alert("Jogador inválido.");
    return;
  }

  const myProp = Number(window.prompt("ID da sua propriedade:"));
  const theirProp = Number(window.prompt("ID da propriedade do outro jogador:"));

  if (isNaN(myProp) || isNaN(theirProp)) {
    window.alert("IDs inválidos.");
    return;
  }

  const success = this.playerManager.tradeProperties(playerId, otherId, myProp.id, theirProp.id);
  if (success) window.alert("Troca realizada!");
}

private handleSellToPlayer(tile: Tile): void {
  const sellerId = this.activePlayerIndex;

  const totalPlayers = this.playerManager.getPlayerCount();
  if (totalPlayers <= 1) {
    window.alert("Não há outros jogadores para vender.");
    return;
  }

  // Escolher comprador
  const buyerInput = window.prompt(`Digite o número do jogador comprador (1-${totalPlayers}):`);
  if (!buyerInput) return;

  const buyerId = parseInt(buyerInput, 10) - 1;

  if (isNaN(buyerId) || buyerId < 0 || buyerId >= totalPlayers) {
    window.alert("Jogador inválido.");
    return;
  }

  if (buyerId === sellerId) {
    window.alert("Você não pode vender uma propriedade para si mesmo.");
    return;
  }

  // Confirmar valor da venda
  const priceInput = window.prompt("Digite o valor da venda:");
  if (!priceInput) return;

  const salePrice = Number(priceInput);

  if (isNaN(salePrice) || salePrice <= 0) {
    window.alert("Valor inválido.");
    return;
  }

  // Executar venda via PlayerManager
  const success = this.playerManager.sellPlayerTile(sellerId, buyerId, tile.id, salePrice);

  if (success) {
    window.alert("Venda concluída com sucesso!");
  } else {
    window.alert("Não foi possível realizar a venda.");
  }
}
  
}
