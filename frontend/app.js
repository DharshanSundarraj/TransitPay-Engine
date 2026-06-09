const API_URL = "http://localhost:8080/api/transit";
const OFFLINE_QUEUE_KEY = "transitpay_offline_txns";
let activePassId = null;
let html5QrCode = null;
let currentPassengerPass = null;

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  setupAuth();
  setupTabs();
  setupCustomDropdown();
  setupNetworkListeners();
  initScanner();
});

// --- ENVIRONMENTAL UX ---
function triggerHaptic(type) {
  if (!navigator.vibrate) return;
  if (type === "success") navigator.vibrate([100, 50, 100]);
  if (type === "error") navigator.vibrate([300]);
}

function initTheme() {
  const btn = document.getElementById("themeToggle");
  if (localStorage.getItem("transit_theme") === "dark")
    document.body.classList.add("dark-theme");

  btn.addEventListener("click", () => {
    document.body.classList.toggle("dark-theme");
    localStorage.setItem(
      "transit_theme",
      document.body.classList.contains("dark-theme") ? "dark" : "light",
    );
  });
}

// --- CUSTOM ROUTE DROPDOWN ENGINE ---
function setupCustomDropdown() {
  const wrapper = document.getElementById("routeDropdownWrapper");
  const trigger = document.getElementById("routeDropdownTrigger");
  const options = document.querySelectorAll(".custom-option");
  const selectedText = document.getElementById("selectedRouteText");
  const hiddenInput = document.getElementById("routeCode");

  trigger.addEventListener("click", (e) => {
    wrapper.classList.toggle("open");
    e.stopPropagation();
  });

  options.forEach((option) => {
    option.addEventListener("click", () => {
      options.forEach((opt) => opt.classList.remove("active"));
      option.classList.add("active");
      selectedText.innerText = option.innerText;
      hiddenInput.value = option.getAttribute("data-value");
      wrapper.classList.remove("open");
    });
  });

  document.addEventListener("click", (e) => {
    if (!wrapper.contains(e.target)) wrapper.classList.remove("open");
  });
}

// --- AUTHENTICATION GATEWAY ---
function setupAuth() {
  const loginScreen = document.getElementById("loginScreen");
  const mainApp = document.getElementById("mainApp");
  const roleLabel = document.getElementById("roleLabel");
  const conductorNav = document.getElementById("conductorNav");

  const viewScan = document.getElementById("view-scan");
  const viewIssue = document.getElementById("view-issue");
  const viewPassenger = document.getElementById("view-passenger");

  document.getElementById("btnLoginConductor").addEventListener("click", () => {
    loginScreen.style.display = "none";
    mainApp.style.display = "flex";
    roleLabel.innerText = "TERMINAL";
    conductorNav.style.display = "flex";
    viewScan.style.display = "block";
    viewPassenger.style.display = "none";
  });

  document.getElementById("btnLoginPassenger").addEventListener("click", () => {
    loginScreen.style.display = "none";
    mainApp.style.display = "flex";
    roleLabel.innerText = "PASSENGER PORTAL";
    conductorNav.style.display = "none";
    viewScan.style.display = "none";
    viewIssue.style.display = "none";
    viewPassenger.style.display = "block";
    stopScanner();
  });

  document.getElementById("btnLogout").addEventListener("click", () => {
    stopScanner();
    mainApp.style.display = "none";
    loginScreen.style.display = "flex";
    resetTerminal();
    currentPassengerPass = null;
    document.getElementById("passengerWallet").style.display = "none";
  });
}

// --- TABS ---
function setupTabs() {
  const tabScan = document.getElementById("tab-scan");
  const tabIssue = document.getElementById("tab-issue");
  const viewScan = document.getElementById("view-scan");
  const viewIssue = document.getElementById("view-issue");

  tabScan.addEventListener("click", () => {
    tabScan.classList.add("active");
    tabIssue.classList.remove("active");
    viewScan.style.display = "block";
    viewIssue.style.display = "none";
  });

  tabIssue.addEventListener("click", () => {
    tabIssue.classList.add("active");
    tabScan.classList.remove("active");
    viewIssue.style.display = "block";
    viewScan.style.display = "none";
    stopScanner();
  });
}

// --- MODAL, PRINT & CARD RENDERER ---
function showModal(
  type,
  title,
  message,
  uuidForCard = null,
  name = "--",
  phone = "--",
) {
  triggerHaptic(type);
  const modal = document.getElementById("customModal");
  const cardRender = document.getElementById("cardRenderer");
  const standardContent = document.getElementById("standardModalContent");
  const printBtn = document.getElementById("btnPrintBtn");

  document.getElementById("printableArea").className = `modal-card ${type}`;

  if (uuidForCard) {
    standardContent.style.display = "none";
    cardRender.style.display = "block";
    printBtn.style.display = "block";

    document.getElementById("cardName").innerText = name;
    document.getElementById("cardPhone").innerText = phone;
    document.getElementById("cardUuid").innerText = uuidForCard;

    const qrContainer = document.getElementById("cardQrCode");
    qrContainer.innerHTML = "";
    new QRCode(qrContainer, {
      text: uuidForCard,
      width: 100,
      height: 100,
      colorDark: "#0f172a",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H,
    });
  } else {
    standardContent.style.display = "block";
    cardRender.style.display = "none";
    printBtn.style.display = "none";
    document.getElementById("modalTitle").innerText = title;
    document.getElementById("modalMessage").innerText = message;
  }
  modal.style.display = "flex";
}

document
  .getElementById("modalCloseBtn")
  .addEventListener(
    "click",
    () => (document.getElementById("customModal").style.display = "none"),
  );
document
  .getElementById("btnPrintBtn")
  .addEventListener("click", () => window.print());

// --- HIGH SPEED QR SCANNER ---
function initScanner() {
  html5QrCode = new Html5Qrcode("qrReader");

  document
    .getElementById("cameraStartOverlay")
    .addEventListener("click", () => {
      startScanner();
    });

  document.getElementById("cameraCloseBtn").addEventListener("click", () => {
    stopScanner();
  });
}

function startScanner() {
  if (html5QrCode && !html5QrCode.isScanning) {
    document.getElementById("cameraStartOverlay").style.display = "none";
    document.getElementById("cameraCloseBtn").style.display = "block";

    html5QrCode
      .start(
        { facingMode: "environment" },
        { fps: 15, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          document.getElementById("scanUuid").value = decodedText;
          triggerHaptic("success");
          stopScanner();
          document.getElementById("btnLookup").click();
        },
        (error) => {},
      )
      .catch((err) => {
        document.getElementById("cameraStartOverlay").style.display = "flex";
        document.getElementById("cameraStartOverlay").innerHTML =
          "<span>Camera Access Denied</span>";
        document.getElementById("cameraCloseBtn").style.display = "none";
      });
  }
}

function stopScanner() {
  if (html5QrCode && html5QrCode.isScanning) {
    html5QrCode.stop().then(() => {
      document.getElementById("cameraStartOverlay").style.display = "flex";
      document.getElementById("cameraStartOverlay").innerHTML =
        "<span>TAP TO START SCANNER</span>";
      document.getElementById("cameraCloseBtn").style.display = "none";
    });
  }
}

// --- SILENT OFFLINE SYNC ENGINE ---
function setupNetworkListeners() {
  window.addEventListener("online", handleNetworkChange);
  window.addEventListener("offline", handleNetworkChange);
  handleNetworkChange();
}

function handleNetworkChange() {
  const indicator = document.getElementById("networkIndicator");
  const text = document.getElementById("networkText");

  if (navigator.onLine) {
    indicator.classList.remove("offline");
    text.classList.remove("text-offline");
    text.innerText = "Online";
    syncOfflineTransactions();
  } else {
    indicator.classList.add("offline");
    text.classList.add("text-offline");
    text.innerText = "Offline Mode";
  }
}

function queueTransactionLocally(payload) {
  let queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY)) || [];
  payload.localTimestamp = new Date().toISOString();
  queue.push(payload);
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));

  showModal(
    "success",
    "Saved Offline",
    `Payment recorded locally.\nAmount: ₹${payload.fareAmount.toFixed(2)}\nWill sync automatically.`,
  );
  injectLedgerRow(
    payload.routeCode,
    payload.fareAmount,
    "PENDING SYNC",
    "afterbegin",
  );
}

async function syncOfflineTransactions() {
  let queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY)) || [];
  if (queue.length === 0) return;

  let successfulSyncs = [];
  for (let i = 0; i < queue.length; i++) {
    try {
      const response = await fetch(`${API_URL}/authorize-fare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(queue[i]),
      });
      if (response.ok) successfulSyncs.push(i);
    } catch (err) {}
  }

  queue = queue.filter((_, index) => !successfulSyncs.includes(index));
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));

  if (successfulSyncs.length > 0 && activePassId) fetchLedger(activePassId);
}

// --- TRANSIT OPERATIONS ---
document.getElementById("btnIssuePass").addEventListener("click", async () => {
  const name = document.getElementById("newName").value;
  const phone = document.getElementById("newPhone").value;
  const balance = parseFloat(document.getElementById("newBalance").value);

  if (!name || !phone || isNaN(balance))
    return showModal(
      "error",
      "Validation Failed",
      "Please complete all passenger details.",
    );

  const uuid = `TNS-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const payload = {
    passUuid: uuid,
    passengerName: name,
    currentBalance: balance,
  };

  try {
    const response = await fetch(`${API_URL}/issue-pass`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      showModal("success", "", "", uuid, name, phone);
      document.getElementById("newName").value = "";
      document.getElementById("newPhone").value = "";
      document.getElementById("newBalance").value = "";
    } else {
      showModal("error", "Database Error", "Failed to register passenger.");
    }
  } catch (err) {
    showModal("error", "Offline", "Cannot reach network.");
  }
});

document.getElementById("btnLookup").addEventListener("click", async () => {
  const uuid = document.getElementById("scanUuid").value;
  if (!uuid) return;

  try {
    const response = await fetch(`${API_URL}/pass/${uuid}`);
    if (response.ok && response.headers.get("content-length") !== "0") {
      const pass = await response.json();
      activePassId = pass.id;

      document.getElementById("walletName").innerText = pass.passengerName;
      document.getElementById("walletPhone").innerText = "Verified User";
      document.getElementById("walletBalance").innerText =
        `₹${pass.currentBalance.toFixed(2)}`;

      document.getElementById("authPanel").classList.remove("disabled-state");
      fetchLedger(activePassId);
    } else {
      showModal("error", "Invalid Card", "This card is not recognized.");
      resetTerminal();
    }
  } catch (err) {
    showModal("error", "Connection Failed", "Operating in limited capacity.");
  }
});

document
  .getElementById("btnProcessFare")
  .addEventListener("click", async () => {
    const uuid = document.getElementById("scanUuid").value;
    const routeCodeFull = document.getElementById("routeCode").value; // Get from hidden input
    const amount = parseFloat(document.getElementById("fareAmount").value);
    const route = routeCodeFull.split("-")[1]; // Extracts A1, B2, L1

    const payload = { passUuid: uuid, routeCode: route, fareAmount: amount };

    if (!navigator.onLine) {
      queueTransactionLocally(payload);
      updateLocalBalance(amount);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/authorize-fare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const receipt = await response.json();
        showModal(
          "success",
          "Payment Successful",
          `Deducted: ₹${amount.toFixed(2)}\nRef: #${receipt.id}`,
        );
        updateLocalBalance(amount);

        const time = new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
        injectLedgerRow(
          route,
          amount,
          `#${receipt.id} • ${time}`,
          "afterbegin",
        );
      } else {
        const err = await response.json();
        showModal("error", "Payment Declined", err.error);
      }
    } catch (err) {
      queueTransactionLocally(payload);
      updateLocalBalance(amount);
    }
  });

function updateLocalBalance(amount) {
  let currentBal = parseFloat(
    document.getElementById("walletBalance").innerText.replace("₹", ""),
  );
  document.getElementById("walletBalance").innerText =
    `₹${(currentBal - amount).toFixed(2)}`;
}

async function fetchLedger(passId) {
  try {
    const response = await fetch(`${API_URL}/ledger/${passId}`);
    const ledger = await response.json();
    const list = document.getElementById("ledgerList");
    list.innerHTML = "";

    if (ledger.length === 0) {
      list.innerHTML = '<li class="empty-state">No prior trips recorded.</li>';
      return;
    }

    ledger.forEach((txn) => {
      const time = new Date(txn.transactionTime).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      injectLedgerRow(
        txn.routeCode,
        txn.fareDeducted,
        `#${txn.id} • ${time}`,
        "beforeend",
      );
    });
  } catch (err) {}
}

function injectLedgerRow(routeCode, amount, idTimeStr, position = "beforeend") {
  const list = document.getElementById("ledgerList");
  const emptyState = list.querySelector(".empty-state");
  if (emptyState) emptyState.remove();

  const html = `
        <li class="ledger-item fade-in">
            <div class="item-details">
                <span class="item-route">Route ${routeCode}</span>
                <span class="item-time">${idTimeStr}</span>
            </div>
            <span class="item-amount">-₹${parseFloat(amount).toFixed(2)}</span>
        </li>
    `;
  list.insertAdjacentHTML(position, html);
}

function resetTerminal() {
  activePassId = null;
  document.getElementById("scanUuid").value = "";
  document.getElementById("walletName").innerText = "--";
  document.getElementById("walletPhone").innerText = "--";
  document.getElementById("walletBalance").innerText = "₹0.00";
  document.getElementById("authPanel").classList.add("disabled-state");
  document.getElementById("ledgerList").innerHTML =
    '<li class="empty-state">Scan a card to view history.</li>';
}

// --- PASSENGER PORTAL LOGIC ---
document
  .getElementById("btnPassengerLookup")
  .addEventListener("click", async () => {
    const uuid = document.getElementById("passengerUuid").value;
    if (!uuid) return;

    try {
      const response = await fetch(`${API_URL}/pass/${uuid}`);
      if (response.ok && response.headers.get("content-length") !== "0") {
        currentPassengerPass = await response.json();
        document.getElementById("passengerWallet").style.display = "flex";
        document.getElementById("pName").innerText =
          currentPassengerPass.passengerName;
        document.getElementById("pBalance").innerText =
          `₹${currentPassengerPass.currentBalance.toFixed(2)}`;
        triggerHaptic("success");
      } else {
        showModal("error", "Card Not Found", "Check your Reference ID.");
        document.getElementById("passengerWallet").style.display = "none";
        currentPassengerPass = null;
      }
    } catch (err) {
      showModal("error", "Network Error", "Cannot reach servers.");
    }
  });

document.getElementById("btnDownloadCard").addEventListener("click", () => {
  if (currentPassengerPass) {
    showModal(
      "success",
      "",
      "",
      currentPassengerPass.passUuid,
      currentPassengerPass.passengerName,
      "Verified User",
    );
  }
});
