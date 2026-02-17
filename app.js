import dotenv from "dotenv";
dotenv.config();

import express from "express";
// Security Packages
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import hpp from "hpp";
import cors from "cors";

// ❌ OLD LIBRARIES REMOVED (Jo crash kar rahi thi)
// import mongoSanitize from "express-mongo-sanitize"; 
// import xss from "xss-clean"; 

// Route Imports
import healthRoutes from "./routes/health.routes.js";
import webhookRoutes from "./routes/webhook.route.js";
import businessRoute from "./routes/business.routes.js";
import billingRoutes from "./routes/billing.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import humanRoutes from "./routes/human.routes.js";
import conversationRoutes from "./routes/conversation.routes.js";
import authRoutes from "./routes/auth.routes.js";
import auditRoutes from "./routes/audit.routes.js"; 
import campaignRoutes from "./routes/campaign.routes.js";
import leadRoutes from "./routes/lead.routes.js";
import chatRoutes from "./routes/chat.routes.js"; //

const app = express();

/* =========================================
   🔒 1. GLOBAL SECURITY HEADERS
   ========================================= */
app.use(helmet());

// CORS Configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true
}));

/* =========================================
   🏥 2. HEALTH CHECKER
   ========================================= */
app.use("/health", healthRoutes);

/* =========================================
   🛡️ 3. REQUEST PROTECTION
   ========================================= */

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests from this IP."
});

app.use("/business", limiter);
app.use("/auth", limiter);
app.use("/api", limiter);

// Body Parser
app.use(express.json({ limit: "10kb" }));

/* ✅ CUSTOM SECURITY MIDDLEWARE (Safe & Crash-Free)
   Ye function Mongo Injection ($ keys) aur XSS (<script>) dono ko remove karega
   bina req.query object ko replace kiye.
*/
app.use((req, res, next) => {
  const sanitize = (obj) => {
    if (obj && typeof obj === 'object') {
      for (const key in obj) {
        // 1. Mongo Injection Protection ($ wale keys udao)
        if (/^\$/.test(key)) {
          delete obj[key];
          continue;
        }
        
        // 2. XSS Protection (String mein se < > hatao)
        if (typeof obj[key] === 'string') {
          obj[key] = obj[key]
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
        } else {
          // Recursive call for nested objects
          sanitize(obj[key]);
        }
      }
    }
  };

  try {
    if (req.body) sanitize(req.body);
    // req.query ko safe tareeqe se handle karein
    if (req.query && typeof req.query === 'object') sanitize(req.query);
    if (req.params) sanitize(req.params);
  } catch (error) {
    console.error("Sanitization Warning:", error.message);
  }
  
  next();
});

// Prevent Parameter Pollution
app.use(hpp());

/* =========================================
   🚀 4. BUSINESS ROUTES
   ========================================= */
app.use("/api/webhook", webhookRoutes);
app.use("/api/business", businessRoute);
app.use("/api/billing", billingRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/human", humanRoutes);
app.use("/api/conversation", conversationRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/chat", chatRoutes);

/* =========================================
   ❌ 5. GLOBAL ERROR HANDLER
   ========================================= */
app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] ❌ Error:`, err.stack);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    status: "error",
    message: process.env.NODE_ENV === "production" 
      ? "An internal server error occurred." 
      : err.message
  });
});

export default app;