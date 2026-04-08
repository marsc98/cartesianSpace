import React, { useEffect, useRef } from 'react'
import css from "./index.module.scss";
import ColorPicker from '../../atoms/colorPicker';
import { fonts } from "./utils";
import Select from '../../atoms/select';

interface FontRef {
  path: string;
  size: number;
  height: number;
  [key: string]: unknown;
}

interface TextFormProps {
  addTextToScene?: (...args: unknown[]) => void;
  colorRef: React.MutableRefObject<string>;
  fontRef: React.MutableRefObject<FontRef>;
  textRef: React.MutableRefObject<{ value: string }>;
}

function TextForm({ addTextToScene, colorRef, fontRef, textRef }: TextFormProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  let texto;

  // function handleSubmit(e) {
  //   e.preventDefault();
  //
  //   if (!texto) {
  //     alert("Pensamento vazio!");
  //     return;
  //   }
  //
  //   addTextToScene(e, texto);
  //
  //   // Limpa o campo de texto
  //   document.getElementById("text-form-text-area").value = "";
  // }

  function handleSelect(e: React.ChangeEvent<HTMLSelectElement>) {
    fontRef.current = { ...fontRef.current, [e.target.id]: e.target.value };
  }

  const fontSizeOptions: { value: string; label: string }[] = [];
  for (let i = 8; i <= 80; i += 4) {
    fontSizeOptions.push({ value: String(i), label: `${i}px` });
  }

  const fontHeightOptions: { value: string; label: string }[] = [];
  for (let i = 1; i <= 20; i += 2) {
    fontHeightOptions.push({ value: String(i), label: `${i}px` });
  }

  useEffect(() => {
    if (textareaRef.current) textareaRef.current.value = '';

    setTimeout(() => {
      textareaRef?.current?.focus();
    }, 100);

    return () => {
      if (textareaRef.current) {
        document.getElementById('canvas-container')?.focus()
        textareaRef.current.blur();
      }
    }
  }, []);

  return (
    <form className={css["text-form_container"]}>

      <div className={css["text-form-text-container"]}>
        <label className={css["text-form-label"]} htmlFor="text-form-text-area">Adicione seu pensamento:</label>
        <textarea
          id="text-form-text-area"
          className={css["text-form-text-area"]}
          ref={textareaRef}
          placeholder="Digite seu pensamento..."
          onKeyDown={(e) => {
            e.stopPropagation(); // Bloqueia propagação do textarea
          }}
          onChange={e => {
            textRef.current.value = e.target.value
          }}
        />
      </div>

      <div className={css["text-form-items"]}>
        <Select className={css["select-container"]} label="Fonte" options={fonts} id="path" onChange={e => handleSelect(e)} form="text-form" />
        <div className={css["font-config-container"]}>
          <Select label="Tamanho" options={fontSizeOptions} id="size" onChange={e => handleSelect(e)} form="text-form" />
          <Select label="Espacamento" options={fontHeightOptions} id="height" onChange={e => handleSelect(e)} form="text-form" />
        </div>
        <ColorPicker className={css["color-picker"]} colorRef={colorRef} />
      </div>
    </form >

  )
}

export default TextForm
