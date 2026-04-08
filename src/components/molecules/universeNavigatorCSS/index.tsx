import React, { useEffect, useRef } from "react";

/**
 * Option A — Gizmo de navegação puramente CSS 3D.
 * Zero overhead de WebGL. Usa quaternion da câmera para construir matrix3d.
 *
 * Nota: CSS Y aponta para baixo; aplica-se scaleY(-1) no wrapper para alinhar
 * com o sistema Three.js (Y para cima). Os labels internos fazem o contra-flip.
 */
export default function UniverseNavigatorCSS({ mainCamera, isMobile, onClick }) {
  const cubeRef = useRef();
  const rafRef = useRef();

  useEffect(() => {
    if (!mainCamera) return;

    const update = () => {
      if (!cubeRef.current) {
        rafRef.current = requestAnimationFrame(update);
        return;
      }

      const { x, y, z, w } = mainCamera.quaternion;

      // Rotation matrix da câmera (row-major)
      const x2 = x * 2, y2 = y * 2, z2 = z * 2;
      const xx = x * x2, xy = x * y2, xz = x * z2;
      const yy = y * y2, yz = y * z2, zz = z * z2;
      const wx = w * x2, wy = w * y2, wz = w * z2;

      const m00 = 1 - (yy + zz);
      const m01 = xy - wz;
      const m02 = xz + wy;
      const m10 = xy + wz;
      const m11 = 1 - (xx + zz);
      const m12 = yz - wx;
      const m20 = xz - wy;
      const m21 = yz + wx;
      const m22 = 1 - (xx + yy);

      // CSS matrix3d: column-major + correção Y-flip (scaleY(-1) * R * scaleY(-1))
      // nega elementos onde Y está envolvido exatamente uma vez (m01, m10, m12, m21)
      cubeRef.current.style.transform = `matrix3d(
        ${m00},  ${-m10}, ${m20},  0,
        ${-m01}, ${m11},  ${-m21}, 0,
        ${m02},  ${-m12}, ${m22},  0,
        0,       0,       0,       1
      )`;

      rafRef.current = requestAnimationFrame(update);
    };

    rafRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rafRef.current);
  }, [mainCamera]);

  const sizePx = isMobile ? 80 : 96;
  const facePx = sizePx * 0.62;
  const half = facePx / 2;

  const faceBase = {
    position: "absolute",
    width: facePx,
    height: facePx,
    top: 0,
    left: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 10,
    fontWeight: 700,
    fontFamily: "monospace",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.18)",
    backfaceVisibility: "visible",
    opacity: 0.88,
    userSelect: "none",
  };

  // Label precisa fazer scaleY(-1) para compensar o flip do wrapper
  const label = (text, color = "#fff") => (
    <span style={{ transform: "scaleY(-1)", display: "block", color }}>{text}</span>
  );

  const faces = [
    { t: `translateZ(${half}px)`,                           bg: "rgba(68,153,255,0.65)",  content: label("Z+", "#aaddff") },
    { t: `rotateY(180deg) translateZ(${half}px)`,           bg: "rgba(0,40,120,0.55)",    content: label("Z−", "#6699cc") },
    { t: `rotateY(90deg) translateZ(${half}px)`,            bg: "rgba(255,68,68,0.65)",   content: label("X+", "#ffaaaa") },
    { t: `rotateY(-90deg) translateZ(${half}px)`,           bg: "rgba(120,0,0,0.55)",     content: label("X−", "#cc6666") },
    { t: `rotateX(-90deg) translateZ(${half}px)`,           bg: "rgba(68,238,68,0.65)",   content: label("Y+", "#aaffaa") },
    { t: `rotateX(90deg) translateZ(${half}px)`,            bg: "rgba(0,100,0,0.55)",     content: label("Y−", "#66cc66") },
  ];

  return (
    <div
      onClick={onClick}
      title="Clique para resetar a câmera"
      style={{
        width: sizePx,
        height: sizePx,
        position: "absolute",
        left: isMobile ? "27%" : "41%",
        top: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        perspective: "240px",
        // scaleY(-1) para alinhar Y com Three.js (Y up vs CSS Y down)
        transform: "scaleY(-1)",
      }}
    >
      <div
        ref={cubeRef}
        style={{
          width: facePx,
          height: facePx,
          position: "relative",
          transformStyle: "preserve-3d",
        }}
      >
        {faces.map(({ t, bg, content }, i) => (
          <div
            key={i}
            style={{
              ...faceBase,
              background: bg,
              transform: t,
            }}
          >
            {content}
          </div>
        ))}
      </div>
    </div>
  );
}
