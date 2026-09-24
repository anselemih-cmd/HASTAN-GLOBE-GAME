/* =========================================================
   HASTAN GAME - REAL FIREBASE CONNECTION
   Uses the SAME Firebase project/account as HASTAN GLOBE
========================================================= */

import { auth, db, storage } from "./firebase-config.js";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  runTransaction
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-storage.js";


/* =========================================================
   GLOBAL GAME USER
========================================================= */

let gameUser = null;
let gameUserData = null;


/* =========================================================
   CURRENT USER
========================================================= */

onAuthStateChanged(auth, async (user) => {

  gameUser = user;

  if (!user) {
    console.log("HASTAN GAME: No authenticated user.");
    return;
  }

  try {

    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      console.error("HASTAN GAME: User profile not found.");
      return;
    }

    gameUserData = {
      uid: user.uid,
      ...snap.data()
    };

    console.log(
      "HASTAN GAME: Real user connected:",
      gameUserData.username ||
      gameUserData.displayName ||
      user.email
    );

    if (window.onGameUserReady) {
      window.onGameUserReady(gameUserData);
    }

  } catch (error) {

    console.error(
      "HASTAN GAME user loading error:",
      error
    );

  }

});


/* =========================================================
   REQUIRE LOGIN
========================================================= */

function requireGameUser() {

  if (!gameUser) {

    alert(
      "Please login to HASTAN GLOBE first."
    );

    return false;
  }

  return true;
}


/* =========================================================
   GET CURRENT PLAYER
========================================================= */

async function getCurrentGamePlayer() {

  if (!requireGameUser()) {
    return null;
  }

  const userRef =
    doc(db, "users", gameUser.uid);

  const snap =
    await getDoc(userRef);

  if (!snap.exists()) {
    return null;
  }

  return {
    uid: gameUser.uid,
    ...snap.data()
  };
}


/* =========================================================
   GET GAMER BALANCE
========================================================= */

async function getGamerBalance() {

  if (!requireGameUser()) {
    return 0;
  }

  const userRef =
    doc(db, "users", gameUser.uid);

  const snap =
    await getDoc(userRef);

  if (!snap.exists()) {
    return 0;
  }

  return Number(
    snap.data().gamerBalance || 0
  );
}


/* =========================================================
   REALTIME GAMER BALANCE
========================================================= */

function listenToGamerBalance(callback) {

  if (!requireGameUser()) {
    return null;
  }

  const userRef =
    doc(db, "users", gameUser.uid);

  return onSnapshot(
    userRef,
    (snap) => {

      if (!snap.exists()) {
        callback(0);
        return;
      }

      const balance =
        Number(
          snap.data().gamerBalance || 0
        );

      callback(balance);

    },
    (error) => {

      console.error(
        "Gamer balance listener:",
        error
      );

    }
  );
}


/* =========================================================
   GET PLAYER PROFILE
========================================================= */

async function getGamePlayerProfile(uid) {

  const userRef =
    doc(db, "users", uid);

  const snap =
    await getDoc(userRef);

  if (!snap.exists()) {
    return null;
  }

  return {
    uid: uid,
    ...snap.data()
  };
}


/* =========================================================
   CHECK IF PLAYER IS ACTIVE
========================================================= */

async function isGameAccountActive() {

  const player =
    await getCurrentGamePlayer();

  if (!player) {
    return false;
  }

  return (
    player.activationStatus === "active" ||
    player.isActivated === true
  );
}


/* =========================================================
   GAME CONFIGURATION
========================================================= */

const HASTAN_GAME_CONFIG = {

  matchLengthMinutes: 20,

  oneOnOne: {

    stakes: [
      1000,
      2000,
      5000
    ],

    poolNames: {

      1000: "TSh 1,000",

      2000: "TSh 2,000",

      5000: "TSh 5,000"

    }

  },

  league: {

    maxPlayers: 16,

    entryFee: 5000

  },

  cup: {

    maxPlayers: 16,

    entryFee: 10000

  },

  tournament: {

    maxPlayers: 10,

    entryFee: 20000

  },

  hastanMatch: {

    maxPlayers: 6,

    entryFee: 0

  }

};


/* =========================================================
   GENERATE HASTAN MATCH ID
========================================================= */

function generateMatchId(type, number = 1, stake = null) {

  const random =
    Math.random()
      .toString(36)
      .substring(2, 7)
      .toUpperCase();

  if (
    type === "oneOnOne" &&
    stake
  ) {

    return (
      "HG-1V1-" +
      stake +
      "-" +
      random
    );

  }

  if (type === "league") {

    return (
      "HG-LG-" +
      new Date().getFullYear() +
      "-" +
      random
    );

  }

  if (type === "cup") {

    return (
      "HG-CUP-" +
      random
    );

  }

  if (type === "tournament") {

    return (
      "HG-TOUR-" +
      random
    );

  }

  if (type === "hastanMatch") {

    return (
      "HG-HM-" +
      random
    );

  }

  return (
    "HG-MATCH-" +
    random
  );
}


/* =========================================================
   EXPORT GAME FUNCTIONS
========================================================= */

window.HASTAN_GAME = {

  auth,

  db,

  storage,

  getCurrentGamePlayer,

  getGamePlayerProfile,

  getGamerBalance,

  listenToGamerBalance,

  isGameAccountActive,

  generateMatchId,

  config: HASTAN_GAME_CONFIG,

  requireGameUser

};


console.log(
  "HASTAN GAME: REAL FIREBASE SYSTEM LOADED."
);