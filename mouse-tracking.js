/* ============================================================
   WELLORA — MOUSE TRACKING MODULE (v2, corrected)
   ============================================================ */

const mouseTracking = {
    active: false,
    trajectory: [],
    startTime: null,
    endTime: null,
    hoverStart: {},
    hoverTotal: {},
    reversalCount: 0,
    lastAngle: null,
    chosenOption: null,
    _bound: false,
    _container: null,
    _moveHandler: null
};

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
    mouseTracking.reversalCount = 0;
    mouseTracking.lastAngle = null;
    mouseTracking.chosenOption = null;
    mouseTracking._container = container;

    // Remove any previous binding, then bind fresh
    if (mouseTracking._moveHandler) {
        document.removeEventListener("mousemove", mouseTracking._moveHandler);
    }
    mouseTracking._moveHandler = handleMouseMove;
    document.addEventListener("mousemove", mouseTracking._moveHandler);

    console.log("Mouse tracking started.");
}

function stopMouseTracking(chosenOption) {
    if (!mouseTracking.active) return;

    mouseTracking.active = false;
    mouseTracking.endTime = performance.now();
    mouseTracking.chosenOption = chosenOption || null;

    // Flush any open hover timers
    const now = performance.now();
    Object.keys(mouseTracking.hoverStart).forEach((btnId) => {
        if (mouseTracking.hoverStart[btnId]) {
            const elapsed = now - mouseTracking.hoverStart[btnId];
            mouseTracking.hoverTotal[btnId] =
                (mouseTracking.hoverTotal[btnId] || 0) + elapsed;
            mouseTracking.hoverStart[btnId] = null;
        }
    });

    // Unbind
    if (mouseTracking._moveHandler) {
        document.removeEventListener("mousemove", mouseTracking._moveHandler);
        mouseTracking._moveHandler = null;
    }

    console.log("Mouse tracking stopped. Trajectory:", mouseTracking.trajectory.length, "points");

    if (window.experimentData) {
        window.experimentData.mouseTracking = computeMouseMetrics();
    }
}

function handleMouseMove(event) {
    if (!mouseTracking.active) return;

    const rect = mouseTracking._container.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;

    const t = performance.now() - mouseTracking.startTime;
    mouseTracking.trajectory.push({ x, y, t });

    // Reversal detection
    const len = mouseTracking.trajectory.length;
    if (len >= 5) {
        const p1 = mouseTracking.trajectory[len - 5];
        const p2 = mouseTracking.trajectory[len - 1];
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        if (Math.abs(dx) + Math.abs(dy) > 4) {
            const angle = Math.atan2(dy, dx);
            if (mouseTracking.lastAngle !== null) {
                const change = Math.abs(normalizeAngle(angle - mouseTracking.lastAngle));
                if (change > Math.PI / 2.5) {
                    mouseTracking.reversalCount++;
                }
            }
            mouseTracking.lastAngle = angle;
        }
    }

    // Hover tracking per button
    ["recommendButton", "browseIndependent"].forEach((btnId) => {
        const btn = document.getElementById(btnId);
        if (!btn) return;
        const br = btn.getBoundingClientRect();
        const inBtn =
            event.clientX >= br.left &&
            event.clientX <= br.right &&
            event.clientY >= br.top &&
            event.clientY <= br.bottom;

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

function computeMouseMetrics() {
    const traj = mouseTracking.trajectory;
    const container = mouseTracking._container;
    const width = container ? container.getBoundingClientRect().width : 1;

    const metrics = {
        decisionLatency: mouseTracking.endTime && mouseTracking.startTime
            ? Math.round(mouseTracking.endTime - mouseTracking.startTime)
            : null,
        pointCount: traj.length,
        hoverTimeAcceptBtn: Math.round(mouseTracking.hoverTotal["recommendButton"] || 0),
        hoverTimeBrowseBtn: Math.round(mouseTracking.hoverTotal["browseIndependent"] || 0),
        reversalCount: mouseTracking.reversalCount,
        chosenOption: mouseTracking.chosenOption
    };

    // Trajectory metrics: only if we have enough points
    if (traj.length >= 10) {
        const first = traj[0];
        const last = traj[traj.length - 1];
        const dx = last.x - first.x;
        const dy = last.y - first.y;
        const lineLen = Math.sqrt(dx * dx + dy * dy) || 1;

        // Max absolute deviation (in pixels)
        let maxDev = 0;
        traj.forEach((p) => {
            const dist = Math.abs(
                dy * (p.x - first.x) - dx * (p.y - first.y)
            ) / lineLen;
            if (dist > maxDev) maxDev = dist;
        });
        metrics.maxDeviationPx = Math.round(maxDev);

        // Normalized: max dev / container width (0 to 1-ish)
        metrics.maxDeviationNorm = +(maxDev / width).toFixed(3);

        // Trajectory length (sum of segments) / straight-line distance
        // This is the "directness ratio" — 1.0 = perfectly direct, >1 = meandering
        let pathLen = 0;
        for (let i = 1; i < traj.length; i++) {
            const p = traj[i - 1];
            const q = traj[i];
            pathLen += Math.sqrt(
                (q.x - p.x) ** 2 + (q.y - p.y) ** 2
            );
        }
        metrics.pathLengthPx = Math.round(pathLen);
        metrics.directness = +(pathLen / lineLen).toFixed(3);
    } else {
        metrics.maxDeviationPx = 0;
        metrics.maxDeviationNorm = 0;
        metrics.pathLengthPx = 0;
        metrics.directness = 1;
    }

    return metrics;
}

window.startMouseTracking = startMouseTracking;
window.stopMouseTracking = stopMouseTracking;
window.mouseTracking = mouseTracking;
