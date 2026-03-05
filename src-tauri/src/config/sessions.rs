use super::{get_config_dir, load_json, save_json, uuid_v4};
use crate::crypto;
use crate::error::{AppError, AppResult};
use serde::{Deserialize, Serialize};
use tauri::AppHandle;

/// Saved SSH connection. Password is AES-256-GCM encrypted on disk.
/// Key-based auth references a managed key via `key_id`.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SavedConnection {
    #[serde(default = "uuid_v4")]
    pub id: String,
    pub name: String,
    #[serde(default)]
    pub group_id: Option<String>,
    #[serde(default)]
    pub description: Option<String>,
    pub host: String,
    pub port: u16,
    pub username: String,
    pub auth_type: String,

    /// Ciphertext on disk; plaintext in memory after `load_connection_by_id`.
    #[serde(default)]
    pub password: Option<String>,

    /// References a managed key in keys.json.
    #[serde(default)]
    pub key_id: Option<String>,

    #[serde(default)]
    pub sort_order: i32,

    /// Icon key referencing a named icon (e.g. "docker", "ubuntu"). Displayed in the connections list.
    #[serde(default)]
    pub icon: Option<String>,
}

/// Group for organizing saved connections in the UI.
/// Groups form a tree via `parent_id`; root groups have `parent_id = None`.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Group {
    #[serde(default = "uuid_v4")]
    pub id: String,
    pub name: String,
    #[serde(default)]
    pub parent_id: Option<String>,
    #[serde(default)]
    pub sort_order: i32,
}

/// Root config for groups and saved connections (sessions.json).
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct SessionsConfig {
    #[serde(default)]
    pub groups: Vec<Group>,
    pub connections: Vec<SavedConnection>,
}

/// Alias for the main app config (sessions + groups).
pub type AppConfig = SessionsConfig;

/// Decrypts `password` in-place (ciphertext → plaintext).
///
/// Called by `load_connection_by_id` before an SSH session is established.
pub fn decrypt_credentials(conn: &mut SavedConnection) {
    if let Some(ct) = conn.password.clone() {
        conn.password = crypto::decrypt(&ct).ok();
    }
}

pub fn load_sessions(app: &AppHandle) -> AppResult<SessionsConfig> {
    let dir = get_config_dir(app)?;
    let path = dir.join("sessions.json");
    load_json(&path)
}

/// Saves sessions config to disk (encrypted credentials are inline).
pub fn save_sessions(app: &AppHandle, config: &SessionsConfig) -> AppResult<()> {
    let dir = get_config_dir(app)?;
    save_json(&dir.join("sessions.json"), config)
}

/// Loads the main app config (sessions + groups).
pub fn load_config(app: &AppHandle) -> AppResult<AppConfig> {
    load_sessions(app)
}

/// Loads a single connection by ID and decrypts `password` for SSH auth.
///
/// Returns `AppError::SessionNotFound` if no connection with that ID exists.
pub fn load_connection_by_id(app: &AppHandle, id: &str) -> AppResult<SavedConnection> {
    let cfg = load_config(app)?;
    let mut conn = cfg
        .connections
        .into_iter()
        .find(|c| c.id == id)
        .ok_or_else(|| AppError::SessionNotFound(format!("Connection '{}' not found", id)))?;
    decrypt_credentials(&mut conn);
    Ok(conn)
}

/// Saves the main app config.
pub fn save_config(app: &AppHandle, config: &AppConfig) -> AppResult<()> {
    save_sessions(app, config)
}
