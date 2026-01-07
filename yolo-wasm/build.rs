/// This build script generates the model code from the ONNX file.
use burn_import::onnx::ModelGen;

const INPUT_ONNX_FILE: &str = "model/model.onnx";
const OUT_DIR: &str = "model/";

fn main() {
    // Re-run the build script if model files change.
    println!("cargo:rerun-if-changed=model");

    // Generate the model code from the ONNX file.
    // Model weights are embedded in the binary for WebAssembly compatibility.
    ModelGen::new()
        .input(INPUT_ONNX_FILE)
        .out_dir(OUT_DIR)
        .embed_states(true)
        .run_from_script();
}
