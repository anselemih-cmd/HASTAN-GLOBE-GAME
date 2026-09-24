// ======================================================
// HASTAN GLOBE - MAIN ADMIN
// REAL FIREBASE ADMIN SYSTEM
// BALANCE + PERSONAL REFERRAL SYSTEM
// ======================================================

const MAIN_ADMIN_UID = "FkMOO6jsgJZvnJV36sl3RrHLd063";

const REFERRAL_BASE_URL =
    "https://hastanglobe.com/register";

let auth;
let db;
let storage;

let firebaseReady = false;
let firestore;
let storageFunctions;


// ======================================================
// LOAD FIREBASE
// ======================================================

async function loadFirebase() {

    try {

        const firebase =
            await import("./firebase-config.js");

        auth = firebase.auth;
        db = firebase.db;
        storage = firebase.storage;

        firebaseReady = true;

        console.log(
            "Firebase loaded successfully."
        );

        startAdmin();

    } catch (error) {

        console.error(
            "Firebase loading error:",
            error
        );

        showMessage(
            "Firebase haijaweza kufunguka. Angalia firebase-config.js.",
            true
        );

    }
}


// ======================================================
// FIRESTORE IMPORTS
// ======================================================

async function loadFirestoreFunctions() {

    firestore =
        await import(
            "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js"
        );

}


// ======================================================
// STORAGE IMPORTS
// ======================================================

async function loadStorageFunctions() {

    storageFunctions =
        await import(
            "https://www.gstatic.com/firebasejs/12.1.0/firebase-storage.js"
        );

}


// ======================================================
// UI MESSAGE
// ======================================================

function showMessage(text, error = false) {

    const box =
        document.getElementById(
            "message"
        );

    if (!box) return;

    box.textContent = text;

    box.className =
        error
            ? "error"
            : "success";

    box.style.display = "block";

    setTimeout(() => {

        box.style.display = "none";

    }, 5000);

}


// ======================================================
// NAVIGATION
// ======================================================

function hideSections() {

    document
        .querySelectorAll(".admin-section")
        .forEach(section => {

            section.classList.add("hidden");

        });

}


function showSection(sectionId) {

    hideSections();

    const section =
        document.getElementById(
            sectionId
        );

    if (!section) {

        console.error(
            "Section not found:",
            sectionId
        );

        return;

    }

    section.classList.remove("hidden");


    if (sectionId === "usersSection") {

        loadUsers();

    }


    if (sectionId === "activitiesSection") {

        loadVideos();
        loadImageAds();
        loadQuizzes();
        loadSpinRewards();

    }


    if (sectionId === "scheduleSection") {

        loadSchedules();

    }


    if (sectionId === "notificationsSection") {

        loadNotifications();

    }

}


// ======================================================
// ACTIVITY TABS
// ======================================================

function showActivityTab(tabId) {

    document
        .querySelectorAll(".activity-tab")
        .forEach(tab => {

            tab.classList.add("hidden");

        });


    document
        .querySelectorAll(".activity-menu")
        .forEach(button => {

            button.classList.remove("active");

        });


    const tab =
        document.getElementById(
            tabId
        );

    if (tab) {

        tab.classList.remove("hidden");

    }


    const button =
        document.querySelector(
            `[data-tab="${tabId}"]`
        );

    if (button) {

        button.classList.add("active");

    }

}


// ======================================================
// CONNECT NAVIGATION
// ======================================================

function connectNavigation() {

    document
        .querySelectorAll("[data-section]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    showSection(
                        button.dataset.section
                    );

                }
            );

        });


    document
        .querySelectorAll(".activity-menu")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    showActivityTab(
                        button.dataset.tab
                    );

                }
            );

        });

}


// ======================================================
// ADMIN AUTH
// ======================================================

async function startAdmin() {

    await loadFirestoreFunctions();
    await loadStorageFunctions();


    auth.onAuthStateChanged(
        async user => {

            const loading =
                document.getElementById(
                    "loading"
                );


            if (!user) {

                if (loading) {

                    loading.textContent =
                        "Not logged in.";

                }

                alert(
                    "Hujaingia. Tafadhali login kwanza."
                );

                return;

            }


            console.log(
                "Logged in UID:",
                user.uid
            );


            if (
                user.uid !==
                MAIN_ADMIN_UID
            ) {

                if (loading) {

                    loading.textContent =
                        "Access denied.";

                }

                alert(
                    "ACCESS DENIED: Huna ruhusa ya Main Admin."
                );

                await auth.signOut();

                return;

            }


            if (loading) {

                loading.textContent =
                    "Main Admin verified ✓";

                setTimeout(() => {

                    loading.style.display =
                        "none";

                }, 1000);

            }


            connectNavigation();

            connectForms();


            await loadDashboardStats();

            await loadVideos();

            await loadImageAds();

            await loadQuizzes();

            await loadSpinRewards();

            await loadSchedules();

            await loadNotifications();

        }
    );

}


// ======================================================
// DASHBOARD STATS
// ======================================================

async function loadDashboardStats() {

    try {

        const {
            collection,
            getDocs
        } = firestore;


        const usersSnapshot =
            await getDocs(
                collection(
                    db,
                    "users"
                )
            );


        const videosSnapshot =
            await getDocs(
                collection(
                    db,
                    "videos"
                )
            );


        const schedulesSnapshot =
            await getDocs(
                collection(
                    db,
                    "schedules"
                )
            );


        const notificationsSnapshot =
            await getDocs(
                collection(
                    db,
                    "notifications"
                )
            );


        const totalUsers =
            document.getElementById(
                "totalUsers"
            );

        const videoCount =
            document.getElementById(
                "videoCount"
            );

        const scheduleCount =
            document.getElementById(
                "scheduleCount"
            );

        const notificationCount =
            document.getElementById(
                "notificationCount"
            );


        if (totalUsers) {

            totalUsers.textContent =
                usersSnapshot.size;

        }


        if (videoCount) {

            videoCount.textContent =
                videosSnapshot.size;

        }


        if (scheduleCount) {

            scheduleCount.textContent =
                schedulesSnapshot.size;

        }


        if (notificationCount) {

            notificationCount.textContent =
                notificationsSnapshot.size;

        }


    } catch (error) {

        console.error(
            "Stats error:",
            error
        );

    }

}


// ======================================================
// REFERRAL CODE
// ======================================================

function createReferralCode(uid) {

    if (!uid) return "";

    return uid
        .replace(
            /[^a-zA-Z0-9]/g,
            ""
        )
        .substring(
            0,
            8
        )
        .toUpperCase();

}


// ======================================================
// PERSONAL REFERRAL LINK
// ======================================================

function createReferralLink(code) {

    if (!code) return "";

    return (
        REFERRAL_BASE_URL +
        "?ref=" +
        encodeURIComponent(code)
    );

}


// ======================================================
// ENSURE USER BALANCE + REFERRAL DATA
// ======================================================

async function ensureUserAccountData(
    userId,
    data
) {

    const {
        doc,
        updateDoc
    } = firestore;


    const updates = {};


    if (
        typeof data.mainBalance !==
        "number"
    ) {

        updates.mainBalance = 0;

    }


    if (
        typeof data.activityEarnings !==
        "number"
    ) {

        updates.activityEarnings = 0;

    }


    const mainBalance =
        typeof data.mainBalance === "number"
            ? data.mainBalance
            : 0;


    const activityEarnings =
        typeof data.activityEarnings === "number"
            ? data.activityEarnings
            : 0;


    const correctNetProfit =
        mainBalance +
        activityEarnings;


    if (
        typeof data.netProfit !==
            "number" ||
        data.netProfit !==
            correctNetProfit
    ) {

        updates.netProfit =
            correctNetProfit;

    }


    if (
        typeof data.expenses !==
        "number"
    ) {

        updates.expenses = 0;

    }


    let referralCode =
        data.referralCode;


    if (!referralCode) {

        referralCode =
            createReferralCode(
                userId
            );

        updates.referralCode =
            referralCode;

    }


    const correctReferralLink =
        createReferralLink(
            referralCode
        );


    if (
        data.referralLink !==
        correctReferralLink
    ) {

        updates.referralLink =
            correctReferralLink;

    }


    if (
        Object.keys(updates).length > 0
    ) {

        await updateDoc(
            doc(
                db,
                "users",
                userId
            ),
            updates
        );

        return {
            ...data,
            ...updates
        };

    }


    return data;

}


// ======================================================
// USERS
// ======================================================

async function loadUsers() {

    const list =
        document.getElementById(
            "usersList"
        );

    if (!list) return;


    list.innerHTML =
        `<div class="empty">
            Loading users...
        </div>`;


    try {

        const {
            collection,
            getDocs
        } = firestore;


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
                    No users found.
                </div>`;

            return;

        }


        list.innerHTML = "";


        for (
            const docSnap of snapshot.docs
        ) {

            let data =
                docSnap.data();


            try {

                data =
                    await ensureUserAccountData(
                        docSnap.id,
                        data
                    );

            } catch (accountError) {

                console.error(
                    "Account data error:",
                    accountError
                );

            }


            const name =
                data.name ||
                data.fullName ||
                "Unknown User";


            const email =
                data.email ||
                "No email";


            const phone =
                data.phone ||
                data.phoneNumber ||
                "No phone";


            const mainBalance =
                Number(
                    data.mainBalance || 0
                );


            const activityEarnings =
                Number(
                    data.activityEarnings || 0
                );


            const netProfit =
                mainBalance +
                activityEarnings;


            const expenses =
                Number(
                    data.expenses || 0
                );


            const referralCode =
                data.referralCode ||
                "";


            const referralLink =
                data.referralLink ||
                createReferralLink(
                    referralCode
                );


            const referredBy =
                data.referredBy ||
                "Direct / None";


            const div =
                document.createElement(
                    "div"
                );


            div.className =
                "item";


            div.innerHTML = `

                <h3>
                    ${escapeHtml(name)}
                </h3>

                <p>
                    <strong>Email:</strong>
                    ${escapeHtml(email)}
                </p>

                <p>
                    <strong>Phone:</strong>
                    ${escapeHtml(phone)}
                </p>

                <p>
                    <strong>UID:</strong>
                    ${escapeHtml(docSnap.id)}
                </p>

                <hr>

                <p>
                    💰 Main Balance:
                    <strong>
                        TSh ${mainBalance.toLocaleString()}
                    </strong>
                </p>

                <p>
                    🎯 Activity Earnings:
                    <strong>
                        TSh ${activityEarnings.toLocaleString()}
                    </strong>
                </p>

                <p>
                    📊 Net Profit:
                    <strong>
                        TSh ${netProfit.toLocaleString()}
                    </strong>
                </p>

                <p>
                    💸 Expenses:
                    <strong>
                        TSh ${expenses.toLocaleString()}
                    </strong>
                </p>

                <hr>

                <p>
                    🔗 Referral Code:
                    <strong>
                        ${escapeHtml(
                            referralCode
                        )}
                    </strong>
                </p>

                <p>
                    👤 Referred By:
                    <strong>
                        ${escapeHtml(
                            referredBy
                        )}
                    </strong>
                </p>

                <p>
                    🔗 Personal Referral Link:
                </p>

                <p style="
                    word-break:break-all;
                    font-size:13px;
                ">
                    ${escapeHtml(
                        referralLink
                    )}
                </p>

            `;


            list.appendChild(div);

        }


    } catch (error) {

        console.error(
            "Users error:",
            error
        );

        list.innerHTML =
            `<div class="empty">
                Unable to load users.
            </div>`;

    }

}


// ======================================================
// VIDEO - SAVE
// ======================================================

async function saveVideo(event) {

    event.preventDefault();


    const id =
        document
            .getElementById("videoId")
            .value
            .trim();


    const title =
        document
            .getElementById("videoTitle")
            .value
            .trim();


    const url =
        document
            .getElementById("videoUrl")
            .value
            .trim();


    const description =
        document
            .getElementById(
                "videoDescription"
            )
            .value
            .trim();


    const reward =
        Number(
            document
                .getElementById(
                    "videoReward"
                )
                .value
        );


    if (!title || !url) {

        showMessage(
            "Jaza title na video URL.",
            true
        );

        return;

    }


    try {

        const {
            collection,
            doc,
            addDoc,
            updateDoc,
            serverTimestamp
        } = firestore;


        const data = {

            title,

            url,

            description,

            reward,

            type: "video",

            updatedAt:
                serverTimestamp()

        };


        if (id) {

            await updateDoc(
                doc(
                    db,
                    "videos",
                    id
                ),
                data
            );


            showMessage(
                "Video imebadilishwa ✓"
            );

        } else {

            data.createdAt =
                serverTimestamp();


            await addDoc(
                collection(
                    db,
                    "videos"
                ),
                data
            );


            showMessage(
                "Video imeongezwa ✓"
            );

        }


        resetVideoForm();

        await loadVideos();

        await loadDashboardStats();


    } catch (error) {

        console.error(
            "Video save error:",
            error
        );

        showMessage(
            "Imeshindikana kuhifadhi video: " +
            error.message,
            true
        );

    }

}


// ======================================================
// VIDEO - LOAD
// ======================================================

async function loadVideos() {

    const list =
        document.getElementById(
            "videosList"
        );

    if (!list || !firebaseReady) return;


    list.innerHTML =
        `<div class="empty">
            Loading videos...
        </div>`;


    try {

        const {
            collection,
            getDocs
        } = firestore;


        const snapshot =
            await getDocs(
                collection(
                    db,
                    "videos"
                )
            );


        if (snapshot.empty) {

            list.innerHTML =
                `<div class="empty">
                    No videos yet.
                </div>`;

            return;

        }


        list.innerHTML = "";


        snapshot.forEach(
            docSnap => {

                const data =
                    docSnap.data();


                const item =
                    document.createElement(
                        "div"
                    );


                item.className =
                    "item";


                item.innerHTML = `

                    <h3>
                        ${escapeHtml(
                            data.title ||
                            "Untitled"
                        )}
                    </h3>

                    <p>
                        ${escapeHtml(
                            data.description ||
                            ""
                        )}
                    </p>

                    <p>
                        💰 Reward:
                        <strong>
                            TSh ${Number(
                                data.reward ||
                                0
                            ).toLocaleString()}
                        </strong>
                    </p>

                    <p>
                        🔗
                        ${escapeHtml(
                            data.url ||
                            ""
                        )}
                    </p>

                    <div class="item-actions">

                        <button
                            class="secondary edit-video">
                            Edit
                        </button>

                        <button
                            class="danger delete-video">
                            Delete
                        </button>

                    </div>

                `;


                item
                    .querySelector(
                        ".edit-video"
                    )
                    .addEventListener(
                        "click",
                        () => editVideo(
                            docSnap.id,
                            data
                        )
                    );


                item
                    .querySelector(
                        ".delete-video"
                    )
                    .addEventListener(
                        "click",
                        () => deleteVideo(
                            docSnap.id
                        )
                    );


                list.appendChild(item);

            }
        );


    } catch (error) {

        console.error(
            "Video load error:",
            error
        );

        list.innerHTML =
            `<div class="empty">
                Failed to load videos.
            </div>`;

    }

}


// ======================================================
// VIDEO - EDIT
// ======================================================

function editVideo(id, data) {

    document.getElementById(
        "videoId"
    ).value = id;


    document.getElementById(
        "videoTitle"
    ).value =
        data.title || "";


    document.getElementById(
        "videoUrl"
    ).value =
        data.url || "";


    document.getElementById(
        "videoDescription"
    ).value =
        data.description || "";


    document.getElementById(
        "videoReward"
    ).value =
        data.reward || 0;


    document
        .getElementById(
            "cancelVideoEdit"
        )
        .classList.remove(
            "hidden"
        );


    document
        .getElementById(
            "videosTab"
        )
        .scrollIntoView({
            behavior: "smooth"
        });

}


// ======================================================
// VIDEO - DELETE
// ======================================================

async function deleteVideo(id) {

    if (
        !confirm(
            "Unataka kufuta video hii?"
        )
    ) return;


    try {

        const {
            doc,
            deleteDoc
        } = firestore;


        await deleteDoc(
            doc(
                db,
                "videos",
                id
            )
        );


        showMessage(
            "Video imefutwa ✓"
        );


        await loadVideos();

        await loadDashboardStats();


    } catch (error) {

        console.error(
            "Video delete error:",
            error
        );

        showMessage(
            "Video haikufutika.",
            true
        );

    }

}


// ======================================================
// POSTER PREVIEW
// ======================================================

function connectImagePreview() {

    const input =
        document.getElementById(
            "adImageFile"
        );


    const preview =
        document.getElementById(
            "adPreview"
        );


    if (!input || !preview) return;


    input.addEventListener(
        "change",
        () => {

            const file =
                input.files[0];


            if (!file) {

                preview.src = "";

                preview.style.display =
                    "none";

                return;

            }


            if (
                !file.type.startsWith(
                    "image/"
                )
            ) {

                preview.src = "";

                preview.style.display =
                    "none";

                showMessage(
                    "Tafadhali chagua picha halisi.",
                    true
                );

                return;

            }


            const reader =
                new FileReader();


            reader.onload =
                event => {

                    preview.src =
                        event.target.result;

                    preview.style.display =
                        "block";

                };


            reader.readAsDataURL(file);

        }
    );

}


// ======================================================
// POSTER - SAVE
// ======================================================

async function savePoster(event) {

    if (event) {

        event.preventDefault();

        event.stopPropagation();

    }


    console.log(
        "POSTER SAVE STARTED"
    );


    const id =
        document.getElementById(
            "adId"
        )?.value.trim() || "";


    const title =
        document.getElementById(
            "adTitle"
        )?.value.trim() || "";


    const description =
        document.getElementById(
            "adDescription"
        )?.value.trim() || "";


    const reward =
        Number(
            document.getElementById(
                "adReward"
            )?.value || 0
        );


    const fileInput =
        document.getElementById(
            "adImageFile"
        );


    const file =
        fileInput &&
        fileInput.files &&
        fileInput.files.length > 0
            ? fileInput.files[0]
            : null;


    // --------------------------------------------------
    // VALIDATION
    // --------------------------------------------------

    if (!title) {

        showMessage(
            "Weka title ya poster.",
            true
        );

        return;

    }


    if (!id && !file) {

        showMessage(
            "Chagua picha kwanza.",
            true
        );

        return;

    }


    if (
        file &&
        !file.type.startsWith(
            "image/"
        )
    ) {

        showMessage(
            "Tafadhali chagua image halisi.",
            true
        );

        return;

    }


    if (
        file &&
        file.size >
        10 * 1024 * 1024
    ) {

        showMessage(
            "Picha ni kubwa sana. Maximum ni 10 MB.",
            true
        );

        return;

    }


    // --------------------------------------------------
    // CHECK FIREBASE
    // --------------------------------------------------

    if (!firebaseReady) {

        showMessage(
            "Firebase bado haijawa tayari. Subiri kidogo kisha jaribu tena.",
            true
        );

        return;

    }


    if (!storage) {

        console.error(
            "Storage object haipo:",
            storage
        );

        showMessage(
            "Firebase Storage haijaunganishwa.",
            true
        );

        return;

    }


    if (!storageFunctions) {

        console.error(
            "storageFunctions haipo:",
            storageFunctions
        );

        showMessage(
            "Firebase Storage functions hazijapakiwa.",
            true
        );

        return;

    }


    try {

        const {
            collection,
            doc,
            addDoc,
            updateDoc,
            getDoc,
            serverTimestamp
        } = firestore;


        let imageUrl = "";

        let oldData = {};


        // --------------------------------------------------
        // GET OLD POSTER WHEN EDITING
        // --------------------------------------------------

        if (id) {

            const oldSnapshot =
                await getDoc(
                    doc(
                        db,
                        "imageAds",
                        id
                    )
                );


            if (
                oldSnapshot.exists()
            ) {

                oldData =
                    oldSnapshot.data();

            }

        }


        // --------------------------------------------------
        // UPLOAD NEW IMAGE
        // --------------------------------------------------

        if (file) {

            showMessage(
                "Uploading image..."
            );


            const {
                ref,
                uploadBytes,
                getDownloadURL
            } = storageFunctions;


            if (
                typeof ref !== "function" ||
                typeof uploadBytes !== "function" ||
                typeof getDownloadURL !== "function"
            ) {

                throw new Error(
                    "Firebase Storage functions hazijapakiwa vizuri."
                );

            }


            const safeName =
                file.name.replace(
                    /[^a-zA-Z0-9._-]/g,
                    "_"
                );


            const filePath =
                "posters/" +
                Date.now() +
                "_" +
                safeName;


            console.log(
                "Uploading poster to:",
                filePath
            );


            const storageRef =
                ref(
                    storage,
                    filePath
                );


            const metadata = {

                contentType:
                    file.type

            };


            await uploadBytes(
                storageRef,
                file,
                metadata
            );


            console.log(
                "Image uploaded successfully."
            );


            imageUrl =
                await getDownloadURL(
                    storageRef
                );


            console.log(
                "Image URL:",
                imageUrl
            );

        }


        // --------------------------------------------------
        // KEEP OLD IMAGE WHEN EDITING WITHOUT NEW FILE
        // --------------------------------------------------

        else {

            imageUrl =
                oldData.imageUrl ||
                "";

        }


        // --------------------------------------------------
        // UPDATE EXISTING POSTER
        // --------------------------------------------------

        if (id) {

            await updateDoc(
                doc(
                    db,
                    "imageAds",
                    id
                ),
                {

                    title,

                    description,

                    reward,

                    imageUrl,

                    type: "poster",

                    updatedAt:
                        serverTimestamp()

                }
            );


            showMessage(
                "Poster imebadilishwa ✓"
            );

        }


        // --------------------------------------------------
        // CREATE NEW POSTER
        // --------------------------------------------------

        else {

            await addDoc(
                collection(
                    db,
                    "imageAds"
                ),
                {

                    title,

                    description,

                    reward,

                    imageUrl,

                    type: "poster",

                    createdAt:
                        serverTimestamp(),

                    updatedAt:
                        serverTimestamp()

                }
            );


            showMessage(
                "Poster ime-uploadiwa na kuhifadhiwa ✓"
            );

        }


        // --------------------------------------------------
        // RESET + RELOAD
        // --------------------------------------------------

        resetPosterForm();

        await loadImageAds();

        await loadDashboardStats();


    } catch (error) {

        console.error(
            "POSTER SAVE ERROR:",
            error
        );


        console.error(
            "Error code:",
            error?.code
        );


        console.error(
            "Error message:",
            error?.message
        );


        showMessage(
            "Poster haikuhifadhiwa: " +
            (
                error?.code ||
                "ERROR"
            ) +
            " - " +
            (
                error?.message ||
                "Unknown error"
            ),
            true
        );

    }

}


// ======================================================
// POSTER - LOAD
// ======================================================

async function loadImageAds() {

    const list =
        document.getElementById(
            "imageAdsList"
        );


    if (!list || !firebaseReady) return;


    list.innerHTML =
        `<div class="empty">
            Loading posters...
        </div>`;


    try {

        const {
            collection,
            getDocs
        } = firestore;


        const snapshot =
            await getDocs(
                collection(
                    db,
                    "imageAds"
                )
            );


        if (snapshot.empty) {

            list.innerHTML =
                `<div class="empty">
                    No posters yet.
                </div>`;

            return;

        }


        list.innerHTML = "";


        snapshot.forEach(
            docSnap => {

                const data =
                    docSnap.data();


                const item =
                    document.createElement(
                        "div"
                    );


                item.className =
                    "item";


                item.innerHTML = `

                    <div class="poster-card">

                        ${
                            data.imageUrl
                            ?
                            `
                            <img
                                src="${escapeAttribute(
                                    data.imageUrl
                                )}"
                                alt="Poster">
                            `
                            :
                            ""
                        }

                        <div>

                            <h3>
                                ${escapeHtml(
                                    data.title ||
                                    "Untitled"
                                )}
                            </h3>

                            <p>
                                ${escapeHtml(
                                    data.description ||
                                    ""
                                )}
                            </p>

                            <p>
                                💰 Reward:
                                <strong>
                                    TSh ${Number(
                                        data.reward ||
                                        0
                                    ).toLocaleString()}
                                </strong>
                            </p>

                            <p>
                                📌 Type:
                                ${escapeHtml(
                                    data.type ||
                                    "poster"
                                )}
                            </p>

                        </div>

                    </div>

                    <div class="item-actions">

                        <button
                            class="secondary edit-ad"
                            type="button">
                            Edit
                        </button>

                        <button
                            class="danger delete-ad"
                            type="button">
                            Delete
                        </button>

                    </div>

                `;


                item
                    .querySelector(
                        ".edit-ad"
                    )
                    .addEventListener(
                        "click",
                        () => editPoster(
                            docSnap.id,
                            data
                        )
                    );


                item
                    .querySelector(
                        ".delete-ad"
                    )
                    .addEventListener(
                        "click",
                        () => deletePoster(
                            docSnap.id
                        )
                    );


                list.appendChild(item);

            }
        );


    } catch (error) {

        console.error(
            "Poster load error:",
            error
        );


        list.innerHTML =
            `<div class="empty">
                Failed to load posters:
                ${escapeHtml(
                    error.message
                )}
            </div>`;

    }

}


// ======================================================
// POSTER - EDIT
// ======================================================

function editPoster(id, data) {

    document.getElementById(
        "adId"
    ).value = id;


    document.getElementById(
        "adTitle"
    ).value =
        data.title || "";


    document.getElementById(
        "adDescription"
    ).value =
        data.description || "";


    document.getElementById(
        "adReward"
    ).value =
        data.reward || 0;


    const fileInput =
        document.getElementById(
            "adImageFile"
        );


    const preview =
        document.getElementById(
            "adPreview"
        );


    if (fileInput) {

        fileInput.required =
            false;

        fileInput.value = "";

    }


    if (
        preview &&
        data.imageUrl
    ) {

        preview.src =
            data.imageUrl;

        preview.style.display =
            "block";

    }


    document
        .getElementById(
            "cancelAdEdit"
        )
        .classList.remove(
            "hidden"
        );


    document
        .getElementById(
            "adsTab"
        )
        .scrollIntoView({
            behavior: "smooth"
        });

}


// ======================================================
// POSTER - DELETE
// ======================================================

async function deletePoster(id) {

    if (
        !confirm(
            "Unataka kufuta poster hii?"
        )
    ) return;


    try {

        const {
            doc,
            deleteDoc
        } = firestore;


        await deleteDoc(
            doc(
                db,
                "imageAds",
                id
            )
        );


        showMessage(
            "Poster imefutwa ✓"
        );


        await loadImageAds();

        await loadDashboardStats();


    } catch (error) {

        console.error(
            "Poster delete error:",
            error
        );


        showMessage(
            "Poster haikufutika: " +
            error.message,
            true
        );

    }

}


// ======================================================
// QUIZ - SAVE
// ======================================================

async function saveQuiz(event) {

    event.preventDefault();


    const id =
        document
            .getElementById(
                "quizId"
            )
            .value
            .trim();


    const data = {

        question:
            document
                .getElementById(
                    "quizQuestion"
                )
                .value
                .trim(),

        optionA:
            document
                .getElementById(
                    "quizOptionA"
                )
                .value
                .trim(),

        optionB:
            document
                .getElementById(
                    "quizOptionB"
                )
                .value
                .trim(),

        optionC:
            document
                .getElementById(
                    "quizOptionC"
                )
                .value
                .trim(),

        optionD:
            document
                .getElementById(
                    "quizOptionD"
                )
                .value
                .trim(),

        correctAnswer:
            document
                .getElementById(
                    "quizCorrectAnswer"
                )
                .value,

        reward:
            Number(
                document
                    .getElementById(
                        "quizReward"
                    )
                    .value
            )

    };


    if (!data.question) {

        showMessage(
            "Weka swali.",
            true
        );

        return;

    }


    try {

        const {
            collection,
            doc,
            addDoc,
            updateDoc,
            serverTimestamp
        } = firestore;


        if (id) {

            await updateDoc(
                doc(
                    db,
                    "travelQuizzes",
                    id
                ),
                {

                    ...data,

                    updatedAt:
                        serverTimestamp()

                }
            );


            showMessage(
                "Quiz imebadilishwa ✓"
            );

        } else {

            await addDoc(
                collection(
                    db,
                    "travelQuizzes"
                ),
                {

                    ...data,

                    createdAt:
                        serverTimestamp(),

                    updatedAt:
                        serverTimestamp()

                }
            );


            showMessage(
                "Quiz imeongezwa ✓"
            );

        }


        resetQuizForm();

        await loadQuizzes();


    } catch (error) {

        console.error(
            "Quiz error:",
            error
        );


        showMessage(
            "Quiz haikuhifadhiwa: " +
            error.message,
            true
        );

    }

}


// ======================================================
// QUIZ - LOAD
// ======================================================

async function loadQuizzes() {

    const list =
        document.getElementById(
            "travelQuizList"
        );


    if (!list || !firebaseReady) return;


    list.innerHTML =
        `<div class="empty">
            Loading quizzes...
        </div>`;


    try {

        const {
            collection,
            getDocs
        } = firestore;


        const snapshot =
            await getDocs(
                collection(
                    db,
                    "travelQuizzes"
                )
            );


        if (snapshot.empty) {

            list.innerHTML =
                `<div class="empty">
                    No quizzes yet.
                </div>`;

            return;

        }


        list.innerHTML = "";


        snapshot.forEach(
            docSnap => {

                const data =
                    docSnap.data();


                const item =
                    document.createElement(
                        "div"
                    );


                item.className =
                    "item";


                item.innerHTML = `

                    <h3>
                        ${escapeHtml(
                            data.question ||
                            ""
                        )}
                    </h3>

                    <p>
                        A:
                        ${escapeHtml(
                            data.optionA ||
                            ""
                        )}
                    </p>

                    <p>
                        B:
                        ${escapeHtml(
                            data.optionB ||
                            ""
                        )}
                    </p>

                    <p>
                        C:
                        ${escapeHtml(
                            data.optionC ||
                            ""
                        )}
                    </p>

                    <p>
                        D:
                        ${escapeHtml(
                            data.optionD ||
                            ""
                        )}
                    </p>

                    <p>
                        Correct:
                        <strong>
                            ${escapeHtml(
                                data.correctAnswer ||
                                ""
                            )}
                        </strong>
                    </p>

                    <p>
                        💰 Reward:
                        <strong>
                            TSh ${Number(
                                data.reward ||
                                0
                            ).toLocaleString()}
                        </strong>
                    </p>

                    <div class="item-actions">

                        <button
                            class="secondary edit-quiz"
                            type="button">
                            Edit
                        </button>

                        <button
                            class="danger delete-quiz"
                            type="button">
                            Delete
                        </button>

                    </div>

                `;


                item
                    .querySelector(
                        ".edit-quiz"
                    )
                    .addEventListener(
                        "click",
                        () => editQuiz(
                            docSnap.id,
                            data
                        )
                    );


                item
                    .querySelector(
                        ".delete-quiz"
                    )
                    .addEventListener(
                        "click",
                        () => deleteQuiz(
                            docSnap.id
                        )
                    );


                list.appendChild(item);

            }
        );


    } catch (error) {

        console.error(
            "Quiz load error:",
            error
        );


        list.innerHTML =
            `<div class="empty">
                Failed to load quizzes.
            </div>`;

    }

}


// ======================================================
// QUIZ - EDIT
// ======================================================

function editQuiz(id, data) {

    document.getElementById(
        "quizId"
    ).value = id;


    document.getElementById(
        "quizQuestion"
    ).value =
        data.question || "";


    document.getElementById(
        "quizOptionA"
    ).value =
        data.optionA || "";


    document.getElementById(
        "quizOptionB"
    ).value =
        data.optionB || "";


    document.getElementById(
        "quizOptionC"
    ).value =
        data.optionC || "";


    document.getElementById(
        "quizOptionD"
    ).value =
        data.optionD || "";


    document.getElementById(
        "quizCorrectAnswer"
    ).value =
        data.correctAnswer || "";


    document.getElementById(
        "quizReward"
    ).value =
        data.reward || 0;


    document
        .getElementById(
            "cancelQuizEdit"
        )
        .classList.remove(
            "hidden"
        );

}


// ======================================================
// QUIZ - DELETE
// ======================================================

async function deleteQuiz(id) {

    if (
        !confirm(
            "Unataka kufuta quiz hii?"
        )
    ) return;


    try {

        const {
            doc,
            deleteDoc
        } = firestore;


        await deleteDoc(
            doc(
                db,
                "travelQuizzes",
                id
            )
        );


        showMessage(
            "Quiz imefutwa ✓"
        );


        await loadQuizzes();


    } catch (error) {

        console.error(
            "Quiz delete error:",
            error
        );


        showMessage(
            "Quiz haikufutika.",
            true
        );

    }

}


// ======================================================
// SPIN CYCLE - GET CURRENT CONFIG
// ======================================================

async function getCurrentSpinCycle() {

    const {
        doc,
        getDoc
    } = firestore;


    const configRef =
        doc(
            db,
            "spinWheelConfig",
            "current"
        );


    const configSnapshot =
        await getDoc(
            configRef
        );


    if (
        configSnapshot.exists()
    ) {

        const data =
            configSnapshot.data();


        if (
            data.cycleId
        ) {

            return String(
                data.cycleId
            ).trim();

        }

    }


    // --------------------------------------------------
    // FIRST TIME: CHECK OLD REWARDS
    // --------------------------------------------------

    const {
        collection,
        getDocs,
        setDoc,
        serverTimestamp
    } = firestore;


    const rewardSnapshot =
        await getDocs(
            collection(
                db,
                "spinWheel"
            )
        );


    let oldCycleId = "";


    rewardSnapshot.forEach(
        spinDoc => {

            const data =
                spinDoc.data();


            if (
                !oldCycleId &&
                data.cycleId
            ) {

                oldCycleId =
                    String(
                        data.cycleId
                    ).trim();

            }

        }
    );


    const cycleId =
        oldCycleId ||
        (
            "spin_" +
            Date.now()
        );


    await setDoc(
        configRef,
        {

            cycleId,

            updatedAt:
                serverTimestamp(),

            createdAt:
                serverTimestamp()

        },
        {
            merge: true
        }
    );


    // --------------------------------------------------
    // MIGRATE OLD REWARDS WITHOUT cycleId
    // --------------------------------------------------

    for (
        const spinDoc
        of rewardSnapshot.docs
    ) {

        const data =
            spinDoc.data();


        if (!data.cycleId) {

            await firestore.updateDoc(
                firestore.doc(
                    db,
                    "spinWheel",
                    spinDoc.id
                ),
                {

                    cycleId,

                    updatedAt:
                        serverTimestamp()

                }
            );

        }

    }


    return cycleId;

}


// ======================================================
// SPIN CYCLE - START NEW CYCLE
// ======================================================

async function startNewSpinCycle() {

    if (!firebaseReady) {

        showMessage(
            "Firebase bado haijawa tayari.",
            true
        );

        return;

    }


    const confirmed =
        confirm(
            "Unataka kuanzisha Spin Cycle mpya?\n\n" +
            "Users wote wataweza ku-spin mara moja kwenye cycle mpya."
        );


    if (!confirmed) return;


    try {

        const {
            doc,
            setDoc,
            serverTimestamp
        } = firestore;


        const newCycleId =
            "spin_" +
            Date.now();


        await setDoc(
            doc(
                db,
                "spinWheelConfig",
                "current"
            ),
            {

                cycleId:
                    newCycleId,

                updatedAt:
                    serverTimestamp(),

                createdAt:
                    serverTimestamp()

            },
            {
                merge: true
            }
        );


        showMessage(
            "Spin Cycle mpya imeanza ✓"
        );


        await loadSpinRewards();


    } catch (error) {

        console.error(
            "New Spin Cycle error:",
            error
        );


        showMessage(
            "Spin Cycle mpya haikuanza: " +
            error.message,
            true
        );

    }

}


// ======================================================
// SPIN CYCLE - ADD ADMIN BUTTON
// ======================================================

function ensureSpinCycleButton() {

    const spinTab =
        document.getElementById(
            "spinTab"
        );


    if (!spinTab) return;


    if (
        document.getElementById(
            "newSpinCycleButton"
        )
    ) return;


    const button =
        document.createElement(
            "button"
        );


    button.id =
        "newSpinCycleButton";


    button.type =
        "button";


    button.className =
        "primary";


    button.textContent =
        "🔄 Start New Spin Cycle";


    button.style.marginBottom =
        "15px";


    button.addEventListener(
        "click",
        startNewSpinCycle
    );


    const heading =
        spinTab.querySelector(
            "h3"
        );


    if (heading) {

        heading.insertAdjacentElement(
            "afterend",
            button
        );

    } else {

        spinTab.prepend(
            button
        );

    }

}


// ======================================================
// SPIN - SAVE
// ======================================================

async function saveSpin(event) {

    event.preventDefault();


    const id =
        document
            .getElementById(
                "spinId"
            )
            .value
            .trim();


    const data = {

        name:
            document
                .getElementById(
                    "spinName"
                )
                .value
                .trim(),

        amount:
            Number(
                document
                    .getElementById(
                        "spinAmount"
                    )
                    .value
            ),

        probability:
            Number(
                document
                    .getElementById(
                        "spinProbability"
                    )
                    .value
            )

    };


    if (!data.name) {

        showMessage(
            "Weka Reward Name.",
            true
        );

        return;

    }


    if (
        data.amount < 0
    ) {

        showMessage(
            "Amount haiwezi kuwa chini ya 0.",
            true
        );

        return;

    }


    if (
        data.probability < 0 ||
        data.probability > 100
    ) {

        showMessage(
            "Probability lazima iwe 0 hadi 100%.",
            true
        );

        return;

    }


    try {

        const {
            collection,
            doc,
            addDoc,
            updateDoc,
            getDocs,
            setDoc,
            serverTimestamp
        } = firestore;


        // ==================================================
        // GET CURRENT CYCLE
        // ==================================================

        let cycleId =
            await getCurrentSpinCycle();


        if (!cycleId) {

            cycleId =
                "spin_" +
                Date.now();


            await setDoc(
                doc(
                    db,
                    "spinWheelConfig",
                    "current"
                ),
                {

                    cycleId,

                    updatedAt:
                        serverTimestamp()

                },
                {
                    merge: true
                }
            );

        }


        // ==================================================
        // GET ALL REWARDS
        // ==================================================

        const spinSnapshot =
            await getDocs(
                collection(
                    db,
                    "spinWheel"
                )
            );


        // ==================================================
        // MIGRATE OLD REWARDS
        // ==================================================

        for (
            const spinDoc
            of spinSnapshot.docs
        ) {

            const oldData =
                spinDoc.data();


            if (
                !oldData.cycleId
            ) {

                await updateDoc(
                    doc(
                        db,
                        "spinWheel",
                        spinDoc.id
                    ),
                    {

                        cycleId,

                        updatedAt:
                            serverTimestamp()

                    }
                );

            }

        }


        // ==================================================
        // EDIT EXISTING REWARD
        // ==================================================

        if (id) {

            await updateDoc(
                doc(
                    db,
                    "spinWheel",
                    id
                ),
                {

                    ...data,

                    cycleId,

                    updatedAt:
                        serverTimestamp()

                }
            );


            showMessage(
                "Spin reward imebadilishwa ✓"
            );

        }


        // ==================================================
        // ADD NEW REWARD
        // ==================================================

        else {

            await addDoc(
                collection(
                    db,
                    "spinWheel"
                ),
                {

                    ...data,

                    cycleId,

                    createdAt:
                        serverTimestamp(),

                    updatedAt:
                        serverTimestamp()

                }
            );


            showMessage(
                "Spin reward imeongezwa ✓"
            );

        }


        resetSpinForm();

        await loadSpinRewards();


    } catch (error) {

        console.error(
            "Spin error:",
            error
        );


        showMessage(
            "Spin reward haikuhifadhiwa: " +
            error.message,
            true
        );

    }

}


// ======================================================
// SPIN - LOAD
// ======================================================

async function loadSpinRewards() {

    const list =
        document.getElementById(
            "spinWheelList"
        );


    if (!list || !firebaseReady) return;


    list.innerHTML =
        `<div class="empty">
            Loading spin rewards...
        </div>`;


    try {

        const {
            collection,
            getDocs
        } = firestore;


        // --------------------------------------------------
        // MAKE SURE CURRENT CYCLE EXISTS
        // --------------------------------------------------

        const currentCycleId =
            await getCurrentSpinCycle();


        ensureSpinCycleButton();


        const snapshot =
            await getDocs(
                collection(
                    db,
                    "spinWheel"
                )
            );


        if (snapshot.empty) {

            list.innerHTML =
                `<div class="empty">
                    No spin rewards yet.
                </div>`;

            return;

        }


        list.innerHTML = "";


        let visibleCount = 0;


        snapshot.forEach(
            docSnap => {

                const data =
                    docSnap.data();


                const rewardCycleId =
                    String(
                        data.cycleId ||
                        ""
                    ).trim();


                // --------------------------------------------------
                // SHOW CURRENT CYCLE ONLY
                // --------------------------------------------------

                if (
                    rewardCycleId !==
                    currentCycleId
                ) {

                    return;

                }


                visibleCount++;


                const item =
                    document.createElement(
                        "div"
                    );


                item.className =
                    "item";


                item.innerHTML = `

                    <h3>
                        ${escapeHtml(
                            data.name ||
                            ""
                        )}
                    </h3>

                    <p>
                        💰 Amount:
                        <strong>
                            TSh ${Number(
                                data.amount ||
                                0
                            ).toLocaleString()}
                        </strong>
                    </p>

                    <p>
                        🎯 Probability:
                        <strong>
                            ${Number(
                                data.probability ||
                                0
                            )}%
                        </strong>
                    </p>

                    <p>
                        🔄 Cycle:
                        <strong>
                            ${escapeHtml(
                                currentCycleId
                            )}
                        </strong>
                    </p>

                    <div class="item-actions">

                        <button
                            class="secondary edit-spin"
                            type="button">
                            Edit
                        </button>

                        <button
                            class="danger delete-spin"
                            type="button">
                            Delete
                        </button>

                    </div>

                `;


                item
                    .querySelector(
                        ".edit-spin"
                    )
                    .addEventListener(
                        "click",
                        () => editSpin(
                            docSnap.id,
                            data
                        )
                    );


                item
                    .querySelector(
                        ".delete-spin"
                    )
                    .addEventListener(
                        "click",
                        () => deleteSpin(
                            docSnap.id
                        )
                    );


                list.appendChild(item);

            }
        );


        if (
            visibleCount === 0
        ) {

            list.innerHTML =
                `<div class="empty">
                    No rewards in the current Spin Cycle yet.
                </div>`;

        }


    } catch (error) {

        console.error(
            "Spin load error:",
            error
        );


        list.innerHTML =
            `<div class="empty">
                Failed to load spin rewards:
                ${escapeHtml(
                    error.message
                )}
            </div>`;

    }

}


// ======================================================
// SPIN - EDIT
// ======================================================

function editSpin(id, data) {

    document.getElementById(
        "spinId"
    ).value = id;


    document.getElementById(
        "spinName"
    ).value =
        data.name || "";


    document.getElementById(
        "spinAmount"
    ).value =
        data.amount || 0;


    document.getElementById(
        "spinProbability"
    ).value =
        data.probability || 0;


    document
        .getElementById(
            "cancelSpinEdit"
        )
        .classList.remove(
            "hidden"
        );

}


// ======================================================
// SPIN - DELETE
// ======================================================

async function deleteSpin(id) {

    if (
        !confirm(
            "Unataka kufuta spin reward hii?"
        )
    ) return;


    try {

        const {
            doc,
            deleteDoc
        } = firestore;


        await deleteDoc(
            doc(
                db,
                "spinWheel",
                id
            )
        );


        showMessage(
            "Spin reward imefutwa ✓"
        );


        await loadSpinRewards();


    } catch (error) {

        console.error(
            "Spin delete error:",
            error
        );


        showMessage(
            "Spin reward haikufutika.",
            true
        );

    }

}


// ======================================================
// SCHEDULE - SAVE
// ======================================================

async function saveSchedule(event) {

    event.preventDefault();


    const id =
        document
            .getElementById(
                "scheduleId"
            )
            .value
            .trim();


    const data = {

        title:
            document
                .getElementById(
                    "scheduleTitle"
                )
                .value
                .trim(),

        date:
            document
                .getElementById(
                    "scheduleDate"
                )
                .value,

        time:
            document
                .getElementById(
                    "scheduleTime"
                )
                .value,

        status:
            document
                .getElementById(
                    "scheduleStatus"
                )
                .value,

        description:
            document
                .getElementById(
                    "scheduleDescription"
                )
                .value
                .trim()

    };


    try {

        const {
            collection,
            doc,
            addDoc,
            updateDoc,
            serverTimestamp
        } = firestore;


        if (id) {

            await updateDoc(
                doc(
                    db,
                    "schedules",
                    id
                ),
                {

                    ...data,

                    updatedAt:
                        serverTimestamp()

                }
            );


            showMessage(
                "Schedule imebadilishwa ✓"
            );

        } else {

            await addDoc(
                collection(
                    db,
                    "schedules"
                ),
                {

                    ...data,

                    createdAt:
                        serverTimestamp(),

                    updatedAt:
                        serverTimestamp()

                }
            );


            showMessage(
                "Schedule imeongezwa ✓"
            );

        }


        resetScheduleForm();

        await loadSchedules();

        await loadDashboardStats();


    } catch (error) {

        console.error(
            "Schedule error:",
            error
        );


        showMessage(
            "Schedule haikuhifadhiwa.",
            true
        );

    }

}


// ======================================================
// SCHEDULE - LOAD
// ======================================================

async function loadSchedules() {

    const list =
        document.getElementById(
            "scheduleList"
        );


    if (!list || !firebaseReady) return;


    list.innerHTML =
        `<div class="empty">
            Loading schedules...
        </div>`;


    try {

        const {
            collection,
            getDocs
        } = firestore;


        const snapshot =
            await getDocs(
                collection(
                    db,
                    "schedules"
                )
            );


        if (snapshot.empty) {

            list.innerHTML =
                `<div class="empty">
                    No schedules yet.
                </div>`;

            return;

        }


        list.innerHTML = "";


        snapshot.forEach(
            docSnap => {

                const data =
                    docSnap.data();


                const item =
                    document.createElement(
                        "div"
                    );


                item.className =
                    "item";


                item.innerHTML = `

                    <h3>
                        ${escapeHtml(
                            data.title ||
                            ""
                        )}
                    </h3>

                    <p>
                        📅
                        ${escapeHtml(
                            data.date ||
                            ""
                        )}

                        &nbsp;

                        ⏰
                        ${escapeHtml(
                            data.time ||
                            ""
                        )}
                    </p>

                    <p>
                        <span class="status">
                            ${escapeHtml(
                                data.status ||
                                ""
                            )}
                        </span>
                    </p>

                    <p>
                        ${escapeHtml(
                            data.description ||
                            ""
                        )}
                    </p>

                    <div class="item-actions">

                        <button
                            class="secondary edit-schedule"
                            type="button">
                            Edit
                        </button>

                        <button
                            class="danger delete-schedule"
                            type="button">
                            Delete
                        </button>

                    </div>

                `;


                item
                    .querySelector(
                        ".edit-schedule"
                    )
                    .addEventListener(
                        "click",
                        () => editSchedule(
                            docSnap.id,
                            data
                        )
                    );


                item
                    .querySelector(
                        ".delete-schedule"
                    )
                    .addEventListener(
                        "click",
                        () => deleteSchedule(
                            docSnap.id
                        )
                    );


                list.appendChild(item);

            }
        );


    } catch (error) {

        console.error(
            "Schedule load error:",
            error
        );


        list.innerHTML =
            `<div class="empty">
                Failed to load schedules.
            </div>`;

    }

}


// ======================================================
// SCHEDULE - EDIT
// ======================================================

function editSchedule(id, data) {

    document.getElementById(
        "scheduleId"
    ).value = id;


    document.getElementById(
        "scheduleTitle"
    ).value =
        data.title || "";


    document.getElementById(
        "scheduleDate"
    ).value =
        data.date || "";


    document.getElementById(
        "scheduleTime"
    ).value =
        data.time || "";


    document.getElementById(
        "scheduleStatus"
    ).value =
        data.status ||
        "upcoming";


    document.getElementById(
        "scheduleDescription"
    ).value =
        data.description || "";


    document
        .getElementById(
            "cancelScheduleEdit"
        )
        .classList.remove(
            "hidden"
        );

}


// ======================================================
// SCHEDULE - DELETE
// ======================================================

async function deleteSchedule(id) {

    if (
        !confirm(
            "Unataka kufuta schedule hii?"
        )
    ) return;


    try {

        const {
            doc,
            deleteDoc
        } = firestore;


        await deleteDoc(
            doc(
                db,
                "schedules",
                id
            )
        );


        showMessage(
            "Schedule imefutwa ✓"
        );


        await loadSchedules();

        await loadDashboardStats();


    } catch (error) {

        console.error(
            "Schedule delete error:",
            error
        );


        showMessage(
            "Schedule haikufutika.",
            true
        );

    }

}


// ======================================================
// NOTIFICATIONS - SAVE
// ======================================================

async function saveNotification(event) {

    event.preventDefault();


    const title =
        document
            .getElementById(
                "notificationTitle"
            )
            .value
            .trim();


    const target =
        document
            .getElementById(
                "notificationTarget"
            )
            .value;


    const message =
        document
            .getElementById(
                "notificationMessage"
            )
            .value
            .trim();


    if (!title || !message) {

        showMessage(
            "Jaza title na message.",
            true
        );

        return;

    }


    try {

        const {
            collection,
            addDoc,
            serverTimestamp
        } = firestore;


        await addDoc(
            collection(
                db,
                "notifications"
            ),
            {

                title,

                message,

                target,

                createdAt:
                    serverTimestamp(),

                createdBy:
                    MAIN_ADMIN_UID

            }
        );


        showMessage(
            "Notification imetumwa ✓"
        );


        document
            .getElementById(
                "notificationForm"
            )
            .reset();


        await loadNotifications();

        await loadDashboardStats();


    } catch (error) {

        console.error(
            "Notification save error:",
            error
        );


        showMessage(
            "Notification haikutumwa.",
            true
        );

    }

}


// ======================================================
// NOTIFICATIONS - LOAD
// ======================================================

async function loadNotifications() {

    const list =
        document.getElementById(
            "notificationsList"
        );


    if (!list || !firebaseReady) return;


    list.innerHTML =
        `<div class="empty">
            Loading notifications...
        </div>`;


    try {

        const {
            collection,
            getDocs
        } = firestore;


        const snapshot =
            await getDocs(
                collection(
                    db,
                    "notifications"
                )
            );


        if (snapshot.empty) {

            list.innerHTML =
                `<div class="empty">
                    No notifications yet.
                </div>`;

            return;

        }


        list.innerHTML = "";


        snapshot.forEach(
            docSnap => {

                const data =
                    docSnap.data();


                const item =
                    document.createElement(
                        "div"
                    );


                item.className =
                    "item";


                item.innerHTML = `

                    <h3>
                        ${escapeHtml(
                            data.title ||
                            ""
                        )}
                    </h3>

                    <p>
                        ${escapeHtml(
                            data.message ||
                            ""
                        )}
                    </p>

                    <p>
                        Target:
                        <strong>
                            ${escapeHtml(
                                data.target ||
                                "all"
                            )}
                        </strong>
                    </p>

                    <div class="item-actions">

                        <button
                            class="danger delete-notification"
                            type="button">
                            Delete
                        </button>

                    </div>

                `;


                item
                    .querySelector(
                        ".delete-notification"
                    )
                    .addEventListener(
                        "click",
                        () => deleteNotification(
                            docSnap.id
                        )
                    );


                list.appendChild(item);

            }
        );


    } catch (error) {

        console.error(
            "Notification load error:",
            error
        );


        list.innerHTML =
            `<div class="empty">
                Failed to load notifications.
            </div>`;

    }

}


// ======================================================
// NOTIFICATION - DELETE
// ======================================================

async function deleteNotification(id) {

    if (
        !confirm(
            "Unataka kufuta notification hii?"
        )
    ) return;


    try {

        const {
            doc,
            deleteDoc
        } = firestore;


        await deleteDoc(
            doc(
                db,
                "notifications",
                id
            )
        );


        showMessage(
            "Notification imefutwa ✓"
        );


        await loadNotifications();

        await loadDashboardStats();


    } catch (error) {

        console.error(
            "Notification delete error:",
            error
        );


        showMessage(
            "Notification haikufutika.",
            true
        );

    }

}


// ======================================================
// CONNECT FORMS
// ======================================================

function connectForms() {

    const videoForm =
        document.getElementById(
            "videoForm"
        );

    const adForm =
        document.getElementById(
            "adForm"
        );

    const quizForm =
        document.getElementById(
            "quizForm"
        );

    const spinForm =
        document.getElementById(
            "spinForm"
        );

    const scheduleForm =
        document.getElementById(
            "scheduleForm"
        );

    const notificationForm =
        document.getElementById(
            "notificationForm"
        );


    if (videoForm) {

        videoForm.addEventListener(
            "submit",
            saveVideo
        );

    }


    // ==================================================
    // POSTER FORM
    // ==================================================

    if (adForm) {

        adForm.addEventListener(
            "submit",
            savePoster
        );

        console.log(
            "Poster form connected ✓"
        );

    }


    if (quizForm) {

        quizForm.addEventListener(
            "submit",
            saveQuiz
        );

    }


    // ==================================================
    // SPIN - UNTOUCHED
    // ==================================================

    if (spinForm) {

        spinForm.addEventListener(
            "submit",
            saveSpin
        );

    }


    if (scheduleForm) {

        scheduleForm.addEventListener(
            "submit",
            saveSchedule
        );

    }


    if (notificationForm) {

        notificationForm.addEventListener(
            "submit",
            saveNotification
        );

    }


    connectImagePreview();


    const cancelVideoEdit =
        document.getElementById(
            "cancelVideoEdit"
        );

    if (cancelVideoEdit) {

        cancelVideoEdit.addEventListener(
            "click",
            resetVideoForm
        );

    }


    const cancelAdEdit =
        document.getElementById(
            "cancelAdEdit"
        );

    if (cancelAdEdit) {

        cancelAdEdit.addEventListener(
            "click",
            resetPosterForm
        );

    }


    const cancelQuizEdit =
        document.getElementById(
            "cancelQuizEdit"
        );

    if (cancelQuizEdit) {

        cancelQuizEdit.addEventListener(
            "click",
            resetQuizForm
        );

    }


    const cancelSpinEdit =
        document.getElementById(
            "cancelSpinEdit"
        );

    if (cancelSpinEdit) {

        cancelSpinEdit.addEventListener(
            "click",
            resetSpinForm
        );

    }


    const cancelScheduleEdit =
        document.getElementById(
            "cancelScheduleEdit"
        );

    if (cancelScheduleEdit) {

        cancelScheduleEdit.addEventListener(
            "click",
            resetScheduleForm
        );

    }


    const logoutBtn =
        document.getElementById(
            "logoutBtn"
        );


    if (logoutBtn) {

        logoutBtn.addEventListener(
            "click",
            async () => {

                if (
                    confirm(
                        "Unataka kutoka?"
                    )
                ) {

                    await auth.signOut();

                    location.reload();

                }

            }
        );

    }

}


// ======================================================
// RESET VIDEO
// ======================================================

function resetVideoForm() {

    const form =
        document.getElementById(
            "videoForm"
        );

    if (form) {

        form.reset();

    }


    const id =
        document.getElementById(
            "videoId"
        );

    if (id) {

        id.value = "";

    }


    const cancel =
        document.getElementById(
            "cancelVideoEdit"
        );

    if (cancel) {

        cancel.classList.add(
            "hidden"
        );

    }

}


// ======================================================
// RESET POSTER
// ======================================================

function resetPosterForm() {

    const form =
        document.getElementById(
            "adForm"
        );

    if (form) {

        form.reset();

    }


    const id =
        document.getElementById(
            "adId"
        );

    if (id) {

        id.value = "";

    }


    const preview =
        document.getElementById(
            "adPreview"
        );

    if (preview) {

        preview.src = "";

        preview.style.display =
            "none";

    }


    const fileInput =
        document.getElementById(
            "adImageFile"
        );

    if (fileInput) {

        fileInput.required =
            true;

    }


    const cancel =
        document.getElementById(
            "cancelAdEdit"
        );

    if (cancel) {

        cancel.classList.add(
            "hidden"
        );

    }

}


// ======================================================
// RESET QUIZ
// ======================================================

function resetQuizForm() {

    const form =
        document.getElementById(
            "quizForm"
        );

    if (form) {

        form.reset();

    }


    const id =
        document.getElementById(
            "quizId"
        );

    if (id) {

        id.value = "";

    }


    const cancel =
        document.getElementById(
            "cancelQuizEdit"
        );

    if (cancel) {

        cancel.classList.add(
            "hidden"
        );

    }

}


// ======================================================
// RESET SPIN
// ======================================================

function resetSpinForm() {

    const form =
        document.getElementById(
            "spinForm"
        );

    if (form) {

        form.reset();

    }


    const id =
        document.getElementById(
            "spinId"
        );

    if (id) {

        id.value = "";

    }


    const cancel =
        document.getElementById(
            "cancelSpinEdit"
        );

    if (cancel) {

        cancel.classList.add(
            "hidden"
        );

    }

}


// ======================================================
// RESET SCHEDULE
// ======================================================

function resetScheduleForm() {

    const form =
        document.getElementById(
            "scheduleForm"
        );

    if (form) {

        form.reset();

    }


    const id =
        document.getElementById(
            "scheduleId"
        );

    if (id) {

        id.value = "";

    }


    const cancel =
        document.getElementById(
            "cancelScheduleEdit"
        );

    if (cancel) {

        cancel.classList.add(
            "hidden"
        );

    }

}


// ======================================================
// SECURITY / HTML ESCAPE
// ======================================================

function escapeHtml(value) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        value == null
            ? ""
            : String(value);


    return div.innerHTML;

}


function escapeAttribute(value) {

    return String(value || "")
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        );

}


// ======================================================
// GLOBAL FUNCTIONS
// ======================================================

window.showSection =
    showSection;

window.hideSections =
    hideSections;

window.showActivityTab =
    showActivityTab;

window.startNewSpinCycle =
    startNewSpinCycle;


// ======================================================
// START
// ======================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        console.log(
            "HASTAN GLOBE MAIN ADMIN JS LOADED"
        );

        loadFirebase();

    }
);