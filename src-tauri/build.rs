fn main() {
	tauri_build::build();

	println!("cargo:rustc-env=BUILD_DATE={}", chrono::Utc::now().format("%Y-%m-%d"));
	let hash = std::process::Command::new("git")
		.args(["rev-parse", "--short", "HEAD"])
		.output()
		.map(|o| String::from_utf8(o.stdout).unwrap_or_default())
		.unwrap_or_else(|_| "unknown".to_string());

	println!("cargo:rustc-env=GIT_HASH={}", hash.trim());
}
