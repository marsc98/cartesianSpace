import React from 'react';
import css from './index.module.scss';
import Icon from '../../atoms/icon';

function IconButton(props) {
  const { iconName, onClick, disabled, hoverText, size, isActive = false, ...others } = props;

  return (
    <div className={css["icon-button-container"]} data-active={isActive} {...others}>
      <button
        className={css[`icon-button ${disabled ? 'disabled' : ''}`]}
        onClick={!disabled ? onClick : undefined}
        title={hoverText} // Tooltip padrão do navegador
        aria-label={hoverText} // Acessibilidade para leitores de tela
        aria-disabled={disabled} // Indica estado desabilitado
        disabled={disabled}
      >
        {iconName && <Icon size={size} name={iconName} aria-hidden="true" />}
      </button>
    </div>
  );
}

export default IconButton;
