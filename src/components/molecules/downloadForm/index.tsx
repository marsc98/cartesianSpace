import React from 'react';
import DOMPurify from 'dompurify';
import css from './index.module.scss';
import IconButton from '../../molecules/iconButton';

interface DownloadFormProps {
  canvas: HTMLElement;
  label?: string;
  id?: string;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  inputRef?: React.RefObject<HTMLInputElement>;
}

const DownloadForm = ({ canvas }: DownloadFormProps) => {

  function capturarDivComoPNG() {
    const canvas2 = document.createElement('canvas');
    const ctx = canvas2.getContext('2d');
    if (!ctx) return;
    canvas2.width = canvas.offsetWidth;
    canvas2.height = canvas.offsetHeight;

    // Clona o elemento para manipulação segura
    // const clone = elemento.cloneNode(true);
    //
    // // Substitui imagens externas por placeholders
    // clone.querySelectorAll('img').forEach(img => {
    //   if (img.src.startsWith('http') && !img.crossOrigin) {
    //     img.crossOrigin = 'anonymous';
    //     img.onerror = () => {
    //       img.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlZWVlZWUiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBhbGlnbm1lbnQtYmFzZWxpbmU9Im1pZGRsZSIgZmlsbD0iIzY2NiI+SW1hZ2VtIG5vIGNhcnJlZ2FkYTwvdGV4dD48L3N2Zz4=';
    //     };
    //   }
    // });
    //
    const sanitized = DOMPurify.sanitize(canvas.innerHTML, {
      USE_PROFILES: { svg: true, svgFilters: true },
      FORBID_TAGS: ['script', 'iframe'],
    });
    const data = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas2.width}" height="${canvas2.height}">
                  <foreignObject width="100%" height="100%">
                    <div xmlns="http://www.w3.org/1999/xhtml">
                      ${sanitized}
                    </div>
                  </foreignObject>
                </svg>`;

    // const data = '<></>'

    const img = new Image();
    img.crossOrigin = 'anonymous';
    const svgBlob = new Blob([data], { type: 'image/svg+xml;charset=utf-8' });
    img.src = URL.createObjectURL(svgBlob);

    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(img.src);

      try {
        const pngURL = canvas2.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = 'captura.png';
        link.href = pngURL;
        link.click();
      } catch (error) {
        console.error('Erro ao exportar canvas:', error);
        alert('Não foi possível exportar devido a restrições de segurança.');
      }
    };
  }

  return (
    <div className={css["download-form-container"]}>
      <IconButton size="g" iconName="download" />
      <IconButton size="g" iconName="photo" onClick={capturarDivComoPNG} />
      <span>Baixar arquivo da sessão</span>
      <span>Tirar foto da sessão</span>
    </div>
  );
};

export default DownloadForm;

