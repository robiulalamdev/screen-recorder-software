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
    Manager, WebviewWindowBuilder,
};

use serde::{Deserialize, Serialize};

#[cfg(target_os = "macos")]
extern "C" {
    fn CGPreflightScreenCaptureAccess() -> bool;
    fn CGRequestScreenCaptureAccess() -> bool;
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
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
    session_mic_enabled: bool,
    session_audio_enabled: bool,
}

static RECORDING_STATE: Mutex<RecordingState> = Mutex::new(RecordingState {
    is_recording: false,
    is_paused: false,
    pid: None,
    session_mic_enabled: true,
    session_audio_enabled: true,
});

#[tauri::command]
fn create_selection_overlay(app: tauri::AppHandle) -> Result<(), String> {
    use tauri::WebviewUrl;

    // Close existing overlay
    if let Some(existing) = app.get_webview_window("overlay") {
        let _ = existing.close();
    }

    // Get full screen size
    let main_window = app.get_webview_window("main").ok_or("Main window not found")?;
    let monitor = main_window.primary_monitor().map_err(|e| e.to_string())?.ok_or("No monitor found")?;
    let screen_w = monitor.size().width;
    let screen_h = monitor.size().height;
    let scale = monitor.scale_factor();

    // Create fullscreen transparent overlay window
    let overlay = WebviewWindowBuilder::new(
        &app,
        "overlay",
        WebviewUrl::App("/#overlay".into()),
    )
    .title("Selection")
    .inner_size(screen_w as f64 / scale, screen_h as f64 / scale)
    .position(0.0, 0.0)
    .resizable(false)
    .decorations(false)
    .always_on_top(true)
    .skip_taskbar(true)
    .transparent(true)
    .build()
    .map_err(|e| format!("Failed to create overlay: {}", e))?;

    // Hide main window so it's not in the way
    if let Some(main_win) = app.get_webview_window("main") {
        let _ = main_win.hide();
    }

    let _ = overlay.set_focus();
    Ok(())
}

#[tauri::command]
fn close_selection_overlay(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(overlay) = app.get_webview_window("overlay") {
        let _ = overlay.close();
    }
    // Show main window again
    if let Some(main_window) = app.get_webview_window("main") {
        let _ = main_window.show();
        let _ = main_window.set_focus();
    }
    Ok(())
}

#[tauri::command]
fn get_session_audio_state() -> Result<(bool, bool), String> {
    let state = RECORDING_STATE.lock().map_err(|e| e.to_string())?;
    Ok((state.session_mic_enabled, state.session_audio_enabled))
}

#[tauri::command]
fn start_recording_from_overlay(app: tauri::AppHandle, x: f64, y: f64, w: f64, h: f64, mic_enabled: Option<bool>, system_audio_enabled: Option<bool>) -> Result<(), String> {
    // Store session audio state in RECORDING_STATE
    if let Ok(mut state) = RECORDING_STATE.lock() {
        state.session_mic_enabled = mic_enabled.unwrap_or(true);
        state.session_audio_enabled = system_audio_enabled.unwrap_or(true);
    }

    // Determine capture mode based on bounds
    let (mode, _bounds) = if w <= 0.0 && h <= 0.0 {
        ("fullscreen".to_string(), None)
    } else {
        ("area".to_string(), Some(serde_json::json!({
            "x": x, "y": y, "w": w, "h": h
        })))
    };

    // Emit event to main window with capture info
    let _ = app.emit("overlay-capture", serde_json::json!({
        "mode": mode,
        "x": x, "y": y, "w": w, "h": h,
        "mic_enabled": mic_enabled.unwrap_or(true),
        "system_audio_enabled": system_audio_enabled.unwrap_or(true)
    }));

    Ok(())
}

#[tauri::command]
fn create_toolbar_window(app: tauri::AppHandle) -> Result<(), String> {
    use tauri::WebviewUrl;

    // Remove existing toolbar window if any
    if let Some(existing) = app.get_webview_window("toolbar") {
        let _ = existing.close();
    }

    // Get screen size for positioning
    let monitor_size = app.get_webview_window("main")
        .and_then(|w| w.primary_monitor().ok())
        .flatten()
        .map(|m| (m.size().width, m.size().height))
        .unwrap_or((1920, 1080));

    let toolbar_width = 650u32;
    let toolbar_height = 56u32;
    let x = (monitor_size.0 - toolbar_width) / 2;
    let y = 50u32;

    let _window = WebviewWindowBuilder::new(
        &app,
        "toolbar",
        WebviewUrl::App("/#toolbar".into()),
    )
    .title("Recording Toolbar")
    .inner_size(toolbar_width as f64, toolbar_height as f64)
    .position(x as f64, y as f64)
    .resizable(false)
    .decorations(false)
    .always_on_top(true)
    .visible_on_all_workspaces(true)
    .skip_taskbar(true)
    .transparent(true)
    .build()
    .map_err(|e| format!("Failed to create toolbar window: {}", e))?;

    // Hide main window
    if let Some(main_window) = app.get_webview_window("main") {
        let _ = main_window.hide();
    }

    Ok(())
}

#[tauri::command]
fn close_toolbar_window(app: tauri::AppHandle) -> Result<(), String> {
    // Close toolbar window
    if let Some(toolbar) = app.get_webview_window("toolbar") {
        let _ = toolbar.close();
    }

    // Show main window again
    if let Some(main_window) = app.get_webview_window("main") {
        let _ = main_window.show();
        let _ = main_window.set_focus();
    }

    Ok(())
}

#[tauri::command]
fn create_drawing_window(app: tauri::AppHandle) -> Result<(), String> {
    use tauri::WebviewUrl;

    if let Some(existing) = app.get_webview_window("drawing") {
        let _ = existing.close();
    }

    let scale = app.get_webview_window("main")
        .and_then(|w| w.primary_monitor().ok())
        .flatten()
        .map(|m| m.scale_factor())
        .unwrap_or(1.0);

    let monitor_size = app.get_webview_window("main")
        .and_then(|w| w.primary_monitor().ok())
        .flatten()
        .map(|m| (m.size().width, m.size().height))
        .unwrap_or((1920, 1080));

    let overlay = WebviewWindowBuilder::new(
        &app,
        "drawing",
        WebviewUrl::App("/#drawing".into()),
    )
    .title("Drawing Overlay")
    .inner_size(monitor_size.0 as f64 / scale, monitor_size.1 as f64 / scale)
    .position(0.0, 0.0)
    .resizable(false)
    .decorations(false)
    .always_on_top(true)
    .skip_taskbar(true)
    .transparent(true)
    .build()
    .map_err(|e| format!("Failed to create drawing window: {}", e))?;

    let _ = overlay.set_ignore_cursor_events(true);

    Ok(())
}

#[tauri::command]
fn close_drawing_window(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(drawing) = app.get_webview_window("drawing") {
        let _ = drawing.close();
    }
    Ok(())
}

#[tauri::command]
fn toggle_drawing_mode(app: tauri::AppHandle, enabled: bool, color: Option<String>, size: Option<f64>, eraser: Option<bool>) -> Result<(), String> {
    if let Some(drawing) = app.get_webview_window("drawing") {
        let _ = drawing.set_ignore_cursor_events(!enabled);
        let _ = drawing.emit("set-drawing-mode", enabled);
        if let (Some(c), Some(s)) = (color, size) {
            let _ = drawing.emit("set-pen-style", serde_json::json!({ "color": c, "size": s, "eraser": eraser.unwrap_or(false) }));
        }
    }
    if enabled {
        if let Some(toolbar) = app.get_webview_window("toolbar") {
            let _ = toolbar.set_focus();
        }
    }
    Ok(())
}

#[tauri::command]
fn focus_toolbar_window(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(toolbar) = app.get_webview_window("toolbar") {
        let _ = toolbar.set_focus();
    }
    Ok(())
}

#[tauri::command]
fn set_drawing_pen_style(app: tauri::AppHandle, color: String, size: f64, eraser: Option<bool>) -> Result<(), String> {
    if let Some(drawing) = app.get_webview_window("drawing") {
        let _ = drawing.emit("set-pen-style", serde_json::json!({ "color": color, "size": size, "eraser": eraser.unwrap_or(false) }));
    }
    Ok(())
}

#[tauri::command]
fn clear_drawing(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(drawing) = app.get_webview_window("drawing") {
        let _ = drawing.emit("clear-drawing", ());
    }
    Ok(())
}

#[tauri::command]
fn capture_screen() -> Result<String, String> {
    let path = "/tmp/Recora_selection_bg.png";
    let output = Command::new("screencapture")
        .args(&["-x", "-t", "png", path])
        .output()
        .map_err(|e| format!("Failed to capture screen: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Screenshot failed: {}", stderr));
    }

    Ok(path.to_string())
}

#[tauri::command]
fn minimize_main_window(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(main_window) = app.get_webview_window("main") {
        let _ = main_window.minimize();
    }
    Ok(())
}

#[tauri::command]
fn restore_main_window(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(main_window) = app.get_webview_window("main") {
        let _ = main_window.unminimize();
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

fn expand_home(path: &str) -> String {
    if path.starts_with("~/") || path == "~" {
        let home = dirs::home_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .to_string_lossy()
            .to_string();
        path.replacen("~", &home, 1)
    } else {
        path.to_string()
    }
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
        let expanded = expand_home(save_location);
        PathBuf::from(&expanded)
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
    args.push("1:none".to_string());

    // Add audio input if microphone enabled
    if options.microphone.as_deref() != Some("muted") {
        args.push("-f".into());
        args.push("avfoundation".into());
        args.push("-i".into());
        args.push(":0".into());
    }

    // Add crop filter for area capture, always append format=yuv420p for libx264 compatibility
    let mut video_filter = String::new();
    if options.mode == "area" {
        if let (Some(x), Some(y), Some(w), Some(h)) = (options.x, options.y, options.width, options.height) {
            video_filter = format!("crop={}:{}:{}:{}", w as u32, h as u32, x as u32, y as u32);
        }
    }
    if !video_filter.is_empty() {
        video_filter.push_str(",format=yuv420p");
        args.push("-vf".into());
        args.push(video_filter.clone());
    } else {
        args.push("-vf".into());
        args.push("format=yuv420p".into());
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

    // Output
    args.push("-y".into());
    args.push(output_path.clone());

    // Spawn ffmpeg process
    let child = Command::new(&get_ffmpeg_path())
        .args(&args)
        .spawn()
        .map_err(|e| {
            if e.kind() == std::io::ErrorKind::NotFound {
                "FFmpeg is not installed. The app should include ffmpeg, or install it manually. On macOS: brew install ffmpeg".to_string()
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
    state.is_recording = false;
    state.is_paused = false;

    if let Some(pid) = state.pid.take() {
        let pid_str = pid.to_string();
        let _ = Command::new("kill")
            .args(&["-2", &pid_str])
            .output();

        std::thread::spawn(move || {
            for _ in 0..30 {
                std::thread::sleep(std::time::Duration::from_millis(100));
                let check = Command::new("kill").args(&["-0", &pid_str]).output();
                if let Ok(o) = check {
                    if !o.status.success() {
                        break;
                    }
                }
            }
            let _ = Command::new("kill").args(&["-9", &pid_str]).output();
        });
    }

    let _ = app.emit("recording-stop", ());

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

    // Use screencapture on macOS with full path
    #[cfg(target_os = "macos")]
    {
        let screencapture = if std::path::Path::new("/usr/sbin/screencapture").exists() {
            "/usr/sbin/screencapture"
        } else {
            "screencapture"
        };
        let output = Command::new(screencapture)
            .args(&["-x", "-t", "png", &path])
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
    let expanded_path = expand_home(&path);
    Command::new("open")
        .arg(&expanded_path)
        .spawn()
        .map_err(|e| format!("Failed to open file: {}", e))?;
    Ok(())
}

#[tauri::command]
fn open_folder(path: String) -> Result<(), String> {
    let expanded_path = expand_home(&path);
    Command::new("open")
        .args(&["-R", &expanded_path])
        .spawn()
        .map_err(|e| format!("Failed to open folder: {}", e))?;
    Ok(())
}

#[tauri::command]
fn get_recording_info(path: String) -> Result<serde_json::Value, String> {
    let output = Command::new(get_ffmpeg_path())
        .args(&["-i", &path])
        .output()
        .map_err(|e| format!("Failed to get recording info: {}", e))?;

    let stderr = String::from_utf8_lossy(&output.stderr);
    let mut streams = Vec::new();
    let mut duration = None;
    let mut bitrate = None;

    for line in stderr.lines() {
        if let Some(rest) = line.strip_prefix("  Duration: ") {
            let parts: Vec<&str> = rest.split(',').collect();
            if let Some(d) = parts.first() {
                duration = Some(d.trim().to_string());
            }
            for part in &parts {
                let t = part.trim();
                if let Some(br) = t.strip_prefix("bitrate: ") {
                    bitrate = br.trim_end_matches(" kb/s").parse::<f64>().ok();
                }
            }
        }
        if line.contains("Stream ") && line.contains("Video:") {
            let mut stream = serde_json::json!({"type": "video"});
            if let Some(pos) = line.find("Video: ") {
                let after = &line[pos + 7..];
                if let Some(codec) = after.split(',').next() {
                    stream["codec"] = serde_json::json!(codec.trim());
                }
            }
            if let Some((w, h)) = parse_resolution(line) {
                stream["width"] = serde_json::json!(w);
                stream["height"] = serde_json::json!(h);
            }
            streams.push(stream);
        }
        if line.contains("Stream ") && line.contains("Audio:") {
            let mut stream = serde_json::json!({"type": "audio"});
            if let Some(pos) = line.find("Audio: ") {
                let after = &line[pos + 7..];
                if let Some(codec) = after.split(',').next() {
                    stream["codec"] = serde_json::json!(codec.trim());
                }
            }
            streams.push(stream);
        }
    }

    let mut format = serde_json::json!({});
    if let Some(d) = duration {
        format["duration"] = serde_json::json!(d);
    }
    if let Some(br) = bitrate {
        format["bitrate"] = serde_json::json!(br);
    }

    Ok(serde_json::json!({ "format": format, "streams": streams }))
}

fn parse_resolution(s: &str) -> Option<(u32, u32)> {
    let bytes = s.as_bytes();
    for i in 1..bytes.len().saturating_sub(3) {
        if bytes[i] == b'x' && bytes[i - 1].is_ascii_digit() && bytes[i + 1].is_ascii_digit() {
            let w_start = (0..i).rev().take_while(|j| bytes[*j].is_ascii_digit()).last()?;
            let w: u32 = std::str::from_utf8(&bytes[w_start..i]).ok()?.parse().ok()?;
            let h_end = (i + 1..bytes.len()).take_while(|j| bytes[*j].is_ascii_digit()).last()?;
            let h: u32 = std::str::from_utf8(&bytes[i + 1..=h_end]).ok()?.parse().ok()?;
            if w > 0 && h > 0 && w < 10000 && h < 10000 {
                return Some((w, h));
            }
        }
    }
    None
}

fn get_binary_path(name: &str) -> String {
    if let Some(exe_path) = std::env::current_exe().ok() {
        if let Some(exe_dir) = exe_path.parent() {
            let bundled = exe_dir.join(name);
            if bundled.exists() {
                return bundled.to_string_lossy().to_string();
            }
            #[cfg(target_os = "windows")]
            {
                let bundled_exe = exe_dir.join(format!("{}.exe", name));
                if bundled_exe.exists() {
                    return bundled_exe.to_string_lossy().to_string();
                }
            }
        }
    }

    if let Ok(manifest_dir) = std::env::var("CARGO_MANIFEST_DIR") {
        let target = std::env::var("TARGET").unwrap_or_default();
        let ext = if cfg!(target_os = "windows") { ".exe" } else { "" };
        let dev_path = std::path::Path::new(&manifest_dir)
            .join("binaries")
            .join(format!("{}-{}{}", name, target, ext));
        if dev_path.exists() {
            return dev_path.to_string_lossy().to_string();
        }
        let dev_path_plain = std::path::Path::new(&manifest_dir)
            .join("binaries")
            .join(format!("{}{}", name, ext));
        if dev_path_plain.exists() {
            return dev_path_plain.to_string_lossy().to_string();
        }
    }

    let resource_dirs = [
        "/Applications/Recora.app/Contents/Resources",
        "/Applications/Recora.app/Contents/MacOS",
    ];
    for dir in &resource_dirs {
        let path = format!("{}/{}", dir, name);
        if std::path::Path::new(&path).exists() {
            return path;
        }
    }

    if cfg!(target_os = "windows") {
        format!("{}.exe", name)
    } else {
        name.to_string()
    }
}

fn get_ffmpeg_path() -> String {
    get_binary_path("ffmpeg")
}

#[tauri::command]
fn check_ffmpeg_installed() -> bool {
    let ffmpeg_path = get_ffmpeg_path();
    Command::new(&ffmpeg_path)
        .arg("-version")
        .output()
        .is_ok()
}

#[tauri::command]
fn get_available_devices() -> Result<serde_json::Value, String> {
    let output = Command::new(&get_ffmpeg_path())
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

    #[cfg(target_os = "macos")]
    {
        permissions["screen"] = serde_json::Value::Bool(unsafe { CGPreflightScreenCaptureAccess() });
        permissions["microphone"] = serde_json::Value::Bool(true);
        permissions["camera"] = serde_json::Value::Bool(true);
    }

    #[cfg(not(target_os = "macos"))]
    {
        permissions["screen"] = serde_json::Value::Bool(true);
        permissions["microphone"] = serde_json::Value::Bool(true);
        permissions["camera"] = serde_json::Value::Bool(true);
    }

    Ok(permissions)
}

#[tauri::command]
fn request_screen_recording_permission() -> Result<bool, String> {
    #[cfg(target_os = "macos")]
    {
        Ok(unsafe { CGRequestScreenCaptureAccess() })
    }
    #[cfg(not(target_os = "macos"))]
    {
        Ok(true)
    }
}

#[tauri::command]
fn open_screen_recording_settings() -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .args(&["x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture"])
            .spawn()
            .map_err(|e| format!("Failed to open settings: {}", e))?;
    }
    Ok(())
}

#[tauri::command]
fn ensure_save_directory(path: String) -> Result<(), String> {
    fs::create_dir_all(&path).map_err(|e| format!("Failed to create directory: {}", e))
}

#[tauri::command]
fn get_disk_space(path: String) -> Result<serde_json::Value, String> {
    let expanded_path = expand_home(&path);

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
    let expanded_path = expand_home(&path);
    Ok(PathBuf::from(&expanded_path).exists())
}

#[tauri::command]
fn validate_recordings(paths: Vec<String>) -> Result<Vec<String>, String> {
    let mut valid_paths = Vec::new();
    for path in paths {
        let expanded_path = expand_home(&path);
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
    let expanded_path = expand_home(&path);
    Ok(expanded_path)
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
fn generate_thumbnail(video_path: String) -> Result<String, String> {
    let thumb_dir = "/tmp/Recora_thumbs";
    fs::create_dir_all(thumb_dir).map_err(|e| e.to_string())?;

    // Use video filename hash for unique thumbnail
    let hash: u32 = video_path.bytes().fold(0u32, |acc, b| acc.wrapping_mul(31).wrapping_add(b as u32));
    let thumb_path = format!("{}/thumb_{}.png", thumb_dir, hash);

    // Check if thumbnail already exists
    if PathBuf::from(&thumb_path).exists() {
        return Ok(thumb_path);
    }

    let output = Command::new(&get_ffmpeg_path())
        .args(&[
            "-i", &video_path,
            "-ss", "00:00:01",
            "-vframes", "1",
            "-vf", "scale=320:-1",
            "-y",
            &thumb_path,
        ])
        .output()
        .map_err(|e| format!("Failed to generate thumbnail: {}", e))?;

    if output.status.success() && PathBuf::from(&thumb_path).exists() {
        Ok(thumb_path)
    } else {
        Err("Thumbnail generation failed".into())
    }
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
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .setup(|app| {
            // Build tray menu
            let show = MenuItemBuilder::with_id("show", "Open Recora").build(app)?;
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
                .tooltip("Recora")
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

            // Register global keyboard shortcuts
            use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

            let app_handle = app.handle().clone();

            let shortcuts_list = vec![
                (Shortcut::new(Some(Modifiers::META | Modifiers::SHIFT), Code::KeyR), "start-stop"),
                (Shortcut::new(Some(Modifiers::META | Modifiers::SHIFT), Code::KeyP), "pause-resume"),
                (Shortcut::new(Some(Modifiers::META | Modifiers::SHIFT), Code::KeyS), "stop"),
                (Shortcut::new(Some(Modifiers::META | Modifiers::SHIFT), Code::KeyC), "screenshot"),
                (Shortcut::new(Some(Modifiers::META | Modifiers::SHIFT), Code::KeyT), "toggle-toolbar"),
            ];

            let gs = app.global_shortcut();
            for (shortcut, name) in shortcuts_list {
                let app_handle_clone = app_handle.clone();
                let name_owned = name.to_string();
                if let Err(e) = gs.on_shortcut(shortcut, move |_app_handle, _shortcut, event| {
                    if event.state() != ShortcutState::Pressed {
                        return;
                    }
                    match name_owned.as_str() {
                        "start-stop" => {
                            let is_recording = {
                                let state = RECORDING_STATE.lock().unwrap();
                                state.is_recording
                            };
                            let event_name = if is_recording { "tray-stop-recording" } else { "tray-start-recording" };
                            let _ = app_handle_clone.emit(event_name, ());
                        }
                        "pause-resume" => {
                            let _ = app_handle_clone.emit("tray-pause-recording", ());
                        }
                        "stop" => {
                            let _ = app_handle_clone.emit("tray-stop-recording", ());
                        }
                        "screenshot" => {
                            // Only take screenshot when recording is active
                            let is_recording = {
                                let state = RECORDING_STATE.lock().unwrap();
                                state.is_recording
                            };
                            if !is_recording {
                                return;
                            }

                            // Tell the toolbar frontend to handle the screenshot (it can move itself off-screen, take screenshot, restore)
                            let _ = app_handle_clone.emit("shortcut-trigger-screenshot", ());
                        }
                        "toggle-toolbar" => {
                            let _ = app_handle_clone.emit("toggle-toolbar", ());
                        }
                        _ => {}
                    }
                }) {
                    eprintln!("Failed to register shortcut '{}': {}", name, e);
                }
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            create_selection_overlay,
            close_selection_overlay,
            create_toolbar_window,
            close_toolbar_window,
            create_drawing_window,
            close_drawing_window,
            toggle_drawing_mode,
            focus_toolbar_window,
            set_drawing_pen_style,
            clear_drawing,
            capture_screen,
            minimize_main_window,
            restore_main_window,
            get_screen_size,
            start_recording,
            start_recording_from_overlay,
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
            request_screen_recording_permission,
            open_screen_recording_settings,
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
            generate_thumbnail,
            get_downloads_dir,
            show_notification,
            get_session_audio_state,
        ])
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                if window.label() == "main" {
                    api.prevent_close();
                    let _ = window.minimize();
                    let _ = window.hide();
                }
            }
            if let tauri::WindowEvent::Resized(size) = event {
                if window.label() == "main" && size.width > 1100 {
                    let _ = window.set_size(tauri::PhysicalSize::new(1100, size.height));
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}