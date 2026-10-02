// ნივთების დამატება, ჩვენება და წაშლა
import { auth, db } from "./firebase-config.js";
import { startChat } from "./chat.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const grid = document.querySelector(".products");
const nav = document.querySelector(".nav");
const authModal = document.getElementById("auth-modal");
const categoryButtons = document.querySelectorAll(".category-chip");

const CATEGORY_LABELS = {
  tansacmeli: "ტანსაცმელი",
  fexsacmeli: "ფეხსაცმელი",
  satamashoebi: "სათამაშო",
  eleqtronika: "ელექტრონიკა",
  silamaze: "სილამაზე",
  aqsesuarebi: "აქსესუარები"
};

let currentCategory = "all";

categoryButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    categoryButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentCategory = btn.dataset.category;
    render();
  });
});

// "ნივთის დამატება" ღილაკი ნავიგაციაში
const addBtn = document.createElement("button");
addBtn.className = "add-product-btn";
addBtn.textContent = "+ ნივთის დამატება";
nav.appendChild(addBtn);

// ნივთის დამატების მოდალი
const modal = document.createElement("div");
modal.className = "modal hidden";
modal.innerHTML = `
  <div class="modal-box">
    <span id="product-close" class="modal-close">&times;</span>
    <h2>ახალი ნივთი</h2>
    <form id="product-form" class="auth-form">
      <input type="text" id="product-title" placeholder="ნივთის სახელი" maxlength="80" required>
      <input type="number" id="product-price" placeholder="ფასი (₾)" min="0" step="0.01" required>
      <input type="number" id="product-old-price" placeholder="ძველი ფასი (არასავალდებულო)" min="0" step="0.01">
      <select id="product-category" required>
        <option value="" disabled selected>აირჩიე კატეგორია</option>
        <option value="tansacmeli">ტანსაცმელი</option>
        <option value="fexsacmeli">ფეხსაცმელი</option>
        <option value="satamashoebi">სათამაშო</option>
        <option value="eleqtronika">ელექტრონიკა</option>
        <option value="silamaze">სილამაზე</option>
        <option value="aqsesuarebi">აქსესუარები</option>
      </select>
      <textarea id="product-desc" placeholder="აღწერა" maxlength="500" rows="3"></textarea>
      <input type="file" id="product-image" accept="image/*" required>
      <img id="product-preview" class="product-preview hidden" alt="">
      <button type="submit" id="product-submit" class="auth-submit">ატვირთვა</button>
      <p id="product-error" class="auth-error"></p>
    </form>
  </div>
`;
document.body.appendChild(modal);

const form = document.getElementById("product-form");
const fileInput = document.getElementById("product-image");
const preview = document.getElementById("product-preview");
const submitBtn = document.getElementById("product-submit");
const errorEl = document.getElementById("product-error");

addBtn.addEventListener("click", () => {
  if (auth.currentUser) {
    modal.classList.remove("hidden");
  } else {
    authModal.classList.remove("hidden");
  }
});

document.getElementById("product-close").addEventListener("click", () => {
  modal.classList.add("hidden");
});

// არჩეული ფოტოს გადახედვა
fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (file) {
    preview.src = URL.createObjectURL(file);
    preview.classList.remove("hidden");
  } else {
    preview.classList.add("hidden");
  }
});

// ფოტოს შეკუმშვა, რომ ბაზაში პატარა ადგილი დაიკავოს
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

// ნივთის ატვირთვა
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorEl.textContent = "";

  const user = auth.currentUser;
  if (!user) {
    errorEl.textContent = "ჯერ შედი ანგარიშზე";
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "იტვირთება...";

  try {
    const file = fileInput.files[0];
    let image = await compressImage(file, 800, 0.7);
    if (image.length > 900000) {
      image = await compressImage(file, 500, 0.6);
    }

    const oldPrice = document.getElementById("product-old-price").value;
    const category = document.getElementById("product-category").value;

    await addDoc(collection(db, "products"), {
      title: document.getElementById("product-title").value.trim(),
      price: Number(document.getElementById("product-price").value),
      oldPrice: oldPrice ? Number(oldPrice) : null,
      category: category,
      description: document.getElementById("product-desc").value.trim(),
      image: image,
      ownerId: user.uid,
      ownerName: user.displayName || user.email,
      createdAt: serverTimestamp()
    });

    form.reset();
    preview.classList.add("hidden");
    modal.classList.add("hidden");
  } catch (err) {
    console.error(err);
    errorEl.textContent = "ატვირთვა ვერ მოხერხდა, სცადეთ ხელახლა";
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "ატვირთვა";
  }
});

// ბარათის აწყობა (textContent-ით, უსაფრთხოდ)
function createCard(id, p) {
  const card = document.createElement("div");
  card.className = "product-card";

  const img = document.createElement("img");
  if (typeof p.image === "string" && p.image.startsWith("data:image/")) {
    img.src = p.image;
  }
  img.alt = p.title || "ნივთი";

  const title = document.createElement("h3");
  title.textContent = p.title || "";

  const categoryBadge = document.createElement("span");
  categoryBadge.className = "category-badge";
  categoryBadge.textContent = CATEGORY_LABELS[p.category] || "";

  const price = document.createElement("p");
  price.className = "price";
  const newPrice = document.createElement("span");
  newPrice.className = "new-price";
  newPrice.textContent = Number(p.price).toFixed(2) + "₾";
  price.appendChild(newPrice);
  if (p.oldPrice) {
    const oldPrice = document.createElement("span");
    oldPrice.className = "old-price";
    oldPrice.textContent = Number(p.oldPrice).toFixed(2) + "₾";
    price.appendChild(oldPrice);
  }

  card.append(img, title);
  if (categoryBadge.textContent) card.appendChild(categoryBadge);
  card.appendChild(price);

  if (p.description) {
    const desc = document.createElement("p");
    desc.className = "desc";
    desc.textContent = p.description;
    card.appendChild(desc);
  }

  const seller = document.createElement("p");
  seller.className = "seller";
  seller.textContent = "გამყიდველი: " + (p.ownerName || "უცნობი");
  card.appendChild(seller);

  // "შეძენა" ღილაკი ყველას, გარდა ნივთის მფლობელისა — ხსნის ჩათს გამყიდველთან
  // და ავტომატურად უგზავნის ნივთის ინფორმაციას
  if (!auth.currentUser || auth.currentUser.uid !== p.ownerId) {
    const buy = document.createElement("button");
    buy.className = "buy-btn";
    buy.textContent = "🛒 შეძენა";
    buy.addEventListener("click", () => startChat(id, p));
    card.appendChild(buy);
  }

  // წაშლა მხოლოდ ნივთის მფლობელს ეჩვენება
  if (auth.currentUser && auth.currentUser.uid === p.ownerId) {
    const del = document.createElement("button");
    del.className = "delete-btn";
    del.textContent = "წაშლა";
    del.addEventListener("click", async () => {
      if (confirm("ნამდვილად გინდა ამ ნივთის წაშლა?")) {
        try {
          await deleteDoc(doc(db, "products", id));
        } catch (err) {
          console.error(err);
          alert("წაშლა ვერ მოხერხდა");
        }
      }
    });
    card.appendChild(del);
  }

  return card;
}

let lastDocs = [];

function render() {
  grid.replaceChildren();

  const filtered =
    currentCategory === "all"
      ? lastDocs
      : lastDocs.filter((d) => d.data().category === currentCategory);

  if (filtered.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-msg";
    empty.textContent =
      currentCategory === "all"
        ? "ჯერ ნივთები არ არის. დაამატე პირველი!"
        : "ამ კატეგორიაში ჯერ ნივთი არ არის.";
    grid.appendChild(empty);
    return;
  }
  filtered.forEach((d) => grid.appendChild(createCard(d.id, d.data())));
}

// ნივთების ცოცხალი სია ბაზიდან
const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
onSnapshot(
  q,
  (snapshot) => {
    lastDocs = snapshot.docs;
    render();
  },
  (err) => {
    console.error(err);
    grid.textContent = "ნივთები ვერ ჩაიტვირთა";
  }
);

// შესვლა/გასვლისას თავიდან დავხატოთ (წაშლის ღილაკების გამო)
onAuthStateChanged(auth, () => render());
