const STORAGE_KEY = "expense-flow-ocr-v1";
const BACKUP_KEY = "expense-flow-ocr-v1-backup";
const CREDIT_CARD_BILL_DAY = 15;

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
  "Other"
];

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

let state = loadState();
let currentRange = "daily";
let categoryRange = "weekly";
let comparisonRange = "weekly";
let categoryPeriodOffset = 0;
let categorySelectedWindow = null;
let editingTransactionId = null;
let ocrRows = [];

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
const ocrFiles = document.getElementById("ocrFiles");
const runOcrButton = document.getElementById("runOcrButton");
const ocrStatus = document.getElementById("ocrStatus");
const ocrPreview = document.getElementById("ocrPreview");
const ocrRowsElement = document.getElementById("ocrRows");
const importOcrButton = document.getElementById("importOcrButton");

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
const categoryList = document.getElementById("categoryList");
const categoryRangeCopy = document.getElementById("categoryRangeCopy");
const categoryPrevButton = document.getElementById("categoryPrevButton");
const categoryNextButton = document.getElementById("categoryNextButton");
const categoryCurrentButton = document.getElementById("categoryCurrentButton");
const transactionList = document.getElementById("transactionList");
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
const comparisonRangeCopy = document.getElementById("comparisonRangeCopy");
const comparisonSummary = document.getElementById("comparisonSummary");
const comparisonList = document.getElementById("comparisonList");
const chartScroll = document.getElementById("chartScroll");
const trendCanvas = document.getElementById("trendChart");
const chartTooltip = document.getElementById("chartTooltip");
const walletCardTemplate = document.getElementById("walletCardTemplate");
let chartPoints = [];

bootstrap();

function bootstrap() {
  populateSelects();
  entryDate.value = todayLocal();
  syncFormVisibility();
  render();

  transactionForm.addEventListener("submit", handleSubmit);
  runOcrButton.addEventListener("click", handleOcrScan);
  importOcrButton.addEventListener("click", handleOcrImport);
  ocrRowsElement.addEventListener("click", handleOcrRowAction);
  balanceForm.addEventListener("submit", handleBalanceSubmit);
  creditCardBillForm.addEventListener("submit", handleCreditCardBillSubmit);
  startMonthButton.addEventListener("click", handleStartFreshMonth);
  restoreBackupButton.addEventListener("click", handleRestoreBackup);
  resetAllButton.addEventListener("click", handleResetAllData);
  entryType.addEventListener("change", syncFormVisibility);
  cancelEditButton.addEventListener("click", resetFormState);
  transactionList.addEventListener("click", handleTransactionActions);
  historyList.addEventListener("click", handleTransactionActions);
  categoryPrevButton.addEventListener("click", () => shiftCategoryPeriod(1));
  categoryNextButton.addEventListener("click", () => shiftCategoryPeriod(-1));
  categoryCurrentButton.addEventListener("click", () => setCategoryPeriod(0));
  window.addEventListener("resize", renderTrendChart);
  trendCanvas.addEventListener("mousemove", handleChartHover);
  trendCanvas.addEventListener("mouseleave", hideChartTooltip);
  trendCanvas.addEventListener("click", handleChartClick);

  document.querySelectorAll(".tab-button").forEach((button) => {
    button.addEventListener("click", () => {
      currentRange = button.dataset.range;
      document.querySelectorAll(".tab-button").forEach((tab) => tab.classList.remove("is-active"));
      button.classList.add("is-active");
      renderTrendChart();
    });
  });

  document.querySelectorAll(".category-tab-button").forEach((button) => {
    button.addEventListener("click", () => {
      categoryRange = button.dataset.categoryRange;
      categoryPeriodOffset = 0;
      categorySelectedWindow = null;
      document.querySelectorAll(".category-tab-button").forEach((tab) => tab.classList.remove("is-active"));
      button.classList.add("is-active");
      renderCategories();
    });
  });

  document.querySelectorAll(".comparison-tab-button").forEach((button) => {
    button.addEventListener("click", () => {
      comparisonRange = button.dataset.comparisonRange;
      document.querySelectorAll(".comparison-tab-button").forEach((tab) => tab.classList.remove("is-active"));
      button.classList.add("is-active");
      renderSpendDashboard();
    });
  });
}

function shiftCategoryPeriod(direction) {
  categorySelectedWindow = null;
  categoryPeriodOffset += direction;
  renderCategories();
}

function setCategoryPeriod(offset) {
  categorySelectedWindow = null;
  categoryPeriodOffset = offset;
  renderCategories();
}

function loadState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultState));
      return structuredClone(defaultState);
    }
    const parsed = JSON.parse(stored);
    return {
      baseBalances: { ...defaultState.baseBalances, ...parsed.baseBalances },
      settings: { ...defaultState.settings, ...parsed.settings },
      transactions: Array.isArray(parsed.transactions) ? parsed.transactions : []
    };
  } catch (error) {
    console.error("Unable to load state", error);
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function createBackup(reason) {
  const backup = {
    reason,
    createdAt: new Date().toISOString(),
    state: structuredClone(state)
  };
  localStorage.setItem(BACKUP_KEY, JSON.stringify(backup));
}

function loadBackup() {
  try {
    const stored = localStorage.getItem(BACKUP_KEY);
    if (!stored) {
      return null;
    }
    return JSON.parse(stored);
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
      alert("Choose different accounts for transfer.");
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
  saveState();
  resetFormState({ preserveEntryContext: !editingTransactionId });
  render();
}

async function handleOcrScan() {
  const files = [...ocrFiles.files];
  if (!files.length) {
    ocrStatus.textContent = "Choose at least one passbook screenshot first.";
    return;
  }

  if (!window.Tesseract) {
    ocrStatus.textContent = "OCR engine could not load. Check your internet connection and refresh this copy.";
    return;
  }

  runOcrButton.disabled = true;
  ocrPreview.classList.add("is-hidden");
  ocrStatus.textContent = `Reading ${files.length} screenshot${files.length === 1 ? "" : "s"}...`;

  let rawText = "";
  try {
    const worker = await window.Tesseract.createWorker("eng");
    for (let index = 0; index < files.length; index += 1) {
      ocrStatus.textContent = `Reading screenshot ${index + 1} of ${files.length}...`;
      const result = await worker.recognize(files[index]);
      rawText += `\n${result.data.text}`;
    }
    await worker.terminate();
    ocrRows = parsePassbookText(rawText);
    renderOcrRows();
    ocrStatus.textContent = ocrRows.length
      ? `Found ${ocrRows.length} possible transaction${ocrRows.length === 1 ? "" : "s"}. Review them below.`
      : "No transaction rows were detected. Try a clearer, tightly cropped screenshot.";
  } catch (error) {
    console.error("Unable to read screenshots", error);
    ocrStatus.textContent = "The screenshot could not be read. Try a clearer image or a smaller batch.";
  } finally {
    runOcrButton.disabled = false;
  }
}

function parsePassbookText(rawText) {
  return rawText.split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .map((line) => {
      const dateMatch = line.match(/\b(\d{1,2}[/-]\d{1,2}[/-](?:\d{2}|\d{4}))\b/);
      const amountMatch = line.match(/\b\d[\d,]*(?:\.\d{1,2})?\b/);
      if (!dateMatch || !amountMatch) {
        return null;
      }

      const date = normaliseOcrDate(dateMatch[1]);
      const amount = Number(amountMatch[0].replaceAll(",", ""));
      const title = line
        .replace(dateMatch[0], "")
        .replace(amountMatch[0], "")
        .replace(/\b(?:dr|debit|withdrawal|spent)\b/gi, "")
        .replace(/\s{2,}/g, " ")
        .trim();

      if (!isValidDateInput(date) || !Number.isFinite(amount) || amount <= 0 || !title) {
        return null;
      }

      return { date, title, amount, category: guessCategory(title), account: "current" };
    })
    .filter(Boolean);
}

function normaliseOcrDate(value) {
  const parts = value.split(/[/-]/).map(Number);
  let [day, month, year] = parts;
  if (year < 100) {
    year += 2000;
  }
  return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
}

function guessCategory(title) {
  const value = title.toLowerCase();
  if (/groc|supermarket|vegetable|milk/.test(value)) return "Groceries";
  if (/food|restaurant|cafe|coffee|breakfast|lunch|dinner|swiggy|zomato/.test(value)) return "Food";
  if (/uber|ola|cab|metro|bus|fuel|petrol|commute/.test(value)) return "Commute";
  if (/netflix|hotstar|movie|spotify|entertainment/.test(value)) return "Entertainment";
  if (/sport|gym|football|cricket/.test(value)) return "Sports";
  if (/gift/.test(value)) return "Gifts";
  if (/invest|mutual|zerodha|groww/.test(value)) return "Investment";
  if (/bill|recharge|electric|broadband|rent/.test(value)) return "Bills";
  return "Other";
}

function renderOcrRows() {
  ocrPreview.classList.toggle("is-hidden", !ocrRows.length);
  ocrRowsElement.innerHTML = ocrRows.map((row, index) => `
    <div class="ocr-row" data-ocr-index="${index}">
      <input data-ocr-field="date" type="date" value="${row.date}">
      <input data-ocr-field="title" type="text" value="${escapeHtml(row.title)}">
      <input data-ocr-field="amount" type="number" min="0" step="0.01" value="${row.amount}">
      <select data-ocr-field="category">${CATEGORIES.map((category) => `<option value="${category}" ${category === row.category ? "selected" : ""}>${category}</option>`).join("")}</select>
      <select data-ocr-field="account">${ACCOUNTS.map((account) => `<option value="${account.id}" ${account.id === row.account ? "selected" : ""}>${account.label}</option>`).join("")}</select>
      <button type="button" class="mini-button" data-ocr-action="remove">Remove</button>
    </div>
  `).join("");
}

function handleOcrRowAction(event) {
  const button = event.target.closest("[data-ocr-action='remove']");
  if (!button) return;
  const row = button.closest(".ocr-row");
  ocrRows.splice(Number(row.dataset.ocrIndex), 1);
  renderOcrRows();
}

function handleOcrImport() {
  const rows = [...ocrRowsElement.querySelectorAll(".ocr-row")].map((row) => ({
    date: row.querySelector('[data-ocr-field="date"]').value,
    title: row.querySelector('[data-ocr-field="title"]').value.trim(),
    amount: Number(row.querySelector('[data-ocr-field="amount"]').value),
    category: row.querySelector('[data-ocr-field="category"]').value,
    account: row.querySelector('[data-ocr-field="account"]').value
  })).filter((row) => isValidDateInput(row.date) && row.title && row.amount > 0);

  if (!rows.length) {
    ocrStatus.textContent = "There are no valid reviewed rows to import.";
    return;
  }

  createBackup(`before importing ${rows.length} OCR expenses`);
  state.transactions.unshift(...rows.map((row) => ({ ...row, id: crypto.randomUUID(), type: "expense", notes: "Imported from passbook screenshot" })));
  saveState();
  render();
  ocrRows = [];
  renderOcrRows();
  ocrFiles.value = "";
  ocrStatus.textContent = `Imported ${rows.length} reviewed expense${rows.length === 1 ? "" : "s"}.`;
}

function isValidDateInput(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) {
    return false;
  }
  const date = parseLocalDate(value);
  return toLocalDateString(date) === value;
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

function handleRestoreBackup() {
  const backup = loadBackup();
  if (!backup?.state) {
    alert("No backup restore point found.");
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
  renderSummaries();
  renderTrendChart();
  renderSpendDashboard();
  renderCategories();
  renderTransactions();
  renderBackupStatus();
}

function renderBackupStatus() {
  const backup = loadBackup();
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
        <span>New spends after ${formatDate(state.settings.creditCardStatementDate)}</span>
        <span>Bill due ${formatCurrency(cardSnapshot.billDue)}</span>
        <span>Total owed ${formatCurrency(cardSnapshot.totalOwed)}</span>
        <span>${formatCurrency(state.baseBalances.creditCard)} starting due</span>
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
  const currentCycleSpend = state.transactions
    .filter((transaction) => transaction.type === "expense" && transaction.account === "creditCard")
    .filter((transaction) => parseLocalDate(transaction.date) > statementDate)
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  return {
    currentCycleSpend,
    billDue: Math.max(totalOwed - currentCycleSpend, 0),
    totalOwed,
    statementDate
  };
}

function getDefaultCreditCardStatementDate(referenceDate = new Date()) {
  const statementDate = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), CREDIT_CARD_BILL_DAY);

  if (referenceDate.getDate() <= CREDIT_CARD_BILL_DAY) {
    statementDate.setMonth(statementDate.getMonth() - 1);
  }

  return statementDate.toLocaleDateString("en-CA");
}

function renderSummaries() {
  const today = spendingForPeriod("day", 0);
  const yesterday = spendingForPeriod("day", 1);
  const week = spendingForPeriod("week", 0);
  const lastWeek = spendingForPeriod("week", 1);
  const month = spendingForPeriod("month", 0);
  const lastMonth = spendingForPeriod("month", 1);

  todaySpend.textContent = formatCurrency(today);
  weekSpend.textContent = formatCurrency(week);
  monthSpend.textContent = formatCurrency(month);

  todayChange.textContent = buildDeltaCopy(today, yesterday, "vs yesterday");
  weekChange.textContent = buildDeltaCopy(week, lastWeek, "vs last week");
  monthChange.textContent = buildDeltaCopy(month, lastMonth, "vs last month");
}

function renderSpendDashboard() {
  const currentPeriod = getComparisonPeriod(comparisonRange, 0);
  const previousPeriod = getComparisonPeriod(comparisonRange, 1);
  const currentTotals = categoryTotalsForWindow(currentPeriod.start, currentPeriod.end);
  const previousTotals = categoryTotalsForWindow(previousPeriod.start, previousPeriod.end);
  const currentTotal = sumCategoryTotals(currentTotals);
  const previousTotal = sumCategoryTotals(previousTotals);
  const changeCopy = buildDeltaCopy(currentTotal, previousTotal, `vs ${comparisonRange === "weekly" ? "last week" : "last month"}`);
  const categories = [...new Set([...currentTotals.keys(), ...previousTotals.keys()])]
    .sort((a, b) => (currentTotals.get(b) || 0) - (currentTotals.get(a) || 0));
  const topCategory = categories[0] || "No spending yet";

  comparisonRangeCopy.textContent = `${currentPeriod.label} compared with ${previousPeriod.label.toLowerCase()}.`;
  comparisonSummary.innerHTML = `
    <article class="comparison-summary-card">
      <span>${currentPeriod.shortLabel}</span>
      <strong>${formatCurrency(currentTotal)}</strong>
      <small>${formatDateRange(currentPeriod.start, currentPeriod.end)}</small>
    </article>
    <article class="comparison-summary-card">
      <span>${previousPeriod.shortLabel}</span>
      <strong>${formatCurrency(previousTotal)}</strong>
      <small>${formatDateRange(previousPeriod.start, previousPeriod.end)}</small>
    </article>
    <article class="comparison-summary-card comparison-summary-highlight">
      <span>Movement</span>
      <strong>${changeCopy}</strong>
      <small>Top category: ${escapeHtml(topCategory)}</small>
    </article>
  `;

  if (!categories.length) {
    comparisonList.innerHTML = `<div class="comparison-empty">Add expenses to start comparing category movement.</div>`;
    return;
  }

  const maxAmount = Math.max(...categories.map((category) => Math.max(currentTotals.get(category) || 0, previousTotals.get(category) || 0)), 1);
  comparisonList.innerHTML = categories.map((category) => {
    const currentAmount = currentTotals.get(category) || 0;
    const previousAmount = previousTotals.get(category) || 0;
    const delta = currentAmount - previousAmount;
    const deltaPercent = previousAmount ? Math.round((delta / previousAmount) * 100) : currentAmount ? null : 0;
    const deltaClass = delta > 0 ? "is-up" : delta < 0 ? "is-down" : "is-flat";
    const deltaLabel = deltaPercent === null ? "New" : deltaPercent === 0 ? "Flat" : `${Math.abs(deltaPercent)}% ${delta > 0 ? "up" : "down"}`;

    return `
      <article class="comparison-row">
        <div class="comparison-category">
          <strong>${escapeHtml(category)}</strong>
          <div class="comparison-bars">
            <div class="comparison-bar-track" title="${currentPeriod.shortLabel}: ${formatCurrency(currentAmount)}">
              <span class="comparison-bar-current" style="width: ${(currentAmount / maxAmount) * 100}%"></span>
            </div>
            <div class="comparison-bar-track comparison-bar-previous" title="${previousPeriod.shortLabel}: ${formatCurrency(previousAmount)}">
              <span style="width: ${(previousAmount / maxAmount) * 100}%"></span>
            </div>
          </div>
          <small><span class="legend-dot current"></span>${currentPeriod.shortLabel} <span class="legend-dot previous"></span>${previousPeriod.shortLabel}</small>
        </div>
        <div class="comparison-amounts">
          <strong>${formatCurrency(currentAmount)}</strong>
          <span>vs ${formatCurrency(previousAmount)}</span>
        </div>
        <span class="comparison-delta ${deltaClass}">${deltaLabel}</span>
      </article>
    `;
  }).join("");
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

function renderCategories() {
  const { start, end, label } = getCategoryRangeWindow();
  const expenses = state.transactions
    .filter(isSpendingEntry)
    .filter((item) => {
      const transactionDate = parseLocalDate(item.date);
      return transactionDate >= start && transactionDate <= end;
    });
  const totals = new Map();

  expenses.forEach((transaction) => {
    totals.set(transaction.category, (totals.get(transaction.category) || 0) + transaction.amount);
  });

  const ranked = [...totals.entries()].sort((a, b) => b[1] - a[1]);
  const highest = ranked[0]?.[1] || 1;
  categoryRangeCopy.textContent = label;

  categoryList.innerHTML = ranked.length
    ? ranked.map(([category, amount]) => `
        <article class="category-row">
          <div>
            <strong>${category}</strong>
            <div class="category-bar">
              <div class="category-bar-fill" style="width: ${(amount / highest) * 100}%"></div>
            </div>
          </div>
          <div class="category-meta">${formatCurrency(amount)}</div>
        </article>
      `).join("")
    : `<article class="category-row"><div><strong>No expenses yet</strong><div class="category-bar"><div class="category-bar-fill" style="width: 0%"></div></div></div><div class="category-meta">No expenses in this ${categoryRange}</div></article>`;
}

function getCategoryRangeWindow() {
  if (categorySelectedWindow) {
    return {
      start: parseLocalDate(categorySelectedWindow.start),
      end: endOfDay(parseLocalDate(categorySelectedWindow.end)),
      label: categorySelectedWindow.label
    };
  }

  const today = new Date();

  if (categoryRange === "daily") {
    const date = startOfDay(new Date(today));
    date.setDate(date.getDate() - categoryPeriodOffset);
    const prefix = categoryPeriodOffset === 0 ? "Today" : `${categoryPeriodOffset} ${categoryPeriodOffset === 1 ? "day" : "days"} ago`;
    return {
      start: date,
      end: endOfDay(date),
      label: `${prefix}: ${formatDate(toLocalDateString(date))}`
    };
  }

  if (categoryRange === "weekly") {
    const start = startOfWeek(today);
    start.setDate(start.getDate() - categoryPeriodOffset * 7);
    const end = endOfDay(new Date(start));
    end.setDate(start.getDate() + 6);
    const prefix = categoryPeriodOffset === 0 ? "Current week" : `${categoryPeriodOffset} ${categoryPeriodOffset === 1 ? "week" : "weeks"} ago`;
    return {
      start,
      end,
      label: `${prefix}: ${formatDate(toLocalDateString(start))} to ${formatDate(toLocalDateString(end))}`
    };
  }

  const start = new Date(today.getFullYear(), today.getMonth() - categoryPeriodOffset, 1);
  const end = endOfDay(new Date(today.getFullYear(), today.getMonth() - categoryPeriodOffset + 1, 0));
  const prefix = categoryPeriodOffset === 0 ? "Current month" : `${categoryPeriodOffset} ${categoryPeriodOffset === 1 ? "month" : "months"} ago`;
  return {
    start,
    end,
    label: `${prefix}: ${start.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}`
  };
}

function renderTransactions() {
  const sorted = getSortedTransactions();
  transactionList.innerHTML = renderTransactionRows(sorted.slice(0, 10));
  historyList.innerHTML = renderTransactionRows(sorted);
  historyCount.textContent = `${sorted.length} saved ${sorted.length === 1 ? "transaction" : "transactions"}`;
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
            <span>${transaction.category}</span>
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

  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(29, 26, 23, 0.12)";

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

  ctx.font = '12px "DM Sans"';
  ctx.fillStyle = "#6f655c";
  ctx.textAlign = "center";
  points.forEach((point) => {
    ctx.fillText(point.label, point.x, height - 22);
  });

  ctx.textAlign = "left";
  ctx.fillStyle = "#1d1a17";
  ctx.font = '600 13px "DM Sans"';
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
    <span>Click to view category split</span>
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

function handleChartClick(event) {
  const point = getNearestChartPoint(event);
  if (!point) {
    return;
  }

  categoryRange = currentRange;
  categoryPeriodOffset = getCategoryOffsetForPoint(point.rangeStart, currentRange);
  categorySelectedWindow = null;
  document.querySelectorAll(".category-tab-button").forEach((tab) => {
    tab.classList.toggle("is-active", tab.dataset.categoryRange === categoryRange);
  });
  renderCategories();
  document.getElementById("categoryDistribution").scrollIntoView({ behavior: "smooth", block: "start" });
}

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

function getCategoryOffsetForPoint(rangeStart, range) {
  const selectedDate = parseLocalDate(rangeStart);
  const today = new Date();

  if (range === "daily") {
    return Math.max(Math.round((startOfDay(today) - startOfDay(selectedDate)) / 86400000), 0);
  }

  if (range === "weekly") {
    return Math.max(Math.round((startOfWeek(today) - startOfWeek(selectedDate)) / (86400000 * 7)), 0);
  }

  return Math.max((today.getFullYear() - selectedDate.getFullYear()) * 12 + today.getMonth() - selectedDate.getMonth(), 0);
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
