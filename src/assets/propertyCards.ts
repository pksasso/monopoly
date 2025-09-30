import type Phaser from 'phaser';
import type { Tile } from '../data/tiles';

const PROPERTY_CARD_PREFIX = 'property-card';

const propertyCardModules = import.meta.glob('../assets/properties/*.png', {
  eager: true
}) as Record<string, { default: string }>;

const propertyCardPaths: Record<string, string> = Object.fromEntries(
  Object.entries(propertyCardModules).map(([path, module]) => {
    const filename = path.split('/').pop() ?? '';
    const slug = filename.replace(/\.png$/i, '');
    return [slug, module.default];
  })
);

const slugify = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

export const getPropertyCardTextureKey = (name: string): string =>
  `${PROPERTY_CARD_PREFIX}-${slugify(name)}`;

export const hasPropertyCardAsset = (name: string): boolean => {
  const slug = slugify(name);
  return Boolean(propertyCardPaths[slug]);
};

export const preloadPropertyCards = (loader: Phaser.Loader.LoaderPlugin, tiles: Tile[]): void => {
  const tracked = new Set<string>();

  tiles.forEach((tile) => {
    if (tile.type !== 'property') {
      return;
    }

    const slug = slugify(tile.name);
    const assetPath = propertyCardPaths[slug];
    if (!assetPath) {
      return;
    }

    const textureKey = `${PROPERTY_CARD_PREFIX}-${slug}`;
    if (tracked.has(textureKey) || loader.textureManager.exists(textureKey)) {
      return;
    }

    loader.image(textureKey, assetPath);
    tracked.add(textureKey);
  });
};

export const computePropertyCardDimensions = (
  texture: Phaser.Textures.Texture,
  desiredHeight: number
): { width: number; height: number } => {
  const source = texture.getSourceImage();
  const aspectRatio = source.width / source.height;
  const height = desiredHeight;
  const width = height * aspectRatio;
  return { width, height };
};
