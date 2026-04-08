import React, { useMemo } from 'react';
import css from './index.module.scss';
import { generateArcadeColor } from '../../../utils/functions';

interface ButtonProps {
  children?: React.ReactNode;
  text?: string;
  action?: React.MouseEventHandler<HTMLButtonElement>;
  type?: 'arcade' | 'button' | 'submit' | 'reset';
  formId?: string;
  color?: string;
  buttonRef?: React.RefObject<HTMLButtonElement>;
  radius?: number;
  disabled?: boolean;
  href?: string;
  className?: string; // Add className prop
}

function Button(props: ButtonProps) {
  const {
    children,
    text,
    action,
    type,
    formId,
    color,
    buttonRef,
    radius,
    disabled,
    href,
  } = props;

  const isArcade = type === 'arcade';
  const htmlType = isArcade ? 'button' : type;
  const isRound = !isArcade && !!children && typeof children !== 'string';

  const arcadeColor = useMemo(() => generateArcadeColor(), []);

  if (isArcade) {
    const colorVars = {
      '--color-light': arcadeColor.light,
      '--color-main':  arcadeColor.main,
      '--color-dark':  arcadeColor.dark,
      '--color-deep':  arcadeColor.deep,
    } as React.CSSProperties;

    return (
      <div className={css['arcade-container']} style={colorVars}>
        <div className={css['bezel']}>
          <div className={css['socket']}>
            <button
              ref={buttonRef}
              type="button"
              className={css['button-plunger']}
              onClick={action}
              disabled={disabled}
            >
              {text || 'PUSH'}
            </button>
            <div className={css['glow']} />
          </div>
        </div>
      </div>
    );
  }

  const size = !isRound ? 'auto' : radius ? `${radius * 2}px` : '56px';

  return (
    <div
      className={css['button-container']}
      style={{
        width: size,
        height: radius ? size : '40px',
        borderRadius: radius ? `${radius}px` : '8px',
        boxShadow: '-3px 18px 20px 2px rgba(0, 0, 0, 0.3)',
        opacity: `${disabled ? 0.7 : 1}`,
      }}
      title={text}
    >
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={`${css['button']} ${isRound ? css['button--round'] : ''}`}
          data-color={color}
          aria-disabled={disabled}
        >
          {children || text}
        </a>
      ) : (
        <button
          ref={buttonRef}
          form={formId}
          type={htmlType}
          className={`${css['button']} ${isRound ? css['button--round'] : ''}`}
          data-color={color}
          onClick={action}
          disabled={disabled}
        >
          {children || text}
        </button>
      )}
    </div>
  );
}

export default Button;
