import React, { useRef, useState } from 'react';
import css from './index.module.scss';
import Input from '../../atoms/input';
import Button from '../../atoms/button';
import { removeParticlesByid } from '../../organisms/Board3d/spaceElements';

function CartesianSpaceForm(props) {
  const {
    cartesianSpaceRef,
    createCartesianSpace,
    scene,
    prefix = 'modal_element',
  } = props;

  const [numLines, setNumLines] = useState(10);
  const [lineSize, setLineSize] = useState(10);

  function handleSubmit(e) {
    e.preventDefault();
    cartesianSpaceRef.current = {
      numLines: numLines,
      lineSize: lineSize,
    };
    createCartesianSpace();
  }

  return (
    <form
      id={`${prefix}-cartesian-space-form`}
      className={css['cartesian-space-form-container']}
      onSubmit={handleSubmit}
    >
      <Input
        id={`${prefix}-num-lines`}
        className={css['cartesian-space-form-input']}
        type="number"
        min="1"
        max="50"
        value={numLines}
        onChange={(e) => setNumLines(e.target.value)}
        label="Número de linhas (por quadrante):"
      />

      <Input
        id={`${prefix}-line-size`}
        className={css['cartesian-space-form-input']}
        type="number"
        min="0.1"
        max="5"
        step="0.1"
        value={lineSize}
        onChange={(e) => setLineSize(e.target.value)}
        label="Tamanho das linhas (px):"
      />

      {/*<Button text="Remover grid" action={() => removeParticlesByid(scene, "cartesian-space-grid")} color="orange" />*/}
    </form>
  );
}

export default CartesianSpaceForm;
