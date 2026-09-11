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
    creditCardStatementDate: getDefaultCreditCardStatementDate()
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
const startMonthButton = document.getElementById("startMonthButton");
const restoreBackupButton = document.getElementById("restoreBackupButton");
const resetAllButton = document.getElementById("resetAllButton");
const backupStatus = document.getElementById("backupStatus");
const historyList = document.getElementById("historyList");
const historyCount = document.getElementById("historyCount");
const monthSpendHero = document.getElementById("monthSpendHero");
const netWorthHero = document.getElementById("netWorthHero");
const todaySpend = document.getElementById("todaySpend");
const weekSpend = document.getElementById("weekSpend");
const monthSpend = document.getElementById("monthSpend");
const todayChange = document.getElementById("todayChange");
const weekChange = document.getElementById("weekChange");
const monthChange = document.getElementById("monthChange");
const insightAverageDaily = document.getElementById("insightAverageDaily");
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

let chartPoints = [];
let voiceRecognition = null;
let isRecording = false;

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
  userDisplayName.textContent = currentUser.displayName || currentUser.email;
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
  setActivePage(currentPage, false);
  render();

  transactionForm.addEventListener("submit", handleSubmit);
  balanceForm.addEventListener("submit", handleBalanceSubmit);
  creditCardBillForm.addEventListener("submit", handleCreditCardBillSubmit);
  startMonthButton.addEventListener("click", handleStartFreshMonth);
  restoreBackupButton.addEventListener("click", handleRestoreBackup);
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
      setActivePage("home");
      entryTitle.focus();
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

  document.querySelectorAll(".app-tab").forEach((button) => {
    button.addEventListener("click", () => setActivePage(button.dataset.page));
  });

  document.querySelectorAll("[data-page-link]").forEach((link) => {
    link.addEventListener("click", () => setActivePage(link.dataset.pageLink));
  });
}

function setActivePage(page, shouldScroll = true) {
  currentPage = page;
  document.querySelectorAll(".app-tab").forEach((tab) => {
    tab.classList.toggle("is-active", tab.dataset.page === page);
  });
  document.querySelectorAll(".panel[data-page]").forEach((panel) => {
    panel.classList.toggle("is-page-active", panel.dataset.page === page);
  });

  if (page === "insights") {
    requestAnimationFrame(renderTrendChart);
  }

  if (shouldScroll) {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
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
  if (!currentUser) return;
  const backup = {
    reason,
    createdAt: new Date().toISOString(),
    state: structuredClone(state)
  };
  getUserDoc().collection("backups").doc("latest").set(backup)
    .catch((err) => console.error("Backup save failed", err));
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
  formModeCopy.textContent = "Editing an existing transaction. Update the values and save your changes.";
  window.scrollTo({ top: 0, behavior: "smooth" });
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
  formModeCopy.textContent = "Create a new expense, income, or transfer entry.";
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
  const month = spendingForPeriod("month", 0);
  const lastMonth = spendingForPeriod("month", 1);
  const elapsedDays = Math.max(1, new Date().getDate());

  todaySpend.textContent = formatCurrency(today);
  weekSpend.textContent = formatCurrency(week);
  monthSpend.textContent = formatCurrency(month);
  insightAverageDaily.textContent = formatCurrency(month / elapsedDays);

  todayChange.textContent = buildDeltaCopy(today, yesterday, "vs yesterday");
  weekChange.textContent = buildDeltaCopy(week, lastWeek, "vs last week");
  monthChange.textContent = buildDeltaCopy(month, lastMonth, "vs last month");
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
    ? `<span class="breakdown-total-amount">${formatCurrency(total)}</span><span class="breakdown-total-label">total spent ${breakdownPeriod === "month" ? "this month" : "this week"}</span>`
    : `<span class="breakdown-total-label">No spending recorded ${breakdownPeriod === "month" ? "this month" : "this week"}</span>`;

  if (!sorted.length) {
    categoryBreakdown.innerHTML = `<div class="empty-state">Add expenses to see your category breakdown.</div>`;
    return;
  }

  categoryBreakdown.innerHTML = sorted.map(([category, amount], i) => {
    const percent = Math.round((amount / total) * 100);
    const barWidth = Math.round((amount / max) * 100);
    return `
      <div class="cat-row">
        <div class="cat-row-name">${CATEGORY_EMOJI[category] || ""} ${escapeHtml(category)}</div>
        <div class="cat-row-bar-track"><div class="cat-row-bar-fill cat-bar-color-${i % 13}" style="width:${barWidth}%"></div></div>
        <div class="cat-row-amount">${formatCurrency(amount)}</div>
        <div class="cat-row-percent">${percent}%</div>
      </div>
    `;
  }).join("");
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
  const monthTotal = spendingForPeriod("month", 0);
  const balances = calculateBalances();
  const totalWorth = Object.entries(balances).reduce((sum, [accountId, value]) => {
    return accountId === "creditCard" ? sum - value : sum + value;
  }, 0);

  monthSpendHero.textContent = formatCurrency(monthTotal);
  netWorthHero.textContent = formatCurrency(totalWorth);
}

function renderWallets() {
  const balances = calculateBalances();
  walletCards.innerHTML = "";

  ACCOUNTS.forEach((account) => {
    const node = walletCardTemplate.content.firstElementChild.cloneNode(true);
    const label = node.querySelector(".wallet-label");
    const value = node.querySelector(".wallet-value");
    const caption = node.querySelector(".wallet-caption");

    node.querySelector(".wallet-label").textContent = account.label;

    if (account.id === "creditCard") {
      const cardSnapshot = calculateCreditCardBillSnapshot(balances.creditCard);
      node.classList.add("wallet-card-credit");
      label.textContent = "Credit Card";
      value.textContent = formatCurrency(cardSnapshot.currentCycleSpend);
      caption.innerHTML = `
        <span>Spends since ${formatDate(state.settings.creditCardStatementDate)}</span>
        <span>Bill for ${formatDate(toLocalDateString(cardSnapshot.previousStatementDate))} - ${formatDate(state.settings.creditCardStatementDate)}: ${formatCurrency(cardSnapshot.billDue)}</span>
      `;
    } else {
      value.textContent = formatCurrency(balances[account.id]);
      caption.textContent = `${formatCurrency(state.baseBalances[account.id])} starting balance`;
    }

    walletCards.appendChild(node);
  });

  balanceCurrent.value = state.baseBalances.current;
  balanceSavings.value = state.baseBalances.savings;
  balanceInvestments.value = state.baseBalances.investments;
  balanceCreditCard.value = state.baseBalances.creditCard;
  creditCardStatementDate.value = state.settings.creditCardStatementDate;
}

function calculateCreditCardBillSnapshot(totalOwed) {
  const statementDate = parseLocalDate(state.settings.creditCardStatementDate || getDefaultCreditCardStatementDate());
  const previousStatementDate = new Date(statementDate);
  previousStatementDate.setMonth(previousStatementDate.getMonth() - 1);

  const creditCardExpenses = state.transactions
    .filter((t) => t.type === "expense" && t.account === "creditCard");

  const billDue = creditCardExpenses
    .filter((t) => {
      const d = parseLocalDate(t.date);
      return d > previousStatementDate && d <= statementDate;
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const currentCycleSpend = creditCardExpenses
    .filter((t) => parseLocalDate(t.date) > statementDate)
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    currentCycleSpend,
    billDue,
    totalOwed,
    statementDate,
    previousStatementDate
  };
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

function renderTransactionRows(transactions) {
  if (!transactions.length) {
    return `<article class="transaction-row"><div><div class="transaction-title">No transactions yet</div><div class="transaction-meta"><span>Add your first transaction to build history.</span></div></div></article>`;
  }

  return transactions.map((transaction) => {
    const accountCopy = transaction.type === "transfer"
      ? `${labelForAccount(transaction.fromAccount)} -> ${labelForAccount(transaction.toAccount)}`
      : labelForAccount(transaction.account);
    const amountPrefix = transaction.type === "expense" ? "-" : transaction.type === "income" ? "+" : "<>";

    return `
      <article class="transaction-row">
        <div>
          <div class="transaction-topline">
            <div class="transaction-title">${escapeHtml(transaction.title)}</div>
            <div class="transaction-actions">
              <button type="button" class="mini-button" data-action="edit" data-id="${transaction.id}">Edit</button>
              <button type="button" class="mini-button" data-action="delete" data-id="${transaction.id}">Delete</button>
            </div>
          </div>
          <div class="transaction-meta">
            <span>${formatDate(transaction.date)}</span>
            <span><span class="category-emoji">${CATEGORY_EMOJI[transaction.category] || ""}</span>${transaction.category}</span>
            <span>${accountCopy}</span>
          </div>
        </div>
        <div class="transaction-amount ${transaction.type}">${amountPrefix}${formatCurrency(transaction.amount)}</div>
      </article>
    `;
  }).join("");
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
  gradient.addColorStop(0, "rgba(200, 93, 47, 0.34)");
  gradient.addColorStop(1, "rgba(200, 93, 47, 0)");

  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) {
      ctx.moveTo(point.x, point.y);
    } else {
      ctx.lineTo(point.x, point.y);
    }
  });
  ctx.lineTo(points.at(-1).x, height - padding.bottom);
  ctx.lineTo(points[0].x, height - padding.bottom);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) {
      ctx.moveTo(point.x, point.y);
    } else {
      ctx.lineTo(point.x, point.y);
    }
  });
  ctx.strokeStyle = "#c85d2f";
  ctx.lineWidth = 3;
  ctx.stroke();

  points.forEach((point) => {
    ctx.beginPath();
    ctx.arc(point.x, point.y, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = "#116357";
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

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
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
    themeToggle.textContent = "☀️";
  }
}

function toggleTheme() {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  if (isDark) {
    document.documentElement.removeAttribute("data-theme");
    localStorage.setItem("expense-flow-theme", "light");
    themeToggle.textContent = "🌙";
  } else {
    document.documentElement.setAttribute("data-theme", "dark");
    localStorage.setItem("expense-flow-theme", "dark");
    themeToggle.textContent = "☀️";
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
