use anyhow::Result;
use clap::{Parser, Subcommand};
use cyfer_core::vault::{SecretBundle, Vault, default_vault_path};
use rpassword::prompt_password;

#[derive(Parser)]
#[command(name = "cyfer-cli")]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    Init,
    Add { service: String },
    Get { service: String },
    List,
    Del { service: String },
}

fn main() -> Result<()> {
    let cli = Cli::parse();
    let vault_path = default_vault_path()?;

    match cli.command {
        Commands::Init => {
            if vault_path.exists() {
                return Err(anyhow::anyhow!("Vault already initialized"));
            }
            let pass1 = prompt_password("Set master password: ")?;
            let pass2 = prompt_password("Confirm master password: ")?;
            if pass1 != pass2 {
                return Err(anyhow::anyhow!("Passwords do not match"));
            }
            Vault::init(&vault_path, &pass1)?;
            println!("Vault initialized at {}", vault_path.display());
        }
        Commands::List => {
            let pass1 = prompt_password("Enter master password: ")?;
            let vault = Vault::read(&vault_path)?;
            let services = vault.list_services(&pass1)?;
            for service in services {
                println!("{}", service);
            }
        }
        Commands::Add { service } => {
            let pass1 = prompt_password("Enter master password: ")?;
            let mut vault = Vault::read(&vault_path)?;
            let username = prompt_password("Enter username: ")?;
            let secret = prompt_password("Enter secret: ")?;
            let notes = prompt_password("Enter notes: ")?;
            let secret_bundle = SecretBundle {
                username,
                secret,
                notes: Some(notes),
            };
            vault.add_service(&vault_path, &pass1, &service, &secret_bundle)?;
            println!("Service added {}", service);
        }
        Commands::Get { service } => {
            let pass1 = prompt_password("Enter master password: ")?;
            let vault = Vault::read(&vault_path)?;
            let secret = vault.get_service(&pass1, &service)?;

            println!("{} , {}", secret.username, secret.secret);
            if let Some(notes) = secret.notes {
                println!("{}", notes);
            }
        }
        Commands::Del { service } => {
            let pass1 = prompt_password("Enter master password: ")?;
            let mut vault = Vault::read(&vault_path)?;
            vault.delete_service(&vault_path, &pass1, &service)?;
            println!("Service deleted {}", service);
        }
    }
    Ok(())
}
