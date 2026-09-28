// რეგისტრაცია, შესვლა და გასვლის ლოგიკა
import { auth } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

const authModal = document.getElementById("auth-modal");
const accountPanel = document.getElementById("account-panel");
const accountIcon = document.getElementById("account-icon");

const tabLogin = document.getElementById("tab-login");
const tabRegister = document.getElementById("tab-register");
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");

const loginError = document.getElementById("login-error");
const registerError = document.getElementById("register-error");

const accountInfo = document.getElementById("account-info");
const logoutBtn = document.getElementById("logout-btn");

function openModal(modal) {
  modal.classList.remove("hidden");
}
function closeModal(modal) {
  modal.classList.add("hidden");
}

document.getElementById("auth-close").addEventListener("click", () => closeModal(authModal));
document.getElementById("account-close").addEventListener("click", () => closeModal(accountPanel));

tabLogin.addEventListener("click", () => {
  tabLogin.classList.add("active");
  tabRegister.classList.remove("active");
  loginForm.classList.remove("hidden");
  registerForm.classList.add("hidden");
});

tabRegister.addEventListener("click", () => {
  tabRegister.classList.add("active");
  tabLogin.classList.remove("active");
  registerForm.classList.remove("hidden");
  loginForm.classList.add("hidden");
});

accountIcon.addEventListener("click", () => {
  if (auth.currentUser) {
    openModal(accountPanel);
  } else {
    openModal(authModal);
  }
});

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  registerError.textContent = "";

  const name = document.getElementById("register-name").value;
  const email = document.getElementById("register-email").value;
  const password = document.getElementById("register-password").value;

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: name });
    closeModal(authModal);
  } catch (error) {
    registerError.textContent = translateError(error.code);
  }
});

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginError.textContent = "";

  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    closeModal(authModal);
  } catch (error) {
    loginError.textContent = translateError(error.code);
  }
});

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  closeModal(accountPanel);
});

onAuthStateChanged(auth, (user) => {
  if (user) {
    accountIcon.title = user.displayName || user.email;
    accountInfo.textContent = `შესული ხარ როგორც: ${user.displayName || user.email}`;
  } else {
    accountIcon.title = "ანგარიში";
  }
});

function translateError(code) {
  const errors = {
    "auth/email-already-in-use": "ეს ელ-ფოსტა უკვე დარეგისტრირებულია",
    "auth/invalid-email": "არასწორი ელ-ფოსტის ფორმატი",
    "auth/weak-password": "პაროლი ძალიან სუსტია (მინ. 6 სიმბოლო)",
    "auth/user-not-found": "მომხმარებელი ვერ მოიძებნა",
    "auth/wrong-password": "არასწორი პაროლი",
    "auth/invalid-credential": "არასწორი ელ-ფოსტა ან პაროლი"
  };
  return errors[code] || "დაფიქსირდა შეცდომა, სცადეთ ხელახლა";
}
