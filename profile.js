// პროფილის პანელი: ავატარი, ჩემი ნივთები, ჩათებზე გადასვლა
import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import {
  doc,
  setDoc,
  onSnapshot,
  collection,
  query,
  where,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { openMyChats } from "./chat.js";

const accountPanel = document.getElementById("account-panel");
const avatarImg = document.getElementById("profile-avatar");
const avatarInput = document.getElementById("avatar-input");
const tabs = document.querySelectorAll(".profile-tab");
const itemsPanel = document.getElementById("profile-items-panel");
const chatsPanel = document.getElementById("profile-chats-panel");
const itemsList = document.getElementById("profile-items-list");
const openChatsBtn = document.getElementById("open-chats-btn");

const DEFAULT_AVATAR =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <rect width="100" height="100" rx="50" fill="#3a1a5c"/>
      <circle cx="50" cy="38" r="18" fill="#d7cee0"/>
      <ellipse cx="50" cy="86" rx="30" ry="22" fill="#d7cee0"/>
    </svg>`
  );

avatarImg.src = DEFAULT_AVATAR;

// ტაბების გადართვა
tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    if (tab.dataset.tab === "items") {
      itemsPanel.classList.remove("hidden");
      chatsPanel.classList.add("hidden");
    } else {
      chatsPanel.classList.remove("hidden");
      itemsPanel.classList.add("hidden");
    }
  });
});

openChatsBtn.addEventListener("click", () => {
  accountPanel.classList.add("hidden");
  openMyChats();
});

// ფოტოს შეკუმშვა (იგივე პრინციპი, რაც ნივთის ფოტოზე)
function compressImage(file, maxSize, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("ფაილი ვერ წაიკითხა"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("არასწორი ფოტო"));
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

// ავატარის ატვირთვა
avatarInput.addEventListener("change", async () => {
  const user = auth.currentUser;
  const file = avatarInput.files[0];
  if (!user || !file) return;

  try {
    const photo = await compressImage(file, 300, 0.7);
    avatarImg.src = photo;
    await setDoc(doc(db, "users", user.uid), { photo: photo }, { merge: true });
  } catch (err) {
    console.error(err);
    alert("ფოტოს ატვირთვა ვერ მოხერხდა");
  }
});

let unsubUser = null;
let unsubItems = null;

function renderItems(docs) {
  itemsList.replaceChildren();

  if (docs.length === 0) {
    const empty = document.createElement("p");
    empty.className = "profile-hint";
    empty.textContent = "ჯერ ნივთი არ დაგიმატებია.";
    itemsList.appendChild(empty);
    return;
  }

  docs.forEach((d) => {
    const p = d.data();
    const row = document.createElement("div");
    row.className = "profile-item-row";

    const thumb = document.createElement("img");
    if (typeof p.image === "string" && p.image.startsWith("data:image/")) {
      thumb.src = p.image;
    }
    thumb.alt = p.title || "";

    const info = document.createElement("div");
    info.className = "profile-item-info";
    const title = document.createElement("strong");
    title.textContent = p.title || "";
    const price = document.createElement("small");
    price.textContent = Number(p.price).toFixed(2) + "₾";
    info.append(title, price);

    const del = document.createElement("button");
    del.type = "button";
    del.className = "delete-btn";
    del.textContent = "წაშლა";
    del.addEventListener("click", async () => {
      if (confirm("ნამდვილად გინდა ამ ნივთის წაშლა?")) {
        try {
          await deleteDoc(doc(db, "products", d.id));
        } catch (err) {
          console.error(err);
          alert("წაშლა ვერ მოხერხდა");
        }
      }
    });

    row.append(thumb, info, del);
    itemsList.appendChild(row);
  });
}

onAuthStateChanged(auth, (user) => {
  if (unsubUser) { unsubUser(); unsubUser = null; }
  if (unsubItems) { unsubItems(); unsubItems = null; }

  if (!user) {
    avatarImg.src = DEFAULT_AVATAR;
    itemsList.replaceChildren();
    return;
  }

  unsubUser = onSnapshot(doc(db, "users", user.uid), (snap) => {
    const data = snap.data();
    avatarImg.src = data && data.photo ? data.photo : DEFAULT_AVATAR;
  });

  const q = query(collection(db, "products"), where("ownerId", "==", user.uid));
  unsubItems = onSnapshot(
    q,
    (snapshot) => renderItems(snapshot.docs),
    (err) => console.error(err)
  );
});
