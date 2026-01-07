#![allow(clippy::new_without_default)]

use alloc::vec::Vec;

use crate::model::Model as YoloModel;
use crate::yolo::{self, CHANNELS, IMG_SIZE};

use burn::{
    backend::{NdArray, wgpu::init_setup_async},
    prelude::*,
};

use burn::backend::wgpu::{WebGpu, WgpuDevice, graphics::AutoGraphicsApi};

use serde::Serialize;
use wasm_bindgen::prelude::*;
use web_time::Instant;

#[wasm_bindgen(start)]
pub fn start() {
    // Initialize the logger so that the logs are printed to the console
    console_error_panic_hook::set_once();
    wasm_logger::init(wasm_logger::Config::default());
}

#[allow(clippy::large_enum_variant)]
/// The model is loaded to a specific backend
pub enum ModelType {
    /// The model is loaded to the NdArray backend
    WithNdArrayBackend(Model<NdArray<f32>>),

    /// The model is loaded to the WebGpu backend
    WithWgpuBackend(Model<WebGpu<f32, i32>>),
}

/// YOLO Coffee Cherry Detector
#[wasm_bindgen]
pub struct CoffeeCherryDetector {
    model: Option<ModelType>,
}

#[wasm_bindgen]
impl CoffeeCherryDetector {
    /// Constructor called by JavaScript with the new keyword.
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        log::info!("Initializing the Coffee Cherry Detector");
        Self { model: None }
    }

    /// Check if model is loaded
    pub fn is_ready(&self) -> bool {
        self.model.is_some()
    }

    /// Runs inference on the image
    /// Input should be RGB values in [0, 255] as f32, length = IMG_SIZE * IMG_SIZE * 3
    pub async fn inference(&self, input: &[f32]) -> Result<JsValue, JsValue> {
        if self.model.is_none() {
            return Err(JsValue::from_str(
                "Model not loaded. Please set a backend first.",
            ));
        }

        log::info!("Running inference on the image");

        let start = Instant::now();

        let result = match self.model.as_ref().unwrap() {
            ModelType::WithNdArrayBackend(model) => model.forward(input).await,
            ModelType::WithWgpuBackend(model) => model.forward(input).await,
        };

        let duration = start.elapsed();
        let inference_time_ms = duration.as_secs_f64() * 1000.0;

        log::debug!("Inference is completed in {duration:?}");

        // Post-process to get detections
        let detections = yolo::postprocess(result, 5); // 5 classes
        let result = yolo::create_result(detections, inference_time_ms);

        Ok(serde_wasm_bindgen::to_value(&result)?)
    }

    /// Sets the backend to NdArray (CPU)
    pub async fn set_backend_ndarray(&mut self) -> Result<(), JsValue> {
        log::info!("Loading the model to the NdArray backend");
        let start = Instant::now();
        let device = Default::default();
        self.model = Some(ModelType::WithNdArrayBackend(Model::new(&device)));
        let duration = start.elapsed();
        log::debug!("Model is loaded to the NdArray backend in {duration:?}");
        Ok(())
    }

    /// Sets the backend to Wgpu (GPU)
    pub async fn set_backend_wgpu(&mut self) -> Result<(), JsValue> {
        log::info!("Loading the model to the Wgpu backend");
        let start = Instant::now();
        let device = WgpuDevice::default();
        init_setup_async::<AutoGraphicsApi>(&device, Default::default()).await;
        self.model = Some(ModelType::WithWgpuBackend(Model::new(&device)));
        let duration = start.elapsed();
        log::debug!("Model is loaded to the Wgpu backend in {duration:?}");

        // Warm up the model
        log::debug!("Warming up the model");
        let start = Instant::now();
        let _ = self.inference(&[0.0; IMG_SIZE * IMG_SIZE * CHANNELS]).await;
        let duration = start.elapsed();
        log::debug!("Warming up is completed in {duration:?}");
        Ok(())
    }

    /// Get image size requirement
    pub fn get_img_size(&self) -> usize {
        IMG_SIZE
    }

    /// Get class labels
    pub fn get_labels(&self) -> JsValue {
        serde_wasm_bindgen::to_value(&yolo::LABELS).unwrap()
    }
}

/// The YOLO model wrapper
pub struct Model<B: Backend> {
    model: YoloModel<B>,
}

impl<B: Backend> Model<B> {
    /// Constructor
    pub fn new(device: &B::Device) -> Self {
        Self {
            model: YoloModel::from_embedded(device),
        }
    }

    /// Run inference on the input image
    pub async fn forward(&self, input: &[f32]) -> Vec<f32> {
        // Preprocess the input
        let input = yolo::preprocess::<B>(input, &B::Device::default());

        // Run the tensor input through the model
        let output = self.model.forward(input);

        // Get the output data
        output
            .into_data_async()
            .await
            .unwrap()
            .convert::<f32>()
            .to_vec()
            .unwrap()
    }
}

/// Information about available backends
#[wasm_bindgen]
#[derive(Serialize)]
pub struct BackendInfo {
    pub webgpu_available: bool,
}

#[wasm_bindgen]
impl BackendInfo {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            webgpu_available: true, // Will be checked on JS side
        }
    }
}
