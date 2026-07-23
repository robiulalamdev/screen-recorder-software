use tauri::{Manager, WebviewUrl, WebviewWindowBuilder};

#[tauri::command]
fn create_overlay_window(app: tauri::AppHandle) -> Result<(), String> {
    // Create a fullscreen overlay window for area selection
    // Using dark background since transparent isn't available on WebviewWindowBuilder
    let overlay = WebviewWindowBuilder::new(
        &app,
        "overlay",
        WebviewUrl::App("index.html".into()),
    )
    .title("Screen Recorder - Selection")
    .decorations(false)
    .always_on_top(true)
    .skip_taskbar(true)
    .resizable(false)
    .fullscreen(true)
    .build()
    .map_err(|e| e.to_string())?;

    overlay.set_ignore_cursor_events(false).ok();

    Ok(())
}

#[tauri::command]
fn close_overlay_window(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(overlay) = app.get_webview_window("overlay") {
        overlay.close().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn create_toolbar_window(app: tauri::AppHandle) -> Result<(), String> {
    let _toolbar = WebviewWindowBuilder::new(
        &app,
        "toolbar",
        WebviewUrl::App("index.html".into()),
    )
    .title("Screen Recorder - Toolbar")
    .inner_size(650.0, 56.0)
    .decorations(false)
    .always_on_top(true)
    .skip_taskbar(true)
    .resizable(false)
    .position(635.0, 512.0)
    .build()
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
fn close_toolbar_window(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(toolbar) = app.get_webview_window("toolbar") {
        toolbar.close().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn minimize_main_window(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(main) = app.get_webview_window("main") {
        main.minimize().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn restore_main_window(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(main) = app.get_webview_window("main") {
        main.unminimize().map_err(|e| e.to_string())?;
        main.set_focus().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            create_overlay_window,
            close_overlay_window,
            create_toolbar_window,
            close_toolbar_window,
            minimize_main_window,
            restore_main_window,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}
