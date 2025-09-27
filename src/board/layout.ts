import { TilePosition } from './types';

export interface BoardMetrics {
  boardSize: number;
  tileSize: number;
  offsetX: number;
  offsetY: number;
}

export const computeBoardMetrics = (
  canvasWidth: number,
  canvasHeight: number,
  panelWidth: number,
  panelMargin: number
): BoardMetrics => {
  const maxBoardWidth = canvasWidth - (panelWidth + panelMargin * 2 + 20);
  const maxBoardHeight = canvasHeight * 0.9;
  const boardSize = Math.min(maxBoardWidth, maxBoardHeight);

  let offsetX = panelMargin;
  const availableRight = canvasWidth - (offsetX + boardSize + panelWidth + panelMargin);
  if (availableRight < 0) {
    offsetX = Math.max(panelMargin, offsetX + availableRight);
  }

  const offsetY = (canvasHeight - boardSize) / 2;
  const tileSize = boardSize / 11;

  return { boardSize, tileSize, offsetX, offsetY };
};

export const computeTilePositions = (
  boardSize: number,
  tileSize: number,
  offsetX: number,
  offsetY: number
): TilePosition[] => {
  const positions: TilePosition[] = [];
  const startX = offsetX + boardSize - tileSize * 0.5;
  const startY = offsetY + boardSize - tileSize * 0.5;

  for (let i = 0; i < 11; i += 1) {
    positions.push({
      x: startX - i * tileSize,
      y: startY,
      orientation: 'bottom'
    });
  }

  for (let i = 1; i < 10; i += 1) {
    positions.push({
      x: offsetX + tileSize * 0.5,
      y: startY - i * tileSize,
      orientation: 'left'
    });
  }

  for (let i = 0; i < 11; i += 1) {
    positions.push({
      x: offsetX + tileSize * 0.5 + i * tileSize,
      y: offsetY + tileSize * 0.5,
      orientation: 'top'
    });
  }

  for (let i = 1; i < 10; i += 1) {
    positions.push({
      x: startX,
      y: offsetY + tileSize * 0.5 + i * tileSize,
      orientation: 'right'
    });
  }

  return positions;
};
