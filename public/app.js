(() => {
  "use strict";

  const prefersReducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const prefersReducedMotion = () => prefersReducedMotionQuery.matches;

  const sectionsForSpy = ["how", "quiz", "prizes", "tires", "winners", "faq"];
  const header = document.querySelector("[data-header]");
  const heroIntro = document.querySelector(".hero--immersive");

  const drawer = document.querySelector("[data-drawer]");
  const drawerToggle = document.querySelector("[data-menu-toggle]");
  const drawerClose = document.querySelector("[data-menu-close]");

  const modals = Array.from(document.querySelectorAll("[data-modal]"));
  let activeModal = null;
  let lastFocusedElement = null;
  let releaseFocusTrap = null;

  const syncBodyLock = () => {
    const hasOpenModal = Boolean(document.querySelector(".modal.is-open"));
    const hasOpenDrawer = Boolean(drawer && drawer.classList.contains("is-open"));
    document.body.classList.toggle("modal-open", hasOpenModal || hasOpenDrawer);
  };

  const updateHeaderState = () => {
    if (!header) return;

    header.classList.toggle("is-sticky", window.scrollY > 8);

    if (!heroIntro) {
      header.classList.remove("is-on-hero");
      return;
    }

    const heroBoundary = heroIntro.offsetTop + heroIntro.offsetHeight - header.offsetHeight;
    header.classList.toggle("is-on-hero", window.scrollY < heroBoundary);
  };

  const openDrawer = () => {
    if (!drawer) return;
    drawer.hidden = false;
    requestAnimationFrame(() => drawer.classList.add("is-open"));
    if (drawerToggle) drawerToggle.setAttribute("aria-expanded", "true");
    syncBodyLock();
  };

  const closeDrawer = (immediate = false) => {
    if (!drawer) return;
    drawer.classList.remove("is-open");
    if (drawerToggle) drawerToggle.setAttribute("aria-expanded", "false");

    const close = () => {
      if (!drawer.classList.contains("is-open")) drawer.hidden = true;
      syncBodyLock();
    };

    if (immediate) {
      close();
    } else {
      window.setTimeout(close, 260);
    }
  };

  const getFocusableElements = (container) => {
    const selector =
      'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
    return Array.from(container.querySelectorAll(selector)).filter(
      (el) => el.offsetParent !== null || el === document.activeElement
    );
  };

  const trapFocus = (modal) => {
    const onKeydown = (event) => {
      if (event.key !== "Tab") return;

      const focusable = getFocusableElements(modal);
      if (!focusable.length) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    modal.addEventListener("keydown", onKeydown);
    return () => modal.removeEventListener("keydown", onKeydown);
  };

  const resetWordModal = () => {
    const modal = document.getElementById("word-modal");
    const wordForm = document.getElementById("word-form");
    const otpGroup = document.querySelector("#word-form [data-otp-group]");
    const codeStep = document.getElementById("word-code-step");
    const contactStep = document.getElementById("word-contact-step");
    const contactForm = document.getElementById("contact-form");
    const contactSubmit = document.getElementById("contact-submit");
    const wordError = document.getElementById("word-error");
    const nameError = document.getElementById("contact-name-error");
    const emailError = document.getElementById("contact-email-error");
    const nameInput = document.getElementById("contact-name");
    const emailInput = document.getElementById("contact-email");
    const confirmedCode = document.getElementById("confirmed-code");
    const wordSuccess = document.getElementById("word-success");

    if (!wordForm || !wordError || !wordSuccess || !codeStep || !contactStep || !contactForm) return;

    wordForm.reset();
    contactForm.reset();

    if (otpGroup) {
      otpGroup.classList.remove("is-error", "is-shaking");
      otpGroup.querySelectorAll("input").forEach((input) => {
        input.value = "";
        input.classList.remove("is-filled", "is-active", "is-invalid");
      });
    }

    codeStep.classList.remove("is-hidden", "is-entering");
    contactStep.classList.add("is-hidden");
    contactStep.classList.remove("is-entering");
    wordSuccess.classList.add("is-hidden");
    wordSuccess.classList.remove("is-entering");
    wordError.classList.add("is-hidden");
    if (nameError) nameError.classList.add("is-hidden");
    if (emailError) {
      emailError.classList.add("is-hidden");
      if (emailError.dataset.defaultText) emailError.textContent = emailError.dataset.defaultText;
    }
    if (nameInput) {
      nameInput.classList.remove("is-invalid");
      delete nameInput.dataset.touched;
    }
    if (emailInput) {
      emailInput.classList.remove("is-invalid");
      delete emailInput.dataset.touched;
    }
    delete contactForm.dataset.submitted;
    if (confirmedCode) confirmedCode.textContent = "";
    if (modal) {
      modal.classList.remove("is-code-confirmed", "is-success");
    }

    const submit = document.getElementById("word-submit");
    if (submit) submit.disabled = true;
    if (contactSubmit) {
      contactSubmit.disabled = true;
      if (contactSubmit.dataset.defaultText) {
        contactSubmit.textContent = contactSubmit.dataset.defaultText;
      }
    }
  };

  const openModal = (modalId) => {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    closeDrawer();

    if (activeModal && activeModal !== modal) {
      activeModal.classList.remove("is-open");
      activeModal.hidden = true;
      activeModal.setAttribute("aria-hidden", "true");
    }

    activeModal = modal;
    lastFocusedElement = document.activeElement;

    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");

    requestAnimationFrame(() => modal.classList.add("is-open"));

    if (releaseFocusTrap) releaseFocusTrap();
    releaseFocusTrap = trapFocus(modal);

    const focusTarget = modal.querySelector("input, button, a[href], [tabindex]:not([tabindex='-1'])");
    if (focusTarget instanceof HTMLElement) focusTarget.focus();

    syncBodyLock();
  };

  const closeModal = (modalId = "", restoreFocus = true) => {
    const modal = modalId ? document.getElementById(modalId) : activeModal;
    if (!modal) return;

    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");

    if (releaseFocusTrap) {
      releaseFocusTrap();
      releaseFocusTrap = null;
    }

    window.setTimeout(() => {
      if (!modal.classList.contains("is-open")) {
        modal.hidden = true;
        if (modal.id === "word-modal") resetWordModal();
      }
    }, 180);

    if (activeModal === modal) activeModal = null;

    if (restoreFocus && lastFocusedElement instanceof HTMLElement) {
      lastFocusedElement.focus();
    }

    syncBodyLock();
  };

  const setupAnchorScroll = () => {
    document.addEventListener("click", (event) => {
      const link = event.target.closest('a[href^="#"]');
      if (!link) return;

      const href = link.getAttribute("href");
      if (!href || href === "#") return;

      const target = document.querySelector(href);
      if (!target) return;

      event.preventDefault();
      closeDrawer();

      target.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });

      if (history.replaceState) {
        history.replaceState(null, "", href);
      }
    });
  };

  const setupScrollSpy = () => {
    const sections = sectionsForSpy
      .map((id) => document.getElementById(id))
      .filter((section) => section instanceof HTMLElement);

    const links = Array.from(document.querySelectorAll("a[data-spy]"));
    if (!sections.length || !links.length) return;

    const setActive = (id) => {
      links.forEach((link) => {
        link.classList.toggle("is-active", link.getAttribute("href") === `#${id}`);
      });
    };

    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );

    sections.forEach((section) => spy.observe(section));
  };

  const setupRevealAnimations = () => {
    const revealItems = Array.from(document.querySelectorAll("[data-reveal]"));
    if (!revealItems.length) return;

    if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
      revealItems.forEach((node) => node.classList.add("is-visible"));
      return;
    }

    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.16 }
    );

    revealItems.forEach((node) => revealObserver.observe(node));
  };

  const setupLazyImages = () => {
    const lazyImages = Array.from(document.querySelectorAll("img[data-src]"));
    if (!lazyImages.length) return;

    const loadImage = (img) => {
      const src = img.getAttribute("data-src");
      if (!src) return;
      img.src = src;
      img.removeAttribute("data-src");
      img.addEventListener("load", () => img.classList.add("is-loaded"), { once: true });
    };

    if (!("IntersectionObserver" in window)) {
      lazyImages.forEach(loadImage);
      return;
    }

    const lazyObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            loadImage(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "120px 0px" }
    );

    lazyImages.forEach((img) => lazyObserver.observe(img));
  };

  const setupPrizeDescriptions = () => {
    const cards = Array.from(document.querySelectorAll(".prize-card"));
    if (!cards.length) return;

    const items = cards
      .map((card, index) => {
        const description = card.querySelector(".prize-card__desc");
        const toggle = card.querySelector("[data-prize-toggle]");
        if (!description || !toggle) return null;

        if (!description.id) {
          description.id = `prize-desc-${index + 1}`;
        }
        toggle.setAttribute("aria-controls", description.id);
        return { card, description, toggle };
      })
      .filter(Boolean);
    if (!items.length) return;

    const setExpandedState = (item, expanded) => {
      item.card.classList.toggle("is-expanded", expanded);
      item.toggle.setAttribute("aria-expanded", String(expanded));
      item.toggle.textContent = expanded ? "Свернуть" : "Развернуть";
    };

    const syncItem = (item) => {
      const computed = window.getComputedStyle(item.description);
      const lineHeight = parseFloat(computed.lineHeight) || 24;
      const lines = parseFloat(computed.getPropertyValue("--prize-desc-lines")) || 3;
      const collapsedHeight = lineHeight * lines;
      const prevMaxHeight = item.description.style.maxHeight;
      item.description.style.maxHeight = "none";
      const fullHeight = item.description.scrollHeight;
      item.description.style.maxHeight = prevMaxHeight;

      item.description.style.setProperty("--prize-desc-max", `${Math.ceil(fullHeight)}px`);

      const canExpand = fullHeight > collapsedHeight + 2;
      item.toggle.hidden = !canExpand;
      item.toggle.disabled = !canExpand;

      if (!canExpand) {
        setExpandedState(item, false);
        return;
      }

      setExpandedState(item, item.card.classList.contains("is-expanded"));
    };

    const syncAll = () => {
      items.forEach((item) => syncItem(item));
    };

    items.forEach((item) => {
      item.toggle.addEventListener("click", () => {
        if (item.toggle.hidden || item.toggle.disabled) return;

        const shouldExpand = !item.card.classList.contains("is-expanded");
        if (shouldExpand) {
          items.forEach((entry) => {
            if (entry !== item) {
              setExpandedState(entry, false);
            }
          });
        }

        setExpandedState(item, shouldExpand);
      });
    });

    let resizeRaf = 0;
    window.addEventListener("resize", () => {
      if (resizeRaf) {
        window.cancelAnimationFrame(resizeRaf);
      }
      resizeRaf = window.requestAnimationFrame(() => {
        syncAll();
        resizeRaf = 0;
      });
    });

    window.addEventListener("load", syncAll, { once: true });
    syncAll();
  };

  const setupPrizeCarousel = () => {
    const carousels = Array.from(document.querySelectorAll("[data-prize-carousel]"));
    if (!carousels.length) return;

    carousels.forEach((carousel) => {
      const track = carousel.querySelector("[data-carousel-track]");
      const prevButton = carousel.querySelector("[data-carousel-prev]");
      const nextButton = carousel.querySelector("[data-carousel-next]");
      if (!track || !prevButton || !nextButton) return;

      const getStep = () => {
        const firstCard = track.querySelector(".prize-card");
        if (!firstCard) return track.clientWidth;
        const gap = parseFloat(window.getComputedStyle(track).gap || "0") || 0;
        return firstCard.getBoundingClientRect().width + gap;
      };

      const updateState = () => {
        const maxScrollLeft = track.scrollWidth - track.clientWidth - 1;
        prevButton.disabled = track.scrollLeft <= 1;
        nextButton.disabled = track.scrollLeft >= maxScrollLeft;
      };

      const move = (direction) => {
        track.scrollBy({
          left: direction * getStep(),
          behavior: prefersReducedMotion() ? "auto" : "smooth",
        });
      };

      prevButton.addEventListener("click", () => move(-1));
      nextButton.addEventListener("click", () => move(1));

      track.addEventListener(
        "keydown",
        (event) => {
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            move(-1);
          }
          if (event.key === "ArrowRight") {
            event.preventDefault();
            move(1);
          }
        },
        { passive: false }
      );

      track.addEventListener("scroll", updateState, { passive: true });
      window.addEventListener("resize", updateState);

      updateState();
    });
  };
  const setupQuizProgressUi = async () => {
    const quizCard = document.querySelector("#quiz .quiz-card");
    if (!quizCard) return;

    const quizMain = quizCard.querySelector(".quiz-layout__main");
    const pageButtons = Array.from(quizCard.querySelectorAll(".quiz-page-list .quiz-page-num"));
    const prevButton = quizCard.querySelector(".quiz-page-btn:not(.quiz-page-btn--next)");
    const nextButton = quizCard.querySelector(".quiz-page-btn--next");
    const resultStepButton = quizCard.querySelector("[data-quiz-result-step]");
    const resultStepLottieContainer = quizCard.querySelector("[data-quiz-lock-lottie]");
    const questionBlock = quizCard.querySelector(".quiz-question");
    const questionIndex = quizCard.querySelector(".quiz-question__index");
    const questionTitle = quizCard.querySelector(".quiz-question__title");
    const questionVisualImage = quizCard.querySelector(".quiz-layout__visual img");
    const optionsBlock = quizCard.querySelector(".quiz-options");
    const answerButtons = Array.from(quizCard.querySelectorAll(".quiz-option"));
    const pagination = quizCard.querySelector(".quiz-pagination");
    const feedbackBlock = quizCard.querySelector("[data-quiz-feedback]");
    const feedbackStatus = quizCard.querySelector("[data-quiz-feedback-status]");
    const feedbackText = quizCard.querySelector("[data-quiz-feedback-text]");
    const feedbackRetryButton = quizCard.querySelector("[data-quiz-feedback-retry]");
    const feedbackRetryText = quizCard.querySelector("[data-quiz-feedback-retry-text]");
    const feedbackRetryRefreshIcon = quizCard.querySelector(".quiz-feedback__icon-refresh");
    const feedbackRetryNextIcon = quizCard.querySelector(".quiz-feedback__icon-next");
    const resultBlock = quizCard.querySelector("[data-quiz-result]");
    const resultPercent = quizCard.querySelector("[data-quiz-result-percent]");
    const resultCorrect = quizCard.querySelector("[data-quiz-correct]");
    const resultTotal = quizCard.querySelector("[data-quiz-total]");
    const resultWrong = quizCard.querySelector("[data-quiz-wrong]");
    const resultSummary = quizCard.querySelector("[data-quiz-summary]");
    const resultCodeWord = quizCard.querySelector(".quiz-result__code strong");
    const resultClaimFormWrap = quizCard.querySelector("[data-quiz-claim-form-wrap]");
    const resultClaimForm = quizCard.querySelector("[data-quiz-claim-form]");
    const resultClaimError = quizCard.querySelector("[data-quiz-claim-error]");
    const resultClaimSuccess = quizCard.querySelector("[data-quiz-claim-success]");
    const progressRing = quizCard.querySelector("[data-quiz-progress]");
    const progressValue = quizCard.querySelector("[data-quiz-progress-value]");

    if (!pageButtons.length || !progressRing || !progressValue || !answerButtons.length) return;

    const createDefaultQuizConfig = () => ({
      codeWord: "SUMMER",
      labels: {
        correct: "Да, верно!",
        wrong: "Нет, неверно.",
      },
      resultSummaries: {
        high: "Отличный результат. Вы уверенно ориентируетесь в базовых параметрах подбора шин.",
        medium: "Хороший результат. Вы знаете основные принципы, но есть точки для усиления.",
        low: "Базовый результат. Рекомендуем еще раз пройти квиз и освежить ключевые правила выбора шин.",
      },
      questions: [
        {
          question: "Какая модель летних шин Cordiant обеспечивает экономию топлива до 30% по сравнению с предшественником?",
          paginationTitle: "Какая модель летних шин Cordiant обеспечивает экономию топлива до 30% по сравнению с предшественником?",
          options: ["Cordiant Gravity", "Cordiant Run Tour", "Cordiant Off Road 2"],
          correct: 1,
          fact: "Оптимизированный состав резиновой смеси и облегченный брекерный пакет в модели Cordiant Run Tour способствуют снижению сопротивления качению и экономии топлива до 30% по сравнению с шиной-предшественником.",
          image: {
            src: "assets/img/quiz/1.jpg",
            alt: "Шина Cordiant Run Tour",
          },
        },
      ],
    });

    const normalizeQuizConfig = (rawConfig) => {
      const fallbackConfig = createDefaultQuizConfig();

      if (!rawConfig || typeof rawConfig !== "object") {
        return fallbackConfig;
      }

      const fallbackQuestions = fallbackConfig.questions;
      const sourceQuestions = Array.isArray(rawConfig.questions) ? rawConfig.questions : [];
      const normalizedQuestions = sourceQuestions
        .map((entry, index) => {
          if (!entry || typeof entry !== "object") return null;

          const fallbackQuestion = fallbackQuestions[index] || fallbackQuestions[0];
          const question = typeof entry.question === "string" ? entry.question.trim() : "";
          const options = Array.isArray(entry.options)
            ? entry.options
                .filter((option) => typeof option === "string")
                .map((option) => option.trim())
                .filter(Boolean)
            : [];
          const correct = Number.isInteger(entry.correct) ? entry.correct : -1;

          if (!question || options.length < 2 || correct < 0 || correct >= options.length) {
            return null;
          }

          const legacyFactSource =
            typeof entry.feedbackCorrect === "string" && entry.feedbackCorrect.trim()
              ? entry.feedbackCorrect.trim()
              : typeof entry.feedbackWrong === "string" && entry.feedbackWrong.trim()
                ? entry.feedbackWrong.trim()
                : "";
          const baseFact =
            typeof entry.fact === "string" && entry.fact.trim()
              ? entry.fact.trim()
              : legacyFactSource || fallbackQuestion.fact;

          const sourceImage = entry.image && typeof entry.image === "object" ? entry.image : {};
          const imageSrc =
            typeof sourceImage.src === "string" && sourceImage.src.trim()
              ? sourceImage.src.trim()
              : fallbackQuestion.image.src;
          const imageAlt =
            typeof sourceImage.alt === "string" && sourceImage.alt.trim()
              ? sourceImage.alt.trim()
              : fallbackQuestion.image.alt;

          return {
            question,
            paginationTitle:
              typeof entry.paginationTitle === "string" && entry.paginationTitle.trim()
                ? entry.paginationTitle.trim()
                : question,
            options,
            correct,
            fact: baseFact,
            image: {
              src: imageSrc,
              alt: imageAlt,
            },
          };
        })
        .filter(Boolean);

      const sourceResultSummaries =
        rawConfig.resultSummaries && typeof rawConfig.resultSummaries === "object" ? rawConfig.resultSummaries : {};
      const sourceLabels = rawConfig.labels && typeof rawConfig.labels === "object" ? rawConfig.labels : {};

      const resultSummaries = {
        high:
          typeof sourceResultSummaries.high === "string" && sourceResultSummaries.high.trim()
            ? sourceResultSummaries.high.trim()
            : fallbackConfig.resultSummaries.high,
        medium:
          typeof sourceResultSummaries.medium === "string" && sourceResultSummaries.medium.trim()
            ? sourceResultSummaries.medium.trim()
            : fallbackConfig.resultSummaries.medium,
        low:
          typeof sourceResultSummaries.low === "string" && sourceResultSummaries.low.trim()
            ? sourceResultSummaries.low.trim()
            : fallbackConfig.resultSummaries.low,
      };

      const labels = {
        correct:
          typeof sourceLabels.correct === "string" && sourceLabels.correct.trim()
            ? sourceLabels.correct.trim()
            : fallbackConfig.labels.correct,
        wrong:
          typeof sourceLabels.wrong === "string" && sourceLabels.wrong.trim()
            ? sourceLabels.wrong.trim()
            : fallbackConfig.labels.wrong,
      };

      return {
        codeWord: typeof rawConfig.codeWord === "string" && rawConfig.codeWord.trim() ? rawConfig.codeWord.trim() : fallbackConfig.codeWord,
        labels,
        resultSummaries,
        questions: normalizedQuestions.length ? normalizedQuestions : fallbackQuestions,
      };
    };

    const loadQuizConfig = async () => {
      if (window.location.protocol === "file:") {
        console.warn("[quiz] Страница открыта через file://. Загрузка JSON может быть заблокирована браузером.");
      }
      try {
        const response = await fetch("assets/data/quiz-data.json", { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const rawConfig = await response.json();
        return normalizeQuizConfig(rawConfig);
      } catch (error) {
        console.warn("[quiz] Не удалось загрузить assets/data/quiz-data.json, используются встроенные данные.", error);
        return normalizeQuizConfig(createDefaultQuizConfig());
      }
    };

    const quizConfig = await loadQuizConfig();
    const quizData = quizConfig.questions;
    const feedbackStatusLabels = quizConfig.labels;
    const resultSummaryTexts = quizConfig.resultSummaries;

    const totalQuestions = Math.min(pageButtons.length, quizData.length);
    if (!totalQuestions) return;
    const selectedAnswers = Array(totalQuestions).fill(-1);

    let activeIndex = Math.max(0, pageButtons.findIndex((button) => button.classList.contains("is-active")));
    if (activeIndex < 0) activeIndex = 0;
    if (activeIndex >= totalQuestions) activeIndex = totalQuestions - 1;
    let isResultStep = false;
    let isFeedbackStep = false;
    let lockedQuizMainHeight = 0;
    let isResultStepLocked = true;
    let lockLottieAnimation = null;
    let hasResultUnlockAnimationPlayed = false;
    let hasResultClaimBeenSubmitted = false;

    const lockQuizMainHeight = () => {
      if (!(quizMain instanceof HTMLElement)) return;
      const currentHeight = Math.ceil(quizMain.getBoundingClientRect().height);
      if (currentHeight <= 0) return;
      if (currentHeight > lockedQuizMainHeight) {
        lockedQuizMainHeight = currentHeight;
      }
      quizMain.style.minHeight = `${lockedQuizMainHeight}px`;
    };

    const scheduleQuizMainHeightLock = () => {
      window.requestAnimationFrame(lockQuizMainHeight);
    };

    const applyResultLockAnimationState = (isLocked) => {
      if (!lockLottieAnimation) return;

      const lastFrame = Math.max(0, Math.floor(lockLottieAnimation.totalFrames || 1) - 1);

      if (isLocked) {
        hasResultUnlockAnimationPlayed = false;
        lockLottieAnimation.stop();
        lockLottieAnimation.goToAndStop(0, true);
        return;
      }

      if (prefersReducedMotion()) {
        hasResultUnlockAnimationPlayed = true;
        lockLottieAnimation.stop();
        lockLottieAnimation.goToAndStop(lastFrame, true);
        return;
      }

      if (!hasResultUnlockAnimationPlayed) {
        hasResultUnlockAnimationPlayed = true;
        lockLottieAnimation.goToAndPlay(0, true);
        return;
      }

      lockLottieAnimation.stop();
      lockLottieAnimation.goToAndStop(lastFrame, true);
    };

    const initResultLockLottie = () => {
      if (!(resultStepLottieContainer instanceof HTMLElement)) return;
      if (!window.lottie || typeof window.lottie.loadAnimation !== "function") return;

      const animationConfig = {
        container: resultStepLottieContainer,
        renderer: "svg",
        loop: false,
        autoplay: false,
        rendererSettings: {
          preserveAspectRatio: "xMidYMid meet",
          progressiveLoad: true,
        },
      };

      if (window.quizOpenLockData && typeof window.quizOpenLockData === "object") {
        animationConfig.animationData = window.quizOpenLockData;
      } else {
        animationConfig.path = "assets/img/quiz/open-lock.json";
      }

      lockLottieAnimation = window.lottie.loadAnimation(animationConfig);

      lockLottieAnimation.addEventListener("DOMLoaded", () => {
        resultStepLottieContainer.classList.add("is-lottie-ready");
        applyResultLockAnimationState(isResultStepLocked);
      });

      lockLottieAnimation.addEventListener("data_failed", () => {
        resultStepLottieContainer.classList.remove("is-lottie-ready");
      });
    };

    if (pagination instanceof HTMLElement) {
      pagination.style.setProperty("--quiz-pagination-columns", String(totalQuestions + 3));
    }

    const isQuizCompleted = () => selectedAnswers.every((answer) => answer !== -1);
    const getAnsweredCount = () => selectedAnswers.reduce((acc, answer) => acc + (answer !== -1 ? 1 : 0), 0);

    const updateProgressRing = () => {
      const percent = Math.round((getAnsweredCount() / totalQuestions) * 100);
      progressRing.style.setProperty("--progress", String(percent));
      progressRing.setAttribute("aria-valuenow", String(percent));
      progressValue.textContent = `${percent}%`;
    };

    const updateNavButtons = () => {
      if (prevButton instanceof HTMLButtonElement) {
        prevButton.disabled = !isResultStep && !isFeedbackStep && activeIndex === 0;
      }

      if (!(nextButton instanceof HTMLButtonElement)) return;

      if (isResultStep) {
        nextButton.disabled = true;
        nextButton.textContent = "›";
        nextButton.setAttribute("aria-label", "Следующий шаг");
        return;
      }

      if (isFeedbackStep) {
        const isLastQuestion = activeIndex === totalQuestions - 1;
        if (isLastQuestion) {
          nextButton.disabled = true;
          nextButton.textContent = "›";
          nextButton.setAttribute("aria-label", "Следующий вопрос недоступен");
          return;
        }

        nextButton.disabled = false;
        nextButton.textContent = "›";
        nextButton.setAttribute("aria-label", "Следующий вопрос");
        return;
      }

      if (selectedAnswers[activeIndex] === -1) {
        nextButton.disabled = true;
        nextButton.textContent = "›";
        nextButton.setAttribute("aria-label", "Ответьте на вопрос");
      } else {
        nextButton.disabled = false;
        nextButton.textContent = "›";
        nextButton.setAttribute("aria-label", "Показать проверку ответа");
      }
    };

    const renderPagination = () => {
      const isCompleted = isQuizCompleted();

      pageButtons.forEach((button, index) => {
        const inRange = index < totalQuestions;
        button.hidden = !inRange;
        if (!inRange) return;

        const answer = selectedAnswers[index];
        const isCorrect = answer !== -1 && answer === quizData[index].correct;
        const isWrong = answer !== -1 && answer !== quizData[index].correct;

        button.classList.toggle("is-correct", isCorrect);
        button.classList.toggle("is-wrong", isWrong);
        button.classList.toggle("is-active", index === activeIndex && !isResultStep);

        if (index === activeIndex && !isResultStep) {
          button.setAttribute("aria-current", "page");
        } else {
          button.removeAttribute("aria-current");
        }
      });

      if (resultStepButton instanceof HTMLButtonElement) {
        const isLocked = !isCompleted;
        isResultStepLocked = isLocked;
        resultStepButton.classList.toggle("is-locked", isLocked);
        resultStepButton.classList.toggle("is-active", isResultStep);
        resultStepButton.disabled = isLocked;
        resultStepButton.setAttribute("aria-disabled", String(isLocked));
        applyResultLockAnimationState(isLocked);
      }

      updateNavButtons();
    };

    const renderQuestionVisual = () => {
      if (!(questionVisualImage instanceof HTMLImageElement)) return;
      const item = quizData[activeIndex];
      const fallbackSrc = "assets/img/quiz/1.jpg";
      const imageSrc =
        typeof item?.image?.src === "string" && item.image.src.trim()
          ? item.image.src.trim()
          : fallbackSrc;
      const imageAlt =
        typeof item?.image?.alt === "string" && item.image.alt.trim()
          ? item.image.alt.trim()
          : "Изображение вопроса квиза";

      questionVisualImage.setAttribute("src", imageSrc);
      questionVisualImage.setAttribute("alt", imageAlt);
    };

    const renderAnswerOptions = () => {
      const item = quizData[activeIndex];
      if (!item || !item.options || !answerButtons.length) return;

      if (selectedAnswers[activeIndex] >= item.options.length) {
        selectedAnswers[activeIndex] = -1;
      }
      const answeredIndex = selectedAnswers[activeIndex];

      answerButtons.forEach((button, optionIndex) => {
        const textSlot = button.querySelector("span:not(.quiz-option__letter)");
        const inRange = optionIndex < item.options.length;
        button.hidden = !inRange;
        button.style.display = inRange ? "" : "none";

        if (!inRange) {
          button.classList.remove("is-selected");
          button.disabled = true;
          button.setAttribute("aria-pressed", "false");
          if (textSlot) {
            textSlot.textContent = "";
          } else {
            button.textContent = "";
          }
          return;
        }

        const isSelectedOption = optionIndex === answeredIndex;
        const text = item.options[optionIndex] || "";

        button.classList.remove("is-selected");
        button.classList.toggle("is-selected", isSelectedOption);
        button.disabled = false;
        button.setAttribute("aria-pressed", isSelectedOption ? "true" : "false");

        if (textSlot) {
          textSlot.textContent = text;
        } else {
          button.textContent = text;
        }
      });
    };

    const getResultSummary = (correctCount) => {
      const ratio = totalQuestions > 0 ? correctCount / totalQuestions : 0;
      if (ratio >= 0.875) return resultSummaryTexts.high;
      if (ratio >= 0.625) return resultSummaryTexts.medium;
      return resultSummaryTexts.low;
    };

    const renderFeedback = () => {
      const item = quizData[activeIndex];
      const selected = selectedAnswers[activeIndex];
      if (!item || selected === -1) return;

      const isCorrect = selected === item.correct;
      if (feedbackStatus) {
        feedbackStatus.textContent = isCorrect ? feedbackStatusLabels.correct : feedbackStatusLabels.wrong;
        feedbackStatus.classList.toggle("is-good", isCorrect);
        feedbackStatus.classList.toggle("is-bad", !isCorrect);
      }

      if (feedbackText) {
        feedbackText.textContent = item.fact || "";
      }

      if (feedbackRetryButton instanceof HTMLButtonElement) {
        feedbackRetryButton.classList.remove("is-hidden");

        if (isCorrect) {
          const isLastQuestion = activeIndex === totalQuestions - 1;
          const nextLabel = isLastQuestion ? "Смотреть результаты" : "Следующий вопрос";

          feedbackRetryButton.dataset.action = isLastQuestion ? "results" : "next";
          feedbackRetryButton.setAttribute("aria-label", nextLabel);
          feedbackRetryButton.setAttribute("title", nextLabel);
          if (feedbackRetryText) feedbackRetryText.textContent = nextLabel;
          if (feedbackRetryRefreshIcon) feedbackRetryRefreshIcon.classList.add("is-hidden");
          if (feedbackRetryNextIcon) feedbackRetryNextIcon.classList.remove("is-hidden");
        } else {
          feedbackRetryButton.dataset.action = "retry";
          feedbackRetryButton.setAttribute("aria-label", "Изменить ответ");
          feedbackRetryButton.setAttribute("title", "Изменить ответ");
          if (feedbackRetryText) feedbackRetryText.textContent = "Изменить ответ";
          if (feedbackRetryRefreshIcon) feedbackRetryRefreshIcon.classList.remove("is-hidden");
          if (feedbackRetryNextIcon) feedbackRetryNextIcon.classList.add("is-hidden");
        }
      }
    };

    const showQuestionStep = () => {
      isResultStep = false;
      isFeedbackStep = false;
      quizCard.classList.remove("is-result-step");
      quizCard.classList.remove("is-feedback-step");

      if (questionBlock instanceof HTMLElement) questionBlock.hidden = false;
      if (optionsBlock instanceof HTMLElement) optionsBlock.hidden = false;
      if (feedbackBlock instanceof HTMLElement) feedbackBlock.hidden = true;
      if (pagination instanceof HTMLElement) pagination.hidden = false;
      if (resultBlock instanceof HTMLElement) resultBlock.hidden = true;

      if (questionIndex) {
        questionIndex.textContent = `Вопрос ${activeIndex + 1} из ${totalQuestions}`;
      }

      if (questionTitle) {
        const item = quizData[activeIndex];
        questionTitle.textContent = item ? item.question : "";
      }

      renderQuestionVisual();
      renderAnswerOptions();
      updateProgressRing();
      renderPagination();
      scheduleQuizMainHeightLock();
    };

    const showFeedbackStep = () => {
      const selected = selectedAnswers[activeIndex];
      if (selected === -1) return;

      isResultStep = false;
      isFeedbackStep = true;
      quizCard.classList.remove("is-result-step");
      quizCard.classList.add("is-feedback-step");

      if (questionBlock instanceof HTMLElement) questionBlock.hidden = false;
      if (optionsBlock instanceof HTMLElement) optionsBlock.hidden = true;
      if (feedbackBlock instanceof HTMLElement) feedbackBlock.hidden = false;
      if (pagination instanceof HTMLElement) pagination.hidden = false;
      if (resultBlock instanceof HTMLElement) resultBlock.hidden = true;

      renderQuestionVisual();
      renderFeedback();
      updateProgressRing();
      renderPagination();
      scheduleQuizMainHeightLock();
    };

    const showResultStep = () => {
      if (!isQuizCompleted()) return;

      isResultStep = true;
      isFeedbackStep = false;
      quizCard.classList.add("is-result-step");
      quizCard.classList.remove("is-feedback-step");

      if (questionBlock instanceof HTMLElement) questionBlock.hidden = true;
      if (optionsBlock instanceof HTMLElement) optionsBlock.hidden = true;
      if (feedbackBlock instanceof HTMLElement) feedbackBlock.hidden = true;
      if (pagination instanceof HTMLElement) pagination.hidden = false;
      if (resultBlock instanceof HTMLElement) resultBlock.hidden = false;

      const correctAnswers = selectedAnswers.reduce((acc, value, index) => {
        const correct = quizData[index] ? quizData[index].correct : -1;
        return acc + (value === correct ? 1 : 0);
      }, 0);
      const wrongAnswers = totalQuestions - correctAnswers;
      const resultAccuracy = Math.round((correctAnswers / totalQuestions) * 100);

      if (resultCorrect) resultCorrect.textContent = String(correctAnswers);
      if (resultTotal) resultTotal.textContent = String(totalQuestions);
      if (resultWrong) resultWrong.textContent = String(wrongAnswers);
      if (resultPercent) resultPercent.textContent = `${resultAccuracy}%`;
      if (resultSummary) resultSummary.textContent = getResultSummary(correctAnswers);

      updateProgressRing();
      renderPagination();
      scheduleQuizMainHeightLock();
    };

    const syncResultClaimState = () => {
      if (resultClaimFormWrap instanceof HTMLElement) {
        resultClaimFormWrap.hidden = hasResultClaimBeenSubmitted;
      }
      if (resultClaimError instanceof HTMLElement) {
        resultClaimError.hidden = true;
        resultClaimError.textContent = "";
      }
      if (resultClaimSuccess instanceof HTMLElement) {
        resultClaimSuccess.hidden = !hasResultClaimBeenSubmitted;
      }
    };

    if (resultClaimForm instanceof HTMLFormElement) {
      resultClaimForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const submitButton = resultClaimForm.querySelector(".quiz-result__submit");
        if (submitButton instanceof HTMLButtonElement) {
          submitButton.disabled = true;
          submitButton.textContent = "Отправка...";
        }

        if (resultClaimError instanceof HTMLElement) {
          resultClaimError.hidden = true;
          resultClaimError.textContent = "";
        }

        const formData = new FormData(resultClaimForm);
        const fullName = String(formData.get("fullName") || "").trim();
        const phone = String(formData.get("phone") || "").trim();
        const email = String(formData.get("email") || "").trim();
        const consentInputs = Array.from(
          resultClaimForm.querySelectorAll('input[name^="quizConsent"]')
        );
        const hasAllConsents = consentInputs.length > 0 && consentInputs.every((input) => input.checked);

        if (!fullName || !phone || !email || !hasAllConsents) {
          if (resultClaimError instanceof HTMLElement) {
            resultClaimError.textContent = "Заполните поля формы и подтвердите все согласия.";
            resultClaimError.hidden = false;
          }
          if (submitButton instanceof HTMLButtonElement) {
            submitButton.disabled = false;
            submitButton.textContent = "ЗАРЕГИСТРИРОВАТЬСЯ";
          }
          return;
        }

        const correctAnswers = selectedAnswers.reduce((acc, value, index) => {
          const correct = quizData[index] ? quizData[index].correct : -1;
          return acc + (value === correct ? 1 : 0);
        }, 0);
        const wrongAnswers = totalQuestions - correctAnswers;
        const resultAccuracy = Math.round((correctAnswers / totalQuestions) * 100);

        try {
          const response = await fetch("/api/quiz-result", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fullName,
              phone,
              email,
              correctAnswers,
              wrongAnswers,
              totalQuestions,
              resultAccuracy,
            }),
          });

          let payload = null;
          try { payload = await response.json(); } catch { payload = null; }

          if (!response.ok || !payload || payload.success !== true) {
            throw new Error(payload && payload.message ? payload.message : "Ошибка отправки");
          }

          hasResultClaimBeenSubmitted = true;
          syncResultClaimState();
          resultClaimForm.reset();
          scheduleQuizMainHeightLock();
        } catch (error) {
          console.warn("[quiz] Не удалось сохранить результат формы.", error);
          if (resultClaimError instanceof HTMLElement) {
            resultClaimError.textContent = "Не удалось отправить данные. Попробуйте ещё раз.";
            resultClaimError.hidden = false;
          }
        } finally {
          if (submitButton instanceof HTMLButtonElement) {
            submitButton.disabled = false;
            submitButton.textContent = "ЗАРЕГИСТРИРОВАТЬСЯ";
          }
        }
      });
    }

    pageButtons.forEach((button, index) => {
      if (index >= totalQuestions) {
        button.hidden = true;
        return;
      }

      const item = quizData[index];
      if (item) {
        const title = item.paginationTitle || item.question;
        button.title = title;
        button.setAttribute("aria-label", `Вопрос ${index + 1}: ${title}`);
        button.textContent = String(index + 1);
      }

      button.addEventListener("click", () => {
        activeIndex = index;
        showQuestionStep();
      });
    });

    if (resultStepButton instanceof HTMLButtonElement) {
      resultStepButton.addEventListener("click", () => {
        if (resultStepButton.disabled) return;
        showResultStep();
      });
    }

    if (prevButton instanceof HTMLButtonElement) {
      prevButton.addEventListener("click", () => {
        if (isResultStep) {
          activeIndex = totalQuestions - 1;
          showFeedbackStep();
          return;
        }

        if (isFeedbackStep) {
          showQuestionStep();
          return;
        }

        activeIndex = Math.max(0, activeIndex - 1);
        showQuestionStep();
      });
    }

    if (nextButton instanceof HTMLButtonElement) {
      nextButton.addEventListener("click", () => {
        if (isResultStep) return;

        if (isFeedbackStep) {
          if (activeIndex === totalQuestions - 1) {
            return;
          }

          activeIndex = Math.min(totalQuestions - 1, activeIndex + 1);
          showQuestionStep();
          return;
        }

        if (selectedAnswers[activeIndex] === -1) return;
        showFeedbackStep();
      });
    }

    answerButtons.forEach((button, optionIndex) => {
      button.addEventListener("click", () => {
        if (isResultStep || isFeedbackStep) return;
        selectedAnswers[activeIndex] = optionIndex;
        showFeedbackStep();
      });
    });

    if (feedbackRetryButton instanceof HTMLButtonElement) {
      feedbackRetryButton.addEventListener("click", () => {
        const action = feedbackRetryButton.dataset.action || "retry";

        if (action === "results") {
          if (isQuizCompleted()) showResultStep();
          return;
        }

        if (action === "next") {
          if (activeIndex < totalQuestions - 1) {
            activeIndex += 1;
            showQuestionStep();
            return;
          }
          if (isQuizCompleted()) {
            showResultStep();
            return;
          }
        }

        selectedAnswers[activeIndex] = -1;
        showQuestionStep();
        const firstOption = answerButtons[0];
        if (firstOption instanceof HTMLElement) firstOption.focus();
      });
    }

    window.addEventListener("resize", () => {
      if (!(quizMain instanceof HTMLElement)) return;
      quizMain.style.minHeight = "";
      lockedQuizMainHeight = 0;
      scheduleQuizMainHeightLock();
    });

    initResultLockLottie();
    showQuestionStep();
  };

  const setupFaqAccordion = () => {
    const items = Array.from(document.querySelectorAll("[data-faq-item]"));
    if (!items.length) return;

    const closeItem = (item) => {
      const button = item.querySelector("button");
      const panel = item.querySelector(".faq-item__panel");
      if (!button || !panel) return;

      button.setAttribute("aria-expanded", "false");
      panel.hidden = true;
    };

    const openItem = (item) => {
      const button = item.querySelector("button");
      const panel = item.querySelector(".faq-item__panel");
      if (!button || !panel) return;

      button.setAttribute("aria-expanded", "true");
      panel.hidden = false;
    };

    items.forEach((item) => {
      const button = item.querySelector("button");
      if (!button) return;

      button.addEventListener("click", () => {
        const expanded = button.getAttribute("aria-expanded") === "true";

        items.forEach((entry) => {
          if (entry !== item) closeItem(entry);
        });

        if (expanded) {
          closeItem(item);
        } else {
          openItem(item);
        }
      });
    });
  };

  const setupTiresFilter = () => {
    const controls = Array.from(document.querySelectorAll("[data-filter]"));
    const cards = Array.from(document.querySelectorAll(".tire-card[data-season]"));
    if (!controls.length || !cards.length) return;

    const applyFilter = (filter) => {
      cards.forEach((card) => {
        const tags = (card.getAttribute("data-season") || "").split(" ");
        const match = filter === "all" || tags.includes(filter);
        card.classList.toggle("is-hidden", !match);
      });
    };

    controls.forEach((control) => {
      control.addEventListener("click", () => {
        controls.forEach((item) => item.classList.remove("is-active"));
        control.classList.add("is-active");
        applyFilter(control.getAttribute("data-filter") || "all");
      });
    });

    applyFilter("all");
  };

  const setupWinnersUi = () => {
    const rows = Array.from(document.querySelectorAll("[data-winner-row]"));
    const search = document.getElementById("winners-search");
    const showMore = document.getElementById("winners-more");
    const emptyState = document.getElementById("winners-empty");

    if (!rows.length || !search || !showMore || !emptyState) return;

    const avatarPalettes = [
      ["#005387", "#0b8fce"],
      ["#0f4d63", "#2da773"],
      ["#4f3a90", "#8693ff"],
      ["#8f3e23", "#ff8c45"],
      ["#145e63", "#33b8a8"],
      ["#343c8f", "#6fb8ff"],
    ];
    const pickRandom = (list) => list[Math.floor(Math.random() * list.length)];
    const escapeXml = (value) =>
      value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    const getInitials = (value) => {
      const initials = value
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => Array.from(part)[0]?.toUpperCase() || "")
        .join("");
      return initials || "?";
    };
    const svgToBase64 = (markup) => {
      if (typeof TextEncoder === "undefined") {
        return window.btoa(unescape(encodeURIComponent(markup)));
      }
      const bytes = new TextEncoder().encode(markup);
      let binary = "";
      bytes.forEach((byte) => {
        binary += String.fromCharCode(byte);
      });
      return window.btoa(binary);
    };
    const buildAvatarDataUri = (name) => {
      const [startColor, endColor] = pickRandom(avatarPalettes);
      const accentX = 6 + Math.floor(Math.random() * 38);
      const accentY = 6 + Math.floor(Math.random() * 38);
      const accentSize = 12 + Math.floor(Math.random() * 22);
      const highlightOpacity = (0.12 + Math.random() * 0.22).toFixed(2);
      const secondaryOpacity = (0.08 + Math.random() * 0.14).toFixed(2);
      const initials = escapeXml(getInitials(name));
      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
          <defs>
            <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="${startColor}"/>
              <stop offset="100%" stop-color="${endColor}"/>
            </linearGradient>
          </defs>
          <rect width="64" height="64" rx="32" fill="url(#g)"/>
          <circle cx="${accentX}" cy="${accentY}" r="${accentSize}" fill="rgba(255,255,255,${highlightOpacity})"/>
          <circle cx="52" cy="52" r="18" fill="rgba(255,255,255,${secondaryOpacity})"/>
          <text x="32" y="32" text-anchor="middle" dominant-baseline="middle" fill="#ffffff" font-size="26" font-family="Arial, sans-serif" font-weight="700">${initials}</text>
        </svg>
      `;
      return `data:image/svg+xml;base64,${svgToBase64(svg)}`;
    };

    rows.forEach((row, index) => {
      const avatar = row.querySelector("[data-random-avatar]");
      if (!avatar) return;
      const fallbackName = `Призер ${index + 1}`;
      const name = row.querySelector("h3")?.textContent?.trim() || row.getAttribute("data-name") || fallbackName;
      avatar.src = buildAvatarDataUri(name);
    });

    const pageSize = 10;
    let visibleLimit = pageSize;

    const refresh = (resetLimit = false) => {
      if (resetLimit) visibleLimit = pageSize;

      const term = search.value.trim().toLowerCase();
      let matched = 0;

      rows.forEach((row) => {
        const name = (row.getAttribute("data-name") || "").toLowerCase();
        const match = !term || name.includes(term);

        if (!match) {
          row.classList.add("is-hidden");
          return;
        }

        matched += 1;
        row.classList.toggle("is-hidden", matched > visibleLimit);
      });

      showMore.classList.toggle("is-hidden", matched <= visibleLimit);
      emptyState.classList.toggle("is-hidden", matched > 0);
    };

    search.addEventListener("input", () => refresh(true));
    showMore.addEventListener("click", () => {
      visibleLimit += pageSize;
      refresh();
    });

    refresh(true);
  };

  const setupWordModalUi = () => {
    const modal = document.getElementById("word-modal");
    const codeStep = document.getElementById("word-code-step");
    const contactStep = document.getElementById("word-contact-step");
    const successStep = document.getElementById("word-success");
    const form = document.getElementById("word-form");
    const otpGroup = document.querySelector("#word-form [data-otp-group]");
    const submit = document.getElementById("word-submit");
    const error = document.getElementById("word-error");
    const editButton = document.getElementById("word-edit");
    const confirmedCode = document.getElementById("confirmed-code");

    const contactForm = document.getElementById("contact-form");
    const nameInput = document.getElementById("contact-name");
    const emailInput = document.getElementById("contact-email");
    const consentDocsInput = document.getElementById("contact-consent-docs");
    const consentProcessingInput = document.getElementById("contact-consent-processing");
    const consentEmailInput = document.getElementById("contact-consent-email");
    const contactSubmit = document.getElementById("contact-submit");
    const nameError = document.getElementById("contact-name-error");
    const emailError = document.getElementById("contact-email-error");

    if (
      !modal ||
      !codeStep ||
      !contactStep ||
      !successStep ||
      !form ||
      !otpGroup ||
      !submit ||
      !error ||
      !editButton ||
      !confirmedCode ||
      !contactForm ||
      !nameInput ||
      !emailInput ||
      !consentDocsInput ||
      !consentProcessingInput ||
      !consentEmailInput ||
      !contactSubmit ||
      !nameError ||
      !emailError
    ) {
      return;
    }

    const animationDurationMs = 260;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
    const codeLengthValue = Number.parseInt(form.dataset.otpLength || "6", 10);
    const codeLength = Number.isFinite(codeLengthValue) ? Math.min(8, Math.max(4, codeLengthValue)) : 6;
    const defaultEmailError = emailError.textContent || "Проверьте формат e-mail.";
    const defaultContactSubmitText = contactSubmit.textContent || "ЗАРЕГИСТРИРОВАТЬСЯ";
    const contactConsentInputs = [consentDocsInput, consentProcessingInput, consentEmailInput];
    let isSubmitting = false;
    emailError.dataset.defaultText = defaultEmailError;
    contactSubmit.dataset.defaultText = defaultContactSubmitText;

    const sanitizeLetter = (value) => value.toUpperCase().replace(/[^A-Z]/g, "").slice(-1);
    const sanitizeCode = (value) => value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, codeLength);

    const otpInputs = [];
    otpGroup.style.gridTemplateColumns = `repeat(${codeLength}, minmax(0, 1fr))`;

    for (let index = 0; index < codeLength; index += 1) {
      const input = document.createElement("input");
      input.className = "code-otp__input";
      input.type = "text";
      input.inputMode = "text";
      input.autocomplete = "off";
      input.autocapitalize = "characters";
      input.spellcheck = false;
      input.maxLength = 1;
      input.setAttribute("aria-label", `Символ ${index + 1} из ${codeLength}`);
      input.dataset.index = String(index);
      otpGroup.append(input);
      otpInputs.push(input);
    }

    const getCode = () => otpInputs.map((input) => sanitizeLetter(input.value)).join("");
    const isCodeComplete = () => otpInputs.every((input) => sanitizeLetter(input.value).length === 1);

    const focusOtpCell = (index) => {
      if (!otpInputs.length) return;
      const safeIndex = Math.min(otpInputs.length - 1, Math.max(0, index));
      const target = otpInputs[safeIndex];
      if (!target) return;
      target.focus();
      target.select();
    };

    const clearCodeError = () => {
      error.classList.add("is-hidden");
      otpGroup.classList.remove("is-error", "is-shaking");
      otpInputs.forEach((input) => input.classList.remove("is-invalid"));
    };

    const showCodeError = (message) => {
      error.textContent = message;
      error.classList.remove("is-hidden");
      otpGroup.classList.add("is-error", "is-shaking");
      otpInputs.forEach((input) => input.classList.add("is-invalid"));
      window.setTimeout(() => otpGroup.classList.remove("is-shaking"), 320);
    };

    const refreshCodeState = () => {
      submit.disabled = !isCodeComplete();
      otpInputs.forEach((input) => {
        input.classList.toggle("is-filled", sanitizeLetter(input.value).length === 1);
      });
    };

    const setStep = (step) => {
      const map = {
        code: codeStep,
        contacts: contactStep,
        success: successStep,
      };

      Object.entries(map).forEach(([key, node]) => {
        const isActive = key === step;
        node.classList.toggle("is-hidden", !isActive);
        node.classList.remove("is-entering");
        if (isActive) {
          requestAnimationFrame(() => node.classList.add("is-entering"));
          window.setTimeout(() => node.classList.remove("is-entering"), animationDurationMs);
        }
      });

      modal.classList.toggle("is-code-confirmed", step === "contacts");
      modal.classList.toggle("is-success", step === "success");
    };

    const validateName = () => nameInput.value.trim().length > 1;
    const validateEmail = () => emailPattern.test(emailInput.value.trim());
    const isContactValid = () =>
      validateName() && validateEmail() && contactConsentInputs.every((input) => input.checked);

    const refreshContactState = () => {
      const submitted = contactForm.dataset.submitted === "true";
      const nameTouched = submitted || nameInput.dataset.touched === "true";
      const emailTouched = submitted || emailInput.dataset.touched === "true";
      const invalidName = nameTouched && !validateName();
      const invalidEmail = emailTouched && !validateEmail();

      nameError.classList.toggle("is-hidden", !invalidName);
      nameInput.classList.toggle("is-invalid", invalidName);
      emailError.textContent = defaultEmailError;
      emailError.classList.toggle("is-hidden", !invalidEmail);
      emailInput.classList.toggle("is-invalid", invalidEmail);
      contactSubmit.disabled = isSubmitting || !isContactValid();
    };

    const setContactSubmitPending = (pending) => {
      isSubmitting = pending;
      contactSubmit.textContent = pending ? "Отправка..." : defaultContactSubmitText;
      contactSubmit.disabled = pending || !isContactValid();
    };

    const requestPromocode = async (payload) => {
      try {
        const response = await fetch("/api/request-promocode", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        let data = null;
        try {
          data = await response.json();
        } catch (_error) {
          data = null;
        }

        if (!response.ok || !data || data.success !== true) {
          return {
            ok: false,
            message:
              data && typeof data.message === "string" && data.message
                ? data.message
                : "Не удалось отправить форму. Попробуйте еще раз.",
          };
        }

        return {
          ok: true,
          message: data.message || "",
        };
      } catch (_error) {
        return {
          ok: false,
          message: "Не удалось отправить форму. Попробуйте еще раз.",
        };
      }
    };

    const fillFromText = (text, startIndex = 0) => {
      if (!text) return;
      let pointer = startIndex;
      text.split("").forEach((char) => {
        if (pointer >= otpInputs.length) return;
        otpInputs[pointer].value = sanitizeLetter(char);
        pointer += 1;
      });
      refreshCodeState();
      focusOtpCell(pointer >= otpInputs.length ? otpInputs.length - 1 : pointer);
    };

    otpInputs.forEach((input, index) => {
      input.addEventListener("focus", () => input.classList.add("is-active"));
      input.addEventListener("blur", () => input.classList.remove("is-active"));

      input.addEventListener("input", () => {
        const value = sanitizeCode(input.value);
        clearCodeError();

        if (value.length > 1) {
          fillFromText(value, index);
          return;
        }

        input.value = sanitizeLetter(value);
        refreshCodeState();
        if (input.value && index < otpInputs.length - 1) {
          focusOtpCell(index + 1);
        }
      });

      input.addEventListener("keydown", (event) => {
        const key = event.key;
        if (key === "Backspace") {
          clearCodeError();
          if (input.value) {
            input.value = "";
            refreshCodeState();
            event.preventDefault();
            return;
          }
          if (index > 0) {
            const previous = otpInputs[index - 1];
            previous.value = "";
            refreshCodeState();
            focusOtpCell(index - 1);
            event.preventDefault();
          }
          return;
        }

        if (key === "ArrowLeft" && index > 0) {
          event.preventDefault();
          focusOtpCell(index - 1);
          return;
        }

        if (key === "ArrowRight" && index < otpInputs.length - 1) {
          event.preventDefault();
          focusOtpCell(index + 1);
          return;
        }

        if ((event.ctrlKey || event.metaKey) && (key === "v" || key === "V")) {
          return;
        }

        if (key.length === 1 && !/[a-z]/i.test(key)) {
          event.preventDefault();
        }
      });

      input.addEventListener("paste", (event) => {
        const raw = event.clipboardData ? event.clipboardData.getData("text") : "";
        const parsed = sanitizeCode(raw);
        if (!parsed) return;
        event.preventDefault();
        clearCodeError();
        fillFromText(parsed, index);
      });
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      clearCodeError();
      const code = getCode();

      if (!isCodeComplete()) {
        showCodeError("Введите кодовое слово полностью.");
        const firstEmptyIndex = otpInputs.findIndex((input) => !sanitizeLetter(input.value));
        focusOtpCell(firstEmptyIndex >= 0 ? firstEmptyIndex : 0);
        refreshCodeState();
        return;
      }

      confirmedCode.textContent = code;
      setStep("contacts");
      refreshContactState();
      nameInput.focus();
      refreshCodeState();
    });

    editButton.addEventListener("click", () => {
      setStep("code");
      const firstEmptyIndex = otpInputs.findIndex((input) => !sanitizeLetter(input.value));
      focusOtpCell(firstEmptyIndex >= 0 ? firstEmptyIndex : otpInputs.length - 1);
    });

    [nameInput, emailInput].forEach((input) => {
      input.addEventListener("input", () => {
        if (input === nameInput) {
          nameInput.value = nameInput.value.replace(/\s{2,}/g, " ");
        }
        if (input === emailInput) {
          emailInput.value = emailInput.value.trimStart();
        }
        refreshContactState();
      });

      input.addEventListener("blur", () => {
        input.dataset.touched = "true";
        refreshContactState();
      });
    });

    contactConsentInputs.forEach((input) => {
      input.addEventListener("change", refreshContactState);
    });

    contactForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      contactForm.dataset.submitted = "true";
      nameInput.dataset.touched = "true";
      emailInput.dataset.touched = "true";
      refreshContactState();

      if (!isContactValid()) return;

      setContactSubmitPending(true);
      const payload = {
        name: nameInput.value.trim(),
        email: emailInput.value.trim(),
        entered_word: getCode(),
      };

      const result = await requestPromocode(payload);
      setContactSubmitPending(false);

      if (!result.ok) {
        emailError.textContent = result.message;
        emailError.classList.remove("is-hidden");
        return;
      }

      setStep("success");
      const closeSuccessButton = successStep.querySelector("[data-close-modal]");
      if (closeSuccessButton instanceof HTMLElement) closeSuccessButton.focus();
    });

    resetWordModal();
  };

  const setupCookieUi = () => {
    const storageKey = "cordiant-cookie-consent";
    const banner = document.getElementById("cookie-banner");
    const acceptBtn = document.getElementById("cookie-accept");

    if (!banner || !acceptBtn) return;

    const save = () => {
      try {
        localStorage.setItem(
          storageKey,
          JSON.stringify({ accepted: true, savedAt: Date.now() })
        );
      } catch (_error) {
        /* ignore write errors */
      }
      banner.classList.add("is-hidden");
    };

    const read = () => {
      try {
        const raw = localStorage.getItem(storageKey);
        return raw ? JSON.parse(raw) : null;
      } catch (_error) {
        return null;
      }
    };

    const existing = read();
    if (existing && existing.accepted === true) {
      banner.classList.add("is-hidden");
    }

    acceptBtn.addEventListener("click", () => {
      save();
    });
  };

  const setupGlobalUiEvents = () => {
    document.addEventListener("click", (event) => {
      const openTrigger = event.target.closest("[data-open-modal]");
      if (openTrigger) {
        event.preventDefault();
        const modalId = openTrigger.getAttribute("data-open-modal");
        if (modalId) openModal(modalId);
      }

      const closeTrigger = event.target.closest("[data-close-modal]");
      if (closeTrigger) {
        event.preventDefault();
        const modal = closeTrigger.closest("[data-modal]");
        closeModal(modal ? modal.id : "");
      }
    });

    modals.forEach((modal) => {
      modal.addEventListener("mousedown", (event) => {
        if (event.target === modal) closeModal(modal.id);
      });
    });

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      if (activeModal) {
        closeModal(activeModal.id);
        return;
      }
      if (drawer && drawer.classList.contains("is-open")) {
        closeDrawer();
      }
    });

    if (drawerToggle) drawerToggle.addEventListener("click", openDrawer);
    if (drawerClose) drawerClose.addEventListener("click", () => closeDrawer());

    document.querySelectorAll(".mobile-nav a").forEach((link) => {
      link.addEventListener("click", () => closeDrawer());
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 1024) closeDrawer(true);
      updateHeaderState();
    });

    window.addEventListener("scroll", updateHeaderState, { passive: true });
  };

  setupAnchorScroll();
  setupScrollSpy();
  setupRevealAnimations();
  setupLazyImages();
  setupPrizeDescriptions();
  setupPrizeCarousel();
  setupQuizProgressUi();
  setupFaqAccordion();
  setupTiresFilter();
  setupWinnersUi();
  setupWordModalUi();
  setupCookieUi();
  setupGlobalUiEvents();
  updateHeaderState();
})();
