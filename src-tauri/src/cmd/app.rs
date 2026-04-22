use crate::error::AppResult;

#[tauri::command]
pub fn quit_application(app: tauri::AppHandle) -> AppResult<()> {
    crate::app::quit_application(&app);
    Ok(())
}
