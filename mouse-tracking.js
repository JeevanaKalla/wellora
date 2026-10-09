/* ============================================================
   WELLORA — MOUSE TRACKING MODULE
   Captures cursor trajectories during the choice decision.
   Active in Studies 1, 2, and 4 (interactive conditions only).
   ============================================================ */

const mouseTracking = {
    active: false,
    trajectory: [],           // {x, y, t}
    startTime: null,
    endTime: null,
    hoverStart: {},           // {buttonId: timestamp}
    hoverTotal: {},           // {buttonId: totalMs}
    clickCount: 0,
    lastDirection: null,
    reversalCount: 0,
    _bound: false,
    _container: null
};

/* ============================================================
   START TRACKING
   ============================================================ */

function startMouseTracking() {
    if (mouseTracking.active) return;

    const container = document.getElementById("ai-assistant");
    if (!container) {
        console.warn("Mouse tracking: #ai-assistant not found.");
        return;
    }

    mouseTracking.active = true;
    mouseTracking.trajectory = [];
    mouseTracking.startTime = performance.now();
    mouseTracking.endTime = null;
    mouseTracking.hoverStart = {};
    mouseTracking.hoverTotal = {};
    mouseTracking.clickCount = 0;
    mouseTracking.lastDirection = null;
    mouseTracking.reversalCount = 0;
    mouseTracking._container = container;

    if (!mouseTracking._bound) {
        document.addEventListener("mousemove", handleMouseMove);
        mouseTracking._bound = true;
    }

    console.log("Mouse tracking started.");
}

/* ============================================================
   STOP TRACKING
   ============================================================ */

function stopMouseTracking() {
    if (!mouseTracking.active) return;

    mouseTracking.active = false;
    mouseTracking.endTime = performance.now();

    // Close any open hover timers
    const now = performance.now();
    Object.keys(mouseTracking.hoverStart).forEach((btnId) => {
        if (mouseTracking.hoverStart[btnId]) {
            const elapsed = now - mouseTracking.hoverStart[btnId];
            mouseTracking.hoverTotal[btnId] =
                (mouseTracking.hoverTotal[btnId] || 0) + elapsed;
            mouseTracking.hoverStart[btnId] = null;
        }
    });

    console.log("Mouse tracking stopped. Trajectory length:", mouseTracking.trajectory.length);

    // Attach to experimentData
    if (window.experimentData) {
        window.experimentData.mouseTracking = computeMouseMetrics();
    }
}

/* ============================================================
   MOUSE MOVE HANDLER
   ============================================================ */

function handleMouseMove(event) {
    if (!mouseTracking.active) return;

    const rect = mouseTracking._container.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Only record if cursor is within the widget bounds
    if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;

    const t = performance.now() - mouseTracking.startTime;

    mouseTracking.trajectory.push({ x, y, t });

    // Direction tracking for reversals
    const len = mouseTracking.trajectory.length;
    if (len >= 3) {
        const p1 = mouseTracking.trajectory[len - 3];
        const p2 = mouseTracking.trajectory[len - 2];
        const p3 = mouseTracking.trajectory[len - 1];
        const dir1 = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        const dir2 = Math.atan2(p3.y - p2.y, p3.x - p2.x);
        const angleChange = Math.abs(normalizeAngle(dir2 - dir1));

        if (angleChange > Math.PI / 3) {  // > 60°
            mouseTracking.reversalCount++;
        }
        mouseTracking.lastDirection = dir2;
    }

    // Hover detection per button
    const buttons = ["recommendButton", "browseIndependent"];
    buttons.forEach((btnId) => {
        const btn = document.getElementById(btnId);
        if (!btn) return;
        const btnRect = btn.getBoundingClientRect();
        const inBtn =
            event.clientX >= btnRect.left &&
            event.clientX <= btnRect.right &&
            event.clientY >= btnRect.top &&
            event.clientY <= btnRect.bottom;

        const wasIn = mouseTracking.hoverStart[btnId] != null;

        if (inBtn && !wasIn) {
            mouseTracking.hoverStart[btnId] = performance.now();
        } else if (!inBtn && wasIn) {
            const elapsed = performance.now() - mouseTracking.hoverStart[btnId];
            mouseTracking.hoverTotal[btnId] =
                (mouseTracking.hoverTotal[btnId] || 0) + elapsed;
            mouseTracking.hoverStart[btnId] = null;
        }
    });
}

function normalizeAngle(a) {
    while (a > Math.PI) a -= 2 * Math.PI;
    while (a < -Math.PI) a += 2 * Math.PI;
    return a;
}

/* ============================================================
   COMPUTE METRICS
   ============================================================ */

function computeMouseMetrics() {
    const traj = mouseTracking.trajectory;
    const start = mouseTracking.startTime;
    const end = mouseTracking.endTime;

    const metrics = {
        decisionLatency: end && start ? Math.round(end - start) : null,
        pointCount: traj.length,
        hoverTimeAcceptBtn: Math.round(mouseTracking.hoverTotal["recommendButton"] || 0),
        hoverTimeBrowseBtn: Math.round(mouseTracking.hoverTotal["browseIndependent"] || 0),
        reversalCount: mouseTracking.reversalCount
    };

    // Trajectory AUC (area under curve relative to the straight line)
    if (traj.length >= 3) {
        const first = traj[0];
        const last = traj[traj.length - 1];
        const dx = last.x - first.x;
        const dy = last.y - first.y;
        const lineLen = Math.sqrt(dx * dx + dy * dy);

        if (lineLen > 0) {
            let maxDeviation = 0;
            traj.forEach((p) => {
                const dist = Math.abs(
                    dy * (p.x - first.x) - dx * (p.y - first.y)
                ) / lineLen;
                if (dist > maxDeviation) maxDeviation = dist;
            });
            metrics.maxDeviation = Math.round(maxDeviation);
            metrics.trajectoryAUC = +(maxDeviation / lineLen).toFixed(3);
        } else {
            metrics.maxDeviation = 0;
            metrics.trajectoryAUC = 0;
        }
    } else {
        metrics.maxDeviation = 0;
        metrics.trajectoryAUC = 0;
    }

    // Chosen option
    metrics.chosenOption =
        window.experimentData &&
        window.experimentData.behavioural &&
        window.experimentData.behavioural.recommendationChoice
            ? window.experimentData.behavioural.recommendationChoice
            : null;

    return metrics;
}

/* ============================================================
   GLOBAL HANDLES
   ============================================================ */

window.startMouseTracking = startMouseTracking;
window.stopMouseTracking = stopMouseTracking;
window.mouseTracking = mouseTracking;
