use aes_gcm::{aead::{Aead, KeyInit}, Aes256Gcm, Key, Nonce};
use anyhow::{anyhow, Result};
use argon2::{Argon2, Params, Algorithm, Version};
use base64::{engine::general_purpose, Engine as _};
use rand::{rngs::OsRng, RngCore};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};
use zeroize::Zeroize;

/// KDF parameters
#[derive(Debug, Serialize, Deserialize, Clone, Copy)]
pub struct KdfParams {
    pub m_cost_kib: u32,
    pub t_cost: u32,
    pub p_cost: u32,
}

/// Encrypted record
#[derive(Debug, Serialize, Deserialize)]
pub struct EncRecord {
    pub nonce_b64: String,
    pub ct_b64: String,
}

/// Secret bundle
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SecretBundle {
    pub username: String,
    pub secret: String,
    pub notes: Option<String>,
}

/// Vault struct
#[derive(Debug, Serialize, Deserialize)]
pub struct Vault {
    pub salt_b64: String,
    pub kdf: KdfParams,
    pub secrets: HashMap<String, EncRecord>,
    pub verifier: EncRecord,
}

/// Default vault path
pub fn default_vault_path() -> Result<PathBuf> {
    let base = dirs::data_dir().ok_or_else(|| anyhow!("Could not resolve data directory"))?;
    let dir = base.join("cyfer-rs");
    fs::create_dir_all(&dir)?;
    Ok(dir.join("vault.json"))
}


/// Vault operations
impl Vault {
    pub fn read(path: &Path) -> Result<Self> {
        let data = fs::read(path)?;
        let v: Vault = serde_json::from_slice(&data)?;
        Ok(v)
    }

    pub fn write(&self, path: &Path) -> Result<()> {
        let data = serde_json::to_vec_pretty(self)?;
        let tmp = path.with_extension("json.tmp");
        {
            let mut f = fs::File::create(&tmp)?;
            f.write_all(&data)?;
            f.sync_all()?;
        }
        fs::rename(tmp, path)?;
        Ok(())
    }

    pub fn init(path: &Path, master_password: &str) -> Result<Self> {
        if path.exists() {
            return Err(anyhow!("Vault already exists at {}", path.display()));
        }

        let kdf = KdfParams { m_cost_kib: 19456, t_cost: 2, p_cost: 1 };
        let mut salt_bytes = [0u8; 16];
        OsRng.fill_bytes(&mut salt_bytes);
        let salt_b64 = general_purpose::STANDARD.encode(&salt_bytes);

        let key = derive_key(master_password, &salt_bytes, kdf)?;
        let (nonce_b64, ct_b64) = encrypt(&key, b"vault-check")?;

        let vault = Vault { salt_b64, kdf, secrets: HashMap::new(), verifier: EncRecord { nonce_b64, ct_b64 } };

        vault.write(path)?;

        zeroize_bytes(&mut salt_bytes);
        drop_key(key);

        Ok(vault)
    }

    pub fn list_services(&self, master_password: &str) -> Result<Vec<String>> {
        self.check_password(master_password)?;
        if self.secrets.is_empty() {
            return Ok(vec![]);
        } else {
            return Ok(self.secrets.keys().cloned().collect());
        }
    }

    pub fn get_service(&self, master_password: &str, service: &str) -> Result<SecretBundle> {
        self.check_password(master_password)?;
        let enc = self
            .secrets
            .get(service)
            .ok_or_else(|| anyhow!("No such service: {}", service))?;
    
        let salt = decode_b64(&self.salt_b64)?;
        let key = derive_key(&master_password, &salt, self.kdf)?;
    
        let nonce = decode_b64(&enc.nonce_b64)?;
        let ct = decode_b64(&enc.ct_b64)?;
    
        let plaintext = decrypt(&key, &nonce, &ct)?;
        let bundle: SecretBundle = serde_json::from_slice(&plaintext)?;
        drop_key(key);
        zeroize_vec(plaintext);

        Ok(bundle)
    }

    pub fn add_service(&mut self, path: &Path, master_password: &str, service: &str, secret_bundle: &SecretBundle) -> Result<()> {
        self.check_password(master_password)?;
    
        let salt = decode_b64(&self.salt_b64)?;
        let key = derive_key(&master_password, &salt, self.kdf)?;
    
        let ct = decode_b64(&self.verifier.ct_b64)?;
        let nonce = decode_b64(&self.verifier.nonce_b64)?;
        let check = decrypt(&key, &nonce, &ct)?;
        if check != b"vault-check" {
            return Err(anyhow!("Incorrect master password"));
        }
    
        let plaintext = serde_json::to_vec(&secret_bundle)?;
    
        // Encrypt
        let (nonce_b64, ct_b64) = encrypt(&key, &plaintext)?;
    
        self.secrets.insert(
            service.to_string(),
            EncRecord { nonce_b64, ct_b64 },
        );
        self.write(path)?;
        drop_key(key);
        zeroize_vec(plaintext);
    
        Ok(())
    }

    pub fn delete_service(&mut self, path: &Path, master_password: &str, service: &str) -> Result<()> {
        self.check_password(master_password)?;
        if self.secrets.remove(service).is_some() {
            self.write(path)?;
            Ok(())
        } else {
            Err(anyhow!("No such service: {}", service))
        }
    }

    pub fn derive_key(&self, master_password: &str) -> Result<[u8; 32]> {
        let salt = decode_b64(&self.salt_b64)?;
        derive_key(master_password, &salt, self.kdf)
    }

    pub fn verify_master(&self, key: &[u8; 32]) -> Result<()> {
        let nonce = decode_b64(&self.verifier.nonce_b64)?;
        let ct = decode_b64(&self.verifier.ct_b64)?;
        let check = decrypt(key, &nonce, &ct)?;
        if check != b"vault-check" { Err(anyhow!("Incorrect master password")) } else { Ok(()) }
    }

    pub fn check_password(&self, master_password: &str) -> Result<()> {
        let key = self.derive_key(master_password)?;
        self.verify_master(&key)
    }

}

/// Crypto helper functions
pub fn derive_key(master_password: &str, salt: &[u8], kdf: KdfParams) -> anyhow::Result<[u8; 32]> {
    let params = Params::new(kdf.m_cost_kib, kdf.t_cost, kdf.p_cost, Some(32))
        .map_err(|e| anyhow::anyhow!("Invalid Argon2 params: {}", e))?;
    
    let argon2 = Argon2::new(Algorithm::Argon2id, Version::V0x13, params);
    let mut key = [0u8; 32];

    argon2
        .hash_password_into(master_password.as_bytes(), salt, &mut key)
        .map_err(|e| anyhow::anyhow!("Argon2 failed: {}", e))?;

    Ok(key)
}

pub fn encrypt(key: &[u8; 32], plaintext: &[u8]) -> Result<(String, String)> {
    let cipher = Aes256Gcm::new(Key::<Aes256Gcm>::from_slice(key));
    let mut nonce_bytes = [0u8; 12];
    OsRng.fill_bytes(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);
    let ciphertext = cipher
        .encrypt(nonce, plaintext)
        .map_err(|_| anyhow::anyhow!("Encryption failed"))?;
    Ok((
        general_purpose::STANDARD.encode(&nonce_bytes),
        general_purpose::STANDARD.encode(&ciphertext),
    ))
}

pub fn decrypt(key: &[u8; 32], nonce: &[u8], ct: &[u8]) -> anyhow::Result<Vec<u8>> {
    let cipher = Aes256Gcm::new(Key::<Aes256Gcm>::from_slice(key));
    let nonce = Nonce::from_slice(nonce);

    cipher
        .decrypt(nonce, ct)
        .map_err(|_| anyhow::anyhow!("Decryption failed (wrong password or corrupted vault)"))
}

pub fn decode_b64(s: &str) -> Result<Vec<u8>> {
    Ok(general_purpose::STANDARD.decode(s)?)
}

pub fn zeroize_bytes(bytes: &mut [u8]) { bytes.zeroize(); }
pub fn zeroize_vec(mut v: Vec<u8>) { v.zeroize(); }
pub fn drop_key(mut k: [u8; 32]) { k.zeroize(); }