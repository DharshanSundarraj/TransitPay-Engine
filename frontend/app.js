const API_URL = "http://localhost:8080/api/transit";
const OFFLINE_QUEUE_KEY = "transitpay_offline_txns";
let activePassId = null;
let html5QrCode = null;
let currentPassengerPass = null;

// --- TNSTC REAL ROUTE DATA & FARE MATRIX (CHIDAMBARAM TO SALEM) ---
const TNSTC_STAGES = [
  { id: "CHIDAMBARAM", name: "Chidambaram", cumulativeFare: 0 },
  { id: "VADALUR", name: "Vadalur", cumulativeFare: 25 },
  { id: "NEYVELI", name: "Neyveli", cumulativeFare: 40 },
  { id: "VRIDDHACHALAM", name: "Vriddhachalam", cumulativeFare: 60 },
  { id: "VEPPUR", name: "Veppur Cross", cumulativeFare: 90 },
  { id: "THALAIVASAL", name: "Thalaivasal", cumulativeFare: 125 },
  { id: "ATTUR", name: "Attur", cumulativeFare: 145 },
  { id: "VALAPADY", name: "Valapady", cumulativeFare: 170 },
  { id: "SALEM", name: "Salem (Central)", cumulativeFare: 195 },
];

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  setupAuth();
  setupTabs();
  setupCustomDropdown();
  setupNetworkListeners();
  initScanner();
});

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

function setupCustomDropdown() {
  populateStageDropdown(
    "boardOptions",
    "boardDropdownWrapper",
    "selectedBoardText",
    "boardStage",
    "CHIDAMBARAM",
  );
  populateStageDropdown(
    "alightOptions",
    "alightDropdownWrapper",
    "selectedAlightText",
    "alightStage",
    "SALEM",
  );
  calculateDynamicFare();
}

function populateStageDropdown(
  optionsContainerId,
  wrapperId,
  textId,
  hiddenInputId,
  defaultVal,
) {
  const container = document.getElementById(optionsContainerId);
  const wrapper = document.getElementById(wrapperId);
  const trigger = wrapper.querySelector(".custom-select-trigger");
  const hiddenInput = document.getElementById(hiddenInputId);

  container.innerHTML = TNSTC_STAGES.map(
    (stage) => `
        <div class="custom-option ${stage.id === defaultVal ? "active" : ""}" data-value="${stage.id}">
            ${stage.name} (₹${stage.cumulativeFare})
        </div>
    `,
  ).join("");

  trigger.addEventListener("click", (e) => {
    document.querySelectorAll(".custom-select-wrapper").forEach((w) => {
      if (w !== wrapper) w.classList.remove("open");
    });
    wrapper.classList.toggle("open");
    e.stopPropagation();
  });

  container.querySelectorAll(".custom-option").forEach((option) => {
    option.addEventListener("click", () => {
      container
        .querySelectorAll(".custom-option")
        .forEach((opt) => opt.classList.remove("active"));
      option.classList.add("active");
      document.getElementById(textId).innerText =
        option.innerText.split(" (")[0];
      hiddenInput.value = option.getAttribute("data-value");
      wrapper.classList.remove("open");
      calculateDynamicFare();
    });
  });
}

function calculateDynamicFare() {
  const boardId = document.getElementById("boardStage").value;
  const alightId = document.getElementById("alightStage").value;

  const boardStage = TNSTC_STAGES.find((s) => s.id === boardId);
  const alightStage = TNSTC_STAGES.find((s) => s.id === alightId);

  let netFare = Math.abs(
    alightStage.cumulativeFare - boardStage.cumulativeFare,
  );

  if (netFare === 0 && boardId !== alightId) netFare = 15.0;
  if (boardId === alightId) netFare = 0.0;

  document.getElementById("fareAmount").value = netFare.toFixed(2);
}

document.addEventListener("click", () => {
  document
    .querySelectorAll(".custom-select-wrapper")
    .forEach((w) => w.classList.remove("open"));
});

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

function initScanner() {
  html5QrCode = new Html5Qrcode("qrReader");
  document
    .getElementById("cameraStartOverlay")
    .addEventListener("click", startScanner);
  document
    .getElementById("cameraCloseBtn")
    .addEventListener("click", stopScanner);
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
          document.getElementById("scanInput").value = decodedText;
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

  if (!name || phone.length !== 10 || isNaN(balance))
    return showModal(
      "error",
      "Validation Failed",
      "Please verify the 10-digit mobile number and other details.",
    );

  const uuid = `TNS-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const payload = {
    passUuid: uuid,
    passengerName: name,
    passengerPhone: phone,
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

// SMART SEARCH ROUTING (Conductor)
document.getElementById("btnLookup").addEventListener("click", async () => {
  const rawQuery = document.getElementById("scanInput").value.trim();
  if (!rawQuery) return;

  let endpoint = "";
  if (rawQuery.toUpperCase().startsWith("TNS-")) {
    endpoint = `${API_URL}/pass/${rawQuery.toUpperCase()}`;
  } else if (/^[\d\+\-\s]+$/.test(rawQuery)) {
    const cleanPhone = rawQuery.replace(/[\s\-]/g, "");
    endpoint = `${API_URL}/pass/phone/${cleanPhone}`;
  } else {
    endpoint = `${API_URL}/pass/name/${rawQuery}`;
  }

  try {
    const response = await fetch(endpoint);
    if (response.ok && response.headers.get("content-length") !== "0") {
      const pass = await response.json();
      activePassId = pass.id;

      document.getElementById("walletName").innerText = pass.passengerName;
      document.getElementById("walletPhone").innerText =
        pass.passengerPhone || "No Phone Registered";
      document.getElementById("walletBalance").innerText =
        `₹${pass.currentBalance.toFixed(2)}`;
      document.getElementById("scanInput").value = pass.passUuid;

      document.getElementById("authPanel").classList.remove("disabled-state");
      fetchLedger(activePassId);
    } else {
      showModal(
        "error",
        "Not Found",
        "Could not locate commuter with that data.",
      );
      resetTerminal();
    }
  } catch (err) {
    showModal("error", "Connection Failed", "Operating in limited capacity.");
  }
});

document
  .getElementById("btnProcessFare")
  .addEventListener("click", async () => {
    const uuid = document.getElementById("scanInput").value;
    const bStage = document.getElementById("boardStage").value;
    const aStage = document.getElementById("alightStage").value;
    const amount = parseFloat(document.getElementById("fareAmount").value);

    if (amount <= 0) {
      showModal(
        "error",
        "Invalid Journey",
        "Boarding and Alighting points cannot be identical.",
      );
      return;
    }

    const shortRouteDisplay = `${bStage.substring(0, 4)}→${aStage.substring(0, 4)}`;
    const payload = {
      passUuid: uuid,
      routeCode: shortRouteDisplay,
      fareAmount: amount,
    };

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
          `Route: ${bStage} to ${aStage}\nDebited: ₹${amount.toFixed(2)}\nRef: #${receipt.id}`,
        );
        updateLocalBalance(amount);
        const time = new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
        injectLedgerRow(
          shortRouteDisplay,
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
  document.getElementById("scanInput").value = "";
  document.getElementById("walletName").innerText = "--";
  document.getElementById("walletPhone").innerText = "--";
  document.getElementById("walletBalance").innerText = "₹0.00";
  document.getElementById("authPanel").classList.add("disabled-state");
  document.getElementById("ledgerList").innerHTML =
    '<li class="empty-state">Search or scan to view history.</li>';
}

// SMART SEARCH ROUTING (Passenger Portal)
document
  .getElementById("btnPassengerLookup")
  .addEventListener("click", async () => {
    const rawQuery = document.getElementById("passengerUuid").value.trim();
    if (!rawQuery) return;

    let endpoint = "";
    if (rawQuery.toUpperCase().startsWith("TNS-")) {
      endpoint = `${API_URL}/pass/${rawQuery.toUpperCase()}`;
    } else if (/^[\d\+\-\s]+$/.test(rawQuery)) {
      const cleanPhone = rawQuery.replace(/[\s\-]/g, "");
      endpoint = `${API_URL}/pass/phone/${cleanPhone}`;
    } else {
      endpoint = `${API_URL}/pass/name/${rawQuery}`;
    }

    try {
      const response = await fetch(endpoint);
      if (response.ok && response.headers.get("content-length") !== "0") {
        currentPassengerPass = await response.json();
        document.getElementById("passengerWallet").style.display = "flex";
        document.getElementById("pName").innerText =
          currentPassengerPass.passengerName;
        document.getElementById("pBalance").innerText =
          `₹${currentPassengerPass.currentBalance.toFixed(2)}`;
        triggerHaptic("success");
      } else {
        showModal(
          "error",
          "Account Not Found",
          "Could not locate a wallet with those details.",
        );
        document.getElementById("passengerWallet").style.display = "none";
        currentPassengerPass = null;
      }
    } catch (err) {
      showModal(
        "error",
        "Network Error",
        "Cannot reach transit servers. Please check your connection.",
      );
    }
  });

document.getElementById("btnDownloadCard").addEventListener("click", () => {
  if (currentPassengerPass) {
    const phoneToDisplay =
      currentPassengerPass.passengerPhone || "No Phone Registered";
    showModal(
      "success",
      "",
      "",
      currentPassengerPass.passUuid,
      currentPassengerPass.passengerName,
      phoneToDisplay,
    );
  }
});
