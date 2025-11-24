//! Physics Validator Library
//! 
//! Core physics and orbital mechanics calculations for space simulations.
//! This library provides validated implementations of fundamental physics formulas.

/// Gravitational constant in SI units (m³ kg⁻¹ s⁻²)
pub const G: f64 = 6.67430e-11;

/// Earth's mass in kilograms
pub const EARTH_MASS: f64 = 5.972e24;

/// Earth's radius in meters
pub const EARTH_RADIUS: f64 = 6.371e6;

/// Calculate orbital velocity for a circular orbit
/// 
/// Formula: v = sqrt(G * M / r)
/// 
/// # Arguments
/// * `mass` - Mass of the central body (kg)
/// * `radius` - Orbital radius from center of mass (m)
/// 
/// # Returns
/// Orbital velocity in m/s
/// 
/// # Example
/// ```
/// use physics_validator::{orbital_velocity, EARTH_MASS, EARTH_RADIUS};
/// 
/// let leo_altitude = 400_000.0; // 400 km altitude
/// let orbital_radius = EARTH_RADIUS + leo_altitude;
/// let velocity = orbital_velocity(EARTH_MASS, orbital_radius);
/// 
/// // LEO orbital velocity should be approximately 7670 m/s
/// assert!((velocity - 7670.0).abs() / 7670.0 < 0.01);
/// ```
pub fn orbital_velocity(mass: f64, radius: f64) -> f64 {
    (G * mass / radius).sqrt()
}

/// Calculate orbital period for a circular orbit
/// 
/// Formula: T = 2π * sqrt(r³ / (G * M))
/// 
/// # Arguments
/// * `mass` - Mass of the central body (kg)
/// * `radius` - Orbital radius from center of mass (m)
/// 
/// # Returns
/// Orbital period in seconds
/// 
/// # Example
/// ```
/// use physics_validator::{orbital_period, EARTH_MASS, EARTH_RADIUS};
/// 
/// let geo_altitude = 35_786_000.0; // Geostationary orbit altitude
/// let orbital_radius = EARTH_RADIUS + geo_altitude;
/// let period = orbital_period(EARTH_MASS, orbital_radius);
/// 
/// // Geostationary period should be approximately 24 hours (86400 seconds)
/// let expected_period = 86400.0;
/// assert!((period - expected_period).abs() / expected_period < 0.01);
/// ```
pub fn orbital_period(mass: f64, radius: f64) -> f64 {
    2.0 * std::f64::consts::PI * (radius.powi(3) / (G * mass)).sqrt()
}

/// Calculate escape velocity from a gravitational body
/// 
/// Formula: v_esc = sqrt(2 * G * M / r)
/// 
/// # Arguments
/// * `mass` - Mass of the body (kg)
/// * `radius` - Distance from center of mass (m)
/// 
/// # Returns
/// Escape velocity in m/s
/// 
/// # Example
/// ```
/// use physics_validator::{escape_velocity, EARTH_MASS, EARTH_RADIUS};
/// 
/// let v_esc = escape_velocity(EARTH_MASS, EARTH_RADIUS);
/// 
/// // Earth's escape velocity should be approximately 11186 m/s
/// assert!((v_esc - 11186.0).abs() / 11186.0 < 0.01);
/// ```
pub fn escape_velocity(mass: f64, radius: f64) -> f64 {
    (2.0 * G * mass / radius).sqrt()
}

/// Calculate gravitational force between two bodies
/// 
/// Formula: F = G * m1 * m2 / r²
/// 
/// # Arguments
/// * `mass1` - Mass of first body (kg)
/// * `mass2` - Mass of second body (kg)
/// * `distance` - Distance between centers of mass (m)
/// 
/// # Returns
/// Gravitational force in Newtons
/// 
/// # Example
/// ```
/// use physics_validator::{gravitational_force, EARTH_MASS};
/// 
/// let human_mass = 70.0; // kg
/// let earth_surface = 6.371e6; // m
/// let force = gravitational_force(EARTH_MASS, human_mass, earth_surface);
/// 
/// // Force should be approximately 686 N (human weight on Earth)
/// assert!((force - 686.0).abs() / 686.0 < 0.01);
/// ```
pub fn gravitational_force(mass1: f64, mass2: f64, distance: f64) -> f64 {
    G * mass1 * mass2 / (distance * distance)
}

/// Calculate gravitational acceleration at a distance from a body
/// 
/// Formula: a = G * M / r²
/// 
/// # Arguments
/// * `mass` - Mass of the body (kg)
/// * `distance` - Distance from center of mass (m)
/// 
/// # Returns
/// Gravitational acceleration in m/s²
/// 
/// # Example
/// ```
/// use physics_validator::{gravitational_acceleration, EARTH_MASS, EARTH_RADIUS};
/// 
/// let accel = gravitational_acceleration(EARTH_MASS, EARTH_RADIUS);
/// 
/// // Earth's surface gravity should be approximately 9.81 m/s²
/// assert!((accel - 9.81).abs() / 9.81 < 0.01);
/// ```
pub fn gravitational_acceleration(mass: f64, distance: f64) -> f64 {
    G * mass / (distance * distance)
}

#[cfg(test)]
mod tests {
    use super::*;

    const TOLERANCE: f64 = 1e-6;

    fn relative_error(actual: f64, expected: f64) -> f64 {
        ((actual - expected) / expected).abs()
    }

    #[test]
    fn test_orbital_velocity_leo() {
        // Low Earth Orbit at 400 km altitude
        let altitude = 400_000.0;
        let orbital_radius = EARTH_RADIUS + altitude;
        let velocity = orbital_velocity(EARTH_MASS, orbital_radius);
        
        // Expected: approximately 7670 m/s
        let expected = 7670.0;
        let error = relative_error(velocity, expected);
        
        assert!(
            error < 0.01,
            "LEO orbital velocity mismatch: got {} m/s, expected {} m/s (error: {:.6})",
            velocity, expected, error
        );
    }

    #[test]
    fn test_orbital_period_geo() {
        // Geostationary orbit
        let altitude = 35_786_000.0;
        let orbital_radius = EARTH_RADIUS + altitude;
        let period = orbital_period(EARTH_MASS, orbital_radius);
        
        // Expected: 24 hours = 86400 seconds
        let expected = 86400.0;
        let error = relative_error(period, expected);
        
        assert!(
            error < 0.01,
            "GEO orbital period mismatch: got {} s, expected {} s (error: {:.6})",
            period, expected, error
        );
    }

    #[test]
    fn test_escape_velocity_earth() {
        let v_esc = escape_velocity(EARTH_MASS, EARTH_RADIUS);
        
        // Expected: approximately 11186 m/s
        let expected = 11186.0;
        let error = relative_error(v_esc, expected);
        
        assert!(
            error < 0.01,
            "Earth escape velocity mismatch: got {} m/s, expected {} m/s (error: {:.6})",
            v_esc, expected, error
        );
    }

    #[test]
    fn test_gravitational_force() {
        let human_mass = 70.0;
        let force = gravitational_force(EARTH_MASS, human_mass, EARTH_RADIUS);
        
        // Expected: approximately 686 N
        let expected = 686.0;
        let error = relative_error(force, expected);
        
        assert!(
            error < 0.01,
            "Gravitational force mismatch: got {} N, expected {} N (error: {:.6})",
            force, expected, error
        );
    }

    #[test]
    fn test_gravitational_acceleration() {
        let accel = gravitational_acceleration(EARTH_MASS, EARTH_RADIUS);
        
        // Expected: approximately 9.81 m/s²
        let expected = 9.81;
        let error = relative_error(accel, expected);
        
        assert!(
            error < 0.01,
            "Earth surface gravity mismatch: got {} m/s², expected {} m/s² (error: {:.6})",
            accel, expected, error
        );
    }

    #[test]
    fn test_escape_velocity_is_sqrt2_times_orbital() {
        // At any radius, escape velocity should be sqrt(2) times orbital velocity
        let test_radius = EARTH_RADIUS * 2.0;
        let v_orbit = orbital_velocity(EARTH_MASS, test_radius);
        let v_escape = escape_velocity(EARTH_MASS, test_radius);
        
        let ratio = v_escape / v_orbit;
        let expected_ratio = 2.0_f64.sqrt();
        let error = relative_error(ratio, expected_ratio);
        
        assert!(
            error < TOLERANCE,
            "Escape/orbital velocity ratio mismatch: got {}, expected {} (error: {:.9})",
            ratio, expected_ratio, error
        );
    }

    #[test]
    fn test_force_acceleration_relationship() {
        // F = m * a, so a = F / m
        let test_mass = 100.0; // kg
        let distance = EARTH_RADIUS;
        
        let force = gravitational_force(EARTH_MASS, test_mass, distance);
        let accel = gravitational_acceleration(EARTH_MASS, distance);
        
        let derived_accel = force / test_mass;
        let error = relative_error(derived_accel, accel);
        
        assert!(
            error < TOLERANCE,
            "Force/acceleration relationship mismatch: F/m = {} m/s², a = {} m/s² (error: {:.9})",
            derived_accel, accel, error
        );
    }
}
