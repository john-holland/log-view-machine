package com.logview.causality

/**
 * Data shape for visualizing the tri-leaf tree: root, enabled events, current head, and per-branch action availability.
 * A future diagram/UI can consume this without depending on Interpreter internals.
 */
data class TriLeafVisualData(
    /** State value at root (no events applied). */
    val rootStateValue: String,
    /** All enabled event keys (from config + OVERRIDE_EVENT). */
    val enabledEventKeys: List<String>,
    /** Current head state value. */
    val currentStateValue: String,
    /** Whether the current head is the root. */
    val atRoot: Boolean,
    /**
     * Per-event availability: event key -> (canForward, canPause, canBackward).
     * canPause is always true when not paused; canBackward = same for all (canUndo).
     */
    val branchAvailability: Map<String, BranchActions>
) {
    data class BranchActions(
        val canForward: Boolean,
        val canPause: Boolean,
        val canBackward: Boolean
    )
}
