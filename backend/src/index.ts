import express from "express";
import cors from "cors";
import tramitesRoutes from "./routes/tramites.routes";

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use("/api/tramites", tramitesRoutes);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Backend escuchando en http://localhost:${PORT}`);
});
