import React from 'react';
import css from './index.module.scss';

export type IconName =
  | 'arrow' | 'draw' | 'eraser' | 'presentation' | 'move' | 'sin' | 'boom'
  | 'clearAll' | 'universe' | 'plus' | 'minus' | 'info' | 'axis' | 'function'
  | 'mountains' | 'axis2d' | 'config' | 'target' | 'note' | 'drawPlane'
  | 'drawElements' | 'uploadFile' | 'bookmark' | 'delete' | 'save' | 'stars'
  | 'download' | 'photo' | 'copy' | 'close' | 'colorize' | 'elementTarget'
  | 'stop' | 'ruler' | 'resize' | 'colapse' | 'expand' | 'pin' | 'markers'
  | 'movePhone' | 'palette' | 'crossword' | 'locked' | 'unlocked' | 'fullscreen'
  | 'fullscreenExit' | 'keep' | 'keepOff' | 'blackBoard' | 'calculator'
  | 'backspace' | 'dragHand' | 'coolArrow' | 'axis2' | 'infoOnInfo' | 'undo' | 'redo' | 'edit';

interface IconProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'name'> {
  name: IconName;
  size?: string;
  color?: string;
  className?: string;
}

function Icon(props: IconProps) {
  const { name, size = 'p', color, className, style: otherStyle, ...others } = props;
  let src;

  switch (name) {
    case 'arrow':
      src = '/images/icons/arrow.svg';
      break;
    case 'draw':
      src = '/images/icons/draw.svg';
      break;
    case 'eraser':
      src = '/images/icons/eraser.svg';
      break;
    case 'presentation':
      src = '/images/icons/presentation.svg';
      break;
    case 'move':
      src = '/images/icons/move.svg';
      break;
    case 'sin':
      src = '/images/icons/sin.svg';
      break;
    case 'boom':
      src = '/images/icons/boom.svg';
      break;
    case 'clearAll':
      src = '/images/icons/clearAll.svg';
      break;
    case 'universe':
      src = '/images/icons/universe.svg';
      break;
    case 'plus':
      src = '/images/icons/plus.svg';
      break;
    case 'minus':
      src = '/images/icons/minus.svg';
      break;
    case 'info':
      src = '/images/icons/info.svg';
      break;
    case 'axis':
      src = '/images/icons/axis.svg';
      break;
    case 'function':
      src = '/images/icons/function.svg';
      break;
    case 'mountains':
      src = '/images/icons/mountains.svg';
      break;
    case 'axis2d':
      src = '/images/icons/axis2d.svg';
      break;
    case 'config':
      src = '/images/icons/config.svg';
      break;
    case 'target':
      src = '/images/icons/target.svg';
      break;
    case 'note':
      src = '/images/icons/note.svg';
      break;
    case 'drawPlane':
      src = '/images/icons/drawPlane.svg';
      break;
    case 'drawElements':
      src = '/images/icons/drawElements.svg';
    case 'uploadFile':
      src = '/images/icons/uploadFile.svg';
      break;
    case 'bookmark':
      src = '/images/icons/bookmark.svg';
      break;
    case 'delete':
      src = '/images/icons/delete.svg';
      break;
    case 'save':
      src = '/images/icons/save.svg';
      break;
    case 'stars':
      src = '/images/icons/stars.svg';
      break;
    case 'download':
      src = '/images/icons/download.svg';
      break;
    case 'photo':
      src = '/images/icons/photo.svg';
      break;
    case 'copy':
      src = '/images/icons/copy.svg';
      break;
    case 'close':
      src = '/images/icons/close.svg';
      break;
    case 'colorize':
      src = '/images/icons/colorize.svg';
      break;
    case 'elementTarget':
      src = '/images/icons/elementTarget.svg';
      break;
    case 'stop':
      src = '/images/icons/stop.svg';
      break;
    case 'ruler':
      src = '/images/icons/ruler.svg';
      break;
    case 'resize':
      src = '/images/icons/resize.svg';
      break;
    case 'colapse':
      src = '/images/icons/colapse.svg';
      break;
    case 'expand':
      src = '/images/icons/expand.svg';
      break;
    case 'pin':
      src = '/images/icons/pin.svg';
      break;
    case 'markers':
      src = '/images/icons/markers.svg';
      break;
    case 'movePhone':
      src = '/images/icons/movePhone.svg';
      break;
    case 'palette':
      src = '/images/icons/palette.svg';
      break;
    case 'crossword':
      src = '/images/icons/crossword.svg';
      break;
    case 'locked':
      src = '/images/icons/locked.svg';
      break;
    case 'unlocked':
      src = '/images/icons/unlocked.svg';
      break;
    case 'fullscreen':
      src = '/images/icons/fullscreen.svg';
      break;
    case 'fullscreenExit':
      src = '/images/icons/fullscreenExit.svg';
      break;
    case 'keep':
      src = '/images/icons/keep.svg';
      break;
    case 'keepOff':
      src = '/images/icons/keepOff.svg';
      break;
    case 'blackBoard':
      src = '/images/icons/blackBoard.svg';
      break;
    case 'calculator':
      src = '/images/icons/calculator.svg';
      break;
    case 'backspace':
      src = '/images/icons/backspace.svg';
      break;
    case 'dragHand':
      src = '/images/icons/dragHand.svg';
      break;
    case 'coolArrow':
      src = '/images/icons/coolArrow.svg';
      break;
    case 'axis2':
      src = '/images/icons/axis2.svg';
      break;
    case 'infoOnInfo':
      src = '/images/icons/infoOnInfo.svg';
      break;
    case 'undo':
      src = '/images/icons/undo.svg';
      break;
    case 'redo':
      src = '/images/icons/redo.svg';
      break;
    case 'edit':
      src = '/images/icons/edit.svg';
      break;
    default:
      src = '';
      break;
  }

  return (
    <img
      className={css['icon'] + ' ' + className}
      src={src}
      alt={name}
      data-size={size}
      style={{
        filter: color ? `opacity(1) drop-shadow(0 0 0 ${color})` : undefined,
        ...otherStyle,
      }}
      {...others}
    />
  );
}

export default Icon;
