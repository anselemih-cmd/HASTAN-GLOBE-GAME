import { auth, db } from "./firebase-config.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  collection,
  getDocs,
  getDoc,
  query,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  writeBatch,
  runTransaction,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =====================================================
   HASTAN GAME - MAIN ADMIN
===================================================== */

const MAIN_ADMIN_UID =
  "FkMOO6jsgJZvnJV36sl3RrHLd063";

let currentUser = null;


/* =====================================================
   ELEMENT
===================================================== */

const $ = id =>
  document.getElementById(id);

function setText(id, value) {
  const el = $(id);
  if (el) el.textContent = value;
}


/* =====================================================
   PAGES
===================================================== */

const pages = [
  "dashboardPage",
  "verificationPage",
  "depositsPage",
  "withdrawalsPage",
  "competitionsPage",
  "matchesPage",
  "resultsPage",
  "playersPage",
  "notificationsPage",
  "statisticsPage",
  "standingsPage",
  "historyPage"
];


/* =====================================================
   AUTH
===================================================== */

onAuthStateChanged(auth, async user => {

  if (!user) {

    currentUser = null;

    $("adminLoginOverlay")
      ?.classList.remove("hidden");

    $("adminApp")
      ?.classList.add("hidden");

    return;
  }


  if (user.uid !== MAIN_ADMIN_UID) {

    currentUser = null;

    alert(
      "Access denied. Main Admin only."
    );

    try {
      await signOut(auth);
    } catch (error) {
      console.error(error);
    }

    return;
  }


  currentUser = user;


  $("adminLoginOverlay")
    ?.classList.add("hidden");

  $("adminApp")
    ?.classList.remove("hidden");


  await loadDashboard();
  await loadCompetitions();
  await loadVerification();
  await loadMatches();
  await loadResults();

});


/* =====================================================
   NAVIGATION
===================================================== */

function openPage(pageId) {

  if (!pageId) return;


  pages.forEach(id => {

    const page = $(id);

    if (page) {

      page.classList.add("hidden");
      page.classList.remove("active");

    }

  });


  const target = $(pageId);


  if (!target) {

    console.warn(
      "Page not found:",
      pageId
    );

    return;
  }


  target.classList.remove("hidden");
  target.classList.add("active");


  document
    .querySelectorAll(
      "[data-page], [data-admin-page]"
    )
    .forEach(btn => {

      const btnPage =
        btn.dataset.page ||
        btn.dataset.adminPage;

      btn.classList.toggle(
        "active",
        btnPage === pageId
      );

    });


  $("sideMenu")
    ?.classList.remove("open");

  $("overlay")
    ?.classList.remove("show");


  if (pageId === "dashboardPage")
    loadDashboard();

  if (pageId === "verificationPage")
    loadVerification();

  if (pageId === "depositsPage")
    loadDeposits();
  if (pageId === "withdrawalsPage")
    loadWithdrawals();


  if (pageId === "competitionsPage")
    loadCompetitions();

  if (pageId === "matchesPage")
    loadMatches();

  if (pageId === "resultsPage")
    loadResults();

  if (pageId === "playersPage")
    loadPlayers();

  if (pageId === "statisticsPage")
    loadStatistics();

  if (pageId === "standingsPage")
    loadStandings();

  if (pageId === "historyPage")
    loadHistory();

  if (pageId === "notificationsPage")
    loadNotifications();


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}


/* =====================================================
   NAVIGATION BUTTONS
===================================================== */

document.addEventListener(
  "click",
  event => {

    const button =
      event.target.closest(
        "[data-page], [data-admin-page]"
      );

    if (!button) return;


    const page =
      button.dataset.page ||
      button.dataset.adminPage;


    if (!page) return;


    event.preventDefault();

    openPage(page);

  }
);


/* =====================================================
   MOBILE MENU
===================================================== */

$("menuBtn")?.addEventListener(
  "click",
  () => {

    $("sideMenu")
      ?.classList.toggle("open");

    $("overlay")
      ?.classList.toggle("show");

  }
);


$("overlay")?.addEventListener(
  "click",
  () => {

    $("sideMenu")
      ?.classList.remove("open");

    $("overlay")
      ?.classList.remove("show");

  }
);


/* =====================================================
   LOGOUT
===================================================== */

$("logoutBtn")?.addEventListener(
  "click",
  async () => {

    try {

      await signOut(auth);

    } catch (error) {

      console.error(error);

      alert(
        "Logout failed."
      );

    }

  }
);


/* =====================================================
   DASHBOARD
===================================================== */

async function loadDashboard() {

  try {

    const [
      usersSnap,
      competitionsSnap,
      matchesSnap,
      paymentsSnap,
      withdrawalsSnap
    ] = await Promise.all([

      getDocs(
        collection(
          db,
          "users"
        )
      ),

      getDocs(
        collection(
          db,
          "gameCompetitions"
        )
      ),

      getDocs(
        collection(
          db,
          "gameMatches"
        )
      ),

      getDocs(
        collection(
          db,
          "gameCompetitionPayments"
        )
      ),

      getDocs(
        collection(
          db,
          "gameWithdrawals"
        )
      )

    ]);


    setText(
      "totalPlayers",
      usersSnap.size
    );


    setText(
      "totalCompetitions",
      competitionsSnap.size
    );


    setText(
      "totalMatches",
      matchesSnap.size
    );


    const pendingPayments =
      paymentsSnap.docs.filter(
        d =>
          d.data().status ===
          "pending"
      ).length;


    setText(
      "pendingPayments",
      pendingPayments
    );


    const pendingWithdrawals =
      withdrawalsSnap.docs.filter(
        d =>
          d.data().status ===
          "pending"
      ).length;


    setText(
      "pendingWithdrawals",
      pendingWithdrawals
    );


    const pendingResults =
      matchesSnap.docs.filter(
        d =>
          isResultAwaitingVerification(
            d.data()
          )
      ).length;


    setText(
      "pendingResults",
      pendingResults
    );


    setText(
      "totalTransactions",
      paymentsSnap.size
    );


  } catch (error) {

    console.error(
      "Dashboard error:",
      error
    );

  }

}

/* =====================================================
   HISTORY SAVE
===================================================== */

async function saveHistory(data = {}) {

  if (!currentUser) return;


  try {

    await addDoc(
      collection(
        db,
        "gameHistory"
      ),
      {

        title:
          data.title ||
          "Game Activity",

        type:
          data.type ||
          "admin_action",

        action:
          data.action ||
          "",

        status:
          data.status ||
          "completed",

        uid:
          data.uid ||
          data.userId ||
          "",

        userId:
          data.userId ||
          data.uid ||
          "",

        competitionId:
          data.competitionId ||
          "",

        competitionName:
          data.competitionName ||
          "",

        matchId:
          data.matchId ||
          "",

        message:
          data.message ||
          "",

        amount:
          data.amount ??
          null,

        actorUid:
          currentUser.uid,

        createdAt:
          serverTimestamp()

      }
    );


    console.log(
      "History record saved."
    );


  } catch (error) {

    console.error(
      "History save error:",
      error
    );

  }

}


/* =====================================================
   PAYMENT VERIFICATION
===================================================== */

async function loadVerification() {

  const list =
    $("verificationList");


  if (!list) return;


  list.innerHTML =
    `<div class="loading">
      Loading payment verification...
    </div>`;


  try {

    const q =
      query(
        collection(
          db,
          "gameCompetitionPayments"
        ),
        orderBy(
          "createdAt",
          "desc"
        )
      );


    const snapshot =
      await getDocs(q);


    if (snapshot.empty) {

      list.innerHTML =
        `<div class="empty">
          <div>💳</div>
          <h3>No Payment Records</h3>
          <p>Player payments will appear here.</p>
        </div>`;

      return;
    }


    list.innerHTML = "";


    snapshot.forEach(item => {

      list.appendChild(
        createPaymentCard(
          item.id,
          item.data()
        )
      );

    });


  } catch (error) {

    console.error(
      "Verification error:",
      error
    );


    list.innerHTML =
      `<div class="empty">
        <div>⚠️</div>
        <h3>Unable to load payments</h3>
        <p>${escapeHTML(
          getFirestoreErrorMessage(error)
        )}</p>
      </div>`;

  }

}


/* =====================================================
   PAYMENT CARD
===================================================== */

function createPaymentCard(
  paymentId,
  data
) {

  const card =
    document.createElement(
      "article"
    );


  card.className =
    "admin-item";


  const status =
    String(
      data.status ||
      "pending"
    ).toLowerCase();


  const statusClass =
    status === "approved"
      ? "approved"
      : status === "rejected"
        ? "rejected"
        : "pending";


  card.innerHTML = `

    <div class="admin-item-header">

      <strong>
        ${escapeHTML(
          data.competitionName ||
          "Competition Payment"
        )}
      </strong>

      <span class="${statusClass}">
        ${escapeHTML(
          status.toUpperCase()
        )}
      </span>

    </div>


    <div class="admin-item-body">

      <p>
        <strong>User ID:</strong>
        ${escapeHTML(
          data.userId || ""
        )}
      </p>

      <p>
        <strong>Transaction ID:</strong>
        ${escapeHTML(
          data.transactionId || ""
        )}
      </p>

      <p>
        <strong>Amount:</strong>
        TSh ${money(data.amount)}
      </p>

      <p>
        <strong>Payment Number:</strong>
        ${escapeHTML(
          data.paymentNumber ||
          "356574572"
        )}
      </p>

      <p>
        <strong>Date:</strong>
        ${escapeHTML(
          formatDate(
            data.createdAt
          )
        )}
      </p>

    </div>


    ${
      status === "pending"
        ? `

          <div
            class="admin-actions"
            style="
              display:grid;
              grid-template-columns:repeat(2,minmax(0,1fr));
              gap:12px;
              margin-top:18px;
              width:100%;
            "
          >

            <button
              class="approve-btn"
              data-payment-approve="${escapeHTML(
                paymentId
              )}"
              style="
                width:100%;
                min-height:46px;
                padding:12px 14px;
                border-radius:12px;
                font-weight:700;
                cursor:pointer;
                border:1px solid rgba(70,220,130,.35);
                white-space:normal;
              "
            >
              ✓ APPROVE
            </button>

            <button
              class="reject-btn"
              data-payment-reject="${escapeHTML(
                paymentId
              )}"
              style="
                width:100%;
                min-height:46px;
                padding:12px 14px;
                border-radius:12px;
                font-weight:700;
                cursor:pointer;
                border:1px solid rgba(255,80,80,.35);
                white-space:normal;
              "
            >
              ✕ REJECT
            </button>

          </div>

        `
        : ""
    }

  `;


  card
    .querySelector(
      "[data-payment-approve]"
    )
    ?.addEventListener(
      "click",
      () =>
        approveGamePayment(
          paymentId
        )
    );


  card
    .querySelector(
      "[data-payment-reject]"
    )
    ?.addEventListener(
      "click",
      () =>
        rejectGamePayment(
          paymentId
        )
    );


  return card;

}


/* =====================================================
   APPROVE PAYMENT
===================================================== */

async function approveGamePayment(
  paymentId
) {

  if (!currentUser)
    return;


  if (
    !confirm(
      "Approve this competition payment?"
    )
  )
    return;


  try {

    const paymentRef =
      doc(
        db,
        "gameCompetitionPayments",
        paymentId
      );


    const paymentSnap =
      await getDoc(
        paymentRef
      );


    if (!paymentSnap.exists()) {

      alert(
        "Payment record not found."
      );

      return;
    }


    const payment =
      paymentSnap.data();


    if (
      payment.status ===
      "approved"
    ) {

      alert(
        "This payment is already approved."
      );

      return;
    }


    await updateDoc(
      paymentRef,
      {

        status:
          "approved",

        verifiedBy:
          currentUser.uid,

        verifiedAt:
          serverTimestamp(),

        updatedAt:
          serverTimestamp()

      }
    );


    const playerId =
      `${payment.competitionId}_${payment.userId}`;


    const playerRef =
      doc(
        db,
        "gameCompetitionPlayers",
        playerId
      );


    const playerSnap =
      await getDoc(
        playerRef
      );


    if (playerSnap.exists()) {

      await updateDoc(
        playerRef,
        {

          paymentStatus:
            "approved",

          status:
            "joined",

          approvedAt:
            serverTimestamp(),

          approvedBy:
            currentUser.uid

        }
      );

    }


    await saveHistory({

      title:
        "Competition Payment Approved",

      type:
        "payment",

      action:
        "payment_approved",

      status:
        "approved",

      uid:
        payment.userId,

      userId:
        payment.userId,

      competitionId:
        payment.competitionId,

      competitionName:
        payment.competitionName,

      amount:
        payment.amount || 0,

      message:
        `Payment approved: TSh ${money(
          payment.amount
        )}`

    });


    alert(
      "Payment approved successfully."
    );


    await loadVerification();
    await loadDashboard();


    if (
      $("historyPage")?.classList.contains(
        "active"
      )
    ) {
      await loadHistory();
    }


  } catch (error) {

    console.error(
      "Approve payment error:",
      error
    );


    alert(
      getFirestoreErrorMessage(
        error
      )
    );

  }

}


/* =====================================================
   REJECT PAYMENT
===================================================== */

async function rejectGamePayment(
  paymentId
) {

  if (!currentUser)
    return;


  if (
    !confirm(
      "Reject this competition payment?"
    )
  )
    return;


  try {

    const paymentRef =
      doc(
        db,
        "gameCompetitionPayments",
        paymentId
      );


    const paymentSnap =
      await getDoc(
        paymentRef
      );


    if (!paymentSnap.exists()) {

      alert(
        "Payment record not found."
      );

      return;
    }


    const payment =
      paymentSnap.data();


    await updateDoc(
      paymentRef,
      {

        status:
          "rejected",

        verifiedBy:
          currentUser.uid,

        verifiedAt:
          serverTimestamp(),

        updatedAt:
          serverTimestamp()

      }
    );


    const playerId =
      `${payment.competitionId}_${payment.userId}`;


    const playerRef =
      doc(
        db,
        "gameCompetitionPlayers",
        playerId
      );


    const playerSnap =
      await getDoc(
        playerRef
      );


    if (playerSnap.exists()) {

      await updateDoc(
        playerRef,
        {

          paymentStatus:
            "unpaid",

          status:
            "joined",

          updatedAt:
            serverTimestamp()

        }
      );

    }


    await saveHistory({

      title:
        "Competition Payment Rejected",

      type:
        "payment",

      action:
        "payment_rejected",

      status:
        "rejected",

      uid:
        payment.userId,

      userId:
        payment.userId,

      competitionId:
        payment.competitionId,

      competitionName:
        payment.competitionName,

      amount:
        payment.amount || 0,

      message:
        `Payment rejected: TSh ${money(
          payment.amount
        )}`

    });


    alert(
      "Payment rejected."
    );


    await loadVerification();
    await loadDashboard();


    if (
      $("historyPage")?.classList.contains(
        "active"
      )
    ) {
      await loadHistory();
    }


  } catch (error) {

    console.error(
      "Reject payment error:",
      error
    );


    alert(
      getFirestoreErrorMessage(
        error
      )
    );

  }

}


/* =====================================================
   RESULT STATUS
===================================================== */

function isResultAwaitingVerification(
  match
) {

  const status =
    String(
      match?.resultStatus ||
      ""
    )
    .toLowerCase()
    .trim();


  return (

    status === "pending" ||

    status === "submitted" ||

    status ===
      "awaiting_verification" ||

    (
      match?.resultSubmittedBy &&
      match?.resultSubmittedAt &&
      status !== "verified" &&
      status !== "rejected"
    )

  );

}


/* =====================================================
   RESULTS
===================================================== */

async function loadResults() {

  const list =
    $("resultList") ||
    $("resultsList");


  if (!list) {

    console.warn(
      "resultList element not found."
    );

    return;
  }


  list.innerHTML =
    `<div class="loading">
      Loading match results...
    </div>`;


  try {

    const matchesQuery =
      query(
        collection(
          db,
          "gameMatches"
        ),
        orderBy(
          "createdAt",
          "desc"
        )
      );


    const snapshot =
      await getDocs(
        matchesQuery
      );


    const pendingResults =
      snapshot.docs.filter(
        matchDoc =>
          isResultAwaitingVerification(
            matchDoc.data()
          )
      );


    setText(
      "pendingResults",
      pendingResults.length
    );


    if (!pendingResults.length) {

      list.innerHTML = `

        <div class="empty">

          <div>🏆</div>

          <h3>
            No Pending Results
          </h3>

          <p>
            Player-submitted match results
            will appear here for verification.
          </p>

        </div>

      `;

      return;
    }


    list.innerHTML = "";


    pendingResults.forEach(
      matchDoc => {

        list.appendChild(
          createResultVerificationCard(
            matchDoc.id,
            matchDoc.data()
          )
        );

      }
    );


  } catch (error) {

    console.error(
      "Result verification loading error:",
      error
    );


    list.innerHTML = `

      <div class="empty">

        <div>⚠️</div>

        <h3>
          Unable to load results
        </h3>

        <p>
          ${escapeHTML(
            getFirestoreErrorMessage(
              error
            )
          )}
        </p>

      </div>

    `;

  }

}


/* =====================================================
   RESULT CARD
===================================================== */

function createResultVerificationCard(
  matchId,
  match
) {

  const card =
    document.createElement(
      "article"
    );


  card.className =
    "admin-item";


  const imageUrl =
    match.resultImageUrl ||
    match.resultScreenshotUrl ||
    match.screenshotUrl ||
    match.evidenceImageUrl ||
    "";


  const homeScore =
    match.homeScore ??
    "-";


  const awayScore =
    match.awayScore ??
    "-";


  card.innerHTML = `

    <div class="admin-item-header">

      <strong>
        ${escapeHTML(
          match.competitionName ||
          "HASTAN MATCH"
        )}
      </strong>

      <span class="pending">
        PENDING VERIFICATION
      </span>

    </div>


    <div class="admin-item-body">

      <p>
        <strong>Type:</strong>
        ${escapeHTML(
          match.competitionType ||
          "Match"
        )}
      </p>


      <p>
        <strong>Round:</strong>
        ${escapeHTML(
          match.round ||
          "Match"
        )}
      </p>


      <div style="
        margin:15px 0;
        padding:16px;
        border-radius:14px;
        background:#06110d;
        border:1px solid #1d4934;
        text-align:center;
      ">

        <div style="
          color:#91ad9f;
          font-size:10px;
          margin-bottom:8px;
        ">
          FINAL SCORE
        </div>


        <strong style="
          display:block;
          font-size:20px;
          line-height:1.6;
          letter-spacing:1px;
          word-break:break-word;
        ">

          ${escapeHTML(
            match.homePlayerName ||
            match.homeUsername ||
            "HOME"
          )}

          &nbsp;

          ${escapeHTML(
            homeScore
          )}

          -

          ${escapeHTML(
            awayScore
          )}

          &nbsp;

          ${escapeHTML(
            match.awayPlayerName ||
            match.awayUsername ||
            "AWAY"
          )}

        </strong>

      </div>


      <p>
        <strong>Home Player:</strong>
        ${escapeHTML(
          match.homePlayerName ||
          match.homeUsername ||
          match.homePlayerId ||
          "Player"
        )}
      </p>


      <p>
        <strong>Away Player:</strong>
        ${escapeHTML(
          match.awayPlayerName ||
          match.awayUsername ||
          match.awayPlayerId ||
          "Player"
        )}
      </p>


      <p>
        <strong>Submitted By:</strong>
        ${escapeHTML(
          match.resultSubmittedBy ||
          ""
        )}
      </p>


      <p>
        <strong>Submitted At:</strong>
        ${escapeHTML(
          formatDate(
            match.resultSubmittedAt
          )
        )}
      </p>


      <p>
        <strong>Match ID:</strong>
        ${escapeHTML(
          matchId
        )}
      </p>

    </div>


    ${
      imageUrl
        ? `

          <div style="
            margin-top:15px;
          ">

            <div style="
              color:#91ad9f;
              font-size:10px;
              margin-bottom:7px;
            ">
              MATCH RESULT EVIDENCE
            </div>


            <div style="
              border:1px solid #1d4934;
              border-radius:14px;
              overflow:hidden;
              background:#000;
            ">

              <img
                src="${escapeHTML(
                  imageUrl
                )}"
                alt="Match result evidence"
                style="
                  display:block;
                  width:100%;
                  max-height:420px;
                  object-fit:contain;
                  background:#000;
                "
                loading="lazy"
              >

            </div>

          </div>

        `
        : `

          <div style="
            margin-top:14px;
            padding:12px;
            border-radius:10px;
            background:rgba(255,70,70,.08);
            border:1px solid rgba(255,70,70,.2);
            color:#ff7070;
            font-size:12px;
          ">
            ⚠️ No result image found.
          </div>

        `
    }


    <div
      class="admin-actions"
      style="
        display:grid;
        grid-template-columns:repeat(2,minmax(0,1fr));
        gap:12px;
        margin-top:20px;
        width:100%;
      "
    >

      <button
        class="approve-btn"
        data-result-action="approve"
        data-match-id="${escapeHTML(
          matchId
        )}"
        style="
          width:100%;
          min-height:48px;
          padding:12px 14px;
          border-radius:12px;
          font-size:13px;
          font-weight:800;
          cursor:pointer;
          border:1px solid rgba(70,220,130,.35);
          white-space:normal;
        "
      >
        ✓ APPROVE RESULT
      </button>


      <button
        class="reject-btn"
        data-result-action="reject"
        data-match-id="${escapeHTML(
          matchId
        )}"
        style="
          width:100%;
          min-height:48px;
          padding:12px 14px;
          border-radius:12px;
          font-size:13px;
          font-weight:800;
          cursor:pointer;
          border:1px solid rgba(255,80,80,.35);
          white-space:normal;
        "
      >
        ✕ REJECT RESULT
      </button>

    </div>

  `;


  card
    .querySelector(
      '[data-result-action="approve"]'
    )
    ?.addEventListener(
      "click",
      () =>
        approveMatchResult(
          matchId
        )
    );


  card
    .querySelector(
      '[data-result-action="reject"]'
    )
    ?.addEventListener(
      "click",
      () =>
        rejectMatchResult(
          matchId
        )
    );


  return card;

}


/* =====================================================
   APPROVE RESULT
===================================================== */

async function approveMatchResult(
  matchId
) {

  if (!currentUser)
    return;


  if (
    !confirm(
      "Approve this match result?"
    )
  )
    return;


  try {

    const matchRef =
      doc(
        db,
        "gameMatches",
        matchId
      );


    const matchSnap =
      await getDoc(
        matchRef
      );


    if (!matchSnap.exists()) {

      alert(
        "Match not found."
      );

      return;
    }


    const match =
      matchSnap.data();


    if (
      match.resultStatus ===
      "verified"
    ) {

      alert(
        "This result is already verified."
      );

      return;
    }


    if (
      !isResultAwaitingVerification(
        match
      )
    ) {

      alert(
        "This result is no longer waiting for verification."
      );

      await loadResults();

      return;
    }


    await updateDoc(
      matchRef,
      {

        resultStatus:
          "verified",

        status:
          "completed",

        resultVerifiedBy:
          currentUser.uid,

        resultVerifiedAt:
          serverTimestamp(),

        updatedAt:
          serverTimestamp(),

        updatedBy:
          currentUser.uid

      }
    );


    /* =================================================
       BUILD / UPDATE STANDINGS
    ================================================= */

    if (match.competitionId) {

      try {

        await rebuildCompetitionStandings(
          match.competitionId
        );

      } catch (standingsError) {

        console.error(
          "Standings rebuild error:",
          standingsError
        );

        alert(
          "Result approved, but standings could not be rebuilt. Check gameStandings rules."
        );

      }

    }


    await saveHistory({

      title:
        "Match Result Approved",

      type:
        "match_result",

      action:
        "result_approved",

      status:
        "verified",

      uid:
        match.resultSubmittedBy ||
        "",

      userId:
        match.resultSubmittedBy ||
        "",

      competitionId:
        match.competitionId ||
        "",

      competitionName:
        match.competitionName ||
        "",

      matchId:
        matchId,

      message:
        `${match.homePlayerName || "Home"} ${match.homeScore ?? 0} - ${match.awayScore ?? 0} ${match.awayPlayerName || "Away"}`

    });


    alert(
      "Match result approved and standings updated successfully."
    );


    await loadResults();
    await loadMatches();
    await loadDashboard();


    if (
      $("historyPage")?.classList.contains(
        "active"
      )
    ) {
      await loadHistory();
    }


    if (
      $("standingsPage")?.classList.contains(
        "active"
      )
    ) {
      await loadStandings();
    }


  } catch (error) {

    console.error(
      "Approve result error:",
      error
    );


    alert(
      getFirestoreErrorMessage(
        error
      )
    );

  }

}


/* =====================================================
   REJECT RESULT
===================================================== */

async function rejectMatchResult(
  matchId
) {

  if (!currentUser)
    return;


  if (
    !confirm(
      "Reject this match result? The player can submit again."
    )
  )
    return;


  try {

    const matchRef =
      doc(
        db,
        "gameMatches",
        matchId
      );


    const matchSnap =
      await getDoc(
        matchRef
      );


    if (!matchSnap.exists()) {

      alert(
        "Match not found."
      );

      return;
    }


    const match =
      matchSnap.data();


    if (
      match.resultStatus ===
      "verified"
    ) {

      alert(
        "A verified result cannot be rejected."
      );

      return;
    }


    if (
      !isResultAwaitingVerification(
        match
      )
    ) {

      alert(
        "This result is no longer waiting for verification."
      );

      await loadResults();

      return;
    }


    await updateDoc(
      matchRef,
      {

        resultStatus:
          "rejected",

        status:
          "pending",

        resultRejectedBy:
          currentUser.uid,

        resultRejectedAt:
          serverTimestamp(),

        updatedAt:
          serverTimestamp(),

        updatedBy:
          currentUser.uid

      }
    );


    await saveHistory({

      title:
        "Match Result Rejected",

      type:
        "match_result",

      action:
        "result_rejected",

      status:
        "rejected",

      uid:
        match.resultSubmittedBy ||
        "",

      userId:
        match.resultSubmittedBy ||
        "",

      competitionId:
        match.competitionId ||
        "",

      competitionName:
        match.competitionName ||
        "",

      matchId:
        matchId,

      message:
        `Result rejected for ${match.homePlayerName || "Home"} vs ${match.awayPlayerName || "Away"}`

    });


    alert(
      "Result rejected. Player can submit again."
    );


    await loadResults();
    await loadMatches();
    await loadDashboard();


    if (
      $("historyPage")?.classList.contains(
        "active"
      )
    ) {
      await loadHistory();
    }


  } catch (error) {

    console.error(
      "Reject result error:",
      error
    );


    alert(
      getFirestoreErrorMessage(
        error
      )
    );

  }

}


/* =====================================================
   COMPETITIONS
===================================================== */

async function loadCompetitions() {

  const list =
    $("competitionList") ||
    $("competitionsList");


  if (!list) return;


  list.innerHTML =
    `<div class="loading">
      Loading competitions...
    </div>`;


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

      list.innerHTML =
        `<div class="empty">
          <div>🏆</div>
          <h3>No Competitions</h3>
          <p>Create a competition to begin.</p>
        </div>`;

      return;
    }


    list.innerHTML = "";


    snapshot.forEach(item => {

      list.appendChild(
        createCompetitionAdminCard(
          item.id,
          item.data()
        )
      );

    });


  } catch (error) {

    console.error(
      "Competitions error:",
      error
    );


    list.innerHTML =
      `<div class="empty">
        <div>⚠️</div>
        <h3>Unable to load competitions</h3>
        <p>${escapeHTML(
          getFirestoreErrorMessage(
            error
          )
        )}</p>
      </div>`;

  }

}


/* =====================================================
   CREATE COMPETITION
===================================================== */

$("createCompetitionBtn")
  ?.addEventListener(
    "click",
    () => {

      const form =
        $("competitionForm");

      if (!form) return;


      form.style.display =
        form.style.display === "none"
          ? "block"
          : "none";


      if (
        form.style.display ===
        "block"
      ) {

        form.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });

      }

    }
  );


$("cancelCompetitionBtn")
  ?.addEventListener(
    "click",
    () => {

      const form =
        $("competitionForm");

      if (form)
        form.style.display =
          "none";

    }
  );


$("competitionCreateForm")
  ?.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      if (!currentUser)
        return;


      const message =
        $("competitionFormMessage");


      const name =
        $("competitionName")
          ?.value.trim();


      const type =
        $("competitionType")
          ?.value;


      const entryFee =
        Number(
          $("entryFee")?.value ||
          0
        );


      const maxPlayers =
        Number(
          $("maxPlayers")?.value ||
          0
        );


      const firstPrize =
        Number(
          $("firstPrize")?.value ||
          0
        );


      const secondPrize =
        Number(
          $("secondPrize")?.value ||
          0
        );


      const thirdPrize =
        Number(
          $("thirdPrize")?.value ||
          0
        );


      const startValue =
        $("startAt")?.value;


      const rules =
        $("competitionRules")
          ?.value.trim() ||
        "";


      const joiningOpen =
        $("joiningStatus")
          ?.value === "open";


      const paymentOpen =
        $("paymentStatus")
          ?.value === "open";


      if (
        !name ||
        !type ||
        !entryFee ||
        !maxPlayers ||
        !firstPrize ||
        !startValue
      ) {

        if (message) {

          message.textContent =
            "Please fill all required fields.";

        }

        return;
      }


      try {

        if (message) {

          message.textContent =
            "Creating competition...";

        }


        const competitionRef =
          await addDoc(
            collection(
              db,
              "gameCompetitions"
            ),
            {

              name,

              type,

              entryFee,

              maxPlayers,

              firstPrize,

              secondPrize,

              thirdPrize,

              rules,

              joiningOpen,

              paymentOpen,

              status:
                "draft",

              playersCount:
                0,

              fixturesGenerated:
                false,

              fixturesCount:
                0,

              startAt:
                new Date(startValue),

              createdAt:
                serverTimestamp(),

              createdBy:
                currentUser.uid

            }
          );


        await saveHistory({

          title:
            "Competition Created",

          type:
            "competition",

          action:
            "competition_created",

          status:
            "created",

          competitionId:
            competitionRef.id,

          competitionName:
            name,

          message:
            `${type} competition created. Entry fee TSh ${money(entryFee)}`

        });


        alert(
          "Competition created successfully."
        );


        $("competitionCreateForm")
          ?.reset();


        const form =
          $("competitionForm");


        if (form)
          form.style.display =
            "none";


        await loadCompetitions();
        await loadDashboard();


      } catch (error) {

        console.error(
          "Create competition error:",
          error
        );


        if (message) {

          message.textContent =
            getFirestoreErrorMessage(
              error
            );

        }

      }

    }
  );


/* =====================================================
   COMPETITION CARD
===================================================== */

function createCompetitionAdminCard(
  id,
  data
) {

  const card =
    document.createElement(
      "article"
    );


  card.className =
    "admin-item";


  const joining =
    data.joiningOpen === true;


  const payment =
    data.paymentOpen === true;


  card.innerHTML = `

    <div class="admin-item-header">

      <strong>
        ${escapeHTML(
          data.name ||
          "HASTAN COMPETITION"
        )}
      </strong>

      <span>
        ${escapeHTML(
          data.type ||
          "Competition"
        )}
      </span>

    </div>


    <div class="admin-item-body">

      <p>
        <strong>Entry:</strong>
        TSh ${money(
          data.entryFee
        )}
      </p>


      <p>
        <strong>Players:</strong>
        ${escapeHTML(
          data.playersCount ||
          0
        )}
        /
        ${escapeHTML(
          data.maxPlayers ||
          0
        )}
      </p>


      <p>
        <strong>Joining:</strong>
        ${joining
          ? "OPEN"
          : "CLOSED"}
      </p>


      <p>
        <strong>Payment:</strong>
        ${payment
          ? "OPEN"
          : "CLOSED"}
      </p>


      <p>
        <strong>Fixtures:</strong>
        ${
          data.fixturesGenerated === true
            ? "GENERATED"
            : "NOT GENERATED"
        }
      </p>


      <p>
        <strong>Status:</strong>
        ${escapeHTML(
          data.status ||
          "draft"
        )}
      </p>


      <p>
        <strong>Start:</strong>
        ${escapeHTML(
          formatDate(
            data.startAt
          )
        )}
      </p>

    </div>


    <div
      class="admin-actions competition-actions"
      style="
        display:grid;
        grid-template-columns:repeat(2,minmax(0,1fr));
        gap:10px;
        margin-top:18px;
        width:100%;
      "
    >

      <button
        data-comp-action="open-joining"
        data-id="${escapeHTML(id)}"
        style="
          width:100%;
          min-height:44px;
          padding:11px 10px;
          border-radius:11px;
          font-size:12px;
          font-weight:800;
          cursor:pointer;
          white-space:normal;
        "
      >
        OPEN JOINING
      </button>


      <button
        data-comp-action="close-joining"
        data-id="${escapeHTML(id)}"
        style="
          width:100%;
          min-height:44px;
          padding:11px 10px;
          border-radius:11px;
          font-size:12px;
          font-weight:800;
          cursor:pointer;
          white-space:normal;
        "
      >
        CLOSE JOINING
      </button>


      <button
        data-comp-action="open-payment"
        data-id="${escapeHTML(id)}"
        style="
          width:100%;
          min-height:44px;
          padding:11px 10px;
          border-radius:11px;
          font-size:12px;
          font-weight:800;
          cursor:pointer;
          white-space:normal;
        "
      >
        OPEN PAYMENT
      </button>


      <button
        data-comp-action="close-payment"
        data-id="${escapeHTML(id)}"
        style="
          width:100%;
          min-height:44px;
          padding:11px 10px;
          border-radius:11px;
          font-size:12px;
          font-weight:800;
          cursor:pointer;
          white-space:normal;
        "
      >
        CLOSE PAYMENT
      </button>


      <button
        data-comp-action="start"
        data-id="${escapeHTML(id)}"
        style="
          width:100%;
          min-height:44px;
          padding:11px 10px;
          border-radius:11px;
          font-size:12px;
          font-weight:800;
          cursor:pointer;
          white-space:normal;
        "
      >
        ▶ START
      </button>


      <button
        data-comp-action="generate-fixtures"
        data-id="${escapeHTML(id)}"
        style="
          width:100%;
          min-height:44px;
          padding:11px 10px;
          border-radius:11px;
          font-size:12px;
          font-weight:800;
          cursor:pointer;
          white-space:normal;
        "
      >
        ⚽ GENERATE FIXTURES
      </button>


      <button
        class="reject-btn"
        data-comp-action="delete"
        data-id="${escapeHTML(id)}"
        style="
          width:100%;
          min-height:44px;
          padding:11px 10px;
          border-radius:11px;
          font-size:12px;
          font-weight:800;
          cursor:pointer;
          white-space:normal;
          grid-column:1 / -1;
        "
      >
        🗑 DELETE
      </button>

    </div>

  `;


  card
    .querySelectorAll(
      "[data-comp-action]"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          handleCompetitionAction(
            button.dataset.compAction,
            button.dataset.id
          );

        }
      );

    });


  return card;

}


/* =====================================================
   COMPETITION ACTIONS
===================================================== */

async function handleCompetitionAction(
  action,
  competitionId
) {

  if (!currentUser)
    return;


  if (
    action === "delete" &&
    !confirm(
      "Delete this competition?"
    )
  )
    return;


  try {

    const ref =
      doc(
        db,
        "gameCompetitions",
        competitionId
      );


    const snap =
      await getDoc(ref);


    if (!snap.exists()) {

      alert(
        "Competition not found."
      );

      return;
    }


    const competition =
      snap.data();


    if (
      action ===
      "delete"
    ) {

      await deleteDoc(ref);


      await saveHistory({

        title:
          "Competition Deleted",

        type:
          "competition",

        action:
          "competition_deleted",

        status:
          "deleted",

        competitionId:
          competitionId,

        competitionName:
          competition.name || "",

        message:
          "Competition deleted by Main Admin."

      });


      alert(
        "Competition deleted."
      );


      await loadCompetitions();
      await loadHistory();

      return;
    }


    if (
      action ===
      "open-joining"
    ) {

      await updateDoc(
        ref,
        {

          joiningOpen:
            true,

          updatedAt:
            serverTimestamp(),

          updatedBy:
            currentUser.uid

        }
      );


      await saveHistory({

        title:
          "Joining Opened",

        type:
          "competition",

        action:
          "joining_opened",

        status:
          "open",

        competitionId:
          competitionId,

        competitionName:
          competition.name || "",

        message:
          "Competition joining opened."

      });

    }


    if (
      action ===
      "close-joining"
    ) {

      await updateDoc(
        ref,
        {

          joiningOpen:
            false,

          updatedAt:
            serverTimestamp(),

          updatedBy:
            currentUser.uid

        }
      );


      await saveHistory({

        title:
          "Joining Closed",

        type:
          "competition",

        action:
          "joining_closed",

        status:
          "closed",

        competitionId:
          competitionId,

        competitionName:
          competition.name || "",

        message:
          "Competition joining closed."

      });

    }


    if (
      action ===
      "open-payment"
    ) {

      await updateDoc(
        ref,
        {

          paymentOpen:
            true,

          updatedAt:
            serverTimestamp(),

          updatedBy:
            currentUser.uid

        }
      );


      await saveHistory({

        title:
          "Payment Opened",

        type:
          "competition",

        action:
          "payment_opened",

        status:
          "open",

        competitionId:
          competitionId,

        competitionName:
          competition.name || "",

        message:
          "Competition payment opened."

      });

    }


    if (
      action ===
      "close-payment"
    ) {

      await updateDoc(
        ref,
        {

          paymentOpen:
            false,

          updatedAt:
            serverTimestamp(),

          updatedBy:
            currentUser.uid

        }
      );


      await saveHistory({

        title:
          "Payment Closed",

        type:
          "competition",

        action:
          "payment_closed",

        status:
          "closed",

        competitionId:
          competitionId,

        competitionName:
          competition.name || "",

        message:
          "Competition payment closed."

      });

    }


    if (
      action ===
      "start"
    ) {

      await updateDoc(
        ref,
        {

          status:
            "active",

          startedAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp(),

          updatedBy:
            currentUser.uid

        }
      );


      await saveHistory({

        title:
          "Competition Started",

        type:
          "competition",

        action:
          "competition_started",

        status:
          "active",

        competitionId:
          competitionId,

        competitionName:
          competition.name || "",

        message:
          "Competition started by Main Admin."

      });

    }


    if (
      action ===
      "generate-fixtures"
    ) {

      await generateFixtures(
        competitionId
      );

      return;
    }


    await loadCompetitions();


    if (
      $("historyPage")?.classList.contains(
        "active"
      )
    ) {

      await loadHistory();

    }


  } catch (error) {

    console.error(
      "Competition action error:",
      error
    );


    alert(
      getFirestoreErrorMessage(
        error
      )
    );

  }

}


/* =====================================================
   GENERATE FIXTURES
   WORKING LOGIC PRESERVED
===================================================== */

async function generateFixtures(
  competitionId
) {

  if (!currentUser)
    return;


  try {

    const competitionRef =
      doc(
        db,
        "gameCompetitions",
        competitionId
      );


    const competitionSnap =
      await getDoc(
        competitionRef
      );


    if (!competitionSnap.exists()) {

      alert(
        "Competition not found."
      );

      return;
    }


    const competition =
      competitionSnap.data();


    if (
      competition.fixturesGenerated ===
      true
    ) {

      alert(
        "Fixtures have already been generated."
      );

      return;
    }


    if (
      competition.status !==
      "active"
    ) {

      alert(
        "Competition must be active before generating fixtures."
      );

      return;
    }


    const playersQuery =
      query(
        collection(
          db,
          "gameCompetitionPlayers"
        )
      );


    const playersSnap =
      await getDocs(
        playersQuery
      );


    const players =
      playersSnap.docs
        .map(d => ({
          id: d.id,
          ...d.data()
        }))
        .filter(
          player =>
            player.competitionId ===
              competitionId &&
            player.paymentStatus ===
              "approved"
        );


    await updateDoc(
      competitionRef,
      {

        playersCount:
          players.length,

        updatedAt:
          serverTimestamp()

      }
    );


    if (!players.length) {

      alert(
        "No approved players found."
      );

      return;
    }


    const existingQuery =
      query(
        collection(
          db,
          "gameMatches"
        )
      );


    const existingSnap =
      await getDocs(
        existingQuery
      );


    const existing =
      existingSnap.docs.filter(
        d =>
          d.data().competitionId ===
          competitionId
      );


    if (existing.length) {

      alert(
        "Fixtures already exist for this competition."
      );

      return;
    }


    let fixtures = [];


    const type =
      String(
        competition.type ||
        ""
      ).toLowerCase();


    if (
      type.includes("league")
    ) {

      fixtures =
        generateLeagueFixtures(
          players,
          competitionId,
          competition
        );

    } else {

      fixtures =
        generateKnockoutFixtures(
          players,
          competitionId,
          competition
        );

    }


    if (!fixtures.length) {

      alert(
        "Unable to generate fixtures."
      );

      return;
    }


    for (
      let i = 0;
      i < fixtures.length;
      i += 500
    ) {

      const batch =
        writeBatch(db);


      fixtures
        .slice(i, i + 500)
        .forEach(
          fixture => {

            const ref =
              doc(
                collection(
                  db,
                  "gameMatches"
                )
              );


            batch.set(
              ref,
              fixture
            );

          }
        );


      await batch.commit();

    }


    await updateDoc(
      competitionRef,
      {

        fixturesGenerated:
          true,

        fixturesCount:
          fixtures.length,

        fixturesGeneratedAt:
          serverTimestamp(),

        fixturesGeneratedBy:
          currentUser.uid,

        updatedAt:
          serverTimestamp()

      }
    );


    await saveHistory({

      title:
        "Fixtures Generated",

      type:
        "competition",

      action:
        "fixtures_generated",

      status:
        "completed",

      competitionId:
        competitionId,

      competitionName:
        competition.name || "",

      message:
        `${fixtures.length} fixtures generated successfully.`

    });


    alert(
      `${fixtures.length} fixtures generated successfully.`
    );


    await loadCompetitions();
    await loadMatches();


    if (
      $("historyPage")?.classList.contains(
        "active"
      )
    ) {

      await loadHistory();

    }


  } catch (error) {

    console.error(
      "Generate fixtures error:",
      error
    );


    alert(
      getFirestoreErrorMessage(
        error
      )
    );

  }

}


/* =====================================================
   LEAGUE FIXTURES
===================================================== */

function generateLeagueFixtures(
  players,
  competitionId,
  competition
) {

  const fixtures = [];


  for (
    let i = 0;
    i < players.length;
    i++
  ) {

    for (
      let j = i + 1;
      j < players.length;
      j++
    ) {

      fixtures.push(
        createFixture(
          competition,
          competitionId,
          players[i],
          players[j],
          "league"
        )
      );

    }

  }


  return fixtures;

}


/* =====================================================
   KNOCKOUT FIXTURES
===================================================== */

function generateKnockoutFixtures(
  players,
  competitionId,
  competition
) {

  const fixtures = [];

  const list =
    [...players];


  let round =
    "round_1";


  for (
    let i = 0;
    i + 1 < list.length;
    i += 2
  ) {

    fixtures.push(
      createFixture(
        competition,
        competitionId,
        list[i],
        list[i + 1],
        round
      )
    );

  }


  return fixtures;

}


/* =====================================================
   FIXTURE OBJECT
===================================================== */

function createFixture(
  competition,
  competitionId,
  homePlayer,
  awayPlayer,
  round
) {

  return {

    competitionId:
      competitionId || "",

    competitionName:
      competition?.name || "",

    competitionType:
      competition?.type || "",

    homePlayerId:
      homePlayer.userId ||
      homePlayer.uid ||
      homePlayer.id,

    awayPlayerId:
      awayPlayer.userId ||
      awayPlayer.uid ||
      awayPlayer.id,

    homeUsername:
      homePlayer.username ||
      "Player",

    awayUsername:
      awayPlayer.username ||
      "Player",

    homePlayerName:
      homePlayer.playerName ||
      homePlayer.username ||
      "Player",

    awayPlayerName:
      awayPlayer.playerName ||
      awayPlayer.username ||
      "Player",

    round:
      round ||
      "match",

    status:
      "pending",

    resultStatus:
      "not_submitted",

    homeScore:
      null,

    awayScore:
      null,

    resultSubmittedBy:
      null,

    resultSubmittedAt:
      null,

    resultVerifiedBy:
      null,

    resultVerifiedAt:
      null,

    createdAt:
      serverTimestamp(),

    createdBy:
      currentUser.uid

  };

}


/* =====================================================
   MATCHES
===================================================== */

async function loadMatches() {

  const list =
    $("matchList") ||
    $("matchesList");


  if (!list) return;


  list.innerHTML =
    `<div class="loading">
      Loading matches...
    </div>`;


  try {

    const q =
      query(
        collection(
          db,
          "gameMatches"
        ),
        orderBy(
          "createdAt",
          "desc"
        )
      );


    const snapshot =
      await getDocs(q);


    if (snapshot.empty) {

      list.innerHTML =
        `<div class="empty">
          <div>⚽</div>
          <h3>No Matches</h3>
          <p>Generated fixtures will appear here.</p>
        </div>`;

      return;
    }


    list.innerHTML = "";


    snapshot.forEach(item => {

      const data =
        item.data();


      const card =
        document.createElement(
          "article"
        );


      card.className =
        "admin-item";


      const resultStatus =
        data.resultStatus ||
        "not_submitted";


      card.innerHTML = `

        <div class="admin-item-header">

          <strong>
            ${escapeHTML(
              data.competitionName ||
              "HASTAN MATCH"
            )}
          </strong>

          <span>
            ${escapeHTML(
              resultStatus
            )}
          </span>

        </div>


        <div class="admin-item-body">

          <p>

            <strong>
              ${escapeHTML(
                data.homePlayerName ||
                data.homeUsername ||
                "Home"
              )}
            </strong>

            &nbsp;

            ${escapeHTML(
              data.homeScore ??
              "-"
            )}

            -

            ${escapeHTML(
              data.awayScore ??
              "-"
            )}

            &nbsp;

            <strong>
              ${escapeHTML(
                data.awayPlayerName ||
                data.awayUsername ||
                "Away"
              )}
            </strong>

          </p>


          <p>
            Round:
            ${escapeHTML(
              data.round ||
              "Match"
            )}
          </p>


          <p>
            Result:
            ${escapeHTML(
              resultStatus
            )}
          </p>


          <p>
            Created:
            ${escapeHTML(
              formatDate(
                data.createdAt
              )
            )}
          </p>

        </div>

      `;


      list.appendChild(card);

    });


  } catch (error) {

    console.error(
      "Matches error:",
      error
    );


    list.innerHTML =
      `<div class="empty">
        <div>⚠️</div>
        <h3>Unable to load matches</h3>
        <p>${escapeHTML(
          getFirestoreErrorMessage(
            error
          )
        )}</p>
      </div>`;

  }

}


/* =====================================================
   PLAYERS
===================================================== */

async function loadPlayers() {

  const list =
    $("playerList") ||
    $("playersList");


  if (!list) return;


  list.innerHTML =
    `<div class="loading">
      Loading players...
    </div>`;


  try {

    const snapshot =
      await getDocs(
        collection(
          db,
          "users"
        )
      );


    if (snapshot.empty) {

      list.innerHTML =
        `<div class="empty">
          No players found.
        </div>`;

      return;
    }


    list.innerHTML = "";


    snapshot.forEach(item => {

      const data =
        item.data();


      const card =
        document.createElement(
          "article"
        );


      card.className =
        "admin-item";


      card.innerHTML = `

        <div class="admin-item-header">

          <strong>
            ${escapeHTML(
              data.name ||
              data.fullName ||
              data.username ||
              "Player"
            )}
          </strong>

          <span>
            PLAYER
          </span>

        </div>


        <div class="admin-item-body">

          <p>
            Username:
            ${escapeHTML(
              data.username ||
              ""
            )}
          </p>


          <p>
            UID:
            ${escapeHTML(
              item.id
            )}
          </p>


          <p>
            Gamer Balance:
            TSh ${money(
              data.gamerBalance
            )}
          </p>

        </div>

      `;


      list.appendChild(card);

    });


  } catch (error) {

    console.error(
      "Players error:",
      error
    );


    list.innerHTML =
      `<div class="empty">
        Unable to load players.
      </div>`;

  }

}


/* =====================================================
   STATISTICS
===================================================== */

async function loadStatistics() {

  try {

    const matchesSnap =
      await getDocs(
        collection(
          db,
          "gameMatches"
        )
      );


    const competitionsSnap =
      await getDocs(
        collection(
          db,
          "gameCompetitions"
        )
      );


    const completed =
      matchesSnap.docs.filter(
        d =>
          d.data().status ===
          "completed"
      ).length;


    const verified =
      matchesSnap.docs.filter(
        d =>
          d.data().resultStatus ===
          "verified"
      ).length;


    setText(
      "statisticsMatches",
      matchesSnap.size
    );


    setText(
      "statisticsCompleted",
      completed
    );


    setText(
      "statisticsVerified",
      verified
    );


    setText(
      "statisticsCompetitions",
      competitionsSnap.size
    );


    setText(
      "totalTransactions",
      matchesSnap.size
    );


  } catch (error) {

    console.error(
      "Statistics error:",
      error
    );

  }

}


/* =====================================================
   REBUILD COMPETITION STANDINGS
===================================================== */

async function rebuildCompetitionStandings(
  competitionId
) {

  if (!currentUser) {

    throw new Error(
      "Admin is not authenticated."
    );

  }


  if (!competitionId) {

    throw new Error(
      "Competition ID is missing."
    );

  }


  /* =================================================
     GET COMPETITION
  ================================================= */

  const competitionRef =
    doc(
      db,
      "gameCompetitions",
      competitionId
    );


  const competitionSnap =
    await getDoc(
      competitionRef
    );


  if (!competitionSnap.exists()) {

    throw new Error(
      "Competition not found."
    );

  }


  const competition =
    competitionSnap.data();


  /* =================================================
     GET APPROVED PLAYERS
  ================================================= */

  const playersSnap =
    await getDocs(
      collection(
        db,
        "gameCompetitionPlayers"
      )
    );


  const approvedPlayers =
    playersSnap.docs
      .map(item => ({
        id: item.id,
        ...item.data()
      }))
      .filter(
        player =>
          player.competitionId ===
            competitionId &&
          player.paymentStatus ===
            "approved"
      );


  if (!approvedPlayers.length) {

    console.log(
      "No approved players for standings:",
      competitionId
    );

    return [];

  }


  /* =================================================
     OPTIONAL USER DATA
     Used only as fallback for names/usernames.
  ================================================= */

  let usersMap = {};


  try {

    const usersSnap =
      await getDocs(
        collection(
          db,
          "users"
        )
      );


    usersSnap.forEach(item => {

      usersMap[item.id] =
        item.data();

    });

  } catch (error) {

    console.warn(
      "Unable to load users for standings fallback:",
      error
    );

  }


  /* =================================================
     INITIALIZE STANDINGS
  ================================================= */

  const standings = {};


  approvedPlayers.forEach(player => {

    const userId =
      player.userId ||
      player.uid ||
      player.id;


    if (!userId) return;


    const user =
      usersMap[userId] ||
      {};


    const username =
      player.username ||
      user.username ||
      "";


    const playerName =
      player.playerName ||
      player.name ||
      user.name ||
      user.fullName ||
      username ||
      "Player";


    standings[userId] = {

      competitionId,

      competitionName:
        competition.name ||
        "Competition",

      competitionType:
        competition.type ||
        "",

      userId,

      username,

      playerName,

      played: 0,

      wins: 0,

      draws: 0,

      losses: 0,

      goalsFor: 0,

      goalsAgainst: 0,

      goalDifference: 0,

      points: 0

    };

  });


  /* =================================================
     GET ALL MATCHES
     ADMIN IS ALLOWED TO READ THEM.
  ================================================= */

  const matchesSnap =
    await getDocs(
      collection(
        db,
        "gameMatches"
      )
    );


  matchesSnap.forEach(item => {

    const match =
      item.data();


    if (
      match.competitionId !==
      competitionId
    ) {
      return;
    }


    /* ONLY VERIFIED RESULTS */

    if (
      String(
        match.resultStatus ||
        ""
      ).toLowerCase() !==
      "verified"
    ) {
      return;
    }


    /* VALID SCORES ONLY */

    if (
      !Number.isInteger(
        match.homeScore
      ) ||
      !Number.isInteger(
        match.awayScore
      )
    ) {
      return;
    }


    const homeId =
      match.homePlayerId;


    const awayId =
      match.awayPlayerId;


    const home =
      standings[homeId];


    const away =
      standings[awayId];


    if (!home || !away) {

      return;

    }


    const homeScore =
      Number(
        match.homeScore
      );


    const awayScore =
      Number(
        match.awayScore
      );


    /* PLAYED */

    home.played++;
    away.played++;


    /* GOALS */

    home.goalsFor +=
      homeScore;

    home.goalsAgainst +=
      awayScore;


    away.goalsFor +=
      awayScore;

    away.goalsAgainst +=
      homeScore;


    /* RESULT */

    if (
      homeScore >
      awayScore
    ) {

      home.wins++;
      home.points += 3;

      away.losses++;

    } else if (
      homeScore <
      awayScore
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

  });


  /* =================================================
     GOAL DIFFERENCE
  ================================================= */

  Object.values(
    standings
  ).forEach(player => {

    player.goalDifference =
      player.goalsFor -
      player.goalsAgainst;

  });


  /* =================================================
     SORT
     
     1. Points
     2. Goal Difference
     3. Goals For
     4. Wins
     5. Player name
  ================================================= */

  const sorted =
    Object.values(
      standings
    ).sort(
      (a, b) => {

        if (
          b.points !==
          a.points
        ) {

          return (
            b.points -
            a.points
          );

        }


        if (
          b.goalDifference !==
          a.goalDifference
        ) {

          return (
            b.goalDifference -
            a.goalDifference
          );

        }


        if (
          b.goalsFor !==
          a.goalsFor
        ) {

          return (
            b.goalsFor -
            a.goalsFor
          );

        }


        if (
          b.wins !==
          a.wins
        ) {

          return (
            b.wins -
            a.wins
          );

        }


        const nameA =
          String(
            a.playerName ||
            a.username ||
            ""
          ).toLowerCase();


        const nameB =
          String(
            b.playerName ||
            b.username ||
            ""
          ).toLowerCase();


        return nameA.localeCompare(
          nameB
        );

      }
    );


  /* =================================================
     ASSIGN POSITION
  ================================================= */

  sorted.forEach(
    (player, index) => {

      player.position =
        index + 1;

    }
  );


  /* =================================================
     WRITE GAME STANDINGS
  ================================================= */

  for (
    let i = 0;
    i < sorted.length;
    i += 500
  ) {

    const batch =
      writeBatch(db);


    const group =
      sorted.slice(
        i,
        i + 500
      );


    group.forEach(
      player => {

        const standingId =
          `${competitionId}_${player.userId}`;


        const standingRef =
          doc(
            db,
            "gameStandings",
            standingId
          );


        batch.set(
          standingRef,
          {

            competitionId:
              player.competitionId,

            competitionName:
              player.competitionName,

            competitionType:
              player.competitionType,

            userId:
              player.userId,

            username:
              player.username,

            playerName:
              player.playerName,

            played:
              player.played,

            wins:
              player.wins,

            draws:
              player.draws,

            losses:
              player.losses,

            goalsFor:
              player.goalsFor,

            goalsAgainst:
              player.goalsAgainst,

            goalDifference:
              player.goalDifference,

            points:
              player.points,

            position:
              player.position,

            updatedAt:
              serverTimestamp(),

            updatedBy:
              currentUser.uid

          },
          {
            merge: true
          }
        );

      }
    );


    await batch.commit();

  }


  console.log(
    "Standings rebuilt:",
    competition.name,
    sorted
  );


  return sorted;

}


/* =====================================================
   STANDINGS
===================================================== */

async function loadStandings() {

  const list =
    $("standingList") ||
    $("standingsList");


  if (!list) return;


  list.innerHTML =
    `<div class="loading">
      Loading standings...
    </div>`;


  try {

    const snapshot =
      await getDocs(
        collection(
          db,
          "gameStandings"
        )
      );


    if (snapshot.empty) {

      list.innerHTML =
        `<div class="empty">

          <div>🏅</div>

          <h3>
            No Standings Yet
          </h3>

          <p>
            Standings will appear after
            a verified match result.
          </p>

        </div>`;

      return;
    }


    const groups = {};


    snapshot.forEach(item => {

      const data =
        item.data();


      const competitionId =
        data.competitionId ||
        "unknown";


      if (
        !groups[competitionId]
      ) {

        groups[competitionId] = {

          competitionId,

          competitionName:
            data.competitionName ||
            "Competition",

          competitionType:
            data.competitionType ||
            "",

          rows: []

        };

      }


      groups[
        competitionId
      ].rows.push(
        data
      );

    });


    let html = "";


    Object.values(
      groups
    ).forEach(group => {

      group.rows.sort(
        (a, b) =>
          Number(
            a.position || 999999
          ) -
          Number(
            b.position || 999999
          )
      );


      const type =
        String(
          group.competitionType ||
          ""
        ).toLowerCase();


      let qualificationLimit =
        0;


      if (
        type.includes(
          "league"
        )
      ) {

        qualificationLimit =
          2;

      } else if (
        type.includes(
          "cup"
        )
      ) {

        qualificationLimit =
          2;

      } else if (
        type.includes(
          "tournament"
        )
      ) {

        qualificationLimit =
          8;

      }


      html += `

        <article
          class="admin-item"
          style="
            margin-bottom:20px;
            overflow:hidden;
          "
        >

          <div
            class="admin-item-header"
            style="
              align-items:flex-start;
            "
          >

            <div>

              <strong>
                ${escapeHTML(
                  group.competitionName
                )}
              </strong>

              <div
                style="
                  margin-top:5px;
                  font-size:11px;
                  opacity:.7;
                "
              >
                ${escapeHTML(
                  group.competitionType
                )}
              </div>

            </div>


            <span>
              ${group.rows.length}
              PLAYERS
            </span>

          </div>


          <div
            style="
              overflow-x:auto;
              width:100%;
            "
          >

            <table
              style="
                width:100%;
                min-width:680px;
                border-collapse:collapse;
                font-size:12px;
              "
            >

              <thead>

                <tr>

                  <th
                    style="
                      padding:11px 8px;
                      text-align:left;
                    "
                  >
                    #
                  </th>

                  <th
                    style="
                      padding:11px 8px;
                      text-align:left;
                    "
                  >
                    PLAYER
                  </th>

                  <th
                    style="
                      padding:11px 8px;
                      text-align:center;
                    "
                  >
                    P
                  </th>

                  <th
                    style="
                      padding:11px 8px;
                      text-align:center;
                    "
                  >
                    W
                  </th>

                  <th
                    style="
                      padding:11px 8px;
                      text-align:center;
                    "
                  >
                    D
                  </th>

                  <th
                    style="
                      padding:11px 8px;
                      text-align:center;
                    "
                  >
                    L
                  </th>

                  <th
                    style="
                      padding:11px 8px;
                      text-align:center;
                    "
                  >
                    GF
                  </th>

                  <th
                    style="
                      padding:11px 8px;
                      text-align:center;
                    "
                  >
                    GA
                  </th>

                  <th
                    style="
                      padding:11px 8px;
                      text-align:center;
                    "
                  >
                    GD
                  </th>

                  <th
                    style="
                      padding:11px 8px;
                      text-align:center;
                    "
                  >
                    PTS
                  </th>

                </tr>

              </thead>


              <tbody>

      `;


      group.rows.forEach(
        player => {

          const position =
            Number(
              player.position ||
              0
            );


          const qualifying =
            qualificationLimit >
              0 &&
            position <=
              qualificationLimit;


          const gd =
            Number(
              player.goalDifference ||
              0
            );


          html += `

            <tr
              style="
                border-top:1px solid rgba(255,255,255,.06);
                ${
                  qualifying
                    ? "background:rgba(50,220,130,.08);"
                    : ""
                }
              "
            >

              <td
                style="
                  padding:12px 8px;
                  font-weight:800;
                "
              >
                ${
                  qualifying
                    ? "🏆 "
                    : ""
                }
                ${position}
              </td>


              <td
                style="
                  padding:12px 8px;
                "
              >

                <strong>
                  ${escapeHTML(
                    player.playerName ||
                    player.username ||
                    "Player"
                  )}
                </strong>

                ${
                  player.username
                    ? `
                      <div
                        style="
                          font-size:10px;
                          opacity:.6;
                          margin-top:3px;
                        "
                      >
                        @${escapeHTML(
                          player.username
                        )}
                      </div>
                    `
                    : ""
                }

              </td>


              <td
                style="
                  padding:12px 8px;
                  text-align:center;
                "
              >
                ${Number(
                  player.played || 0
                )}
              </td>


              <td
                style="
                  padding:12px 8px;
                  text-align:center;
                "
              >
                ${Number(
                  player.wins || 0
                )}
              </td>


              <td
                style="
                  padding:12px 8px;
                  text-align:center;
                "
              >
                ${Number(
                  player.draws || 0
                )}
              </td>


              <td
                style="
                  padding:12px 8px;
                  text-align:center;
                "
              >
                ${Number(
                  player.losses || 0
                )}
              </td>


              <td
                style="
                  padding:12px 8px;
                  text-align:center;
                "
              >
                ${Number(
                  player.goalsFor || 0
                )}
              </td>


              <td
                style="
                  padding:12px 8px;
                  text-align:center;
                "
              >
                ${Number(
                  player.goalsAgainst || 0
                )}
              </td>


              <td
                style="
                  padding:12px 8px;
                  text-align:center;
                  font-weight:800;
                "
              >
                ${
                  gd > 0
                    ? `+${gd}`
                    : gd
                }
              </td>


              <td
                style="
                  padding:12px 8px;
                  text-align:center;
                  font-weight:900;
                "
              >
                ${Number(
                  player.points || 0
                )}
              </td>

            </tr>

          `;

        }
      );


      html += `

              </tbody>

            </table>

          </div>


          ${
            qualificationLimit > 0
              ? `
                <div
                  style="
                    padding:12px 14px;
                    font-size:11px;
                    color:#9be6b7;
                    border-top:1px solid rgba(255,255,255,.06);
                  "
                >
                  🏆 Top ${qualificationLimit}
                  currently occupy the qualification zone.
                </div>
              `
              : ""
          }

        </article>

      `;

    });


    list.innerHTML =
      html;


  } catch (error) {

    console.error(
      "Standings error:",
      error
    );


    list.innerHTML =
      `<div class="empty">

        <div>⚠️</div>

        <h3>
          Unable to load standings
        </h3>

        <p>
          ${escapeHTML(
            getFirestoreErrorMessage(
              error
            )
          )}
        </p>

      </div>`;

  }

}


/* =====================================================
   HISTORY
===================================================== */

async function loadHistory() {

  const list =
    $("historyList");


  if (!list) return;


  list.innerHTML =
    `<div class="loading">
      Loading history...
    </div>`;


  try {

    const q =
      query(
        collection(
          db,
          "gameHistory"
        ),
        orderBy(
          "createdAt",
          "desc"
        )
      );


    const snapshot =
      await getDocs(q);


    if (snapshot.empty) {

      list.innerHTML =
        `<div class="empty">
          <div>📜</div>
          <h3>No History Yet</h3>
          <p>Game history will appear here.</p>
        </div>`;

      return;
    }


    list.innerHTML = "";


    snapshot.forEach(item => {

      const data =
        item.data();


      const card =
        document.createElement(
          "article"
        );


      card.className =
        "admin-item";


      const status =
        String(
          data.status ||
          "completed"
        );


      card.innerHTML = `

        <div class="admin-item-header">

          <strong>
            ${escapeHTML(
              data.title ||
              data.type ||
              "Game Activity"
            )}
          </strong>

          <span>
            ${escapeHTML(
              status.toUpperCase()
            )}
          </span>

        </div>


        <div class="admin-item-body">

          ${
            data.competitionName
              ? `
                <p>
                  <strong>Competition:</strong>
                  ${escapeHTML(
                    data.competitionName
                  )}
                </p>
              `
              : ""
          }


          ${
            data.competitionId
              ? `
                <p>
                  <strong>Competition ID:</strong>
                  ${escapeHTML(
                    data.competitionId
                  )}
                </p>
              `
              : ""
          }


          ${
            data.matchId
              ? `
                <p>
                  <strong>Match ID:</strong>
                  ${escapeHTML(
                    data.matchId
                  )}
                </p>
              `
              : ""
          }


          ${
            data.userId || data.uid
              ? `
                <p>
                  <strong>User:</strong>
                  ${escapeHTML(
                    data.userId ||
                    data.uid
                  )}
                </p>
              `
              : ""
          }


          ${
            data.amount !== null &&
            data.amount !== undefined
              ? `
                <p>
                  <strong>Amount:</strong>
                  TSh ${money(
                    data.amount
                  )}
                </p>
              `
              : ""
          }


          ${
            data.message
              ? `
                <p>
                  <strong>Details:</strong>
                  ${escapeHTML(
                    data.message
                  )}
                </p>
              `
              : ""
          }


          <p>
            <strong>Action:</strong>
            ${escapeHTML(
              data.action ||
              ""
            )}
          </p>


          <p>
            <strong>Admin:</strong>
            ${escapeHTML(
              data.actorUid ||
              ""
            )}
          </p>


          <p>
            <strong>Date:</strong>
            ${escapeHTML(
              formatDate(
                data.createdAt
              )
            )}
          </p>

        </div>

      `;


      list.appendChild(card);

    });


  } catch (error) {

    console.error(
      "History error:",
      error
    );


    list.innerHTML =
      `<div class="empty">

        <div>⚠️</div>

        <h3>
          Unable to load history
        </h3>

        <p>
          ${escapeHTML(
            getFirestoreErrorMessage(
              error
            )
          )}
        </p>

      </div>`;

  }

}


/* =====================================================
   NOTIFICATIONS
===================================================== */

async function loadNotifications() {

  const list =
    $("notificationList") ||
    $("notificationsList");


  if (!list) return;


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

      list.innerHTML =
        `<div class="empty">
          <div>🔔</div>
          <h3>No Notifications</h3>
          <p>Notifications will appear here.</p>
        </div>`;

      return;
    }


    list.innerHTML = "";


    snapshot.forEach(item => {

      const data =
        item.data();


      const card =
        document.createElement(
          "article"
        );


      card.className =
        "admin-item";


      card.innerHTML = `

        <div class="admin-item-header">

          <strong>
            ${escapeHTML(
              data.title ||
              "Notification"
            )}
          </strong>

          <span>
            HASTAN GAME
          </span>

        </div>


        <div class="admin-item-body">

          <p>
            ${escapeHTML(
              data.message ||
              ""
            )}
          </p>


          <p>
            ${escapeHTML(
              formatDate(
                data.createdAt
              )
            )}
          </p>

        </div>

      `;


      list.appendChild(card);

    });


  } catch (error) {

    console.error(
      "Notifications error:",
      error
    );


    list.innerHTML =
      `<div class="empty">
        Unable to load notifications.
      </div>`;

  }

}


/* =====================================================
   SEND NOTIFICATION
===================================================== */

$("sendNotificationBtn")
  ?.addEventListener(
    "click",
    async () => {

      if (!currentUser)
        return;


      const message =
        prompt(
          "Write notification message:"
        );


      if (!message?.trim())
        return;


      try {

        await addDoc(
          collection(
            db,
            "gameNotifications"
          ),
          {

            title:
              "HASTAN GAME",

            message:
              message.trim(),

            createdAt:
              serverTimestamp(),

            createdBy:
              currentUser.uid

          }
        );


        await saveHistory({

          title:
            "Notification Sent",

          type:
            "notification",

          action:
            "notification_sent",

          status:
            "completed",

          message:
            message.trim()

        });


        alert(
          "Notification sent successfully."
        );


        await loadNotifications();


      } catch (error) {

        console.error(
          "Notification error:",
          error
        );


        alert(
          getFirestoreErrorMessage(
            error
          )
        );

      }

    }
  );


/* =====================================================
   TOP NOTIFICATION BUTTON
===================================================== */

$("notifyBtn")
  ?.addEventListener(
    "click",
    () => {

      openPage(
        "notificationsPage"
      );

    }
  );


/* =====================================================
   REFRESH
===================================================== */

$("refreshBtn")
  ?.addEventListener(
    "click",
    async () => {

      await loadDashboard();
      await loadCompetitions();
      await loadVerification();
      await loadMatches();
      await loadResults();
      await loadHistory();


      if (
        $("standingsPage")?.classList.contains(
          "active"
        )
      ) {

        await loadStandings();

      }


      alert(
        "Admin data refreshed."
      );

    }
  );


/* =====================================================
   MAIN ADMIN
===================================================== */

$("mainAdminBtn")
  ?.addEventListener(
    "click",
    () => {

      openPage(
        "dashboardPage"
      );

    }
  );


/* =====================================================
   FIRESTORE ERROR
===================================================== */

function getFirestoreErrorMessage(
  error
) {

  if (!error)
    return "Something went wrong.";


  if (
    error.code ===
    "permission-denied"
  ) {

    return (
      "Permission denied. Check Firebase Security Rules."
    );

  }


  if (
    error.code ===
    "not-found"
  ) {

    return (
      "The requested record was not found."
    );

  }


  if (
    error.code ===
    "failed-precondition"
  ) {

    return (
      "Firestore query requires an index or another database condition."
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

    if (
      value &&
      typeof value.toDate ===
      "function"
    ) {

      return value
        .toDate()
        .toLocaleString(
          "en-TZ"
        );

    }


    const date =
      new Date(value);


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {

      return "Not set";

    }


    return date.toLocaleString(
      "en-TZ"
    );


  } catch {

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
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );

}


/* =====================================================
   START ADMIN
===================================================== */

async function loadDeposits(){
  const list = document.getElementById("depositList");
  if(!list) return;

  list.innerHTML = '<div class="loading">Loading deposits...</div>';

  try{
    const snapshot = await getDocs(collection(db,"gameDeposits"));

    if(snapshot.empty){
      list.innerHTML = '<div class="empty">No deposits.</div>';
      return;
    }

    list.innerHTML = "";

    snapshot.forEach(item=>{
      const d = item.data();
      const status = String(d.status || "pending").toLowerCase();
      const processed = status === "approved" || status === "rejected";
      const statusLabel = status.toUpperCase();

      const card = document.createElement("div");
      card.className = "admin-item deposit-card " + (processed ? "deposit-processed" : "deposit-pending");

      card.innerHTML = `
        <strong>Deposit: TSh ${Number(d.amount||0).toLocaleString("en-TZ")}</strong>
        <div>User ID: ${d.uid || d.userId || "-"}</div>
        <div>Transaction ID: ${d.transactionId || "-"}</div>
        <div>Payment Number: ${d.paymentNumber || "-"}</div>
        <div>Merchant: ${d.merchantName || "-"}</div>
        <div>Status: <b>${statusLabel}</b></div>
        ${!processed ? `<button class="admin-btn approve-deposit" data-id="${item.id}">Approve</button> <button class="admin-btn reject-deposit" data-id="${item.id}">Reject</button>` : `<div class="deposit-locked">🔒 ${statusLabel} — Card Locked</div>`}
      `;

      list.appendChild(card);
    });

  }catch(error){
    console.error("Load deposits error:",error);
    list.innerHTML = '<div class="error">Unable to load deposits.</div>';
  }
}
async function approveGameDeposit(depositId){
  try{
    await runTransaction(db, async transaction=>{
      const depositRef = doc(db,"gameDeposits",depositId);
      const depositSnap = await transaction.get(depositRef);

      if(!depositSnap.exists()){
        throw new Error("Deposit not found.");
      }

      const deposit = depositSnap.data();

      if(deposit.status !== "pending"){
        throw new Error("This deposit is already " + (deposit.status || "processed") + ".");
      }

      const uid = deposit.uid || deposit.userId;
      if(!uid) throw new Error("Deposit user ID is missing.");

      const userRef = doc(db,"users",uid);
      const userSnap = await transaction.get(userRef);
      if(!userSnap.exists()) throw new Error("Player account not found.");

      const currentBalance = Number(userSnap.data().gamerBalance || 0);
      const amount = Number(deposit.amount || 0);

      if(!Number.isFinite(amount) || amount <= 0){
        throw new Error("Invalid deposit amount.");
      }

      transaction.update(userRef,{
        gamerBalance: currentBalance + amount
      });

      transaction.update(depositRef,{
        status:"approved",
        approvedAt:serverTimestamp(),
        approvedBy:currentUser.uid
      });
    });

    alert("Deposit approved successfully.");
    loadDeposits();

  }catch(error){
    console.error("Approve deposit error:",error);
    alert(error.message || "Failed to approve deposit.");
  }
}


document.addEventListener("click",event=>{
  const button = event.target.closest(".approve-deposit");
  if(!button) return;

  const depositId = button.dataset.id;
  if(depositId) approveGameDeposit(depositId);
});


async function rejectGameDeposit(depositId){
  try{
    await runTransaction(db, async transaction=>{
      const depositRef = doc(db,"gameDeposits",depositId);
      const depositSnap = await transaction.get(depositRef);

      if(!depositSnap.exists()){
        throw new Error("Deposit not found.");
      }

      const deposit = depositSnap.data();

      if(deposit.status !== "pending"){
        throw new Error("This deposit is already " + (deposit.status || "processed") + ".");
      }

      transaction.update(depositRef,{
        status:"rejected",
        rejectedAt:serverTimestamp(),
        rejectedBy:currentUser.uid
      });
    });

    alert("Deposit rejected.");
    loadDeposits();

  }catch(error){
    console.error("Reject deposit error:",error);
    alert(error.message || "Failed to reject deposit.");
  }
}

document.addEventListener("click",event=>{
  const button = event.target.closest(".reject-deposit");
  if(!button) return;
  const depositId = button.dataset.id;
  if(depositId) rejectGameDeposit(depositId);
});


/* =====================================================
   GAME WITHDRAWALS
===================================================== */

async function loadWithdrawals(){
  const list = document.getElementById("withdrawalList");
  if(!list) return;

  list.innerHTML = '<div class="loading">Loading withdrawals...</div>';

  try{
    const snapshot = await getDocs(collection(db,"gameWithdrawals"));

    if(snapshot.empty){
      list.innerHTML = '<div class="empty">No withdrawals.</div>';
      return;
    }

    list.innerHTML = "";

    snapshot.forEach(item=>{
      const d = item.data();
      const status = String(d.status || "pending").toLowerCase();

      const card = document.createElement("div");
      card.className = "admin-item withdrawal-card";

      card.innerHTML = `
        <strong>Withdrawal: TSh ${Number(d.amount||0).toLocaleString("en-TZ")}</strong>
        <div>User ID: ${d.uid || d.userId || "-"}</div>
        <div>Payment Number: ${d.paymentNumber || "-"}</div>
        <div>Status: <b>${status.toUpperCase()}</b></div>${status === "pending" ? `<button class="admin-btn approve-withdraw" data-id="${item.id}">Approve</button> <button class="admin-btn reject-withdraw" data-id="${item.id}">Reject</button>` : `<div class="withdrawal-locked">🔒 ${status.toUpperCase()} — Card Locked</div>`}
      `;

      list.appendChild(card);
    });

  }catch(error){
    console.error("Load withdrawals error:",error);
    list.innerHTML = '<div class="error">Unable to load withdrawals.</div>';
  }
}

/* =====================================================
   APPROVE GAME WITHDRAWAL
===================================================== */

async function approveGameWithdrawal(withdrawalId){
  try{
    await runTransaction(db, async transaction=>{
      const withdrawalRef = doc(db,"gameWithdrawals",withdrawalId);
      const withdrawalSnap = await transaction.get(withdrawalRef);

      if(!withdrawalSnap.exists()){
        throw new Error("Withdrawal not found.");
      }

      const withdrawal = withdrawalSnap.data();

      if(withdrawal.status !== "pending"){
        throw new Error(
          "This withdrawal is already " +
          (withdrawal.status || "processed") +
          "."
        );
      }

      const uid = withdrawal.uid || withdrawal.userId;
      if(!uid){
        throw new Error("Withdrawal user ID is missing.");
      }

      const amount = Number(withdrawal.amount || 0);

      if(!Number.isFinite(amount) || amount <= 0){
        throw new Error("Invalid withdrawal amount.");
      }

      const userRef = doc(db,"users",uid);
      const userSnap = await transaction.get(userRef);

      if(!userSnap.exists()){
        throw new Error("Player account not found.");
      }

      const currentBalance =
        Number(userSnap.data().gamerBalance || 0);

      if(amount > currentBalance){
        throw new Error(
          "Insufficient Gamer Balance. Available: TSh " +
          currentBalance.toLocaleString("en-TZ")
        );
      }

      transaction.update(userRef,{
        gamerBalance: currentBalance - amount
      });

      transaction.update(withdrawalRef,{
        status:"approved",
        approvedAt:serverTimestamp(),
        approvedBy:currentUser.uid
      });
    });

    alert("Withdrawal approved successfully.");
    loadWithdrawals();

  }catch(error){
    console.error("Approve withdrawal error:",error);
    alert(error.message || "Failed to approve withdrawal.");
  }
}

/* APPROVE WITHDRAWAL BUTTON */
document.addEventListener("click",event=>{
  const button = event.target.closest(".approve-withdraw");
  if(!button) return;

  const withdrawalId = button.dataset.id;
  if(withdrawalId) approveGameWithdrawal(withdrawalId);
});

/* =====================================================
   REJECT GAME WITHDRAWAL
===================================================== */

async function rejectGameWithdrawal(withdrawalId){
  try{
    await runTransaction(db, async transaction=>{
      const withdrawalRef = doc(db,"gameWithdrawals",withdrawalId);
      const withdrawalSnap = await transaction.get(withdrawalRef);

      if(!withdrawalSnap.exists()){
        throw new Error("Withdrawal not found.");
      }

      const withdrawal = withdrawalSnap.data();

      if(withdrawal.status !== "pending"){
        throw new Error(
          "This withdrawal is already " +
          (withdrawal.status || "processed") +
          "."
        );
      }

      transaction.update(withdrawalRef,{
        status:"rejected",
        rejectedAt:serverTimestamp(),
        rejectedBy:currentUser.uid
      });
    });

    alert("Withdrawal rejected.");
    loadWithdrawals();

  }catch(error){
    console.error("Reject withdrawal error:",error);
    alert(error.message || "Failed to reject withdrawal.");
  }
}

/* REJECT WITHDRAWAL BUTTON */
document.addEventListener("click",event=>{
  const button = event.target.closest(".reject-withdraw");
  if(!button) return;

  const withdrawalId = button.dataset.id;
  if(withdrawalId) rejectGameWithdrawal(withdrawalId);
});
