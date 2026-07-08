import { createRoot } from "react-dom/client";
import { inject } from "@vercel/analytics";
import App from "./App.tsx";
import "./index.css";

// Vercel Web Analytics : partout sauf GitHub Pages et dev local (le
// endpoint /_vercel/insights n'existe que derrière Vercel, y compris le
// futur domaine custom). inject() patche history : les navigations React
// Router sont trackées. Reste à activer le toggle Web Analytics dans le
// dashboard Vercel.
const host = window.location.hostname;
if (!host.endsWith("github.io") && host !== "localhost" && host !== "127.0.0.1") {
  inject();
}

createRoot(document.getElementById("root")!).render(<App />);
