export type TileOrientation = 'bottom' | 'left' | 'top' | 'right';

export interface TilePosition {
  x: number;
  y: number;
  orientation: TileOrientation;
}
