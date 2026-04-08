import React, { useRef, useEffect, useState } from 'react';
import css from './index.module.scss';
import IconButton from '../iconButton';
import { useSketch } from '../../../hooks/useSketch';
import Item from '../../atoms/item';
import { colorToFilter } from '../../../utils/functions';

interface MarkersListProps {
  isAdding?: boolean;
  setCameraPosition?: (position: unknown) => void;
  position?: { x: number; y: number };
  writingRef?: React.MutableRefObject<boolean>;
  isMobile?: boolean;
}

interface MarkerElement {
  id: string;
  name?: string;
  position?: unknown;
  origin?: unknown;
  [key: string]: unknown;
}

function MarkersList({
  isAdding = false,
  setCameraPosition,
  position,
  writingRef,
  isMobile,
}: MarkersListProps) {
  const [markers, setMarkers] = useState<MarkerElement[]>([]);
  const [currentSection, setCurrentSection] = useState(0);

  const listContainerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [newElementName, setNewElementName] = useState('');

  const ITEMS_PER_SECTION = 5;
  const totalSections = Math.ceil(markers.length / ITEMS_PER_SECTION);

  const { elements: rawElements, updateMultipleElements } = useSketch();
  const elements = rawElements as MarkerElement[];
  const [tempElement, setTempElement] = useState<MarkerElement | null>(null);

  // Cleanup de timeouts ao desmontar
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (elements.length > 0) {
      const map = new Map();

      for (let i = 0; i < elements.length; i++) {
        const item = elements[i];
        const origin = item.origin ?? (Array.isArray(item.position) ? item.position[0] : item.position);
        map.set(item.id, { ...item, position: origin }); // sobrescreve automaticamente duplicatas
      }

      const result = Array.from(map.values());

      setMarkers(result);
    }
  }, [elements]);

  // Atualiza a seção atual baseado no scroll
  const handleScroll = () => {
    if (!listContainerRef.current || markers.length === 0) return;

    // Limpa timeout anterior
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Debounce para não calcular a cada pixel
    scrollTimeoutRef.current = setTimeout(() => {
      const container = listContainerRef.current;
      if (!container) return;
      const scrollTop = container.scrollTop;
      const itemHeight = container.scrollHeight / markers.length;

      // Calcula qual item está no topo visível
      const currentItemIndex = Math.floor(scrollTop / itemHeight);

      // Calcula a seção baseado no item atual
      const section = Math.floor(currentItemIndex / ITEMS_PER_SECTION);

      if (
        section !== currentSection &&
        section >= 0 &&
        section < totalSections
      ) {
        setCurrentSection(section);
      }
    }, 100);
  };

  // Scroll para uma seção específica
  const scrollToSection = (sectionIndex: number) => {
    if (!listContainerRef.current || markers.length === 0) return;

    const container = listContainerRef.current;
    const itemHeight = container.scrollHeight / markers.length;
    const targetScroll = sectionIndex * ITEMS_PER_SECTION * itemHeight;

    container.scrollTo({
      top: targetScroll,
      behavior: 'smooth',
    });
  };

  const updateMarker = () => {
    (updateMultipleElements as (elements: MarkerElement[]) => void)([
      {
        ...tempElement,
        name: newElementName,
      } as MarkerElement,
    ]);
  };

  useEffect(() => {
    if (writingRef && !writingRef.current) {
      writingRef.current = true;
    }
    return () => {
      if (writingRef) writingRef.current = false;
    };
  }, []);

  const renderEmptyState = () => (
    <li className={css['marker-item']}>
      <div
        aria-disabled="true"
        style={{ opacity: '0.5' }}
        className={css['marker-item_container']}
      >
        <div className={css['marker-text_container']}>
          <span className={css['marker-item__name']}>Nenhum marcador...</span>
        </div>
        <div className={css['marker-item__actions']}>
          <IconButton
            hoverText="Posicionar marcador"
            iconName="target"
            size="p"
            disabled
          />
          <IconButton
            hoverText="Deletar marcador"
            iconName="delete"
            size="p"
            disabled
          />
        </div>
      </div>
    </li>
  );

  const renderMarkerItem = (marker, index) => {
    if (!marker || !marker.id) return null;

    const markerText = marker.name
      ? marker.name
      : marker.text
        ? marker.text
        : `Elemento ${index}`;

    const setMarkerIcon = () => {
      let id;
      let isSvg = false;
      let isPlane = false;

      switch (marker.element) {
        case 'functions':
          return (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="35px"
              viewBox="0 -960 960 960"
              width="35px"
              fill={marker.color}
            >
              <path d="M400-240v-80h62l105-120-105-120h-66l-64 344q-8 45-37 70.5T221-120q-45 0-73-24t-28-64q0-32 17-51.5t43-19.5q25 0 42.5 17t17.5 41q0 5-.5 9t-1.5 9q5-1 8.5-5.5T252-221l62-339H200v-80h129l21-114q7-38 37.5-62t72.5-24q44 0 72 26t28 65q0 30-17 49.5T500-680q-25 0-42.5-17T440-739q0-5 .5-9t1.5-9q-6 2-9 6t-5 12l-17 99h189v80h-32l52 59 52-59h-32v-80h200v80h-62L673-440l105 120h62v80H640v-80h32l-52-60-52 60h32v80H400Z" />
            </svg>
          );
        case 'text':
          id = 'note';
          isSvg = true;
          break;
        case 'plane':
          id = marker.plane;
          isPlane = true;
          break;
        case 'axis':
          id = 'axis';
          isSvg = true;
          break;
        default:
          id = marker.element;
          break;
      }
      return (
        <Item
          id={id}
          item={marker}
          isSelected={false}
          colorFilter={colorToFilter(marker.color)}
          colorRef={marker.color}
          cardSize="15"
          cardIsSvg={isSvg}
          isPlane={isPlane}
          isMobile={isMobile}
          isListMode={false}
          hasNoText={true}
        />
      );
    };

    return (
      <li
        key={marker.id}
        className={css['marker-item']}
        onClick={() => setCameraPosition && setCameraPosition(marker.position)}
        title={`Posicionar no elemento ${markerText}`}
      >
        <div className={css['marker-item_container']}>
          <div className={css['marker-text_container']}>
            {setMarkerIcon()}
            <input
              style={{ color: marker.color }}
              className={css['marker-item__name']}
              defaultValue={markerText}
              name="element-name"
              onChange={(e) => {
                setNewElementName(e.target.value);
              }}
              onClick={(e) => {
                e.stopPropagation();
                setTempElement(marker);
              }}
            />
          </div>
          <div className={css['marker-item__actions']}>
            <IconButton
              hoverText="Posicionar marcador"
              iconName="target"
              size="p"
              onClick={(e) => {
                e.stopPropagation();
                setCameraPosition && setCameraPosition(marker.position);
              }}
            />
            <IconButton
              hoverText="Salvar novo nome"
              iconName="save"
              size="p"
              onClick={(e) => {
                e.stopPropagation();
                updateMarker();
              }}
            />
          </div>
        </div>
      </li>
    );
  };

  return (
    <div className={css['markers-list_container']}>
      <div className={css['scroll-container']}>
        {/* Indicadores de seção - só mostra se há mais de uma seção */}
        {totalSections > 1 && (
          <div className={css['section-indicators']}>
            {Array.from({ length: totalSections }, (_, index) => (
              <button
                key={index}
                className={`${css['section-dot']} ${currentSection === index ? css['active'] : ''}`}
                onClick={() => scrollToSection(index)}
                aria-label={`Ir para seção ${index + 1}`}
                title={`Seção ${index + 1} (itens ${index * ITEMS_PER_SECTION + 1}-${Math.min((index + 1) * ITEMS_PER_SECTION, markers.length)})`}
              />
            ))}
          </div>
        )}

        {/* Lista com scroll */}
        <div
          ref={listContainerRef}
          className={css['list-container']}
          onScroll={handleScroll}
        >
          <ul className={css['markers-list']}>
            {markers.length === 0
              ? renderEmptyState()
              : markers.map((marker, index) => renderMarkerItem(marker, index))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default MarkersList;
