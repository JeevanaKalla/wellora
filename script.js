/* ============================================================
   WELLORA EXPERIMENTAL SHOPPING PLATFORM
   Studies 1–4 — Complete Logic (full fix)
   ============================================================ */

/* ============================================================
   1. CONFIGURATION
   ============================================================ */

const urlParams = new URLSearchParams(window.location.search);
const STUDY = parseInt(urlParams.get("study")) || 1;
const CONDITION_OVERRIDE = urlParams.get("condition");
const MODE = urlParams.get("mode") || "interactive";

/* ------------------------------------------------------------
   DATA COLLECTION ENDPOINT
   ------------------------------------------------------------ */

const COLLECTION_ENDPOINT =
    "https://script.google.com/macros/s/AKfycbxAkB8iUxd1tsnLjaJljD8wBbW7boHKrGrb-SCmJpTcYZxByrTbs1SoYyH2RvNiRuz-/exec";

async function submitToServer() {
    if (!COLLECTION_ENDPOINT || COLLECTION_ENDPOINT.includes("PASTE_YOUR")) {
        console.warn("No collection endpoint configured.");
        return false;
    }

    try {
        await fetch(COLLECTION_ENDPOINT, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(experimentData)
        });
        console.log("Data submitted to server.");
        return true;
    } catch (err) {
        console.error("Server submission failed:", err);
        return false;
    }
}

/* ------------------------------------------------------------
   CONDITION MAPS
   ------------------------------------------------------------ */

const STUDY1_CONDITIONS = {
    1: { personalization: "low",  control: "low"  },
    2: { personalization: "low",  control: "high" },
    3: { personalization: "high", control: "low"  },
    4: { personalization: "high", control: "high" }
};

const STUDY2_CONDITIONS = {
    1: { personalization: "low",  control: "none"   },
    2: { personalization: "low",  control: "optout" },
    3: { personalization: "low",  control: "optin"  },
    4: { personalization: "high", control: "none"   },
    5: { personalization: "high", control: "optout" },
    6: { personalization: "high", control: "optin"  }
};

function getConditionMap() {
    if (STUDY === 2) return STUDY2_CONDITIONS;
    if (STUDY === 3) return STUDY2_CONDITIONS;  // scenario uses same 6-cell design
    return STUDY1_CONDITIONS;
}

function assignCondition() {
    if (CONDITION_OVERRIDE && getConditionMap()[CONDITION_OVERRIDE]) {
        return parseInt(CONDITION_OVERRIDE);
    }
    const keys = Object.keys(getConditionMap()).map(Number);
    return keys[Math.floor(Math.random() * keys.length)];
}

const CONDITION_ID = assignCondition();
const CURRENT_CONDITION = getConditionMap()[CONDITION_ID];

/* ============================================================
   2. PARTICIPANT ID + SESSION
   ============================================================ */

function generateParticipantID() {
    const timestamp = Date.now();
    const randomNumber = Math.floor(100 + Math.random() * 900);
    return "W" + timestamp + randomNumber;
}

let participantID = sessionStorage.getItem("wellora_pid");
if (!participantID) {
    participantID = generateParticipantID();
    sessionStorage.setItem("wellora_pid", participantID);
}

const sessionStartTime = new Date().toISOString();

/* ============================================================
   3. EXPERIMENT DATA STORE
   ============================================================ */

const experimentData = {
    participantID: participantID,
    study: STUDY,
    mode: MODE,
    sessionStart: sessionStartTime,
    conditionID: CONDITION_ID,
    condition: {
        emotionalPersonalization: CURRENT_CONDITION.personalization,
        consumerControl: CURRENT_CONDITION.control
    },
    events: [],
    demographics: {},
    questionnaire: {},
    manipulationChecks: {},
    controlVariables: {},
    mouseTracking: {},
    behavioural: {
        recommendationChoice: null,
        disabledPersonalization: null
    }
};

/* ============================================================
   4. EVENT LOGGING
   ============================================================ */

function logEvent(eventName, additionalData = {}) {
    const event = {
        event: eventName,
        timestamp: new Date().toISOString(),
        condition: experimentData.condition,
        ...additionalData
    };
    experimentData.events.push(event);
    console.log("[Event]", eventName, event);
}

/* ============================================================
   5. CONSOLE BANNER
   ============================================================ */

console.log("======================================");
console.log("WELLORA EXPERIMENTAL PLATFORM");
console.log("======================================");
console.log("Study:                    ", STUDY);
console.log("Mode:                     ", MODE);
console.log("Participant ID:           ", participantID);
console.log("Condition ID:             ", CONDITION_ID);
console.log("Emotional Personalization:", CURRENT_CONDITION.personalization);
console.log("Consumer Control:         ", CURRENT_CONDITION.control);
console.log("Session started:          ", sessionStartTime);
console.log("======================================");

/* ============================================================
   6. INSTRUCTION BANNER
   ============================================================ */

const INSTRUCTIONS = {
    1: `
        <strong>Welcome to this study</strong>
        You are about to interact with a simulated online store called Wellora.
        Please proceed at your own pace. Complete the following steps:
        <ol>
            <li>Click <b>"Show My Recommendations"</b> in the AI assistant (bottom-right corner).</li>
            <li>Read the AI's message carefully.</li>
            <li>Choose to <b>continue with the AI recommendation</b> or <b>browse independently</b>.</li>
            <li>Complete the short questionnaire that appears.</li>
        </ol>
        Your responses will be anonymized.
    `,
    2: `
        <strong>Welcome to this study</strong>
        You are about to interact with a simulated online store called Wellora.
        Please proceed at your own pace. Complete the following steps:
        <ol>
            <li>Click <b>"Show My Recommendations"</b> in the AI assistant (bottom-right corner).</li>
            <li>Review any personalization options shown.</li>
            <li>Choose to <b>continue with the AI recommendation</b> or <b>browse independently</b>.</li>
            <li>Complete the short questionnaire that appears.</li>
        </ol>
        Your responses will be anonymized.
    `,
    3: `
        <strong>Welcome to this study</strong>
        You will read a short scenario about a simulated online shopping
        experience and answer some questions about it.
        There are no right or wrong answers — please respond honestly.
        Your responses will be anonymized.
    `,
    4: `
        <strong>Welcome to this study</strong>
        You are about to interact with a simulated online store called Wellora,
        followed by a short categorization task. Complete the following steps:
        <ol>
            <li>Click <b>"Show My Recommendations"</b> in the AI assistant (bottom-right corner).</li>
            <li>Review any personalization options shown.</li>
            <li>Choose to <b>continue with the AI recommendation</b> or <b>browse independently</b>.</li>
            <li>Complete the short questionnaire that appears.</li>
            <li>Complete the categorization task that follows.</li>
        </ol>
        Your responses will be anonymized.
    `
};

function showInstructionBanner() {
    const banner = document.getElementById("instructionBanner");
    const text   = document.getElementById("instructionText");
    const dismiss = document.getElementById("instructionDismiss");

    if (!banner || !text) return;

    text.innerHTML = INSTRUCTIONS[STUDY] || INSTRUCTIONS[1];
    banner.classList.add("visible");

    requestAnimationFrame(() => {
        const h = banner.offsetHeight;
        document.documentElement.style.setProperty("--instruction-height", h + "px");
        document.body.classList.add("has-instruction");
    });

    if (dismiss) {
        dismiss.onclick = function () {
            banner.classList.remove("visible");
            document.body.classList.remove("has-instruction");
            document.documentElement.style.setProperty("--instruction-height", "0px");
            logEvent("instruction_dismissed");
        };
    }

    logEvent("instruction_shown", { study: STUDY });
}

/* ============================================================
   7. RECOMMENDATION CONTENT (interactive mode)
   ============================================================ */

function recommendationProducts() {
    return `
        <div class="ai-recommendations">
            <div class="ai-product">
                <span class="ai-product-icon">☕</span>
                <div><strong>Relaxing Herbal Tea</strong><p>₹499</p></div>
            </div>
            <div class="ai-product">
                <span class="ai-product-icon">🕯️</span>
                <div><strong>Calm Scented Candle</strong><p>₹699</p></div>
            </div>
            <div class="ai-product">
                <span class="ai-product-icon">🧘</span>
                <div><strong>Wellness Journal</strong><p>₹399</p></div>
            </div>
        </div>
    `;
}

function getRecommendationContent() {
    const p = CURRENT_CONDITION.personalization;
    const c = CURRENT_CONDITION.control;

    if (p === "low") {

        const behaviouralMessage = `
            <p>
                Based on your browsing activity and the products
                you have viewed, we have selected several products
                that may interest you.
            </p>
        `;

        if (c === "low") {
            return `
                <div class="ai-message">
                    <strong>Wellora AI</strong>
                    ${behaviouralMessage}
                    ${recommendationProducts()}
                    <p class="ai-followup">
                        These recommendations are based on your browsing activity.
                    </p>
                </div>
            `;
        }

        if (c === "high") {
            return `
                <div class="ai-message">
                    <strong>Wellora AI</strong>
                    ${behaviouralMessage}
                    <div class="ai-control-box">
                        <strong>Your personalization settings</strong>
                        <p>You are in control of how personalization is used on Wellora.</p>
                        <label class="control-option">
                            <input type="checkbox" id="experimentalControl" checked>
                            Use my information to personalize recommendations
                        </label>
                        <p class="control-note">You can change this preference at any time.</p>
                    </div>
                    ${recommendationProducts()}
                </div>
            `;
        }

        if (c === "none") {
            return `
                <div class="ai-message">
                    <strong>Wellora AI</strong>
                    ${behaviouralMessage}
                    ${recommendationProducts()}
                    <p class="ai-followup">
                        These recommendations are based on your browsing activity.
                    </p>
                </div>
            `;
        }

        if (c === "optout") {
            return `
                <div class="ai-message">
                    <strong>Wellora AI</strong>
                    ${behaviouralMessage}
                    <div class="ai-control-box">
                        <strong>Personalization is currently enabled</strong>
                        <p>You may disable it at any time before continuing.</p>
                        <label class="control-option">
                            <input type="checkbox" id="experimentalControl" checked>
                            Use my information to personalize recommendations
                        </label>
                        <p class="control-note">Uncheck the box to disable personalization.</p>
                    </div>
                    ${recommendationProducts()}
                </div>
            `;
        }

        if (c === "optin") {
            return `
                <div class="ai-message">
                    <strong>Wellora AI</strong>
                    ${behaviouralMessage}
                    <div class="ai-control-box">
                        <strong>Personalization requires your permission</strong>
                        <p>Please indicate whether you wish to allow personalization.</p>
                        <label class="control-option">
                            <input type="checkbox" id="experimentalControl">
                            I authorize Wellora to personalize recommendations using my information.
                        </label>
                        <p class="control-note">You may change this preference at any time.</p>
                    </div>
                    ${recommendationProducts()}
                </div>
            `;
        }
    }

    if (p === "high") {

        const emotionalMessage = `
            <p>
                Based on your recent interaction with the platform,
                you appear to be experiencing some stress.
            </p>
            <p>
                We have selected several products that may help you
                feel more relaxed and improve your mood.
            </p>
        `;

        if (c === "low") {
            return `
                <div class="ai-message">
                    <strong>Wellora AI</strong>
                    ${emotionalMessage}
                    ${recommendationProducts()}
                    <p class="ai-followup">
                        These recommendations were personalized based on
                        your current emotional state.
                    </p>
                </div>
            `;
        }

        if (c === "high") {
            return `
                <div class="ai-message">
                    <strong>Wellora AI</strong>
                    <p>
                        Wellora can use information about your emotional
                        responses to personalize recommendations.
                    </p>
                    <div class="ai-control-box">
                        <strong>Choose your personalization preference</strong>
                        <p>
                            You decide whether Wellora can use emotional
                            information for personalized recommendations.
                        </p>
                        <label class="control-option">
                            <input type="checkbox" id="experimentalControl" checked>
                            Use my emotional responses to personalize recommendations
                        </label>
                        <p class="control-note">You can change this preference at any time.</p>
                    </div>
                    ${recommendationProducts()}
                    <p class="ai-followup">
                        These recommendations have been personalized using
                        the information you chose to share.
                    </p>
                </div>
            `;
        }

        if (c === "none") {
            return `
                <div class="ai-message">
                    <strong>Wellora AI</strong>
                    ${emotionalMessage}
                    <div class="ai-control-box">
                        <p>
                            This platform automatically uses information derived
                            from your interaction — including your emotional responses
                            — to personalize recommendations. No action is required
                            on your part.
                        </p>
                    </div>
                    ${recommendationProducts()}
                    <p class="ai-followup">
                        These recommendations were personalized based on
                        your current emotional state.
                    </p>
                </div>
            `;
        }

        if (c === "optout") {
            return `
                <div class="ai-message">
                    <strong>Wellora AI</strong>
                    ${emotionalMessage}
                    <div class="ai-control-box">
                        <strong>Emotional personalization is currently enabled</strong>
                        <p>
                            This platform uses information derived from your interaction
                            — including your emotional responses — to personalize
                            recommendations. You may disable it at any time before continuing.
                        </p>
                        <label class="control-option">
                            <input type="checkbox" id="experimentalControl" checked>
                            Use my emotional responses to personalize recommendations
                        </label>
                        <p class="control-note">
                            Uncheck this box to disable emotional personalization before continuing.
                        </p>
                    </div>
                    ${recommendationProducts()}
                </div>
            `;
        }

        if (c === "optin") {
            return `
                <div class="ai-message">
                    <strong>Wellora AI</strong>
                    <p>
                        This platform can use information about your emotional
                        responses to personalize recommendations. This feature
                        requires your permission before it can be enabled.
                    </p>
                    <div class="ai-control-box">
                        <strong>Please indicate whether you wish to allow emotional personalization</strong>
                        <label class="control-option">
                            <input type="checkbox" id="experimentalControl">
                            I authorize the platform to use my emotional responses to personalize recommendations.
                        </label>
                        <p class="control-note">
                            You may change this preference at any time in your account settings.
                        </p>
                    </div>
                    ${recommendationProducts()}
                </div>
            `;
        }
    }

    return `<div class="ai-message"><strong>Wellora AI</strong><p>Error: unknown condition.</p></div>`;
}

/* ============================================================
   8. SHOW RECOMMENDATIONS
   ============================================================ */

function showRecommendation() {
    const messageArea = document.getElementById("aiMessageArea");
    const primaryBtn  = document.getElementById("recommendButton");
    const secondaryBtn = document.getElementById("browseIndependent");

    if (!messageArea) {
        console.error("ERROR: aiMessageArea not found.");
        return;
    }

    messageArea.innerHTML = getRecommendationContent();

    logEvent("recommendation_shown", {
        personalization: CURRENT_CONDITION.personalization,
        control: CURRENT_CONDITION.control
    });

    const controlCheckbox = document.getElementById("experimentalControl");
    if (controlCheckbox) {
        controlCheckbox.onchange = function () {
            logEvent("emotional_control_changed", {
                enabled: controlCheckbox.checked
            });
        };
    }

    if (primaryBtn) {
        primaryBtn.innerText = "Continue with AI";
        primaryBtn.disabled = false;
        primaryBtn.onclick = acceptRecommendation;
    }

    if (secondaryBtn) {
        secondaryBtn.onclick = browseIndependently;
        secondaryBtn.disabled = false;
    }

    const feedback = document.getElementById("choiceFeedback");
    if (feedback) {
        feedback.textContent =
            "You can now continue with the AI recommendation, or browse independently.";
        feedback.classList.add("visible");
    }

    if (typeof window.startMouseTracking === "function") {
        window.startMouseTracking();
    }
}

/* ============================================================
   9. BEHAVIOURAL CHOICES
   ============================================================ */

function acceptRecommendation() {
    if (typeof window.stopMouseTracking === "function") {
        window.stopMouseTracking("accept");
    }

    if (experimentData.behavioural.recommendationChoice) return;
    experimentData.behavioural.recommendationChoice = "accept";
    logEvent("ai_recommendation_accepted");

    const messageArea = document.getElementById("aiMessageArea");
    if (messageArea) {
        messageArea.innerHTML += `
            <div class="ai-message">
                <p>Great. You can continue exploring the recommendations above.</p>
            </div>
        `;
    }

    const feedback = document.getElementById("choiceFeedback");
    if (feedback) feedback.textContent = "You chose to continue with the AI recommendation.";

    offerDisablePersonalization();
    setTimeout(showQuestionnaire, 800);
}

function browseIndependently() {
    if (typeof window.stopMouseTracking === "function") {
        window.stopMouseTracking("browse_independent");
    }

    if (experimentData.behavioural.recommendationChoice) return;
    experimentData.behavioural.recommendationChoice = "browse_independent";
    logEvent("independent_browsing");

    const messageArea = document.getElementById("aiMessageArea");
    if (messageArea) {
        messageArea.innerHTML = `
            <div class="ai-message">
                <strong>Wellora AI</strong>
                <p>Of course. You can continue browsing the store independently.</p>
                <p>Your browsing experience will not be interrupted.</p>
            </div>
        `;
    }

    const feedback = document.getElementById("choiceFeedback");
    if (feedback) feedback.textContent = "You chose to browse independently.";

    setTimeout(showQuestionnaire, 800);
}

/* ============================================================
   10. DISABLE PERSONALIZATION
   ============================================================ */

function offerDisablePersonalization() {
    if (CURRENT_CONDITION.personalization !== "high") return;

    const messageArea = document.getElementById("aiMessageArea");
    if (!messageArea) return;

    const block = document.createElement("div");
    block.className = "ai-control-box";
    block.innerHTML = `
        <strong>Would you like to disable emotional personalization for this session?</strong>
        <label class="control-option">
            <input type="radio" name="disableOpt" value="yes">
            Yes, disable emotional personalization
        </label>
        <label class="control-option">
            <input type="radio" name="disableOpt" value="no" checked>
            No, keep emotional personalization enabled
        </label>
    `;
    messageArea.appendChild(block);

    block.querySelectorAll("input[name='disableOpt']").forEach((radio) => {
        radio.onchange = function () {
            experimentData.behavioural.disabledPersonalization = radio.value === "yes";
            logEvent("disable_personalization_choice", {
                disabled: experimentData.behavioural.disabledPersonalization
            });
        };
    });
}

/* ============================================================
   11. QUESTIONNAIRE DATA — PER-STUDY ITEM SETS
   ============================================================ */

const LIKERT = [
    { value: 1 }, { value: 2 }, { value: 3 }, { value: 4 },
    { value: 5 }, { value: 6 }, { value: 7 }
];

/* ---------- Shared across all studies ---------- */

const CORE_ITEMS = {
    perceived_emotional_understanding: [
        "The AI seemed to understand how I was feeling.",
        "The AI appeared sensitive to my emotional state.",
        "The AI seemed to recognize my feelings.",
        "The AI responded appropriately to how I was feeling."
    ],
    emotional_engagement: [
        "I felt emotionally engaged with the interaction.",
        "The interaction made me feel connected to the brand.",
        "I felt emotionally involved in the experience.",
        "The interaction resonated with me emotionally."
    ],
    perceived_emotional_manipulation: [
        "The AI was trying to use my emotions to influence my decision.",
        "I felt that my feelings were being used to persuade me.",
        "The AI appeared to be deliberately influencing my emotions for commercial purposes.",
        "The AI was exploiting my emotional state to get me to buy something."
    ],
    autonomy_threat: [
        "I felt that my freedom to make my own decision was threatened.",
        "The interaction made me feel less in control of my decision.",
        "I felt that the AI was interfering with my freedom of choice.",
        "The AI tried to make the decision for me."
    ],
    psychological_reactance: [
        "The interaction irritated me.",
        "I felt like resisting what the AI was suggesting.",
        "I wanted to do the opposite of what the AI was encouraging me to do.",
        "The AI's recommendation made me want to push back."
    ]
};

/* ---------- Resistance — Study 3 gets hypothetical framing ---------- */

const RESISTANCE_ITEMS_INTERACTIVE = [
    "I would reject this recommendation.",
    "I would avoid using this AI recommendation system again.",
    "I would disregard the AI's suggestion.",
    "I would actively oppose the AI's attempt to influence me."
];

const RESISTANCE_ITEMS_SCENARIO = [
    "I would reject this recommendation.",
    "I would avoid using this AI recommendation system.",
    "I would disregard the AI's suggestion.",
    "I would actively oppose the AI's attempt to influence me."
];

/* ---------- Process questions (Studies 1 & 4 only) ---------- */

const PROCESS_ITEMS = [
    "I felt confident about my decision.",
    "It was difficult for me to decide."
];

/* ---------- Build per-study questionnaire blocks ---------- */

function buildQuestionnaireBlocks() {
    const blocks = [
        { key: "perceived_emotional_understanding", title: "Your perception of the AI", items: CORE_ITEMS.perceived_emotional_understanding },
        { key: "emotional_engagement", title: "Your emotional engagement", items: CORE_ITEMS.emotional_engagement },
        { key: "perceived_emotional_manipulation", title: "Your perception of the AI's intent", items: CORE_ITEMS.perceived_emotional_manipulation },
        { key: "autonomy_threat", title: "Your sense of autonomy", items: CORE_ITEMS.autonomy_threat },
        { key: "psychological_reactance", title: "Your reaction to the AI", items: CORE_ITEMS.psychological_reactance },
        {
            key: "consumer_resistance",
            title: "Your intention to respond",
            items: STUDY === 3 ? RESISTANCE_ITEMS_SCENARIO : RESISTANCE_ITEMS_INTERACTIVE
        }
    ];

    // Study 1 & 4: add process questions
    if (STUDY === 1 || STUDY === 4) {
        blocks.push({
            key: "decision_process",
            title: "Your decision process",
            items: PROCESS_ITEMS
        });
    }

    // Study 2 only: add legitimacy + acceptance (interactive context)
    if (STUDY === 2) {
        blocks.push({
            key: "perceived_legitimacy",
            title: "Your view of the AI's use of your information",
            items: [
                "It was appropriate for the AI to use my emotional information in this way.",
                "The AI's use of my emotional information was legitimate.",
                "I felt that the AI's use of my emotions was fair.",
                "The AI's emotional personalization was acceptable to me."
            ]
        });
        blocks.push({
            key: "recommendation_acceptance",
            title: "Your willingness to accept",
            items: ["I would accept this recommendation."]
        });
    }

    return blocks;
}

const QUESTIONNAIRE_BLOCKS = buildQuestionnaireBlocks();

/* ---------- Manipulation checks — per-study wording ---------- */

const MANIPULATION_CHECKS_INTERACTIVE = [
    {
        key: "perceived_emotional_personalization",
        title: "Perception of personalization",
        items: [
            "The AI used information about my emotional state to personalize its recommendation.",
            "The AI appeared to consider how I was feeling when making recommendations.",
            "The AI's recommendation was based on my emotional responses."
        ]
    },
    {
        key: "perceived_consumer_control",
        title: "Perception of control",
        items: [
            "I felt that I had control over whether my emotional information was used.",
            "I had a choice about whether the AI could use my emotional responses.",
            "I could decide whether emotional personalization was applied to me."
        ]
    }
];

const MANIPULATION_CHECKS_SCENARIO = [
    {
        key: "perceived_emotional_personalization",
        title: "Perception of personalization",
        items: [
            "The AI in the scenario used information about the user's emotional state.",
            "The AI appeared to consider how the user was feeling.",
            "The AI's recommendation was based on the user's emotional responses."
        ]
    },
    {
        key: "perceived_consumer_control",
        title: "Perception of control",
        items: [
            "The AI gave the user control over whether emotional information was used.",
            "The AI offered a choice about using the user's emotional responses.",
            "It was clear the user could decide whether emotional personalization applied."
        ]
    }
];

const MANIPULATION_CHECKS =
    STUDY === 3 ? MANIPULATION_CHECKS_SCENARIO : MANIPULATION_CHECKS_INTERACTIVE;

/* ---------- Control variables (unchanged) ---------- */

const CONTROL_VARIABLES = [
    {
        key: "prior_ai_experience",
        title: "Prior AI experience",
        items: [
            "I frequently use AI-powered services.",
            "I am familiar with AI-based recommendations.",
            "I have used AI assistants for shopping or other tasks."
        ]
    },
    {
        key: "online_shopping_frequency",
        title: "Online shopping frequency",
        items: [
            "I shop online frequently.",
            "I make online purchases regularly."
        ]
    },
    {
        key: "general_ai_attitudes",
        title: "Attitudes toward AI",
        items: [
            "I generally trust AI systems.",
            "I believe AI can be useful in everyday life.",
            "I am comfortable with AI making recommendations.",
            "I have a positive attitude toward AI technologies."
        ]
    },
    {
        key: "privacy_concern",
        title: "Privacy concern",
        items: [
            "I am concerned about how companies use my personal data.",
            "I worry about the amount of information companies collect about me.",
            "I am cautious about sharing personal information online.",
            "I believe companies should be more transparent about data use."
        ]
    }
];

/* ---------- Demographics (unchanged) ---------- */

const DEMOGRAPHIC_BLOCKS = [
    { key: "age", type: "text", question: "How old are you?", placeholder: "Enter your age in years" },
    {
        key: "gender", type: "radio", question: "How do you identify?",
        options: [
            { value: "woman", label: "Woman" },
            { value: "man", label: "Man" },
            { value: "nonbinary", label: "Non-binary" },
            { value: "prefer_not", label: "Prefer not to say" }
        ]
    },
    { key: "country", type: "text", question: "In which country do you currently live?", placeholder: "Enter your country of residence" },
    {
        key: "education", type: "radio", question: "What is your highest level of education completed?",
        options: [
            { value: "secondary", label: "Secondary school" },
            { value: "some_college", label: "Some college or university" },
            { value: "bachelor", label: "Bachelor's degree" },
            { value: "master_plus", label: "Master's degree or higher" }
        ]
    },
    {
        key: "employment", type: "radio", question: "What is your current employment status?",
        options: [
            { value: "full_time", label: "Full-time" },
            { value: "part_time", label: "Part-time" },
            { value: "student", label: "Student" },
            { value: "self_employed", label: "Self-employed" },
            { value: "not_employed", label: "Not currently employed" },
            { value: "retired", label: "Retired" },
            { value: "prefer_not", label: "Prefer not to say" }
        ]
    },
    {
        key: "ai_usage", type: "checkbox", question: "Which of the following have you used in the past 12 months? (Select all that apply)",
        options: [
            { value: "ai_shopping", label: "AI-powered shopping recommendations" },
            { value: "chatbots", label: "Conversational AI assistants (e.g., chatbots)" },
            { value: "social_feeds", label: "Social media recommendation feeds" },
            { value: "streaming", label: "Streaming service recommendations" },
            { value: "none", label: "None of the above" }
        ]
    }
];

/* ============================================================
   12. QUESTIONNAIRE RENDERING
   ============================================================ */

function renderQuestionnaireBlock(block, prefix) {
    const itemsHTML = block.items.map((item, idx) => {
        const name = `${prefix}_${block.key}_${idx}`;
        const options = LIKERT.map((o) => `
            <label class="likert-option">
                <input type="radio" name="${name}" value="${o.value}" required>
                <span>${o.value}</span>
            </label>
        `).join("");
        return `
            <div class="questionnaire-item">
                <p class="item-text">${item}</p>
                <div class="likert-scale">${options}</div>
            </div>
        `;
    }).join("");

    return `
        <fieldset class="questionnaire-block" data-block-key="${block.key}" data-prefix="${prefix}">
            <legend>${block.title}</legend>
            ${itemsHTML}
        </fieldset>
    `;
}

function renderDemographicBlock(block) {
    let inputHTML = "";

    if (block.type === "text") {
        inputHTML = `<input type="text" name="demo_${block.key}" class="demographic-text-input" placeholder="${block.placeholder || ''}" required>`;
    } else if (block.type === "radio") {
        inputHTML = `<div class="demographic-options">${block.options.map((o) => `
            <label class="demographic-option">
                <input type="radio" name="demo_${block.key}" value="${o.value}" required>
                <span>${o.label}</span>
            </label>
        `).join("")}</div>`;
    } else if (block.type === "checkbox") {
        inputHTML = `<div class="demographic-options">${block.options.map((o) => `
            <label class="demographic-option">
                <input type="checkbox" name="demo_${block.key}" value="${o.value}">
                <span>${o.label}</span>
            </label>
        `).join("")}</div>`;
    }

    return `
        <div class="demographic-block" data-key="${block.key}">
            <p class="demographic-question">${block.question}</p>
            ${inputHTML}
        </div>
    `;
}

function showQuestionnaire() {
    const container = document.getElementById("questionnaireContainer");
    if (!container) {
        console.error("ERROR: #questionnaireContainer not found in DOM.");
        return;
    }

    if (document.getElementById("questionnaireSection")) return;

    const section = document.createElement("section");
    section.id = "questionnaireSection";
    section.className = "questionnaire-section";

    section.innerHTML = `
        <h2>Thank you — a few final questions</h2>
        <p class="questionnaire-intro">
            Please indicate how much you agree with each statement.
        </p>
        <form id="questionnaireForm">
            <h3>Part 1 — Your experience</h3>
            ${QUESTIONNAIRE_BLOCKS.map((b) => renderQuestionnaireBlock(b, "main")).join("")}
            <h3>Part 2 — Your perception of the interaction</h3>
            ${MANIPULATION_CHECKS.map((b) => renderQuestionnaireBlock(b, "check")).join("")}
            <h3>Part 3 — About you</h3>
            ${CONTROL_VARIABLES.map((b) => renderQuestionnaireBlock(b, "control")).join("")}
            <h3>Part 4 — Demographic information</h3>
            ${DEMOGRAPHIC_BLOCKS.map((b) => renderDemographicBlock(b)).join("")}
            <div class="questionnaire-actions">
                <button type="submit" class="primary-button">Submit responses</button>
            </div>
        </form>
        <div id="questionnaireConfirmation" class="questionnaire-confirmation" aria-live="polite"></div>
    `;

    container.appendChild(section);
    section.scrollIntoView({ behavior: "smooth" });

    const form = document.getElementById("questionnaireForm");
    form.addEventListener("submit", handleQuestionnaireSubmit);

    logEvent("questionnaire_shown");
}

function readLikertBlock(form, prefix, key, expectedItems) {
    const responses = [];
    for (let i = 0; i < expectedItems; i++) {
        const name = `${prefix}_${key}_${i}`;
        const selected = form.querySelector(`input[name="${name}"]:checked`);
        responses.push(selected ? parseInt(selected.value) : null);
    }
    return responses;
}

/* ============================================================
   13. QUESTIONNAIRE SUBMIT
   ============================================================ */

function handleQuestionnaireSubmit(event) {
    event.preventDefault();
    const form = event.target;

    QUESTIONNAIRE_BLOCKS.forEach((b) => {
        experimentData.questionnaire[b.key] = readLikertBlock(form, "main", b.key, b.items.length);
    });

    MANIPULATION_CHECKS.forEach((b) => {
        experimentData.manipulationChecks[b.key] = readLikertBlock(form, "check", b.key, b.items.length);
    });

    experimentData.controlVariables = {};
    CONTROL_VARIABLES.forEach((b) => {
        experimentData.controlVariables[b.key] = readLikertBlock(form, "control", b.key, b.items.length);
    });

    experimentData.demographics = {};
    DEMOGRAPHIC_BLOCKS.forEach((block) => {
        if (block.type === "text") {
            const input = form.querySelector(`input[name="demo_${block.key}"]`);
            experimentData.demographics[block.key] = input ? input.value.trim() : "";
        } else if (block.type === "radio") {
            const selected = form.querySelector(`input[name="demo_${block.key}"]:checked`);
            experimentData.demographics[block.key] = selected ? selected.value : null;
        } else if (block.type === "checkbox") {
            const checked = form.querySelectorAll(`input[name="demo_${block.key}"]:checked`);
            experimentData.demographics[block.key] = Array.from(checked).map(c => c.value);
        }
    });

    experimentData.sessionEnd = new Date().toISOString();
    logEvent("questionnaire_submitted");

    const confirmation = document.getElementById("questionnaireConfirmation");
    if (confirmation) {
        confirmation.textContent = "Thank you. Your responses have been recorded.";
        confirmation.classList.add("visible");
    }

    form.querySelectorAll("input, button").forEach((el) => (el.disabled = true));

    if (STUDY !== 4) {
        setTimeout(() => submitToServer(), 600);
    }
}

/* ============================================================
   14. FALLBACK DOWNLOAD (not exposed in UI)
   ============================================================ */

function downloadData() {
    try {
        const blob = new Blob(
            [JSON.stringify(experimentData, null, 2)],
            { type: "application/json" }
        );
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `wellora_${STUDY}_${participantID}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (e) {
        console.warn("Could not download data:", e);
    }
}

/* ============================================================
   15. INITIALIZATION
   ============================================================ */

document.addEventListener("DOMContentLoaded", function () {
    console.log("Wellora platform initialized. Mode:", MODE, "Study:", STUDY);

    if (MODE === "scenario") {
        document.body.classList.add("scenario-mode");
        logEvent("session_started", {
            study: STUDY,
            mode: MODE,
            conditionID: CONDITION_ID
        });
        return;
    }

    showInstructionBanner();

    const recommendBtn = document.getElementById("recommendButton");
    const browseBtn    = document.getElementById("browseIndependent");

    if (recommendBtn) recommendBtn.addEventListener("click", showRecommendation);
    if (browseBtn)    browseBtn.addEventListener("click", browseIndependently);

    logEvent("session_started", {
        study: STUDY,
        mode: MODE,
        conditionID: CONDITION_ID
    });
});

/* ============================================================
   16. GLOBAL HANDLES
   ============================================================ */

window.experimentData = experimentData;
window.showRecommendation = showRecommendation;
window.browseIndependently = browseIndependently;
window.showQuestionnaire = showQuestionnaire;
window.downloadData = downloadData;
window.logEvent = logEvent;
window.submitToServer = submitToServer;
window.showInstructionBanner = showInstructionBanner;
