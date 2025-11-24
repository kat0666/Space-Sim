//! Integration tests for orbital mechanics
//! 
//! These tests verify the physics calculations against known real-world values.

use physics_validator::*;

const TOLERANCE: f64 = 1e-6;

fn relative_error(actual: f64, expected: f64) -> f64 {
    ((actual - expected) / expected).abs()
}

#[test]
fn test_iss_orbital_velocity() {
    // International Space Station orbital parameters
    let iss_altitude = 408_000.0; // 408 km typical altitude
    let orbital_radius = EARTH_RADIUS + iss_altitude;
    let velocity = orbital_velocity(EARTH_MASS, orbital_radius);
    
    // ISS orbital velocity is approximately 7660 m/s
    let expected = 7660.0;
    let error = relative_error(velocity, expected);
    
    assert!(
        error < 0.01,
        "ISS orbital velocity mismatch: got {} m/s, expected {} m/s (error: {:.6})",
        velocity, expected, error
    );
}

#[test]
fn test_iss_orbital_period() {
    // International Space Station orbital parameters
    let iss_altitude = 408_000.0;
    let orbital_radius = EARTH_RADIUS + iss_altitude;
    let period = orbital_period(EARTH_MASS, orbital_radius);
    
    // ISS completes an orbit in approximately 92.68 minutes = 5560.8 seconds
    let expected = 5560.8;
    let error = relative_error(period, expected);
    
    assert!(
        error < 0.01,
        "ISS orbital period mismatch: got {} s, expected {} s (error: {:.6})",
        period, expected, error
    );
}

#[test]
fn test_moon_orbital_parameters() {
    // Moon's orbital parameters
    let moon_distance = 384_400_000.0; // 384,400 km average distance
    
    let velocity = orbital_velocity(EARTH_MASS, moon_distance);
    let period = orbital_period(EARTH_MASS, moon_distance);
    
    // Moon's orbital velocity is approximately 1022 m/s
    let expected_velocity = 1022.0;
    let velocity_error = relative_error(velocity, expected_velocity);
    
    // Moon's orbital period is approximately 27.3 days = 2,360,640 seconds
    let expected_period = 27.3 * 24.0 * 3600.0;
    let period_error = relative_error(period, expected_period);
    
    assert!(
        velocity_error < 0.01,
        "Moon orbital velocity mismatch: got {} m/s, expected {} m/s (error: {:.6})",
        velocity, expected_velocity, velocity_error
    );
    
    assert!(
        period_error < 0.01,
        "Moon orbital period mismatch: got {} s, expected {} s (error: {:.6})",
        period, expected_period, period_error
    );
}

#[test]
fn test_gravitational_constant_units() {
    // Verify G is in correct units by checking dimensional analysis
    // F = G * m1 * m2 / r^2
    // [N] = [G] * [kg] * [kg] / [m]^2
    // [kg⋅m/s²] = [G] * [kg²] / [m²]
    // [G] = [m³/(kg⋅s²)]
    
    let m1 = 1.0; // 1 kg
    let m2 = 1.0; // 1 kg
    let r = 1.0;  // 1 m
    
    let force = gravitational_force(m1, m2, r);
    
    // With these unit masses and unit distance, force should equal G
    let error = relative_error(force, G);
    
    assert!(
        error < TOLERANCE,
        "Gravitational constant dimensional check failed: F = {} N, G = {} (error: {:.9})",
        force, G, error
    );
}

#[test]
fn test_kepler_third_law() {
    // Kepler's Third Law: T² ∝ r³
    // For two orbits around the same body: T₁²/r₁³ = T₂²/r₂³
    
    let r1 = EARTH_RADIUS * 2.0;
    let r2 = EARTH_RADIUS * 4.0;
    
    let t1 = orbital_period(EARTH_MASS, r1);
    let t2 = orbital_period(EARTH_MASS, r2);
    
    let ratio1 = t1 * t1 / (r1 * r1 * r1);
    let ratio2 = t2 * t2 / (r2 * r2 * r2);
    
    let error = relative_error(ratio1, ratio2);
    
    assert!(
        error < TOLERANCE,
        "Kepler's Third Law verification failed: T₁²/r₁³ = {}, T₂²/r₂³ = {} (error: {:.9})",
        ratio1, ratio2, error
    );
}

#[test]
fn test_inverse_square_law() {
    // Gravitational acceleration should follow inverse square law
    // If we double the distance, acceleration should be 1/4
    
    let r1 = EARTH_RADIUS;
    let r2 = EARTH_RADIUS * 2.0;
    
    let a1 = gravitational_acceleration(EARTH_MASS, r1);
    let a2 = gravitational_acceleration(EARTH_MASS, r2);
    
    let ratio = a1 / a2;
    let expected_ratio = 4.0; // (r2/r1)² = 2² = 4
    
    let error = relative_error(ratio, expected_ratio);
    
    assert!(
        error < TOLERANCE,
        "Inverse square law verification failed: a₁/a₂ = {}, expected {} (error: {:.9})",
        ratio, expected_ratio, error
    );
}

#[test]
fn test_circular_orbit_energy_balance() {
    // For a circular orbit: kinetic energy = -potential energy / 2
    // Or equivalently: v² = G*M/r
    
    let orbital_radius = EARTH_RADIUS * 2.0;
    let velocity = orbital_velocity(EARTH_MASS, orbital_radius);
    
    let kinetic_per_unit_mass = 0.5 * velocity * velocity;
    let potential_per_unit_mass = G * EARTH_MASS / orbital_radius;
    
    // For circular orbit: KE = PE/2
    let error = relative_error(kinetic_per_unit_mass, potential_per_unit_mass / 2.0);
    
    assert!(
        error < TOLERANCE,
        "Circular orbit energy balance failed: KE = {} J/kg, PE/2 = {} J/kg (error: {:.9})",
        kinetic_per_unit_mass, potential_per_unit_mass / 2.0, error
    );
}
