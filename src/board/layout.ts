import { TileOrientation, TilePosition } from './types';

export interface BoardMetrics {
  boardSize: number;
  tileSize: number;
  offsetX: number;
  offsetY: number;
}

const BOARD_PIXEL_SIZE = 5503;
const GRID_PIXEL_BOUNDARIES = [
  14,
  735,
  1183,
  1631,
  2079,
  2527,
  2975,
  3423,
  3871,
  4319,
  4767,
  5488
];

const GRID_FRACTIONS = GRID_PIXEL_BOUNDARIES.map((value) => value / BOARD_PIXEL_SIZE);

const fractionalCenter = (index: number): number =>
  (GRID_FRACTIONS[index] + GRID_FRACTIONS[index + 1]) * 0.5;

const PROPERTY_WIDTH_RATIO = (GRID_PIXEL_BOUNDARIES[2] - GRID_PIXEL_BOUNDARIES[1]) / BOARD_PIXEL_SIZE;

const tileCenterFractions = (() => {
  const positions: Array<{ x: number; y: number; orientation: TileOrientation }> = [];

  const bottomY = fractionalCenter(10);
  for (let i = 0; i <= 10; i += 1) {
    positions.push({
      x: fractionalCenter(10 - i),
      y: bottomY,
      orientation: 'bottom'
    });
  }

  const leftX = fractionalCenter(0);
  for (let i = 1; i <= 9; i += 1) {
    positions.push({
      x: leftX,
      y: fractionalCenter(10 - i),
      orientation: 'left'
    });
  }

  const topY = fractionalCenter(0);
  for (let i = 0; i <= 10; i += 1) {
    positions.push({
      x: fractionalCenter(i),
      y: topY,
      orientation: 'top'
    });
  }

  const rightX = fractionalCenter(10);
  for (let i = 1; i <= 9; i += 1) {
    positions.push({
      x: rightX,
      y: fractionalCenter(i),
      orientation: 'right'
    });
  }

  return positions;
})();

export const computeBoardMetrics = (
  canvasWidth: number,
  canvasHeight: number,
  panelWidth: number,
  panelMargin: number
): BoardMetrics => {
  const maxBoardWidth = canvasWidth - (panelWidth + panelMargin * 2 + 20);
  const maxBoardHeight = canvasHeight * 0.9;
  const boardSize = Math.round(Math.min(maxBoardWidth, maxBoardHeight));

  let offsetX = panelMargin;
  const availableRight = canvasWidth - (offsetX + boardSize + panelWidth + panelMargin);
  if (availableRight < 0) {
    offsetX = Math.max(panelMargin, Math.round(offsetX + availableRight));
  }

  const offsetY = Math.round((canvasHeight - boardSize) / 2);
  const tileSize = Math.round(boardSize * PROPERTY_WIDTH_RATIO);

  return { boardSize, tileSize, offsetX: Math.round(offsetX), offsetY };
};

export const computeTilePositions = (
  boardSize: number,
  offsetX: number,
  offsetY: number
): TilePosition[] =>
  tileCenterFractions.map(({ x, y, orientation }) => ({
    x: Math.round(offsetX + x * boardSize),
    y: Math.round(offsetY + y * boardSize),
    orientation
  }));
