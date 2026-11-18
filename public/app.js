const $ = (id) => document.getElementById(id);
const encTab = $("encryptTab"), decTab = $("decryptTab");
const encPanel = $("encryptPanel"), decPanel = $("decryptPanel");
const MAGIC = new TextEncoder().encode("HPENC1");
$("year").textContent = new Date().getFullYear();

function setMode(mode) {
  const enc = mode === "encrypt";
  encPanel.classList.toggle("hidden", !enc);
  decPanel.classList.toggle("hidden", enc);
  encTab.classList.toggle("active", enc);
  decTab.classList.toggle("active", !enc);
  encTab.setAttribute("aria-selected", String(enc));
  decTab.setAttribute("aria-selected", String(!enc));
}
encTab.addEventListener("click", () => setMode("encrypt"));
decTab.addEventListener("click", () => setMode("decrypt"));

document.querySelectorAll(".reveal").forEach(btn => btn.addEventListener("click", () => {
  const input = $(btn.dataset.target);
  input.type = input.type === "password" ? "text" : "password";
  btn.textContent = input.type === "password" ? "SHOW" : "HIDE";
}));

function bindFile(inputId, nameId, dropId) {
  const input = $(inputId), name = $(nameId), drop = $(dropId);
  input.addEventListener("change", () => name.textContent = input.files[0]?.name || (inputId === "encFile" ? "Choose a JavaScript file" : "Choose an encrypted file"));
  ["dragenter","dragover"].forEach(evt => drop.addEventListener(evt, e => {e.preventDefault();drop.classList.add("drag");}));
  ["dragleave","drop"].forEach(evt => drop.addEventListener(evt, e => {e.preventDefault();drop.classList.remove("drag");}));
  drop.addEventListener("drop", e => {
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const dt = new DataTransfer(); dt.items.add(file); input.files = dt.files;
    input.dispatchEvent(new Event("change"));
  });
}
bindFile("encFile","encFileName","encDrop");
bindFile("decFile","decFileName","decDrop");

function status(id, message, error=false) {
  const el = $(id); el.textContent = message; el.classList.toggle("error", error);
}
function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob), a = document.createElement("a");
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function safeBaseName(name) {
  return name.replace(/[\\/:*?"<>|]/g, "_").replace(/\.js$/i, "") || "file";
}
async function deriveKey(password, salt) {
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({name:"PBKDF2", salt, iterations:310000, hash:"SHA-256"}, material, {name:"AES-GCM", length:256}, false, ["encrypt","decrypt"]);
}
function concat(...arrays) {
  const size = arrays.reduce((n,a)=>n+a.length,0), out = new Uint8Array(size);
  let offset=0; for (const a of arrays) {out.set(a,offset);offset+=a.length;} return out;
}
function randomBytes(length) {
  const bytes = new Uint8Array(length); crypto.getRandomValues(bytes); return bytes;
}

$("encryptBtn").addEventListener("click", async () => {
  const file = $("encFile").files[0], password = $("encPassword").value;
  status("encStatus","");
  if (!file) return status("encStatus","Pilih file JavaScript terlebih dahulu.",true);
  if (!/\.js$/i.test(file.name)) return status("encStatus","Format file harus .js.",true);
  if (!password || password.length < 8) return status("encStatus","Password minimal 8 karakter.",true);
  const btn=$("encryptBtn"); btn.disabled=true; btn.textContent="Encrypting...";
  try {
    const salt=randomBytes(16), iv=randomBytes(12), key=await deriveKey(password,salt);
    const plain=await file.arrayBuffer();
    const encrypted=new Uint8Array(await crypto.subtle.encrypt({name:"AES-GCM",iv},key,plain));
    // File format: magic(6) + salt(16) + iv(12) + ciphertext and GCM tag.
    const payload=concat(MAGIC,salt,iv,encrypted);
    downloadBlob(new Blob([payload],{type:"application/octet-stream"}),safeBaseName(file.name)+".enc");
    status("encStatus","Berhasil! File .enc berhasil dibuat.");
  } catch(err) {
    console.error(err); status("encStatus","Enkripsi gagal. Coba lagi di browser yang mendukung Web Crypto.",true);
  } finally {btn.disabled=false;btn.innerHTML='Encrypt & Download <span>→</span>';}
});

$("decryptBtn").addEventListener("click", async () => {
  const file=$("decFile").files[0], password=$("decPassword").value;
  status("decStatus","");
  if (!file) return status("decStatus","Pilih file .enc terlebih dahulu.",true);
  if (!password) return status("decStatus","Masukkan password enkripsi.",true);
  const btn=$("decryptBtn"); btn.disabled=true; btn.textContent="Decrypting...";
  try {
    const data=new Uint8Array(await file.arrayBuffer());
    if (data.length < 50 || !MAGIC.every((b,i)=>data[i]===b)) throw new Error("format");
    const salt=data.slice(6,22), iv=data.slice(22,34), ciphertext=data.slice(34);
    const key=await deriveKey(password,salt);
    const plain=await crypto.subtle.decrypt({name:"AES-GCM",iv},key,ciphertext);
    const outputName=file.name.replace(/\.enc$/i,"")+".js";
    downloadBlob(new Blob([plain],{type:"text/javascript;charset=utf-8"}),outputName);
    status("decStatus","Berhasil! File JavaScript berhasil dipulihkan.");
  } catch(err) {
    console.error(err);
    status("decStatus",err.message==="format"?"Format file tidak dikenali. Gunakan file .enc dari HanzPiw ENC File.":"Gagal decrypt. Password salah atau file rusak.",true);
  } finally {btn.disabled=false;btn.innerHTML='Decrypt & Download <span>→</span>';}
});