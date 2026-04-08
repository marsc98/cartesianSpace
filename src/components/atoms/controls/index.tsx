import React from "react";
import css from "./index.module.scss";

interface ControlItem {
  name: string;
  min: number;
  max: number;
}
type ControlGroup = Record<string, ControlItem[]>;

interface ControlsProps {
  updateRange: (name: string, value: number) => void;
  isDrawing: boolean;
  controlsRangeState: Record<string, number>;
}

function Controls(props: ControlsProps) {
  const { updateRange, isDrawing, controlsRangeState } = props;

  let controls: ControlGroup[] = [
    {
      wave: [
        { name: "y", min: 0, max: window.innerHeight },
        { name: "tamanho", min: -0.01, max: 0.01 },
        { name: "amplitude", min: -300, max: 300 },
        { name: "frequencia", min: -0.01, max: 0.01 },
      ],
    },
    {
      stroke: [
        { name: "h", min: 0, max: 255 },
        { name: "s", min: 0, max: 100 },
        { name: "l", min: 0, max: 100 },
      ],
    },
    {
      background: [
        { name: "r", min: 0, max: 255 },
        { name: "g", min: 0, max: 255 },
        { name: "b", min: 0, max: 255 },
        { name: "a", min: 0, max: 1.01 },
      ],
    },
  ];
  
  if (isDrawing) {
    controls = [
      {
        cursor: [
          { name: "cursor", min: 0, max: 100 }
        ]
      }
    ];
  }

  return (
    <ul className={css["cursor-size_container"]}>
      {controls.map((control) => {
        return (
          <li>
            <div className={css["range-section_container"]}>
              <h2 className={css["section-title_container"]}>{Object.keys(control)?.[0]}</h2>
              <ul>
                {control[Object.keys(control)?.[0]]?.map((item) => {
                  const needsMinimalValues = !Number.isInteger(item.max);
                  const rawRange = controlsRangeState[item.name];
                  const range = needsMinimalValues ? rawRange.toFixed(2) : rawRange;
                  return (
                    <li>
                      <h2 className={css["size"]}>
                        {item.name}: {range}
                      </h2>
                      <input
                        type="range"
                        min={item.min}
                        max={item.max}
                        step="any"
                        value={controlsRangeState[item.name]}
                        onChange={(e) => {
                          const size = needsMinimalValues
                            ? parseFloat(e.target.value)
                            : parseInt(e.target.value);
                          updateRange(item.name, size);
                        }}
                      />
                    </li>
                  );
                })}
              </ul>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export default Controls;
