import React, { useEffect, useState } from 'react';
import css from './index.module.scss';
import IconButton from '../../molecules/iconButton';

/*
 * This componente displays the helpers list on the screen
 * based on a position logic.
 *
 *  * COMBINAÇÕES DE POSICIONAMENTO:
 *
 * | Vertical  | Horizontal | Display  | Classe SCSS | Descrição               |
 * |-----------|------------|----------|-------------|-------------------------|
 * | top       | left       | row      | tlr         | Topo + Esquerda (linha) |
 * | top       | right      | row      | trr         | Topo + Direita (linha)  |
 * | top       | left       | column   | tlc         | Topo + Esquerda (coluna)|
 * | top       | right      | column   | trc         | Topo + Direita (coluna) |
 * | bottom    | left       | row      | blr         | Base + Esquerda (linha) |
 * | bottom    | right      | row      | brr         | Base + Direita (linha)  |
 * | bottom    | left       | column   | blc         | Base + Esquerda (coluna)|
 * | bottom    | right      | column   | brc         | Base + Direita (coluna) |
 *
 *  Jump logic:
 *
 *  - position, value(rem):
 *  - top, 7 = top-7
 *  - bottom, 7 = bottom-7
 *  - left, 7 = left-7
 *  - right, 7 = right-7
 *
 *  @param {Array} list
 *  @param {string} position
 *  @param {string} jump
 *  @return {JSX.Element}
 * */

interface HelperItem {
  iconName: string;
  hoverText?: string;
  onClick?: () => void;
  active?: boolean;
  visible?: boolean;
}

interface HelpersListProps {
  listOpen: boolean;
  setListOpen: (open: boolean) => void;
  id?: string;
  list?: HelperItem[];
  position?: string;
  jump?: string;
  isMobile?: boolean;
}

const HelpersList = ({
  listOpen,
  setListOpen,
  id,
  list,
  position,
  jump,
  isMobile,
}: HelpersListProps) => {
  const [jumps, setJumps] = useState<Record<string, string>>({});

  useEffect(() => {
    if (jump) {
      const newJumps = {};
      // for (let i = 0; i < jump?.length; i++) {
      const [key, value] = jump.split('-');
      newJumps[key] = `${value}rem`;
      // }
      setJumps(newJumps);
    }
  }, [jump]);

  return (
    <ul
      key={id}
      className={`${css['helpers-list-container']} ${css[position]}`}
      style={jumps || {}}
      data-position={position}
    >
      {list?.map((helper) => {
        if (!helper.visible) return null;
        return (
          <li
            key={helper.iconName}
            className={css['helper-item']}
            data-active={helper.active}
          >
            <IconButton
              iconName={helper.iconName}
              size="m"
              hoverText={helper.hoverText}
              onClick={helper.onClick}
              isActive={helper.active}
            />
          </li>
        );
      })}
    </ul>
  );
};

export default HelpersList;
