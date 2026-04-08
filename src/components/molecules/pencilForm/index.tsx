import React, { useRef, useState } from 'react';
import css from "./index.module.scss";
import ColorPicker from '../../atoms/colorPicker';
import Input from '../../atoms/input';
import RangeInput from '../../atoms/rangeInput';

interface DrawerRef {
  size: number;
  active: boolean;
  selectedType: string;
  color: string;
}

interface PencilFormProps {
  drawerRef: React.MutableRefObject<DrawerRef>;
  colorRef: React.MutableRefObject<string>;
  applySettings?: () => void;
}

function PencilForm({ drawerRef, colorRef, applySettings }: PencilFormProps) {

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [opacity, setOpacity] = useState(100);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (applySettings) {
      applySettings();
    }
  }

  return (
    <form id="pencil-form" className={css["pencil-form-container"]} onSubmit={handleSubmit}>
      <div className={css["pen-settings-basic"]}>

        <RangeInput
          label="Tamanho da caneta:"
          id="pen-size-range"
          sizeRef={drawerRef as unknown as React.MutableRefObject<number>}
          min={1}
          max={50}
        />

        <ColorPicker
          colorRef={colorRef}
        />
      </div>

      {/* <button
        type="button"
        className={css["advanced-toggle"]}
        onClick={() => setShowAdvanced(!showAdvanced)}
      >
        {showAdvanced ? 'Ocultar' : 'Avançado'}
      </button>

      {showAdvanced && (
        <div className={css["pen-settings-advanced"]}>
          <Input
            id="pen-opacity-input"
            type="range"
            min="10"
            max="100"
            step="5"
            value={opacity}
            onChange={e => setOpacity(e.target.value)}
            label={`Opacidade: ${opacity}%`}
          />
        </div>
      )} */}
    </form>
  );
}

export default PencilForm;
