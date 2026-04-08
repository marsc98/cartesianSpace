import React, { useState } from "react";
import css from "./index.module.scss";
import IconButton from "../iconButton";

interface FunctionItem {
  id: string;
  text?: string;
  color?: string;
  coordinates?: unknown;
}

interface FunctionsListProps {
  functionsList?: FunctionItem[];
  setCameraPosition?: (coords: unknown) => void;
  closeFunctionsList: () => void;
}

function FunctionsList({ functionsList = [], setCameraPosition, closeFunctionsList }: FunctionsListProps) {
  const [selectedFunction, setSelectedFunction] = useState<string | null>(null);

  const handleSelect = (functionRep: FunctionItem) => {
    setSelectedFunction(functionRep.id);
    setCameraPosition?.(functionRep.coordinates);
  };

  return (
    <div className={css["list-container"]}>
      <div className={css["list-header"]}>
        <h2>Funções</h2>
        <IconButton className={css["close"]} iconName="close" hoverText="Fechar" onClick={() => closeFunctionsList()} />
      </div>
      <ul className={css["list-items"]}>
        {functionsList?.map((functionRep) => {
          const isSelected = selectedFunction === functionRep.id;
          return (
            <li className={css["list-item"]} key={functionRep.text}>
              <div
                className={`${css["item-container"]}`}
                data-selected={isSelected}
                style={{ color: functionRep.color }}
                onClick={() => handleSelect(functionRep)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" height="35px" viewBox="0 -960 960 960" width="35px" fill={functionRep.color}>
                  <path d="M400-240v-80h62l105-120-105-120h-66l-64 344q-8 45-37 70.5T221-120q-45 0-73-24t-28-64q0-32 17-51.5t43-19.5q25 0 42.5 17t17.5 41q0 5-.5 9t-1.5 9q5-1 8.5-5.5T252-221l62-339H200v-80h129l21-114q7-38 37.5-62t72.5-24q44 0 72 26t28 65q0 30-17 49.5T500-680q-25 0-42.5-17T440-739q0-5 .5-9t1.5-9q-6 2-9 6t-5 12l-17 99h189v80h-32l52 59 52-59h-32v-80h200v80h-62L673-440l105 120h62v80H640v-80h32l-52-60-52 60h32v80H400Z" />
                </svg>
                <span className={css["item-text"]} style={{ color: functionRep.color }}>
                  = {functionRep.text}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default FunctionsList;

