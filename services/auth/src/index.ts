import express from "express";

const app = express();

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "auth" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Auth service is running on port ${PORT}`);
});
