const CREDIT_CARD_BILL_DAY = 15;

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCSYpbaSrJXWyEKe1Qrff3lDjy4JbgKFJA",
  authDomain: "fullyoperationalexpenseapp.firebaseapp.com",
  projectId: "fullyoperationalexpenseapp",
  storageBucket: "fullyoperationalexpenseapp.firebasestorage.app",
  messagingSenderId: "94236984421",
  appId: "1:94236984421:web:f8ac6c0c6b44792806728c"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

const ACCOUNTS = [
  { id: "current", label: "Current Account" },
  { id: "savings", label: "Savings Account" },
  { id: "investments", label: "Investments" },
  { id: "creditCard", label: "Credit Card" }
];

const CATEGORIES = [
  "Food",
  "Groceries",
  "Commute",
  "Entertainment",
  "Bills",
  "Health",
  "Sports",
  "Gifts",
  "Shopping",
  "Travel",
  "Investment",
  "Salary",
  "Other"
];

const CATEGORY_EMOJI = {
  Food: "🍽️",
  Groceries: "🛒",
  Commute: "🚗",
  Entertainment: "🎬",
  Bills: "📄",
  Health: "💊",
  Sports: "⚽",
  Gifts: "🎁",
  Shopping: "🛍️",
  Travel: "✈️",
  Investment: "📈",
  Salary: "💰",
  Other: "📌"
};

const defaultState = {
  baseBalances: {
    current: 0,
    savings: 0,
    investments: 0,
    creditCard: 0
  },
  settings: {
    creditCardStatementDate: getDefaultCreditCardStatementDate(),
    creditCardBillPaidThrough: getDefaultCreditCardStatementDate(),
    currency: "INR"
  },
  transactions: []
};

let state = structuredClone(defaultState);
let currentRange = "daily";
let breakdownPeriod = "month";
let editingTransactionId = null;
let currentPage = "home";
let currentUser = null;
let saveDebounceTimer = null;

const transactionForm = document.getElementById("transactionForm");
const entryType = document.getElementById("entryType");
const entryTitle = document.getElementById("entryTitle");
const entryAmount = document.getElementById("entryAmount");
const entryCategory = document.getElementById("entryCategory");
const entryAccount = document.getElementById("entryAccount");
const entryFromAccount = document.getElementById("entryFromAccount");
const entryToAccount = document.getElementById("entryToAccount");
const entryDate = document.getElementById("entryDate");
const entryNotes = document.getElementById("entryNotes");
const formModeCopy = document.getElementById("formModeCopy");
const submitButton = document.getElementById("submitButton");
const cancelEditButton = document.getElementById("cancelEditButton");

const categoryField = document.getElementById("categoryField");
const accountField = document.getElementById("accountField");
const fromAccountField = document.getElementById("fromAccountField");
const toAccountField = document.getElementById("toAccountField");

const walletCards = document.getElementById("walletCards");
const balanceForm = document.getElementById("balanceForm");
const balanceCurrent = document.getElementById("balanceCurrent");
const balanceSavings = document.getElementById("balanceSavings");
const balanceInvestments = document.getElementById("balanceInvestments");
const balanceCreditCard = document.getElementById("balanceCreditCard");
const creditCardBillForm = document.getElementById("creditCardBillForm");
const creditCardStatementDate = document.getElementById("creditCardStatementDate");
const resetCreditCardBillButton = document.getElementById("resetCreditCardBillButton");
const ccBillDue = document.getElementById("ccBillDue");
const ccBillMeta = document.getElementById("ccBillMeta");
const ccBillPeriod = document.getElementById("ccBillPeriod");
const currencySelect = document.getElementById("currencySelect");
const startMonthButton = document.getElementById("startMonthButton");
const startMonthButtonAlt = document.getElementById("startMonthButtonAlt");
const restoreBackupButton = document.getElementById("restoreBackupButton");
const saveBackupButton = document.getElementById("saveBackupButton");
const resetAllButton = document.getElementById("resetAllButton");
const backupStatus = document.getElementById("backupStatus");
const historyList = document.getElementById("historyList");
const historyCount = document.getElementById("historyCount");
const cycleLabel = document.getElementById("cycleLabel");
const kpiSpentValue = document.getElementById("kpiSpentValue");
const kpiSpentBadge = document.getElementById("kpiSpentBadge");
const kpiSpentSub = document.getElementById("kpiSpentSub");
const kpiAvailValue = document.getElementById("kpiAvailValue");
const kpiAvailSub = document.getElementById("kpiAvailSub");
const kpiVelocityValue = document.getElementById("kpiVelocityValue");
const kpiVelocitySub = document.getElementById("kpiVelocitySub");
const kpiCreditValue = document.getElementById("kpiCreditValue");
const kpiCreditBadge = document.getElementById("kpiCreditBadge");
const kpiCreditSub = document.getElementById("kpiCreditSub");
const todaySpend = document.getElementById("todaySpend");
const weekSpend = document.getElementById("weekSpend");
const todayChange = document.getElementById("todayChange");
const weekChange = document.getElementById("weekChange");
const categoryBreakdownTotal = document.getElementById("categoryBreakdownTotal");
const categoryBreakdown = document.getElementById("categoryBreakdown");
const wowSummary = document.getElementById("wowSummary");
const wowTable = document.getElementById("wowTable");
const momSummary = document.getElementById("momSummary");
const momTable = document.getElementById("momTable");
const topExpensesList = document.getElementById("topExpensesList");
const chartScroll = document.getElementById("chartScroll");
const trendCanvas = document.getElementById("trendChart");
const chartTooltip = document.getElementById("chartTooltip");
const walletCardTemplate = document.getElementById("walletCardTemplate");
const themeToggle = document.getElementById("themeToggle");
const toastContainer = document.getElementById("toastContainer");
const historySearch = document.getElementById("historySearch");
const historyFilterCategory = document.getElementById("historyFilterCategory");
const historyFilterType = document.getElementById("historyFilterType");
const exportDataButton = document.getElementById("exportDataButton");
const importDataButton = document.getElementById("importDataButton");
const importFileInput = document.getElementById("importFileInput");
const voiceButton = document.getElementById("voiceButton");
const voiceStatus = document.getElementById("voiceStatus");
const voiceStatusText = document.getElementById("voiceStatusText");
const voiceTranscript = document.getElementById("voiceTranscript");

const loadingScreen = document.getElementById("loadingScreen");
const authScreen = document.getElementById("authScreen");
const appShell = document.getElementById("appShell");
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const loginError = document.getElementById("loginError");
const signupName = document.getElementById("signupName");
const signupEmail = document.getElementById("signupEmail");
const signupPassword = document.getElementById("signupPassword");
const signupError = document.getElementById("signupError");
const googleSignInButton = document.getElementById("googleSignInButton");
const logoutButton = document.getElementById("logoutButton");
const userDisplayName = document.getElementById("userDisplayName");
const userAvatar = document.getElementById("userAvatar");
const userTier = document.getElementById("userTier");
const logSpendButton = document.getElementById("logSpendButton");
const menuToggle = document.getElementById("menuToggle");
const sidebar = document.querySelector(".sidebar");
const sideLinks = document.querySelectorAll(".side-link");

let chartPoints = [];
let voiceRecognition = null;
let isRecording = false;

// Currency changes instantly on selection
currencySelect.addEventListener("change", handleCurrencyChange);

// Auth event listeners
setupAuthUI();
applyTheme();

auth.onAuthStateChanged(async (user) => {
  if (user) {
    currentUser = user;
    await loadStateFromFirestore();
    showApp();
    bootstrap();
  } else {
    currentUser = null;
    showAuthScreen();
  }
});

function setupAuthUI() {
  document.querySelectorAll(".auth-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".auth-tab").forEach((t) => t.classList.remove("is-active"));
      tab.classList.add("is-active");
      const panel = tab.dataset.authTab;
      loginForm.classList.toggle("is-hidden", panel !== "login");
      signupForm.classList.toggle("is-hidden", panel !== "signup");
      loginError.classList.add("is-hidden");
      signupError.classList.add("is-hidden");
    });
  });

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    loginError.classList.add("is-hidden");
    const btn = loginForm.querySelector(".auth-submit");
    btn.disabled = true;
    btn.textContent = "Logging in...";
    try {
      await auth.signInWithEmailAndPassword(loginEmail.value, loginPassword.value);
    } catch (err) {
      loginError.textContent = friendlyAuthError(err.code);
      loginError.classList.remove("is-hidden");
      btn.disabled = false;
      btn.textContent = "Log in";
    }
  });

  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    signupError.classList.add("is-hidden");
    const btn = signupForm.querySelector(".auth-submit");
    btn.disabled = true;
    btn.textContent = "Creating account...";
    try {
      const cred = await auth.createUserWithEmailAndPassword(signupEmail.value, signupPassword.value);
      await cred.user.updateProfile({ displayName: signupName.value });
    } catch (err) {
      signupError.textContent = friendlyAuthError(err.code);
      signupError.classList.remove("is-hidden");
      btn.disabled = false;
      btn.textContent = "Create account";
    }
  });

  googleSignInButton.addEventListener("click", async () => {
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      await auth.signInWithPopup(provider);
    } catch (err) {
      loginError.textContent = friendlyAuthError(err.code);
      loginError.classList.remove("is-hidden");
    }
  });

  logoutButton.addEventListener("click", () => {
    if (confirm("Log out of Expense Flow?")) {
      auth.signOut();
    }
  });
}

function friendlyAuthError(code) {
  const messages = {
    "auth/invalid-email": "Invalid email address.",
    "auth/user-disabled": "This account has been disabled.",
    "auth/user-not-found": "No account found with this email.",
    "auth/wrong-password": "Incorrect password.",
    "auth/invalid-credential": "Incorrect email or password.",
    "auth/email-already-in-use": "An account already exists with this email.",
    "auth/weak-password": "Password must be at least 6 characters.",
    "auth/popup-closed-by-user": "Sign-in popup was closed.",
    "auth/network-request-failed": "Network error. Check your connection."
  };
  return messages[code] || "Something went wrong. Please try again.";
}

function showApp() {
  loadingScreen.classList.add("is-hidden");
  authScreen.classList.add("is-hidden");
  appShell.classList.remove("is-hidden");
  const name = currentUser.displayName || (currentUser.email ? currentUser.email.split("@")[0] : "You");
  userDisplayName.textContent = name;
  if (userTier) userTier.textContent = currentUser.email || "Signed in";
  if (userAvatar) {
    const initials = name.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join("");
    userAvatar.textContent = (initials || name[0] || "?").toUpperCase();
  }
}

function showAuthScreen() {
  loadingScreen.classList.add("is-hidden");
  authScreen.classList.remove("is-hidden");
  appShell.classList.add("is-hidden");
}

let bootstrapped = false;
function bootstrap() {
  if (bootstrapped) {
    render();
    return;
  }
  bootstrapped = true;

  populateSelects();
  populateHistoryFilterCategories();
  entryDate.value = todayLocal();
  syncFormVisibility();
  render();
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  window.scrollTo(0, 0);
  setActiveNav("overview");
  setupScrollSpy();

  transactionForm.addEventListener("submit", handleSubmit);
  balanceForm.addEventListener("submit", handleBalanceSubmit);
  creditCardBillForm.addEventListener("submit", handleCreditCardBillSubmit);
  if (resetCreditCardBillButton) resetCreditCardBillButton.addEventListener("click", handleResetCreditCardBill);
  startMonthButton.addEventListener("click", handleStartFreshMonth);
  if (startMonthButtonAlt) startMonthButtonAlt.addEventListener("click", handleStartFreshMonth);
  restoreBackupButton.addEventListener("click", handleRestoreBackup);
  if (saveBackupButton) saveBackupButton.addEventListener("click", handleSaveBackup);
  resetAllButton.addEventListener("click", handleResetAllData);
  entryType.addEventListener("change", syncFormVisibility);
  cancelEditButton.addEventListener("click", resetFormState);
  historyList.addEventListener("click", handleTransactionActions);
  window.addEventListener("resize", renderTrendChart);
  trendCanvas.addEventListener("mousemove", handleChartHover);
  trendCanvas.addEventListener("mouseleave", hideChartTooltip);
  trendCanvas.addEventListener("click", handleChartClick);
  themeToggle.addEventListener("click", toggleTheme);
  historySearch.addEventListener("input", renderFilteredHistory);
  historyFilterCategory.addEventListener("change", renderFilteredHistory);
  historyFilterType.addEventListener("change", renderFilteredHistory);
  exportDataButton.addEventListener("click", handleExportData);
  importDataButton.addEventListener("click", () => importFileInput.click());
  importFileInput.addEventListener("change", handleImportData);
  voiceButton.addEventListener("click", toggleVoiceInput);

  document.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === "n") {
      event.preventDefault();
      scrollToSection("captureCard");
      setTimeout(() => entryTitle.focus(), 320);
    }
  });

  document.querySelectorAll(".tab-button").forEach((button) => {
    button.addEventListener("click", () => {
      currentRange = button.dataset.range;
      document.querySelectorAll(".tab-button").forEach((tab) => tab.classList.remove("is-active"));
      button.classList.add("is-active");
      renderTrendChart();
    });
  });

  document.querySelectorAll(".breakdown-tab").forEach((button) => {
    button.addEventListener("click", () => {
      breakdownPeriod = button.dataset.breakdown;
      document.querySelectorAll(".breakdown-tab").forEach((tab) => tab.classList.remove("is-active"));
      button.classList.add("is-active");
      renderCategoryBreakdown();
    });
  });

  sideLinks.forEach((link) => {
    link.addEventListener("click", () => {
      setActiveNav(link.dataset.nav);
      scrollToSection(link.dataset.scroll);
      closeSidebar();
    });
  });

  if (logSpendButton) {
    logSpendButton.addEventListener("click", () => {
      setActiveNav("capture");
      scrollToSection("captureCard");
      setTimeout(() => entryTitle.focus(), 320);
    });
  }

  document.addEventListener("click", (event) => {
    if (event.target.closest(".ledger-action")) return;
    document.querySelectorAll(".row-menu.is-open").forEach((m) => m.classList.remove("is-open"));
  });

  if (menuToggle) menuToggle.addEventListener("click", () => sidebar.classList.toggle("is-open"));
  document.addEventListener("click", (event) => {
    if (!sidebar.classList.contains("is-open")) return;
    if (sidebar.contains(event.target) || (menuToggle && menuToggle.contains(event.target))) return;
    closeSidebar();
  });
}

function closeSidebar() {
  if (sidebar) sidebar.classList.remove("is-open");
}

function setActiveNav(navId) {
  sideLinks.forEach((link) => link.classList.toggle("is-active", link.dataset.nav === navId));
}

function scrollToSection(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - 84;
  window.scrollTo({ top: Math.max(top, 0), behavior: "smooth" });
}

let scrollSpyObserver = null;
function setupScrollSpy() {
  if (scrollSpyObserver) scrollSpyObserver.disconnect();
  const map = new Map();
  const visible = new Set();
  sideLinks.forEach((link) => {
    const el = link.dataset.scroll ? document.getElementById(link.dataset.scroll) : null;
    if (el) map.set(el, link);
  });
  if (!map.size) return;

  const updateActive = () => {
    let best = null;
    visible.forEach((el) => {
      const top = el.getBoundingClientRect().top;
      if (!best || top < best.top) best = { el, top };
    });
    if (best) setActiveNav(map.get(best.el).dataset.nav);
  };

  scrollSpyObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) visible.add(entry.target);
      else visible.delete(entry.target);
    });
    updateActive();
  }, { rootMargin: "-84px 0px -70% 0px", threshold: 0 });

  map.forEach((_, el) => scrollSpyObserver.observe(el));
}

function getUserDoc() {
  return db.collection("users").doc(currentUser.uid);
}

async function loadStateFromFirestore() {
  try {
    const doc = await getUserDoc().get();
    if (doc.exists) {
      const data = doc.data();
      state = {
        baseBalances: { ...defaultState.baseBalances, ...data.baseBalances },
        settings: { ...defaultState.settings, ...data.settings },
        transactions: Array.isArray(data.transactions) ? data.transactions : []
      };
    } else {
      state = structuredClone(defaultState);
      await getUserDoc().set(state);
    }
  } catch (error) {
    console.error("Unable to load state from Firestore", error);
    state = structuredClone(defaultState);
  }
}

function saveState() {
  if (!currentUser) return;
  clearTimeout(saveDebounceTimer);
  saveDebounceTimer = setTimeout(() => {
    getUserDoc().set({
      baseBalances: state.baseBalances,
      settings: state.settings,
      transactions: state.transactions
    }).catch((err) => console.error("Save failed", err));
  }, 500);
}

function createBackup(reason) {
  if (!currentUser) return Promise.resolve();
  const backup = {
    reason,
    createdAt: new Date().toISOString(),
    state: structuredClone(state)
  };
  return getUserDoc().collection("backups").doc("latest").set(backup)
    .catch((err) => console.error("Backup save failed", err));
}

async function handleSaveBackup() {
  if (!currentUser) {
    showToast("Sign in to save a backup point.", "error");
    return;
  }
  await createBackup("manual backup");
  await renderBackupStatus();
  showToast("Backup point saved", "success");
}

async function loadBackup() {
  if (!currentUser) return null;
  try {
    const doc = await getUserDoc().collection("backups").doc("latest").get();
    return doc.exists ? doc.data() : null;
  } catch (error) {
    console.error("Unable to load backup", error);
    return null;
  }
}

function populateSelects() {
  entryCategory.innerHTML = CATEGORIES.map((category) => `<option value="${category}">${category}</option>`).join("");

  const accountOptions = ACCOUNTS.map((account) => `<option value="${account.id}">${account.label}</option>`).join("");
  entryAccount.innerHTML = accountOptions;
  entryFromAccount.innerHTML = accountOptions;
  entryToAccount.innerHTML = accountOptions;
}

function syncFormVisibility() {
  const type = entryType.value;
  const isTransfer = type === "transfer";

  categoryField.classList.toggle("is-hidden", isTransfer);
  accountField.classList.toggle("is-hidden", isTransfer);
  fromAccountField.classList.toggle("is-hidden", !isTransfer);
  toAccountField.classList.toggle("is-hidden", !isTransfer);
}

function handleSubmit(event) {
  event.preventDefault();

  const type = entryType.value;
  const amount = Number(entryAmount.value);
  if (!amount || amount < 0) {
    return;
  }

  const transaction = {
    id: editingTransactionId || crypto.randomUUID(),
    type,
    title: entryTitle.value.trim(),
    amount,
    date: entryDate.value,
    notes: entryNotes.value.trim()
  };

  if (type === "transfer") {
    if (entryFromAccount.value === entryToAccount.value) {
      showToast("Choose different accounts for transfer.", "error");
      return;
    }
    transaction.category = "Investment";
    transaction.fromAccount = entryFromAccount.value;
    transaction.toAccount = entryToAccount.value;
  } else {
    transaction.category = entryCategory.value;
    transaction.account = entryAccount.value;
  }

  if (editingTransactionId) {
    state.transactions = state.transactions.map((item) => item.id === editingTransactionId ? transaction : item);
  } else {
    state.transactions.unshift(transaction);
  }
  const wasEditing = !!editingTransactionId;
  saveState();
  resetFormState({ preserveEntryContext: !wasEditing });
  render();
  showToast(wasEditing ? "Transaction updated" : "Transaction saved", "success");
}

function handleBalanceSubmit(event) {
  event.preventDefault();

  state.baseBalances = {
    current: Number(balanceCurrent.value) || 0,
    savings: Number(balanceSavings.value) || 0,
    investments: Number(balanceInvestments.value) || 0,
    creditCard: Number(balanceCreditCard.value) || 0
  };

  saveState();
  render();
  showToast("Balances updated", "success");
}

function handleCreditCardBillSubmit(event) {
  event.preventDefault();

  state.settings.creditCardStatementDate = creditCardStatementDate.value || getDefaultCreditCardStatementDate();
  saveState();
  render();
}

function handleCurrencyChange() {
  state.settings.currency = currencySelect.value;
  saveState();
  render();
  showToast(`Currency set to ${currencySelect.value}`, "success");
}

function handleStartFreshMonth() {
  const confirmed = confirm("Start a fresh month? This will clear all recorded transactions and keep your current opening balances.");
  if (!confirmed) {
    return;
  }

  createBackup("before starting fresh month");
  state.transactions = [];
  saveState();
  render();
}

async function handleRestoreBackup() {
  const backup = await loadBackup();
  if (!backup?.state) {
    showToast("No backup restore point found.", "error");
    return;
  }

  const confirmed = confirm(`Restore backup from ${formatBackupDate(backup.createdAt)}? This will replace the current app data.`);
  if (!confirmed) {
    return;
  }

  state = {
    baseBalances: { ...defaultState.baseBalances, ...backup.state.baseBalances },
    settings: { ...defaultState.settings, ...backup.state.settings },
    transactions: Array.isArray(backup.state.transactions) ? backup.state.transactions : []
  };
  saveState();
  resetFormState();
  render();
}

function handleResetAllData() {
  const confirmed = confirm("Reset all app data? This will clear balances and every saved transaction.");
  if (!confirmed) {
    return;
  }

  createBackup("before resetting all data");
  state = structuredClone(defaultState);
  saveState();
  resetFormState();
  render();
}

function handleTransactionActions(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) {
    return;
  }

  if (button.dataset.action === "menu") {
    const menu = button.parentElement.querySelector(".row-menu");
    const wasOpen = menu.classList.contains("is-open");
    document.querySelectorAll(".row-menu.is-open").forEach((m) => m.classList.remove("is-open"));
    if (!wasOpen) menu.classList.add("is-open");
    event.stopPropagation();
    return;
  }

  const transaction = state.transactions.find((item) => item.id === button.dataset.id);
  if (!transaction) {
    return;
  }

  if (button.dataset.action === "delete") {
    const confirmed = confirm("Delete this transaction?");
    if (!confirmed) {
      return;
    }

    createBackup("before deleting transaction");
    state.transactions = state.transactions.filter((item) => item.id !== transaction.id);
    saveState();

    if (editingTransactionId === transaction.id) {
      resetFormState();
    }

    render();
    showToast("Transaction deleted", "info");
    return;
  }

  populateFormForEdit(transaction);
}

function populateFormForEdit(transaction) {
  editingTransactionId = transaction.id;
  entryType.value = transaction.type;
  entryTitle.value = transaction.title;
  entryAmount.value = transaction.amount;
  entryDate.value = transaction.date;
  entryNotes.value = transaction.notes || "";

  syncFormVisibility();

  if (transaction.type === "transfer") {
    entryFromAccount.value = transaction.fromAccount;
    entryToAccount.value = transaction.toAccount;
  } else {
    entryCategory.value = transaction.category;
    entryAccount.value = transaction.account;
  }

  submitButton.textContent = "Save Changes";
  cancelEditButton.classList.remove("is-hidden");
  if (formModeCopy) formModeCopy.textContent = "Editing an existing transaction. Update the values and save your changes.";
  scrollToSection("captureCard");
}

function resetFormState(options = {}) {
  const { preserveEntryContext = false } = options;
  const preservedValues = preserveEntryContext ? {
    type: entryType.value,
    category: entryCategory.value,
    account: entryAccount.value,
    fromAccount: entryFromAccount.value,
    toAccount: entryToAccount.value,
    date: entryDate.value
  } : null;

  editingTransactionId = null;
  transactionForm.reset();

  if (preservedValues) {
    entryType.value = preservedValues.type;
    entryCategory.value = preservedValues.category;
    entryAccount.value = preservedValues.account;
    entryFromAccount.value = preservedValues.fromAccount;
    entryToAccount.value = preservedValues.toAccount;
    entryDate.value = preservedValues.date;
  } else {
    entryType.value = "expense";
    entryDate.value = todayLocal();
  }

  syncFormVisibility();
  submitButton.textContent = "Save Transaction";
  cancelEditButton.classList.add("is-hidden");
  if (formModeCopy) formModeCopy.textContent = "Create a new expense, income, or transfer entry.";
}

function render() {
  renderHero();
  renderWallets();
  renderQuickStats();
  renderTrendChart();
  renderCategoryBreakdown();
  renderWoW();
  renderMoM();
  renderTopExpenses();
  renderTransactions();
  renderBackupStatus();
}

function renderQuickStats() {
  const today = spendingForPeriod("day", 0);
  const yesterday = spendingForPeriod("day", 1);
  const week = spendingForPeriod("week", 0);
  const lastWeek = spendingForPeriod("week", 1);

  todaySpend.textContent = formatCurrency(today);
  weekSpend.textContent = formatCurrency(week);

  todayChange.textContent = buildDeltaCopy(today, yesterday, "vs yesterday");
  weekChange.textContent = buildDeltaCopy(week, lastWeek, "vs last week");
}

function renderCategoryBreakdown() {
  const period = breakdownPeriod === "month"
    ? getComparisonPeriod("monthly", 0)
    : getComparisonPeriod("weekly", 0);
  const totals = categoryTotalsForWindow(period.start, period.end);
  const total = sumCategoryTotals(totals);
  const sorted = [...totals.entries()].sort((a, b) => b[1] - a[1]);
  const max = sorted.length ? sorted[0][1] : 1;

  categoryBreakdownTotal.innerHTML = total
    ? `<span class="breakdown-total-amount">${formatCurrency(total)}</span><span class="breakdown-total-label">total ${breakdownPeriod === "month" ? "this month" : "this week"}</span>`
    : `<span class="breakdown-total-label">No spending recorded ${breakdownPeriod === "month" ? "this month" : "this week"}</span>`;

  if (!sorted.length) {
    categoryBreakdown.innerHTML = `<div class="empty-state">Add expenses to see your category breakdown.</div>`;
    return;
  }

  const colors = ["#0f9d76", "#8b5cf6", "#12b6cf", "#f5a623", "#f4526b", "#3b82f6", "#14b8a6", "#f97316", "#ec4899", "#84cc16", "#a855f7", "#06b6d4", "#78716c"];

  let acc = 0;
  const stops = sorted.map(([, amount], i) => {
    const start = (acc / total) * 360;
    acc += amount;
    const end = (acc / total) * 360;
    return `${colors[i % colors.length]} ${start}deg ${end}deg`;
  }).join(", ");

  const [topCategory, topAmount] = sorted[0];
  const topPercent = Math.round((topAmount / total) * 100);

  // Build SVG donut segments (r chosen so circumference ≈ 100 => percents map to dash lengths)
  let cumulative = 0;
  const segments = sorted.map(([category, amount], i) => {
    const pct = (amount / total) * 100;
    const dash = `${pct} ${100 - pct}`;
    const offset = 25 - cumulative; // start at 12 o'clock, go clockwise
    cumulative += pct;
    return `<circle class="donut-seg" cx="21" cy="21" r="15.915" fill="none"
      stroke="${colors[i % colors.length]}" stroke-width="5.5"
      stroke-dasharray="${dash}" stroke-dashoffset="${offset}"
      data-cat="${escapeHtml(category)}" data-amt="${formatCurrency(amount)}" data-pct="${Math.round(pct)}"
      data-index="${i}"><title>${escapeHtml(category)} — ${formatCurrency(amount)} (${Math.round(pct)}%)</title></circle>`;
  }).join("");

  const legend = sorted.map(([category, amount], i) => {
    const pct = Math.round((amount / total) * 100);
    return `
      <div class="legend-row" data-index="${i}">
        <span class="legend-swatch" style="background:${colors[i % colors.length]}"></span>
        <span class="legend-name">${CATEGORY_EMOJI[category] || ""} ${escapeHtml(category)}</span>
        <span class="legend-amount">${formatCurrency(amount)}</span>
        <span class="legend-pct">${pct}%</span>
      </div>
    `;
  }).join("");

  categoryBreakdown.innerHTML = `
    <div class="donut-wrap">
      <div class="donut-chart">
        <svg viewBox="0 0 42 42" class="donut-svg" role="img" aria-label="Category breakdown donut chart">
          <circle cx="21" cy="21" r="15.915" fill="none" stroke="var(--chip)" stroke-width="5.5"></circle>
          ${segments}
        </svg>
        <div class="donut-center">
          <strong>${topPercent}%</strong>
          <span>${escapeHtml(topCategory)}</span>
        </div>
      </div>
      <div class="donut-side">
        <div class="donut-legend">${legend}</div>
        <p class="donut-hint">Click a slice or category to see its transactions</p>
      </div>
    </div>
    <div class="category-detail is-hidden" id="categoryDetail"></div>
  `;

  wireDonutInteraction(topPercent, topCategory, { period, colors });
}

function wireDonutInteraction(defaultPct, defaultLabel, context) {
  const segs = categoryBreakdown.querySelectorAll(".donut-seg");
  const legendRows = categoryBreakdown.querySelectorAll(".legend-row");
  const center = categoryBreakdown.querySelector(".donut-center");
  if (!center) return;

  const highlight = (index) => {
    segs.forEach((s) => s.classList.toggle("is-active", Number(s.dataset.index) === index));
    legendRows.forEach((r) => r.classList.toggle("is-active", Number(r.dataset.index) === index));
    const seg = [...segs].find((s) => Number(s.dataset.index) === index);
    if (seg) {
      center.innerHTML = `<strong>${seg.dataset.pct}%</strong><span>${escapeHtml(seg.dataset.cat)}</span><em>${escapeHtml(seg.dataset.amt)}</em>`;
    }
  };

  const reset = () => {
    segs.forEach((s) => s.classList.remove("is-active"));
    legendRows.forEach((r) => r.classList.remove("is-active"));
    center.innerHTML = `<strong>${defaultPct}%</strong><span>${escapeHtml(defaultLabel)}</span>`;
  };

  const drill = (index) => {
    const seg = [...segs].find((s) => Number(s.dataset.index) === index)
      || [...legendRows].find((r) => Number(r.dataset.index) === index);
    if (!seg) return;
    showCategoryDetail(seg.dataset.cat, context.colors[index % context.colors.length], context.period);
  };

  segs.forEach((seg) => {
    seg.addEventListener("mouseenter", () => highlight(Number(seg.dataset.index)));
    seg.addEventListener("mouseleave", reset);
    seg.addEventListener("click", () => drill(Number(seg.dataset.index)));
  });
  legendRows.forEach((row) => {
    row.addEventListener("mouseenter", () => highlight(Number(row.dataset.index)));
    row.addEventListener("mouseleave", reset);
    row.addEventListener("click", () => drill(Number(row.dataset.index)));
  });
}

function showCategoryDetail(category, color, period) {
  const detail = document.getElementById("categoryDetail");
  const wrap = categoryBreakdown.querySelector(".donut-wrap");
  if (!detail || !wrap) return;

  const txns = state.transactions
    .filter(isSpendingEntry)
    .filter((t) => t.category === category)
    .filter((t) => {
      const dt = parseLocalDate(t.date);
      return dt >= period.start && dt <= period.end;
    })
    .sort((a, b) => b.amount - a.amount);

  const total = txns.reduce((sum, t) => sum + t.amount, 0);

  const rows = txns.length
    ? txns.map((t) => {
        const account = t.type === "transfer"
          ? `${labelForAccount(t.fromAccount)} → ${labelForAccount(t.toAccount)}`
          : labelForAccount(t.account);
        return `
          <div class="cd-row">
            <span class="cd-icon">${CATEGORY_EMOJI[t.category] || "📌"}</span>
            <div class="cd-text">
              <div class="cd-title">${escapeHtml(t.title)}</div>
              <div class="cd-meta">${formatDate(t.date)} · ${escapeHtml(account)}</div>
            </div>
            <div class="cd-amount">${formatCurrency(t.amount)}</div>
          </div>`;
      }).join("")
    : `<div class="empty-state">No transactions in this category for this period.</div>`;

  detail.innerHTML = `
    <div class="cd-head">
      <button class="cd-back" type="button">
        <svg viewBox="0 0 24 24" fill="none" width="15" height="15"><path d="M15 6l-6 6 6 6" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>
        Back
      </button>
      <div class="cd-head-main">
        <span class="cd-dot" style="background:${color}"></span>
        <strong>${escapeHtml(category)}</strong>
        <span class="cd-count">${txns.length} txn${txns.length === 1 ? "" : "s"}</span>
      </div>
      <span class="cd-total">${formatCurrency(total)}</span>
    </div>
    <div class="cd-list">${rows}</div>
  `;

  detail.querySelector(".cd-back").addEventListener("click", () => {
    detail.classList.add("is-hidden");
    wrap.classList.remove("is-hidden");
  });

  wrap.classList.add("is-hidden");
  detail.classList.remove("is-hidden");
}

function renderComparisonPanel(range, summaryEl, tableEl) {
  const currentPeriod = getComparisonPeriod(range, 0);
  const previousPeriod = getComparisonPeriod(range, 1);
  const currentTotals = categoryTotalsForWindow(currentPeriod.start, currentPeriod.end);
  const previousTotals = categoryTotalsForWindow(previousPeriod.start, previousPeriod.end);
  const currentTotal = sumCategoryTotals(currentTotals);
  const previousTotal = sumCategoryTotals(previousTotals);
  const delta = currentTotal - previousTotal;
  const deltaPercent = previousTotal ? Math.round((delta / previousTotal) * 100) : null;
  const deltaClass = delta > 0 ? "delta-up" : delta < 0 ? "delta-down" : "delta-flat";
  const deltaLabel = deltaPercent === null
    ? (currentTotal ? "New" : "-")
    : `${Math.abs(deltaPercent)}% ${delta > 0 ? "up" : delta < 0 ? "down" : "flat"}`;

  summaryEl.innerHTML = `
    <article class="wow-summary-card">
      <span>${escapeHtml(currentPeriod.shortLabel)}</span>
      <strong>${formatCurrency(currentTotal)}</strong>
      <small>${formatDateRange(currentPeriod.start, currentPeriod.end)}</small>
    </article>
    <article class="wow-summary-card">
      <span>${escapeHtml(previousPeriod.shortLabel)}</span>
      <strong>${formatCurrency(previousTotal)}</strong>
      <small class="${deltaClass}">${deltaLabel}</small>
    </article>
  `;

  const categories = [...new Set([...currentTotals.keys(), ...previousTotals.keys()])]
    .sort((a, b) => (currentTotals.get(b) || 0) - (currentTotals.get(a) || 0));

  if (!categories.length) {
    tableEl.innerHTML = `<div class="empty-state">Add expenses to compare periods.</div>`;
    return;
  }

  const header = `<div class="ct-header"><div>Category</div><div style="text-align:right">Current</div><div style="text-align:right">Previous</div><div style="text-align:right">Change</div></div>`;
  const rows = categories.map((category) => {
    const curr = currentTotals.get(category) || 0;
    const prev = previousTotals.get(category) || 0;
    const d = curr - prev;
    const dp = prev ? Math.round((d / prev) * 100) : curr ? null : 0;
    const dc = d > 0 ? "delta-up" : d < 0 ? "delta-down" : "delta-flat";
    const dl = dp === null ? "New" : dp === 0 ? "-" : `${dp > 0 ? "+" : ""}${dp}%`;
    return `<div class="ct-row"><div class="ct-cell-name">${CATEGORY_EMOJI[category] || ""} ${escapeHtml(category)}</div><div class="ct-cell-amount">${formatCurrency(curr)}</div><div class="ct-cell-amount">${formatCurrency(prev)}</div><div class="ct-cell-delta ${dc}">${dl}</div></div>`;
  }).join("");

  tableEl.innerHTML = header + rows;
}

function renderWoW() {
  renderComparisonPanel("weekly", wowSummary, wowTable);
}

function renderMoM() {
  renderComparisonPanel("monthly", momSummary, momTable);
}

function renderTopExpenses() {
  const monthPeriod = getComparisonPeriod("monthly", 0);
  const prevMonthPeriod = getComparisonPeriod("monthly", 1);
  const currentTotals = categoryTotalsForWindow(monthPeriod.start, monthPeriod.end);
  const prevTotals = categoryTotalsForWindow(prevMonthPeriod.start, prevMonthPeriod.end);
  const currentTotal = sumCategoryTotals(currentTotals);
  const prevTotal = sumCategoryTotals(prevTotals);
  const delta = currentTotal - prevTotal;
  const deltaPercent = prevTotal ? Math.round((delta / prevTotal) * 100) : null;
  const deltaClass = delta > 0 ? "delta-up" : delta < 0 ? "delta-down" : "delta-flat";
  const deltaText = deltaPercent === null
    ? (currentTotal ? "New month" : "-")
    : `${Math.abs(deltaPercent)}% ${delta > 0 ? "more" : "less"} than last month (${formatCurrency(prevTotal)})`;

  const expenses = state.transactions
    .filter(isSpendingEntry)
    .filter((t) => {
      const d = parseLocalDate(t.date);
      return d >= monthPeriod.start && d <= monthPeriod.end;
    })
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8);

  if (!expenses.length) {
    topExpensesList.innerHTML = `<div class="empty-state">No expenses this month yet.</div>`;
    return;
  }

  const deltaRow = `<div class="top-expenses-delta"><span class="breakdown-total-amount">${formatCurrency(currentTotal)}</span> <span class="${deltaClass}" style="font-weight:600;font-size:0.92rem">${deltaText}</span></div>`;

  const rows = expenses.map((t, i) => {
    const catCurr = currentTotals.get(t.category) || 0;
    const catPrev = prevTotals.get(t.category) || 0;
    const catDelta = catCurr - catPrev;
    const catDeltaPercent = catPrev ? Math.round((catDelta / catPrev) * 100) : null;
    const catDeltaClass = catDelta > 0 ? "delta-up" : catDelta < 0 ? "delta-down" : "delta-flat";
    const catDeltaText = catDeltaPercent === null
      ? "New"
      : `${catDeltaPercent > 0 ? "+" : ""}${catDeltaPercent}%`;

    return `
      <article class="top-expense-row">
        <div class="top-expense-rank">${i + 1}</div>
        <div class="top-expense-details">
          <div class="top-expense-title">${escapeHtml(t.title)}</div>
          <div class="top-expense-meta">${formatDate(t.date)} &middot; ${CATEGORY_EMOJI[t.category] || ""} ${t.category} &middot; ${labelForAccount(t.account || t.fromAccount)}</div>
        </div>
        <div class="top-expense-right">
          <div class="top-expense-amount">${formatCurrency(t.amount)}</div>
          <div class="top-expense-cat-delta ${catDeltaClass}">${escapeHtml(t.category)} ${catDeltaText} vs last month</div>
        </div>
      </article>
    `;
  }).join("");

  topExpensesList.innerHTML = deltaRow + rows;
}

async function renderBackupStatus() {
  const backup = await loadBackup();
  if (!backup?.createdAt) {
    backupStatus.textContent = "No restore point yet. One will be created before clear or delete actions.";
    return;
  }

  backupStatus.textContent = `Last restore point: ${formatBackupDate(backup.createdAt)} (${backup.reason || "manual backup"})`;
}

function renderHero() {
  const balances = calculateBalances();
  const now = new Date();
  const monthTotal = spendingForPeriod("month", 0);
  const lastMonthTotal = spendingForPeriod("month", 1);
  const todayTotal = spendingForPeriod("day", 0);
  const elapsedDays = Math.max(1, now.getDate());
  const dailyAvg = monthTotal / elapsedDays;

  if (cycleLabel) {
    const monthName = now.toLocaleDateString(undefined, { month: "long", year: "numeric" });
    cycleLabel.textContent = `${monthName} • Active cycle`;
  }

  // KPI 1 — Total Spent This Month
  kpiSpentValue.textContent = formatCurrency(monthTotal);
  if (lastMonthTotal > 0) {
    const deltaPct = Math.round(((monthTotal - lastMonthTotal) / lastMonthTotal) * 100);
    const down = deltaPct <= 0;
    kpiSpentBadge.className = `badge ${down ? "" : "badge-red"}`.trim();
    kpiSpentBadge.textContent = `${down ? "▼" : "▲"} ${Math.abs(deltaPct)}% vs last mo`;
  } else {
    kpiSpentBadge.className = "badge badge-blue";
    kpiSpentBadge.textContent = "This month";
  }
  kpiSpentSub.innerHTML = `Avg <strong>${formatCurrency(dailyAvg)}</strong> / day`;

  // KPI 2 — Available Across Wallets (liquid)
  const liquid = (balances.current || 0) + (balances.savings || 0) + (balances.investments || 0);
  const fundedCount = ["current", "savings", "investments"].filter((k) => (balances[k] || 0) > 0).length;
  kpiAvailValue.textContent = formatCurrency(liquid);
  kpiAvailSub.innerHTML = `Across <strong>${fundedCount}</strong> funded account${fundedCount === 1 ? "" : "s"}`;

  // KPI 3 — Daily Average
  kpiVelocityValue.textContent = formatCurrency(dailyAvg);
  kpiVelocitySub.innerHTML = `Over <strong>${elapsedDays}</strong> day${elapsedDays === 1 ? "" : "s"} this month`;

  // KPI 4 — Credit Card Due
  const snapshot = calculateCreditCardBillSnapshot(balances.creditCard);
  kpiCreditValue.textContent = formatCurrency(snapshot.billDue);
  if (snapshot.billDue > 0) {
    kpiCreditBadge.className = "badge badge-red";
    kpiCreditBadge.textContent = "Bill due";
    kpiCreditSub.innerHTML = `Bill since <strong>${formatDate(toLocalDateString(snapshot.periodStart))}</strong>`;
  } else {
    kpiCreditBadge.className = "badge";
    kpiCreditBadge.textContent = "Clear";
    kpiCreditSub.innerHTML = `Cleared · bills on the 15th`;
  }
}

function renderWallets() {
  const balances = calculateBalances();
  walletCards.innerHTML = "";

  const WALLET_META = {
    current: { badge: "Primary", badgeClass: "", tag: "Primary liquidity" },
    savings: { badge: "Reserve", badgeClass: "is-blue", tag: "Reserve vault" },
    investments: { badge: "Growth", badgeClass: "is-amber", tag: "Brokerage & index" }
  };

  ACCOUNTS.forEach((account) => {
    const node = walletCardTemplate.content.firstElementChild.cloneNode(true);
    const label = node.querySelector(".wallet-label");
    const badge = node.querySelector(".wallet-badge");
    const value = node.querySelector(".wallet-value");
    const caption = node.querySelector(".wallet-caption");

    label.textContent = account.label;

    if (account.id === "creditCard") {
      const cardSnapshot = calculateCreditCardBillSnapshot(balances.creditCard);
      label.textContent = "Credit Card";
      if (cardSnapshot.billDue > 0) {
        badge.textContent = "Bill due";
        badge.className = "wallet-badge is-red";
      } else if (cardSnapshot.statementTotal > 0) {
        badge.textContent = "Paid";
        badge.className = "wallet-badge";
      } else {
        badge.textContent = "Clear";
        badge.className = "wallet-badge";
      }
      value.textContent = formatCurrency(cardSnapshot.billTotal);
      caption.innerHTML = `
        <span>${cardSnapshot.isPaid ? "Paid ✓" : "Due " + formatCurrency(cardSnapshot.billDue)}</span>
        <span>${formatDate(toLocalDateString(cardSnapshot.periodStart))} – ${formatDate(toLocalDateString(cardSnapshot.statementClose))}</span>
      `;
    } else {
      const meta = WALLET_META[account.id] || { badge: "", badgeClass: "", tag: "" };
      badge.textContent = meta.badge;
      badge.className = `wallet-badge ${meta.badgeClass}`.trim();
      value.textContent = formatCurrency(balances[account.id]);
      caption.innerHTML = `
        <span>${meta.tag}</span>
        <span>${formatCurrency(state.baseBalances[account.id])} starting</span>
      `;
    }

    walletCards.appendChild(node);
  });

  balanceCurrent.value = state.baseBalances.current;
  balanceSavings.value = state.baseBalances.savings;
  balanceInvestments.value = state.baseBalances.investments;
  balanceCreditCard.value = state.baseBalances.creditCard;
  creditCardStatementDate.value = state.settings.creditCardStatementDate;
  currencySelect.value = state.settings.currency || "INR";

  if (ccBillDue) {
    const snapshot = calculateCreditCardBillSnapshot(balances.creditCard);
    const period = `${formatDate(toLocalDateString(snapshot.periodStart))} – ${formatDate(toLocalDateString(snapshot.statementClose))}`;
    if (ccBillPeriod) ccBillPeriod.textContent = `(${period})`;
    ccBillDue.textContent = formatCurrency(snapshot.billTotal);
    const status = snapshot.isPaid ? "Paid ✓" : (snapshot.billTotal > 0 ? "Due now" : "Nothing due");
    ccBillMeta.textContent = `${status} · bills on the 15th`;
    if (resetCreditCardBillButton) resetCreditCardBillButton.disabled = snapshot.billDue <= 0;
  }
}

// The statement close date (15th) of the CURRENT billing cycle. It's this
// month's 15th until the 15th passes, then next month's — so on the 15th the
// current month's spending is still the current bill (not a past cycle).
function creditCardStatementClose(referenceDate = new Date()) {
  const dt = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), CREDIT_CARD_BILL_DAY);
  if (referenceDate.getDate() > CREDIT_CARD_BILL_DAY) {
    dt.setMonth(dt.getMonth() + 1);
  }
  return dt;
}

function calculateCreditCardBillSnapshot(totalOwed) {
  // Current statement cycle, e.g. 16 Aug – 15 Sept (closes and bills on the 15th).
  const statementClose = creditCardStatementClose();
  const statementOpen = new Date(statementClose);
  statementOpen.setMonth(statementOpen.getMonth() - 1);
  const periodStart = new Date(statementOpen);
  periodStart.setDate(periodStart.getDate() + 1);

  const paidThrough = parseLocalDate(state.settings.creditCardBillPaidThrough || "1970-01-01");
  const isPaid = paidThrough >= statementClose;

  const creditCardExpenses = state.transactions
    .filter((t) => t.type === "expense" && t.account === "creditCard");

  // Total spent in the current statement cycle — this is the bill.
  const billTotal = creditCardExpenses
    .filter((t) => {
      const d = parseLocalDate(t.date);
      return d > statementOpen && d <= statementClose;
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const billDue = isPaid ? 0 : billTotal;

  return {
    billTotal,
    billDue,
    isPaid,
    totalOwed,
    statementClose,
    statementOpen,
    periodStart,
    // aliases for any remaining references
    statementTotal: billTotal,
    currentCycleSpend: billTotal
  };
}

function handleResetCreditCardBill() {
  const balances = calculateBalances();
  const snapshot = calculateCreditCardBillSnapshot(balances.creditCard);
  if (snapshot.billDue <= 0) {
    showToast(snapshot.billTotal > 0 ? "This bill is already marked paid." : "No credit card bill due right now.", "info");
    return;
  }
  const period = `${formatDate(toLocalDateString(snapshot.periodStart))} – ${formatDate(toLocalDateString(snapshot.statementClose))}`;
  const confirmed = confirm(`Mark the credit card bill of ${formatCurrency(snapshot.billDue)} (${period}) as paid? The bill total stays visible, but the amount due resets to ${formatCurrency(0)}.`);
  if (!confirmed) return;

  state.settings.creditCardBillPaidThrough = toLocalDateString(snapshot.statementClose);
  saveState();
  render();
  showToast("Credit card bill marked as paid", "success");
}

function getDefaultCreditCardStatementDate(referenceDate = new Date()) {
  const statementDate = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), CREDIT_CARD_BILL_DAY);

  if (referenceDate.getDate() <= CREDIT_CARD_BILL_DAY) {
    statementDate.setMonth(statementDate.getMonth() - 1);
  }

  return statementDate.toLocaleDateString("en-CA");
}



function getComparisonPeriod(range, offset) {
  const today = new Date();

  if (range === "weekly") {
    const start = startOfWeek(today);
    start.setDate(start.getDate() - offset * 7);
    const end = endOfDay(new Date(start));
    end.setDate(start.getDate() + 6);
    const weekNumber = getWeekNumber(start);
    return {
      start,
      end,
      shortLabel: offset === 0 ? "This week" : "Last week",
      label: `Week ${weekNumber} (${formatDate(toLocalDateString(start))})`
    };
  }

  const start = new Date(today.getFullYear(), today.getMonth() - offset, 1);
  const end = endOfDay(new Date(today.getFullYear(), today.getMonth() - offset + 1, 0));
  return {
    start,
    end,
    shortLabel: offset === 0 ? "This month" : "Last month",
    label: start.toLocaleDateString("en-IN", { month: "long", year: "numeric" })
  };
}

function categoryTotalsForWindow(start, end) {
  const totals = new Map();
  state.transactions
    .filter(isSpendingEntry)
    .filter((item) => {
      const transactionDate = parseLocalDate(item.date);
      return transactionDate >= start && transactionDate <= end;
    })
    .forEach((item) => totals.set(item.category, (totals.get(item.category) || 0) + item.amount));
  return totals;
}

function sumCategoryTotals(totals) {
  return [...totals.values()].reduce((sum, amount) => sum + amount, 0);
}

function formatDateRange(start, end) {
  return `${formatDate(toLocalDateString(start))} to ${formatDate(toLocalDateString(end))}`;
}

function renderTransactions() {
  renderFilteredHistory();
}

function getSortedTransactions() {
  return [...state.transactions].sort((a, b) => {
    const dateDifference = new Date(b.date) - new Date(a.date);
    return dateDifference || state.transactions.indexOf(a) - state.transactions.indexOf(b);
  });
}

const CATEGORY_BADGE_CLASS = {
  Food: "badge",
  Groceries: "badge",
  Salary: "badge-blue",
  Investment: "badge-blue",
  Bills: "badge-purple",
  Entertainment: "badge-blue",
  Shopping: "badge-blue",
  Travel: "badge-amber",
  Commute: "badge-amber",
  Health: "badge-red",
  Sports: "badge-amber",
  Gifts: "badge-purple",
  Other: "badge-muted"
};

function categoryBadge(transaction) {
  if (transaction.type === "transfer") {
    return { label: "Internal Transfer", cls: "badge-purple" };
  }
  if (transaction.type === "income") {
    return { label: transaction.category, cls: "badge" };
  }
  return { label: transaction.category, cls: CATEGORY_BADGE_CLASS[transaction.category] || "badge-muted" };
}

function renderTransactionRows(transactions) {
  const header = `
    <div class="ledger-table">
      <div class="ledger-thead">
        <div>Transaction / Entity</div>
        <div>Category</div>
        <div>Source Account</div>
        <div>Date &amp; Time</div>
        <div class="ledger-right">Amount</div>
        <div class="ledger-center">Action</div>
      </div>
      <div class="ledger-tbody">`;

  if (!transactions.length) {
    return header + `<div class="empty-state">No transactions yet. Add your first transaction to build history.</div></div></div>`;
  }

  const rows = transactions.map((transaction) => {
    const accountCopy = transaction.type === "transfer"
      ? `${labelForAccount(transaction.fromAccount)} → ${labelForAccount(transaction.toAccount)}`
      : labelForAccount(transaction.account);
    const amountPrefix = transaction.type === "expense" ? "-" : transaction.type === "income" ? "+" : "";
    const badge = categoryBadge(transaction);
    const dateCopy = transaction.date === todayLocal() ? "Today" : formatDate(transaction.date);
    const desc = transaction.notes ? `<div class="ledger-entity-sub">${escapeHtml(transaction.notes)}</div>` : "";

    return `
      <div class="ledger-row">
        <div class="ledger-entity">
          <span class="ledger-icon">${CATEGORY_EMOJI[transaction.category] || "📌"}</span>
          <div class="ledger-entity-text">
            <div class="ledger-entity-title">${escapeHtml(transaction.title)}</div>
            ${desc}
          </div>
        </div>
        <div class="ledger-cat"><span class="badge ${badge.cls}">${escapeHtml(badge.label)}</span></div>
        <div class="ledger-account">${escapeHtml(accountCopy)}</div>
        <div class="ledger-date">${dateCopy}</div>
        <div class="ledger-right transaction-amount ${transaction.type}">${amountPrefix}${formatCurrency(transaction.amount)}</div>
        <div class="ledger-center ledger-action">
          <button type="button" class="row-menu-btn" data-action="menu" data-id="${transaction.id}" aria-label="Row actions">⋯</button>
          <div class="row-menu" data-menu-for="${transaction.id}">
            <button type="button" data-action="edit" data-id="${transaction.id}">Edit</button>
            <button type="button" data-action="delete" data-id="${transaction.id}">Delete</button>
          </div>
        </div>
      </div>
    `;
  }).join("");

  return header + rows + `</div></div>`;
}

function calculateBalances() {
  const balances = { ...state.baseBalances };

  state.transactions.forEach((transaction) => {
    if (transaction.type === "expense") {
      if (transaction.account === "creditCard") {
        balances.creditCard += transaction.amount;
      } else {
        balances[transaction.account] -= transaction.amount;
      }
    }

    if (transaction.type === "income") {
      if (transaction.account === "creditCard") {
        balances.creditCard -= transaction.amount;
      } else {
        balances[transaction.account] += transaction.amount;
      }
    }

    if (transaction.type === "transfer") {
      if (transaction.fromAccount === "creditCard") {
        balances.creditCard -= transaction.amount;
      } else {
        balances[transaction.fromAccount] -= transaction.amount;
      }

      if (transaction.toAccount === "creditCard") {
        balances.creditCard += transaction.amount;
      } else {
        balances[transaction.toAccount] += transaction.amount;
      }
    }
  });

  return balances;
}

function isSpendingEntry(transaction) {
  // Investment transfers count in spending reports, while balances still process them as transfers.
  return transaction.type === "expense" || (transaction.type === "transfer" && transaction.toAccount === "investments");
}

function traceSmoothPath(ctx, pts) {
  if (!pts.length) return;
  ctx.moveTo(pts[0].x, pts[0].y);
  if (pts.length < 3) {
    for (let i = 1; i < pts.length; i += 1) ctx.lineTo(pts[i].x, pts[i].y);
    return;
  }
  for (let i = 0; i < pts.length - 1; i += 1) {
    const p0 = pts[i];
    const p1 = pts[i + 1];
    const cx = (p0.x + p1.x) / 2;
    ctx.bezierCurveTo(cx, p0.y, cx, p1.y, p1.x, p1.y);
  }
}

function renderTrendChart() {
  const ctx = trendCanvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const chartData = buildChartData(currentRange);
  const viewportWidth = Math.max(chartScroll.clientWidth, 320);
  const pointSpacing = currentRange === "weekly" ? 150 : currentRange === "monthly" ? 130 : 118;
  const displayWidth = Math.max(viewportWidth, 36 + Math.max(chartData.length - 1, 1) * pointSpacing);
  const displayHeight = 320;
  trendCanvas.style.width = `${displayWidth}px`;
  trendCanvas.width = displayWidth * dpr;
  trendCanvas.height = displayHeight * dpr;
  ctx.scale(dpr, dpr);

  const width = displayWidth;
  const height = displayHeight;
  ctx.clearRect(0, 0, width, height);

  const max = Math.max(...chartData.map((item) => item.total), 1);
  const padding = { top: 18, right: 20, bottom: 52, left: 18 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const step = chartData.length > 1 ? innerWidth / (chartData.length - 1) : innerWidth;

  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  ctx.lineWidth = 1;
  ctx.strokeStyle = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(29, 26, 23, 0.12)";

  for (let i = 0; i <= 4; i += 1) {
    const y = padding.top + (innerHeight / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();
  }

  const points = chartData.map((item, index) => {
    const x = padding.left + step * index;
    const y = padding.top + innerHeight - (item.total / max) * innerHeight;
    return { ...item, x, y };
  });
  chartPoints = points;

  const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
  gradient.addColorStop(0, isDark ? "rgba(36, 201, 202, 0.28)" : "rgba(18, 182, 207, 0.28)");
  gradient.addColorStop(1, "rgba(18, 182, 207, 0)");

  // Smooth (curved) area fill
  ctx.beginPath();
  traceSmoothPath(ctx, points);
  ctx.lineTo(points.at(-1).x, height - padding.bottom);
  ctx.lineTo(points[0].x, height - padding.bottom);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();

  // Average daily threshold line
  const avgTotal = chartData.reduce((sum, item) => sum + item.total, 0) / Math.max(chartData.length, 1);
  if (avgTotal > 0 && Number.isFinite(avgTotal)) {
    const avgY = padding.top + innerHeight - (avgTotal / max) * innerHeight;
    ctx.save();
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = isDark ? "rgba(240, 130, 130, 0.7)" : "rgba(244, 82, 107, 0.75)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(padding.left, avgY);
    ctx.lineTo(width - padding.right, avgY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = '600 11px "Plus Jakarta Sans"';
    ctx.fillStyle = isDark ? "rgba(240, 130, 130, 0.9)" : "rgba(214, 69, 90, 0.9)";
    ctx.textAlign = "right";
    const label = `Avg Daily Threshold · ${formatCurrency(avgTotal)}`;
    ctx.fillText(label, width - padding.right - 4, avgY - 6);
    ctx.restore();
  }

  // Smooth (curved) line
  ctx.beginPath();
  traceSmoothPath(ctx, points);
  ctx.strokeStyle = isDark ? "#24c9ca" : "#12b6cf";
  ctx.lineWidth = 3;
  ctx.lineJoin = "round";
  ctx.stroke();

  points.forEach((point) => {
    ctx.beginPath();
    ctx.arc(point.x, point.y, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = isDark ? "#24c9ca" : "#0f9d76";
    ctx.fill();
  });

  ctx.font = '12px "Plus Jakarta Sans"';
  ctx.fillStyle = isDark ? "#8a9e98" : "#6f655c";
  ctx.textAlign = "center";
  points.forEach((point) => {
    ctx.fillText(point.label, point.x, height - 22);
  });

  ctx.textAlign = "left";
  ctx.fillStyle = isDark ? "#e4ede9" : "#1d1a17";
  ctx.font = '600 13px "Plus Jakarta Sans"';
  ctx.fillText(chartTitle(currentRange), padding.left, 16);

  // Default to the most recent dates (scroll to the right end).
  chartScroll.scrollLeft = displayWidth;
}

function handleChartHover(event) {
  const nearestPoint = getNearestChartPoint(event);
  if (!nearestPoint) {
    hideChartTooltip();
    return;
  }

  chartTooltip.innerHTML = `
    <strong>${formatCurrency(nearestPoint.total)}</strong>
    <span>${escapeHtml(tooltipLabel(nearestPoint))}</span>
    <span>Click to open category movement</span>
  `;
  const minX = chartScroll.offsetLeft + 90;
  const maxX = chartScroll.offsetLeft + chartScroll.clientWidth - 90;
  const tooltipX = Math.min(Math.max(chartScroll.offsetLeft + nearestPoint.x - chartScroll.scrollLeft, minX), maxX);
  const tooltipY = chartScroll.offsetTop + nearestPoint.y;
  chartTooltip.classList.toggle("is-below", tooltipY < 78);
  chartTooltip.style.left = `${tooltipX}px`;
  chartTooltip.style.top = `${tooltipY}px`;
  chartTooltip.classList.remove("is-hidden");
}

function handleChartClick() {}

function getNearestChartPoint(event) {
  if (!chartPoints.length) {
    return null;
  }

  const rect = trendCanvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  let nearestPoint = null;
  let nearestDistance = Infinity;

  chartPoints.forEach((point) => {
    const distance = Math.hypot(point.x - x, point.y - y);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestPoint = point;
    }
  });

  return nearestDistance <= 28 ? nearestPoint : null;
}

function hideChartTooltip() {
  chartTooltip.classList.add("is-hidden");
  chartTooltip.classList.remove("is-below");
}

function buildChartData(range) {
  const { start, end } = getTransactionDateRange();

  if (range === "daily") {
    return eachDayBetween(start, end).map((date) => {
      const dateString = toLocalDateString(date);
      return {
        label: date.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
        tooltip: date.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short", year: "numeric" }),
        rangeStart: dateString,
        rangeEnd: dateString,
        total: totalForExactDate(dateString)
      };
    });
  }

  if (range === "weekly") {
    return eachWeekBetween(start, end).map((weekStart) => {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      const weekNumber = getWeekNumber(weekStart);
      return {
        label: `W${weekNumber}`,
        tooltip: `Week ${weekNumber} starting ${formatDate(toLocalDateString(weekStart))}`,
        rangeStart: toLocalDateString(weekStart),
        rangeEnd: toLocalDateString(weekEnd),
        total: totalExpensesBetween(weekStart, weekEnd)
      };
    });
  }

  return eachMonthBetween(start, end).map((date) => {
    return {
      label: date.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
      tooltip: date.toLocaleDateString("en-IN", { month: "long", year: "numeric" }),
      rangeStart: toLocalDateString(new Date(date.getFullYear(), date.getMonth(), 1)),
      rangeEnd: toLocalDateString(new Date(date.getFullYear(), date.getMonth() + 1, 0)),
      total: totalExpensesBetween(new Date(date.getFullYear(), date.getMonth(), 1), new Date(date.getFullYear(), date.getMonth() + 1, 0))
    };
  });
}

function spendingForPeriod(period, offset) {
  if (period === "day") {
    return totalForExactDate(offsetDate(-offset));
  }

  if (period === "week") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const day = today.getDay();
    const mondayShift = day === 0 ? -6 : 1 - day;
    const start = new Date(today);
    start.setDate(today.getDate() + mondayShift - offset * 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return totalExpensesBetween(start, end);
  }

  return spendingForMonthOffset(offset);
}

function spendingForMonthOffset(offset) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() - offset;
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  return totalExpensesBetween(start, end);
}

function totalExpensesBetween(start, end) {
  const startTime = startOfDay(start).getTime();
  const endTime = endOfDay(end).getTime();

  return state.transactions
    .filter(isSpendingEntry)
    .filter((item) => {
      const time = new Date(item.date).getTime();
      return time >= startTime && time <= endTime;
    })
    .reduce((sum, item) => sum + item.amount, 0);
}

function totalForExactDate(dateString) {
  return state.transactions
    .filter((item) => isSpendingEntry(item) && item.date === dateString)
    .reduce((sum, item) => sum + item.amount, 0);
}

function buildDeltaCopy(current, previous, suffix) {
  if (previous === 0 && current === 0) {
    return "No spending recorded";
  }

  if (previous === 0) {
    return `${formatCurrency(current)} added ${suffix}`;
  }

  const percent = Math.round(((current - previous) / previous) * 100);
  const direction = percent > 0 ? "up" : percent < 0 ? "down" : "flat";
  return `${Math.abs(percent)}% ${direction} ${suffix}`;
}

function chartTitle(range) {
  if (range === "daily") {
    return "Daily expense movement";
  }
  if (range === "weekly") {
    return "Weekly expense movement";
  }
  return "Monthly expense movement";
}

function tooltipLabel(point) {
  return point.tooltip || point.label;
}

function labelForAccount(accountId) {
  return ACCOUNTS.find((account) => account.id === accountId)?.label || accountId;
}

const CURRENCY_LOCALE = {
  INR: "en-IN", USD: "en-US", EUR: "de-DE", GBP: "en-GB", JPY: "ja-JP",
  AUD: "en-AU", CAD: "en-CA", CHF: "de-CH", CNY: "zh-CN", SGD: "en-SG",
  AED: "ar-AE", SAR: "ar-SA", BRL: "pt-BR", KRW: "ko-KR", MXN: "es-MX",
  ZAR: "en-ZA", THB: "th-TH", IDR: "id-ID", MYR: "ms-MY", PHP: "en-PH"
};

function formatCurrency(value) {
  const currency = state.settings.currency || "INR";
  const locale = CURRENCY_LOCALE[currency] || "en-US";
  const fractionDigits = 0;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
    maximumFractionDigits: fractionDigits
  }).format(value);
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function formatBackupDate(dateString) {
  return new Date(dateString).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function shortDay(dateString) {
  return new Date(dateString).toLocaleDateString("en-IN", { weekday: "short" });
}

function getTransactionDateRange() {
  const today = startOfDay(new Date());
  const expenseDates = state.transactions
    .filter(isSpendingEntry)
    .map((transaction) => parseLocalDate(transaction.date));
  const start = expenseDates.length ? new Date(Math.min(...expenseDates.map((date) => date.getTime()))) : today;

  return {
    start: startOfDay(start),
    end: today
  };
}

function eachDayBetween(start, end) {
  const dates = [];
  const cursor = startOfDay(start);
  const finalDate = startOfDay(end);

  while (cursor <= finalDate) {
    dates.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

function eachWeekBetween(start, end) {
  const weeks = [];
  const cursor = startOfWeek(start);
  const finalDate = startOfWeek(end);

  while (cursor <= finalDate) {
    weeks.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 7);
  }

  return weeks;
}

function eachMonthBetween(start, end) {
  const months = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const finalDate = new Date(end.getFullYear(), end.getMonth(), 1);

  while (cursor <= finalDate) {
    months.push(new Date(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return months;
}

function startOfWeek(date) {
  const value = startOfDay(date);
  const day = value.getDay();
  const mondayShift = day === 0 ? -6 : 1 - day;
  value.setDate(value.getDate() + mondayShift);
  return value;
}

function getWeekNumber(date) {
  const value = startOfDay(date);
  value.setDate(value.getDate() + 3 - ((value.getDay() + 6) % 7));
  const weekOne = new Date(value.getFullYear(), 0, 4);
  return 1 + Math.round(((value - weekOne) / 86400000 - 3 + ((weekOne.getDay() + 6) % 7)) / 7);
}

function toLocalDateString(date) {
  return date.toLocaleDateString("en-CA");
}

function todayLocal() {
  return new Date().toLocaleDateString("en-CA");
}

function offsetDate(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toLocaleDateString("en-CA");
}

function parseLocalDate(dateString) {
  return new Date(`${dateString}T00:00:00`);
}

function startOfDay(date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function endOfDay(date) {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function applyTheme() {
  const saved = localStorage.getItem("expense-flow-theme");
  if (saved === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
    themeToggle.textContent = "☀️ Dark";
  } else {
    themeToggle.textContent = "🌙 Light";
  }
}

function toggleTheme() {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  if (isDark) {
    document.documentElement.removeAttribute("data-theme");
    localStorage.setItem("expense-flow-theme", "light");
    themeToggle.textContent = "🌙 Light";
  } else {
    document.documentElement.setAttribute("data-theme", "dark");
    localStorage.setItem("expense-flow-theme", "dark");
    themeToggle.textContent = "☀️ Dark";
  }
  renderTrendChart();
}

function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("toast-exit");
    toast.addEventListener("animationend", () => toast.remove());
  }, 2800);
}

function populateHistoryFilterCategories() {
  historyFilterCategory.innerHTML = `<option value="">All categories</option>` +
    CATEGORIES.map((c) => `<option value="${c}">${CATEGORY_EMOJI[c] || ""} ${c}</option>`).join("");
}

function renderFilteredHistory() {
  const query = historySearch.value.toLowerCase().trim();
  const categoryFilter = historyFilterCategory.value;
  const typeFilter = historyFilterType.value;

  let filtered = getSortedTransactions();

  if (query) {
    filtered = filtered.filter((t) =>
      t.title.toLowerCase().includes(query) ||
      (t.notes || "").toLowerCase().includes(query) ||
      t.category.toLowerCase().includes(query)
    );
  }

  if (categoryFilter) {
    filtered = filtered.filter((t) => t.category === categoryFilter);
  }

  if (typeFilter) {
    filtered = filtered.filter((t) => t.type === typeFilter);
  }

  historyList.innerHTML = renderTransactionRows(filtered);
  historyCount.textContent = `${filtered.length} of ${state.transactions.length} transactions`;
}

function handleExportData() {
  const data = JSON.stringify(state, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `expense-flow-backup-${todayLocal()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast("Data exported successfully", "success");
}

function handleImportData() {
  const file = importFileInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const imported = JSON.parse(event.target.result);
      if (!imported.transactions || !Array.isArray(imported.transactions)) {
        showToast("Invalid file format", "error");
        return;
      }

      const confirmed = confirm(`Import ${imported.transactions.length} transactions? This will replace your current data.`);
      if (!confirmed) return;

      createBackup("before importing data");
      state = {
        baseBalances: { ...defaultState.baseBalances, ...imported.baseBalances },
        settings: { ...defaultState.settings, ...imported.settings },
        transactions: imported.transactions
      };
      saveState();
      resetFormState();
      render();
      showToast(`Imported ${imported.transactions.length} transactions`, "success");
    } catch {
      showToast("Failed to parse file", "error");
    }
  };
  reader.readAsText(file);
  importFileInput.value = "";
}

function toggleVoiceInput() {
  if (isRecording) {
    stopVoiceInput();
    return;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    showToast("Voice input not supported in this browser. Try Chrome or Edge.", "error");
    return;
  }

  voiceRecognition = new SpeechRecognition();
  voiceRecognition.lang = "en-IN";
  voiceRecognition.continuous = true;
  voiceRecognition.interimResults = true;

  voiceRecognition.onstart = () => {
    isRecording = true;
    voiceButton.classList.add("is-recording");
    voiceButton.querySelector(".voice-label").textContent = "Tap to stop";
    voiceStatus.classList.remove("is-hidden");
    voiceStatusText.textContent = "Listening...";
    voiceTranscript.classList.add("is-hidden");
  };

  voiceRecognition.onresult = (event) => {
    const parts = [];
    for (let i = 0; i < event.results.length; i++) {
      parts.push(event.results[i][0].transcript);
    }
    const transcript = parts.join(" ");
    voiceStatusText.textContent = transcript || "Listening...";
    voiceRecognition._lastTranscript = transcript;
  };

  voiceRecognition.onerror = (event) => {
    stopVoiceInput();
    if (event.error === "not-allowed") {
      showToast("Microphone access denied. Allow it in browser settings.", "error");
    } else if (event.error !== "aborted") {
      showToast("Could not recognize speech. Try again.", "error");
    }
  };

  voiceRecognition.onend = () => {
    stopVoiceInput();
  };

  voiceRecognition.start();
}

function stopVoiceInput() {
  const transcript = voiceRecognition?._lastTranscript || "";
  isRecording = false;
  voiceButton.classList.remove("is-recording");
  voiceButton.querySelector(".voice-label").textContent = "Tap to speak";
  voiceStatus.classList.add("is-hidden");
  if (voiceRecognition) {
    voiceRecognition.abort();
    voiceRecognition = null;
  }
  if (transcript.trim()) {
    parseVoiceInput(transcript);
  }
}

function parseVoiceInput(transcript) {
  const raw = transcript.trim();
  const text = raw.toLowerCase();
  const matched = [];

  const fieldLabels = ["type", "title", "amount", "category", "account", "date"];
  const segments = {};
  const labelPattern = new RegExp(`\\b(${fieldLabels.join("|")})\\b`, "gi");
  const splits = text.split(labelPattern);

  let currentLabel = null;
  for (const part of splits) {
    const lower = part.trim().toLowerCase();
    if (fieldLabels.includes(lower)) {
      currentLabel = lower;
    } else if (currentLabel && part.trim()) {
      segments[currentLabel] = part.trim();
      currentLabel = null;
    }
  }

  const hasLabels = Object.keys(segments).length >= 2;

  if (hasLabels) {
    if (segments.type) {
      const t = segments.type;
      if (t.includes("income") || t.includes("salary")) {
        entryType.value = "income";
        matched.push("Type: Income");
      } else if (t.includes("transfer")) {
        entryType.value = "transfer";
        matched.push("Type: Transfer");
      } else {
        entryType.value = "expense";
        matched.push("Type: Expense");
      }
      syncFormVisibility();
    }

    if (segments.title) {
      const title = segments.title.charAt(0).toUpperCase() + segments.title.slice(1);
      entryTitle.value = title;
      matched.push(`Title: ${title}`);
    }

    if (segments.amount) {
      const amt = parseSpokenAmount(segments.amount);
      if (amt) { entryAmount.value = amt; matched.push(`Amount: ${formatCurrency(amt)}`); }
    }

    if (segments.category) {
      const cat = matchCategory(segments.category);
      if (cat) { entryCategory.value = cat; matched.push(`Category: ${CATEGORY_EMOJI[cat] || ""} ${cat}`); }
    }

    if (segments.account) {
      const acc = matchAccount(segments.account);
      if (acc) { entryAccount.value = acc; matched.push(`Account: ${labelForAccount(acc)}`); }
    }

    if (segments.date) {
      const d = parseSpokenDate(segments.date);
      if (d) { entryDate.value = d; matched.push(`Date: ${formatDate(d)}`); }
    }
  } else {
    if (text.includes("income") || text.includes("salary")) {
      entryType.value = "income"; matched.push("Type: Income");
    } else if (text.includes("transfer")) {
      entryType.value = "transfer"; matched.push("Type: Transfer");
    } else {
      entryType.value = "expense"; matched.push("Type: Expense");
    }
    syncFormVisibility();

    const amt = parseSpokenAmount(text);
    if (amt) { entryAmount.value = amt; matched.push(`Amount: ${formatCurrency(amt)}`); }

    const cat = matchCategory(text);
    if (cat) { entryCategory.value = cat; matched.push(`Category: ${CATEGORY_EMOJI[cat] || ""} ${cat}`); }

    const acc = matchAccount(text);
    if (acc) { entryAccount.value = acc; matched.push(`Account: ${labelForAccount(acc)}`); }

    const d = parseSpokenDate(text);
    if (d) { entryDate.value = d; matched.push(`Date: ${formatDate(d)}`); }

    const stopWords = new Set(["expense", "income", "transfer", "today", "yesterday", "thousand", "lakh", "lac", "rupees", "rs", "from", "on", "for", "the", "to", "in", "my", "and", "a", "of", "type", "title", "amount", "category", "account", "date"]);
    const titleWords = raw.split(/\s+/).filter((w) => {
      const lower = w.toLowerCase();
      return !/^\d/.test(lower) && !stopWords.has(lower);
    });
    if (titleWords.length) {
      const title = titleWords.slice(0, 4).join(" ");
      entryTitle.value = title.charAt(0).toUpperCase() + title.slice(1);
      matched.push(`Title: ${entryTitle.value}`);
    }
  }

  voiceTranscript.classList.remove("is-hidden");
  voiceTranscript.innerHTML = `<strong>Heard</strong>"${escapeHtml(raw)}"<br><br><strong>Parsed</strong>${matched.length ? matched.join(" &middot; ") : "Could not parse any fields"}`;

  if (matched.length >= 2) {
    showToast(`Filled ${matched.length} fields from voice`, "success");
  } else {
    showToast("Could not parse enough details. Try again.", "info");
  }
}

function parseSpokenAmount(text) {
  const match = text.match(/(\d[\d,]*\.?\d*)\s*(thousand|k|lakh|lac)?/);
  if (!match) return null;
  let amount = parseFloat(match[1].replace(/,/g, ""));
  if (match[2] === "thousand" || match[2] === "k") amount *= 1000;
  if (match[2] === "lakh" || match[2] === "lac") amount *= 100000;
  return amount;
}

function matchCategory(text) {
  const map = {};
  CATEGORIES.forEach((c) => { map[c.toLowerCase()] = c; });
  map["cab"] = "Commute"; map["taxi"] = "Commute"; map["uber"] = "Commute";
  map["ola"] = "Commute"; map["auto"] = "Commute"; map["bus"] = "Commute";
  map["metro"] = "Commute"; map["train"] = "Travel"; map["flight"] = "Travel";
  map["movie"] = "Entertainment"; map["netflix"] = "Entertainment";
  map["gym"] = "Sports"; map["doctor"] = "Health"; map["medicine"] = "Health";
  map["hospital"] = "Health"; map["rent"] = "Bills"; map["electricity"] = "Bills";
  map["wifi"] = "Bills"; map["internet"] = "Bills"; map["recharge"] = "Bills";
  map["gift"] = "Gifts"; map["birthday"] = "Gifts";
  map["clothes"] = "Shopping"; map["amazon"] = "Shopping"; map["flipkart"] = "Shopping";
  map["swiggy"] = "Food"; map["zomato"] = "Food"; map["restaurant"] = "Food";
  map["lunch"] = "Food"; map["dinner"] = "Food"; map["breakfast"] = "Food";
  map["coffee"] = "Food"; map["snacks"] = "Food";
  map["vegetables"] = "Groceries"; map["fruits"] = "Groceries"; map["milk"] = "Groceries";
  map["grocery"] = "Groceries"; map["grocs"] = "Groceries"; map["supermarket"] = "Groceries";
  map["mutual fund"] = "Investment"; map["sip"] = "Investment";
  map["stock"] = "Investment"; map["invest"] = "Investment";

  for (const [keyword, cat] of Object.entries(map)) {
    if (text.includes(keyword)) return cat;
  }
  return null;
}

function matchAccount(text) {
  if (text.includes("credit card") || text.includes("credit") || text.includes("cc")) return "creditCard";
  if (text.includes("savings") || text.includes("saving")) return "savings";
  if (text.includes("current")) return "current";
  if (text.includes("investment")) return "investments";
  return null;
}

function parseSpokenDate(text) {
  if (text.includes("today")) return todayLocal();
  if (text.includes("yesterday")) return offsetDate(-1);
  if (text.includes("day before")) return offsetDate(-2);
  const match = text.match(/(\d{1,2})(?:st|nd|rd|th)?\s*(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)/i);
  if (match) {
    const months = { jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2, apr: 3, april: 3, may: 4, jun: 5, june: 5, jul: 6, july: 6, aug: 7, august: 7, sep: 8, sept: 8, september: 8, oct: 9, october: 9, nov: 10, november: 10, dec: 11, december: 11 };
    return toLocalDateString(new Date(new Date().getFullYear(), months[match[2].toLowerCase()], parseInt(match[1])));
  }
  return null;
}
