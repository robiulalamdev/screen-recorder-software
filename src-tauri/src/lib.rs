use tauri::{
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, WebviewUrl, WebviewWindowBuilder,
};

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
fn capture_screenshot() -> Result<String, String> {
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        use std::fs;

        // Create temp file path
        let temp_dir = std::env::temp_dir();
        let temp_path = temp_dir.join("screen_recorder_screenshot.png");

        // Capture screenshot using screencapture command
        let output = Command::new("screencapture")
            .args(["-x", "-t", "png", temp_path.to_str().unwrap()])
            .output()
            .map_err(|e| format!("Failed to run screencapture: {}", e))?;

        if !output.status.success() {
            return Err(format!("screencapture failed: {}", String::from_utf8_lossy(&output.stderr)));
        }

        // Read the file
        let png_data = fs::read(&temp_path)
            .map_err(|e| format!("Failed to read screenshot: {}", e))?;

        // Clean up
        let _ = fs::remove_file(&temp_path);

        // Encode to base64
        use base64::Engine;
        let encoded = base64::engine::general_purpose::STANDARD.encode(&png_data);

        return Ok(format!("data:image/png;base64,{}", encoded));
    }

    #[cfg(not(target_os = "macos"))]
    Err("Screenshot not supported on this platform yet".into())
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
    let y = screen_h - toolbar_height - 100.0;

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
        .setup(|app| {
            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .tooltip("Screen Recorder")
                .on_tray_icon_event(|tray_icon, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray_icon.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.unminimize();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            capture_screenshot,
            create_overlay_window,
            close_overlay_window,
            create_toolbar_window,
            close_toolbar_window,
            minimize_main_window,
            restore_main_window,
        ])
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                if window.label() == "main" {
                    api.prevent_close();
                    let _ = window.minimize();
                    let _ = window.hide();
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}
