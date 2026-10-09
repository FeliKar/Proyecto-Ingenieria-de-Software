import app from "./app";

const PORT = 3001;

app.listen(PORT, () => {
  console.log(`Backend escuchando en http://localhost:${PORT}`);
});
