#!/bin/bash
set -e

# Configuration
# Usage: ./scripts/deploy_wasm.sh <version_tag>
# Example: ./scripts/deploy_wasm.sh v1.0.0

VERSION="$1"
BUCKET_NAME="${R2_BUCKET}"
ENDPOINT_URL="${R2_ENDPOINT}"
MODEL_URL="${MODEL_URL}"

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

if [ -z "$VERSION" ]; then
    echo -e "${RED}Error: Version tag is required.${NC}"
    echo "Usage: $0 <version_tag>"
    exit 1
fi

if [ -z "$BUCKET_NAME" ]; then
    echo -e "${RED}Error: R2_BUCKET environment variable is not set.${NC}"
    exit 1
fi

echo -e "${GREEN}Deploying WASM version: $VERSION${NC}"

# 1. Download Model (if needed)
# Reuse the download script logic or call it
if [ ! -f "yolo-wasm/model/model.onnx" ]; then
    echo "Model not found locally. Downloading..."
    ./scripts/download_model.sh
fi

# 2. Build WASM
echo -e "${GREEN}Building WASM (SIMD)...${NC}"
cd yolo-wasm
export RUSTFLAGS="-C embed-bitcode=yes -C codegen-units=1 -C opt-level=3 -Ctarget-feature=+simd128 --cfg web_sys_unstable_apis --cfg getrandom_backend=\"wasm_js\""
wasm-pack build --release --out-dir pkg/simd --target web --no-typescript

echo -e "${GREEN}Building WASM (No SIMD)...${NC}"
export RUSTFLAGS="-C embed-bitcode=yes -C codegen-units=1 -C opt-level=3 --cfg web_sys_unstable_apis --cfg getrandom_backend=\"wasm_js\""
wasm-pack build --release --out-dir pkg/no_simd --target web --no-typescript
cd ..

# 3. Upload to R2
# Structure: s3://bucket/wasm/<version>/<variant>/...
echo -e "${GREEN}Uploading to R2...${NC}"

# Check if aws cli is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: 'aws' CLI is not installed. Please install it to upload.${NC}"
    exit 1
fi

# Upload SIMD
aws s3 sync yolo-wasm/pkg/simd "s3://$BUCKET_NAME/wasm/$VERSION/simd" \
    --endpoint-url "$ENDPOINT_URL" \
    --cache-control "public, max-age=31536000, immutable" \
    --metadata "Cross-Origin-Resource-Policy=cross-origin"

# Upload No SIMD
aws s3 sync yolo-wasm/pkg/no_simd "s3://$BUCKET_NAME/wasm/$VERSION/no_simd" \
    --endpoint-url "$ENDPOINT_URL" \
    --cache-control "public, max-age=31536000, immutable" \
    --metadata "Cross-Origin-Resource-Policy=cross-origin"

echo -e "${GREEN}Deployment Complete!${NC}"
echo "WASM files are available at:"
echo "  - /wasm/$VERSION/simd/"
echo "  - /wasm/$VERSION/no_simd/"
