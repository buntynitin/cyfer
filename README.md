# Cyfer - Secure Password Manager

[![Rust](https://img.shields.io/badge/Rust-000000?style=for-the-badge&logo=rust&logoColor=white)](https://www.rust-lang.org/)
[![Tauri](https://img.shields.io/badge/Tauri-FFC131?style=for-the-badge&logo=tauri&logoColor=black)](https://tauri.app/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)

A secure, cross-platform password manager built with Rust and Tauri, featuring military-grade encryption and a modern user interface. No more searching passwords in notes app.


## 🎥 Demo
There's a prebuilt binary available on the releases page run it on MacOS

https://github.com/user-attachments/assets/7802e0b9-740a-457f-8676-a1da02c9a507

## 🔐 Security Features

### Encryption & Cryptography
- **AES-256-GCM**: Industry-standard symmetric encryption for all sensitive data
- **Argon2id**: Memory-hard key derivation function with configurable parameters
  - Memory cost: 19,456 KiB (19 MB)
  - Time cost: 2 iterations
  - Parallelism: 1 thread
- **Cryptographically Secure Random Numbers**: Uses OS-provided secure random number generator
- **Zeroization**: Automatic memory clearing of sensitive data after use

### Security Architecture
- **Master Password Protection**: Single master password encrypts entire vault
- **Salt Generation**: Unique 16-byte salt per vault for key derivation
- **Vault Verification**: Encrypted verification token prevents tampering
- **Secure File Operations**: Atomic writes with temporary files to prevent corruption
- **Memory Safety**: Rust's memory safety guarantees prevent common security vulnerabilities

### Data Protection
- **Local Storage Only**: No cloud storage or network transmission of sensitive data
- **Encrypted at Rest**: All passwords and metadata are encrypted before storage
- **Secure Deletion**: Sensitive data is zeroized from memory immediately after use
- **No Plaintext Logging**: Passwords are never logged or displayed in plaintext

### Security Parameters
The default KDF parameters provide a balance of security and performance:
- **Memory**: 19 MB (prevents GPU/ASIC attacks)
- **Time**: 2 iterations (configurable for higher security)
- **Parallelism**: 1 thread (prevents parallel attacks)

## 🏗️ Architecture

### Core Components

#### `cyfer-core` - Rust Library
- **Vault Management**: Secure storage and retrieval of encrypted secrets
- **Cryptographic Operations**: Key derivation, encryption, and decryption
- **Data Structures**: Encrypted records, secret bundles, and vault metadata

#### `cyfer-cli` - Command Line Interface
- **Interactive Commands**: Initialize, add, retrieve, list, and delete secrets
- **Secure Input**: Password prompts that don't echo to terminal
- **Vault Operations**: Full vault management from command line

#### `cyfer-app` - Desktop Application
- **Tauri Frontend**: Cross-platform desktop app with React UI
- **Modern Interface**: Clean, intuitive design for managing passwords
- **Native Performance**: Rust backend with web-based frontend

## 🚀 Getting Started

### Prerequisites
- Rust 1.70+ and Cargo
- Node.js 18+ and npm
- Tauri CLI (`cargo install tauri-cli`)

### Installation

#### From Source
```bash
# Clone the repository
git clone https://github.com/yourusername/cyfer-rust.git
cd cyfer-rust

# Build and run CLI
cd cyfer-cli
cargo build --release
./target/release/cyfer-cli init

# Build and run desktop app
cd ../cyfer-app
npm install
cargo tauri dev
```

#### Using Cargo
```bash
# Install CLI globally
cargo install --path ./cyfer-cli

# Use cyfer-cli commands
cyfer-cli init
cyfer-cli add github
cyfer-cli get github
```

### CLI Usage

```bash
# Initialize a new vault
cyfer-cli init

# Add a new service
cyfer-cli add github

# Retrieve a service
cyfer-cli get github

# List all services
cyfer-cli list

# Delete a service
cyfer-cli del github
```

## 📁 Project Structure

```
cyfer-rust/
├── cyfer-core/          # Core Rust library with crypto operations
├── cyfer-cli/           # Command-line interface
└── cyfer-app/           # Tauri desktop application
    ├── src/             # React frontend
    └── src-tauri/       # Tauri backend

```

## Vault Location
By default, vaults are stored in:
- **macOS**: `~/Library/Application Support/cyfer-rs/vault.json`
- **Linux**: `~/.local/share/cyfer-rs/vault.json`
- **Windows**: `%APPDATA%\cyfer-rs\vault.json`


## 🧪 Development

### Building
```bash

# Build CLI
cargo build -p cyfer-core

# Build Tauri App MacOS

## Install Cargo cli
rustup target add x86_64-apple-darwin aarch64-apple-darwin
cargo tauri build --target x86_64-apple-darwin
cargo tauri build --target aarch64-apple-darwin

## Path to executables inside the built .app bundles
lipo -create \
  "target/x86_64-apple-darwin/release/bundle/macos/cyfer-app.app/Contents/MacOS/cyfer-app" \
  "target/aarch64-apple-darwin/release/bundle/macos/cyfer-app.app/Contents/MacOS/cyfer-app" \
  -output "target/universal/release/cyfer-app"

## Copy this merged binary back into a clean .app bundle structure
cp -R target/x86_64-apple-darwin/release/bundle/macos/cyfer-app.app target/universal/release/
cp target/universal/release/cyfer-app target/universal/release/cyfer-app.app/Contents/MacOS/cyfer-app

## Get certificate(Developer ID Application)
security find-identity -v -p codesigning

## Sign the application
codesign --deep --force --options runtime \
  --sign "Developer ID Application: <FirstName LastName> (<TeamID>)" \
  target/universal/release/cyfer-app.app

## Verify
codesign --verify --deep --strict --verbose=2 target/universal/release/cyfer-app.app
spctl --assess --verbose=4 --type execute target/universal/release/cyfer-app.app

## Create .zip/.dmg
ditto -c -k --keepParent \
  target/universal/release/cyfer-app.app \
  cyfer-app.zip

hdiutil create -volname "Cyfer" \
  -srcfolder target/universal/release/cyfer-app.app \
  -ov -format UDZO cyfer-app.dmg

## Notarize the application
xcrun notarytool store-credentials "AC_PASSWORD" \
  --apple-id "your-apple-id@example.com" \
  --team-id "xxxxxxxxx" \
  --password "xxxx-xxxx-xxxx-xxxx"

xcrun notarytool submit target/universal/release/CyferApp.app \
  --keychain-profile "AC_PASSWORD" --wait

## Staple for 
xcrun stapler staple target/universal/release/CyferApp.app


```

```

### Code Quality
```bash
# Format code
cargo fmt

# Lint code
cargo clippy

# Check for security issues
cargo audit
```

## 📊 Performance

- **Vault Initialization**: ~100ms
- **Password Retrieval**: ~50ms
- **Memory Usage**: ~20MB for typical vaults
- **Storage**: Minimal overhead (~1KB per secret)

## 🔒 Security Considerations

### What this Protect Against
- **Brute Force Attacks**: Argon2id with high memory cost
- **Rainbow Table Attacks**: Unique salt per vault
- **Memory Dumps**: Automatic zeroization
- **File Corruption**: Atomic write operations
- **Timing Attacks**: Constant-time cryptographic operations

### Limitations
- **Master Password**: Single point of failure
- **Local Storage**: No automatic cloud backup
- **Memory**: Sensitive data briefly exists in memory during operations