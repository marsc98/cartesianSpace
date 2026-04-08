import React, { useState } from "react";
import css from "./index.module.scss";
import Icon from "../../atoms/icon";

interface PickerItem {
  name: string;
  value: string;
  action?: (value: string) => void;
  sample?: boolean;
}

interface PickerProps {
  list: PickerItem[];
  firstValue?: number;
  hasImage?: boolean;
  position?: 1 | 2 | 3 | 4;
}

function Picker({ list, firstValue = 1, hasImage, position = 1 }: PickerProps) {
  const [active, setActive] = useState(false);
  const [selected, setSelected] = useState(firstValue);

  function activePicker() {
    setActive(!active);
  }

  function triggerNewChoice(index: number, action?: (value: string) => void) {
    if (action) action(list[index].value);
    setSelected(index);
  }

  return (
    <ul className={css["picker_container"]} data-position={position}>
      {list.map((item, index) => {
        const backgroundColor = hasImage ? "transparent" : item.value;

        if (active || item.sample) {
          return (
            <li key={item.name}>
              <button
                className={css["item_container"]}
                style={{
                  backgroundColor: backgroundColor,
                  border: item.sample ? "none" : undefined,
                }}
                data-selected={selected === index}
                onClick={() => {
                  if (item.sample) {
                    activePicker();
                  } else {
                    triggerNewChoice(index, item.action);
                  }
                }}
                data-has-image={Boolean(hasImage)}
                data-sample={Boolean(item.sample)}
                data-position={position}
              >
                {item.sample && (
                  <Icon
                    name="arrow"
                    data-is-sample={item.sample}
                    className={css["arrow"]}
                    alt="seta"
                    data-active={active}
                    data-position={position}
                  />
                )}
                {hasImage && 
                  <img 
                    src={item.sample ? list?.[selected]?.value : item.value}
                    alt={item.sample ? list?.[selected]?.name : item.name}
                  />
                }
                {item.sample && !hasImage && (
                  <div
                    className={css["color_container"]}
                    style={{ backgroundColor: list[selected].value }}
                  />
                )}
              </button>
            </li>
          );
        }
      })}
    </ul>
  );
}

export default Picker;
