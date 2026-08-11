import app from "./app";

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("=================================");
  console.log("🚀 Orbit Backend Running");
  console.log(`🌐 Listening on port ${PORT}`);
  console.log("=================================");
});
