import { arrayBuffer } from "node:stream/consumers";
import * as Tile from '../data/tiles'; 
import * as Token from '../board/TokenController';

export interface Player {
  id: number;
  name: string;
  money: number;
  color: number;
  isHuman: boolean;
  properties: Set<number>; // conjunto com os ids dos tiles comprados

}

export class PlayerManager {
  private players: Player[] = [];
  private activePlayerIndex = 0;
  private tile: any[] = Tile.MONOPOLY_TILES;
  private properties: Set<number> = new Set<number>();

  initializePlayers(playerCount: number, humanPlayerCount: number): void {
    this.players = [];
    
    for (let i = 0; i < playerCount; i++) {
      this.players.push({
        id: i,
        name: `Jogador ${i + 1}`,
        money: 1500, // Valor inicial do Monopoly
        color: this.getPlayerColor(i),
        isHuman: i < humanPlayerCount,
        properties: new Set(),
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

 buyTile(playerId: number, tileId: number ): boolean | undefined {
  const player = this.players.find(p =>p.id === playerId);
  const tile = this.tile.find(t => t.id === tileId);  
  
  if(!player || !tile){
      return false; 
    }else{
       if (tile.type ==='property'&& !tile.owner){
          if(player.money >= tile.cost){
            player.money -= tile.cost;
            tile.owner = player.id;
            player.properties.add(tileId);
            return true;
            
          }
       }
       
    }
 }  

calculatePropertyRent(tile: any): number {
  if (!tile || tile.type !== 'property') return 0;

  const rent = tile.rent;

  // Caso tenha casas/hotel
  if (tile.houses && tile.houses > 0) {
    switch (tile.houses) {
      case 1: return rent.house1;
      case 2: return rent.house2;
      case 3: return rent.house3;
      case 4: return rent.house4;
      case 5: return rent.hotel ?? rent.house4;
    }
  }

  // Verifica monopólio
  const colorTiles = this.tile.filter(
    (t: any) => t.colorGroup === tile.colorGroup && t.type === 'property'
  );

  const hasMonopoly = colorTiles.every((t: any) => t.owner === tile.owner);

  if (hasMonopoly) {
    return rent.monopoly;
  }

  return rent.base;
}

payRent(payerId: number, tile: any): void {
  const ownerId = tile.owner;

  // Sem dono
  if (!ownerId || ownerId === 0) return;

  // Não paga para si mesmo
  if (ownerId === payerId) return;

  const payer = this.getPlayer(payerId);
  const owner = this.getPlayer(ownerId);

  if (!payer || !owner) return;

  const rent = this.calculatePropertyRent(tile);

  const amount = Math.min(payer.money, rent);

  payer.money -= amount;
  owner.money += amount;

 
}

 sellPlayerTile(sellerId: number, buyerId: number, tileId: number, price: number): boolean | undefined{ // parametros: playerId -> player comprador | tileId -> propriedade que será comprada
   const sPlayer = this.players.find(s =>s.id === sellerId);
   const bPlayer = this.players.find(b =>b.id === buyerId);
   const tile = this.tile.find( t => t.id === tileId);

   if(!bPlayer || !sPlayer || !tile){
    return false;
   }
   else{
    if(tile.type === 'property' && tile.owner){
      if(bPlayer.money >= tile.cost){
        bPlayer.money -= tile.cost;
        sPlayer.money += tile.cost;
        tile.owner = bPlayer.id;
        bPlayer.properties.add(tileId);
        sPlayer.properties.delete(tileId);
        return true;
      }
    }
    
  }
  
 }

 changeTile(player1Id: number, player2Id: number, tile1Id: number, tile2Id :number) :boolean | undefined{
  const player1 = this.players.find(p1 => p1.id === player1Id);
  const player2 = this.players.find(p2 => p2.id === player2Id);
  const tile1 = this.tile.find( t1 => t1.id === tile1Id);
  const tile2 = this.tile.find( t2 => t2.id === tile2Id);

  if (!player1 || !player2 || !tile1 || !tile2){
    return false;
  }else{
    if( tile1.type === 'property' && tile2.type === 'property'){
      if(player1.id == tile1.owner && player2.id == tile2.owner){
        player1.properties.delete(tile1Id);
        let aux = tile1.owner;
        tile1.owner = tile2.owner;
        tile2.owner = aux;
        player2.properties.delete(tile2Id);
        player1.properties.add(tile2Id);
        player2.properties.add(tile1Id);
        return true;

     }
    }
     return false;
  }
 }

 tradeProperties(
   player1Id: number,
   player2Id: number,
   player1TileIds: number[] = [],
   player2TileIds: number[] = [],
   player1Money: number = 0,
   player2Money: number = 0
 ): boolean | undefined {
   const p1 = this.players.find(p => p.id === player1Id);
   const p2 = this.players.find(p => p.id === player2Id);

   if (!p1 || !p2) return false;

   // Valida propriedade dos tiles informados
   for (const tId of player1TileIds) {
     const t = this.tile.find((x: any) => x.id === tId);
     if (!t || t.type !== 'property' || t.owner !== p1.id) return false;
   }

   for (const tId of player2TileIds) {
     const t = this.tile.find((x: any) => x.id === tId);
     if (!t || t.type !== 'property' || t.owner !== p2.id) return false;
   }

   // Valida dinheiro suficiente
   if (player1Money < 0 || player2Money < 0) return false;
   if (p1.money < player1Money) return false;
   if (p2.money < player2Money) return false;

   // Executa a troca de tiles
   for (const tId of player1TileIds) {
     const t = this.tile.find((x: any) => x.id === tId)!;
     p1.properties.delete(tId);
     p2.properties.add(tId);
     t.owner = p2.id;
   }

   for (const tId of player2TileIds) {
     const t = this.tile.find((x: any) => x.id === tId)!;
     p2.properties.delete(tId);
     p1.properties.add(tId);
     t.owner = p1.id;
   }

   // Executa transferências de dinheiro (player1 paga player2 e vice-versa)
   if (player1Money > 0) {
     p1.money -= player1Money;
     p2.money += player1Money;
   }

   if (player2Money > 0) {
     p2.money -= player2Money;
     p1.money += player2Money;
   }

   return true;
 }

 // venda para o banco

 sellToBank(playerId: number, tileId: number) :boolean | undefined{
  const player = this.players.find(p => p.id === playerId);
  const tile = this.tile.find(t => t.id === tileId);

  if (!player || !tile){
    return false;
  }
  else{
    if(tile.type === 'property' && tile.owner === player.id){
      // implementar função que relaciona vendas as cores
      player.money += (tile.cost/2);
      player.properties.delete(tileId);
      tile.owner = null;
      return true;
    }
  }
  return false;
 }
}


