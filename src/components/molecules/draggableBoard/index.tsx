import React, { useState, useRef, useEffect } from 'react';
import IconButton from '../iconButton';
import { safeGetItem, safeSetItem } from '../../../utils/storage';

interface BoardItemData {
  id: string;
  name?: string;
  img?: string;
  cardIsSvg?: boolean;
  colorRotation?: number;
  [key: string]: unknown;
}

interface ItemPosition {
  x: number;
  y: number;
}

interface BoardState {
  positions: Record<string, ItemPosition>;
  scale: number;
  items: BoardItemData[];
  locked?: boolean;
  timestamp?: number;
}

interface ItemProps {
  item: BoardItemData;
  position: ItemPosition;
  scale: number;
  isDragging: boolean;
  locked: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onClick: (item: BoardItemData) => void;
  colorRotation: number;
}

const Item = ({
  item,
  position,
  scale,
  isDragging,
  locked,
  onMouseDown,
  onTouchStart,
  onClick,
  colorRotation,
}: ItemProps) => {
  const cardIsSvg = item.cardIsSvg || false;
  const img = item.img || '';
  const baseWidth = 120;
  const baseHeight = 140;

  const handleClick = (e: React.MouseEvent) => {
    if (locked && onClick) {
      e.preventDefault();
      e.stopPropagation();
      onClick(item);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (locked) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    onMouseDown(e);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (locked) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    onTouchStart(e);
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onClick={handleClick}
      style={{
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${baseWidth * scale}px`,
        height: `${baseHeight * scale}px`,
        border: '1px solid #374151',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.5rem',
        borderRadius: '0.9rem',
        cursor: 'pointer',
        transition: isDragging ? 'none' : 'all 0.3s ease',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        background: '#1f2937',
        userSelect: 'none',
        zIndex: isDragging ? 1000 : 1,
        transform: isDragging ? 'scale(1.05)' : 'scale(1)',
        touchAction: 'none',
      }}
    >
      <img
        style={{
          width: cardIsSvg ? '70%' : '100%',
          minHeight: '50px',
          pointerEvents: 'none',
          filter: `hue-rotate(${item.colorRotation ?? colorRotation}deg) saturate(1.5)`,
        }}
        src={img}
        alt={item.name ?? String(item.id)}
      />
      <span
        style={{
          fontSize: `${0.875 * scale}rem`,
          fontWeight: 500,
          color: '#e5e7eb',
          pointerEvents: 'none',
        }}
      >
        {item.name ?? `Item ${item.id}`}
      </span>
    </div>
  );
};

interface DraggableBoardProps {
  items?: BoardItemData[];
  colorRotation?: number;
  storageKey?: string;
  onItemClick?: ((item: BoardItemData) => void) | null;
}

export default function DraggableBoard({
  items = [],
  colorRotation = 0,
  storageKey = 'draggable-board-state',
  onItemClick = null,
}: DraggableBoardProps) {
  const [positions, setPositions] = useState<Record<string, ItemPosition>>({});
  const [scale, setScale] = useState(1);
  const [locked, setLocked] = useState(false);
  const [dragging, setDragging] = useState<string | null>(null);
  const [loadedItems, setLoadedItems] = useState<BoardItemData[]>([]);
  const boardRef = useRef<HTMLDivElement>(null);
  const dragOffset = useRef<ItemPosition>({ x: 0, y: 0 });
  const lastTouchDistance = useRef<number | null>(null);
  const isInitialized = useRef(false);

  const displayItems = React.useMemo(() => {
    if (items.length > 0) return items;
    if (loadedItems.length > 0) return loadedItems;
    return [];
  }, [items, loadedItems]);

  useEffect(() => {
    if (items.length === 0) {
      const saved = safeGetItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as BoardState;
          if (parsed.items && parsed.items.length > 0) {
            setLoadedItems(parsed.items);
          }
        } catch {
          // dados corrompidos — ignora
        }
      }
    }
  }, [storageKey]);

  useEffect(() => {
    if (isInitialized.current) return;

    const initializePositions = () => {
      if (!boardRef.current) {
        requestAnimationFrame(initializePositions);
        return;
      }

      const saved = safeGetItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as BoardState;
          const { items: savedItems, positions: savedPositions, scale: savedScale, locked: savedLocked } = parsed;

          if (savedLocked !== undefined) setLocked(savedLocked);

          const filteredItems = (savedItems ?? []).filter((item) => savedPositions[item.id]);
          const hasValidPositions = filteredItems.some((item) => savedPositions[item.id]);

          if (hasValidPositions) {
            const validatedPositions: Record<string, ItemPosition> = {};
            filteredItems.forEach((item) => {
              const pos = savedPositions[item.id];
              if (pos) validatedPositions[item.id] = { x: pos.x, y: pos.y };
            });

            setPositions(validatedPositions);
            setScale(savedScale || 1);
            isInitialized.current = true;
            return;
          }
        } catch {
          // dados corrompidos — ignora
        }
      }

      const board = boardRef.current.getBoundingClientRect();
      const itemWidth = 120;
      const itemHeight = 140;
      const initialPositions: Record<string, ItemPosition> = {};

      displayItems.forEach((item, index) => {
        const col = index % 4;
        const row = Math.floor(index / 4);
        initialPositions[item.id] = {
          x: Math.min(50 + col * 150, board.width - itemWidth),
          y: Math.min(50 + row * 180, board.height - itemHeight),
        };
      });
      setPositions(initialPositions);
      isInitialized.current = true;
    };

    initializePositions();
  }, [storageKey]);

  const saveToLocalStorage = (lockedState?: boolean) => {
    if (!isInitialized.current) return;
    const state: BoardState & { locked?: boolean } = {
      positions,
      scale,
      items: displayItems,
      timestamp: Date.now(),
    };
    if (lockedState !== undefined) {
      state.locked = lockedState;
    }
    safeSetItem(storageKey, JSON.stringify(state));
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (boardRef.current && !boardRef.current.contains(event.target as Node)) {
        saveToLocalStorage();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      saveToLocalStorage(locked);
    };
  }, [positions, scale, storageKey, displayItems, locked]);

  const handleWheel = (e: React.WheelEvent) => {
    if (locked) return;
    e.preventDefault();
    const delta = -e.deltaY * 0.001;
    setScale((prev) => Math.min(Math.max(prev + delta, 0.5), 2));
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (locked) return;
    if (e.touches.length === 2) {
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);

      if (lastTouchDistance.current !== null) {
        const delta = (distance - lastTouchDistance.current) * 0.01;
        setScale((prev) => Math.min(Math.max(prev + delta, 0.5), 2));
      }
      lastTouchDistance.current = distance;
    }
  };

  const handleTouchEnd = () => {
    lastTouchDistance.current = null;
  };

  const handleMouseDown = (e: React.MouseEvent, item: BoardItemData) => {
    if (locked || e.button !== 0) return;
    e.preventDefault();
    const pos = positions[item.id] ?? { x: 0, y: 0 };
    dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    setDragging(item.id);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!dragging || !boardRef.current || locked) return;
    const board = boardRef.current.getBoundingClientRect();
    const itemWidth = 120 * scale;
    const itemHeight = 140 * scale;

    const newX = Math.max(0, Math.min(e.clientX - board.left - dragOffset.current.x, board.width - itemWidth));
    const newY = Math.max(0, Math.min(e.clientY - board.top - dragOffset.current.y, board.height - itemHeight));

    setPositions((prev) => ({ ...prev, [dragging]: { x: newX, y: newY } }));
  };

  const handleMouseUp = () => {
    setDragging(null);
  };

  const handleTouchStart = (e: React.TouchEvent, item: BoardItemData) => {
    if (locked || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const pos = positions[item.id] ?? { x: 0, y: 0 };
    dragOffset.current = { x: touch.clientX - pos.x, y: touch.clientY - pos.y };
    setDragging(item.id);
  };

  const handleTouchMoveItem = (e: TouchEvent) => {
    if (!dragging || !boardRef.current || locked || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const board = boardRef.current.getBoundingClientRect();
    const itemWidth = 120 * scale;
    const itemHeight = 140 * scale;

    const newX = Math.max(0, Math.min(touch.clientX - board.left - dragOffset.current.x, board.width - itemWidth));
    const newY = Math.max(0, Math.min(touch.clientY - board.top - dragOffset.current.y, board.height - itemHeight));

    setPositions((prev) => ({ ...prev, [dragging]: { x: newX, y: newY } }));
  };

  const handleTouchEndItem = () => {
    setDragging(null);
  };

  useEffect(() => {
    if (dragging && !locked) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMoveItem);
      window.addEventListener('touchend', handleTouchEndItem);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchmove', handleTouchMoveItem);
        window.removeEventListener('touchend', handleTouchEndItem);
      };
    }
  }, [dragging, positions, scale, locked]);

  const toggleLock = () => {
    const newLocked = !locked;
    setLocked(newLocked);
    const storaged = safeGetItem(storageKey);
    let jsonStoraged: Record<string, unknown> = {};
    if (storaged) {
      try {
        jsonStoraged = JSON.parse(storaged) as Record<string, unknown>;
      } catch {
        // ignora
      }
    }
    safeSetItem(storageKey, JSON.stringify({ ...jsonStoraged, locked: newLocked }));
    if (dragging) setDragging(null);
  };

  const handleItemClick = (item: BoardItemData) => {
    if (locked && onItemClick) onItemClick(item);
  };

  return (
    <div style={{ width: '500px', height: 'calc(100vh - 250px)', display: 'flex' }}>
      <div
        ref={boardRef}
        onWheel={handleWheel}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          flex: 1,
          backgroundColor: '#1F2937',
          borderRadius: '8px',
          position: 'relative',
          overflow: 'hidden',
          cursor: locked ? 'not-allowed' : 'default',
          border: locked ? '2px solid #374151' : '2px dotted #374151',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          marginBottom: '0.8rem',
        }}
      >
        <div style={{ position: 'absolute', top: '0.3rem', left: '0.3rem', zIndex: 999 }}>
          <IconButton
            iconName={locked ? 'locked' : 'unlocked'}
            onClick={toggleLock}
            hoverText={locked ? 'Desbloquear' : 'Bloquear'}
          />
        </div>

        {displayItems.map((item) => {
          const pos = positions[item.id] ?? { x: 0, y: 0 };
          const isDraggingItem = dragging === item.id;

          return (
            <Item
              key={item.id}
              item={item}
              position={pos}
              scale={scale}
              isDragging={isDraggingItem}
              locked={locked}
              colorRotation={colorRotation}
              onClick={handleItemClick}
              onMouseDown={(e) => handleMouseDown(e, item)}
              onTouchStart={(e) => handleTouchStart(e, item)}
            />
          );
        })}

        {displayItems.length === 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#6B7280', fontSize: '20px' }}>
            Nenhum item para exibir
          </div>
        )}

        <div style={{ position: 'absolute', bottom: '0.5rem', right: '0.5rem', padding: '0.5rem', background: 'rgba(0, 0, 0, 0.5)', borderRadius: '0.5rem', color: '#9CA3AF', fontSize: '0.75rem' }}>
          Zoom: {(scale * 100).toFixed(0)}%
        </div>
      </div>
    </div>
  );
}
