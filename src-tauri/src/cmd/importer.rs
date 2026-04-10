use crate::error::AppResult;

#[tauri::command]
pub fn import_sessions(app: tauri::AppHandle, file_path: String) -> AppResult<usize> {
    crate::core::importer::import_sessions(app, file_path)
}
