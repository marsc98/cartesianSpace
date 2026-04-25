import React, { useEffect, useRef, useState } from 'react';
import css from './index.module.scss';
import ColorPicker from '../../atoms/colorPicker';
import SizeSetter from '../../atoms/sizeSetter';
import Item from '../../atoms/item';
import { colorToFilter } from '../../../utils/functions';

function ScrollableRow({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, startX: 0, scrollLeft: 0, vx: 0, lastX: 0, lastT: 0 });
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        el.scrollLeft += e.deltaY * 0.7;
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!drag.current.active) return;
      const now = performance.now();
      const dt = now - drag.current.lastT;
      if (dt > 0) drag.current.vx = (e.clientX - drag.current.lastX) / dt;
      drag.current.lastX = e.clientX;
      drag.current.lastT = now;
      el.scrollLeft = drag.current.scrollLeft - (e.clientX - drag.current.startX);
    };

    const onMouseUp = () => {
      if (!drag.current.active) return;
      drag.current.active = false;

      let v = -drag.current.vx * 16;
      const momentum = () => {
        v *= 0.9;
        el.scrollLeft += v;
        if (Math.abs(v) > 0.5) rafId.current = requestAnimationFrame(momentum);
        else rafId.current = null;
      };
      if (Math.abs(v) > 1) rafId.current = requestAnimationFrame(momentum);
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    return () => {
      el.removeEventListener('wheel', onWheel);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (rafId.current) cancelAnimationFrame(rafId.current);
    const el = ref.current;
    if (!el) return;
    drag.current = {
      active: true,
      startX: e.clientX,
      scrollLeft: el.scrollLeft,
      vx: 0,
      lastX: e.clientX,
      lastT: performance.now(),
    };
  };

  return (
    <div ref={ref} className={css['section-items']} onMouseDown={onMouseDown}>
      {children}
    </div>
  );
}

function CreativityForm(props) {
  const {
    currentColor,
    setCurrentColor,
    activeCreativityRef,
    sizeRef,
    drawerRef,
    isMobile,
    setIsOwnCursorActive,
    setPencilIsActive,
    setElementsIsActive,
    colorRef,
    elementsRef,
    drawingRef,
    boardIsActive,
    setBoardIsActive,
    handleCreativity,
  } = props;
  const [selectedShape, setSelectedShape] = useState('');
  const [actualizeColor, setActualizeColor] = useState(false);

  const elements3d = [
    { id: 'sphere', type: 'shapes', name: 'Esféra', img: '/images/elements/sphere.png' },
    { id: 'pyramid', type: 'shapes', name: 'Pirâmide', img: '/images/elements/pyramid.png' },
    { id: 'cylinder', type: 'shapes', name: 'Cilindro', img: '/images/elements/cylinder.png' },
    { id: 'cube', type: 'shapes', name: 'Cubo', img: '/images/elements/cube.png' },
    { id: 'arrow', type: 'shapes', name: 'Seta', img: '/images/elements/arrow.png' },
  ];

  const elements2d = [
    { id: 'circle', type: 'shapes', name: 'Círculo', img: '/images/elements/circle.png' },
    { id: 'line', type: 'shapes', name: 'Linha', img: '/images/elements/line.png' },
    { id: 'triangle', type: 'shapes', name: 'Triângulo', img: '/images/elements/triangle.png' },
    { id: 'square', type: 'shapes', name: 'Quadrado', img: '/images/elements/square.png' },
  ];

  const traces = [
    { id: '2dTrace', type: 'traces', name: '2D' },
    { id: '3dTrace', type: 'traces', name: '3D' },
    { id: 'optimizedTrace', type: 'traces', name: 'Traço Otimizado' },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
  };

  function handleShapeSelection(shape) {
    setSelectedShape(shape.id);
    setElementsIsActive(true);
    drawingRef.current = true;
    elementsRef.current.shape = shape.id;
    elementsRef.current.type = shape.type;
    elementsRef.current.active = true;

    activeCreativityRef.current.name = shape.name;
    activeCreativityRef.current.id = shape.id;
    activeCreativityRef.current.type = shape.type;
    activeCreativityRef.current.img = shape.img;
  }

  function handleTraceSelection(shape) {
    setSelectedShape(shape.id);
    setElementsIsActive(false);
    drawingRef.current = true;
    elementsRef.current.active = false;
    elementsRef.current.shape = null;
    elementsRef.current.type = shape.type;

    activeCreativityRef.current.name = shape.name;
    activeCreativityRef.current.id = shape.id;
    activeCreativityRef.current.type = shape.type;
    activeCreativityRef.current.img = null;

    setIsOwnCursorActive(true);
    setPencilIsActive(true);
  }

  useEffect(() => {
    if (activeCreativityRef.current.id) {
      setSelectedShape(activeCreativityRef.current.id);
    }
  }, []);

  const categories = [
    { id: 'traces', label: 'Traços', items: traces, handler: handleTraceSelection },
    { id: 'shapes2d', label: 'Elem. 2D', items: elements2d, handler: handleShapeSelection },
    { id: 'shapes3d', label: 'Elem. 3D', items: elements3d, handler: handleShapeSelection },
  ];

  return (
    <form className={css['shape-form-container']} onSubmit={handleSubmit}>
      <div className={css['shape-settings']} data-is-mobile={isMobile}>
        <ColorPicker
          colorRef={colorRef}
          label="Cor do elemento:"
          actualizeColor={setActualizeColor}
          ismobile={isMobile}
          currentColor={currentColor}
          setCurrentColor={setCurrentColor}
        />
        <SizeSetter sizeRef={sizeRef} shouldRotate={true} colorRef={colorRef} />
      </div>

      <div className={css['sections']}>
        {categories.map((cat) => (
          <div key={cat.id} className={css['section']}>
            <span className={css['section-label']}>{cat.label}</span>
            <ScrollableRow>
              {cat.items.map((item) => (
                <div key={item.id} className={css['scroll-item']}>
                  <Item
                    id={item.id}
                    item={item}
                    isSelected={selectedShape === item.id}
                    colorFilter={colorToFilter(colorRef.current)}
                    colorRef={colorRef}
                    onClick={() => cat.handler(item)}
                    isMobile={isMobile}
                  />
                </div>
              ))}
            </ScrollableRow>
          </div>
        ))}
      </div>
    </form>
  );
}

export default CreativityForm;
