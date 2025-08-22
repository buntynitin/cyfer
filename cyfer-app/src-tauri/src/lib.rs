// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

use cyfer_core::vault::{SecretBundle, Vault};

#[tauri::command]
fn check_if_vault_exists() -> Result<bool, String> {
    let vault_path = cyfer_core::vault::default_vault_path().unwrap();
    return Ok(vault_path.exists());
}

#[tauri::command]
fn is_correct_password(master_password: &str) -> Result<bool, String> {
    let vault_path = cyfer_core::vault::default_vault_path().unwrap();
    let vault = Vault::read(&vault_path).unwrap();
    match vault.check_password(master_password) {
        Ok(_) => Ok(true),
        Err(e) => {
            println!("Error checking password: {}", e);
            Ok(false)
        }
    }
}

#[tauri::command]
fn create_vault(master_password: &str) -> Result<bool, String> {
    let vault_path = cyfer_core::vault::default_vault_path().unwrap();
    if vault_path.exists() {
        return Err("Vault already exists".to_string());
    }
    Vault::init(&vault_path, &master_password).unwrap();
    println!("Vault initialized at {}", vault_path.display());
    return Ok(true);
}

#[tauri::command]
fn list_services(master_password: &str) -> Result<Vec<String>, String> {
    let vault_path = cyfer_core::vault::default_vault_path().unwrap();
    let vault = Vault::read(&vault_path).unwrap();
    return Ok(vault.list_services(master_password).unwrap());
}

#[tauri::command]
fn get_service(master_password: &str, service: &str) -> Result<SecretBundle, String> {
    let vault_path = cyfer_core::vault::default_vault_path().unwrap();
    let vault = Vault::read(&vault_path).unwrap();
    return Ok(vault.get_service(master_password, service).unwrap());
}

#[tauri::command]
fn add_service(
    master_password: &str,
    service: &str,
    secret_bundle: SecretBundle,
) -> Result<bool, String> {
    let vault_path = cyfer_core::vault::default_vault_path().unwrap();
    let mut vault = Vault::read(&vault_path).unwrap();
    vault
        .add_service(&vault_path, master_password, service, &secret_bundle)
        .unwrap();
    return Ok(true);
}

#[tauri::command]
fn delete_service(master_password: &str, service: &str) -> Result<bool, String> {
    let vault_path = cyfer_core::vault::default_vault_path().unwrap();
    let mut vault = Vault::read(&vault_path).unwrap();
    vault
        .delete_service(&vault_path, master_password, service)
        .unwrap();
    return Ok(true);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            check_if_vault_exists,
            is_correct_password,
            create_vault,
            list_services,
            get_service,
            add_service,
            delete_service
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
