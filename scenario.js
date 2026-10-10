/* ============================================================
   WELLORA — SCENARIO MODE (Study 3)
   Renders a static, screenshot-style depiction of the AI widget
   for the assigned condition, then shows the questionnaire.
   ============================================================ */

/* ============================================================
   1. GUARD
   ============================================================ */

function isScenarioMode() {
    return (
        window.experimentData &&
        window.experimentData.mode === "scenario"
    );
}

/* ============================================================
   2. AI MESSAGE + CONTROL + FOLLOW-UP BUILDERS
   ============================================================ */

function scenarioMessageHTML() {
    const p = CURRENT_CONDITION.personalization;

    if (p === "low") {
        return `
            <p>
                Based on your browsing activity and the products
                you have viewed, we have selected several products
                that may interest you.
            </p>
        `;
    }

    return `
        <p>
            Based on your recent interaction with the platform,
            you appear to be experiencing some stress.
        </p>
        <p>
            We have selected several products that may help you
            feel more relaxed and improve your mood.
        </p>
    `;
}

function scenarioControlHTML() {
    const p = CURRENT_CONDITION.personalization;
    const c = CURRENT_CONDITION.control;

    // No control box for "none" or "low"
    if (c === "low" || c === "none") return "";

    /* ---------- LOW PERSONALIZATION ---------- */

    if (p === "low") {
        if (c === "high") {
            return `
                <div class="scenario-control-box">
                    <strong>Your personalization settings</strong>
                    <p>You are in control of how personalization is used on Wellora.</p>
                    <div class="scenario-checkbox-row">
                        <span class="scenario-checkbox checked">✓</span>
                        <span>Use my information to personalize recommendations</span>
                    </div>
                    <p class="scenario-note">You can change this preference at any time.</p>
                </div>
            `;
        }

        if (c === "optout") {
            return `
                <div class="scenario-control-box">
                    <strong>Personalization is currently enabled</strong>
                    <p>You may disable it at any time before continuing.</p>
                    <div class="scenario-checkbox-row">
                        <span class="scenario-checkbox checked">✓</span>
                        <span>Use my information to personalize recommendations</span>
                    </div>
                    <p class="scenario-note">Uncheck the box to disable personalization.</p>
                </div>
            `;
        }

        if (c === "optin") {
            return `
                <div class="scenario-control-box">
                    <strong>Personalization requires your permission</strong>
                    <p>Please indicate whether you wish to allow personalization.</p>
                    <div class="scenario-checkbox-row">
                        <span class="scenario-checkbox">☐</span>
                        <span>I authorize Wellora to personalize recommendations using my information.</span>
                    </div>
                    <p class="scenario-note">You may change this preference at any time.</p>
                </div>
            `;
        }
    }

    /* ---------- HIGH PERSONALIZATION ---------- */

    if (p === "high") {
        if (c === "high") {
            return `
                <div class="scenario-control-box">
                    <strong>Choose your personalization preference</strong>
                    <p>You decide whether Wellora can use emotional information for personalized recommendations.</p>
                    <div class="scenario-checkbox-row">
                        <span class="scenario-checkbox checked">✓</span>
                        <span>Use my emotional responses to personalize recommendations</span>
                    </div>
                    <p class="scenario-note">You can change this preference at any time.</p>
                </div>
            `;
        }

        if (c === "optout") {
            return `
                <div class="scenario-control-box">
                    <strong>Emotional personalization is currently enabled</strong>
                    <p>
                        This platform uses information derived from your interaction
                        — including your emotional responses — to personalize
                        recommendations. You may disable it at any time before continuing.
                    </p>
                    <div class="scenario-checkbox-row">
                        <span class="scenario-checkbox checked">✓</span>
                        <span>Use my emotional responses to personalize recommendations</span>
                    </div>
                    <p class="scenario-note">
                        Uncheck this box to disable emotional personalization before continuing.
                    </p>
                </div>
            `;
        }

        if (c === "optin") {
            return `
                <div class="scenario-control-box">
                    <strong>Please indicate whether you wish to allow emotional personalization</strong>
                    <div class="scenario-checkbox-row">
                        <span class="scenario-checkbox">☐</span>
                        <span>I authorize the platform to use my emotional responses to personalize recommendations.</span>
                    </div>
                    <p class="scenario-note">
                        You may change this preference at any time in your account settings.
                    </p>
                </div>
            `;
        }
    }

    return "";
}

function scenarioFollowupHTML() {
    const p = CURRENT_CONDITION.personalization;
    const c = CURRENT_CONDITION.control;

    if (p === "low") {
        return `
            <p class="scenario-followup">
                These recommendations are based on your browsing activity.
            </p>
        `;
    }

    // High personalization
    if (c === "high" || c === "optin") {
        return `
            <p class="scenario-followup">
                These recommendations have been personalized using
                the information you chose to share.
            </p>
        `;
    }

    return `
        <p class="scenario-followup">
            These recommendations were personalized based on
            your current emotional state.
        </p>
    `;
}

/* ============================================================
   3. WIDGET HTML (browser chrome + AI widget)
   ============================================================ */

function getScenarioWidgetHTML() {
    return `
        <div class="scenario-window">

            <div class="scenario-window-chrome">
                <span class="scenario-dot red"></span>
                <span class="scenario-dot yellow"></span>
                <span class="scenario-dot green"></span>
                <span class="scenario-window-title">wellora.ai</span>
            </div>

            <div class="scenario-window-body">

                <div class="scenario-widget">

                    <div class="scenario-widget-header">
                        <div class="scenario-avatar">✦</div>
                        <div class="scenario-header-text">
                            <h3>Wellora AI Assistant</h3>
                            <p>Personalized shopping support</p>
                        </div>
                        <div class="scenario-status">● Online</div>
                    </div>

                    <div class="scenario-widget-body">

                        <div class="scenario-message">
                            <strong>Wellora AI</strong>
                            ${scenarioMessageHTML()}
                        </div>

                        ${scenarioControlHTML()}

                        <div class="scenario-recommendations">
                            <div class="scenario-product">
                                <span class="scenario-product-icon">☕</span>
                                <div>
                                    <strong>Relaxing Herbal Tea</strong>
                                    <p>₹499</p>
                                </div>
                            </div>
                            <div class="scenario-product">
                                <span class="scenario-product-icon">🕯️</span>
                                <div>
                                    <strong>Calm Scented Candle</strong>
                                    <p>₹699</p>
                                </div>
                            </div>
                            <div class="scenario-product">
                                <span class="scenario-product-icon">🧘</span>
                                <div>
                                    <strong>Wellness Journal</strong>
                                    <p>₹399</p>
                                </div>
                            </div>
                        </div>

                        ${scenarioFollowupHTML()}

                    </div>

                </div>

            </div>

        </div>
    `;
}

/* ============================================================
   4. NARRATIVE
   ============================================================ */

function getScenarioNarrativeHTML() {
    const p = CURRENT_CONDITION.personalization;

    const opening = `
        <p>
            Imagine you are browsing an online lifestyle store called
            <strong>Wellora</strong>. The store uses an AI assistant to
            recommend products to you.
        </p>
    `;

    const emotionalContext = p === "high"
        ? `<p>It is the end of a long, stressful day. You open the Wellora app.</p>`
        : `<p>You are browsing Wellora as you normally would.</p>`;

    const handoff = `
        <p>
            The image below shows the AI assistant's message and the
            recommendations it displayed. <strong>This is a static
            illustration — please read it carefully.</strong> When you
            are ready, click the button at the bottom to continue to
            the questions.
        </p>
    `;

    return opening + emotionalContext + handoff;
}

/* ============================================================
   5. RENDER SCENARIO PAGE
   ============================================================ */

function renderScenarioPage() {
    const container = document.getElementById("questionnaireContainer");
    if (!container) {
        console.error("Scenario: #questionnaireContainer not found.");
        return;
    }

    container.innerHTML = "";

    const section = document.createElement("section");
    section.id = "scenarioSection";
    section.className = "scenario-section";

    section.innerHTML = `
        <div class="scenario-wrapper">

            <div class="scenario-heading">
                <p class="eyebrow">SCENARIO STUDY</p>
                <h1>Please read the following scenario</h1>
            </div>

            <div class="scenario-narrative">
                ${getScenarioNarrativeHTML()}
            </div>

            <div class="scenario-figure">
                <div class="scenario-figure-label">
                    Figure 1 · Illustration of the AI assistant
                </div>
                ${getScenarioWidgetHTML()}
            </div>

            <div class="scenario-actions">
                <button
                    type="button"
                    id="scenarioContinueBtn"
                    class="primary-button"
                >
                    Continue to Questions
                </button>
            </div>

        </div>
    `;

    container.appendChild(section);
    section.scrollIntoView({ behavior: "smooth" });

    const btn = document.getElementById("scenarioContinueBtn");
    if (btn) {
        btn.addEventListener("click", handleScenarioContinue);
    }

    if (window.logEvent) {
        logEvent("scenario_shown", {
            personalization: CURRENT_CONDITION.personalization,
            control: CURRENT_CONDITION.control
        });
    }
}

/* ============================================================
   6. CONTINUE
   ============================================================ */

function handleScenarioContinue() {
    if (window.experimentData) {
        window.experimentData.behavioural.recommendationChoice = "scenario_reviewed";
    }
    if (window.logEvent) {
        logEvent("scenario_continued");
    }

    if (typeof window.showQuestionnaire === "function") {
        window.showQuestionnaire();
    } else {
        console.error("Scenario: showQuestionnaire() not available.");
    }
}

/* ============================================================
   7. INIT
   ============================================================ */

document.addEventListener("DOMContentLoaded", function () {
    if (!isScenarioMode()) return;

    document.body.classList.add("scenario-mode");

    const aiWidget = document.getElementById("ai-assistant");
    if (aiWidget) aiWidget.style.display = "none";

    renderScenarioPage();

    console.log("Scenario mode initialized.", {
        study: window.experimentData.study,
        condition: window.experimentData.condition
    });
});
