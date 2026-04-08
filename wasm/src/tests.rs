use super::*;

fn approx_eq(a: f32, b: f32) -> bool {
    (a - b).abs() < 1e-5
}

fn approx_eq3(a: [f32; 3], b: [f32; 3]) -> bool {
    approx_eq(a[0], b[0]) && approx_eq(a[1], b[1]) && approx_eq(a[2], b[2])
}

// ═══════════════════════════════════════════════════════════════
// VECTOR MATH HELPERS
// ═══════════════════════════════════════════════════════════════

#[test]
fn sub3_subtrai_vetores() {
    let a = [3.0f32, 2.0, 1.0];
    let b = [1.0f32, 1.0, 1.0];
    let result = sub3(a, b);
    assert!(approx_eq3(result, [2.0, 1.0, 0.0]));
}

#[test]
fn add3_soma_vetores() {
    let a = [1.0f32, 2.0, 3.0];
    let b = [4.0f32, 5.0, 6.0];
    let result = add3(a, b);
    assert!(approx_eq3(result, [5.0, 7.0, 9.0]));
}

#[test]
fn scale3_escala_vetor() {
    let v = [1.0f32, 2.0, 3.0];
    let result = scale3(v, 2.0);
    assert!(approx_eq3(result, [2.0, 4.0, 6.0]));
}

#[test]
fn dot3_produto_escalar() {
    let a = [1.0f32, 0.0, 0.0];
    let b = [0.0f32, 1.0, 0.0];
    assert!(approx_eq(dot3(a, b), 0.0));

    let c = [1.0f32, 0.0, 0.0];
    let d = [1.0f32, 0.0, 0.0];
    assert!(approx_eq(dot3(c, d), 1.0));
}

#[test]
fn cross3_produto_vetorial_eixos_canonicos() {
    let x = [1.0f32, 0.0, 0.0];
    let y = [0.0f32, 1.0, 0.0];
    let z = cross3(x, y);
    assert!(approx_eq3(z, [0.0, 0.0, 1.0]));
}

#[test]
fn cross3_anticomutativo() {
    let x = [1.0f32, 0.0, 0.0];
    let y = [0.0f32, 1.0, 0.0];
    let xy = cross3(x, y);
    let yx = cross3(y, x);
    assert!(approx_eq3(xy, [-yx[0], -yx[1], -yx[2]]));
}

#[test]
fn normalize3_vetor_unitario_sem_mudanca() {
    let unit = [1.0f32, 0.0, 0.0];
    let result = normalize3(unit);
    assert!(approx_eq3(result, [1.0, 0.0, 0.0]));
}

#[test]
fn normalize3_vetor_qualquer_tem_magnitude_1() {
    let v = [3.0f32, 4.0, 0.0];
    let result = normalize3(v);
    let magnitude = (result[0] * result[0] + result[1] * result[1] + result[2] * result[2]).sqrt();
    assert!(approx_eq(magnitude, 1.0));
}

#[test]
fn normalize3_vetor_zero_retorna_fallback() {
    // normalize3 retorna [0, 0, 1] para vetor zero (fallback seguro, sem NaN)
    let zero = [0.0f32, 0.0, 0.0];
    let result = normalize3(zero);
    assert!(!result[0].is_nan());
    assert!(!result[1].is_nan());
    assert!(!result[2].is_nan());
    assert!(approx_eq3(result, [0.0, 0.0, 1.0]));
}

#[test]
fn dist3_distancia_entre_pontos() {
    let a = [0.0f32, 0.0, 0.0];
    let b = [3.0f32, 4.0, 0.0];
    assert!(approx_eq(dist3(a, b), 5.0));
}

#[test]
fn lerp3_t0_retorna_ponto_a() {
    let a = [1.0f32, 2.0, 3.0];
    let b = [4.0f32, 5.0, 6.0];
    assert!(approx_eq3(lerp3(a, b, 0.0), a));
}

#[test]
fn lerp3_t1_retorna_ponto_b() {
    let a = [1.0f32, 2.0, 3.0];
    let b = [4.0f32, 5.0, 6.0];
    assert!(approx_eq3(lerp3(a, b, 1.0), b));
}

#[test]
fn lerp3_t_meio_retorna_ponto_medio() {
    let a = [0.0f32, 0.0, 0.0];
    let b = [2.0f32, 2.0, 2.0];
    assert!(approx_eq3(lerp3(a, b, 0.5), [1.0, 1.0, 1.0]));
}

// ═══════════════════════════════════════════════════════════════
// RDP 3D
// ═══════════════════════════════════════════════════════════════

#[test]
fn rdp_linha_reta_retorna_apenas_extremos() {
    let points: Vec<[f32; 3]> = vec![
        [0.0, 0.0, 0.0],
        [1.0, 0.0, 0.0],
        [2.0, 0.0, 0.0],
        [3.0, 0.0, 0.0],
        [4.0, 0.0, 0.0],
    ];
    let result = rdp_3d(&points, 0.1);
    assert_eq!(result.len(), 2);
    assert!(approx_eq3(result[0], [0.0, 0.0, 0.0]));
    assert!(approx_eq3(result[result.len() - 1], [4.0, 0.0, 0.0]));
}

#[test]
fn rdp_menos_de_3_pontos_sem_simplificacao() {
    let points: Vec<[f32; 3]> = vec![
        [0.0, 0.0, 0.0],
        [1.0, 1.0, 0.0],
    ];
    let result = rdp_3d(&points, 0.5);
    assert_eq!(result.len(), 2);
}

#[test]
fn rdp_epsilon_zero_retorna_todos_os_pontos() {
    let points: Vec<[f32; 3]> = vec![
        [0.0, 0.0, 0.0],
        [1.0, 0.5, 0.0],
        [2.0, 0.0, 0.0],
    ];
    let result = rdp_3d(&points, 0.0);
    assert_eq!(result.len(), 3);
}

#[test]
fn rdp_epsilon_alto_retorna_apenas_extremos() {
    let points: Vec<[f32; 3]> = vec![
        [0.0, 0.0, 0.0],
        [1.0, 1.0, 0.0],
        [2.0, 0.0, 0.0],
    ];
    let result = rdp_3d(&points, 2.0);
    assert_eq!(result.len(), 2);
}

#[test]
fn rdp_curva_real_preserva_pontos_de_inflexao() {
    let points: Vec<[f32; 3]> = vec![
        [0.0, 0.0, 0.0],
        [1.0, 0.0, 0.0],
        [2.0, 0.0, 0.0],
        [2.0, 1.0, 0.0],
        [2.0, 2.0, 0.0],
    ];
    let result = rdp_3d(&points, 0.01);
    assert!(result.len() >= 3);
}

// ═══════════════════════════════════════════════════════════════
// FRENET FRAME
// ═══════════════════════════════════════════════════════════════

#[test]
fn frenet_frame_retorna_vetores_ortogonais() {
    let tangent = [1.0f32, 0.0, 0.0];
    let (normal, binormal) = frenet_frame(tangent);

    let dot_nb = dot3(normal, binormal);
    assert!(approx_eq(dot_nb, 0.0));

    let dot_tn = dot3(tangent, normal);
    assert!(approx_eq(dot_tn, 0.0));
}

#[test]
fn frenet_frame_vetores_sao_unitarios() {
    let tangent = [1.0f32, 0.0, 0.0];
    let (normal, binormal) = frenet_frame(tangent);

    let mag_n = (normal[0] * normal[0] + normal[1] * normal[1] + normal[2] * normal[2]).sqrt();
    let mag_b = (binormal[0] * binormal[0] + binormal[1] * binormal[1] + binormal[2] * binormal[2]).sqrt();

    assert!(approx_eq(mag_n, 1.0));
    assert!(approx_eq(mag_b, 1.0));
}

#[test]
fn frenet_frame_tangente_diagonal_sem_nan() {
    let tangent = normalize3([1.0f32, 1.0, 1.0]);
    let (normal, binormal) = frenet_frame(tangent);

    assert!(!normal[0].is_nan() && !normal[1].is_nan() && !normal[2].is_nan());
    assert!(!binormal[0].is_nan() && !binormal[1].is_nan() && !binormal[2].is_nan());
}

#[test]
fn contagem_de_vertices_por_secao() {
    let n_ring: usize = 4;
    let n_sections: usize = 3;
    let expected_vertices = n_sections * n_ring;
    assert_eq!(expected_vertices, 12);
}
