import React from "react";
import css from "./index.module.scss";
import Icon from "../icon";

interface ResizeIndicatorProps {
  coordinates?: { x: number; y: number };
}

function ResizeIndicator(props: ResizeIndicatorProps) {
  const { coordinates } = props;

  return (
   <div style={{ top: `${coordinates?.y-50}px`, left: `${coordinates?.x-50}px`}} className={css["resize-indicator-container"]}>
    <Icon name="expand" />
    <hr className={css["resize-indicator-line"]}/>
    <Icon name="colapse" />
   </div>
  );
}

export default ResizeIndicator
