# Coffee Cherry Counter

AI-powered coffee cherry detection and maturity classification using YOLOv11 and WebAssembly.

## Features

- 🎯 **Real-time Detection**: Detect and count coffee cherries in images
- 🏷️ **Maturity Classification**: Classify cherries into 5 maturity stages:
  - 🔴 Ripe - Ready for harvest
  - 🟠 Semi-ripe - Almost ready
  - 🟢 Unripe - Needs more time
  - 🟣 Overripe - Past optimal
  - 🟤 Dry - Dried on tree
- 📊 **Statistics & History**: Track your analysis.
- ⚡ **WebGPU Acceleration**: GPU-accelerated inference.
- 📦 **Zero-Bundle WASM**: Model and runtime are loaded from a global CDN.

## Tech Stack

- **Frontend**: Next.js 16, React 19, TailwindCSS 4, shadcn/ui
- **ML Runtime**: [Burn](https://burn.dev) - Rust ML framework
- **Deployment**: Vercel (Frontend), Cloudflare R2 (WASM/Model)

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- AWS CLI (for deploying WASM)
- Rust (only if you need to modify the WASM module)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/coffeefruitcounter.git
   cd coffeefruitcounter
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Configure Environment:
   Create a `.env.local` file:
   ```bash
   NEXT_PUBLIC_WASM_BASE_URL=https://your-r2-domain.com
   NEXT_PUBLIC_WASM_VERSION=v1.0.0
   ```

4. Start the development server:
   ```bash
   pnpm dev
   ```

## Deploying the Model (WASM)

The WASM module and model weights are hosted on Cloudflare R2 to keep the frontend bundle light and build times fast.

### 1. R2 Configuration

You need a Cloudflare R2 bucket and an API Token with **Object Read & Write** permissions.

1. Create a bucket (e.g., `coffee-fruit-counter`).
2. Go to **R2 > Manage R2 API Tokens > Create API Token**.
3. Select **Object Read & Write**.
4. Copy the `Access Key ID`, `Secret Access Key`, and the `S3 API Endpoint`.

### 2. Configure Environment

Export the following environment variables. The script uses the `aws` CLI, which requires the standard AWS credentials to be set.

```bash
# AWS CLI Credentials for R2
export AWS_ACCESS_KEY_ID="<YOUR_ACCESS_KEY_ID>"
export AWS_SECRET_ACCESS_KEY="<YOUR_SECRET_ACCESS_KEY>"
export AWS_DEFAULT_REGION="auto"

# Script Configuration
export R2_BUCKET="<YOUR_BUCKET_NAME>"
export R2_ENDPOINT="https://<ACCOUNT_ID>.r2.cloudflarestorage.com"
export MODEL_URL="<URL_TO_DOWNLOAD_MODEL_ONNX>"
```

### 3. Run the Deploy Script

Run the script with a version tag (e.g., `v1.0.0`). This tag matches the version you will set in the frontend app.

```bash
./scripts/deploy_wasm.sh v1.0.0
```

This will:
- Download the model from `MODEL_URL` (if not found locally).
- Build the Rust/WASM binaries (SIMD + No-SIMD).
- Upload the artifacts to `s3://<bucket>/wasm/v1.0.0/`.

### 4. Update Frontend

Update `NEXT_PUBLIC_WASM_VERSION` in your `.env.local` or Vercel project settings to match the deployed version.

```bash
NEXT_PUBLIC_WASM_BASE_URL=https://<YOUR_R2_PUBLIC_DOMAIN>
NEXT_PUBLIC_WASM_VERSION=v1.0.0
```

## Project Structure

```
coffeefruitcounter/
├── app/                    # Next.js app
├── components/            # React components
├── lib/
│   ├── wasm-loader.ts    # Dynamic remote WASM loader
│   └── wasm-types.d.ts   # Ambient types for WASM
├── scripts/
│   └── deploy_wasm.sh    # WASM build & deploy script
├── yolo-wasm/            # Rust source code
└── ...
```

## License

MIT