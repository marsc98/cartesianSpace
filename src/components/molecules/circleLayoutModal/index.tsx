export const CircleLayout = ({ items, radius = 150, itemSize = 60 }) => {
  return (
    <div style={{
      position: 'relative',
      width: `${radius * 2 + itemSize}px`,
      height: `${radius * 2 + itemSize}px`,
      margin: '50px auto'
    }}>
      {/* Círculo de referência (opcional) */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: `${radius * 2}px`,
        height: `${radius * 2}px`,
        border: '2px dashed #cbd5e0',
        borderRadius: '50%',
        pointerEvents: 'none'
      }} />

      {/* Items posicionados em círculo */}
      {items.map((item, i) => {
        const angle = (i / items.length) * 360;

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: `${itemSize}px`,
              height: `${itemSize}px`,
              transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-${radius}px)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '50%',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '14px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              transition: 'transform 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = `translate(-50%, -50%) rotate(${angle}deg) translateY(-${radius}px) scale(1.2)`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = `translate(-50%, -50%) rotate(${angle}deg) translateY(-${radius}px) scale(1)`;
            }}
          >
            {item}
          </div>
        );
      })}
    </div>
  );
};
