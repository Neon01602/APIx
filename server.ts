import express from "express";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { createServer as createViteServer } from "vite";

const execFileAsync = promisify(execFile);
const app = express();
const PORT = 3000;

app.use(express.json());

// CORS configuration
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-API-Key");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Safe dispatcher invoking cli.py with structured arguments
async function runCli(command: string, args: string[] = []): Promise<any> {
  try {
    const { stdout } = await execFileAsync("python3", ["cli.py", command, ...args], {
      cwd: process.cwd(),
      timeout: 10000,
    });
    return JSON.parse(stdout.trim());
  } catch (error: any) {
    console.error(`CLI execution failed for [${command}]:`, error);
    throw error;
  }
}

// 1. Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "APIx Statistical Index Service",
    version: "1.0.0",
    sih_problem_statement: "PS 26056 - Real-Time Airfare Price Index"
  });
});

// 2. Full APIx daily time series with Event Annotations
app.get("/api/index/daily", async (req, res) => {
  try {
    const data = await runCli("daily");
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to compute daily index", details: err.message });
  }
});

// 2b. Weekly rolled-up time series
app.get("/api/index/weekly", async (req, res) => {
  try {
    const data = await runCli("weekly");
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to compute weekly index", details: err.message });
  }
});

// 2c. Monthly rolled-up time series
app.get("/api/index/monthly", async (req, res) => {
  try {
    const data = await runCli("monthly");
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to compute monthly index", details: err.message });
  }
});

// 3. Route specific fare history + cost breakdown + surge anomaly + trend
app.get("/api/index/route/:origin/:dest", async (req, res) => {
  try {
    const { origin, dest } = req.params;
    const data = await runCli("route_detail", [origin, dest]);
    if (!data) {
      return res.status(404).json({ error: `Route ${origin.toUpperCase()}-${dest.toUpperCase()} not found in pilot basket` });
    }
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to retrieve route analysis", details: err.message });
  }
});

// 4. Lightweight Statistical Forecast (Exponential Smoothing + Linear Trend)
app.get("/api/forecast/:origin/:dest", async (req, res) => {
  try {
    const { origin, dest } = req.params;
    const data = await runCli("forecast", [origin, dest]);
    if (!data) {
      return res.status(404).json({ error: `Route ${origin.toUpperCase()}-${dest.toUpperCase()} not found for forecasting` });
    }
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to compute route forecast", details: err.message });
  }
});

// 5. 6-Route Basket Summary (Public Research Tier)
app.get("/api/routes", async (req, res) => {
  try {
    const data = await runCli("routes");
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to retrieve routes basket", details: err.message });
  }
});

// 6. Role-Based Detailed Route & Raw Tick Stream (NSO / RBI Institutional Tier)
app.get("/api/routes/detailed", async (req, res) => {
  const apiKey = req.headers["x-api-key"] || req.headers["authorization"];
  const isAuthorized = apiKey === "NSO_RBI_SECURE_KEY_2026" || apiKey === "Bearer NSO_RBI_SECURE_KEY_2026" || req.query.api_key === "NSO_RBI_SECURE_KEY_2026";

  if (!isAuthorized) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Institutional data feed requires valid X-API-Key or Bearer token for NSO / RBI research access.",
      hint: "Use demo institutional key: NSO_RBI_SECURE_KEY_2026 via header X-API-Key: NSO_RBI_SECURE_KEY_2026"
    });
  }

  try {
    const data = await runCli("routes_detailed");
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to retrieve detailed routes", details: err.message });
  }
});

// 7. Active Anomaly / Surge Alerts
app.get("/api/alerts", async (req, res) => {
  try {
    const data = await runCli("alerts");
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to retrieve alerts", details: err.message });
  }
});

// 8. Aviation & Economic Event Tags
app.get("/api/events", async (req, res) => {
  try {
    const data = await runCli("events");
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to retrieve event tags", details: err.message });
  }
});

// 9. Source Robots.txt & Compliance Status Registry
app.get("/api/compliance", async (req, res) => {
  try {
    const data = await runCli("compliance");
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to retrieve compliance report", details: err.message });
  }
});

// 10. Trigger Manual Scraper Run
app.post("/api/scraper/trigger", async (req, res) => {
  try {
    const data = await runCli("trigger_scrape");
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to execute scrape cycle", details: err.message });
  }
});

// OpenAPI Spec 3.0.0 matching all FastAPI endpoints
const openApiSchema = {
  openapi: "3.0.3",
  info: {
    title: "APIx — Real-Time Airfare Price Index API",
    description: "Statistical Real-Time Airfare Price Index API for National Statistical Office (NSO), Reserve Bank of India (RBI), and Ministry of Civil Aviation. Powered by DGCA passenger traffic weighting, Laspeyres index methodology, and lightweight statistical forecasting.",
    version: "1.0.0",
    contact: {
      name: "APIx SIH 2026 Research Cell",
      email: "apix-research@gov.in"
    }
  },
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: "apiKey",
        in: "header",
        name: "X-API-Key",
        description: "Institutional API Key for NSO / RBI detailed granular data feeds (Demo Key: NSO_RBI_SECURE_KEY_2026)"
      }
    }
  },
  paths: {
    "/api/index/daily": {
      get: {
        tags: ["Index Series"],
        summary: "Get full APIx daily time series",
        description: "Returns daily Laspeyres-weighted airfare price index values (Base Period P0 = 100.0) with event tag annotations.",
        responses: {
          "200": {
            description: "Time series array of daily index values",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      date: { type: "string", example: "2026-08-15" },
                      index_value: { type: "number", example: 136.77 },
                      change_pct: { type: "number", example: 5.02 },
                      event_tag: { type: "string", example: "HOLIDAY_SURGE" },
                      event_description: { type: "string", example: "Independence Day holiday travel surge" }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/index/route/{origin}/{dest}": {
      get: {
        tags: ["Route Intelligence"],
        summary: "Get route fare history, cost breakdown, anomaly flag, and trend",
        parameters: [
          { name: "origin", in: "path", required: true, schema: { type: "string", example: "DEL" } },
          { name: "dest", in: "path", required: true, schema: { type: "string", example: "BOM" } }
        ],
        responses: {
          "200": { description: "Route analysis with cost breakdown, advance purchase windows, and rolling average" }
        }
      }
    },
    "/api/forecast/{origin}/{dest}": {
      get: {
        tags: ["Statistical Forecasting"],
        summary: "Lightweight statistical fare forecast (T+1, T+3, T+7 days)",
        description: "Statistical projection utilizing exponential smoothing and linear trend regression with 95% confidence intervals.",
        parameters: [
          { name: "origin", in: "path", required: true, schema: { type: "string", example: "DEL" } },
          { name: "dest", in: "path", required: true, schema: { type: "string", example: "BOM" } }
        ],
        responses: {
          "200": { description: "Forecasted fares and confidence bounds" }
        }
      }
    },
    "/api/routes": {
      get: {
        tags: ["Route Basket"],
        summary: "Get 6-route pilot basket with DGCA weights (Public Research Tier)",
        responses: { "200": { description: "Route basket summary" } }
      }
    },
    "/api/routes/detailed": {
      get: {
        tags: ["Institutional NSO/RBI"],
        summary: "Get granular route tick data & raw observations (Role-Gated)",
        security: [{ ApiKeyAuth: [] }],
        responses: {
          "200": { description: "Full granular observation stream for institutional modeling" },
          "401": { description: "Missing or invalid API key" }
        }
      }
    },
    "/api/alerts": {
      get: {
        tags: ["Anomaly Detection"],
        summary: "Get active surge/anomaly alerts (>15% above rolling avg)",
        responses: { "200": { description: "Active anomaly alerts list" } }
      }
    },
    "/api/events": {
      get: {
        tags: ["Economic Events"],
        summary: "Get aviation and economic event tags",
        responses: { "200": { description: "List of economic and aviation events" } }
      }
    },
    "/api/compliance": {
      get: {
        tags: ["Scraper & Compliance"],
        summary: "Get source compliance registry and robots.txt statuses",
        responses: { "200": { description: "Source compliance report" } }
      }
    },
    "/api/scraper/trigger": {
      post: {
        tags: ["Scraper & Compliance"],
        summary: "Trigger automated multi-window scraping cycle",
        responses: { "200": { description: "Scraper execution summary" } }
      }
    }
  }
};

app.get("/openapi.json", (req, res) => {
  res.json(openApiSchema);
});

// Swagger UI interactive documentation page at /docs
app.get("/docs", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>APIx API Documentation — Swagger UI</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
  <style>
    body { margin: 0; background: #fafafa; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .topbar { display: none; }
    .header-banner {
      background: #0f172a;
      border-bottom: 1px solid #1e293b;
      color: white;
      padding: 16px 28px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header-banner h1 { margin: 0; font-size: 17px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
    .header-badge { background: #1f6feb; color: white; font-size: 11px; padding: 3px 8px; border-radius: 4px; font-weight: 600; }
    .nav-link { color: #94a3b8; font-size: 13px; text-decoration: none; }
    .nav-link:hover { color: white; }
  </style>
</head>
<body>
  <div class="header-banner">
    <h1>
      <span>APIx</span>
      <span class="header-badge">PS 26056</span>
      <span style="font-weight: 400; color: #94a3b8; font-size: 14px;">| Real-Time Airfare Price Index OpenAPI</span>
    </h1>
    <a href="/" class="nav-link">← Return to Dashboard</a>
  </div>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      url: '/openapi.json',
      dom_id: '#swagger-ui',
      presets: [
        SwaggerUIBundle.presets.apis,
        SwaggerUIBundle.SwaggerUIStandalonePreset
      ],
      layout: "BaseLayout"
    });
  </script>
</body>
</html>
  `);
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`APIx Server running on http://localhost:${PORT}`);
  });
}

startServer();
