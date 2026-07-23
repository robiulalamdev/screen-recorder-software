use tauri::{Manager, WebviewUrl, WebviewWindowBuilder};

fn get_screen_info(app: &tauri::AppHandle) -> Result<((f64, f64), (f64, f64)), String> {
    let main_window = app.get_webview_window("main").ok_or("Main window not found")?;
    let monitor = main_window.primary_monitor().map_err(|e| e.to_string())?.ok_or("No monitor found")?;
    let size = monitor.size();
    let position = monitor.position();
    Ok((
        (size.width as f64, size.height as f64),
        (position.x as f64, position.y as f64),
    ))
}

#[tauri::command]
fn create_overlay_window(app: tauri::AppHandle) -> Result<(), String> {
    let ((w, h), (x, y)) = get_screen_info(&app)?;

    let overlay = WebviewWindowBuilder::new(
        &app,
        "overlay",
        WebviewUrl::App("index.html".into()),
    )
    .title("Screen Recorder - Selection")
    .inner_size(w, h)
    .position(x, y)
    .decorations(false)
    .always_on_top(true)
    .skip_taskbar(true)
    .resizable(false)
    .build()
    .map_err(|e| e.to_string())?;

    overlay.set_ignore_cursor_events(false).ok();
    overlay.set_focus().ok();

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
    let ((screen_w, screen_h), (_x, _y)) = get_screen_info(&app)?;
    let toolbar_width = 650.0;
    let toolbar_height = 56.0;
    let x = (screen_w - toolbar_width) / 2.0;
    let y = screen_h - toolbar_height - 80.0;

    let _toolbar = WebviewWindowBuilder::new(
        &app,
        "toolbar",
        WebviewUrl::App("index.html".into()),
    )
    .title("Screen Recorder - Toolbar")
    .inner_size(toolbar_width, toolbar_height)
    .position(x, y)
    .decorations(false)
    .always_on_top(true)
    .skip_taskbar(true)
    .resizable(false)
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
