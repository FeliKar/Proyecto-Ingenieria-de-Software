import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { defineConfig } from 'vite'

// HTTPS local con certificado autofirmado: el navegador solo permite el
// micrófono y el reconocimiento de voz en contextos seguros fuera de localhost
// (por ejemplo, desde el celular en la red local durante la demo).
// Aceptar el aviso del certificado la primera vez: "Avanzado → Continuar".
export default defineConfig({
  plugins: [react(), basicSsl()],
  server: {
    // La API se sirve en el mismo origen (https://<host>:5173/api/...) y Vite la
    // reenvía al backend. Así se evita contenido mixto (página https + fetch http)
    // y el celular no necesita alcanzar el puerto 3001.
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
})
