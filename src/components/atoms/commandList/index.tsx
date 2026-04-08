import React, { useEffect, useRef } from 'react';
import css from './index.module.scss';

interface CommandListProps {
  handleInfo: () => void;
}

const CommandList = (props: CommandListProps) => {
  const { handleInfo } = props;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      // Verifica se o ref principal está definido e se o clique NÃO foi dentro dele
      const isOutsideMainRef = ref.current && !ref.current.contains(target);

      // Se o clique foi fora do elemento principal E fora de todos os elementos excluídos
      if (isOutsideMainRef) {
        handleInfo();
      }
    };

    // Adiciona o event listener ao documento
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    // Função de limpeza para remover o event listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  return (
    <div className={css["container"]} ref={ref}>
      <h2 className={css["title"]}>3D Space Navigation Commands</h2>
      <div className={css["sections-container"]}>
        <section>
          <h3 className={css["section-title"]}>Mouse Controls</h3>
          <ul className={css["command-list"]}>
            <li>• Mouse drag: Rotate camera</li>
            <li>• Shift + mouse drag: Strafe (left/right/up/down)</li>
            <li>• Left click: Move forward</li>
            <li>• Right click: Move backward</li>
            <li>• Double click: Select cube or create new cube</li>
            <li>• Scroll wheel: Move forward/backward</li>
            <li>• Shift + scroll: Move left/right</li>
            <li>• Control + scroll: Move up/down</li>
          </ul>
        </section>
        <section>
          <h3 className={css["section-title"]}>Keyboard Controls</h3>
          <ul className={css["command-list"]}>
            <li>• Arrow keys: Basic movement</li>
            <li>• g: Add Cartesian Space</li>
            <li>• l: Clean space</li>
            <li>• n: Add new cube</li>
            <li>• t: Add text</li>
            <li>• d: Toggle drawing mode</li>
            <li>• Escape: Cancel current drawing</li>
          </ul>
        </section>
      </div>
      <div className={css["footer"]}>
        Double-click on cube faces to add/edit text
      </div>
    </div>
  );
};

export default CommandList;
