const express = require("express");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;

app.disable("x-powered-by");
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
});
app.use(express.static(path.join(__dirname, "public"), {
  extensions: ["html"],
  setHeaders(res, filePath) {
    if (filePath.endsWith(".html")) res.setHeader("Cache-Control", "no-store");
  }
}));
app.get("*", (_req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.listen(PORT, "0.0.0.0", () => console.log(`HanzPiw ENC File running on port ${PORT}`));