import React, { useState } from "react";
import RangeInput from "../rangeInput";
import { useUnits } from "../../../hooks/contexts/UnitsContext";
import { safeSetItem } from "../../../utils/storage";
import css from "./index.module.scss";

interface SizeSetterProps {
  sizeRef: React.MutableRefObject<number>;
  colorRef: React.MutableRefObject<string>;
}

export default function SizeSetter({ sizeRef, colorRef }: SizeSetterProps) {
  const [size, setSize] = useState(sizeRef?.current || 20);
  const { distanceUnit } = useUnits();

  const handleSizeChange = (newSize: number) => {
    setSize(newSize);
    safeSetItem('size', String(newSize));
  };

  return (
    <div className={css["size-setter-container"]}>
      <div className={css["range-container"]}>
        <RangeInput
          setElementSize={handleSizeChange}
          id="pen-size-range"
          sizeRef={sizeRef}
          min={5}
          max={75}
          colorRef={colorRef}
          thumbIcon="/images/icons/aspect_ratio.svg"
          shouldRotate={false}
        />
      </div>

      <div className={css["size-info"]}>
        <div>
          <span style={{ color: colorRef.current || "#fffffff" }}>{size.toFixed(2).replace(".",",")}</span> {distanceUnit}
        </div>
      </div>
    </div>
  );
}
