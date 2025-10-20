export interface Player {
  id: number;
  name: string;
  money: number;
  color: number;
  isHuman: boolean;
}

export class PlayerManager {
  private players: Player[] = [];
  private activePlayerIndex = 0;

  initializePlayers(playerCount: number, humanPlayerCount: number): void {
    this.players = [];
    
    for (let i = 0; i < playerCount; i++) {
      this.players.push({
        id: i,
        name: `Jogador ${i + 1}`,
        money: 1500, // Valor inicial do Monopoly
        color: this.getPlayerColor(i),
        isHuman: i < humanPlayerCount
      });
    }
    
    this.activePlayerIndex = 0;
  }

  getPlayers(): Player[] {
    return [...this.players];
  }

  getPlayer(playerIndex: number): Player | null {
    return this.players[playerIndex] || null;
  }

  getActivePlayer(): Player | null {
    return this.players[this.activePlayerIndex] || null;
  }

  getActivePlayerIndex(): number {
    return this.activePlayerIndex;
  }

  setActivePlayerIndex(index: number): void {
    if (index >= 0 && index < this.players.length) {
      this.activePlayerIndex = index;
    }
  }

  addMoney(playerIndex: number, amount: number): void {
    if (this.players[playerIndex]) {
      this.players[playerIndex].money += amount;
    }
  }

  subtractMoney(playerIndex: number, amount: number): boolean {
    if (this.players[playerIndex] && this.players[playerIndex].money >= amount) {
      this.players[playerIndex].money -= amount;
      return true;
    }
    return false;
  }

  canAfford(playerIndex: number, amount: number): boolean {
    return this.players[playerIndex]?.money >= amount || false;
  }

  getPlayerCount(): number {
    return this.players.length;
  }

  getPlayerColor(index: number): number {
    const colors = [0x1e6f5c, 0xd1495b, 0x3f88c5, 0xf6ae2d];
    return colors[index % colors.length];
  }

  formatMoney(amount: number): string {
    return `R$ ${amount.toLocaleString('pt-BR')}`;
  }
}


