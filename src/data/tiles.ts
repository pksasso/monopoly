export type TileType =
  | 'go'
  | 'property'
  | 'railroad'
  | 'utility'
  | 'community-chest'
  | 'chance'
  | 'tax'
  | 'luxury-tax'
  | 'jail'
  | 'free-parking'
  | 'go-to-jail';

interface BaseTile {
  id: number;
  name: string;
  type: TileType;
  displayColor: number;

}

export interface PropertyTile extends BaseTile {
  type: 'property';
  colorGroup: string;
  cost: number;
  houseCost: number;
  rent: {
    base: number;
    monopoly: number;
    house1: number;
    house2: number;
    house3: number;
    house4: number;
    hotel: number;
  };
  owner: number |null ; // essa flag indica se a propriedade já foi comprada ; true -> com dono / false -> sem dono

}

export function getHouseCost(propertyId :number ): number | undefined{
    const tile = MONOPOLY_TILES.find(t => t.id === propertyId);
    
    if (tile && tile.type === 'property'){
      return tile.houseCost;
    }
    return undefined;
  }

export interface RailroadTile extends BaseTile {
  type: 'railroad';
  cost: number;
  rent: {
    one: number;
    two: number;
    three: number;
    four: number;
  };
}

export interface UtilityTile extends BaseTile {
  type: 'utility';
  cost: number;
  description?: string;
  rentMultiplier: {
    oneUtility: number;
    bothUtilities: number;
  };
}

export interface TaxTile extends BaseTile {
  type: 'tax' | 'luxury-tax';
  amount: number;
  description?: string;
}

export interface GoTile extends BaseTile {
  type: 'go';
  payout: number;
}

export interface NeutralTile extends BaseTile {
  type: 'community-chest' | 'chance' | 'jail' | 'free-parking' | 'go-to-jail';
  description?: string;
}

export type Tile =
  | PropertyTile
  | RailroadTile
  | UtilityTile
  | TaxTile
  | GoTile
  | NeutralTile;

export const MONOPOLY_TILES: Tile[] = [
  {
    id: 0,
    name: 'Go',
    type: 'go',
    payout: 200,
    displayColor: 0xfacb0f
  },
  {
    id: 1,
    name: 'Botanic Gardens',
    type: 'property',
    colorGroup: 'Brown',
    cost: 60,
    houseCost: 50,
    rent: {
      base: 2,
      monopoly: 4,
      house1: 10,
      house2: 30,
      house3: 90,
      house4: 160,
      hotel: 250
    },
    displayColor: 0x955235,
    owner: 0
  },
  {
    id: 2,
    name: 'Community Chest',
    type: 'community-chest',
    description: 'Compre uma carta de Community Chest.',
    displayColor: 0xffffff
  },
  {
    id: 3,
    name: 'Oran Mor',
    type: 'property',
    colorGroup: 'Brown',
    cost: 60,
    houseCost: 50,
    rent: {
      base: 4,
      monopoly: 8,
      house1: 20,
      house2: 60,
      house3: 180,
      house4: 320,
      hotel: 450
    },
    displayColor: 0x955235,
    owner: 0,
  },
  {
    id: 4,
    name: 'Income Tax',
    type: 'tax',
    amount: 200,
    description: 'Pague $200 ao banco.',
    displayColor: 0xffe4c4
  },
  {
    id: 5,
    name: 'St Enoch Underground',
    type: 'railroad',
    cost: 200,
    rent: {
      one: 25,
      two: 50,
      three: 100,
      four: 200
    },
    displayColor: 0x222222,
    
  },
  {
    id: 6,
    name: 'Richmond Street',
    type: 'property',
    colorGroup: 'Light Blue',
    cost: 100,
    houseCost: 50,
    rent: {
      base: 6,
      monopoly: 12,
      house1: 30,
      house2: 90,
      house3: 270,
      house4: 400,
      hotel: 550
    },
    displayColor: 0xAAE0FA,
    owner: 0,
  },
  {
    id: 7,
    name: 'Chance',
    type: 'chance',
    description: 'Compre uma carta de Chance.',
    displayColor: 0xffffff
  },
  {
    id: 8,
    name: 'Kelvingrove',
    type: 'property',
    colorGroup: 'Light Blue',
    cost: 100,
    houseCost: 50,
    rent: {
      base: 6,
      monopoly: 12,
      house1: 30,
      house2: 90,
      house3: 270,
      house4: 400,
      hotel: 550
    },
    displayColor: 0xAAE0FA,
    owner: 0,
  },
  {
    id: 9,
    name: 'The Lighthouse',
    type: 'property',
    colorGroup: 'Light Blue',
    cost: 120,
    houseCost: 50,
    rent: {
      base: 8,
      monopoly: 16,
      house1: 40,
      house2: 100,
      house3: 300,
      house4: 450,
      hotel: 600
    },
    displayColor: 0xAAE0FA,
    owner: 0,
  },
  {
    id: 10,
    name: 'Jail / Just Visiting',
    type: 'jail',
    description: 'Apenas visitando ou vá para a cadeia.',
    displayColor: 0xc0c0c0
  },
  {
    id: 11,
    name: 'Celtic Park',
    type: 'property',
    colorGroup: 'Pink',
    cost: 140,
    houseCost: 100,
    rent: {
      base: 10,
      monopoly: 20,
      house1: 50,
      house2: 150,
      house3: 450,
      house4: 625,
      hotel: 750
    },
    displayColor: 0xD93A96,
    owner: 0,
  },
  {
    id: 12,
    name: 'Irn Bru',
    type: 'utility',
    cost: 150,
    rentMultiplier: {
      oneUtility: 4,
      bothUtilities: 10
    },
    description:
      'If one Utility is owned, rent is 4x the amount shown on dice. If both Utilities are owned, rent is 10x the amount shown on dice.',
    displayColor: 0xffffff
  },
  {
    id: 13,
    name: 'Argyle Street',
    type: 'property',
    colorGroup: 'Pink',
    cost: 140,
    houseCost: 100,
    rent: {
      base: 10,
      monopoly: 20,
      house1: 50,
      house2: 150,
      house3: 450,
      house4: 625,
      hotel: 750
    },
    displayColor: 0xD93A96,
    owner: 0,
  },
  {
    id: 14,
    name: 'Hampden Park',
    type: 'property',
    colorGroup: 'Pink',
    cost: 160,
    houseCost: 100,
    rent: {
      base: 12,
      monopoly: 24,
      house1: 60,
      house2: 180,
      house3: 500,
      house4: 700,
      hotel: 900
    },
    displayColor: 0xD93A96,
    owner: 0,
  },
  {
    id: 15,
    name: 'Queen Street Station',
    type: 'railroad',
    cost: 200,
    rent: {
      one: 25,
      two: 50,
      three: 100,
      four: 200
    },
    displayColor: 0x222222
  },
  {
    id: 16,
    name: 'Buchanan Street',
    type: 'property',
    colorGroup: 'Orange',
    cost: 180,
    houseCost: 100,
    rent: {
      base: 14,
      monopoly: 28,
      house1: 70,
      house2: 200,
      house3: 550,
      house4: 750,
      hotel: 950
    },
    displayColor: 0xF7941D,
    owner: 0,
  },
  {
    id: 17,
    name: 'Community Chest',
    type: 'community-chest',
    description: 'Compre uma carta de Community Chest.',
    displayColor: 0xffffff
  },
  {
    id: 18,
    name: 'Byres Road',
    type: 'property',
    colorGroup: 'Orange',
    cost: 180,
    houseCost: 100,
    rent: {
      base: 14,
      monopoly: 28,
      house1: 70,
      house2: 200,
      house3: 550,
      house4: 750,
      hotel: 950
    },
    displayColor: 0xF7941D,
    owner: 0,
  },
  {
    id: 19,
    name: 'Howard Street',
    type: 'property',
    colorGroup: 'Orange',
    cost: 200,
    houseCost: 100,
    rent: {
      base: 16,
      monopoly: 32,
      house1: 80,
      house2: 220,
      house3: 600,
      house4: 800,
      hotel: 1000
    },
    displayColor: 0xF7941D,
    owner: 0,
  },
  {
    id: 20,
    name: 'Free Parking',
    type: 'free-parking',
    description: 'Descanso grátis. Não acontece nada.',
    displayColor: 0xfacb0f
  },
  {
    id: 21,
    name: 'Auchentoshan Distillery',
    type: 'property',
    colorGroup: 'Red',
    cost: 220,
    houseCost: 150,
    rent: {
      base: 18,
      monopoly: 36,
      house1: 90,
      house2: 250,
      house3: 700,
      house4: 875,
      hotel: 1050
    },
    displayColor: 0xF11C26,
    owner: 0,
  },
  {
    id: 22,
    name: 'Chance',
    type: 'chance',
    description: 'Compre uma carta de Chance.',
    displayColor: 0xffffff
  },
  {
    id: 23,
    name: 'Duke Street',
    type: 'property',
    colorGroup: 'Red',
    cost: 220,
    houseCost: 150,
    rent: {
      base: 18,
      monopoly: 36,
      house1: 90,
      house2: 250,
      house3: 700,
      house4: 875,
      hotel: 1050
    },
    displayColor: 0xF11C26,
    owner: 0,
  },
  {
    id: 24,
    name: 'Gallowgate',
    type: 'property',
    colorGroup: 'Red',
    cost: 240,
    houseCost: 150,
    rent: {
      base: 20,
      monopoly: 40,
      house1: 100,
      house2: 300,
      house3: 750,
      house4: 925,
      hotel: 1100
    },
    displayColor: 0xF11C26,
    owner: 0,
  },
  {
    id: 25,
    name: 'Buchanan Bus Station',
    type: 'railroad',
    cost: 200,
    rent: {
      one: 25,
      two: 50,
      three: 100,
      four: 200
    },
    displayColor: 0x222222
  },
  {
    id: 26,
    name: 'Bath Street',
    type: 'property',
    colorGroup: 'Yellow',
    cost: 260,
    houseCost: 150,
    rent: {
      base: 22,
      monopoly: 44,
      house1: 110,
      house2: 330,
      house3: 800,
      house4: 975,
      hotel: 1150
    },
    displayColor: 0xFEF200,
    owner: 0,
  },
  {
    id: 27,
    name: 'Sauchiehall Street',
    type: 'property',
    colorGroup: 'Yellow',
    cost: 260,
    houseCost: 150,
    rent: {
      base: 22,
      monopoly: 44,
      house1: 110,
      house2: 330,
      house3: 800,
      house4: 975,
      hotel: 1150
    },
    displayColor: 0xFEF200,
    owner: 0,
  },
  {
    id: 28,
    name: 'Figma',
    type: 'utility',
    cost: 150,
    rentMultiplier: {
      oneUtility: 4,
      bothUtilities: 10
    },
    description:
      'If one Utility is owned, rent is 4x the amount shown on dice. If both Utilities are owned, rent is 10x the amount shown on dice.',
    displayColor: 0xffffff
  },
  {
    id: 29,
    name: 'St Vincent Street',
    type: 'property',
    colorGroup: 'Yellow',
    cost: 280,
    houseCost: 150,
    rent: {
      base: 24,
      monopoly: 48,
      house1: 120,
      house2: 360,
      house3: 850,
      house4: 1025,
      hotel: 1200
    },
    displayColor: 0xFEF200,
    owner: 0,
  },
  {
    id: 30,
    name: 'Go To Jail',
    type: 'go-to-jail',
    description: 'Vá direto para a cadeia, sem passar pelo Go.',
    displayColor: 0xc0c0c0
  },
  {
    id: 31,
    name: 'West Regent Street',
    type: 'property',
    colorGroup: 'Green',
    cost: 300,
    houseCost: 200,
    rent: {
      base: 26,
      monopoly: 52,
      house1: 130,
      house2: 390,
      house3: 900,
      house4: 1100,
      hotel: 1275
    },
    displayColor: 0x1FB25A,
    owner: 0,
  },
  {
    id: 32,
    name: 'Charing Cross',
    type: 'property',
    colorGroup: 'Green',
    cost: 300,
    houseCost: 200,
    rent: {
      base: 26,
      monopoly: 52,
      house1: 130,
      house2: 390,
      house3: 900,
      house4: 1100,
      hotel: 1275
    },
    displayColor: 0x1FB25A,
    owner: 0,
  },
  {
    id: 33,
    name: 'Community Chest',
    type: 'community-chest',
    description: 'Compre uma carta de Community Chest.',
    displayColor: 0xffffff
  },
  {
    id: 34,
    name: 'Bothwell Street',
    type: 'property',
    colorGroup: 'Green',
    cost: 320,
    houseCost: 200,
    rent: {
      base: 28,
      monopoly: 56,
      house1: 150,
      house2: 450,
      house3: 1000,
      house4: 1200,
      hotel: 1400
    },
    displayColor: 0x1FB25A,
    owner: 0,
  },
  {
    id: 35,
    name: 'Central Station',
    type: 'railroad',
    cost: 200,
    rent: {
      one: 25,
      two: 50,
      three: 100,
      four: 200
    },
    displayColor: 0x222222
  },
  {
    id: 36,
    name: 'Chance',
    type: 'chance',
    description: 'Compre uma carta de Chance.',
    displayColor: 0xffffff
  },
  {
    id: 37,
    name: 'George Square',
    type: 'property',
    colorGroup: 'Dark Blue',
    cost: 350,
    houseCost: 200,
    rent: {
      base: 35,
      monopoly: 70,
      house1: 175,
      house2: 500,
      house3: 1100,
      house4: 1300,
      hotel: 1500
    },
    displayColor: 0x0072BB,
    owner: 0,
  },
  {
    id: 38,
    name: 'Luxury Tax',
    type: 'luxury-tax',
    amount: 75,
    description: 'Pague $75 ao banco.',
    displayColor: 0xffdab9
  },
  {
    id: 39,
    name: 'Pollok Country Park',
    type: 'property',
    colorGroup: 'Dark Blue',
    cost: 400,
    houseCost: 200,
    rent: {
      base: 50,
      monopoly: 100,
      house1: 200,
      house2: 600,
      house3: 1400,
      house4: 1700,
      hotel: 2000
    },
    displayColor: 0x0072BB,
    owner: 0,
  }
];




