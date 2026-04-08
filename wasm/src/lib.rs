use std::slice;

const MAX_POINTS: usize = 4000;
const OUTPUT_OFFSET: usize = MAX_POINTS * 3;

static mut MEM: [f32; MAX_POINTS * 6] = [0.0; MAX_POINTS * 6];

#[no_mangle]
pub unsafe extern "C" fn input_ptr() -> *mut f32 {
    MEM.as_mut_ptr()
}

#[no_mangle]
pub unsafe extern "C" fn output_ptr() -> *const f32 {
    MEM.as_ptr().add(OUTPUT_OFFSET)
}

/// Processa `point_count` pontos brutos e escreve partículas no output.
/// Retorna o número de partículas geradas (cada uma = 3 floats: x, y, z).
#[no_mangle]
pub unsafe extern "C" fn optimize_trace(
    point_count: u32,
    epsilon: f32,
    radius: f32,
    n_ring: u32,
) -> u32 {
    let n = point_count as usize;
    let input = slice::from_raw_parts(MEM.as_ptr(), n * 3);

    let points: Vec<[f32; 3]> = (0..n)
        .map(|i| [input[i * 3], input[i * 3 + 1], input[i * 3 + 2]])
        .collect();

    let simplified = rdp_3d(&points, epsilon);

    let step = radius * 1.2;
    let mut output_idx = 0usize;
    let out = &mut MEM[OUTPUT_OFFSET..];

    for i in 0..simplified.len().saturating_sub(1) {
        let a = simplified[i];
        let b = simplified[i + 1];

        let seg_len = dist3(a, b);
        let n_sections = ((seg_len / step).ceil() as usize).max(1);

        let t_vec = normalize3(sub3(b, a));
        let (n_vec, b_vec) = frenet_frame(t_vec);

        for j in 0..n_sections {
            let t = j as f32 / n_sections as f32;
            let center = lerp3(a, b, t);

            for k in 0..n_ring as usize {
                let theta = 2.0 * std::f32::consts::PI * k as f32 / n_ring as f32;
                let cos_t = theta.cos();
                let sin_t = theta.sin();

                if output_idx + 2 >= out.len() {
                    return (output_idx / 3) as u32;
                }

                out[output_idx]     = center[0] + radius * (cos_t * n_vec[0] + sin_t * b_vec[0]);
                out[output_idx + 1] = center[1] + radius * (cos_t * n_vec[1] + sin_t * b_vec[1]);
                out[output_idx + 2] = center[2] + radius * (cos_t * n_vec[2] + sin_t * b_vec[2]);
                output_idx += 3;
            }
        }
    }

    (output_idx / 3) as u32
}

fn rdp_3d(points: &[[f32; 3]], epsilon: f32) -> Vec<[f32; 3]> {
    if points.len() <= 2 {
        return points.to_vec();
    }

    let first = points[0];
    let last = *points.last().unwrap();

    let (max_dist, max_idx) = points[1..points.len() - 1]
        .iter()
        .enumerate()
        .map(|(i, &p)| (point_to_segment_dist(p, first, last), i + 1))
        .fold((0.0f32, 0), |(md, mi), (d, i)| {
            if d > md { (d, i) } else { (md, mi) }
        });

    if max_dist > epsilon {
        let mut left = rdp_3d(&points[..=max_idx], epsilon);
        let right = rdp_3d(&points[max_idx..], epsilon);
        left.pop();
        left.extend_from_slice(&right);
        left
    } else {
        vec![first, last]
    }
}

fn point_to_segment_dist(p: [f32; 3], a: [f32; 3], b: [f32; 3]) -> f32 {
    let ap = sub3(p, a);
    let ab = sub3(b, a);
    let ab_len_sq = dot3(ab, ab);
    if ab_len_sq == 0.0 {
        return dist3(p, a);
    }
    let t = (dot3(ap, ab) / ab_len_sq).clamp(0.0, 1.0);
    let proj = add3(a, scale3(ab, t));
    dist3(p, proj)
}

fn frenet_frame(t: [f32; 3]) -> ([f32; 3], [f32; 3]) {
    let up = if t[1].abs() < 0.9 { [0.0, 1.0, 0.0] } else { [0.0, 0.0, 1.0] };
    let n = normalize3(cross3(t, up));
    let b = cross3(t, n);
    (n, b)
}

fn sub3(a: [f32; 3], b: [f32; 3]) -> [f32; 3]   { [a[0]-b[0], a[1]-b[1], a[2]-b[2]] }
fn add3(a: [f32; 3], b: [f32; 3]) -> [f32; 3]   { [a[0]+b[0], a[1]+b[1], a[2]+b[2]] }
fn scale3(a: [f32; 3], s: f32) -> [f32; 3]      { [a[0]*s, a[1]*s, a[2]*s] }
fn dot3(a: [f32; 3], b: [f32; 3]) -> f32        { a[0]*b[0] + a[1]*b[1] + a[2]*b[2] }
fn dist3(a: [f32; 3], b: [f32; 3]) -> f32       { sub3(a, b).iter().map(|x| x*x).sum::<f32>().sqrt() }
fn lerp3(a: [f32; 3], b: [f32; 3], t: f32) -> [f32; 3] { add3(scale3(a, 1.0-t), scale3(b, t)) }
fn cross3(a: [f32; 3], b: [f32; 3]) -> [f32; 3] {
    [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]]
}
fn normalize3(a: [f32; 3]) -> [f32; 3] {
    let len = dot3(a, a).sqrt();
    if len == 0.0 { [0.0, 0.0, 1.0] } else { scale3(a, 1.0 / len) }
}

#[cfg(test)]
mod tests;
