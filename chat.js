// პირადი ჩათი მყიდველსა და გამყიდველს შორის
import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const authModal = document.getElementById("auth-modal");
const headerIcons = document.querySelector(".header-icons");
const accountIcon = document.getElementById("account-icon");

// 💬 ხატულა ჰედერში
const chatIcon = document.createElement("span");
chatIcon.id = "chat-icon";
chatIcon.title = "შეტყობინებები";
chatIcon.textContent = "💬";
headerIcons.insertBefore(chatIcon, accountIcon);

// ჩათის პანელი
const panel = document.createElement("div");
panel.className = "modal hidden";
panel.innerHTML = `
  <div class="modal-box chat-box">
    <span id="chat-close" class="modal-close">&times;</span>

    <div id="chat-list-view">
      <h2>ჩემი შეტყობინებები</h2>
      <div id="chat-list" class="chat-list"></div>
    </div>

    <div id="chat-conv-view" class="hidden">
      <div class="chat-header">
        <button type="button" id="chat-back" class="chat-back">←</button>
        <div>
          <strong id="chat-with"></strong>
          <small id="chat-product"></small>
        </div>
      </div>
      <div id="chat-messages" class="chat-messages"></div>
      <form id="chat-form" class="chat-form">
        <input type="text" id="chat-input" placeholder="დაწერე შეტყობინება..." maxlength="1000" autocomplete="off" required>
        <button type="submit" class="chat-send">გაგზავნა</button>
      </form>
    </div>
  </div>
`;
document.body.appendChild(panel);

const listView = document.getElementById("chat-list-view");
const convView = document.getElementById("chat-conv-view");
const listEl = document.getElementById("chat-list");
const messagesEl = document.getElementById("chat-messages");
const withEl = document.getElementById("chat-with");
const productEl = document.getElementById("chat-product");
const form = document.getElementById("chat-form");
const input = document.getElementById("chat-input");

let currentChatId = null;
let unsubMessages = null;
let unsubList = null;
let chatDocs = [];

function openPanel() {
  panel.classList.remove("hidden");
}

function closePanel() {
  panel.classList.add("hidden");
  leaveConversation();
}

function showList() {
  convView.classList.add("hidden");
  listView.classList.remove("hidden");
}

function leaveConversation() {
  if (unsubMessages) {
    unsubMessages();
    unsubMessages = null;
  }
  currentChatId = null;
  showList();
}

chatIcon.addEventListener("click", () => {
  if (!auth.currentUser) {
    authModal.classList.remove("hidden");
    return;
  }
  openPanel();
  showList();
});

document.getElementById("chat-close").addEventListener("click", closePanel);
document.getElementById("chat-back").addEventListener("click", leaveConversation);

// ჩათების სია (ის ჩათები, სადაც მე ვმონაწილეობ)
function renderList() {
  listEl.replaceChildren();
  const user = auth.currentUser;

  if (!user || chatDocs.length === 0) {
    const empty = document.createElement("p");
    empty.className = "chat-empty";
    empty.textContent = "ჯერ შეტყობინებები არ გაქვს.";
    listEl.appendChild(empty);
    return;
  }

  const sorted = [...chatDocs].sort((a, b) => {
    const ta = a.data().updatedAt ? a.data().updatedAt.toMillis() : 0;
    const tb = b.data().updatedAt ? b.data().updatedAt.toMillis() : 0;
    return tb - ta;
  });

  sorted.forEach((d) => {
    const c = d.data();
    const otherName = user.uid === c.buyerId ? c.sellerName : c.buyerName;

    const item = document.createElement("button");
    item.type = "button";
    item.className = "chat-item";

    const name = document.createElement("strong");
    name.textContent = otherName || "მომხმარებელი";

    const product = document.createElement("small");
    product.textContent = "ნივთი: " + (c.productTitle || "");

    const last = document.createElement("small");
    last.textContent = c.lastMessage || "ჯერ შეტყობინება არ არის";

    item.append(name, product, last);
    item.addEventListener("click", () => openConversation(d.id, c));
    listEl.appendChild(item);
  });
}

// კონკრეტული საუბრის გახსნა
function openConversation(chatId, chat) {
  const user = auth.currentUser;
  if (!user) return;

  if (unsubMessages) unsubMessages();
  currentChatId = chatId;

  const otherName = user.uid === chat.buyerId ? chat.sellerName : chat.buyerName;
  withEl.textContent = otherName || "მომხმარებელი";
  productEl.textContent = "ნივთი: " + (chat.productTitle || "");

  listView.classList.add("hidden");
  convView.classList.remove("hidden");
  messagesEl.replaceChildren();

  const q = query(
    collection(db, "chats", chatId, "messages"),
    orderBy("createdAt", "asc")
  );

  unsubMessages = onSnapshot(
    q,
    (snapshot) => {
      messagesEl.replaceChildren();
      snapshot.docs.forEach((m) => {
        const data = m.data();
        const bubble = document.createElement("div");
        bubble.className = "chat-msg " + (data.senderId === user.uid ? "mine" : "theirs");
        bubble.textContent = data.text;
        messagesEl.appendChild(bubble);
      });
      messagesEl.scrollTop = messagesEl.scrollHeight;
    },
    (err) => {
      console.error(err);
      messagesEl.textContent = "შეტყობინებები ვერ ჩაიტვირთა";
    }
  );
}

// შეტყობინების გაგზავნა
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = input.value.trim();
  const user = auth.currentUser;
  if (!text || !user || !currentChatId) return;

  input.value = "";
  try {
    await addDoc(collection(db, "chats", currentChatId, "messages"), {
      text: text,
      senderId: user.uid,
      senderName: user.displayName || user.email,
      createdAt: serverTimestamp()
    });
    await updateDoc(doc(db, "chats", currentChatId), {
      lastMessage: text.slice(0, 80),
      updatedAt: serverTimestamp()
    });
  } catch (err) {
    console.error(err);
    input.value = text;
    alert("შეტყობინება ვერ გაიგზავნა");
  }
});

// გამოიძახება ნივთის ბარათიდან: "დაწერე გამყიდველს"
export async function startChat(productId, product) {
  const user = auth.currentUser;
  if (!user) {
    authModal.classList.remove("hidden");
    return;
  }
  if (user.uid === product.ownerId) return;

  const chatId = productId + "_" + user.uid;
  const chatRef = doc(db, "chats", chatId);
  const chatData = {
    productId: productId,
    productTitle: product.title || "",
    sellerId: product.ownerId,
    sellerName: product.ownerName || "გამყიდველი",
    buyerId: user.uid,
    buyerName: user.displayName || user.email,
    participants: [product.ownerId, user.uid]
  };

  try {
    const snap = await getDoc(chatRef);
    if (!snap.exists()) {
      await setDoc(chatRef, chatData);
    }
    openPanel();
    openConversation(chatId, snap.exists() ? snap.data() : chatData);
  } catch (err) {
    console.error(err);
    alert("ჩათის გახსნა ვერ მოხერხდა");
  }
}

// შესვლა/გასვლისას ჩათების სიის განახლება
onAuthStateChanged(auth, (user) => {
  if (unsubList) {
    unsubList();
    unsubList = null;
  }
  chatDocs = [];

  if (!user) {
    closePanel();
    renderList();
    return;
  }

  const q = query(
    collection(db, "chats"),
    where("participants", "array-contains", user.uid)
  );
  unsubList = onSnapshot(
    q,
    (snapshot) => {
      chatDocs = snapshot.docs;
      renderList();
    },
    (err) => console.error(err)
  );
  renderList();
});
