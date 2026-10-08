/* ============================================================
   WELLORA — IMPLICIT ASSOCIATION TEST (IAT)
   Study 4 — Appendix D compliant
   ============================================================ */

/* ============================================================
   1. STIMULI (Appendix D1.1 & D1.2)
   ============================================================ */

const IAT_STIMULI = {
    emotional:     ["emotional", "feelings", "mood", "affective"],
    behavioural:   ["browsing", "purchase", "history", "clicks"],
    understanding: ["attentive", "responsive", "caring", "supportive"],
    manipulation:  ["exploitative", "controlling", "intrusive", "persuasive"]
};

/* ============================================================
   2. BLOCK DEFINITIONS (Appendix D1.3)
   ------------------------------------------------------------
   Standard 7-block IAT:
     1. Target discrimination       (20 trials)
     2. Attribute discrimination    (20 trials)
     3. Combined practice            (20 trials)
     4. Combined test                (40 trials)
     5. Target reversed              (20 trials)
     6. Combined practice reversed   (20 trials)
     7. Combined test reversed       (40 trials)
   Total: 180 trials
   ============================================================ */

const IAT_BLOCKS = [
    {
        id: 1,
        type: "target",
        trials: 20,
        leftCategory:  "emotional",
        rightCategory: "behavioural",
        leftLabel:  "Emotional Personalization",
        rightLabel: "Behavioural Personalization",
        instruction: "Sort the words into two categories: EMOTIONAL PERSONALIZATION (left) or BEHAVIOURAL PERSONALIZATION (right)."
    },
    {
        id: 2,
        type: "attribute",
        trials: 20,
        leftCategory:  "understanding",
        rightCategory: "manipulation",
        leftLabel:  "Understanding",
        rightLabel: "Manipulation",
        instruction: "Sort the words into two categories: UNDERSTANDING (left) or MANIPULATION (right)."
    },
    {
        id: 3,
        type: "combined",
        trials: 20,
        leftCategories:  ["emotional", "understanding"],
        rightCategories: ["behavioural", "manipulation"],
        leftLabel:  "Emotional Personalization or Understanding",
        rightLabel: "Behavioural Personalization or Manipulation",
        instruction: "Sort the words into two categories: EMOTIONAL PERSONALIZATION or UNDERSTANDING (left) and BEHAVIOURAL PERSONALIZATION or MANIPULATION (right).",
        compatible: true
    },
    {
        id: 4,
        type: "combined",
        trials: 40,
        leftCategories:  ["emotional", "understanding"],
        rightCategories: ["behavioural", "manipulation"],
        leftLabel:  "Emotional Personalization or Understanding",
        rightLabel: "Behavioural Personalization or Manipulation",
        instruction: "Continue as before. Respond as quickly and accurately as you can.",
        compatible: true
    },
    {
        id: 5,
        type: "target",
        trials: 20,
        leftCategory:  "behavioural",
        rightCategory: "emotional",
        leftLabel:  "Behavioural Personalization",
        rightLabel: "Emotional Personalization",
        instruction: "Sort the words into two categories: BEHAVIOURAL PERSONALIZATION (left) or EMOTIONAL PERSONALIZATION (right). Note that the categories have switched sides."
    },
    {
        id: 6,
        type: "combined",
        trials: 20,
        leftCategories:  ["behavioural", "understanding"],
        rightCategories: ["emotional", "manipulation"],
        leftLabel:  "Behavioural Personalization or Understanding",
        rightLabel: "Emotional Personalization or Manipulation",
        instruction: "Sort the words into two categories: BEHAVIOURAL PERSONALIZATION or UNDERSTANDING (left) and EMOTIONAL PERSONALIZATION or MANIPULATION (right). Note that the categories have switched sides.",
        compatible: false
    },
    {
        id: 7,
        type: "combined",
        trials: 40,
        leftCategories:  ["behavioural", "understanding"],
        rightCategories: ["emotional", "manipulation"],
        leftLabel:  "Behavioural Personalization or Understanding",
        rightLabel: "Emotional Personalization or Manipulation",
        instruction: "Continue as before. Respond as quickly and accurately as you can.",
        compatible: false
    }
];

/* ============================================================
   3. IAT STATE
   ============================================================ */

const iatState = {
    active: false,
    blockIndex: 0,
    trialIndex: 0,
    currentBlock: null,
    currentStimulus: null,
    correctSide: null,          // "left" | "right"
    awaitingResponse: false,
    showError: false,
    trialSequence: [],

    // Timing
    trialStartTime: null,

    // Data collection
    trials: [],

    // Counterbalancing
    compatibleFirst: Math.random() < 0.5,

    // Anti-cheat / quality
    tooFastCount: 0,

    // Internal
    _keyHandlerBound: false
};

/* ============================================================
   4. TIMING CONSTANTS
   ============================================================ */

const FIXATION_MS = 500;
const ITI_MS = 250;

/* ============================================================
   5. HELPERS
   ============================================================ */

function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
}

function enforceSideBalance(pool) {
    for (let i = 3; i < pool.length; i++) {
        if (
            pool[i].side === pool[i - 1].side &&
            pool[i].side === pool[i - 2].side &&
            pool[i].side === pool[i - 3].side
        ) {
            for (let j = i + 1; j < pool.length; j++) {
                if (pool[j].side !== pool[i].side) {
                    [pool[i], pool[j]] = [pool[j], pool[i]];
                    break;
                }
            }
        }
    }
}

/* ============================================================
   6. BUILD TRIAL SEQUENCE
   ============================================================ */

function buildTrialSequence(block) {
    let pool = [];

    if (block.type === "target") {
        const leftWords  = IAT_STIMULI[block.leftCategory];
        const rightWords = IAT_STIMULI[block.rightCategory];

        while (pool.length < block.trials) {
            pool.push({ word: pickRandom(leftWords),  category: block.leftCategory,  side: "left" });
            pool.push({ word: pickRandom(rightWords), category: block.rightCategory, side: "right" });
        }
    } else if (block.type === "attribute") {
        const leftWords  = IAT_STIMULI[block.leftCategory];
        const rightWords = IAT_STIMULI[block.rightCategory];

        while (pool.length < block.trials) {
            pool.push({ word: pickRandom(leftWords),  category: block.leftCategory,  side: "left" });
            pool.push({ word: pickRandom(rightWords), category: block.rightCategory, side: "right" });
        }
    } else {
        // Combined
        while (pool.length < block.trials) {
            const leftCat = pickRandom(block.leftCategories);
            pool.push({
                word: pickRandom(IAT_STIMULI[leftCat]),
                category: leftCat,
                side: "left"
            });

            const rightCat = pickRandom(block.rightCategories);
            pool.push({
                word: pickRandom(IAT_STIMULI[rightCat]),
                category: rightCat,
                side: "right"
            });
        }
    }

    pool = pool.slice(0, block.trials);
    shuffle(pool);
    enforceSideBalance(pool);

    return pool;
}

/* ============================================================
   7. RENDER IAT INTERFACE
   ============================================================ */

function renderIATInterface() {
    const container = document.getElementById("iatContainer");
    if (!container) {
        console.error("ERROR: #iatContainer not found in DOM.");
        return;
    }

    container.innerHTML = `
        <section class="iat-section" id="iatSection">

            <div class="iat-intro" id="iatIntro">
                <h2>Categorization Task</h2>
                <p>
                    You will be completing a categorization task. Words will appear
                    in the center of the screen, and your task is to sort them into
                    the correct category using the <strong>'E'</strong> and
                    <strong>'I'</strong> keys.
                </p>
                <p>
                    Please respond as quickly and accurately as you can. The
                    categories will be shown at the top of the screen. If you make
                    a mistake, a red <strong>'X'</strong> will appear — press the
                    other key to continue. Please keep your fingers on the
                    <strong>'E'</strong> and <strong>'I'</strong> keys throughout
                    the task.
                </p>
                <button class="primary-button" id="iatStartBtn" type="button">
                    Begin Task
                </button>
            </div>

            <div class="iat-stage" id="iatStage" style="display:none;">

                <div class="iat-progress" id="iatProgress"></div>

                <div class="iat-category-labels">
                    <div class="iat-category left"  id="iatLeftLabel"></div>
                    <div class="iat-category right" id="iatRightLabel"></div>
                </div>

                <div class="iat-stimulus-area" id="iatStimulusArea">
                    <div class="iat-fixation" id="iatFixation">+</div>
                    <div class="iat-stimulus" id="iatStimulus"></div>
                    <div class="iat-error" id="iatError">✕</div>
                </div>

                <div class="iat-key-hint">
                    Press <kbd>E</kbd> for left, <kbd>I</kbd> for right
                </div>
            </div>

            <div class="iat-complete" id="iatComplete" style="display:none;">
                <h2>Task complete</h2>
                <p>Thank you for completing the categorization task. Please continue to the next section.</p>
            </div>

        </section>
    `;

    const startBtn = document.getElementById("iatStartBtn");
    if (startBtn) {
        startBtn.addEventListener("click", startIAT);
    }
}

/* ============================================================
   8. START IAT
   ============================================================ */

function startIAT() {
    iatState.active = true;

    if (window.logEvent) {
        logEvent("iat_started", {
            compatibleFirst: iatState.compatibleFirst
        });
    }

    const intro = document.getElementById("iatIntro");
    const stage = document.getElementById("iatStage");
    if (intro) intro.style.display = "none";
    if (stage) stage.style.display = "block";

    // Counterbalance block order
    if (!iatState.compatibleFirst) {
        // Move blocks 3,4 to end; move 5,6,7 up
        // Original: [1,2,3,4,5,6,7]
        // New:      [1,2,5,6,7,3,4]
        const reordered = [
            IAT_BLOCKS[0],
            IAT_BLOCKS[1],
            IAT_BLOCKS[4],
            IAT_BLOCKS[5],
            IAT_BLOCKS[6],
            IAT_BLOCKS[2],
            IAT_BLOCKS[3]
        ];
        // Reassign IDs so D-score computation uses `compatible` flag (not block id)
        reordered.forEach((b, i) => { b.id = i + 1; });
        IAT_BLOCKS.length = 0;
        IAT_BLOCKS.push(...reordered);
    }

    iatState.blockIndex = 0;
    iatState.trialIndex = 0;
    iatState.trials = [];

    if (!iatState._keyHandlerBound) {
        document.addEventListener("keydown", handleIATKeydown);
        iatState._keyHandlerBound = true;
    }

    runNextBlock();
}

/* ============================================================
   9. RUN NEXT BLOCK
   ============================================================ */

function runNextBlock() {
    if (iatState.blockIndex >= IAT_BLOCKS.length) {
        finishIAT();
        return;
    }

    const block = IAT_BLOCKS[iatState.blockIndex];
    iatState.currentBlock = block;
    iatState.trialIndex = 0;

    const leftLabel  = document.getElementById("iatLeftLabel");
    const rightLabel = document.getElementById("iatRightLabel");
    if (leftLabel)  leftLabel.textContent  = block.leftLabel;
    if (rightLabel) rightLabel.textContent = block.rightLabel;

    iatState.trialSequence = buildTrialSequence(block);

    updateProgress();

    if (window.logEvent) {
        logEvent("iat_block_start", {
            blockId: block.id,
            blockType: block.type,
            trials: block.trials,
            compatible: block.compatible
        });
    }

    setTimeout(() => runNextTrial(), 600);
}

/* ============================================================
   10. RUN NEXT TRIAL
   ============================================================ */

function runNextTrial() {
    if (!iatState.active) return;

    if (iatState.trialIndex >= iatState.trialSequence.length) {
        iatState.blockIndex++;
        setTimeout(() => runNextBlock(), ITI_MS);
        return;
    }

    const trial = iatState.trialSequence[iatState.trialIndex];
    iatState.currentStimulus = trial.word;
    iatState.correctSide = trial.side;
    iatState.showError = false;

    const fixation = document.getElementById("iatFixation");
    const stimulus = document.getElementById("iatStimulus");
    const error    = document.getElementById("iatError");

    if (fixation) fixation.style.display = "none";
    if (error)    error.style.display = "none";

    if (stimulus) {
        stimulus.style.display = "block";
        stimulus.textContent = trial.word;
    }

    iatState.trialStartTime = performance.now();
    iatState.awaitingResponse = true;
}

/* ============================================================
   11. HANDLE KEYDOWN
   ============================================================ */

function handleIATKeydown(event) {
    if (!iatState.active || !iatState.awaitingResponse) return;

    const key = event.key.toLowerCase();

    // Error state: any E/I clears it
    if (iatState.showError) {
        if (key === "e" || key === "i") {
            event.preventDefault();
            iatState.showError = false;

            const error = document.getElementById("iatError");
            if (error) error.style.display = "none";

            iatState.awaitingResponse = false;
            iatState.trialIndex++;
            updateProgress();
            setTimeout(() => runNextTrial(), ITI_MS);
        }
        return;
    }

    // Normal response
    if (key !== "e" && key !== "i") return;
    event.preventDefault();

    const responseSide = key === "e" ? "left" : "right";
    const correct = responseSide === iatState.correctSide;
    const latency = performance.now() - iatState.trialStartTime;

    iatState.trials.push({
        blockId: iatState.currentBlock.id,
        blockType: iatState.currentBlock.type,
        compatible: iatState.currentBlock.compatible,
        stimulus: iatState.currentStimulus,
        correctSide: iatState.correctSide,
        response: responseSide,
        correct: correct,
        latency: latency
    });

    if (latency < 300) {
        iatState.tooFastCount++;
    }

    if (correct) {
        iatState.awaitingResponse = false;
        iatState.trialIndex++;
        updateProgress();
        setTimeout(() => runNextTrial(), ITI_MS);
    } else {
        iatState.showError = true;
        const error = document.getElementById("iatError");
        if (error) error.style.display = "block";
    }
}

/* ============================================================
   12. PROGRESS
   ============================================================ */

function updateProgress() {
    const progress = document.getElementById("iatProgress");
    if (!progress) return;

    const block = iatState.currentBlock;
    if (!block) return;

    progress.textContent =
        `Block ${iatState.blockIndex + 1} of ${IAT_BLOCKS.length} ` +
        `· Trial ${iatState.trialIndex + 1} of ${block.trials}`;
}

/* ============================================================
   13. FINISH IAT
   ============================================================ */

function finishIAT() {
    iatState.active = false;

    const stage = document.getElementById("iatStage");
    const complete = document.getElementById("iatComplete");
    if (stage) stage.style.display = "none";
    if (complete) complete.style.display = "block";

    const dScore = computeDScore(iatState.trials);

    if (window.experimentData) {
        window.experimentData.iat = {
            trials: iatState.trials,
            dScore: dScore.value,
            dScoreDetails: dScore.details,
            compatibleFirst: iatState.compatibleFirst,
            tooFastCount: iatState.tooFastCount
        };
    }

    if (window.logEvent) {
        logEvent("iat_completed", {
            dScore: dScore.value,
            totalTrials: iatState.trials.length,
            tooFastCount: iatState.tooFastCount
        });
    }

    console.log("IAT D-score:", dScore.value);
    console.log("D-score details:", dScore.details);

    // Auto-download the full dataset
    setTimeout(() => {
        if (typeof window.downloadData === "function") {
            window.downloadData();
        }
    }, 800);
}

/* ============================================================
   14. D-SCORE COMPUTATION
   ------------------------------------------------------------
   Improved algorithm (Greenwald, Nosek & Banaji, 2003).
   Only combined blocks are used.
   ============================================================ */

function computeDScore(allTrials) {
    // 1. Select combined-block trials
    const combined = allTrials.filter(t => t.blockType === "combined");

    if (combined.length === 0) {
        return {
            value: null,
            details: { error: "No combined-block trials found." }
        };
    }

    // 2. Split by compatibility flag
    const compatibleTrials   = combined.filter(t => t.compatible === true);
    const incompatibleTrials = combined.filter(t => t.compatible === false);

    if (compatibleTrials.length === 0 || incompatibleTrials.length === 0) {
        return {
            value: null,
            details: { error: "Missing compatible or incompatible trials." }
        };
    }

    // 3. Trim latencies > 10000 ms
    const trim = (arr) => arr.filter(t => t.latency <= 10000);
    const comp = trim(compatibleTrials);
    const incomp = trim(incompatibleTrials);

    if (comp.length === 0 || incomp.length === 0) {
        return {
            value: null,
            details: { error: "All trials were trimmed." }
        };
    }

    // 4. Error penalty: replace error latencies with (blockMean + 600)
    const applyPenalty = (arr) => {
        const correctLatencies = arr
            .filter(t => t.correct)
            .map(t => t.latency);

        const blockMean = correctLatencies.length
            ? correctLatencies.reduce((a, b) => a + b, 0) / correctLatencies.length
            : 0;

        return arr.map(t => ({
            ...t,
            adjustedLatency: t.correct ? t.latency : blockMean + 600
        }));
    };

    const compAdj   = applyPenalty(comp);
    const incompAdj = applyPenalty(incomp);

    // 5. Means
    const meanComp   = compAdj.reduce((s, t) => s + t.adjustedLatency, 0) / compAdj.length;
    const meanIncomp = incompAdj.reduce((s, t) => s + t.adjustedLatency, 0) / incompAdj.length;

    // 6. Pooled SD from both combined conditions
    const allAdj = [...compAdj, ...incompAdj];
    const grandMean = allAdj.reduce((s, t) => s + t.adjustedLatency, 0) / allAdj.length;
    const variance = allAdj.reduce(
        (s, t) => s + Math.pow(t.adjustedLatency - grandMean, 2),
        0
    ) / allAdj.length;
    const pooledSD = Math.sqrt(variance);

    if (pooledSD === 0) {
        return {
            value: null,
            details: { error: "Pooled SD is zero." }
        };
    }

    // 7. D-score
    //    Appendix D2.1: D = (M_incompatible - M_compatible) / SD_pooled
    //    Appendix D2.1 (interpretation): Positive D = stronger EP ↔ Manipulation
    //
    //    Interpretation:
    //    - Compatible block pairs EP with Understanding
    //    - Incompatible block pairs EP with Manipulation
    //    - If participants have a stronger implicit EP↔Manipulation association,
    //      they respond SLOWER on the compatible (EP+Understanding) block.
    //    - So M_compatible > M_incompatible → D should be positive.
    //    - That means: D = (M_compatible - M_incompatible) / SD_pooled
    //
    //    We follow the appendix's stated interpretation literally.

    const d = (meanComp - meanIncomp) / pooledSD;

    return {
        value: d,
        details: {
            meanCompatible: meanComp,
            meanIncompatible: meanIncomp,
            pooledSD: pooledSD,
            nCompatible: compAdj.length,
            nIncompatible: incompAdj.length,
            errorRate: combined.filter(t => !t.correct).length / combined.length
        }
    };
}

/* ============================================================
   15. AUTO-LAUNCH (Study 4 only)
   ------------------------------------------------------------
   Renders the IAT interface and waits for the questionnaire
   to be submitted before scrolling it into view.
   ============================================================ */

document.addEventListener("DOMContentLoaded", function () {
    if (!window.experimentData) return;
    if (window.experimentData.study !== 4) return;

    renderIATInterface();

    const observer = new MutationObserver(() => {
        const confirmation = document.getElementById("questionnaireConfirmation");
        if (confirmation && confirmation.classList.contains("visible")) {
            const iat = document.getElementById("iatSection");
            if (iat) iat.scrollIntoView({ behavior: "smooth" });
            observer.disconnect();
        }
    });

    observer.observe(document.body, {
        subtree: true,
        attributes: true,
        attributeFilter: ["class"]
    });
});

/* ============================================================
   16. GLOBAL HANDLES (debugging)
   ============================================================ */

window.iatState = iatState;
window.computeDScore = computeDScore;
window.startIAT = startIAT;
