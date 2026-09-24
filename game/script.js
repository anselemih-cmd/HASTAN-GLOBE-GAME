import { auth, db } from "./firebase-config.js";
import { supabase } from "./supabase-config.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  runTransaction,
  serverTimestamp,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

/* =====================================================
   GLOBAL
===================================================== */

let currentUser = null;

const MAIN_ADMIN_UID =
  "FkMOO6jsgJZvnJV36sl3RrHLd063";

const $ = id => document.getElementById(id);


/* =====================================================
   PAGE MAP
===================================================== */

const pages = {
  home: "homePage",
  competitions: "competitionsPage",
  matches: "matchesPage",
  ranking: "rankingPage",
  statistics: "statisticsPage",
  history: "historyPage",
  balance: "balancePage",
  withdrawal: "withdrawalPage",
  notifications: "notificationsPage"
};


/* =====================================================
   AUTH
===================================================== */

onAuthStateChanged(auth, async user => {

  if (!user) {

    currentUser = null;

    $("loginOverlay")?.classList.remove("hidden");

    return;
  }

  currentUser = user;

  if (user.uid === MAIN_ADMIN_UID) {

    window.location.replace("./admin.html");

    return;
  }

  $("loginOverlay")?.classList.add("hidden");

  await loadPlayer();
  await loadCompetitions();
  await loadMyMatches();

});


/* =====================================================
   PLAYER
===================================================== */

async function loadPlayer() {

  if (!currentUser) return;

  try {

    const ref = doc(
      db,
      "users",
      currentUser.uid
    );

    const snap = await getDoc(ref);

    if (!snap.exists()) {

      setPlayerUI({
        name: currentUser.displayName || "Player",
        username: currentUser.email || "",
        balance: 0
      });

      return;
    }

    const data = snap.data();

    setPlayerUI({

      name:
        data.name ||
        data.fullName ||
        data.displayName ||
        "Player",

      username:
        data.username
          ? "@" + data.username
          : data.email || "",

      balance:
        Number(data.gamerBalance || 0)

    });

  } catch (error) {

    console.error(
      "Player loading error:",
      error
    );

  }

}


/* =====================================================
   PLAYER UI
===================================================== */

function setPlayerUI(data) {

  if ($("playerName"))
    $("playerName").textContent =
      data.name || "Player";

  if ($("playerUsername"))
    $("playerUsername").textContent =
      data.username || "";

  const balance =
    Number(data.balance || 0)
      .toLocaleString("en-TZ");

  if ($("gamerBalance"))
    $("gamerBalance").textContent =
      balance;

  if ($("balanceAmount"))
    $("balanceAmount").textContent =
      balance;

}


/* =====================================================
   REFRESH PLAYER BALANCE
===================================================== */

async function refreshPlayerBalance() {

  if (!currentUser) return 0;

  try {

    const snap = await getDoc(
      doc(
        db,
        "users",
        currentUser.uid
      )
    );

    if (!snap.exists()) {

      setPlayerUI({
        name: currentUser.displayName || "Player",
        username: currentUser.email || "",
        balance: 0
      });

      return 0;
    }

    const data = snap.data();

    const balance =
      Number(data.gamerBalance || 0);

    setPlayerUI({

      name:
        data.name ||
        data.fullName ||
        data.displayName ||
        "Player",

      username:
        data.username
          ? "@" + data.username
          : data.email || "",

      balance

    });

    return balance;

  } catch (error) {

    console.error(
      "Refresh balance error:",
      error
    );

    return 0;

  }

}


/* =====================================================
   NAVIGATION
===================================================== */

function openPage(page) {

  Object.values(pages).forEach(id => {

    const element = $(id);

    if (element)
      element.classList.add("hidden");

  });

  const target =
    pages[page] || pages.home;

  const targetElement =
    $(target);

  if (targetElement)
    targetElement.classList.remove("hidden");

  document
    .querySelectorAll("[data-page]")
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.page === page
      );

    });

  if (page === "competitions")
    loadCompetitions();

  if (page === "matches")
    loadMyMatches();

  if (page === "ranking")
    loadRanking();

  if (page === "statistics")
    loadStatistics();

  if (page === "history")
    loadHistory();

  if (page === "balance")
    loadTransactions();

  if (page === "withdrawal")
    loadWithdrawals();

  if (page === "notifications")
    loadNotifications();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}


/* =====================================================
   NAVIGATION EVENTS
===================================================== */

document
  .querySelectorAll("[data-page]")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        const page =
          button.dataset.page;

        if (!page) return;

        closeMenu();

        openPage(page);

      }
    );

  });


document
  .querySelectorAll(".back-btn")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => openPage("home")
    );

  });


/* =====================================================
   SIDE MENU
===================================================== */

function openMenu() {

  $("sideMenu")
    ?.classList.add("open");

  $("menuOverlay")
    ?.classList.add("show");

}


function closeMenu() {

  $("sideMenu")
    ?.classList.remove("open");

  $("menuOverlay")
    ?.classList.remove("show");

}


$("menuBtn")
  ?.addEventListener(
    "click",
    openMenu
  );


$("closeMenu")
  ?.addEventListener(
    "click",
    closeMenu
  );


$("menuOverlay")
  ?.addEventListener(
    "click",
    closeMenu
  );


/* =====================================================
   LOGOUT
===================================================== */

$("logoutBtn")
  ?.addEventListener(
    "click",
    async () => {

      try {

        await signOut(auth);

      } catch (error) {

        console.error(error);

        alert("Logout failed.");

      }

    }
  );


/* =====================================================
   LOGIN BUTTON
===================================================== */

$("loginBtn")
  ?.addEventListener(
    "click",
    () => {

      alert(
        "Login system will be connected next."
      );

    }
  );


/* =====================================================
   LOAD COMPETITIONS
===================================================== */

async function loadCompetitions() {

  const box =
    $("competitionList");

  if (!box) return;

  box.innerHTML = `
    <div class="loading">
      Loading competitions...
    </div>
  `;

  try {

    const q =
      query(
        collection(
          db,
          "gameCompetitions"
        ),
        orderBy(
          "createdAt",
          "desc"
        )
      );

    const snapshot =
      await getDocs(q);

    if (snapshot.empty) {

      box.innerHTML = `
        <div class="empty">

          <div>🏆</div>

          <h3>No Competitions Yet</h3>

          <p>
            New competitions will appear
            here when Admin creates them.
          </p>

        </div>
      `;

      return;
    }

    const competitions =
      await Promise.all(

        snapshot.docs.map(
          async item => {

            let playerState = null;
            let paymentState = null;

            if (currentUser) {

              try {

                const playerRef =
                  doc(
                    db,
                    "gameCompetitionPlayers",
                    `${item.id}_${currentUser.uid}`
                  );

                const playerSnap =
                  await getDoc(playerRef);

                if (playerSnap.exists())
                  playerState =
                    playerSnap.data();

              } catch (error) {

                console.error(
                  "Player state error:",
                  error
                );

              }

              try {

                const paymentRef =
                  doc(
                    db,
                    "gameCompetitionPayments",
                    `${item.id}_${currentUser.uid}`
                  );

                const paymentSnap =
                  await getDoc(paymentRef);

                if (paymentSnap.exists())
                  paymentState =
                    paymentSnap.data();

              } catch (error) {

                console.error(
                  "Payment state error:",
                  error
                );

              }

            }

            return {

              id: item.id,
              data: item.data(),
              playerState,
              paymentState

            };

          }
        )

      );

    box.innerHTML = "";

    competitions.forEach(item => {

      box.appendChild(
        createCompetitionCard(
          item.id,
          item.data,
          item.playerState,
          item.paymentState
        )
      );

    });

  } catch (error) {

    console.error(
      "Competition error:",
      error
    );

    box.innerHTML = `
      <div class="empty">

        <div>⚠️</div>

        <h3>
          Unable to load competitions
        </h3>

        <p>
          ${escapeHTML(
            error.message ||
            "Please try again later."
          )}
        </p>

      </div>
    `;

  }

}


/* =====================================================
   COMPETITION CARD
===================================================== */

function createCompetitionCard(
  competitionId,
  data,
  playerState = null,
  paymentState = null
) {

  const card =
    document.createElement("article");

  card.className =
    "competition-card";

  const type =
    escapeHTML(
      data.type || "Competition"
    );

  const name =
    escapeHTML(
      data.name ||
      "HASTAN COMPETITION"
    );

  const entry =
    money(data.entryFee);

  const maxPlayers =
    Number(data.maxPlayers || 0);

  const playerCount =
    Number(data.playersCount || 0);

  const first =
    money(data.firstPrize);

  const second =
    money(data.secondPrize);

  const third =
    money(data.thirdPrize);

  const joiningOpen =
    data.joiningOpen === true;

  const paymentOpen =
    data.paymentOpen === true;

  const isFull =
    maxPlayers > 0 &&
    playerCount >= maxPlayers;

  const hasJoined =
    !!playerState &&
    (
      playerState.status === "joined" ||
      playerState.status === "pending"
    );

  let paymentStatus =
    playerState?.paymentStatus ||
    "unpaid";

  if (
    paymentState?.status === "pending"
  )
    paymentStatus = "pending";

  if (
    paymentState?.status === "approved"
  )
    paymentStatus = "approved";

  let buttonHTML = "";

  if (
    hasJoined &&
    paymentStatus === "approved"
  ) {

    buttonHTML = `
      <button
        type="button"
        class="join-btn"
        disabled
        style="
          opacity:.85;
          background:#16c172;
          color:#06110d;
        "
      >
        ✓ PAID
      </button>
    `;

  } else if (
    hasJoined &&
    paymentStatus === "pending"
  ) {

    buttonHTML = `
      <button
        type="button"
        class="join-btn"
        disabled
        style="opacity:.65"
      >
        PAYMENT PENDING
      </button>
    `;

  } else if (
    hasJoined &&
    paymentStatus === "unpaid"
  ) {

    buttonHTML = `
      <button
        type="button"
        class="join-btn pay-entry-btn"
        data-payment-id="${escapeHTML(
          competitionId
        )}"
      >
        💳 PAY FROM BALANCE
      </button>

      <div style="
        margin-top:7px;
        color:#ffd75a;
        font-size:10px;
        text-align:center;
      ">
        If balance is insufficient,
        Deposit will be required.
      </div>
    `;

  } else if (
    !hasJoined &&
    joiningOpen &&
    !isFull
  ) {

    buttonHTML = `
      <button
        type="button"
        class="join-btn"
        data-competition-id="${escapeHTML(
          competitionId
        )}"
      >
        JOIN NOW
      </button>
    `;

  } else if (
    !hasJoined &&
    joiningOpen &&
    isFull
  ) {

    buttonHTML = `
      <button
        type="button"
        class="join-btn"
        disabled
        style="opacity:.45"
      >
        COMPETITION FULL
      </button>
    `;

  } else {

    buttonHTML = `
      <button
        type="button"
        class="join-btn"
        disabled
        style="opacity:.45"
      >
        JOINING CLOSED
      </button>
    `;

  }

  card.innerHTML = `

    <span class="competition-type">
      ${type}
    </span>

    <h3>
      🏆 ${name}
    </h3>

    <div class="competition-meta">

      <div class="meta-item">
        <span>ENTRY FEE</span>
        <strong>TSh ${entry}</strong>
      </div>

      <div class="meta-item">
        <span>PLAYERS</span>
        <strong>
          ${playerCount}/${maxPlayers}
        </strong>
      </div>

    </div>

    <div class="prizes">

      <div class="prize">
        <span>🥇</span>
        <small>1ST</small>
        <strong>TSh ${first}</strong>
      </div>

      <div class="prize">
        <span>🥈</span>
        <small>2ND</small>
        <strong>TSh ${second}</strong>
      </div>

      <div class="prize">
        <span>🥉</span>
        <small>3RD</small>
        <strong>TSh ${third}</strong>
      </div>

    </div>

    <div style="
      margin-top:12px;
      color:#91ad9f;
      font-size:12px;
      line-height:1.6;
    ">

      <strong style="color:#f3fff8;">
        START:
      </strong>

      ${escapeHTML(
        formatDate(data.startAt)
      )}

    </div>

    <div style="
      margin-top:7px;
      color:#91ad9f;
      font-size:11px;
    ">

      JOINING:

      <strong style="
        color:${
          joiningOpen
            ? "#16c172"
            : "#91ad9f"
        };
      ">

        ${
          joiningOpen
            ? "OPEN"
            : "CLOSED"
        }

      </strong>

    </div>

    <div style="
      margin-top:7px;
      color:#91ad9f;
      font-size:11px;
    ">

      PAYMENT:

      <strong style="
        color:#16c172;
      ">
        BALANCE / DEPOSIT
      </strong>

    </div>

    ${
      hasJoined
        ? `
          <div style="
            margin-top:9px;
            color:#16c172;
            font-size:11px;
            font-weight:700;
          ">
            YOU ARE JOINED
          </div>
        `
        : ""
    }

    ${
      data.rules
        ? `
          <p style="
            margin-top:8px;
            color:#91ad9f;
            font-size:12px;
            line-height:1.6;
          ">
            ${escapeHTML(data.rules)}
          </p>
        `
        : ""
    }

    ${buttonHTML}

  `;

  const joinButton =
    card.querySelector(
      ".join-btn[data-competition-id]"
    );

  if (joinButton) {

    joinButton.addEventListener(
      "click",
      () =>
        joinCompetition(
          competitionId,
          data
        )
    );

  }

  const payButton =
    card.querySelector(
      ".pay-entry-btn[data-payment-id]"
    );

  if (payButton) {

    payButton.addEventListener(
      "click",
      () =>
        payCompetitionFromBalance(
          competitionId,
          data
        )
    );

  }

  return card;

}


/* =====================================================
   JOIN COMPETITION
   COMPETITION PAYMENT FLOW
===================================================== */

async function joinCompetition(
  competitionId,
  competition
) {

  if (!currentUser) {

    $("loginOverlay")
      ?.classList.remove("hidden");

    return;

  }

  if (
    competition.joiningOpen !== true
  ) {

    alert(
      "Joining is currently closed."
    );

    await loadCompetitions();

    return;

  }

  const maxPlayers =
    Number(
      competition.maxPlayers || 0
    );

  const playersCount =
    Number(
      competition.playersCount || 0
    );

  if (
    maxPlayers > 0 &&
    playersCount >= maxPlayers
  ) {

    alert(
      "This competition is full."
    );

    await loadCompetitions();

    return;

  }

  const entryFee =
    Number(
      competition.entryFee || 0
    );

  if (
    !Number.isFinite(entryFee) ||
    entryFee <= 0
  ) {

    alert(
      "Invalid competition entry fee."
    );

    return;

  }

  const joinId =
    `${competitionId}_${currentUser.uid}`;

  const joinRef =
    doc(
      db,
      "gameCompetitionPlayers",
      joinId
    );

  try {

    /*
      Check existing registration.
    */

    const existing =
      await getDoc(joinRef);

    if (existing.exists()) {

      const old =
        existing.data();

      if (
        old.paymentStatus === "approved"
      ) {

        alert(
          "You are already paid for this competition."
        );

        await loadCompetitions();

        return;

      }

      if (
        old.paymentStatus === "pending"
      ) {

        alert(
          "Your competition payment is already pending Admin verification."
        );

        await loadCompetitions();

        return;

      }

      /*
        If player already joined but has not
        completed payment, open competition
        payment modal.
      */

      if (
        old.status === "joined" ||
        old.status === "pending" ||
        old.paymentStatus === "unpaid"
      ) {

        showCompetitionPayment(
          competitionId,
          competition
        );

        return;

      }

    }

    /*
      Get player information.
    */

    const userSnap =
      await getDoc(
        doc(
          db,
          "users",
          currentUser.uid
        )
      );

    const userData =
      userSnap.exists()
        ? userSnap.data()
        : {};

    const username =
      userData.username ||
      currentUser.email ||
      currentUser.uid;

    const playerName =
      userData.name ||
      userData.fullName ||
      userData.displayName ||
      currentUser.displayName ||
      "Player";

    /*
      Register player as JOINED + UNPAID.

      IMPORTANT:
      No Gamer Balance is touched here.
      No Deposit form is opened here.
    */

    await setDoc(
      joinRef,
      {

        competitionId,

        userId:
          currentUser.uid,

        username,

        playerName,

        competitionName:
          competition.name ||
          "HASTAN COMPETITION",

        competitionType:
          competition.type ||
          "Competition",

        entryFee,

        paymentStatus:
          "unpaid",

        paymentMethod:
          "manual_competition_payment",

        status:
          "joined",

        joinedAt:
          serverTimestamp()

      }
    );

    /*
      Open the correct competition payment form.
    */

    showCompetitionPayment(
      competitionId,
      competition
    );

    await loadCompetitions();

  } catch (error) {

    console.error(
      "Join competition error:",
      error
    );

    alert(
      getFirestoreErrorMessage(error)
    );

  }

}


/* =====================================================
   PAY COMPETITION FROM GAMER BALANCE
===================================================== */

async function payCompetitionFromBalance(
  competitionId,
  competition
) {

  if (!currentUser) {

    $("loginOverlay")
      ?.classList.remove("hidden");

    return;

  }

  const entryFee =
    Number(
      competition.entryFee || 0
    );

  if (
    !Number.isFinite(entryFee) ||
    entryFee <= 0
  ) {

    alert(
      "Invalid competition entry fee."
    );

    return;

  }

  const joinRef =
    doc(
      db,
      "gameCompetitionPlayers",
      `${competitionId}_${currentUser.uid}`
    );

  const userRef =
    doc(
      db,
      "users",
      currentUser.uid
    );

  try {

    let balanceAfter = 0;

    await runTransaction(
      db,
      async transaction => {

        const userSnap =
          await transaction.get(userRef);

        const joinSnap =
          await transaction.get(joinRef);

        if (!userSnap.exists()) {

          throw new Error(
            "Player account not found."
          );

        }

        if (!joinSnap.exists()) {

          throw new Error(
            "Competition registration not found."
          );

        }

        const joinData =
          joinSnap.data();

        if (
          joinData.paymentStatus ===
          "approved"
        ) {

          throw new Error(
            "This competition is already paid."
          );

        }

        if (
          joinData.paymentStatus ===
          "pending"
        ) {

          throw new Error(
            "Your payment is already pending."
          );

        }

        const userData =
          userSnap.data();

        const currentBalance =
          Number(
            userData.gamerBalance || 0
          );

        if (
          currentBalance < entryFee
        ) {

          throw new Error(
            `INSUFFICIENT_BALANCE:${currentBalance}`
          );

        }

        balanceAfter =
          currentBalance - entryFee;

        transaction.update(
          userRef,
          {

            gamerBalance:
              balanceAfter

          }
        );

        transaction.update(
          joinRef,
          {

            paymentStatus:
              "approved",

            paymentMethod:
              "gamer_balance",

            paidAt:
              serverTimestamp(),

            balanceBefore:
              currentBalance,

            balanceAfter

          }
        );

        const historyRef =
          doc(
            collection(
              db,
              "gameHistory"
            )
          );

        transaction.set(
          historyRef,
          {

            uid:
              currentUser.uid,

            userId:
              currentUser.uid,

            type:
              "competition_entry",

            title:
              "Competition Entry",

            status:
              "paid",

            amount:
              entryFee,

            competitionId,

            competitionName:
              competition.name ||
              "HASTAN COMPETITION",

            competitionType:
              competition.type ||
              "Competition",

            paymentMethod:
              "gamer_balance",

            balanceBefore:
              currentBalance,

            balanceAfter,

            createdAt:
              serverTimestamp()

          }
        );

      }
    );

    await refreshPlayerBalance();

    alert(
      `Entry fee paid successfully.\n\n` +
      `TSh ${money(entryFee)} deducted from Gamer Balance.\n` +
      `Remaining Balance: TSh ${money(balanceAfter)}`
    );

    await loadCompetitions();

  } catch (error) {

    console.error(
      "Pay competition from balance error:",
      error
    );

    const errorMessage =
      String(
        error?.message || ""
      );

    if (
      errorMessage.startsWith(
        "INSUFFICIENT_BALANCE:"
      )
    ) {

      const balance =
        Number(
          errorMessage.split(":")[1] || 0
        );

      alert(
        `Gamer Balance is insufficient.\n\n` +
        `Entry Fee: TSh ${money(entryFee)}\n` +
        `Available: TSh ${money(balance)}\n\n` +
        `Please deposit money first.`
      );

      showGameDepositForm();

      return;

    }

    alert(
      getFirestoreErrorMessage(error)
    );

  }

}


/* =====================================================
   COMPETITION PAYMENT MODAL
===================================================== */

function showCompetitionPayment(
  competitionId,
  competition
) {

  const old =
    $("competitionPaymentForm");

  if (old) {

    old.remove();

    return;

  }

  const entryFee =
    Number(
      competition.entryFee || 0
    );

  const box =
    document.createElement("div");

  box.id =
    "competitionPaymentForm";

  box.innerHTML = `

    <div style="
      position:fixed;
      inset:0;
      background:rgba(0,0,0,.82);
      z-index:99999;
      display:flex;
      align-items:center;
      justify-content:center;
      padding:20px;
      overflow-y:auto;
    ">

      <div style="
        width:100%;
        max-width:420px;
        background:#0d2118;
        border:1px solid #1d4934;
        border-radius:20px;
        padding:22px;
        color:#f3fff8;
        box-sizing:border-box;
      ">

        <div style="
          text-align:center;
          font-size:36px;
          margin-bottom:6px;
        ">
          🏆
        </div>

        <h2 style="
          margin:0;
          text-align:center;
          font-size:21px;
        ">
          COMPETITION PAYMENT
        </h2>

        <p style="
          text-align:center;
          color:#91ad9f;
          font-size:12px;
          line-height:1.5;
          margin:7px 0 18px;
        ">
          ${escapeHTML(
            competition.name ||
            "HASTAN COMPETITION"
          )}
        </p>

        <div style="
          background:#10291f;
          border:1px solid #1d4934;
          border-radius:14px;
          padding:15px;
          margin-bottom:15px;
        ">

          <div style="
            color:#91ad9f;
            font-size:10px;
          ">
            ENTRY FEE
          </div>

          <strong style="
            display:block;
            margin-top:5px;
            font-size:25px;
            color:#16c172;
          ">
            TSh ${money(entryFee)}
          </strong>

        </div>

        <div style="
          background:#10291f;
          border:1px solid #1d4934;
          border-radius:14px;
          padding:14px;
          margin-bottom:15px;
        ">

          <div style="
            color:#91ad9f;
            font-size:10px;
            margin-bottom:5px;
          ">
            PAYMENT METHOD
          </div>

          <strong>
            VODACOM LIPA
          </strong>

          <div style="
            margin-top:8px;
            color:#16c172;
            font-size:11px;
          ">
            LIPA HASTAN GLOBE
          </div>

          <div style="
            margin-top:4px;
            font-size:21px;
            font-weight:800;
            letter-spacing:1px;
          ">
            356574572
          </div>

        </div>

        <label style="
          display:block;
          color:#91ad9f;
          font-size:10px;
          margin-bottom:6px;
        ">
          AMOUNT
        </label>

        <input
          id="competitionPaymentAmount"
          type="number"
          value="${entryFee}"
          readonly
          style="
            width:100%;
            box-sizing:border-box;
            margin-bottom:12px;
            padding:13px;
            border-radius:10px;
            border:1px solid #1d4934;
            background:#06110d;
            color:#16c172;
            font-size:16px;
            font-weight:800;
          "
        >

        <label style="
          display:block;
          color:#91ad9f;
          font-size:10px;
          margin-bottom:6px;
        ">
          TRANSACTION ID
        </label>

        <input
          id="competitionTransactionId"
          type="text"
          placeholder="Enter payment transaction ID"
          autocomplete="off"
          style="
            width:100%;
            box-sizing:border-box;
            margin-bottom:14px;
            padding:13px;
            border-radius:10px;
            border:1px solid #1d4934;
            background:#06110d;
            color:#f3fff8;
            outline:none;
          "
        >

        <div
          id="competitionPaymentMessage"
          style="
            margin-top:8px;
            color:#91ad9f;
            font-size:12px;
            line-height:1.5;
          "
        ></div>

        <button
          type="button"
          id="submitCompetitionPayment"
          style="
            width:100%;
            padding:14px;
            border:0;
            border-radius:12px;
            background:#16c172;
            color:#06110d;
            font-weight:900;
            cursor:pointer;
          "
        >
          SUBMIT COMPETITION PAYMENT
        </button>

        <button
          type="button"
          id="closeCompetitionPayment"
          style="
            width:100%;
            padding:12px;
            margin-top:8px;
            border:1px solid #1d4934;
            border-radius:12px;
            background:transparent;
            color:#91ad9f;
            cursor:pointer;
          "
        >
          CANCEL
        </button>

      </div>

    </div>

  `;

  document.body.appendChild(box);

  $("submitCompetitionPayment")
    ?.addEventListener(
      "click",
      () =>
        submitCompetitionPayment(
          competitionId,
          competition
        )
    );

  $("closeCompetitionPayment")
    ?.addEventListener(
      "click",
      () => box.remove()
    );

}


/* =====================================================
   SUBMIT COMPETITION PAYMENT
===================================================== */

async function submitCompetitionPayment(
  competitionId,
  competition
) {

  if (!currentUser)
    return;

  const amountEl =
    $("competitionPaymentAmount");

  const transactionEl =
    $("competitionTransactionId");

  const messageEl =
    $("competitionPaymentMessage");

  const button =
    $("submitCompetitionPayment");

  const entryFee =
    Number(
      competition.entryFee || 0
    );

  const amount =
    Number(
      amountEl?.value || 0
    );

  const transactionId =
    transactionEl?.value?.trim() || "";

  if (
    !Number.isFinite(entryFee) ||
    entryFee <= 0
  ) {

    if (messageEl)
      messageEl.innerHTML = `
        <span style="color:#ff7070;">
          Invalid competition entry fee.
        </span>
      `;

    return;

  }

  /*
    Amount must exactly match competition
    entry fee.
  */

  if (
    amount !== entryFee
  ) {

    if (messageEl)
      messageEl.innerHTML = `
        <span style="color:#ff7070;">
          Payment amount must be TSh ${money(entryFee)}.
        </span>
      `;

    return;

  }

  if (!transactionId) {

    if (messageEl)
      messageEl.innerHTML = `
        <span style="color:#ff7070;">
          Enter the transaction ID.
        </span>
      `;

    return;

  }

  const paymentId =
    `${competitionId}_${currentUser.uid}`;

  const paymentRef =
    doc(
      db,
      "gameCompetitionPayments",
      paymentId
    );

  const playerRef =
    doc(
      db,
      "gameCompetitionPlayers",
      paymentId
    );

  try {

    if (button) {

      button.disabled = true;

      button.textContent =
        "SUBMITTING...";

    }

    if (messageEl)
      messageEl.innerHTML = `
        <span style="color:#91ad9f;">
          Submitting competition payment...
        </span>
      `;

    /*
      Check existing payment first.
    */

    const existingPayment =
      await getDoc(paymentRef);

    if (
      existingPayment.exists()
    ) {

      const old =
        existingPayment.data();

      if (
        old.status === "approved"
      ) {

        if (messageEl)
          messageEl.innerHTML = `
            <span style="color:#16c172;">
              ✓ This competition is already paid.
            </span>
          `;

        return;

      }

      if (
        old.status === "pending"
      ) {

        if (messageEl)
          messageEl.innerHTML = `
            <span style="color:#ffd75a;">
              Your payment is already pending Admin verification.
            </span>
          `;

        return;

      }

    }

    /*
      Get player details.
    */

    const userSnap =
      await getDoc(
        doc(
          db,
          "users",
          currentUser.uid
        )
      );

    const userData =
      userSnap.exists()
        ? userSnap.data()
        : {};

    const username =
      userData.username ||
      currentUser.email ||
      currentUser.uid;

    const playerName =
      userData.name ||
      userData.fullName ||
      userData.displayName ||
      currentUser.displayName ||
      "Player";

    /*
      Create separate competition payment.

      IMPORTANT:
      This does NOT touch gamerBalance.
      This does NOT create gameDeposits.
    */

    await setDoc(
      paymentRef,
      {

        paymentId,

        competitionId,

        userId:
          currentUser.uid,

        uid:
          currentUser.uid,

        username,

        playerName,

        competitionName:
          competition.name ||
          "HASTAN COMPETITION",

        competitionType:
          competition.type ||
          "Competition",

        amount,

        entryFee,

        transactionId,

        paymentNumber:
          "356574572",

        merchantName:
          "LIPA HASTAN GLOBE",

        paymentMethod:
          "vodacom_lipa",

        status:
          "pending",

        createdAt:
          serverTimestamp(),

        submittedAt:
          serverTimestamp()

      }
    );

    /*
      Update player's competition record.

      Still NO Gamer Balance deduction.
    */

    await setDoc(
      playerRef,
      {

        competitionId,

        userId:
          currentUser.uid,

        username,

        playerName,

        competitionName:
          competition.name ||
          "HASTAN COMPETITION",

        competitionType:
          competition.type ||
          "Competition",

        entryFee,

        paymentStatus:
          "pending",

        paymentMethod:
          "manual_competition_payment",

        competitionPaymentId:
          paymentId,

        status:
          "joined",

        paymentTransactionId:
          transactionId,

        paymentSubmittedAt:
          serverTimestamp(),

        joinedAt:
          serverTimestamp()

      },
      {
        merge: true
      }
    );

    /*
      Save competition payment in game history.
      This is history only; it does not affect balance.
    */

    const historyRef =
      doc(
        collection(
          db,
          "gameHistory"
        )
      );

    await setDoc(
      historyRef,
      {

        uid:
          currentUser.uid,

        userId:
          currentUser.uid,

        type:
          "competition_payment",

        title:
          "Competition Payment",

        status:
          "pending",

        amount,

        competitionId,

        competitionName:
          competition.name ||
          "HASTAN COMPETITION",

        competitionType:
          competition.type ||
          "Competition",

        paymentMethod:
          "vodacom_lipa",

        transactionId,

        createdAt:
          serverTimestamp()

      }
    );

    if (messageEl)
      messageEl.innerHTML = `
        <span style="
          color:#16c172;
          font-weight:800;
        ">
          ✓ Competition payment submitted.
        </span>

        <br>

        <span style="
          color:#91ad9f;
          font-size:11px;
        ">
          Waiting for Admin verification.
        </span>
      `;

    await loadCompetitions();

    setTimeout(
      () => {

        $("competitionPaymentForm")
          ?.remove();

      },
      1200
    );

  } catch (error) {

    console.error(
      "Competition payment error:",
      error
    );

    if (messageEl)
      messageEl.innerHTML = `
        <span style="color:#ff7070;">
          ${escapeHTML(
            getFirestoreErrorMessage(error)
          )}
        </span>
      `;

    if (button) {

      button.disabled = false;

      button.textContent =
        "SUBMIT COMPETITION PAYMENT";

    }

  }

}


/* =====================================================
   MY MATCHES
===================================================== */

async function loadMyMatches() {

  const box =
    $("myMatches");

  if (!box) return;

  if (!currentUser) {

    box.innerHTML = `
      <div class="empty">

        <div>🔐</div>

        <h3>Please Login</h3>

      </div>
    `;

    return;

  }

  box.innerHTML = `
    <div class="loading">
      Loading your matches...
    </div>
  `;

  try {

    const matchesRef =
      collection(
        db,
        "gameMatches"
      );

    const homeQuery =
      query(
        matchesRef,
        where(
          "homePlayerId",
          "==",
          currentUser.uid
        )
      );

    const awayQuery =
      query(
        matchesRef,
        where(
          "awayPlayerId",
          "==",
          currentUser.uid
        )
      );

    const [
      homeSnapshot,
      awaySnapshot
    ] =
      await Promise.all([
        getDocs(homeQuery),
        getDocs(awayQuery)
      ]);

    const matchMap =
      new Map();

    homeSnapshot.forEach(item =>
      matchMap.set(item.id, item)
    );

    awaySnapshot.forEach(item =>
      matchMap.set(item.id, item)
    );

    const matches =
      Array.from(
        matchMap.values()
      );

    matches.sort(
      (a, b) => {

        const aData = a.data();
        const bData = b.data();

        const aTime =
          aData?.createdAt?.toMillis
            ? aData.createdAt.toMillis()
            : 0;

        const bTime =
          bData?.createdAt?.toMillis
            ? bData.createdAt.toMillis()
            : 0;

        return bTime - aTime;

      }
    );

    if (!matches.length) {

      box.innerHTML = `
        <div class="empty">

          <div>⚽</div>

          <h3>No Matches Yet</h3>

          <p>
            Fixtures will appear here after
            Admin generates them.
          </p>

        </div>
      `;

      return;

    }

    box.innerHTML = "";

    matches.forEach(item => {

      box.appendChild(
        createMatchCard(
          item.id,
          item.data()
        )
      );

    });

  } catch (error) {

    console.error(
      "My matches error:",
      error
    );

    box.innerHTML = `
      <div class="empty">

        <div>⚠️</div>

        <h3>
          Unable to load matches
        </h3>

        <p>
          ${escapeHTML(
            error.message ||
            "Please try again later."
          )}
        </p>

      </div>
    `;

  }

}


/* =====================================================
   MATCH CARD
===================================================== */

function createMatchCard(
  matchId,
  data
) {

  const card =
    document.createElement("article");

  card.className =
    "competition-card";

  const isHome =
    data.homePlayerId ===
    currentUser.uid;

  const opponentName =
    isHome
      ? (
          data.awayPlayerName ||
          data.awayUsername ||
          "Opponent"
        )
      : (
          data.homePlayerName ||
          data.homeUsername ||
          "Opponent"
        );

  const opponentUsername =
    isHome
      ? data.awayUsername || ""
      : data.homeUsername || "";

  const myScore =
    isHome
      ? data.homeScore
      : data.awayScore;

  const opponentScore =
    isHome
      ? data.awayScore
      : data.homeScore;

  const resultStatus =
    data.resultStatus ||
    "not_submitted";

  let statusHTML = "";
  let buttonHTML = "";

  if (
    resultStatus === "not_submitted"
  ) {

    statusHTML = `
      <div style="
        margin-top:12px;
        padding:10px;
        border-radius:10px;
        background:#10291f;
        color:#f3fff8;
        font-size:12px;
      ">
        🟡 MATCH PENDING
      </div>
    `;

    buttonHTML = `
      <button
        type="button"
        class="join-btn"
        style="
          width:100%;
          margin-top:12px;
        "
        data-submit-result="${escapeHTML(
          matchId
        )}"
      >
        📷 SUBMIT RESULT
      </button>
    `;

  } else if (
    resultStatus === "pending"
  ) {

    statusHTML = `
      <div style="
        margin-top:12px;
        padding:11px;
        border-radius:10px;
        background:rgba(255,193,7,.08);
        border:1px solid rgba(255,193,7,.25);
        color:#ffd75a;
        font-size:12px;
        line-height:1.5;
      ">
        ⏳ RESULT SUBMITTED
        <br>
        <span style="color:#91ad9f;">
          Waiting for Admin verification.
        </span>
      </div>
    `;

  } else if (
    resultStatus === "verified"
  ) {

    statusHTML = `
      <div style="
        margin-top:12px;
        padding:11px;
        border-radius:10px;
        background:rgba(22,193,114,.08);
        border:1px solid rgba(22,193,114,.25);
        color:#16c172;
        font-size:12px;
      ">
        ✓ RESULT VERIFIED
      </div>
    `;

  } else if (
    resultStatus === "rejected"
  ) {

    statusHTML = `
      <div style="
        margin-top:12px;
        padding:11px;
        border-radius:10px;
        background:rgba(255,70,70,.08);
        border:1px solid rgba(255,70,70,.25);
        color:#ff7070;
        font-size:12px;
        line-height:1.5;
      ">
        ❌ RESULT REJECTED
        <br>
        <span style="color:#91ad9f;">
          Please submit the correct result again.
        </span>
      </div>
    `;

    buttonHTML = `
      <button
        type="button"
        class="join-btn"
        style="
          width:100%;
          margin-top:12px;
        "
        data-submit-result="${escapeHTML(
          matchId
        )}"
      >
        📷 SUBMIT AGAIN
      </button>
    `;

  }

  const scoreHTML =
    myScore !== null &&
    myScore !== undefined &&
    opponentScore !== null &&
    opponentScore !== undefined
      ? `
        <div style="
          text-align:center;
          margin-top:16px;
          padding:14px;
          background:#06110d;
          border-radius:14px;
          border:1px solid #1d4934;
        ">

          <div style="
            color:#91ad9f;
            font-size:10px;
            margin-bottom:5px;
          ">
            RESULT
          </div>

          <strong style="
            font-size:30px;
            letter-spacing:2px;
          ">
            ${escapeHTML(myScore)}
            -
            ${escapeHTML(opponentScore)}
          </strong>

        </div>
      `
      : "";

  card.innerHTML = `

    <span class="competition-type">
      ${escapeHTML(
        data.competitionType ||
        "MATCH"
      )}
    </span>

    <h3 style="margin-bottom:4px;">
      ⚽ ${escapeHTML(
        data.competitionName ||
        "HASTAN MATCH"
      )}
    </h3>

    <div style="
      color:#91ad9f;
      font-size:11px;
      margin-top:4px;
    ">
      ROUND:

      <strong style="color:#f3fff8;">
        ${escapeHTML(
          data.round || "Match"
        )}
      </strong>
    </div>

    <div style="
      margin-top:15px;
      padding:14px;
      border-radius:14px;
      background:#10291f;
    ">

      <div style="
        color:#91ad9f;
        font-size:10px;
        margin-bottom:7px;
      ">
        YOUR OPPONENT
      </div>

      <strong style="
        display:block;
        font-size:17px;
        color:#f3fff8;
      ">
        ${escapeHTML(opponentName)}
      </strong>

      ${
        opponentUsername
          ? `
            <span style="
              display:block;
              margin-top:4px;
              color:#16c172;
              font-size:11px;
            ">
              @${escapeHTML(
                String(
                  opponentUsername
                ).replace(/^@/, "")
              )}
            </span>
          `
          : ""
      }

    </div>

    ${scoreHTML}

    ${statusHTML}

    ${buttonHTML}

  `;

  const submitButton =
    card.querySelector(
      "[data-submit-result]"
    );

  if (submitButton) {

    submitButton.addEventListener(
      "click",
      () =>
        openSubmitResultModal(
          matchId,
          data
        )
    );

  }
  addMatchChatButton(
  card,
  matchId,
  data
);

  return card;

}

/* =====================================================
   HASTAN MATCH PRIVATE CHAT
   PLAYER VS PLAYER ONLY
===================================================== */

let activeChatUnsubscribe = null;


/* =====================================================
   GET ROOM CODE
===================================================== */

function getMatchRoomCode(match) {

  return (
    match.roomCode ||
    match.matchCode ||
    match.roomMatchCode ||
    match.gameRoomCode ||
    match.room ||
    "Not available"
  );

}


/* =====================================================
   GET ROOM PASSWORD
===================================================== */

function getMatchRoomPassword(match) {

  return (
    match.roomPassword ||
    match.matchPassword ||
    match.password ||
    match.gamePassword ||
    "Not available"
  );

}


/* =====================================================
   CHAT STATUS
===================================================== */

function isChatLocked(match) {

  return (
    match?.resultStatus === "pending" ||
    match?.resultStatus === "verified"
  );

}


/* =====================================================
   ADD CHAT BUTTON
===================================================== */

function addMatchChatButton(
  card,
  matchId,
  match
) {

  if (!card || !matchId || !match)
    return;

  if (
    card.querySelector(
      "[data-open-match-chat]"
    )
  )
    return;

  const locked =
    isChatLocked(match);

  const button =
    document.createElement("button");

  button.type = "button";

  button.setAttribute(
    "data-open-match-chat",
    matchId
  );

  button.className = "join-btn";

  button.style.cssText = `
    width:100%;
    margin-top:10px;
    ${
      locked
        ? `
          opacity:.55;
          background:#10291f;
          color:#91ad9f;
          border:1px solid #1d4934;
        `
        : ""
    }
  `;

  button.innerHTML =
    locked
      ? "🔒 MATCH CHAT CLOSED"
      : "💬 PRIVATE MATCH CHAT";

  button.addEventListener(
    "click",
    () => {

      if (isChatLocked(match)) {

        alert(
          "Match chat is closed because the result has already been submitted."
        );

        return;

      }

      openMatchChat(
        matchId,
        match
      );

    }
  );

  card.appendChild(button);

}

/* =====================================================
   OPEN MATCH CHAT
===================================================== */

function openMatchChat(
  matchId,
  match
) {

  if (!currentUser)
    return;

  const isHome =
    match.homePlayerId === currentUser.uid;

  const isAway =
    match.awayPlayerId === currentUser.uid;

  if (!isHome && !isAway) {

    alert(
      "You are not a player in this match."
    );

    return;
  }

  if (isChatLocked(match)) {

    alert(
      "Match chat is closed."
    );

    return;
  }

  const opponentId =
    isHome
      ? match.awayPlayerId
      : match.homePlayerId;

  if (!opponentId) {

    alert(
      "Opponent information is not available."
    );

    return;
  }

  const opponentName =
    isHome
      ? (
          match.awayPlayerName ||
          match.awayUsername ||
          "Opponent"
        )
      : (
          match.homePlayerName ||
          match.homeUsername ||
          "Opponent"
        );

  const opponentUsername =
    isHome
      ? match.awayUsername || ""
      : match.homeUsername || "";

  const roomCode =
    getMatchRoomCode(match);

  const roomPassword =
    getMatchRoomPassword(match);

  $("matchChatModal")?.remove();

  const modal =
    document.createElement("div");

  modal.id =
    "matchChatModal";

  modal.style.cssText = `
    position:fixed;
    inset:0;
    z-index:100000;
    background:rgba(0,0,0,.88);
    display:flex;
    align-items:center;
    justify-content:center;
    padding:15px;
    box-sizing:border-box;
  `;

  modal.innerHTML = `

    <div style="
      width:100%;
      max-width:440px;
      height:min(680px,92vh);
      background:#0d2118;
      border:1px solid #1d4934;
      border-radius:20px;
      overflow:hidden;
      display:flex;
      flex-direction:column;
      color:#f3fff8;
      box-shadow:0 20px 70px rgba(0,0,0,.7);
    ">

      <div style="
        padding:15px;
        border-bottom:1px solid #1d4934;
        background:#10291f;
        flex-shrink:0;
      ">

        <div style="
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:10px;
        ">

          <div>

            <div style="
              color:#16c172;
              font-size:9px;
              font-weight:800;
              letter-spacing:1px;
            ">
              PRIVATE MATCH CHAT
            </div>

            <strong style="
              display:block;
              margin-top:3px;
              font-size:17px;
            ">
              ⚽ ${escapeHTML(opponentName)}
            </strong>

            ${
              opponentUsername
                ? `
                  <span style="
                    color:#91ad9f;
                    font-size:10px;
                  ">
                    @${escapeHTML(
                      String(
                        opponentUsername
                      ).replace(/^@/, "")
                    )}
                  </span>
                `
                : ""
            }

          </div>

          <button
            type="button"
            id="closeMatchChat"
            style="
              width:36px;
              height:36px;
              border:1px solid #1d4934;
              border-radius:10px;
              background:#06110d;
              color:#f3fff8;
              font-size:18px;
            "
          >
            ×
          </button>

        </div>


        <div style="
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:8px;
          margin-top:12px;
        ">

          <div style="
            background:#06110d;
            border:1px solid #1d4934;
            border-radius:10px;
            padding:9px;
          ">

            <span style="
              display:block;
              color:#91ad9f;
              font-size:8px;
              margin-bottom:4px;
            ">
              ROOM MATCH CODE
            </span>

            <strong
              style="
                display:block;
                font-size:12px;
                word-break:break-all;
              "
            >
              ${escapeHTML(roomCode)}
            </strong>

            <button
              type="button"
              id="copyMatchRoomCode"
              style="
                margin-top:6px;
                width:100%;
                padding:6px;
                border:1px solid #1d4934;
                border-radius:7px;
                background:#10291f;
                color:#16c172;
                font-size:9px;
                font-weight:800;
              "
            >
              📋 COPY
            </button>

          </div>


          <div style="
            background:#06110d;
            border:1px solid #1d4934;
            border-radius:10px;
            padding:9px;
          ">

            <span style="
              display:block;
              color:#91ad9f;
              font-size:8px;
              margin-bottom:4px;
            ">
              MATCH PASSWORD
            </span>

            <strong
              style="
                display:block;
                font-size:12px;
                word-break:break-all;
              "
            >
              ${escapeHTML(roomPassword)}
            </strong>

            <button
              type="button"
              id="copyMatchRoomPassword"
              style="
                margin-top:6px;
                width:100%;
                padding:6px;
                border:1px solid #1d4934;
                border-radius:7px;
                background:#10291f;
                color:#16c172;
                font-size:9px;
                font-weight:800;
              "
            >
              📋 COPY
            </button>

          </div>

        </div>

      </div>


      <div
        id="matchChatMessages"
        style="
          flex:1;
          overflow-y:auto;
          padding:14px;
          background:#06110d;
        "
      >

        <div style="
          text-align:center;
          color:#91ad9f;
          font-size:11px;
          padding:25px 10px;
        ">
          Loading chat...
        </div>

      </div>


      <div style="
        padding:10px;
        border-top:1px solid #1d4934;
        background:#10291f;
        flex-shrink:0;
      ">

        <div style="
          display:flex;
          gap:8px;
          align-items:flex-end;
        ">

          <textarea
            id="matchChatInput"
            rows="1"
            maxlength="500"
            placeholder="Type your message..."
            style="
              flex:1;
              min-width:0;
              resize:none;
              box-sizing:border-box;
              padding:11px;
              border-radius:11px;
              border:1px solid #1d4934;
              background:#06110d;
              color:#f3fff8;
              outline:none;
              font-size:12px;
              line-height:1.4;
            "
          ></textarea>

          <button
            type="button"
            id="sendMatchChat"
            style="
              width:48px;
              height:42px;
              border:0;
              border-radius:11px;
              background:#16c172;
              color:#06110d;
              font-size:17px;
              font-weight:900;
            "
          >
            ➤
          </button>

        </div>

        <div style="
          margin-top:5px;
          color:#607c6d;
          font-size:8px;
          text-align:right;
        ">
          Maximum 500 characters
        </div>

      </div>

    </div>

  `;

  document.body.appendChild(modal);


  $("closeMatchChat")
    ?.addEventListener(
      "click",
      closeMatchChat
    );


  $("copyMatchRoomCode")
    ?.addEventListener(
      "click",
      async () => {

        await copyChatValue(
          roomCode,
          "Room Match Code"
        );

      }
    );


  $("copyMatchRoomPassword")
    ?.addEventListener(
      "click",
      async () => {

        await copyChatValue(
          roomPassword,
          "Match Password"
        );

      }
    );


  $("sendMatchChat")
    ?.addEventListener(
      "click",
      () =>
        sendMatchChatMessage(
          matchId,
          match
        )
    );


  $("matchChatInput")
    ?.addEventListener(
      "keydown",
      event => {

        if (
          event.key === "Enter" &&
          !event.shiftKey
        ) {

          event.preventDefault();

          sendMatchChatMessage(
            matchId,
            match
          );

        }

      }
    );


  subscribeToMatchChat(
    matchId,
    match
  );

}

/* =====================================================
   CLOSE MATCH CHAT
===================================================== */

function closeMatchChat() {

  if (activeChatUnsubscribe) {

    activeChatUnsubscribe();

    activeChatUnsubscribe = null;

  }

  $("matchChatModal")?.remove();

}


/* =====================================================
   REALTIME MATCH CHAT
===================================================== */

function subscribeToMatchChat(
  matchId,
  match
) {

  if (activeChatUnsubscribe) {

    activeChatUnsubscribe();

    activeChatUnsubscribe = null;

  }

  const messagesBox =
    $("matchChatMessages");

  if (!messagesBox)
    return;

  const chatRef =
    collection(
      db,
      "gameMatches",
      matchId,
      "chat"
    );

  const chatQuery =
    query(
      chatRef,
      orderBy(
        "createdAt",
        "asc"
      )
    );

  activeChatUnsubscribe =
    onSnapshot(
      chatQuery,
      snapshot => {

        if (snapshot.empty) {

          messagesBox.innerHTML = `
            <div style="
              text-align:center;
              color:#91ad9f;
              font-size:11px;
              padding:35px 15px;
              line-height:1.6;
            ">
              💬 No messages yet.<br>
              Start the conversation with your opponent.
            </div>
          `;

          return;

        }

        messagesBox.innerHTML = "";

        snapshot.forEach(messageDoc => {

          const message =
            messageDoc.data();

          const mine =
            message.senderId ===
            currentUser.uid;

          const messageDiv =
            document.createElement("div");

          messageDiv.style.cssText = `
            display:flex;
            justify-content:${
              mine
                ? "flex-end"
                : "flex-start"
            };
            margin-bottom:9px;
          `;

          const bubble =
            document.createElement("div");

          bubble.style.cssText = `
            max-width:82%;
            padding:9px 11px;
            border-radius:${
              mine
                ? "13px 13px 3px 13px"
                : "13px 13px 13px 3px"
            };
            background:${
              mine
                ? "#16c172"
                : "#10291f"
            };
            border:1px solid ${
              mine
                ? "#16c172"
                : "#1d4934"
            };
            color:${
              mine
                ? "#06110d"
                : "#f3fff8"
            };
            font-size:11px;
            line-height:1.5;
            word-break:break-word;
          `;

          const sender =
            document.createElement("div");

          sender.style.cssText = `
            font-size:8px;
            font-weight:800;
            margin-bottom:3px;
            opacity:.7;
          `;

          sender.textContent =
            mine
              ? "YOU"
              : (
                  message.senderName ||
                  "OPPONENT"
                );

          const text =
            document.createElement("div");

          text.textContent =
            message.text || "";

          bubble.appendChild(sender);
          bubble.appendChild(text);

          messageDiv.appendChild(bubble);

          messagesBox.appendChild(messageDiv);

        });

        messagesBox.scrollTop =
          messagesBox.scrollHeight;

      },
      error => {

        console.error(
          "Match chat listener error:",
          error
        );

        messagesBox.innerHTML = `
          <div style="
            text-align:center;
            color:#ff7070;
            font-size:11px;
            padding:30px 15px;
          ">
            Unable to load match chat.
          </div>
        `;

      }
    );

}

/* =====================================================
   SEND CHAT MESSAGE
===================================================== */

async function sendMatchChatMessage(
  matchId,
  match
) {

  if (!currentUser)
    return;

  if (isChatLocked(match)) {

    alert(
      "Match chat is closed."
    );

    closeMatchChat();

    return;

  }

  const input =
    $("matchChatInput");

  const button =
    $("sendMatchChat");

  const text =
    input?.value?.trim() || "";

  if (!text)
    return;

  if (text.length > 500) {

    alert(
      "Message is too long. Maximum 500 characters."
    );

    return;

  }

  const isHome =
    match.homePlayerId ===
    currentUser.uid;

  const isAway =
    match.awayPlayerId ===
    currentUser.uid;

  if (!isHome && !isAway) {

    alert(
      "You are not a player in this match."
    );

    return;

  }

  const opponentId =
    isHome
      ? match.awayPlayerId
      : match.homePlayerId;

  if (!opponentId) {

    alert(
      "Opponent not found."
    );

    return;

  }

  try {

    if (button) {

      button.disabled =
        true;

      button.textContent =
        "…";

    }

    const userSnap =
      await getDoc(
        doc(
          db,
          "users",
          currentUser.uid
        )
      );

    const userData =
      userSnap.exists()
        ? userSnap.data()
        : {};

    const senderName =
      userData.name ||
      userData.fullName ||
      userData.displayName ||
      currentUser.displayName ||
      "Player";

    const senderUsername =
      userData.username ||
      currentUser.email ||
      "";

    const chatRef =
      collection(
        db,
        "gameMatches",
        matchId,
        "chat"
      );

    await addDoc(
      chatRef,
      {
        matchId,
        senderId:
          currentUser.uid,
        receiverId:
          opponentId,
        senderName,
        senderUsername,
        text,
        createdAt:
          serverTimestamp()
      }
    );

    if (input)
      input.value = "";

  } catch (error) {

    console.error(
      "Send match chat error:",
      error
    );

    alert(
      error?.message ||
      "Unable to send message."
    );

  } finally {

    if (button) {

      button.disabled =
        false;

      button.textContent =
        "➤";

    }

  }

}


/* =====================================================
   COPY CHAT VALUE
===================================================== */

async function copyChatValue(
  value,
  label
) {

  const text =
    String(value || "");

  if (
    !text ||
    text === "Not available"
  ) {

    alert(
      `${label} is not available for this match.`
    );

    return;

  }

  try {

    await navigator.clipboard.writeText(
      text
    );

    alert(
      `${label} copied.`
    );

  } catch (error) {

    console.error(
      "Copy error:",
      error
    );

    alert(
      `Unable to copy ${label}.`
    );

  }

}


/* =====================================================
   SUBMIT RESULT MODAL
===================================================== */

function openSubmitResultModal(
  matchId,
  match
) {

  const old =
    $("submitResultModal");

  if (old)
    old.remove();

  const isHome =
    match.homePlayerId ===
    currentUser.uid;

  const opponentName =
    isHome
      ? (
          match.awayPlayerName ||
          match.awayUsername ||
          "Opponent"
        )
      : (
          match.homePlayerName ||
          match.homeUsername ||
          "Opponent"
        );

  const modal =
    document.createElement("div");

  modal.id =
    "submitResultModal";

  modal.style.cssText = `
    position:fixed;
    inset:0;
    z-index:99999;
    background:rgba(0,0,0,.86);
    display:flex;
    align-items:center;
    justify-content:center;
    padding:18px;
    overflow-y:auto;
  `;

  modal.innerHTML = `

    <div style="
      width:100%;
      max-width:430px;
      background:#0d2118;
      border:1px solid #1d4934;
      border-radius:20px;
      padding:20px;
      color:#f3fff8;
      box-shadow:0 20px 70px rgba(0,0,0,.6);
      box-sizing:border-box;
    ">

      <div style="
        text-align:center;
        font-size:34px;
        margin-bottom:5px;
      ">
        ⚽
      </div>

      <h2 style="
        text-align:center;
        margin:0;
        font-size:20px;
      ">
        SUBMIT MATCH RESULT
      </h2>

      <p style="
        text-align:center;
        color:#91ad9f;
        font-size:12px;
        margin:7px 0 18px;
      ">
        vs ${escapeHTML(opponentName)}
      </p>

      <div style="
        display:grid;
        grid-template-columns:1fr 1fr;
        gap:10px;
      ">

        <div>

          <label style="
            display:block;
            color:#91ad9f;
            font-size:10px;
            margin-bottom:6px;
          ">
            YOUR SCORE
          </label>

          <input
            id="yourMatchScore"
            type="number"
            min="0"
            max="99"
            step="1"
            inputmode="numeric"
            placeholder="0"
            style="
              width:100%;
              box-sizing:border-box;
              padding:14px;
              border-radius:11px;
              border:1px solid #1d4934;
              background:#06110d;
              color:#f3fff8;
              outline:none;
              font-size:20px;
              text-align:center;
            "
          />

        </div>

        <div>

          <label style="
            display:block;
            color:#91ad9f;
            font-size:10px;
            margin-bottom:6px;
          ">
            OPPONENT SCORE
          </label>

          <input
            id="opponentMatchScore"
            type="number"
            min="0"
            max="99"
            step="1"
            inputmode="numeric"
            placeholder="0"
            style="
              width:100%;
              box-sizing:border-box;
              padding:14px;
              border-radius:11px;
              border:1px solid #1d4934;
              background:#06110d;
              color:#f3fff8;
              outline:none;
              font-size:20px;
              text-align:center;
            "
          />

        </div>

      </div>

      <div style="margin-top:17px;">

        <label style="
          display:block;
          color:#91ad9f;
          font-size:10px;
          margin-bottom:7px;
        ">
          MATCH RESULT IMAGE
        </label>

        <label
          for="matchResultImage"
          style="
            display:block;
            border:1px dashed #2b6549;
            background:#06110d;
            border-radius:14px;
            padding:18px 12px;
            text-align:center;
            cursor:pointer;
          "
        >

          <div style="
            font-size:28px;
            margin-bottom:6px;
          ">
            📷
          </div>

          <strong style="
            display:block;
            font-size:13px;
          ">
            CHOOSE MATCH IMAGE
          </strong>

          <span style="
            display:block;
            margin-top:5px;
            color:#91ad9f;
            font-size:10px;
          ">
            Image must show the final match score.
            Max 5MB.
          </span>

        </label>

        <input
          id="matchResultImage"
          type="file"
          accept="image/*"
          style="display:none;"
        />

        <div
          id="matchImagePreview"
          style="
            display:none;
            margin-top:12px;
          "
        ></div>

      </div>

      <div
        id="submitResultMessage"
        style="
          margin-top:12px;
          color:#91ad9f;
          font-size:12px;
          line-height:1.5;
        "
      ></div>

      <button
        type="button"
        id="submitMatchResultBtn"
        style="
          width:100%;
          padding:14px;
          margin-top:12px;
          border:0;
          border-radius:12px;
          background:#16c172;
          color:#06110d;
          font-weight:900;
          cursor:pointer;
        "
      >
        SUBMIT RESULT
      </button>

      <button
        type="button"
        id="cancelSubmitResult"
        style="
          width:100%;
          padding:12px;
          margin-top:8px;
          border:1px solid #1d4934;
          border-radius:12px;
          background:transparent;
          color:#91ad9f;
          cursor:pointer;
        "
      >
        CANCEL
      </button>

    </div>

  `;

  document.body.appendChild(modal);

  const imageInput =
    $("matchResultImage");

  const preview =
    $("matchImagePreview");

  imageInput?.addEventListener(
    "change",
    () => {

      const file =
        imageInput.files?.[0];

      if (!file) {

        if (preview)
          preview.style.display = "none";

        return;

      }

      if (!file.type.startsWith("image/")) {

        imageInput.value = "";

        if (preview) {

          preview.style.display = "block";

          preview.innerHTML = `
            <div style="
              color:#ff7070;
              font-size:11px;
            ">
              Please choose an image file.
            </div>
          `;

        }

        return;

      }

      if (
        file.size >
        5 * 1024 * 1024
      ) {

        imageInput.value = "";

        if (preview) {

          preview.style.display = "block";

          preview.innerHTML = `
            <div style="
              color:#ff7070;
              font-size:11px;
            ">
              Image is too large.
              Maximum size is 5MB.
            </div>
          `;

        }

        return;

      }

      const reader =
        new FileReader();

      reader.onload =
        event => {

          if (!preview) return;

          preview.style.display =
            "block";

          preview.innerHTML = `

            <div style="
              border:1px solid #1d4934;
              border-radius:14px;
              overflow:hidden;
              background:#06110d;
            ">

              <img
                src="${event.target.result}"
                alt="Match result preview"
                style="
                  display:block;
                  width:100%;
                  max-height:260px;
                  object-fit:contain;
                  background:#000;
                "
              />

              <div style="
                padding:8px;
                text-align:center;
                color:#16c172;
                font-size:10px;
              ">
                ✓ IMAGE READY
              </div>

            </div>

          `;

        };

      reader.readAsDataURL(file);

    }
  );

  $("cancelSubmitResult")
    ?.addEventListener(
      "click",
      () => modal.remove()
    );

  $("submitMatchResultBtn")
    ?.addEventListener(
      "click",
      () =>
        submitMatchResult(
          matchId,
          match
        )
    );

}


/* =====================================================
   SUBMIT MATCH RESULT
===================================================== */

async function submitMatchResult(
  matchId,
  match
) {

  if (!currentUser) return;

  const yourInput =
    $("yourMatchScore");

  const opponentInput =
    $("opponentMatchScore");

  const imageInput =
    $("matchResultImage");

  const message =
    $("submitResultMessage");

  const button =
    $("submitMatchResultBtn");

  const yourScore =
    Number(yourInput?.value);

  const opponentScore =
    Number(opponentInput?.value);

  const file =
    imageInput?.files?.[0];

  if (
    !Number.isInteger(yourScore) ||
    yourScore < 0 ||
    yourScore > 99
  ) {

    if (message)
      message.innerHTML = `
        <span style="color:#ff7070;">
          Enter a valid Your Score.
        </span>
      `;

    return;

  }

  if (
    !Number.isInteger(opponentScore) ||
    opponentScore < 0 ||
    opponentScore > 99
  ) {

    if (message)
      message.innerHTML = `
        <span style="color:#ff7070;">
          Enter a valid Opponent Score.
        </span>
      `;

    return;

  }

  if (!file) {

    if (message)
      message.innerHTML = `
        <span style="color:#ff7070;">
          Match Result Image is required.
        </span>
      `;

    return;

  }

  if (!file.type.startsWith("image/")) {

    if (message)
      message.innerHTML = `
        <span style="color:#ff7070;">
          Please choose a valid image.
        </span>
      `;

    return;

  }

  if (
    file.size >
    5 * 1024 * 1024
  ) {

    if (message)
      message.innerHTML = `
        <span style="color:#ff7070;">
          Image is too large. Maximum size is 5MB.
        </span>
      `;

    return;

  }

  const isHome =
    match.homePlayerId ===
    currentUser.uid;

  const isAway =
    match.awayPlayerId ===
    currentUser.uid;

  if (!isHome && !isAway) {

    if (message)
      message.innerHTML = `
        <span style="color:#ff7070;">
          You are not a player in this match.
        </span>
      `;

    return;

  }

  if (
    match.resultStatus === "pending"
  ) {

    if (message)
      message.innerHTML = `
        <span style="color:#ffd75a;">
          This result is already waiting for Admin verification.
        </span>
      `;

    return;

  }

  if (
    match.resultStatus === "verified"
  ) {

    if (message)
      message.innerHTML = `
        <span style="color:#16c172;">
          This match result has already been verified.
        </span>
      `;

    return;

  }

  if (button) {

    button.disabled = true;
    button.textContent =
      "UPLOADING IMAGE...";

  }

  try {

    const safeMatchId =
      String(matchId)
        .replace(
          /[^a-zA-Z0-9_-]/g,
          "_"
        );

    const fileExtension =
      getImageExtension(file);

    const storagePath =
      `gameMatchResults/${currentUser.uid}/${safeMatchId}_${Date.now()}.${fileExtension}`;

    if (message) {

      message.innerHTML = `
        <span style="color:#91ad9f;">
          Uploading match image...
        </span>
      `;

    }

    const {
      data: uploadData,
      error: uploadError
    } =
      await supabase.storage
        .from("game-match-results")
        .upload(
          storagePath,
          file,
          {
            cacheControl: "3600",
            contentType: file.type,
            upsert: false
          }
        );

    if (uploadError)
      throw uploadError;

    console.log(
      "Supabase upload successful:",
      uploadData
    );

    if (button)
      button.textContent =
        "GETTING IMAGE...";

    const {
      data: publicUrlData
    } =
      supabase.storage
        .from("game-match-results")
        .getPublicUrl(
          storagePath
        );

    const imageUrl =
      publicUrlData?.publicUrl;

    if (!imageUrl) {

      throw new Error(
        "Unable to create public image URL."
      );

    }

    const homeScore =
      isHome
        ? yourScore
        : opponentScore;

    const awayScore =
      isHome
        ? opponentScore
        : yourScore;

    if (button)
      button.textContent =
        "SAVING RESULT...";

    const matchRef =
      doc(
        db,
        "gameMatches",
        matchId
      );

    await updateDoc(
      matchRef,
      {

        homeScore,

        awayScore,

        resultStatus:
          "pending",

        resultSubmittedBy:
          currentUser.uid,

        resultSubmittedAt:
          serverTimestamp(),

        resultImageUrl:
          imageUrl,

        resultImagePath:
          storagePath

      }
    );

    if (message) {

      message.innerHTML = `
        <span style="
          color:#16c172;
          font-weight:700;
        ">
          ✓ Result submitted successfully.
        </span>

        <br>

        <span style="color:#91ad9f;">
          Waiting for Admin verification.
        </span>
      `;

    }

    setTimeout(
      async () => {

        $("submitResultModal")
          ?.remove();

        await loadMyMatches();

      },
      900
    );

  } catch (error) {

    console.error(
      "Submit result error:",
      error
    );

    if (message) {

      message.innerHTML = `
        <span style="
          color:#ff7070;
          font-weight:700;
        ">
          ${escapeHTML(
            getMatchSubmitError(error)
          )}
        </span>
      `;

    }

    if (button) {

      button.disabled = false;

      button.textContent =
        "SUBMIT RESULT";

    }

  }

}


/* =====================================================
   IMAGE EXTENSION
===================================================== */

function getImageExtension(file) {

  const type =
    String(
      file?.type || ""
    ).toLowerCase();

  if (type === "image/png")
    return "png";

  if (type === "image/webp")
    return "webp";

  if (type === "image/gif")
    return "gif";

  if (type === "image/jpeg")
    return "jpg";

  return "jpg";

}


/* =====================================================
   MATCH SUBMIT ERROR
===================================================== */

function getMatchSubmitError(error) {

  if (!error)
    return "Unable to submit result.";

  const message =
    String(
      error.message || ""
    ).toLowerCase();

  const statusCode =
    Number(
      error.statusCode ||
      error.status ||
      0
    );

  if (
    statusCode === 401 ||
    statusCode === 403 ||
    message.includes("unauthorized") ||
    message.includes("not authorized") ||
    message.includes("permission")
  ) {

    return (
      "Image upload was not allowed by Supabase Storage policy."
    );

  }

  if (
    statusCode === 413 ||
    message.includes("too large")
  ) {

    return (
      "Image is too large. Maximum size is 5MB."
    );

  }

  if (
    message.includes("already exists") ||
    message.includes("duplicate")
  ) {

    return (
      "This image already exists. Please try submitting again."
    );

  }

  if (
    message.includes("network") ||
    message.includes("fetch")
  ) {

    return (
      "Image upload failed because of your internet connection. Please try again."
    );

  }

  return (
    error.message ||
    "Unable to submit result."
  );

}


/* =====================================================
   VERIFIED MATCH CHECK
===================================================== */

function isVerifiedMatch(data) {

  return (
    data &&
    data.resultStatus === "verified" &&
    Number.isInteger(
      Number(data.homeScore)
    ) &&
    Number.isInteger(
      Number(data.awayScore)
    ) &&
    data.homePlayerId &&
    data.awayPlayerId
  );

}


/* =====================================================
   PLAYER STATS OBJECT
===================================================== */

function createPlayerStats() {

  return {

    playerId: "",

    playerName: "Player",

    username: "",

    played: 0,

    wins: 0,

    draws: 0,

    losses: 0,

    goalsFor: 0,

    goalsAgainst: 0,

    goalDifference: 0,

    points: 0

  };

}


/* =====================================================
   ENSURE PLAYER
===================================================== */

function ensurePlayerStats(
  standings,
  playerId,
  name = "Player",
  username = ""
) {

  if (!playerId)
    return null;

  if (!standings.has(playerId)) {

    const stats =
      createPlayerStats();

    stats.playerId =
      playerId;

    stats.playerName =
      name || "Player";

    stats.username =
      username || "";

    standings.set(
      playerId,
      stats
    );

  }

  const player =
    standings.get(playerId);

  if (
    name &&
    (
      !player.playerName ||
      player.playerName === "Player"
    )
  ) {

    player.playerName =
      name;

  }

  if (
    username &&
    !player.username
  ) {

    player.username =
      username;

  }

  return player;

}


/* =====================================================
   APPLY VERIFIED MATCH
===================================================== */

function applyVerifiedMatch(
  standings,
  match
) {

  if (!isVerifiedMatch(match))
    return;

  const homeId =
    match.homePlayerId;

  const awayId =
    match.awayPlayerId;

  const home =
    ensurePlayerStats(
      standings,
      homeId,
      match.homePlayerName ||
        match.homeUsername ||
        "Player",
      match.homeUsername || ""
    );

  const away =
    ensurePlayerStats(
      standings,
      awayId,
      match.awayPlayerName ||
        match.awayUsername ||
        "Player",
      match.awayUsername || ""
    );

  if (!home || !away)
    return;

  const homeScore =
    Number(match.homeScore);

  const awayScore =
    Number(match.awayScore);

  home.played++;
  away.played++;

  home.goalsFor += homeScore;
  home.goalsAgainst += awayScore;

  away.goalsFor += awayScore;
  away.goalsAgainst += homeScore;

  if (homeScore > awayScore) {

    home.wins++;
    home.points += 3;
    away.losses++;

  } else if (
    homeScore < awayScore
  ) {

    away.wins++;
    away.points += 3;
    home.losses++;

  } else {

    home.draws++;
    away.draws++;

    home.points++;
    away.points++;

  }

  home.goalDifference =
    home.goalsFor -
    home.goalsAgainst;

  away.goalDifference =
    away.goalsFor -
    away.goalsAgainst;

}


/* =====================================================
   SORT STANDINGS
===================================================== */

function sortStandings(standings) {

  return Array.from(
    standings.values()
  ).sort(
    (a, b) => {

      if (
        b.points !== a.points
      )
        return b.points - a.points;

      if (
        b.goalDifference !==
        a.goalDifference
      )
        return (
          b.goalDifference -
          a.goalDifference
        );

      if (
        b.goalsFor !== a.goalsFor
      )
        return b.goalsFor - a.goalsFor;

      if (
        b.wins !== a.wins
      )
        return b.wins - a.wins;

      return String(
        a.playerName || ""
      ).localeCompare(
        String(
          b.playerName || ""
        )
      );

    }
  );

}


/* =====================================================
   ALL GAME MATCHES
===================================================== */

async function getAllGameMatches() {

  const snapshot =
    await getDocs(
      collection(
        db,
        "gameMatches"
      )
    );

  return snapshot.docs.map(
    item => ({
      id: item.id,
      data: item.data()
    })
  );

}


/* =====================================================
   USER GAME MATCHES
===================================================== */

async function getUserGameMatches() {

  if (!currentUser)
    return [];

  const matchesRef =
    collection(
      db,
      "gameMatches"
    );

  const homeQuery =
    query(
      matchesRef,
      where(
        "homePlayerId",
        "==",
        currentUser.uid
      )
    );

  const awayQuery =
    query(
      matchesRef,
      where(
        "awayPlayerId",
        "==",
        currentUser.uid
      )
    );

  const [
    homeSnapshot,
    awaySnapshot
  ] =
    await Promise.all([
      getDocs(homeQuery),
      getDocs(awayQuery)
    ]);

  const map =
    new Map();

  homeSnapshot.forEach(
    item =>
      map.set(
        item.id,
        item.data()
      )
  );

  awaySnapshot.forEach(
    item =>
      map.set(
        item.id,
        item.data()
      )
  );

  return Array.from(
    map.values()
  );

}


/* =====================================================
   COMPETITION KEY
===================================================== */

function getCompetitionKey(match) {

  return (
    match.competitionId ||
    match.competitionName ||
    "unknown"
  );

}


/* =====================================================
   COMPETITION LABEL
===================================================== */

function getCompetitionLabel(match) {

  return (
    match.competitionName ||
    match.competitionType ||
    "Competition"
  );

}


/* =====================================================
   LOAD RANKING
===================================================== */

async function loadRanking() {

  const box =
    $("rankingList");

  if (!box) return;

  if (!currentUser) {

    box.innerHTML = `
      <div class="empty">

        <div>🔐</div>

        <h3>Please Login</h3>

      </div>
    `;

    return;

  }

  box.innerHTML = `
    <div class="loading">
      Loading standings...
    </div>
  `;

  try {

    const snapshot =
      await getDocs(
        collection(
          db,
          "gameStandings"
        )
      );

    if (snapshot.empty) {

      box.innerHTML = `
        <div class="empty">

          <div>🏅</div>

          <h3>No Standings Yet</h3>

          <p>
            Standings will appear after
            Admin verifies match results.
          </p>

        </div>
      `;

      return;

    }

    const competitions =
      new Map();

    snapshot.forEach(item => {

      const data =
        item.data();

      const competitionId =
        data.competitionId ||
        item.id.split("_")[0];

      if (
        !competitions.has(
          competitionId
        )
      ) {

        competitions.set(
          competitionId,
          {

            id:
              competitionId,

            name:
              data.competitionName ||
              "Competition",

            type:
              data.competitionType ||
              "",

            rows: []

          }
        );

      }

      competitions
        .get(competitionId)
        .rows
        .push({

          userId:
            data.userId || "",

          playerId:
            data.userId || "",

          playerName:
            data.playerName ||
            data.username ||
            "Player",

          username:
            data.username || "",

          played:
            Number(data.played || 0),

          wins:
            Number(data.wins || 0),

          draws:
            Number(data.draws || 0),

          losses:
            Number(data.losses || 0),

          goalsFor:
            Number(data.goalsFor || 0),

          goalsAgainst:
            Number(data.goalsAgainst || 0),

          goalDifference:
            Number(
              data.goalDifference || 0
            ),

          points:
            Number(data.points || 0),

          position:
            Number(data.position || 0)

        });

    });

    box.innerHTML = "";

    competitions.forEach(
      competition => {

        competition.rows.sort(
          (a, b) => {

            if (
              a.position > 0 &&
              b.position > 0
            )
              return (
                a.position -
                b.position
              );

            if (
              b.points !==
              a.points
            )
              return (
                b.points -
                a.points
              );

            if (
              b.goalDifference !==
              a.goalDifference
            )
              return (
                b.goalDifference -
                a.goalDifference
              );

            if (
              b.goalsFor !==
              a.goalsFor
            )
              return (
                b.goalsFor -
                a.goalsFor
              );

            return String(
              a.playerName || ""
            ).localeCompare(
              String(
                b.playerName || ""
              )
            );

          }
        );

        box.appendChild(
          createStandingsCard(
            competition,
            competition.rows
          )
        );

      }
    );

  } catch (error) {

    console.error(
      "Ranking error:",
      error
    );

    box.innerHTML = `
      <div class="empty">

        <div>⚠️</div>

        <h3>
          Unable to load ranking
        </h3>

        <p>
          ${escapeHTML(
            error.message ||
            "Please try again later."
          )}
        </p>

      </div>
    `;

  }

}


/* =====================================================
   STANDINGS CARD
===================================================== */

function createStandingsCard(
  competition,
  rows
) {

  const card =
    document.createElement("article");

  card.className =
    "competition-card";

  const typeLower =
    String(
      competition.type || ""
    ).toLowerCase();

  const nameLower =
    String(
      competition.name || ""
    ).toLowerCase();

  const isLeague =
    typeLower.includes("league") ||
    nameLower.includes("league");

  const isCup =
    typeLower.includes("cup") ||
    nameLower.includes("cup");

  const isTournament =
    typeLower.includes("tournament") ||
    nameLower.includes("tournament");

  let qualificationLimit = 0;

  if (isLeague)
    qualificationLimit = 2;

  if (isCup)
    qualificationLimit = 2;

  if (isTournament)
    qualificationLimit = 8;

  const currentPlayerRow =
    rows.findIndex(
      player =>
        (
          player.userId ||
          player.playerId
        ) ===
        currentUser.uid
    );

  const currentPlayerPosition =
    currentPlayerRow >= 0
      ? (
          Number(
            rows[currentPlayerRow].position
          ) > 0
            ? Number(
                rows[currentPlayerRow].position
              )
            : currentPlayerRow + 1
        )
      : null;

  const currentPlayer =
    currentPlayerRow >= 0
      ? rows[currentPlayerRow]
      : null;

  let qualificationTitle = "";

  if (isLeague)
    qualificationTitle =
      "LEAGUE QUALIFICATION";

  if (isCup)
    qualificationTitle =
      "CUP QUALIFICATION";

  if (isTournament)
    qualificationTitle =
      "TOURNAMENT QUALIFICATION";

  const qualificationHTML =
    qualificationLimit > 0
      ? `

        <div style="
          margin-top:13px;
          padding:12px;
          border-radius:12px;
          background:#06110d;
          border:1px solid #1d4934;
        ">

          <div style="
            color:#91ad9f;
            font-size:10px;
            margin-bottom:5px;
          ">
            ${qualificationTitle}
          </div>

          <strong style="
            color:#f3fff8;
            font-size:13px;
          ">
            TOP ${qualificationLimit} QUALIFY
          </strong>

          ${
            currentPlayer
              ? `
                <div style="
                  margin-top:8px;
                  color:${
                    currentPlayerPosition <=
                    qualificationLimit
                      ? "#16c172"
                      : "#ffd75a"
                  };
                  font-size:12px;
                  font-weight:800;
                ">
                  YOUR POSITION:
                  #${currentPlayerPosition}

                  ${
                    currentPlayerPosition <=
                    qualificationLimit
                      ? " — CURRENTLY QUALIFYING"
                      : " — OUTSIDE QUALIFICATION ZONE"
                  }
                </div>
              `
              : `
                <div style="
                  margin-top:8px;
                  color:#91ad9f;
                  font-size:11px;
                ">
                  You are not yet in this standings table.
                </div>
              `
          }

        </div>

      `
      : "";

  let tableHTML = `

    <div style="
      margin-top:14px;
      overflow-x:auto;
    ">

      <table style="
        width:100%;
        border-collapse:collapse;
        min-width:650px;
        font-size:11px;
      ">

        <thead>

          <tr style="
            color:#91ad9f;
            border-bottom:1px solid #1d4934;
          ">

            <th style="padding:9px 5px;text-align:left;">
              POS
            </th>

            <th style="padding:9px 5px;text-align:left;">
              PLAYER
            </th>

            <th style="padding:9px 5px;">P</th>
            <th style="padding:9px 5px;">W</th>
            <th style="padding:9px 5px;">D</th>
            <th style="padding:9px 5px;">L</th>
            <th style="padding:9px 5px;">GF</th>
            <th style="padding:9px 5px;">GA</th>
            <th style="padding:9px 5px;">GD</th>
            <th style="padding:9px 5px;">PTS</th>

          </tr>

        </thead>

        <tbody>
  `;

  rows.forEach(
    (player, index) => {

      const storedPosition =
        Number(
          player.position || 0
        );

      const position =
        storedPosition > 0
          ? storedPosition
          : index + 1;

      const qualified =
        qualificationLimit > 0 &&
        position <=
        qualificationLimit;

      const isCurrent =
        (
          player.userId ||
          player.playerId
        ) ===
        currentUser.uid;

      tableHTML += `

        <tr style="
          border-bottom:1px solid rgba(29,73,52,.55);
          background:${
            isCurrent
              ? "rgba(22,193,114,.08)"
              : "transparent"
          };
        ">

          <td style="
            padding:10px 5px;
            font-weight:800;
            color:${
              qualified
                ? "#16c172"
                : "#f3fff8"
            };
          ">
            #${position}
          </td>

          <td style="
            padding:10px 5px;
            text-align:left;
          ">

            <strong style="
              display:block;
              color:#f3fff8;
              font-size:11px;
            ">
              ${escapeHTML(
                player.playerName
              )}
            </strong>

            ${
              player.username
                ? `
                  <span style="
                    color:#91ad9f;
                    font-size:9px;
                  ">
                    @${escapeHTML(
                      String(
                        player.username
                      ).replace(/^@/, "")
                    )}
                  </span>
                `
                : ""
            }

            ${
              qualified
                ? `
                  <span style="
                    display:block;
                    margin-top:3px;
                    color:#16c172;
                    font-size:8px;
                    font-weight:800;
                  ">
                    CURRENTLY QUALIFYING
                  </span>
                `
                : ""
            }

          </td>

          <td style="padding:10px 5px;text-align:center;">
            ${player.played}
          </td>

          <td style="padding:10px 5px;text-align:center;">
            ${player.wins}
          </td>

          <td style="padding:10px 5px;text-align:center;">
            ${player.draws}
          </td>

          <td style="padding:10px 5px;text-align:center;">
            ${player.losses}
          </td>

          <td style="padding:10px 5px;text-align:center;">
            ${player.goalsFor}
          </td>

          <td style="padding:10px 5px;text-align:center;">
            ${player.goalsAgainst}
          </td>

          <td style="
            padding:10px 5px;
            text-align:center;
            color:${
              player.goalDifference >= 0
                ? "#16c172"
                : "#ff7070"
            };
            font-weight:700;
          ">
            ${
              player.goalDifference > 0
                ? "+" + player.goalDifference
                : player.goalDifference
            }
          </td>

          <td style="
            padding:10px 5px;
            text-align:center;
            font-weight:900;
            color:#f3fff8;
          ">
            ${player.points}
          </td>

        </tr>

      `;

    }
  );

  tableHTML += `
        </tbody>
      </table>
    </div>
  `;

  card.innerHTML = `

    <span class="competition-type">
      ${escapeHTML(
        competition.type ||
        "STANDINGS"
      )}
    </span>

    <h3 style="margin-bottom:4px;">
      🏆 ${escapeHTML(
        competition.name
      )}
    </h3>

    <div style="
      color:#91ad9f;
      font-size:11px;
      margin-top:5px;
    ">
      PLAYERS:

      <strong style="color:#f3fff8;">
        ${rows.length}
      </strong>
    </div>

    ${qualificationHTML}

    ${tableHTML}

  `;

  return card;

}


/* =====================================================
   PERSONAL STATISTICS
===================================================== */

async function loadStatistics() {

  if (!currentUser)
    return;

  if ($("matchesPlayed"))
    $("matchesPlayed").textContent = "0";

  if ($("wins"))
    $("wins").textContent = "0";

  if ($("draws"))
    $("draws").textContent = "0";

  if ($("losses"))
    $("losses").textContent = "0";

  $("advancedStatistics")?.remove();

  const statsContainer =
    $("statisticsPage");

  if (!statsContainer)
    return;

  try {

    const matches =
      await getUserGameMatches();

    const verifiedMatches =
      matches.filter(
        isVerifiedMatch
      );

    const stats =
      createPlayerStats();

    stats.playerId =
      currentUser.uid;

    verifiedMatches.forEach(
      match =>
        applyPersonalMatchStats(
          stats,
          match
        )
    );

    if ($("matchesPlayed"))
      $("matchesPlayed").textContent =
        String(stats.played);

    if ($("wins"))
      $("wins").textContent =
        String(stats.wins);

    if ($("draws"))
      $("draws").textContent =
        String(stats.draws);

    if ($("losses"))
      $("losses").textContent =
        String(stats.losses);

    const extra =
      document.createElement("div");

    extra.id =
      "advancedStatistics";

    extra.style.cssText =
      "margin-top:14px;";

    extra.innerHTML = `

      <div style="
        display:grid;
        grid-template-columns:repeat(3,1fr);
        gap:10px;
      ">

        <div class="stat-card">
          <strong>${stats.goalsFor}</strong>
          <span>Goals For</span>
        </div>

        <div class="stat-card">
          <strong>${stats.goalsAgainst}</strong>
          <span>Goals Against</span>
        </div>

        <div class="stat-card">

          <strong style="
            color:${
              stats.goalDifference >= 0
                ? "#16c172"
                : "#ff7070"
            };
          ">
            ${
              stats.goalDifference > 0
                ? "+" + stats.goalDifference
                : stats.goalDifference
            }
          </strong>

          <span>Goal Difference</span>

        </div>

      </div>

      <div style="
        margin-top:12px;
        padding:15px;
        border-radius:15px;
        background:#10291f;
        border:1px solid #1d4934;
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:12px;
      ">

        <div>

          <span style="
            display:block;
            color:#91ad9f;
            font-size:10px;
          ">
            TOTAL POINTS
          </span>

          <strong style="
            display:block;
            margin-top:5px;
            font-size:25px;
          ">
            ${stats.points}
          </strong>

        </div>

        <div style="
          text-align:right;
          color:#91ad9f;
          font-size:10px;
          line-height:1.6;
        ">

          VERIFIED MATCHES

          <strong style="
            display:block;
            color:#16c172;
            font-size:14px;
          ">
            ${verifiedMatches.length}
          </strong>

        </div>

      </div>

      ${
        verifiedMatches.length === 0
          ? `
            <div style="
              margin-top:12px;
              padding:13px;
              border-radius:13px;
              background:#10291f;
              color:#91ad9f;
              font-size:11px;
              line-height:1.6;
            ">
              Statistics will update automatically
              after Admin verifies your match result.
            </div>
          `
          : ""
      }

    `;

    statsContainer.appendChild(extra);

  } catch (error) {

    console.error(
      "Statistics error:",
      error
    );

    const message =
      document.createElement("div");

    message.id =
      "advancedStatistics";

    message.style.cssText = `
      margin-top:12px;
      padding:13px;
      border-radius:13px;
      background:rgba(255,70,70,.08);
      border:1px solid rgba(255,70,70,.2);
      color:#ff7070;
      font-size:11px;
    `;

    message.textContent =
      error.message ||
      "Unable to load statistics.";

    statsContainer.appendChild(message);

  }

}


/* =====================================================
   PERSONAL MATCH STATS
===================================================== */

function applyPersonalMatchStats(
  stats,
  match
) {

  if (!isVerifiedMatch(match))
    return;

  const isHome =
    match.homePlayerId ===
    currentUser.uid;

  const isAway =
    match.awayPlayerId ===
    currentUser.uid;

  if (!isHome && !isAway)
    return;

  const myScore =
    Number(
      isHome
        ? match.homeScore
        : match.awayScore
    );

  const opponentScore =
    Number(
      isHome
        ? match.awayScore
        : match.homeScore
    );

  stats.played++;

  stats.goalsFor +=
    myScore;

  stats.goalsAgainst +=
    opponentScore;

  if (myScore > opponentScore) {

    stats.wins++;
    stats.points += 3;

  } else if (
    myScore < opponentScore
  ) {

    stats.losses++;

  } else {

    stats.draws++;
    stats.points++;

  }

  stats.goalDifference =
    stats.goalsFor -
    stats.goalsAgainst;

}


/* =====================================================
   HISTORY
===================================================== */

async function loadHistory() {

  const box =
    $("historyList");

  if (!box) return;

  if (!currentUser)
    return;

  try {

    const q =
      query(
        collection(
          db,
          "gameHistory"
        ),
        where(
          "uid",
          "==",
          currentUser.uid
        )
      );

    const snapshot =
      await getDocs(q);

    const records =
      snapshot.docs.sort(
        (a, b) => {

          const aData = a.data();
          const bData = b.data();

          const aTime =
            aData?.createdAt?.toMillis
              ? aData.createdAt.toMillis()
              : 0;

          const bTime =
            bData?.createdAt?.toMillis
              ? bData.createdAt.toMillis()
              : 0;

          return bTime - aTime;

        }
      );

    if (!records.length) {

      box.innerHTML = `
        <div class="empty">

          <div>📜</div>

          <h3>No History Yet</h3>

          <p>
            Your game records will appear here.
          </p>

        </div>
      `;

      return;

    }

    box.innerHTML = "";

    records.forEach(item => {

      const data =
        item.data();

      const row =
        document.createElement("div");

      row.className =
        "transaction-box";

      row.style.marginBottom =
        "10px";

      row.innerHTML = `

        <strong>
          ${escapeHTML(
            data.title ||
            data.type ||
            "Game Activity"
          )}
        </strong>

        ${
          data.amount !== undefined
            ? `
              <div style="
                margin-top:5px;
                color:#16c172;
                font-weight:800;
              ">
                TSh ${money(data.amount)}
              </div>
            `
            : ""
        }

        ${
          data.competitionName
            ? `
              <div style="
                margin-top:5px;
                color:#91ad9f;
                font-size:11px;
              ">
                ${escapeHTML(
                  data.competitionName
                )}
              </div>
            `
            : ""
        }

        <p style="
          margin-top:6px;
          color:#91ad9f;
          font-size:11px;
        ">
          ${escapeHTML(
            data.status || ""
          )}
        </p>

        ${
          data.paymentMethod
            ? `
              <div style="
                color:#91ad9f;
                font-size:10px;
              ">
                Payment: ${escapeHTML(
                  data.paymentMethod
                )}
              </div>
            `
            : ""
        }

      `;

      box.appendChild(row);

    });

  } catch (error) {

    console.error(
      "History error:",
      error
    );

    box.innerHTML = `
      <div class="empty">

        <div>⚠️</div>

        <h3>
          Unable to load history
        </h3>

        <p>
          ${escapeHTML(
            error.message ||
            "Please try again later."
          )}
        </p>

      </div>
    `;

  }

}


/* =====================================================
   TRANSACTIONS
===================================================== */

async function loadTransactions() {

  const box =
    $("transactions");

  if (!box) return;

  if (!currentUser) {

    box.innerHTML = `
      <div class="empty">
        Please login first.
      </div>
    `;

    return;

  }

  try {

    const q =
      query(
        collection(
          db,
          "gameDeposits"
        ),
        where(
          "uid",
          "==",
          currentUser.uid
        )
      );

    const snapshot =
      await getDocs(q);

    if (snapshot.empty) {

      box.innerHTML = `
        <div class="empty">
          No deposits yet.
        </div>
      `;

      return;

    }

    const records =
      snapshot.docs.sort(
        (a, b) => {

          const at =
            a.data()?.createdAt?.toMillis
              ? a.data().createdAt.toMillis()
              : 0;

          const bt =
            b.data()?.createdAt?.toMillis
              ? b.data().createdAt.toMillis()
              : 0;

          return bt - at;

        }
      );

    box.innerHTML = "";

    records.forEach(item => {

      const data =
        item.data();

      const row =
        document.createElement("div");

      row.className =
        "transaction-box";

      row.style.marginBottom =
        "10px";

      row.innerHTML = `

        <strong>
          Gamer Balance Deposit
        </strong>

        <div style="
          margin-top:5px;
          font-size:16px;
          color:#16c172;
          font-weight:800;
        ">
          TSh ${money(data.amount)}
        </div>

        <div style="
          margin-top:5px;
          color:#91ad9f;
          font-size:10px;
        ">
          Transaction ID:
          ${escapeHTML(
            data.transactionId || ""
          )}
        </div>

        <div style="
          margin-top:7px;
          font-size:11px;
          color:${
            data.status === "approved" ||
            data.status === "verified"
              ? "#16c172"
              : data.status === "rejected"
                ? "#ff7070"
                : "#ffd75a"
          };
        ">
          ${escapeHTML(
            String(
              data.status || "pending"
            ).toUpperCase()
          )}
        </div>

      `;

      box.appendChild(row);

    });

  } catch (error) {

    console.error(
      "Transactions error:",
      error
    );

    box.innerHTML = `
      <div class="empty">
        Unable to load transactions.
      </div>
    `;

  }

}


/* =====================================================
   WITHDRAWALS
===================================================== */

async function loadWithdrawals() {

  const box =
    $("withdrawalHistory");

  if (!box) return;

  if (!currentUser) {

    box.innerHTML = `
      <div class="empty">
        Please login first.
      </div>
    `;

    return;

  }

  try {

    const q =
      query(
        collection(
          db,
          "gameWithdrawals"
        ),
        where(
          "uid",
          "==",
          currentUser.uid
        )
      );

    const snapshot =
      await getDocs(q);

    if (snapshot.empty) {

      box.innerHTML = `
        <div class="empty">
          No withdrawals yet.
        </div>
      `;

      return;

    }

    const records =
      snapshot.docs.sort(
        (a, b) => {

          const at =
            a.data()?.createdAt?.toMillis
              ? a.data().createdAt.toMillis()
              : 0;

          const bt =
            b.data()?.createdAt?.toMillis
              ? b.data().createdAt.toMillis()
              : 0;

          return bt - at;

        }
      );

    box.innerHTML = "";

    records.forEach(item => {

      const data =
        item.data();

      const row =
        document.createElement("div");

      row.className =
        "transaction-box";

      row.style.marginBottom =
        "10px";

      row.innerHTML = `

        <strong>
          Withdrawal
        </strong>

        <div style="
          margin-top:5px;
          font-size:15px;
        ">
          TSh ${money(data.amount)}
        </div>

        <div style="
          margin-top:5px;
          color:#91ad9f;
          font-size:11px;
        ">
          ${escapeHTML(
            data.paymentNumber || ""
          )}
        </div>

        <div style="
          margin-top:6px;
          font-size:11px;
          color:${
            data.status === "approved" ||
            data.status === "paid"
              ? "#16c172"
              : data.status === "rejected"
                ? "#ff7070"
                : "#ffd75a"
          };
        ">
          ${escapeHTML(
            String(
              data.status || "pending"
            ).toUpperCase()
          )}
        </div>

      `;

      box.appendChild(row);

    });

  } catch (error) {

    console.error(
      "Withdrawal history error:",
      error
    );

    box.innerHTML = `
      <div class="empty">
        Unable to load withdrawals.
      </div>
    `;

  }

}


/* =====================================================
   NOTIFICATIONS
===================================================== */

async function loadNotifications() {

  const box =
    $("notificationList");

  if (!box) return;

  try {

    const q =
      query(
        collection(
          db,
          "gameNotifications"
        ),
        orderBy(
          "createdAt",
          "desc"
        )
      );

    const snapshot =
      await getDocs(q);

    if (snapshot.empty) {

      box.innerHTML = `
        <div class="empty">

          <div>🔔</div>

          <h3>No Notifications</h3>

          <p>
            New game updates will appear here.
          </p>

        </div>
      `;

      return;

    }

    box.innerHTML = "";

    snapshot.forEach(item => {

      const data =
        item.data();

      const notification =
        document.createElement("div");

      notification.className =
        "competition-card";

      notification.innerHTML = `

        <span class="competition-type">
          HASTAN GAME
        </span>

        <h3>
          ${escapeHTML(
            data.title ||
            "Notification"
          )}
        </h3>

        <p style="
          color:#91ad9f;
          font-size:12px;
          line-height:1.6;
        ">
          ${escapeHTML(
            data.message || ""
          )}
        </p>

      `;

      box.appendChild(notification);

    });

  } catch (error) {

    console.error(
      "Notification error:",
      error
    );

    box.innerHTML = `
      <div class="empty">

        <div>⚠️</div>

        <h3>
          Unable to load notifications
        </h3>

        <p>
          Please try again later.
        </p>

      </div>
    `;

  }

}


/* =====================================================
   DEPOSIT BUTTONS
===================================================== */

$("depositBtn")
  ?.addEventListener(
    "click",
    () => openPage("balance")
  );


$("balanceDepositBtn")
  ?.addEventListener(
    "click",
    () => showGameDepositForm()
  );


/* =====================================================
   WITHDRAW BUTTON
===================================================== */

$("withdrawBtn")
  ?.addEventListener(
    "click",
    () => submitGameWithdrawal()
  );


/* =====================================================
   NOTIFICATION BUTTON
===================================================== */

$("notificationBtn")
  ?.addEventListener(
    "click",
    () => openPage("notifications")
  );


/* =====================================================
   GAME WITHDRAWAL
===================================================== */

async function submitGameWithdrawal() {

  const amountEl =
    $("withdrawAmount");

  const numberEl =
    $("withdrawNumber");

  const messageEl =
    $("withdrawMessage");

  const amount =
    Number(
      amountEl?.value || 0
    );

  const phone =
    numberEl?.value?.trim() || "";

  if (!currentUser) {

    if (messageEl)
      messageEl.textContent =
        "Please login first.";

    return;

  }

  if (
    !Number.isFinite(amount) ||
    amount < 5000
  ) {

    if (messageEl)
      messageEl.textContent =
        "Minimum withdrawal is TSh 5,000.";

    return;

  }

  if (phone.length < 10) {

    if (messageEl)
      messageEl.textContent =
        "Enter a valid payment number.";

    return;

  }

  try {

    if (messageEl)
      messageEl.textContent =
        "Checking Gamer Balance...";

    const userSnap =
      await getDoc(
        doc(
          db,
          "users",
          currentUser.uid
        )
      );

    if (!userSnap.exists()) {

      if (messageEl)
        messageEl.textContent =
          "Player account not found.";

      return;

    }

    const balance =
      Number(
        userSnap.data().gamerBalance || 0
      );

    if (amount > balance) {

      if (messageEl)
        messageEl.textContent =
          "Insufficient Gamer Balance. Available: TSh " +
          balance.toLocaleString("en-TZ");

      return;

    }

    if (messageEl)
      messageEl.textContent =
        "Submitting withdrawal...";

    await addDoc(
      collection(
        db,
        "gameWithdrawals"
      ),
      {

        uid:
          currentUser.uid,

        userId:
          currentUser.uid,

        amount,

        paymentNumber:
          phone,

        status:
          "pending",

        createdAt:
          serverTimestamp()

      }
    );

    if (messageEl)
      messageEl.textContent =
        "Withdrawal submitted successfully. Waiting for admin approval.";

    if (amountEl)
      amountEl.value = "";

    if (numberEl)
      numberEl.value = "";

    await loadWithdrawals();

  } catch (error) {

    console.error(
      "Game withdrawal error:",
      error
    );

    if (messageEl)
      messageEl.textContent =
        error.message ||
        "Withdrawal failed. Please try again.";

  }

}


/* =====================================================
   GAME DEPOSIT FORM
===================================================== */

function showGameDepositForm() {

  const old =
    $("gameDepositForm");

  if (old) {

    old.remove();

    return;

  }

  const box =
    document.createElement("div");

  box.id =
    "gameDepositForm";

  box.innerHTML = `

    <div style="
      position:fixed;
      inset:0;
      background:rgba(0,0,0,.75);
      z-index:9999;
      display:flex;
      align-items:center;
      justify-content:center;
      padding:20px;
    ">

      <div style="
        width:100%;
        max-width:420px;
        background:#111;
        border-radius:18px;
        padding:22px;
        color:#fff;
      ">

        <h2 style="margin-top:0;">
          Deposit Gamer Balance
        </h2>

        <p style="opacity:.75;">
          Lipa kupitia VODACOM LIPA.
        </p>

        <div style="
          background:#1b2a24;
          padding:14px;
          border-radius:12px;
          margin:15px 0;
        ">

          <strong>
            LIPA HASTAN GLOBE
          </strong>

          <div style="
            font-size:22px;
            margin-top:6px;
          ">
            356574572
          </div>

        </div>

        <input
          id="gameDepositAmount"
          type="number"
          min="1"
          placeholder="Amount (TSh)"
          style="
            width:100%;
            box-sizing:border-box;
            margin-bottom:12px;
            padding:13px;
            border-radius:10px;
          "
        >

        <input
          id="gameDepositTransactionId"
          type="text"
          placeholder="Transaction ID"
          style="
            width:100%;
            box-sizing:border-box;
            margin-bottom:15px;
            padding:13px;
            border-radius:10px;
          "
        >

        <button
          type="button"
          id="submitGameDeposit"
          style="
            width:100%;
            padding:13px;
            border:0;
            border-radius:10px;
          "
        >
          SUBMIT DEPOSIT
        </button>

        <button
          type="button"
          id="closeGameDeposit"
          style="
            width:100%;
            padding:11px;
            margin-top:8px;
            border:0;
            border-radius:10px;
          "
        >
          CANCEL
        </button>

        <div
          id="gameDepositMessage"
          style="
            margin-top:12px;
            font-size:13px;
          "
        ></div>

      </div>

    </div>

  `;

  document.body.appendChild(box);

  $("submitGameDeposit")
    ?.addEventListener(
      "click",
      submitGameDeposit
    );

  $("closeGameDeposit")
    ?.addEventListener(
      "click",
      () => box.remove()
    );

}


/* =====================================================
   SUBMIT GAME DEPOSIT
===================================================== */

async function submitGameDeposit() {

  const amountEl =
    $("gameDepositAmount");

  const transactionEl =
    $("gameDepositTransactionId");

  const messageEl =
    $("gameDepositMessage");

  const amount =
    Number(
      amountEl?.value || 0
    );

  const transactionId =
    transactionEl?.value?.trim() || "";

  if (!currentUser) {

    if (messageEl)
      messageEl.textContent =
        "Please login first.";

    return;

  }

  if (amount <= 0) {

    if (messageEl)
      messageEl.textContent =
        "Enter a valid amount.";

    return;

  }

  if (!transactionId) {

    if (messageEl)
      messageEl.textContent =
        "Enter transaction ID.";

    return;

  }

  try {

    if (messageEl)
      messageEl.textContent =
        "Submitting deposit...";

    await addDoc(
      collection(
        db,
        "gameDeposits"
      ),
      {

        uid:
          currentUser.uid,

        userId:
          currentUser.uid,

        amount,

        transactionId,

        paymentNumber:
          "356574572",

        merchantName:
          "LIPA HASTAN GLOBE",

        status:
          "pending",

        createdAt:
          serverTimestamp()

      }
    );

    if (messageEl)
      messageEl.innerHTML = `
        <span style="
          color:#16c172;
          font-weight:700;
        ">
          ✓ Deposit submitted successfully.
        </span>

        <br>

        <span style="
          color:#91ad9f;
          font-size:11px;
        ">
          Waiting for Admin verification.
        </span>
      `;

    if (amountEl)
      amountEl.value = "";

    if (transactionEl)
      transactionEl.value = "";

    await loadTransactions();

  } catch (error) {

    console.error(
      "Game deposit error:",
      error
    );

    if (messageEl)
      messageEl.textContent =
        error.message ||
        "Deposit failed. Please try again.";

  }

}


/* =====================================================
   FIRESTORE ERROR
===================================================== */

function getFirestoreErrorMessage(error) {

  if (!error)
    return "Something went wrong.";

  if (
    error.code ===
    "permission-denied"
  ) {

    return (
      "Permission denied while completing this request."
    );

  }

  if (
    error.code ===
    "already-exists"
  ) {

    return (
      "This record already exists."
    );

  }

  return (
    error.message ||
    "Unable to complete the request."
  );

}


/* =====================================================
   MONEY
===================================================== */

function money(value) {

  return Number(
    value || 0
  ).toLocaleString(
    "en-TZ"
  );

}


/* =====================================================
   DATE
===================================================== */

function formatDate(value) {

  if (!value)
    return "Not set";

  try {

    const date =
      typeof value.toDate === "function"
        ? value.toDate()
        : new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    )
      return "Not set";

    return date.toLocaleDateString(
      "en-TZ",
      {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }
    );

  } catch (error) {

    return "Not set";

  }

}


/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHTML(value) {

  return String(
    value ?? ""
  )
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );

}


/* =====================================================
   END
===================================================== */