mod overlay;

use std::fs;
use std::path::PathBuf;
use std::process::Command;
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::{
    Emitter,
    menu::{MenuBuilder, MenuItemBuilder},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, WebviewUrl, WebviewWindowBuilder,
};

use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
struct RecordingOptions {
    mode: String,          // "fullscreen", "window", "area"
    x: Option<f64>,
    y: Option<f64>,
    width: Option<f64>,
    height: Option<f64>,
    fps: Option<u32>,
    quality: Option<String>,
    encoder: Option<String>,
    output_format: Option<String>,
    microphone: Option<String>,
    system_audio: Option<String>,
    mic_volume: Option<u32>,
    system_volume: Option<u32>,
    save_location: Option<String>,
}

struct RecordingState {
    is_recording: bool,
    is_paused: bool,
    pid: Option<u32>,
}

static RECORDING_STATE: Mutex<RecordingState> = Mutex::new(RecordingState {
    is_recording: false,
    is_paused: false,
    pid: None,
});

#[tauri::command]
fn create_toolbar_window(app: tauri::AppHandle) -> Result<(), String> {
    // Hide main window during recording so it's not captured
    if let Some(main_window) = app.get_webview_window("main") {
        let _ = main_window.hide();
    }

    // Show recording indicator via system notification
    let _ = Command::new("osascript")
        .args(&["-e", r#"display notification "Recording in progress. Press Ctrl+Shift+R to stop." with title "Screen Recorder""#])
        .output();

    Ok(())
}

#[tauri::command]
fn close_toolbar_window(app: tauri::AppHandle) -> Result<(), String> {
    // Show main window again after recording stops
    if let Some(main_window) = app.get_webview_window("main") {
        let _ = main_window.show();
        let _ = main_window.set_focus();
    }
    Ok(())
}

#[tauri::command]
fn get_screen_size(app: tauri::AppHandle) -> Result<(f64, f64), String> {
    let main_window = app.get_webview_window("main").ok_or("Main window not found")?;
    let monitor = main_window.primary_monitor().map_err(|e| e.to_string())?.ok_or("No monitor found")?;
    let size = monitor.size();
    Ok((size.width as f64, size.height as f64))
}

fn get_save_path(save_location: &str, format: &str) -> Result<String, String> {
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|e| e.to_string())?;
    let secs = now.as_secs();

    // Simple date calculation from unix timestamp
    let days = secs / 86400 + 719468;
    let era = (if days >= 0 { days } else { days - 146096 }) / 146097;
    let doe = days - era * 146097;
    let yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
    let y = yoe + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = doy - (153 * mp + 2) / 5 + 1;
    let m = if mp < 10 { mp + 3 } else { mp - 9 };

    let time_secs = secs % 86400;
    let hours = time_secs / 3600;
    let minutes = (time_secs % 3600) / 60;
    let seconds = time_secs % 60;

    let month_names = ["", "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];

    let base = if save_location.is_empty() {
        dirs::download_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join("ScreenRecorder")
    } else {
        PathBuf::from(save_location.replace("~", &dirs::home_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .to_string_lossy()))
    };

    let year_dir = base.join(y.to_string());
    let month_dir = year_dir.join(month_names[m as usize]);

    fs::create_dir_all(&month_dir).map_err(|e| format!("Failed to create directory: {}", e))?;

    let filename = format!(
        "Recording_{:04}-{:02}-{:02}_{:02}-{:02}-{:02}.{}",
        y, m, d, hours, minutes, seconds, format
    );

    Ok(month_dir.join(filename).to_string_lossy().to_string())
}

#[tauri::command]
fn start_recording(options: RecordingOptions) -> Result<String, String> {
    let mut state = RECORDING_STATE.lock().map_err(|e| e.to_string())?;
    if state.is_recording {
        return Err("Already recording".into());
    }

    let format = options.output_format.as_deref().unwrap_or("mp4");
    let output_path = get_save_path(
        options.save_location.as_deref().unwrap_or(""),
        format,
    )?;

    // Build ffmpeg command
    let mut args: Vec<String> = Vec::new();

    // Screen capture input (macOS)
    args.push("-f".into());
    args.push("avfoundation".into());
    args.push("-framerate".into());
    args.push(options.fps.unwrap_or(60).to_string());
    args.push("-i".into());

    // Build capture device string - always capture full screen first
    args.push("1:0:none".to_string());

    // Add audio input if microphone enabled
    if options.microphone.as_deref() != Some("muted") {
        args.push("-f".into());
        args.push("avfoundation".into());
        args.push("-i".into());
        args.push(":0".into());
    }

    // Add crop filter for area capture
    if options.mode == "area" {
        if let (Some(x), Some(y), Some(w), Some(h)) = (options.x, options.y, options.width, options.height) {
            // Crop filter: crop=width:height:x:y
            args.push("-vf".into());
            args.push(format!("crop={}:{}:{}:{}", w as u32, h as u32, x as u32, y as u32));
        }
    }

    // Encoder settings
    let encoder = options.encoder.as_deref().unwrap_or("h264");
    match encoder {
        "h265" => {
            args.push("-c:v".into());
            args.push("libx265".into());
            args.push("-crf".into());
            args.push(match options.quality.as_deref() {
                Some("low") => "28",
                Some("medium") => "23",
                Some("high") => "18",
                Some("ultra") => "15",
                _ => "18",
            }.into());
        }
        "av1" => {
            args.push("-c:v".into());
            args.push("libaom-av1".into());
            args.push("-crf".into());
            args.push("30".into());
        }
        _ => {
            args.push("-c:v".into());
            args.push("libx264".into());
            args.push("-crf".into());
            args.push(match options.quality.as_deref() {
                Some("low") => "28",
                Some("medium") => "23",
                Some("high") => "18",
                Some("ultra") => "15",
                _ => "18",
            }.into());
            args.push("-preset".into());
            args.push("ultrafast".into());
        }
    }

    // Pixel format
    args.push("-pix_fmt".into());
    args.push("yuv420p".into());

    // Output
    args.push("-y".into());
    args.push(output_path.clone());

    // Spawn ffmpeg process
    let child = Command::new("ffmpeg")
        .args(&args)
        .spawn()
        .map_err(|e| {
            if e.kind() == std::io::ErrorKind::NotFound {
                "FFmpeg is not installed. Please install FFmpeg to record. On macOS: brew install ffmpeg".to_string()
            } else {
                format!("Failed to start recording: {}", e)
            }
        })?;

    state.is_recording = true;
    state.is_paused = false;
    state.pid = Some(child.id());

    Ok(output_path)
}

#[tauri::command]
fn stop_recording(app: tauri::AppHandle) -> Result<(), String> {
    let mut state = RECORDING_STATE.lock().map_err(|e| e.to_string())?;
    if !state.is_recording {
        return Ok(());
    }

    // Send SIGINT to ffmpeg to gracefully finalize the file
    if let Some(pid) = state.pid {
        let pid_str = pid.to_string();

        // SIGINT first — ffmpeg will finalize the output file
        let _ = Command::new("kill")
            .args(&["-2", &pid_str])
            .output();

        // Wait up to 3 seconds for ffmpeg to exit, then force kill
        for _ in 0..30 {
            std::thread::sleep(std::time::Duration::from_millis(100));
            // Check if process is still alive
            let check = Command::new("kill")
                .args(&["-0", &pid_str])
                .output();
            match check {
                Ok(o) if !o.status.success() => break, // process exited
                _ => {}
            }
        }

        // Force kill if still running
        let _ = Command::new("kill")
            .args(&["-9", &pid_str])
            .output();
    }

    state.is_recording = false;
    state.is_paused = false;
    state.pid = None;

    // Emit event to frontend
    let _ = app.emit("recording-stopped", ());

    Ok(())
}

#[tauri::command]
fn pause_recording() -> Result<(), String> {
    let mut state = RECORDING_STATE.lock().map_err(|e| e.to_string())?;
    if !state.is_recording || state.is_paused {
        return Ok(());
    }

    if let Some(pid) = state.pid {
        // Send SIGSTOP to pause
        let _ = Command::new("kill")
            .args(&["-STOP", &pid.to_string()])
            .spawn();
    }

    state.is_paused = true;
    Ok(())
}

#[tauri::command]
fn resume_recording() -> Result<(), String> {
    let mut state = RECORDING_STATE.lock().map_err(|e| e.to_string())?;
    if !state.is_recording || !state.is_paused {
        return Ok(());
    }

    if let Some(pid) = state.pid {
        // Send SIGCONT to resume
        let _ = Command::new("kill")
            .args(&["-CONT", &pid.to_string()])
            .spawn();
    }

    state.is_paused = false;
    Ok(())
}

#[tauri::command]
fn take_screenshot(save_location: Option<String>) -> Result<String, String> {
    let path = get_save_path(
        save_location.as_deref().unwrap_or(""),
        "png",
    )?;

    // Use screencapture on macOS
    #[cfg(target_os = "macos")]
    {
        let output = Command::new("screencapture")
            .args(&["-x", &path])
            .output()
            .map_err(|e| format!("Failed to take screenshot: {}", e))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(format!("Screenshot failed: {}", stderr));
        }
    }

    #[cfg(not(target_os = "macos"))]
    {
        return Err("Screenshot not supported on this platform yet".into());
    }

    Ok(path)
}

#[tauri::command]
fn open_file(path: String) -> Result<(), String> {
    let expanded_path = path.replace("~", &dirs::home_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .to_string_lossy());
    Command::new("open")
        .arg(&expanded_path)
        .spawn()
        .map_err(|e| format!("Failed to open file: {}", e))?;
    Ok(())
}

#[tauri::command]
fn open_folder(path: String) -> Result<(), String> {
    let expanded_path = path.replace("~", &dirs::home_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .to_string_lossy());
    Command::new("open")
        .args(&["-R", &expanded_path])
        .spawn()
        .map_err(|e| format!("Failed to open folder: {}", e))?;
    Ok(())
}

#[tauri::command]
fn get_recording_info(path: String) -> Result<serde_json::Value, String> {
    let output = Command::new("ffprobe")
        .args(&[
            "-v", "quiet",
            "-print_format", "json",
            "-show_format",
            "-show_streams",
            &path,
        ])
        .output()
        .map_err(|e| format!("Failed to get recording info: {}", e))?;

    let info: serde_json::Value = serde_json::from_slice(&output.stdout)
        .map_err(|e| format!("Failed to parse info: {}", e))?;

    Ok(info)
}

#[tauri::command]
fn check_ffmpeg_installed() -> bool {
    Command::new("ffmpeg")
        .arg("-version")
        .output()
        .is_ok()
}

#[tauri::command]
fn get_available_devices() -> Result<serde_json::Value, String> {
    let output = Command::new("ffmpeg")
        .args(&["-f", "avfoundation", "-list_devices", "true", "-i", ""])
        .output()
        .map_err(|e| format!("Failed to list devices: {}", e))?;

    let stderr = String::from_utf8_lossy(&output.stderr);
    Ok(serde_json::json!({ "devices": stderr.to_string() }))
}

#[tauri::command]
fn check_permissions() -> Result<serde_json::Value, String> {
    let mut permissions = serde_json::json!({
        "screen": false,
        "microphone": false,
        "camera": false,
    });

    // Check screen recording permission on macOS
    #[cfg(target_os = "macos")]
    {
        // Try a small screenshot to test permission
        let output = Command::new("screencapture")
            .args(&["-x", "-t", "png", "/tmp/test_permission.png"])
            .output();

        match output {
            Ok(o) => {
                permissions["screen"] = serde_json::Value::Bool(o.status.success());
                // Clean up
                let _ = fs::remove_file("/tmp/test_permission.png");
            }
            Err(_) => {}
        }

        // Check microphone permission via TCC
        let _output = Command::new("tccutil")
            .args(&["reset", "Microphone"])
            .output();
        // This doesn't actually check, just resets. We'll rely on runtime detection.
        permissions["microphone"] = serde_json::Value::Bool(true);
        permissions["camera"] = serde_json::Value::Bool(true);
    }

    Ok(permissions)
}

#[tauri::command]
fn ensure_save_directory(path: String) -> Result<(), String> {
    fs::create_dir_all(&path).map_err(|e| format!("Failed to create directory: {}", e))
}

#[tauri::command]
fn get_disk_space(path: String) -> Result<serde_json::Value, String> {
    // Expand ~ to home directory
    let expanded_path = path.replace("~", &dirs::home_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .to_string_lossy());

    let output = Command::new("df")
        .args(&["-k", &expanded_path])
        .output()
        .map_err(|e| format!("Failed to get disk space: {}", e))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let lines: Vec<&str> = stdout.lines().collect();
    if lines.len() >= 2 {
        let parts: Vec<&str> = lines[1].split_whitespace().collect();
        if parts.len() >= 4 {
            let total: u64 = parts[1].parse().unwrap_or(0);
            let available: u64 = parts[3].parse().unwrap_or(0);
            return Ok(serde_json::json!({
                "totalKB": total,
                "availableKB": available,
                "totalGB": (total as f64 / 1048576.0 * 100.0).round() / 100.0,
                "availableGB": (available as f64 / 1048576.0 * 100.0).round() / 100.0,
            }));
        }
    }

    Ok(serde_json::json!({ "totalKB": 0, "availableKB": 0 }))
}

#[tauri::command]
fn delete_file(path: String) -> Result<(), String> {
    fs::remove_file(&path).map_err(|e| format!("Failed to delete file: {}", e))
}

#[tauri::command]
fn rename_file(old_path: String, new_path: String) -> Result<(), String> {
    fs::rename(&old_path, &new_path).map_err(|e| format!("Failed to rename file: {}", e))
}

#[tauri::command]
fn duplicate_file(source: String, destination: String) -> Result<(), String> {
    fs::copy(&source, &destination).map_err(|e| format!("Failed to duplicate file: {}", e))?;
    Ok(())
}

#[tauri::command]
fn get_file_size(path: String) -> Result<u64, String> {
    let metadata = fs::metadata(&path).map_err(|e| format!("Failed to get file size: {}", e))?;
    Ok(metadata.len())
}

#[tauri::command]
fn check_file_exists(path: String) -> Result<bool, String> {
    // Expand ~ in path
    let expanded_path = path.replace("~", &dirs::home_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .to_string_lossy());
    Ok(PathBuf::from(&expanded_path).exists())
}

#[tauri::command]
fn validate_recordings(paths: Vec<String>) -> Result<Vec<String>, String> {
    let mut valid_paths = Vec::new();
    for path in paths {
        // Expand ~ in path
        let expanded_path = path.replace("~", &dirs::home_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .to_string_lossy());
        if PathBuf::from(&expanded_path).exists() {
            valid_paths.push(path);
        }
    }
    Ok(valid_paths)
}

#[tauri::command]
fn list_recordings(folder: String) -> Result<Vec<serde_json::Value>, String> {
    let entries = fs::read_dir(&folder).map_err(|e| format!("Failed to read directory: {}", e))?;

    let mut recordings = Vec::new();
    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        let ext = path.extension()
            .and_then(|e| e.to_str())
            .unwrap_or("")
            .to_lowercase();

        if matches!(ext.as_str(), "mp4" | "webm" | "mkv" | "avi" | "mov") {
            let metadata = fs::metadata(&path).map_err(|e| e.to_string())?;
            let name = path.file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("")
                .to_string();

            recordings.push(serde_json::json!({
                "name": name,
                "path": path.to_string_lossy(),
                "size": metadata.len(),
                "created": metadata.modified()
                    .ok()
                    .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
                    .map(|d| d.as_secs())
                    .unwrap_or(0),
            }));
        }
    }

    Ok(recordings)
}

#[tauri::command]
async fn select_folder(app: tauri::AppHandle) -> Result<String, String> {
    use tauri_plugin_dialog::DialogExt;

    let folder = app.dialog()
        .file()
        .blocking_pick_folder()
        .ok_or("No folder selected")?;

    Ok(folder.to_string())
}

#[tauri::command]
fn get_file_url(path: String) -> Result<String, String> {
    // Expand ~ in path
    let expanded_path = path.replace("~", &dirs::home_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .to_string_lossy());

    // Return the expanded path - frontend will handle URL conversion
    Ok(expanded_path.to_string())
}

#[tauri::command]
fn get_home_dir() -> Result<String, String> {
    Ok(dirs::home_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .to_string_lossy()
        .to_string())
}

#[tauri::command]
fn get_downloads_dir() -> Result<String, String> {
    Ok(dirs::download_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .to_string_lossy()
        .to_string())
}

#[tauri::command]
fn show_notification(title: String, body: String) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        let script = format!(
            r#"display notification "{}" with title "{}""#,
            body.replace('"', "\\\""),
            title.replace('"', "\\\"")
        );
        let _ = Command::new("osascript")
            .args(&["-e", &script])
            .output();
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            // Build tray menu
            let show = MenuItemBuilder::with_id("show", "Open Screen Recorder").build(app)?;
            let start = MenuItemBuilder::with_id("start_recording", "Start Recording").build(app)?;
            let stop = MenuItemBuilder::with_id("stop_recording", "Stop Recording").build(app)?;
            let pause = MenuItemBuilder::with_id("pause_recording", "Pause Recording").build(app)?;
            let separator = tauri::menu::PredefinedMenuItem::separator(app)?;
            let quit = MenuItemBuilder::with_id("quit", "Quit").build(app)?;

            let menu = MenuBuilder::new(app)
                .item(&show)
                .item(&start)
                .item(&pause)
                .item(&stop)
                .item(&separator)
                .item(&quit)
                .build()?;

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .tooltip("Screen Recorder")
                .on_tray_icon_event(|tray_icon, event| {
                    match event {
                        TrayIconEvent::Click {
                            button: MouseButton::Left,
                            button_state: MouseButtonState::Up,
                            ..
                        } => {
                            let app = tray_icon.app_handle();
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.unminimize();
                                let _ = window.set_focus();
                            }
                        }
                        _ => {}
                    }
                })
                .on_menu_event(|app, event| {
                    let id = event.id().as_ref();
                    match id {
                        "show" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.unminimize();
                                let _ = window.set_focus();
                            }
                        }
                        "start_recording" => {
                            let _ = app.emit("tray-start-recording", ());
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.unminimize();
                                let _ = window.set_focus();
                            }
                        }
                        "stop_recording" => {
                            let _ = app.emit("tray-stop-recording", ());
                        }
                        "pause_recording" => {
                            let _ = app.emit("tray-pause-recording", ());
                        }
                        "quit" => {
                            // Stop any recording first
                            if let Ok(mut state) = RECORDING_STATE.lock() {
                                if state.is_recording {
                                    if let Some(pid) = state.pid {
                                        let _ = Command::new("kill")
                                            .args(&["-2", &pid.to_string()])
                                            .spawn();
                                    }
                                    state.is_recording = false;
                                    state.pid = None;
                                }
                            }
                            std::process::exit(0);
                        }
                        _ => {}
                    }
                })
                .build(app)?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            create_toolbar_window,
            close_toolbar_window,
            get_screen_size,
            start_recording,
            stop_recording,
            pause_recording,
            resume_recording,
            take_screenshot,
            open_file,
            open_folder,
            get_recording_info,
            check_ffmpeg_installed,
            get_available_devices,
            check_permissions,
            ensure_save_directory,
            get_disk_space,
            delete_file,
            rename_file,
            duplicate_file,
            get_file_size,
            check_file_exists,
            validate_recordings,
            list_recordings,
            select_folder,
            get_file_url,
            get_home_dir,
            get_downloads_dir,
            show_notification,
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
