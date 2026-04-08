import React, { useState } from "react";
import RangeInput from "../rangeInput";
import css from "./index.module.scss";

interface SizeSetterProps {
  sizeRef: React.MutableRefObject<number>;
  colorRef: React.MutableRefObject<string>;
}

export default function SizeSetter({ sizeRef, colorRef }: SizeSetterProps) {
  const [size, setSize] = useState(sizeRef?.current || 20);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleSizeChange = (newSize: number) => {
    setSize(newSize);
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 200);
  };

  // Função para criar o grid baseado no tamanho
  const createGrid = (penSize: number): React.ReactNode[] => {
    const gridSize = 15; // 15x15 grid para mais granularidade

    // Calcula quantos quadrados devem estar ativos baseado no tamanho da caneta
    // Mapeia tamanho 5-75 para raio 1-7 (número de células do centro)
    const radius = Math.max(1, Math.min(7, Math.floor((penSize - 5) / 10) + 1));
    const center = Math.floor(gridSize / 2); // Centro do grid (7, 7)

    return Array.from({ length: gridSize * gridSize }, (_, index) => {
      const row = Math.floor(index / gridSize);
      const col = index % gridSize;

      // Calcula distância do centro usando distância de Manhattan (formato mais quadrado)
      const distanceFromCenter = Math.max(Math.abs(row - center), Math.abs(col - center));
      const isActive = distanceFromCenter < radius;

      return (
        <div
          key={index}
          className={`${css["grid-cell"]} ${isActive ? css["grid-cell--active"] : css["grid-cell--inactive"]}`}
        />
      );
    });
  };

  return (
    <div className={css["size-setter-container"]}>

      {/* Preview Container com Grid */}
      <div className={css["preview-container"]}>

        {/* Grid Container */}
        <div className={`${css["grid-container"]} ${isAnimating ? css["grid-container--animating"] : ""}`}>
          {createGrid(size)}
        </div>
      </div>

      {/* Título */}
      {/* <h4 className={css["title"]}>
        Selecione um tamanho
      </h4> */}

      <div className={css["size-info"]}>
        <span>Tamanho: {" "}</span>
        <div>
          <span style={{ color: colorRef.current || "#fffffff" }}>{size}</span> Un
        </div>
      </div>

      {/* Range Input */}
      <div className={css["range-container"]}>
        <RangeInput
          setElementSize={handleSizeChange}
          label="Tamanho da caneta:"
          id="pen-size-range"
          sizeRef={sizeRef}
          min={5}
          max={75}
          onChange={() => { }}
          colorRef={colorRef}
        />
      </div>
    </div>
  );
}
