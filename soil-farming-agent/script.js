// ---- Firebase SDK v11.9.1 imports -----------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

// -- Firebase config (from console) ------------------------
const firebaseConfig = {
  apiKey: "AIzaSyC2yk3j0u2Da5mOFuD6NaspCJuFlrAn2PA",
  authDomain: "soilagent-187a1.firebaseapp.com",
  projectId: "soilagent-187a1",
  storageBucket: "soilagent-187a1.appspot.com", // fix: .appspot.com not .firebasestorage.app
  messagingSenderId: "307949785851",
  appId: "1:307949785851:web:83b5491df3ed74cde3565e"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Utility selectors
const $ = sel => document.querySelector(sel);
const $all = sel => document.querySelectorAll(sel);

// Show/hide sections
function show(id) {
  $all(".section").forEach(s => s.classList.add("hidden"));
  $(id).classList.remove("hidden");
}

// Track current role
let currentRole = null;

// DOM ready bindings
document.addEventListener("DOMContentLoaded", () => {
  // Navigation links
  $all("[data-section]").forEach(a =>
    a.addEventListener("click", e => {
      e.preventDefault();
      show(`#${a.dataset.section}`);
    })
  );
  show("#home");

  // Role selection
  $("#chooseAdmin").onclick = () => {
    currentRole = "admin";
    $("#loginTitle").textContent = "Admin Login";
    show("#loginForm");
  };

  $("#chooseUser").onclick = () => {
    currentRole = "user";
    $("#loginTitle").textContent = "User Login";
    show("#loginForm");
  };

  // Toggle auth forms
  $("#showRegister").onclick = () => show("#registerForm");
  $("#showLogin").onclick = () => show("#loginForm");

  // Soil form submission
  $("#soilForm").addEventListener("submit", async e => {
    e.preventDefault();
    await addSoilDetail();
  });

  // Register
  $("#registerBtn").onclick = async () => {
    try {
      await createUserWithEmailAndPassword(auth, $("#regEmail").value, $("#regPassword").value);
      alert("Account created! Please log in.");
      show("#loginForm");
    } catch (e) {
      alert(e.message);
    }
  };

  // Login
  $("#loginBtn").onclick = async () => {
    try {
      await signInWithEmailAndPassword(auth, $("#email").value, $("#password").value);
    } catch (e) {
      alert(e.message);
    }
  };

  // Logout (admin & user)
  $("#adminLogout").onclick = $("#userLogout").onclick = () => signOut(auth);

  // User soil selection, now stores email!
  $("#submitSelection").onclick = async () => {
    const selected = document.querySelector("input[name='soilSel']:checked")?.value;
    if (!selected) return alert("Select a soil type first.");
    try {
      await addDoc(collection(db, "userSelections"), {
        uid: auth.currentUser.uid,
        email: auth.currentUser.email, // store email for display!
        soilId: selected,
        timestamp: Date.now()
      });
      alert("Selection saved!");
    } catch (e) {
      alert(e.message);
    }
  };
});

// Firestore reference
const soilRef = collection(db, "soilDetails");

// Real-time listener for soils, admin/user lists and user soil selections
function listenSoils() {
  onSnapshot(
    query(soilRef, orderBy("createdAt", "desc")),
    snap => {
      const soils = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      renderAdminList(soils);
      renderUserOptions(soils);
      updateUserSelectionsList(soils);
    },
    err => console.error(err)
  );
}

// Add soil detail
async function addSoilDetail() {
  const newSoil = {
    type: $("#soilType").value.trim(),
    distributor: {
      name: $("#distributorName").value.trim(),
      location: $("#distributorLocation").value.trim(),
      phone: $("#distributorPhone").value.trim()
    },
    createdAt: Date.now()
  };
  if (!newSoil.type || !newSoil.distributor.name || !newSoil.distributor.location || !newSoil.distributor.phone) {
    return alert("All fields are required.");
  }
  try {
    await addDoc(soilRef, newSoil);
    $("#soilForm").reset();
  } catch (e) {
    alert(e.message);
  }
}

// Render admin list
function renderAdminList(soils) {
  const ul = $("#soilDetailsList");
  ul.innerHTML = soils.length
    ? soils.map((s, i) => `<li>${i + 1}. <strong>${s.type}</strong> — ${s.distributor.name}, ${s.distributor.location}, ${s.distributor.phone}</li>`).join("")
    : "<li>No soil details yet.</li>";
}

// Render user options
function renderUserOptions(soils) {
  const cont = $("#soilOptions");
  cont.innerHTML = soils.length
    ? soils.map(s => `
        <label class="soil-option">
          <input type="radio" name="soilSel" value="${s.id}">
          ${s.type} — ${s.distributor.name} (${s.distributor.location})
        </label>
      `).join("")
    : "<p>No soil details available. Contact admin.</p>";
}

/**
 * Admin: display which users selected which soil types
 * Expects an <ul id="userSelectionsList"> in Admin Dashboard HTML.
 */
function updateUserSelectionsList(soils) {
  const ul = $("#userSelectionsList");
  if (!ul) return;

  // Listen to the userSelections collection
  const userSelectionsRef = collection(db, "userSelections");
  onSnapshot(userSelectionsRef, snap => {
    // For each soilId, gather emails of users who selected it
    const selections = snap.docs.map(d => d.data());
    const soilIdToUsers = {};
    selections.forEach(sel => {
      if (!soilIdToUsers[sel.soilId]) soilIdToUsers[sel.soilId] = [];
      soilIdToUsers[sel.soilId].push(sel.email || sel.uid); // show email if present
    });

    ul.innerHTML = soils.length
      ? soils.map(soil => {
          const users = soilIdToUsers[soil.id] || [];
          return `<li>
            <strong>${soil.type}</strong> — Selected by: ${
              users.length
                ? users.map(u => `<span>${u}</span>`).join(", ")
                : "<em>No users</em>"
            }
          </li>`;
        }).join("")
      : "<li>No soil details yet.</li>";
  });
}

// Auth state listener
onAuthStateChanged(auth, user => {
  if (!user) {
    currentRole = null;
    $("#authLink").textContent = "Login";
    $("#authLink").onclick = () => show("#role");
    return show("#role");
  }
  $("#authLink").textContent = "Logout";
  $("#authLink").onclick = () => signOut(auth);

  show(currentRole === "admin" ? "#adminDashboard" : "#userDashboard");
  listenSoils();
});
