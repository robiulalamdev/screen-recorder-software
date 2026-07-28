fn main() {
    ensure_ffmpeg_binary();
    tauri_build::build()
}

fn ensure_ffmpeg_binary() {
    let target = match std::env::var("TARGET") {
        Ok(t) => t,
        Err(_) => return,
    };

    let manifest_dir = match std::env::var("CARGO_MANIFEST_DIR") {
        Ok(d) => d,
        Err(_) => return,
    };

    let binaries_dir = std::path::Path::new(&manifest_dir).join("binaries");
    std::fs::create_dir_all(&binaries_dir).ok();

    let exe_ext = if target.contains("windows") { ".exe" } else { "" };
    let dest = binaries_dir.join(format!("ffmpeg-{}{}", target, exe_ext));

    // If the minimal build is already in place (from build-ffmpeg.sh), use it
    if dest.exists() {
        let meta = std::fs::metadata(&dest).ok();
        let size = meta.map(|m| m.len()).unwrap_or(0);
        if size > 100_000 {
            println!("cargo:warning=ffmpeg ready ({})", format_size(size));
            return;
        }
    }

    // Minimal build not found — download a full pre-built static binary
    let asset_name = match target.as_str() {
        "aarch64-apple-darwin" => "ffmpeg-darwin-arm64",
        "x86_64-apple-darwin" => "ffmpeg-darwin-x64",
        "x86_64-pc-windows-msvc" => "ffmpeg-win32-x64",
        "x86_64-unknown-linux-gnu" => "ffmpeg-linux-x64",
        "aarch64-unknown-linux-gnu" => "ffmpeg-linux-arm64",
        _ => {
            println!("cargo:warning=Unsupported target '{}'. Install ffmpeg manually.", target);
            return;
        }
    };

    let version = "b6.1.1";
    let url = format!(
        "https://github.com/eugeneware/ffmpeg-static/releases/download/{}/{}",
        version, asset_name
    );

    println!("cargo:warning=Downloading ffmpeg (~{}) for {}...",
        match target.as_str() {
            "aarch64-apple-darwin" => "44MB",
            "x86_64-apple-darwin" => "75MB",
            "x86_64-pc-windows-msvc" => "79MB",
            "x86_64-unknown-linux-gnu" => "76MB",
            "aarch64-unknown-linux-gnu" => "49MB",
            _ => "?",
        },
        target
    );

    download(&url, &dest).unwrap_or_else(|_| {
        panic!(
            "Failed to download ffmpeg.\n\
             Try: run `sh build-ffmpeg.sh` to build a minimal one instead.\n\
             Or download manually: curl -L -o {} {}",
            dest.to_string_lossy(), url
        )
    });

    set_executable(&dest);
    println!("cargo:warning=ffmpeg ready for {}", target);
}

fn download(url: &str, dest: &std::path::Path) -> Result<(), ()> {
    for cmd in &["curl", "wget"] {
        let args: &[&str] = match *cmd {
            "curl" => &["-#", "-L", "-o", &dest.to_string_lossy(), url],
            "wget" => &["-O", &dest.to_string_lossy(), url],
            _ => unreachable!(),
        };
        if std::process::Command::new(cmd)
            .args(args)
            .status()
            .map(|s| s.success())
            .unwrap_or(false)
        {
            return Ok(());
        }
    }
    Err(())
}

fn set_executable(path: &std::path::Path) {
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        if let Ok(meta) = std::fs::metadata(path) {
            let mut perms = meta.permissions();
            perms.set_mode(perms.mode() | 0o111);
            std::fs::set_permissions(path, perms).ok();
        }
    }
    let _ = path;
}

fn format_size(bytes: u64) -> String {
    if bytes >= 1_000_000 {
        format!("{:.1}MB", bytes as f64 / 1_000_000.0)
    } else if bytes >= 1_000 {
        format!("{:.1}KB", bytes as f64 / 1_000.0)
    } else {
        format!("{}B", bytes)
    }
}
