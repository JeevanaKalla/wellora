/* ============================================================
   WELLORA EXPERIMENTAL SHOPPING PLATFORM
   Study 2 / Study 3 / Study 4 — Complete Logic
   ============================================================ */

/* ============================================================
   1. CONFIGURATION
   ============================================================ */

const urlParams = new URLSearchParams(window.location.search);
const STUDY = parseInt(urlParams.get("study")) || 2;
const CONDITION_OVERRIDE = urlParams.get("condition");

/* ------------------------------------------------------------
   DATA COLLECTION ENDPOINT (Google Apps Script)
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

const STUDY2_CONDITIONS = {
    1: { personalization: "low",  control: "low"  },
    2: { personalization: "low",  control: "high" },
    3: { personalization: "high", control: "low"  },
    4: { personalization: "high", control: "high" }
};

const STUDY3_CONDITIONS = {
    1: { personalization: "low",  control: "none"   },
    2: { personalization: "low",  control: "optout" },
    3: { personalization: "low",  control: "optin"  },
    4: { personalization: "high", control: "none"   },
    5: { personalization: "high", control: "optout" },
    6: { personalization: "high", control: "optin"  }
};

function getConditionMap() {
    return STUDY === 3 ? STUDY3_CONDITIONS : STUDY2_CONDITIONS;
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
console.log("Participant ID:           ", participantID);
console.log("Condition ID:             ", CONDITION_ID);
console.log("Emotional Personalization:", CURRENT_CONDITION.personalization);
console.log("Consumer Control:         ", CURRENT_CONDITION.control);
console.log("Session started:          ", sessionStartTime);
console.log("======================================");

/* ============================================================
   6. RECOMMENDATION CONTENT
   ============================================================ */

function recommendationProducts() {
    return `
        <div class="ai-recommendations">
            <div class="ai-product">
                <span class="ai-product-icon">☕</span>
                <div>
                    <strong>Relaxing Herbal Tea</strong>
                    <p>₹499</p>
                </div>
            </div>
            <div class="ai-product">
                <span class="ai-product-icon">🕯️</span>
                <div>
                    <strong>Calm Scented Candle</strong>
                    <p>₹699</p>
                </div>
            </div>
            <div class="ai-product">
                <span class="ai-product-icon">🧘</span>
                <div>
                    <strong>Wellness Journal</strong>
                    <p>₹399</p>
                </div>
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
                        <p>
                            You are in control of how personalization
                            is used on Wellora.
                        </p>
                        <label class="control-option">
                            <input type="checkbox" id="experimentalControl" checked>
                            Use my information to personalize recommendations
                        </label>
                        <p class="control-note">
                            You can change this preference at any time.
                        </p>
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
                        <p>
                            You may disable it at any time before continuing.
                        </p>
                        <label class="control-option">
                            <input type="checkbox" id="experimentalControl" checked>
                            Use my information to personalize recommendations
                        </label>
                        <p class="control-note">
                            Uncheck the box to disable personalization.
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
                    ${behaviouralMessage}

                    <div class="ai-control-box">
                        <strong>Personalization requires your permission</strong>
                        <p>
                            Please indicate whether you wish to allow personalization.
                        </p>
                        <label class="control-option">
                            <input type="checkbox" id="experimentalControl">
                            I authorize Wellora to personalize recommendations using my information.
                        </label>
                        <p class="control-note">
                            You may change this preference at any time.
                        </p>
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
                        <p class="control-note">
                            You can change this preference at any time.
                        </p>
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
   7. SHOW RECOMMENDATIONS
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
        controlCheckbox.addEventListener("change", function () {
            logEvent("emotional_control_changed", {
                enabled: controlCheckbox.checked
            });
            console.log("Control changed:", controlCheckbox.checked);
        });
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
}

/* ============================================================
   8. BEHAVIOURAL CHOICES
   ============================================================ */

function acceptRecommendation() {
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
    if (feedback) {
        feedback.textContent =
            "You chose to continue with the AI recommendation.";
    }

    offerDisablePersonalization();
    setTimeout(showQuestionnaire, 800);
}

function browseIndependently() {
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
    if (feedback) {
        feedback.textContent =
            "You chose to browse independently.";
    }

    setTimeout(showQuestionnaire, 800);
}

/* ============================================================
   9. DISABLE PERSONALIZATION
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
        radio.addEventListener("change", function () {
            experimentData.behavioural.disabledPersonalization =
                radio.value === "yes";
            logEvent("disable_personalization_choice", {
                disabled: experimentData.behavioural.disabledPersonalization
            });
        });
    });
}

/* ============================================================
   10. QUESTIONNAIRE DATA DEFINITIONS
   ============================================================ */

const LIKERT = [
    { value: 1, label: "Strongly disagree" },
    { value: 2, label: "Disagree" },
    { value: 3, label: "Somewhat disagree" },
    { value: 4, label: "Neither agree nor disagree" },
    { value: 5, label: "Somewhat agree" },
    { value: 6, label: "Agree" },
    { value: 7, label: "Strongly agree" }
];

const QUESTIONNAIRE_BLOCKS = [
    {
        key: "perceived_emotional_understanding",
        title: "Your perception of the AI",
        items: [
            "The AI seemed to understand how I was feeling.",
            "The AI appeared sensitive to my emotional state.",
            "The AI seemed to recognize my feelings.",
            "The AI responded appropriately to how I was feeling."
        ]
    },
    {
        key: "emotional_engagement",
        title: "Your emotional engagement",
        items: [
            "I felt emotionally engaged with the interaction.",
            "The interaction made me feel connected to the brand.",
            "I felt emotionally involved in the experience.",
            "The interaction resonated with me emotionally."
        ]
    },
    {
        key: "perceived_emotional_manipulation",
        title: "Your perception of the AI's intent",
        items: [
            "The AI was trying to use my emotions to influence my decision.",
            "I felt that my feelings were being used to persuade me.",
            "The AI appeared to be deliberately influencing my emotions for commercial purposes.",
            "The AI was exploiting my emotional state to get me to buy something."
        ]
    },
    {
        key: "autonomy_threat",
        title: "Your sense of autonomy",
        items: [
            "I felt that my freedom to make my own decision was threatened.",
            "The interaction made me feel less in control of my decision.",
            "I felt that the AI was interfering with my freedom of choice.",
            "The AI tried to make the decision for me."
        ]
    },
    {
        key: "psychological_reactance",
        title: "Your reaction to the AI",
        items: [
            "The interaction irritated me.",
            "I felt like resisting what the AI was suggesting.",
            "I wanted to do the opposite of what the AI was encouraging me to do.",
            "The AI's recommendation made me want to push back."
        ]
    },
    {
        key: "consumer_resistance",
        title: "Your intention to respond",
        items: [
            "I would reject this recommendation.",
            "I would avoid using this AI recommendation system again.",
            "I would disregard the AI's suggestion.",
            "I would actively oppose the AI's attempt to influence me."
        ]
    }
];

if (STUDY === 3) {
    QUESTIONNAIRE_BLOCKS.push({
        key: "perceived_legitimacy",
        title: "Your view of the AI's use of your information",
        items: [
            "It was appropriate for the AI to use my emotional information in this way.",
            "The AI's use of my emotional information was legitimate.",
            "I felt that the AI's use of my emotions was fair.",
            "The AI's emotional personalization was acceptable to me."
        ]
    });
    QUESTIONNAIRE_BLOCKS.push({
        key: "recommendation_acceptance",
        title: "Your willingness to accept",
        items: [
            "I would accept this recommendation."
        ]
    });
}

const MANIPULATION_CHECKS = [
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

/* ------------------------------------------------------------
   DEMOGRAPHICS
   ------------------------------------------------------------ */

const DEMOGRAPHIC_BLOCKS = [
    {
        key: "age",
        type: "text",
        question: "How old are you?",
        placeholder: "Enter your age in years"
    },
    {
        key: "gender",
        type: "radio",
        question: "How do you identify?",
        options: [
            { value: "woman", label: "Woman" },
            { value: "man", label: "Man" },
            { value: "nonbinary", label: "Non-binary" },
            { value: "prefer_not", label: "Prefer not to say" }
        ]
    },
    {
        key: "country",
        type: "text",
        question: "In which country do you currently live?",
        placeholder: "Enter your country of residence"
    },
    {
        key: "education",
        type: "radio",
        question: "What is your highest level of education completed?",
        options: [
            { value: "secondary", label: "Secondary school" },
            { value: "some_college", label: "Some college or university" },
            { value: "bachelor", label: "Bachelor's degree" },
            { value: "master_plus", label: "Master's degree or higher" }
        ]
    },
    {
        key: "employment",
        type: "radio",
        question: "What is your current employment status?",
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
        key: "ai_usage",
        type: "checkbox",
        question: "Which of the following have you used in the past 12 months? (Select all that apply)",
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
   11. QUESTIONNAIRE RENDERING
   ============================================================ */

function renderQuestionnaireBlock(block, prefix) {
    const itemsHTML = block.items
        .map((item, idx) => {
            const name = `${prefix}_${block.key}_${idx}`;
            const options = LIKERT.map(
                (o) => `
                    <label class="likert-option">
                        <input type="radio" name="${name}" value="${o.value}" required>
                        <span>${o.value}</span>
                    </label>
                `
            ).join("");
            return `
                <div class="questionnaire-item">
                    <p class="item-text">${item}</p>
                    <div class="likert-scale">${options}</div>
                </div>
            `;
        })
        .join("");

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
        inputHTML = `
            <input
                type="text"
                name="demo_${block.key}"
                class="demographic-text-input"
                placeholder="${block.placeholder || ''}"
                required
            >
        `;
    } else if (block.type === "radio") {
        inputHTML = `
            <div class="demographic-options">
                ${block.options.map((o) => `
                    <label class="demographic-option">
                        <input type="radio" name="demo_${block.key}" value="${o.value}" required>
                        <span>${o.label}</span>
                    </label>
                `).join("")}
            </div>
        `;
    } else if (block.type === "checkbox") {
        inputHTML = `
            <div class="demographic-options">
                ${block.options.map((o) => `
                    <label class="demographic-option">
                        <input type="checkbox" name="demo_${block.key}" value="${o.value}">
                        <span>${o.label}</span>
                    </label>
                `).join("")}
            </div>
        `;
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

    const existing = document.getElementById("questionnaireSection");
    if (existing) existing.remove();

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
   12. QUESTIONNAIRE SUBMIT
   ============================================================ */

function handleQuestionnaireSubmit(event) {
    event.preventDefault();
    const form = event.target;

    QUESTIONNAIRE_BLOCKS.forEach((b) => {
        experimentData.questionnaire[b.key] = readLikertBlock(
            form, "main", b.key, b.items.length
        );
    });

    MANIPULATION_CHECKS.forEach((b) => {
        experimentData.manipulationChecks[b.key] = readLikertBlock(
            form, "check", b.key, b.items.length
        );
    });

    experimentData.controlVariables = {};
    CONTROL_VARIABLES.forEach((b) => {
        experimentData.controlVariables[b.key] = readLikertBlock(
            form, "control", b.key, b.items.length
        );
    });

    // Collect demographics
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
        confirmation.textContent =
            "Thank you. Your responses have been recorded.";
        confirmation.classList.add("visible");
    }

    form.querySelectorAll("input, button").forEach((el) => (el.disabled = true));

    if (STUDY !== 4) {
        setTimeout(() => submitToServer(), 600);
    }
}

/* ============================================================
   13. DATA EXPORT (fallback — downloads JSON locally)
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
        console.log("Data downloaded:", a.download);
    } catch (e) {
        console.warn("Could not download data:", e);
    }
}

/* ============================================================
   14. INITIALIZATION
   ============================================================ */

document.addEventListener("DOMContentLoaded", function () {
    console.log("Wellora platform initialized.");

    const recommendBtn = document.getElementById("recommendButton");
    const browseBtn    = document.getElementById("browseIndependent");

    if (recommendBtn) {
        recommendBtn.addEventListener("click", showRecommendation);
    } else {
        console.warn("Recommendation button not found.");
    }

    if (browseBtn) {
        browseBtn.addEventListener("click", browseIndependently);
    } else {
        console.warn("Browse independently button not found.");
    }

    logEvent("session_started", {
        study: STUDY,
        conditionID: CONDITION_ID
    });
});

/* ============================================================
   15. GLOBAL HANDLES
   ============================================================ */

window.experimentData = experimentData;
window.showRecommendation = showRecommendation;
window.browseIndependently = browseIndependently;
window.showQuestionnaire = showQuestionnaire;
window.downloadData = downloadData;
window.logEvent = logEvent;
window.submitToServer = submitToServer;
