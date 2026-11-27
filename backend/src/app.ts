import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import panelRoutes from "./routes/panel.routes";
import tramitesRoutes from "./routes/tramites.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/tramites", tramitesRoutes);
// Sesión del funcionario y panel (US-05). El vecino no pasa por aquí.
app.use("/api/auth", authRoutes);
app.use("/api/panel", panelRoutes);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

export default app;
