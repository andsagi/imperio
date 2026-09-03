import express from "express";
import { createServer as createHttpServer } from "http";
import fs from "fs";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

// Load environment variables from .env
dotenv.config();

async function startServer() {
  const app = express();
  const httpServer = createHttpServer(app);
  const PORT = 3000;

  // Parse JSON bodies
  app.use(express.json());

  // API route for administrative verification
  app.post("/api/admin/verify", (req, res) => {
    try {
      const { password } = req.body;
      const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
      
      if (password === adminPassword) {
        return res.json({ 
          success: true, 
          message: "Acesso de administrador autorizado com sucesso!" 
        });
      } else {
        return res.status(401).json({ 
          success: false, 
          message: "Credencial inválida! Acesso negado." 
        });
      }
    } catch (error) {
      return res.status(500).json({ 
        success: false, 
        message: "Erro interno no servidor." 
      });
    }
  });

  // Health check API
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", environment: process.env.NODE_ENV || "development" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    console.log("Loading Vite Dev Server Middleware...");
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        watch: null,
      },
      // Use custom mode so Vite does not rewrite the HTML and inject
      // @vite/client, whose WebSocket is unavailable through Preview.
      appType: "custom",
    });
    app.use(vite.middlewares);
    app.get("*", (_req, res) => {
      res.type("html").send(fs.readFileSync(path.join(process.cwd(), "index.html"), "utf8"));
    });
  } else {
    console.log("Serving static production build...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
