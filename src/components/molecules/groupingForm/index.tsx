import React, { useCallback } from 'react';
import css from './index.module.scss';

interface GroupingFormProps {
  count: number;
  onFinalize: () => void;
  onClose: () => void;
}

function GroupingForm({ count, onFinalize, onClose: _onClose }: GroupingFormProps) {
  const handleFinalize = useCallback(() => {
    if (count < 2) return;
    onFinalize();
  }, [count, onFinalize]);

  return (
    <div className={css['container']}>
      <p className={css['instruction']}>
        Clique nos elementos que deseja agrupar.
      </p>
      <p className={css['counter']}>
        {count} elemento{count !== 1 ? 's' : ''} selecionado{count !== 1 ? 's' : ''}
      </p>
      <div className={css['actions']}>
        <button
          className={css['btn']}
          onClick={handleFinalize}
          disabled={count < 2}
        >
          Finalizar seleção
        </button>
      </div>
    </div>
  );
}

export default GroupingForm;
