# HanzPiw ENC File

Website gratis untuk mengenkripsi dan mendekripsi file JavaScript (`.js`) menggunakan AES-256-GCM.

## Fitur
- Encrypt `.js` menjadi `.enc`
- Decrypt `.enc` kembali menjadi `.js`
- Pemrosesan sepenuhnya di browser menggunakan Web Crypto API
- Tidak membutuhkan login, API Key, database, atau upload file ke server
- Responsive premium dark UI

## Jalankan lokal
Memerlukan Node.js 18 atau lebih baru.

```bash
npm install
npm start
```

Buka `http://localhost:3000`.

## Deploy
### VPS
1. Upload/clone folder project.
2. Jalankan `npm install`.
3. Jalankan `npm start` (disarankan memakai PM2 untuk proses production).
4. Pasang HTTPS melalui reverse proxy seperti Nginx + sertifikat TLS.

### Render / Railway / platform Node.js
- Build command: `npm install`
- Start command: `npm start`
- Environment: `NODE_ENV=production` (opsional)
- Port akan otomatis mengikuti `PORT` dari platform.

## Format file
File `.enc` memakai header `HPENC1`, salt PBKDF2 16-byte, IV 12-byte, lalu ciphertext AES-GCM. Kunci AES-256 diturunkan dari password dengan PBKDF2-HMAC-SHA256 sebanyak 310.000 iterasi.

## Catatan keamanan
- Ini adalah enkripsi file, bukan JavaScript obfuscation. File `.enc` tidak bisa dijalankan langsung sebagai JavaScript; decrypt dahulu untuk mendapatkan file `.js` asli.
- Password tidak dikirim ke server. Jika password hilang, file tidak dapat dipulihkan.
- Enkripsi tidak mencegah orang menjalankan atau menyalin source setelah file berhasil didekripsi.
- Gunakan HTTPS saat website dipublikasikan.
- Untuk file sangat besar, browser dapat membutuhkan memori yang cukup karena proses menggunakan buffer.
