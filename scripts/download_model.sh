#!/bin/bash
set -e

# Placeholder for the model URL. Set this in your environment or CI variables.
# Example: https://pub-xxxxxxxx.r2.dev/models/yolo-v8.onnx
MODEL_URL="${MODEL_URL:-}"
TARGET_DIR="yolo-wasm/model"
TARGET_FILE="$TARGET_DIR/model.onnx"

if [ -z "$MODEL_URL" ]; then
    echo "Error: MODEL_URL environment variable is not set."
    echo "Please set MODEL_URL to the direct link of your ONNX model."
    exit 1
fi

echo "Downloading model from $MODEL_URL..."
mkdir -p "$TARGET_DIR"

# Use curl to download the file
curl -L -o "$TARGET_FILE" "$MODEL_URL"

echo "Model downloaded successfully to $TARGET_FILE"
