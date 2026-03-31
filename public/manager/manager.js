(() => {
  "use strict";

  const loginCard = document.getElementById("manager-login-card");
  const loginForm = document.getElementById("manager-login-form");
  const loginPasswordInput = document.getElementById("manager-password");
  const loginError = document.getElementById("manager-login-error");
  const loginSubmit = document.getElementById("manager-login-submit");
  const dashboard = document.getElementById("manager-dashboard");
  const logoutButton = document.getElementById("manager-logout");
  const refreshButton = document.getElementById("manager-refresh");
  const downloadCsvButton = document.getElementById("manager-download-csv");
  const downloadQuizCsvButton = document.getElementById("manager-download-quiz-csv");
  const openAddPromocodesButton = document.getElementById("manager-open-add-promocodes");
  const searchInput = document.getElementById("manager-search-input");
  const updatedAtNode = document.getElementById("manager-updated-at");
  const rowsCountNode = document.getElementById("manager-rows-count");
  const tableBody = document.getElementById("manager-requests-body");
  const emailsForm = document.getElementById("manager-emails-form");
  const emailSuccessSubjectNode = document.getElementById("manager-email-success-subject");
  const emailErrorSubjectNode = document.getElementById("manager-email-error-subject");
  const emailSuccessTemplateInput = document.getElementById("manager-email-success-template");
  const emailErrorTemplateInput = document.getElementById("manager-email-error-template");
  const emailsError = document.getElementById("manager-emails-error");
  const emailsSuccess = document.getElementById("manager-emails-success");
  const emailsSubmit = document.getElementById("manager-emails-submit");
  const emailsUpdatedAtNode = document.getElementById("manager-emails-updated");
  const quizForm = document.getElementById("manager-quiz-form");
  const quizConfigInput = document.getElementById("manager-quiz-config");
  const quizError = document.getElementById("manager-quiz-error");
  const quizSuccess = document.getElementById("manager-quiz-success");
  const quizSubmit = document.getElementById("manager-quiz-submit");
  const quizUpdatedAtNode = document.getElementById("manager-quiz-updated");
  const quizReloadButton = document.getElementById("manager-quiz-reload");
  const quizModeVisualButton = document.getElementById("manager-quiz-mode-visual");
  const quizModeJsonButton = document.getElementById("manager-quiz-mode-json");
  const quizVisualPanel = document.getElementById("manager-quiz-visual");
  const quizJsonPanel = document.getElementById("manager-quiz-json");
  const quizCodeWordInput = document.getElementById("manager-quiz-code-word");
  const quizLabelCorrectInput = document.getElementById("manager-quiz-label-correct");
  const quizLabelWrongInput = document.getElementById("manager-quiz-label-wrong");
  const quizSummaryHighInput = document.getElementById("manager-quiz-summary-high");
  const quizSummaryMediumInput = document.getElementById("manager-quiz-summary-medium");
  const quizSummaryLowInput = document.getElementById("manager-quiz-summary-low");
  const quizQuestionsContainer = document.getElementById("manager-quiz-questions");
  const quizAddQuestionButton = document.getElementById("manager-quiz-add-question");

  const promocodesModal = document.getElementById("manager-promocodes-modal");
  const promocodesForm = document.getElementById("manager-promocodes-form");
  const promocodesInput = document.getElementById("manager-promocodes-input");
  const promocodesError = document.getElementById("manager-promocodes-error");
  const promocodesSuccess = document.getElementById("manager-promocodes-success");
  const promocodesSubmit = document.getElementById("manager-promocodes-submit");
  const promocodesCloseButton = document.getElementById("manager-promocodes-close");
  const promocodesCancelButton = document.getElementById("manager-promocodes-cancel");

  if (
    !loginCard ||
    !loginForm ||
    !loginPasswordInput ||
    !loginError ||
    !loginSubmit ||
    !dashboard ||
    !logoutButton ||
    !refreshButton ||
    !downloadCsvButton ||
    !openAddPromocodesButton ||
    !searchInput ||
    !updatedAtNode ||
    !rowsCountNode ||
    !tableBody ||
    !emailsForm ||
    !emailSuccessSubjectNode ||
    !emailErrorSubjectNode ||
    !emailSuccessTemplateInput ||
    !emailErrorTemplateInput ||
    !emailsError ||
    !emailsSuccess ||
    !emailsSubmit ||
    !emailsUpdatedAtNode ||
    !quizForm ||
    !quizConfigInput ||
    !quizError ||
    !quizSuccess ||
    !quizSubmit ||
    !quizUpdatedAtNode ||
    !quizReloadButton ||
    !quizModeVisualButton ||
    !quizModeJsonButton ||
    !quizVisualPanel ||
    !quizJsonPanel ||
    !quizCodeWordInput ||
    !quizLabelCorrectInput ||
    !quizLabelWrongInput ||
    !quizSummaryHighInput ||
    !quizSummaryMediumInput ||
    !quizSummaryLowInput ||
    !quizQuestionsContainer ||
    !quizAddQuestionButton ||
    !promocodesModal ||
    !promocodesForm ||
    !promocodesInput ||
    !promocodesError ||
    !promocodesSuccess ||
    !promocodesSubmit ||
    !promocodesCloseButton ||
    !promocodesCancelButton
  ) {
    return;
  }

  const kpiNodes = {
    totalPromocodes: document.getElementById("kpi-total-promocodes"),
    remainingPromocodes: document.getElementById("kpi-remaining-promocodes"),
    sentPromocodes: document.getElementById("kpi-sent-promocodes"),
    totalRequests: document.getElementById("kpi-total-requests"),
    errorRequests: document.getElementById("kpi-error-requests"),
    invalidWordCount: document.getElementById("kpi-invalid-word"),
    mailSendFailedCount: document.getElementById("kpi-mail-failed"),
    noPromocodesCount: document.getElementById("kpi-no-promocodes"),
  };

  const state = {
    rows: [],
    loading: false,
    hasAuthenticated: false,
    importingPromocodes: false,
    savingEmails: false,
    savingQuiz: false,
    quizMode: "visual",
    quizDraft: null,
  };

  const defaultRefreshText = refreshButton.textContent || "Обновить данные";
  const defaultDownloadCsvText = downloadCsvButton.textContent || "Скачать CSV";
  const defaultDownloadQuizCsvText = downloadQuizCsvButton.textContent || "Скачать результаты квиза";
  const defaultPromocodesSubmitText = promocodesSubmit.textContent || "Добавить";
  const defaultEmailsSubmitText = emailsSubmit.textContent || "Сохранить письма";
  const defaultQuizSubmitText = quizSubmit.textContent || "Сохранить квиз";
  const defaultQuizReloadText = quizReloadButton.textContent || "Перезагрузить из API";

  const setLoginError = (message) => {
    loginError.textContent = message;
    loginError.classList.remove("is-hidden");
  };

  const clearLoginError = () => {
    loginError.classList.add("is-hidden");
  };

  const clearPromocodesMessages = () => {
    promocodesError.classList.add("is-hidden");
    promocodesSuccess.classList.add("is-hidden");
  };

  const setPromocodesError = (message) => {
    promocodesSuccess.classList.add("is-hidden");
    promocodesError.textContent = message;
    promocodesError.classList.remove("is-hidden");
  };

  const setPromocodesSuccess = (message) => {
    promocodesError.classList.add("is-hidden");
    promocodesSuccess.textContent = message;
    promocodesSuccess.classList.remove("is-hidden");
  };

  const clearEmailsMessages = () => {
    emailsError.classList.add("is-hidden");
    emailsSuccess.classList.add("is-hidden");
  };

  const setEmailsError = (message) => {
    emailsSuccess.classList.add("is-hidden");
    emailsError.textContent = message;
    emailsError.classList.remove("is-hidden");
  };

  const setEmailsSuccess = (message) => {
    emailsError.classList.add("is-hidden");
    emailsSuccess.textContent = message;
    emailsSuccess.classList.remove("is-hidden");
  };

  const clearQuizMessages = () => {
    quizError.classList.add("is-hidden");
    quizSuccess.classList.add("is-hidden");
  };

  const setQuizError = (message) => {
    quizSuccess.classList.add("is-hidden");
    quizError.textContent = message;
    quizError.classList.remove("is-hidden");
  };

  const setQuizSuccess = (message) => {
    quizError.classList.add("is-hidden");
    quizSuccess.textContent = message;
    quizSuccess.classList.remove("is-hidden");
  };

  const setAuthUi = (isAuthenticated) => {
    loginCard.classList.toggle("is-hidden", isAuthenticated);
    dashboard.classList.toggle("is-hidden", !isAuthenticated);
    logoutButton.classList.toggle("is-hidden", !isAuthenticated);
  };

  const setPromocodesModalOpen = (isOpen) => {
    if (isOpen) {
      promocodesModal.hidden = false;
      promocodesModal.setAttribute("aria-hidden", "false");
      requestAnimationFrame(() => promocodesModal.classList.add("is-open"));
      document.body.classList.add("modal-open");
      clearPromocodesMessages();
      promocodesInput.focus();
      return;
    }

    promocodesModal.classList.remove("is-open");
    promocodesModal.setAttribute("aria-hidden", "true");
    window.setTimeout(() => {
      if (!promocodesModal.classList.contains("is-open")) {
        promocodesModal.hidden = true;
      }
    }, 180);
    document.body.classList.remove("modal-open");
  };

  const setLoading = (value) => {
    state.loading = value;
    loginSubmit.disabled = value;
    refreshButton.disabled = value;
    downloadCsvButton.disabled = value;
    downloadQuizCsvButton.disabled = value;
    openAddPromocodesButton.disabled = value || state.importingPromocodes;
    emailsSubmit.disabled = value || state.savingEmails;
    quizSubmit.disabled = value || state.savingQuiz;
    quizReloadButton.disabled = value || state.savingQuiz;

    refreshButton.textContent = value ? "Обновление..." : defaultRefreshText;
  };

  const setImportingPromocodes = (value) => {
    state.importingPromocodes = value;
    promocodesSubmit.disabled = value;
    promocodesCancelButton.disabled = value;
    promocodesCloseButton.disabled = value;
    openAddPromocodesButton.disabled = value || state.loading;
    promocodesSubmit.textContent = value ? "Добавление..." : defaultPromocodesSubmitText;
  };

  const setSavingEmails = (value) => {
    state.savingEmails = value;
    emailsSubmit.disabled = value || state.loading;
    emailsSubmit.textContent = value ? "Сохранение..." : defaultEmailsSubmitText;
  };

  const setSavingQuiz = (value) => {
    state.savingQuiz = value;
    quizSubmit.disabled = value || state.loading;
    quizReloadButton.disabled = value || state.loading;
    quizSubmit.textContent = value ? "Сохранение..." : defaultQuizSubmitText;
  };

  const requestJson = async (url, options = {}) => {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });

    let body = null;
    try {
      body = await response.json();
    } catch (_error) {
      body = null;
    }

    return {
      ok: response.ok,
      status: response.status,
      body,
    };
  };

  const parseContentDispositionFilename = (value) => {
    if (!value) return "";

    const utfMatch = value.match(/filename\*=UTF-8''([^;]+)/i);
    if (utfMatch && utfMatch[1]) {
      try {
        return decodeURIComponent(utfMatch[1]);
      } catch (_error) {
        return utfMatch[1];
      }
    }

    const simpleMatch = value.match(/filename="?([^";]+)"?/i);
    return simpleMatch && simpleMatch[1] ? simpleMatch[1] : "";
  };

  const formatDateTime = (date, time, timestamp) => {
    if (date && time) return `${date} ${time}`;
    if (timestamp) {
      const parsed = new Date(timestamp);
      if (!Number.isNaN(parsed.getTime())) return parsed.toLocaleString("ru-RU");
    }
    return "—";
  };

  const escapeHtml = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const renderRows = () => {
    const query = searchInput.value.trim().toLowerCase();
    const rows = state.rows.filter((row) => {
      if (!query) return true;
      const haystack = [
        row.name,
        row.email,
        row.entered_word,
        row.result,
        row.promocode,
        row.ip,
        row.error_message,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });

    rowsCountNode.textContent = `${rows.length} записей`;

    if (!rows.length) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="8">По текущему фильтру записей не найдено.</td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = rows
      .map((row) => {
        const errorMessage = row.error_message || "—";
        const escapedErrorMessage = escapeHtml(errorMessage);

        return `
          <tr>
            <td>${escapeHtml(formatDateTime(row.date, row.time, row.timestamp))}</td>
            <td>${escapeHtml(row.name || "—")}</td>
            <td>${escapeHtml(row.email || "—")}</td>
            <td>${escapeHtml(row.entered_word || "—")}</td>
            <td><span class="manager-result manager-result--${escapeHtml(
              row.result === "success" ? "success" : "error"
            )}">${escapeHtml(row.result || "—")}</span></td>
            <td>${escapeHtml(row.promocode || "—")}</td>
            <td>${escapeHtml(row.ip || "—")}</td>
            <td class="manager-col-error">
              <span class="manager-error-text" title="${escapedErrorMessage}">${escapedErrorMessage}</span>
            </td>
          </tr>
        `
      })
      .join("");
  };

  const renderSummary = (summary) => {
    if (!summary) return;

    Object.entries(kpiNodes).forEach(([key, node]) => {
      if (!node) return;
      node.textContent = String(summary[key] ?? 0);
    });

    if (summary.updatedAt) {
      const parsed = new Date(summary.updatedAt);
      updatedAtNode.textContent = Number.isNaN(parsed.getTime())
        ? "Обновлено"
        : `Обновлено: ${parsed.toLocaleString("ru-RU")}`;
    } else {
      updatedAtNode.textContent = "Обновлено";
    }
  };

  const renderEmailTemplates = (templates, updatedAt = null) => {
    if (!templates) return;

    emailSuccessSubjectNode.textContent = templates.successSubject || "—";
    emailErrorSubjectNode.textContent = templates.errorSubject || "—";
    emailSuccessTemplateInput.value = String(templates.successTemplate || "");
    emailErrorTemplateInput.value = String(templates.errorTemplate || "");

    const sourceDate = updatedAt || new Date().toISOString();
    const parsed = new Date(sourceDate);
    emailsUpdatedAtNode.textContent = Number.isNaN(parsed.getTime())
      ? "Обновлено"
      : `Обновлено: ${parsed.toLocaleString("ru-RU")}`;
  };

  const cloneJson = (value) => {
    try {
      return JSON.parse(JSON.stringify(value));
    } catch (_error) {
      return null;
    }
  };

  const createDefaultQuizQuestion = (index = 0) => ({
    question: `Новый вопрос ${index + 1}`,
    paginationTitle: `Вопрос ${index + 1}`,
    options: ["Вариант 1", "Вариант 2"],
    correct: 0,
    fact: "Добавьте факт.",
    image: {
      src: "/assets/img/hero/16784.jpg",
      alt: "Изображение вопроса",
    },
  });

  const normalizeQuizQuestion = (question, index) => {
    const source = question && typeof question === "object" ? question : {};
    const normalizedOptions = Array.isArray(source.options)
      ? source.options.map((item) => String(item ?? "").trim()).filter(Boolean)
      : [];

    while (normalizedOptions.length < 2) {
      normalizedOptions.push(`Вариант ${normalizedOptions.length + 1}`);
    }

    const normalizedCorrect =
      Number.isInteger(source.correct) && source.correct >= 0 && source.correct < normalizedOptions.length ? source.correct : 0;

    return {
      question: String(source.question || `Новый вопрос ${index + 1}`),
      paginationTitle: String(source.paginationTitle || source.question || `Вопрос ${index + 1}`),
      options: normalizedOptions,
      correct: normalizedCorrect,
      fact: String(source.fact || source.feedbackCorrect || source.feedbackWrong || ""),
      image: {
        src: String(source.image?.src || "/assets/img/hero/16784.jpg"),
        alt: String(source.image?.alt || "Изображение вопроса"),
      },
    };
  };

  const normalizeQuizConfigForEditor = (quizConfig) => {
    const source = quizConfig && typeof quizConfig === "object" ? quizConfig : {};
    const sourceQuestions = Array.isArray(source.questions) ? source.questions : [];
    const normalizedQuestions = sourceQuestions.map((question, index) => normalizeQuizQuestion(question, index));

    return {
      codeWord: String(source.codeWord || ""),
      labels: {
        correct: String(source.labels?.correct || ""),
        wrong: String(source.labels?.wrong || ""),
      },
      resultSummaries: {
        high: String(source.resultSummaries?.high || ""),
        medium: String(source.resultSummaries?.medium || ""),
        low: String(source.resultSummaries?.low || ""),
      },
      questions: normalizedQuestions.length ? normalizedQuestions : [createDefaultQuizQuestion(0)],
    };
  };

  const ensureQuizDraft = () => {
    if (!state.quizDraft || typeof state.quizDraft !== "object") {
      state.quizDraft = normalizeQuizConfigForEditor({});
    }

    if (!Array.isArray(state.quizDraft.questions) || !state.quizDraft.questions.length) {
      state.quizDraft.questions = [createDefaultQuizQuestion(0)];
    }

    return state.quizDraft;
  };

  const syncQuizJsonFromDraft = () => {
    const draft = ensureQuizDraft();
    quizConfigInput.value = JSON.stringify(draft, null, 2);
  };

  const setQuizModeUi = (mode) => {
    const resolvedMode = mode === "json" ? "json" : "visual";
    state.quizMode = resolvedMode;

    const isVisual = resolvedMode === "visual";
    quizVisualPanel.classList.toggle("is-hidden", !isVisual);
    quizJsonPanel.classList.toggle("is-hidden", isVisual);

    quizModeVisualButton.classList.toggle("is-active", isVisual);
    quizModeJsonButton.classList.toggle("is-active", !isVisual);

    quizModeVisualButton.setAttribute("aria-selected", isVisual ? "true" : "false");
    quizModeJsonButton.setAttribute("aria-selected", isVisual ? "false" : "true");
  };

  const updateQuizDraftFromGlobalInputs = () => {
    const draft = ensureQuizDraft();
    draft.codeWord = String(quizCodeWordInput.value || "");
    draft.labels.correct = String(quizLabelCorrectInput.value || "");
    draft.labels.wrong = String(quizLabelWrongInput.value || "");
    draft.resultSummaries.high = String(quizSummaryHighInput.value || "");
    draft.resultSummaries.medium = String(quizSummaryMediumInput.value || "");
    draft.resultSummaries.low = String(quizSummaryLowInput.value || "");
  };

  const renderQuizQuestions = () => {
    const draft = ensureQuizDraft();

    quizQuestionsContainer.innerHTML = draft.questions
      .map((question, questionIndex) => {
        const canRemoveQuestion = draft.questions.length > 1;
        const canMoveUp = questionIndex > 0;
        const canMoveDown = questionIndex < draft.questions.length - 1;
        const canRemoveOption = question.options.length > 2;

        const optionsMarkup = question.options
          .map((option, optionIndex) => {
            const checked = question.correct === optionIndex ? "checked" : "";
            const optionValue = escapeHtml(option);
            const removeDisabled = canRemoveOption ? "" : "disabled";

            return `
              <div class="manager-quiz-option-row">
                <label class="manager-quiz-option-correct">
                  <input
                    type="radio"
                    name="manager-quiz-correct-${questionIndex}"
                    data-action="set-correct"
                    data-option-index="${optionIndex}"
                    ${checked}
                  >
                  <span>${optionIndex + 1}</span>
                </label>
                <input
                  class="manager-quiz-option-input"
                  type="text"
                  data-field="option"
                  data-option-index="${optionIndex}"
                  value="${optionValue}"
                >
                <button
                  class="manager-quiz-icon-btn"
                  type="button"
                  data-action="remove-option"
                  data-option-index="${optionIndex}"
                  ${removeDisabled}
                  aria-label="Удалить вариант"
                >
                  x
                </button>
              </div>
            `;
          })
          .join("");

        return `
          <article class="manager-quiz-question" data-question-index="${questionIndex}">
            <header class="manager-quiz-question__head">
              <h4>Вопрос ${questionIndex + 1}</h4>
              <div class="manager-quiz-question__actions">
                <button class="manager-quiz-icon-btn" type="button" data-action="move-up" ${canMoveUp ? "" : "disabled"} aria-label="Переместить вверх">^</button>
                <button class="manager-quiz-icon-btn" type="button" data-action="move-down" ${canMoveDown ? "" : "disabled"} aria-label="Переместить вниз">v</button>
                <button class="manager-quiz-icon-btn" type="button" data-action="remove-question" ${canRemoveQuestion ? "" : "disabled"} aria-label="Удалить вопрос">x</button>
              </div>
            </header>

            <div class="manager-quiz-question__grid">
              <label class="manager-email-field">
                <span>Текст вопроса</span>
                <textarea data-field="question" rows="2">${escapeHtml(question.question)}</textarea>
              </label>

              <label class="manager-email-field">
                <span>Заголовок в пагинации</span>
                <input type="text" data-field="paginationTitle" value="${escapeHtml(question.paginationTitle)}">
              </label>

              <label class="manager-email-field">
                <span>Путь к изображению</span>
                <input type="text" data-field="imageSrc" value="${escapeHtml(question.image.src)}">
              </label>

              <label class="manager-email-field">
                <span>Alt изображения</span>
                <input type="text" data-field="imageAlt" value="${escapeHtml(question.image.alt)}">
              </label>

              <label class="manager-email-field">
                <span>Факт</span>
                <textarea data-field="fact" rows="3">${escapeHtml(question.fact)}</textarea>
              </label>
            </div>

            <div class="manager-quiz-options">
              <div class="manager-quiz-options__head">
                <strong>Варианты</strong>
                <button class="btn btn-secondary" type="button" data-action="add-option">+ Добавить вариант</button>
              </div>
              <div class="manager-quiz-options__list">${optionsMarkup}</div>
            </div>
          </article>
        `;
      })
      .join("");
  };

  const renderQuizVisualEditor = () => {
    const draft = ensureQuizDraft();

    quizCodeWordInput.value = draft.codeWord;
    quizLabelCorrectInput.value = draft.labels.correct;
    quizLabelWrongInput.value = draft.labels.wrong;
    quizSummaryHighInput.value = draft.resultSummaries.high;
    quizSummaryMediumInput.value = draft.resultSummaries.medium;
    quizSummaryLowInput.value = draft.resultSummaries.low;

    renderQuizQuestions();
  };

  const getQuizQuestionContext = (target) => {
    if (!(target instanceof HTMLElement)) return null;

    const questionElement = target.closest("[data-question-index]");
    if (!questionElement) return null;

    const questionIndex = Number(questionElement.getAttribute("data-question-index"));
    if (!Number.isInteger(questionIndex)) return null;

    const draft = ensureQuizDraft();
    const question = draft.questions[questionIndex];
    if (!question) return null;

    return { draft, question, questionIndex };
  };

  const applyJsonToQuizDraft = () => {
    const rawQuizConfig = String(quizConfigInput.value || "");
    if (!rawQuizConfig.trim()) {
      setQuizError("Конфигурация квиза пустая.");
      return false;
    }

    let parsedQuizConfig;
    try {
      parsedQuizConfig = JSON.parse(rawQuizConfig);
    } catch (_error) {
      setQuizError("Невалидный формат JSON.");
      return false;
    }

    state.quizDraft = normalizeQuizConfigForEditor(parsedQuizConfig);
    renderQuizVisualEditor();
    clearQuizMessages();
    return true;
  };

  const switchQuizMode = (mode) => {
    if (mode === state.quizMode) return;

    if (mode === "visual") {
      if (!applyJsonToQuizDraft()) {
        setQuizModeUi("json");
        return;
      }
      setQuizModeUi("visual");
      return;
    }

    updateQuizDraftFromGlobalInputs();
    syncQuizJsonFromDraft();
    setQuizModeUi("json");
  };

  const renderQuizConfig = (quizConfig, updatedAt = null) => {
    if (!quizConfig || typeof quizConfig !== "object") return;

    state.quizDraft = normalizeQuizConfigForEditor(quizConfig);
    renderQuizVisualEditor();
    syncQuizJsonFromDraft();
    setQuizModeUi(state.quizMode);

    const sourceDate = updatedAt || new Date().toISOString();
    const parsed = new Date(sourceDate);
    quizUpdatedAtNode.textContent = Number.isNaN(parsed.getTime()) ? "Обновлено" : `Обновлено: ${parsed.toLocaleString("ru-RU")}`;
  };

  const handleQuizQuestionInput = (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return;

    const context = getQuizQuestionContext(target);
    if (!context) return;

    const { question } = context;
    const field = String(target.dataset.field || "");

    if (field === "option") {
      const optionIndex = Number(target.dataset.optionIndex);
      if (!Number.isInteger(optionIndex) || optionIndex < 0 || optionIndex >= question.options.length) return;
      question.options[optionIndex] = String(target.value || "");
      return;
    }

    if (field === "question") {
      question.question = String(target.value || "");
      return;
    }

    if (field === "paginationTitle") {
      question.paginationTitle = String(target.value || "");
      return;
    }

    if (field === "fact") {
      question.fact = String(target.value || "");
      return;
    }

    if (field === "imageSrc") {
      question.image.src = String(target.value || "");
      return;
    }

    if (field === "imageAlt") {
      question.image.alt = String(target.value || "");
    }
  };

  const handleQuizQuestionChange = (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (target.dataset.action !== "set-correct") return;

    const context = getQuizQuestionContext(target);
    if (!context) return;

    const optionIndex = Number(target.dataset.optionIndex);
    if (!Number.isInteger(optionIndex) || optionIndex < 0 || optionIndex >= context.question.options.length) return;

    context.question.correct = optionIndex;
  };

  const moveQuizQuestion = (questionIndex, direction) => {
    const draft = ensureQuizDraft();
    const nextIndex = questionIndex + direction;

    if (nextIndex < 0 || nextIndex >= draft.questions.length) return;

    const [entry] = draft.questions.splice(questionIndex, 1);
    draft.questions.splice(nextIndex, 0, entry);
    renderQuizQuestions();
  };

  const removeQuizOption = (context, optionIndex) => {
    if (context.question.options.length <= 2) {
      setQuizError("У каждого вопроса должно быть минимум два варианта.");
      return;
    }

    const previousCorrect = context.question.correct;
    context.question.options.splice(optionIndex, 1);

    if (previousCorrect === optionIndex) {
      context.question.correct = Math.max(0, Math.min(optionIndex, context.question.options.length - 1));
    } else if (previousCorrect > optionIndex) {
      context.question.correct = previousCorrect - 1;
    } else {
      context.question.correct = previousCorrect;
    }

    clearQuizMessages();
    renderQuizQuestions();
  };

  const handleQuizQuestionClick = (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const actionButton = target.closest("[data-action]");
    if (!actionButton) return;

    const context = getQuizQuestionContext(actionButton);
    if (!context) return;

    const action = actionButton.getAttribute("data-action");
    if (!action) return;

    if (action === "move-up") {
      moveQuizQuestion(context.questionIndex, -1);
      clearQuizMessages();
      return;
    }

    if (action === "move-down") {
      moveQuizQuestion(context.questionIndex, 1);
      clearQuizMessages();
      return;
    }

    if (action === "remove-question") {
      if (context.draft.questions.length <= 1) {
        setQuizError("В квизе должен быть хотя бы один вопрос.");
        return;
      }

      context.draft.questions.splice(context.questionIndex, 1);
      clearQuizMessages();
      renderQuizQuestions();
      return;
    }

    if (action === "add-option") {
      context.question.options.push(`Вариант ${context.question.options.length + 1}`);
      clearQuizMessages();
      renderQuizQuestions();
      return;
    }

    if (action === "remove-option") {
      const optionIndex = Number(actionButton.getAttribute("data-option-index"));
      if (!Number.isInteger(optionIndex) || optionIndex < 0 || optionIndex >= context.question.options.length) return;
      removeQuizOption(context, optionIndex);
    }
  };

  const addQuizQuestion = () => {
    const draft = ensureQuizDraft();
    draft.questions.push(createDefaultQuizQuestion(draft.questions.length));
    clearQuizMessages();
    renderQuizQuestions();
  };

  const reloadQuizConfig = async () => {
    if (state.loading || state.savingQuiz) return;

    clearQuizMessages();
    quizReloadButton.disabled = true;
    quizReloadButton.textContent = "Загрузка...";

    try {
      const response = await requestJson("/api/manager/quiz");

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        setQuizError(response.body?.message || "Не удалось загрузить конфигурацию квиза.");
        return;
      }

      renderQuizConfig(
        response.body?.data?.quizConfig || null,
        response.body?.data?.updatedAt || new Date().toISOString()
      );
      setQuizSuccess("Конфигурация квиза перезагружена.");
    } finally {
      quizReloadButton.disabled = state.loading || state.savingQuiz;
      quizReloadButton.textContent = defaultQuizReloadText;
    }
  };

  const handleUnauthorized = () => {
    setAuthUi(false);
    setPromocodesModalOpen(false);
    clearEmailsMessages();
    clearQuizMessages();

    if (state.hasAuthenticated) {
      setLoginError("Сессия истекла. Введите пароль снова.");
    } else {
      clearLoginError();
    }
  };

  const loadDashboardData = async () => {
    setLoading(true);

    try {
      const [summaryResponse, rowsResponse, emailsResponse, quizResponse] = await Promise.all([
        requestJson("/api/manager/summary"),
        requestJson("/api/manager/requests?limit=500"),
        requestJson("/api/manager/emails"),
        requestJson("/api/manager/quiz"),
      ]);

      if (
        summaryResponse.status === 401 ||
        rowsResponse.status === 401 ||
        emailsResponse.status === 401 ||
        quizResponse.status === 401
      ) {
        handleUnauthorized();
        return;
      }

      if (!summaryResponse.ok || !rowsResponse.ok) {
        setLoginError("\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044c \u0434\u0430\u043d\u043d\u044b\u0435 \u0434\u0430\u0448\u0431\u043e\u0440\u0434\u0430.");
        return;
      }

      clearLoginError();
      setAuthUi(true);
      state.hasAuthenticated = true;

      renderSummary(summaryResponse.body?.data || {});
      state.rows = Array.isArray(rowsResponse.body?.data) ? rowsResponse.body.data : [];
      renderRows();

      if (emailsResponse.ok) {
        renderEmailTemplates(emailsResponse.body?.data || {}, new Date().toISOString());
        clearEmailsMessages();
      } else {
        setEmailsError("\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044c \u0448\u0430\u0431\u043b\u043e\u043d\u044b \u043f\u0438\u0441\u0435\u043c.");
      }

      if (quizResponse.ok) {
        renderQuizConfig(
          quizResponse.body?.data?.quizConfig || null,
          quizResponse.body?.data?.updatedAt || new Date().toISOString()
        );
        clearQuizMessages();
      } else {
        setQuizError(quizResponse.body?.message || "\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044c \u043a\u043e\u043d\u0444\u0438\u0433\u0443\u0440\u0430\u0446\u0438\u044e \u043a\u0432\u0438\u0437\u0430.");
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (password) => {
    const response = await requestJson("/api/manager/login", {
      method: "POST",
      body: JSON.stringify({ password }),
    });

    if (response.ok) {
      clearLoginError();
      setAuthUi(true);
      await loadDashboardData();
      return;
    }

    if (response.status === 503) {
      setLoginError("Дашборд не настроен на сервере. Добавьте MANAGER_DASHBOARD_PASSWORD.");
      return;
    }

    setLoginError("Неверный пароль.");
  };

  const logout = async () => {
    await requestJson("/api/manager/logout", {
      method: "POST",
      body: JSON.stringify({}),
    });

    setAuthUi(false);
    setPromocodesModalOpen(false);
    state.hasAuthenticated = false;
    loginPasswordInput.value = "";
    state.rows = [];
    emailSuccessTemplateInput.value = "";
    emailErrorTemplateInput.value = "";
    emailSuccessSubjectNode.textContent = "";
    emailErrorSubjectNode.textContent = "";
    emailsUpdatedAtNode.textContent = "Не обновлялось";
    quizUpdatedAtNode.textContent = "Не обновлялось";
    quizConfigInput.value = "";
    quizCodeWordInput.value = "";
    quizLabelCorrectInput.value = "";
    quizLabelWrongInput.value = "";
    quizSummaryHighInput.value = "";
    quizSummaryMediumInput.value = "";
    quizSummaryLowInput.value = "";
    quizQuestionsContainer.innerHTML = "";
    quizReloadButton.textContent = defaultQuizReloadText;
    state.quizDraft = null;
    state.quizMode = "visual";
    setQuizModeUi("visual");
    renderRows();
    clearLoginError();
    clearEmailsMessages();
    clearQuizMessages();
  };

  const downloadCsv = async () => {
    downloadCsvButton.disabled = true;
    downloadCsvButton.textContent = "Скачивание...";

    try {
      const response = await fetch("/api/manager/requests.csv");

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        setLoginError("Не удалось скачать CSV.");
        return;
      }

      const blob = await response.blob();
      const disposition = response.headers.get("content-disposition");
      const filename = parseContentDispositionFilename(disposition) || "requests.csv";

      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (_error) {
      setLoginError("Не удалось скачать CSV.");
    } finally {
      downloadCsvButton.disabled = false;
      downloadCsvButton.textContent = defaultDownloadCsvText;
    }
  };

  const importPromocodes = async () => {
    clearPromocodesMessages();
    const codesText = String(promocodesInput.value || "");

    if (!codesText.trim()) {
      setPromocodesError("Вставьте хотя бы один промокод.");
      return;
    }

    setImportingPromocodes(true);

    try {
      const response = await requestJson("/api/manager/promocodes/import", {
        method: "POST",
        body: JSON.stringify({ codesText }),
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        const message = response.body?.message || "Не удалось добавить промокоды.";
        setPromocodesError(message);
        return;
      }

      const data = response.body?.data || {};
      const addedCount = Number(data.addedCount || 0);
      const duplicateCount = Number(data.duplicateCount || 0);
      const invalidCount = Number(data.invalidCount || 0);

      setPromocodesSuccess(
        `Добавлено: ${addedCount}. Дубликатов: ${duplicateCount}. Невалидных строк: ${invalidCount}.`
      );
      promocodesInput.value = "";
      await loadDashboardData();
    } finally {
      setImportingPromocodes(false);
    }
  };

  const saveEmailTemplates = async () => {
    clearEmailsMessages();

    const successTemplate = String(emailSuccessTemplateInput.value || "");
    const errorTemplate = String(emailErrorTemplateInput.value || "");

    if (!successTemplate.trim() || !errorTemplate.trim()) {
      setEmailsError("Заполните оба шаблона писем.");
      return;
    }

    if (!successTemplate.includes("[promocode]")) {
      setEmailsError("В шаблоне успешного письма должен быть маркер [promocode].");
      return;
    }

    setSavingEmails(true);

    try {
      const response = await requestJson("/api/manager/emails", {
        method: "POST",
        body: JSON.stringify({
          successTemplate,
          errorTemplate,
        }),
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        const message = response.body?.message || "Не удалось сохранить шаблоны писем.";
        setEmailsError(message);
        return;
      }

      const savedAt = response.body?.data?.savedAt || new Date().toISOString();
      renderEmailTemplates(
        {
          successSubject: response.body?.data?.successSubject || emailSuccessSubjectNode.textContent,
          errorSubject: response.body?.data?.errorSubject || emailErrorSubjectNode.textContent,
          successTemplate,
          errorTemplate,
        },
        savedAt
      );
      setEmailsSuccess("Шаблоны писем сохранены.");
    } finally {
      setSavingEmails(false);
    }
  };

  const saveQuizConfig = async () => {
    clearQuizMessages();

    let parsedQuizConfig;

    if (state.quizMode === "json") {
      const rawQuizConfig = String(quizConfigInput.value || "");
      if (!rawQuizConfig.trim()) {
        setQuizError("Конфигурация квиза пустая.");
        return;
      }

      try {
        parsedQuizConfig = JSON.parse(rawQuizConfig);
      } catch (_error) {
        setQuizError("Невалидный формат JSON.");
        return;
      }
    } else {
      updateQuizDraftFromGlobalInputs();
      parsedQuizConfig = cloneJson(ensureQuizDraft());
      if (!parsedQuizConfig) {
        setQuizError("Не удалось сформировать конфигурацию квиза.");
        return;
      }
      syncQuizJsonFromDraft();
    }

    setSavingQuiz(true);

    try {
      const response = await requestJson("/api/manager/quiz", {
        method: "POST",
        body: JSON.stringify({ quizConfig: parsedQuizConfig }),
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        const message = response.body?.message || "Не удалось сохранить конфигурацию квиза.";
        setQuizError(message);
        return;
      }

      const savedQuiz = response.body?.data?.quizConfig || parsedQuizConfig;
      const savedAt = response.body?.data?.updatedAt || new Date().toISOString();
      renderQuizConfig(savedQuiz, savedAt);
      setQuizSuccess("Конфигурация квиза сохранена.");
    } finally {
      setSavingQuiz(false);
    }
  };

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearLoginError();
    const password = String(loginPasswordInput.value || "");

    if (!password.trim()) {
      setLoginError("Введите пароль.");
      return;
    }

    await login(password);
  });

  refreshButton.addEventListener("click", () => {
    if (!state.loading) loadDashboardData();
  });

  downloadCsvButton.addEventListener("click", () => {
    if (!state.loading) downloadCsv();
  });

  downloadQuizCsvButton.addEventListener("click", async () => {
    if (state.loading) return;
    downloadQuizCsvButton.disabled = true;
    downloadQuizCsvButton.textContent = "Скачивание...";
    try {
      const response = await fetch("/api/manager/quiz-results.csv");
      if (response.status === 401) { handleUnauthorized(); return; }
      if (!response.ok) { setLoginError("Не удалось скачать CSV квиза."); return; }
      const blob = await response.blob();
      const disposition = response.headers.get("content-disposition");
      const filename = parseContentDispositionFilename(disposition) || "quiz-results.csv";
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (_error) {
      setLoginError("Не удалось скачать CSV квиза.");
    } finally {
      downloadQuizCsvButton.disabled = false;
      downloadQuizCsvButton.textContent = defaultDownloadQuizCsvText;
    }
  });

  openAddPromocodesButton.addEventListener("click", () => {
    if (!state.loading) {
      setPromocodesModalOpen(true);
    }
  });

  promocodesForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!state.importingPromocodes) {
      await importPromocodes();
    }
  });

  emailsForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!state.savingEmails) {
      await saveEmailTemplates();
    }
  });

  quizForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!state.savingQuiz) {
      await saveQuizConfig();
    }
  });

  quizModeVisualButton.addEventListener("click", () => {
    switchQuizMode("visual");
  });

  quizModeJsonButton.addEventListener("click", () => {
    switchQuizMode("json");
  });

  quizReloadButton.addEventListener("click", async () => {
    await reloadQuizConfig();
  });

  quizAddQuestionButton.addEventListener("click", () => {
    addQuizQuestion();
  });

  [
    quizCodeWordInput,
    quizLabelCorrectInput,
    quizLabelWrongInput,
    quizSummaryHighInput,
    quizSummaryMediumInput,
    quizSummaryLowInput,
  ].forEach((input) => {
    input.addEventListener("input", () => {
      updateQuizDraftFromGlobalInputs();
    });
  });

  quizQuestionsContainer.addEventListener("input", handleQuizQuestionInput);
  quizQuestionsContainer.addEventListener("change", handleQuizQuestionChange);
  quizQuestionsContainer.addEventListener("click", handleQuizQuestionClick);

  promocodesCloseButton.addEventListener("click", () => {
    if (!state.importingPromocodes) setPromocodesModalOpen(false);
  });

  promocodesCancelButton.addEventListener("click", () => {
    if (!state.importingPromocodes) setPromocodesModalOpen(false);
  });

  promocodesModal.addEventListener("mousedown", (event) => {
    if (event.target === promocodesModal && !state.importingPromocodes) {
      setPromocodesModalOpen(false);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && promocodesModal.classList.contains("is-open") && !state.importingPromocodes) {
      setPromocodesModalOpen(false);
    }
  });

  searchInput.addEventListener("input", renderRows);
  logoutButton.addEventListener("click", logout);

  setQuizModeUi("visual");
  loadDashboardData();
})();

