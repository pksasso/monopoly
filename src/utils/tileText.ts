import {
  PropertyTile,
  RailroadTile,
  Tile,
  UtilityTile
} from '../data/tiles';
import { formatCurrency } from './format';

export const buildTileLabel = (tile: Tile): string => {
  if (tile.type === 'property' || tile.type === 'railroad' || tile.type === 'utility') {
    return `${tile.name}\n${formatCurrency(tile.cost)}`;
  }

  if (tile.type === 'tax' || tile.type === 'luxury-tax') {
    return `${tile.name}\nPague ${formatCurrency(tile.amount)}`;
  }

  if (tile.type === 'go') {
    return `${tile.name}\nReceba ${formatCurrency(tile.payout)}`;
  }

  return tile.name;
};
