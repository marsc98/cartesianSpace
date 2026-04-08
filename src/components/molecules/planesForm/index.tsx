import React, { useState, useEffect } from 'react';
import css from './index.module.scss';
import Carousel from '../carousel';
import { useElements } from '../../../hooks/contexts/ElementsContext';
import { useDrawingRefs } from '../../../hooks/contexts/DrawingContext';

interface TerrainType {
  id: string;
  name: string;
  color: string;
}

interface PlanesFormProps {
  isMobile?: boolean;
  selectedTerrainRef: React.MutableRefObject<string | null>;
}

function PlanesForm({ isMobile, selectedTerrainRef }: PlanesFormProps) {
  const { elementsRef } = useElements();
  const { colorRef } = useDrawingRefs();

  const [selectedTerrain, setSelectedTerrain] = useState<string | null>(null);

  const TERRAIN_TYPES: TerrainType[] = [
    { id: 'default', name: 'Simples', color: '#DEB887' },
    { id: 'tijolo', name: 'Tijolo', color: '#5D4037' },
    { id: 'gelo', name: 'Gelo', color: '#5D4037' },
    { id: 'grama', name: 'Grama', color: '#5D4037' },
    { id: 'concreto', name: 'Concreto', color: '#5D4037' },
  ];

  const handleTerrainSelect = (terrain: any) => {
    setSelectedTerrain(terrain.id);
    selectedTerrainRef.current = terrain.id;

    elementsRef.current.shape = 'plane';
    (elementsRef.current as unknown as Record<string, unknown>).type = 'shapes';
    (elementsRef.current as unknown as Record<string, unknown>).plane = terrain.id;
  };

  return (
    <div className={css['terrain-selection-container']}>
      <Carousel
        items={TERRAIN_TYPES}
        isPlane={true}
        selected={selectedTerrain}
        isMobile={isMobile}
        active={true}
        handleSelection={handleTerrainSelect}
        colorRef={colorRef}
        visibleColumns={4}
      />
    </div>
  );
}

export default PlanesForm;
