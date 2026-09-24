import { auth, db } from "./firebase-config.js";

import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


// ======================================================
// HASTAN GLOBE - NORMAL DASHBOARD FIREBASE APP
// ======================================================

document.addEventListener("DOMContentLoaded", () => {

  onAuthStateChanged(auth, async (user) => {

    if (!user) {
      showLoginMessages();
      return;
    }

    console.log("HASTAN GLOBE user logged in:", user.uid);

    await Promise.all([
      loadVideos(),
      loadImageAds(),
      loadTravelQuiz(),
      loadSpinWheel(),
      loadNotifications()
    ]);

  });

});


// ======================================================
// COMMON HELPERS
// ======================================================

function escapeHTML(value) {

  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


function money(value) {

  const number = Number(value || 0);

  return number.toLocaleString("en-US");
}


function getDate(timestamp) {

  if (!timestamp) {
    return "";
  }

  try {

    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleString();
    }

    return new Date(timestamp).toLocaleString();

  } catch (error) {

    return "";

  }

}


// ======================================================
// CLEAR OLD DEMO CONTENT
// ======================================================

function clearAfterHeader(pageId) {

  const page = document.getElementById(pageId);

  if (!page) {
    console.warn("Page not found:", pageId);
    return null;
  }

  const header = page.querySelector(".activity-header");

  if (!header) {
    console.warn("Activity header not found:", pageId);
    return page;
  }

  const children = Array.from(page.children);

  children.forEach((child) => {

    if (child !== header) {
      child.remove();
    }

  });

  return page;
}


// ======================================================
// LOGIN MESSAGE
// ======================================================

function showLoginMessages() {

  const pages = [
    "videosPage",
    "postersPage",
    "adsPage",
    "quizPage",
    "spinPage"
  ];

  pages.forEach((pageId) => {

    const page = document.getElementById(pageId);

    if (!page) return;

    const header = page.querySelector(".activity-header");

    if (!header) return;

    const oldMessage = page.querySelector(".firebase-message");

    if (oldMessage) {
      oldMessage.remove();
    }

    const message = document.createElement("div");

    message.className = "card firebase-message";

    message.innerHTML = `
      <h3>Login Required</h3>
      <p>Please login to your HASTAN GLOBE account to see available activities.</p>
    `;

    page.appendChild(message);

  });

}


// ======================================================
// VIDEOS
// ======================================================

async function loadVideos() {

  const page = clearAfterHeader("videosPage");

  if (!page) return;

  try {

    const snapshot = await getDocs(
      collection(db, "videos")
    );

    console.log("Videos found:", snapshot.size);

    if (snapshot.empty) {

      page.insertAdjacentHTML(
        "beforeend",
        `
        <div class="card firebase-message">
          <h3>🎥 No Videos Available</h3>
          <p>Admin has not uploaded any videos yet.</p>
        </div>
        `
      );

      return;
    }


    snapshot.forEach((docSnap) => {

      const data = docSnap.data();

      const title =
        data.title ||
        "Video";

      const description =
        data.description ||
        "Watch this video completely.";

      const url =
        data.url ||
        "";

      const reward =
        Number(data.reward || 0);


      const card = document.createElement("div");

      card.className = "card firebase-video-card";


      card.innerHTML = `

        <h3>🎥 ${escapeHTML(title)}</h3>

        <p>
          ${escapeHTML(description)}
        </p>

        ${
          url
            ? `
              <button
                class="action-btn"
                type="button"
                data-video-url="${escapeHTML(url)}"
              >
                ▶ Watch Video
              </button>
            `
            : `
              <p>
                <strong>Video link is not available.</strong>
              </p>
            `
        }

        <div class="reward">
          Reward: TSh ${money(reward)}
        </div>

        <br>

        <button
          class="action-btn complete-video-btn"
          type="button"
        >
          Complete Video
        </button>

      `;


      const watchButton =
        card.querySelector("[data-video-url]");

      if (watchButton) {

        watchButton.addEventListener(
          "click",
          () => {

            const videoUrl =
              watchButton.getAttribute("data-video-url");

            if (!videoUrl) return;

            window.open(
              videoUrl,
              "_blank",
              "noopener,noreferrer"
            );

          }
        );

      }


      const completeButton =
        card.querySelector(".complete-video-btn");

      if (completeButton) {

        completeButton.addEventListener(
          "click",
          () => {

            completeButton.disabled = true;

            completeButton.textContent =
              "Completed ✓";

            alert(
              `Video completed. Reward: TSh ${money(reward)}`
            );

          }
        );

      }


      page.appendChild(card);

    });


  } catch (error) {

    console.error(
      "Error loading videos:",
      error
    );

    page.insertAdjacentHTML(
      "beforeend",
      `
      <div class="card firebase-message">
        <h3>⚠️ Error Loading Videos</h3>
        <p>
          ${escapeHTML(error.message)}
        </p>
      </div>
      `
    );

  }

}


// ======================================================
// IMAGE ADS / POSTERS
// ======================================================

async function loadImageAds() {

  const postersPage =
    clearAfterHeader("postersPage");

  const adsPage =
    clearAfterHeader("adsPage");


  try {

    const snapshot = await getDocs(
      collection(db, "imageAds")
    );

    console.log(
      "Image Ads found:",
      snapshot.size
    );


    if (snapshot.empty) {

      if (postersPage) {

        postersPage.insertAdjacentHTML(
          "beforeend",
          `
          <div class="card firebase-message">
            <h3>🖼️ No Posters Available</h3>
            <p>Admin has not uploaded any posters yet.</p>
          </div>
          `
        );

      }


      if (adsPage) {

        adsPage.insertAdjacentHTML(
          "beforeend",
          `
          <div class="card firebase-message">
            <h3>👍 No Like Ads Available</h3>
            <p>Admin has not uploaded any advertisements yet.</p>
          </div>
          `
        );

      }

      return;
    }


    let postersCount = 0;
    let adsCount = 0;


    snapshot.forEach((docSnap) => {

      const data = docSnap.data();

      const title =
        data.title ||
        "Advertisement";

      const description =
        data.description ||
        "";

      const imageUrl =
        data.imageUrl ||
        "";

      const reward =
        Number(data.reward || 0);

      const type =
        String(data.type || "")
          .toLowerCase()
          .trim();


      const isPoster =
        type === "poster" ||
        type === "image" ||
        type === "posterad" ||
        type === "poster-ad";


      const isLikeAd =
        type === "likead" ||
        type === "like-ad" ||
        type === "likeads" ||
        type === "like-ads" ||
        type === "ad";


      // ----------------------------------------------
      // POSTER
      // ----------------------------------------------

      if (
        postersPage &&
        (
          isPoster ||
          (!isLikeAd && !isPoster)
        )
      ) {

        const card =
          createImageCard(
            data,
            "poster"
          );

        postersPage.appendChild(card);

        postersCount++;

      }


      // ----------------------------------------------
      // LIKE AD
      // ----------------------------------------------

      if (
        adsPage &&
        isLikeAd
      ) {

        const card =
          createImageCard(
            data,
            "ad"
          );

        adsPage.appendChild(card);

        adsCount++;

      }

    });


    // If admin has uploaded image ads without a type,
    // they are already displayed under Posters.


    if (
      postersPage &&
      postersCount === 0
    ) {

      postersPage.insertAdjacentHTML(
        "beforeend",
        `
        <div class="card firebase-message">
          <h3>🖼️ No Posters Available</h3>
          <p>No poster activities are currently available.</p>
        </div>
        `
      );

    }


    if (
      adsPage &&
      adsCount === 0
    ) {

      adsPage.insertAdjacentHTML(
        "beforeend",
        `
        <div class="card firebase-message">
          <h3>👍 No Like Ads Available</h3>
          <p>No Like Ads are currently available.</p>
        </div>
        `
      );

    }


  } catch (error) {

    console.error(
      "Error loading image ads:",
      error
    );


    if (postersPage) {

      postersPage.insertAdjacentHTML(
        "beforeend",
        `
        <div class="card firebase-message">
          <h3>⚠️ Error Loading Posters</h3>
          <p>${escapeHTML(error.message)}</p>
        </div>
        `
      );

    }


    if (adsPage) {

      adsPage.insertAdjacentHTML(
        "beforeend",
        `
        <div class="card firebase-message">
          <h3>⚠️ Error Loading Ads</h3>
          <p>${escapeHTML(error.message)}</p>
        </div>
        `
      );

    }

  }

}


// ======================================================
// CREATE IMAGE CARD
// ======================================================

function createImageCard(data, activityType) {

  const title =
    data.title ||
    "Advertisement";

  const description =
    data.description ||
    "";

  const imageUrl =
    data.imageUrl ||
    "";

  const reward =
    Number(data.reward || 0);


  const card =
    document.createElement("div");

  card.className =
    "card firebase-image-card";


  card.innerHTML = `

    ${
      imageUrl
        ? `
          <img
            src="${escapeHTML(imageUrl)}"
            alt="${escapeHTML(title)}"
            style="
              width:100%;
              max-height:280px;
              object-fit:cover;
              border-radius:12px;
              margin-bottom:12px;
            "
          >
        `
        : ""
    }

    <h3>
      ${activityType === "ad" ? "👍" : "🖼️"}
      ${escapeHTML(title)}
    </h3>

    ${
      description
        ? `
          <p>
            ${escapeHTML(description)}
          </p>
        `
        : ""
    }

    <div class="reward">
      Reward: TSh ${money(reward)}
    </div>

    <br>

    <button
      class="action-btn image-complete-btn"
      type="button"
    >
      ${
        activityType === "ad"
          ? "👍 Like & Complete"
          : "Complete Activity"
      }
    </button>

  `;


  const button =
    card.querySelector(
      ".image-complete-btn"
    );


  button.addEventListener(
    "click",
    () => {

      button.disabled = true;

      button.textContent =
        "Completed ✓";

      alert(
        `Activity completed. Reward: TSh ${money(reward)}`
      );

    }
  );


  return card;

}


// ======================================================
// TRAVEL QUIZ
// ======================================================

async function loadTravelQuiz() {

  const page =
    clearAfterHeader("quizPage");

  if (!page) return;


  try {

    const snapshot =
      await getDocs(
        collection(db, "travelQuizzes")
      );


    console.log(
      "Travel quizzes found:",
      snapshot.size
    );


    if (snapshot.empty) {

      page.insertAdjacentHTML(
        "beforeend",
        `
        <div class="card firebase-message">
          <h3>🌍 No Travel Quiz</h3>
          <p>Admin has not added a Travel Quiz yet.</p>
        </div>
        `
      );

      return;
    }


    snapshot.forEach((docSnap) => {

      const data =
        docSnap.data();


      const question =
        data.question ||
        "Travel Quiz";


      const reward =
        Number(data.reward || 0);


      let options =
        data.options || [];


      if (!Array.isArray(options)) {

        options =
          Object.values(options);

      }


      const correctAnswer =
        String(
          data.correctAnswer || ""
        );


      const card =
        document.createElement("div");

      card.className =
        "card firebase-quiz-card";


      let optionsHTML = "";


      options.forEach(
        (option, index) => {

          optionsHTML += `

            <label
              style="
                display:block;
                margin:10px 0;
                padding:12px;
                border:1px solid #ddd;
                border-radius:10px;
                cursor:pointer;
              "
            >

              <input
                type="radio"
                name="quiz_${docSnap.id}"
                value="${escapeHTML(option)}"
              >

              ${escapeHTML(option)}

            </label>

          `;

        }
      );


      card.innerHTML = `

        <h3>🌍 Travel Quiz</h3>

        <p>
          <strong>
            ${escapeHTML(question)}
          </strong>
        </p>

        <div class="quiz-options">
          ${optionsHTML}
        </div>

        <div class="reward">
          Reward: TSh ${money(reward)}
        </div>

        <br>

        <button
          class="action-btn quiz-submit-btn"
          type="button"
        >
          Submit Answer
        </button>

      `;


      const submitButton =
        card.querySelector(
          ".quiz-submit-btn"
        );


      submitButton.addEventListener(
        "click",
        () => {

          const selected =
            card.querySelector(
              `input[name="quiz_${docSnap.id}"]:checked`
            );


          if (!selected) {

            alert(
              "Please select an answer first."
            );

            return;

          }


          if (
            selected.value.trim().toLowerCase() ===
            correctAnswer.trim().toLowerCase()
          ) {

            submitButton.disabled = true;

            submitButton.textContent =
              "Correct ✓";

            alert(
              `Correct answer! Reward: TSh ${money(reward)}`
            );

          } else {

            alert(
              "Wrong answer. Try again."
            );

          }

        }
      );


      page.appendChild(card);

    });


  } catch (error) {

    console.error(
      "Error loading Travel Quiz:",
      error
    );


    page.insertAdjacentHTML(
      "beforeend",
      `
      <div class="card firebase-message">
        <h3>⚠️ Error Loading Quiz</h3>
        <p>${escapeHTML(error.message)}</p>
      </div>
      `
    );

  }

}


// ======================================================
// SPIN WHEEL
// ======================================================

async function loadSpinWheel() {

  const page =
    clearAfterHeader("spinPage");

  if (!page) return;


  try {

    const snapshot =
      await getDocs(
        collection(db, "spinWheel")
      );


    console.log(
      "Spin Wheel items found:",
      snapshot.size
    );


    if (snapshot.empty) {

      page.insertAdjacentHTML(
        "beforeend",
        `
        <div class="card firebase-message">
          <h3>🎡 Spin Wheel</h3>
          <p>Admin has not added Spin Wheel rewards yet.</p>
        </div>
        `
      );

      return;
    }


    const rewards = [];


    snapshot.forEach(
      (docSnap) => {

        const data =
          docSnap.data();


        const name =
          data.name ||
          "Reward";


        const amount =
          Number(data.amount || 0);


        const probability =
          Number(
            data.probability || 1
          );


        rewards.push({

          name,
          amount,
          probability

        });

      }
    );


    const card =
      document.createElement("div");

    card.className =
      "card firebase-spin-card";


    let rewardsHTML = "";


    rewards.forEach(
      (reward) => {

        rewardsHTML += `

          <div
            style="
              display:flex;
              justify-content:space-between;
              padding:10px;
              border-bottom:1px solid #eee;
            "
          >

            <span>
              ${escapeHTML(reward.name)}
            </span>

            <strong>
              TSh ${money(reward.amount)}
            </strong>

          </div>

        `;

      }
    );


    card.innerHTML = `

      <h3>🎡 Spin Wheel</h3>

      <p>
        Spin the wheel and see your reward.
      </p>

      <div
        style="
          margin:15px 0;
          border:1px solid #eee;
          border-radius:10px;
          overflow:hidden;
        "
      >
        ${rewardsHTML}
      </div>

      <button
        class="action-btn spin-btn"
        type="button"
      >
        🎡 SPIN NOW
      </button>

      <div
        class="spin-result"
        style="
          margin-top:15px;
          font-weight:bold;
          text-align:center;
        "
      ></div>

    `;


    const spinButton =
      card.querySelector(
        ".spin-btn"
      );


    const result =
      card.querySelector(
        ".spin-result"
      );


    spinButton.addEventListener(
      "click",
      () => {

        spinButton.disabled = true;

        spinButton.textContent =
          "Spinning...";


        setTimeout(
          () => {

            const selected =
              weightedRandom(
                rewards
              );


            result.innerHTML = `
              🎉 You won:
              <strong>
                ${escapeHTML(selected.name)}
              </strong>
              -
              TSh ${money(selected.amount)}
            `;


            spinButton.disabled = false;

            spinButton.textContent =
              "🎡 SPIN AGAIN";


          },
          1000
        );

      }
    );


    page.appendChild(card);


  } catch (error) {

    console.error(
      "Error loading Spin Wheel:",
      error
    );


    page.insertAdjacentHTML(
      "beforeend",
      `
      <div class="card firebase-message">
        <h3>⚠️ Error Loading Spin Wheel</h3>
        <p>${escapeHTML(error.message)}</p>
      </div>
      `
    );

  }

}


// ======================================================
// WEIGHTED RANDOM
// ======================================================

function weightedRandom(items) {

  if (!items.length) {
    return {
      name: "No Reward",
      amount: 0
    };
  }


  const total =
    items.reduce(
      (sum, item) =>
        sum + Math.max(
          Number(item.probability || 0),
          0
        ),
      0
    );


  if (total <= 0) {

    return items[
      Math.floor(
        Math.random() * items.length
      )
    ];

  }


  let random =
    Math.random() * total;


  for (const item of items) {

    random -=
      Math.max(
        Number(item.probability || 0),
        0
      );


    if (random <= 0) {
      return item;
    }

  }


  return items[items.length - 1];

}


// ======================================================
// NOTIFICATIONS
// ======================================================

async function loadNotifications() {

  try {

    const snapshot =
      await getDocs(
        collection(db, "notifications")
      );


    console.log(
      "Notifications found:",
      snapshot.size
    );


    const possibleContainers = [

      "notificationsPage",
      "notificationPage",
      "notificationsList"

    ];


    let container = null;


    for (
      const id of possibleContainers
    ) {

      const element =
        document.getElementById(id);

      if (element) {

        container =
          element;

        break;

      }

    }


    if (!container) {

      console.log(
        "Notifications container not found in current HTML."
      );

      return;

    }


    const header =
      container.querySelector(
        ".activity-header"
      );


    if (header) {

      Array.from(
        container.children
      ).forEach(
        (child) => {

          if (child !== header) {
            child.remove();
          }

        }
      );

    }


    if (snapshot.empty) {

      container.insertAdjacentHTML(
        "beforeend",
        `
        <div class="card">
          <h3>🔔 Notifications</h3>
          <p>No notifications yet.</p>
        </div>
        `
      );

      return;

    }


    snapshot.forEach(
      (docSnap) => {

        const data =
          docSnap.data();


        const title =
          data.title ||
          "Notification";


        const message =
          data.message ||
          data.description ||
          "";


        const date =
          getDate(
            data.createdAt
          );


        const card =
          document.createElement("div");

        card.className =
          "card firebase-notification-card";


        card.innerHTML = `

          <h3>
            🔔 ${escapeHTML(title)}
          </h3>

          <p>
            ${escapeHTML(message)}
          </p>

          ${
            date
              ? `
                <small>
                  ${escapeHTML(date)}
                </small>
              `
              : ""
          }

        `;


        container.appendChild(
          card
        );

      }
    );


  } catch (error) {

    console.error(
      "Error loading notifications:",
      error
    );

  }

}


// ======================================================
// DEBUG FUNCTION
// ======================================================

window.reloadHastanActivities =
  async function () {

    const user =
      auth.currentUser;

    if (!user) {

      alert(
        "Please login first."
      );

      return;

    }


    await Promise.all([
      loadVideos(),
      loadImageAds(),
      loadTravelQuiz(),
      loadSpinWheel(),
      loadNotifications()
    ]);


    console.log(
      "HASTAN GLOBE activities reloaded."
    );

  };


console.log(
  "HASTAN GLOBE app.js loaded successfully."
);