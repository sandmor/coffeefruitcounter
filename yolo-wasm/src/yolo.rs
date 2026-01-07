use alloc::vec;
use alloc::vec::Vec;
use burn::prelude::*;
use serde::{Deserialize, Serialize};

/// YOLO labels for coffee cherry maturity
pub const LABELS: [&str; 5] = ["dry", "overripe", "ripe", "semi_ripe", "unripe"];

/// YOLO input image size
pub const IMG_SIZE: usize = 640;
pub const CHANNELS: usize = 3;

/// Confidence threshold for detections
pub const CONF_THRESHOLD: f32 = 0.25;
/// NMS IoU threshold
pub const IOU_THRESHOLD: f32 = 0.45;

/// A single detection result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Detection {
    /// Bounding box [x_center, y_center, width, height] normalized to [0, 1]
    pub bbox: [f32; 4],
    /// Class index (0-4)
    pub class_id: usize,
    /// Class name
    pub class_name: alloc::string::String,
    /// Confidence score
    pub confidence: f32,
}

/// All detection results for an image
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DetectionResult {
    /// List of detections
    pub detections: Vec<Detection>,
    /// Counts per class
    pub counts: ClassCounts,
    /// Total count
    pub total: usize,
    /// Inference time in milliseconds
    pub inference_time_ms: f64,
}

/// Counts of each maturity class
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct ClassCounts {
    pub dry: usize,
    pub overripe: usize,
    pub ripe: usize,
    pub semi_ripe: usize,
    pub unripe: usize,
}

impl ClassCounts {
    pub fn increment(&mut self, class_id: usize) {
        match class_id {
            0 => self.dry += 1,
            1 => self.overripe += 1,
            2 => self.ripe += 1,
            3 => self.semi_ripe += 1,
            4 => self.unripe += 1,
            _ => {}
        }
    }
}

/// Preprocess image data for YOLO inference
/// Input: RGB values in [0, 255] as f32, shape [H, W, 3]
/// Output: Normalized tensor in [0, 1], shape [1, 3, IMG_SIZE, IMG_SIZE]
pub fn preprocess<B: Backend>(input: &[f32], device: &B::Device) -> Tensor<B, 4> {
    // The input should already be resized to IMG_SIZE x IMG_SIZE
    // Convert from [0, 255] to [0, 1] and reshape to [1, C, H, W]
    Tensor::<B, 1>::from_floats(input, device)
        .reshape([1, CHANNELS, IMG_SIZE, IMG_SIZE])
        .div_scalar(255.0)
}

/// Post-process YOLO output to get detections
/// YOLO v11 output shape: [1, 5 + num_classes, num_boxes] = [1, 9, 14400] for 640x640 input
pub fn postprocess(output: Vec<f32>, num_classes: usize) -> Vec<Detection> {
    // YOLOv11 output format: [1, 4 + num_classes, num_boxes]
    // Where each box has: x_center, y_center, width, height, class_scores...

    let num_features = 4 + num_classes; // 4 bbox coords + class scores
    let num_boxes = output.len() / num_features;

    let mut detections = Vec::new();

    for i in 0..num_boxes {
        // Extract bbox coordinates (normalized to 0-1 from model output / IMG_SIZE)
        let x_center = output[i] / IMG_SIZE as f32;
        let y_center = output[num_boxes + i] / IMG_SIZE as f32;
        let width = output[2 * num_boxes + i] / IMG_SIZE as f32;
        let height = output[3 * num_boxes + i] / IMG_SIZE as f32;

        // Find best class
        let mut best_class = 0;
        let mut best_score = output[4 * num_boxes + i];

        for c in 1..num_classes {
            let score = output[(4 + c) * num_boxes + i];
            if score > best_score {
                best_score = score;
                best_class = c;
            }
        }

        // Filter by confidence threshold
        if best_score >= CONF_THRESHOLD {
            detections.push(Detection {
                bbox: [x_center, y_center, width, height],
                class_id: best_class,
                class_name: alloc::string::String::from(LABELS[best_class]),
                confidence: best_score,
            });
        }
    }

    // Apply NMS
    nms(&mut detections, IOU_THRESHOLD);

    detections
}

/// Non-Maximum Suppression
fn nms(detections: &mut Vec<Detection>, iou_threshold: f32) {
    // Sort by confidence descending
    detections.sort_by(|a, b| b.confidence.partial_cmp(&a.confidence).unwrap());

    let mut keep = Vec::new();
    let mut suppressed = vec![false; detections.len()];

    for i in 0..detections.len() {
        if suppressed[i] {
            continue;
        }

        keep.push(detections[i].clone());

        for j in (i + 1)..detections.len() {
            if suppressed[j] {
                continue;
            }

            // Only suppress same class
            if detections[i].class_id == detections[j].class_id {
                let iou = calculate_iou(&detections[i].bbox, &detections[j].bbox);
                if iou > iou_threshold {
                    suppressed[j] = true;
                }
            }
        }
    }

    *detections = keep;
}

/// Calculate Intersection over Union for two bounding boxes
/// Boxes are in format [x_center, y_center, width, height]
fn calculate_iou(box1: &[f32; 4], box2: &[f32; 4]) -> f32 {
    // Convert to corner format
    let x1_min = box1[0] - box1[2] / 2.0;
    let y1_min = box1[1] - box1[3] / 2.0;
    let x1_max = box1[0] + box1[2] / 2.0;
    let y1_max = box1[1] + box1[3] / 2.0;

    let x2_min = box2[0] - box2[2] / 2.0;
    let y2_min = box2[1] - box2[3] / 2.0;
    let x2_max = box2[0] + box2[2] / 2.0;
    let y2_max = box2[1] + box2[3] / 2.0;

    // Calculate intersection
    let inter_x_min = x1_min.max(x2_min);
    let inter_y_min = y1_min.max(y2_min);
    let inter_x_max = x1_max.min(x2_max);
    let inter_y_max = y1_max.min(y2_max);

    let inter_width = (inter_x_max - inter_x_min).max(0.0);
    let inter_height = (inter_y_max - inter_y_min).max(0.0);
    let inter_area = inter_width * inter_height;

    // Calculate union
    let area1 = box1[2] * box1[3];
    let area2 = box2[2] * box2[3];
    let union_area = area1 + area2 - inter_area;

    if union_area > 0.0 {
        inter_area / union_area
    } else {
        0.0
    }
}

/// Create detection result from detections
pub fn create_result(detections: Vec<Detection>, inference_time_ms: f64) -> DetectionResult {
    let mut counts = ClassCounts::default();

    for det in &detections {
        counts.increment(det.class_id);
    }

    let total = detections.len();

    DetectionResult {
        detections,
        counts,
        total,
        inference_time_ms,
    }
}
