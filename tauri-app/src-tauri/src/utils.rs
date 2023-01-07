//! Common utility functions
use std::time::SystemTime;
use rand::Rng;

/// Seconds since 1970.
pub fn unix_time() -> u64 {
    SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .map(|x| x.as_secs())
        .unwrap_or(0)
}

/// Check if a string contains only hex characters.
pub fn is_hex(s: &str) -> bool {
    s.chars().all(|x| char::is_ascii_hexdigit(&x))
}

/// Check if a string contains only lower-case hex chars.
pub fn is_lower_hex(s: &str) -> bool {
    s.chars().all(|x| {
        (char::is_ascii_lowercase(&x) || char::is_ascii_digit(&x)) && char::is_ascii_hexdigit(&x)
    })
}

pub fn random_hash() -> String {
    let mut rng = rand::thread_rng();
    let mut bytes = [0u8; 32];
    rng.fill(&mut bytes);
    sha256::digest(&bytes)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn lower_hex() {
        let hexstr = "abcd0123";
        assert_eq!(is_lower_hex(hexstr), true);
    }
}
