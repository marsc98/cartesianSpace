export interface CameraControls {
  shiftPressed: boolean;
  mouseDown: boolean;
  mouseMoving: boolean;
  lastX: number;
  lastY: number;
  rightButton: boolean;
  lastClickTime: number;
}

export interface CameraRotationState {
  x: number;
  y: number;
  z: number;
  active: boolean;
  previousX: number;
  previousY: number;
}
