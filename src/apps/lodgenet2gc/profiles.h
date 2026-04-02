// profiles.h - LodgeNet2GC Profile Definitions
//
// Button mapping profiles for LodgeNet to GameCube adapter.
// LodgeNet GC controller input maps to the same JP_BUTTON_* positions
// as GC_BUTTON_* aliases, so the default profile is a 1:1 passthrough.
// LodgeNet N64 input needs remapping (Z/L/R/C-buttons differ).

#ifndef LODGENET2GC_PROFILES_H
#define LODGENET2GC_PROFILES_H

#include "core/services/profiles/profile.h"
#include "native/device/gamecube/gamecube_buttons.h"

// ============================================================================
// PROFILE: Default - GC Passthrough
// ============================================================================
// LodgeNet GC input maps directly to GC_BUTTON_* positions:
//   A→B2, B→B1, X→B4, Y→B3, Z→R1, L→L2, R→R2, Start→S2
// All match GC output aliases — true 1:1 passthrough.
//
// LodgeNet N64 input also works but with natural N64-to-GC mapping:
//   N64 A(B1)→GC B, N64 B(B3)→GC Y, Z(R1)→GC Z, etc.

static const button_map_entry_t lodgenet_gc_default_map[] = {
    // Face buttons (direct for GC, natural remap for N64)
    MAP_BUTTON(JP_BUTTON_B1, GC_BUTTON_B),      // GC B / N64 A → GC B
    MAP_BUTTON(JP_BUTTON_B2, GC_BUTTON_A),      // GC A / N64 C-Down → GC A
    MAP_BUTTON(JP_BUTTON_B3, GC_BUTTON_Y),      // GC Y / N64 B → GC Y
    MAP_BUTTON(JP_BUTTON_B4, GC_BUTTON_X),      // GC X / N64 C-Left → GC X

    // Shoulders + trigger (direct for GC)
    MAP_BUTTON(JP_BUTTON_R1, GC_BUTTON_Z),      // Z → Z
    MAP_BUTTON(JP_BUTTON_L2, GC_BUTTON_L),      // L → L
    MAP_BUTTON(JP_BUTTON_R2, GC_BUTTON_R),      // R → R

    // System
    MAP_BUTTON(JP_BUTTON_S2, GC_BUTTON_START),  // Start → Start
    MAP_BUTTON(JP_BUTTON_A1, GC_BUTTON_START),  // Menu (Home) → Start

    // N64 C-Up/C-Right (L3/R3) — not present on GC controllers
    MAP_DISABLED(JP_BUTTON_L3),
    MAP_DISABLED(JP_BUTTON_R3),

    // LodgeNet extra buttons — disabled for GC output
    MAP_DISABLED(JP_BUTTON_S1),   // Select
    MAP_DISABLED(JP_BUTTON_L1),   // (unmapped)
    MAP_DISABLED(JP_BUTTON_A2),   // Order
    MAP_DISABLED(JP_BUTTON_A4),   // Reset
    MAP_DISABLED(JP_BUTTON_L4),   // Hash
    MAP_DISABLED(JP_BUTTON_R4),   // Star
};

static const profile_t lodgenet_gc_profile_default = {
    .name = "default",
    .description = "Direct LodgeNet passthrough to GameCube",
    .button_map = lodgenet_gc_default_map,
    .button_map_count = sizeof(lodgenet_gc_default_map) / sizeof(lodgenet_gc_default_map[0]),
    .l2_behavior = TRIGGER_PASSTHROUGH,
    .r2_behavior = TRIGGER_PASSTHROUGH,
    .l2_threshold = 128,
    .r2_threshold = 128,
    .l2_analog_value = 0,
    .r2_analog_value = 0,
    .left_stick_sensitivity = 1.0f,
    .right_stick_sensitivity = 1.0f,
    .left_stick_modifiers = NULL,
    .left_stick_modifier_count = 0,
    .right_stick_modifiers = NULL,
    .right_stick_modifier_count = 0,
    .adaptive_triggers = false,
    .socd_mode = SOCD_PASSTHROUGH,
};

// ============================================================================
// PROFILE SET
// ============================================================================

static const profile_t lodgenet_gc_profiles[] = {
    lodgenet_gc_profile_default,
};

static const profile_set_t gc_profile_set = {
    .profiles = lodgenet_gc_profiles,
    .profile_count = sizeof(lodgenet_gc_profiles) / sizeof(lodgenet_gc_profiles[0]),
    .default_index = 0,
};

#endif // LODGENET2GC_PROFILES_H
