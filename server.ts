import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = "TransitPay-Super-Secret-Key-2026"; // In production, use environment variables

// --- Entities & Database (In-Memory) ---
type Role = "ROLE_PASSENGER" | "ROLE_STAFF";

interface User {
  id: string;
  username: string;
  passwordHash: string;
  cardId: string;
  name: string;
  walletBalance: number;
  role: Role;
}

interface Ticket {
  id: string;
  cardId: string;
  timestamp: number;
  route: string;
  busNumber: string;
  amount: number;
}

interface Transaction {
  id: string;
  cardId: string;
  type: "DEPOSIT" | "TICKET_PURCHASE";
  amount: number;
  timestamp: number;
}

// Initial Data
const users: User[] = [
  {
    id: "u1",
    username: "passenger",
    passwordHash: bcrypt.hashSync("passenger", 10),
    cardId: "CARD-12345",
    name: "John Doe",
    walletBalance: 0.0,
    role: "ROLE_PASSENGER",
  },
  {
    id: "u2",
    username: "staff",
    passwordHash: bcrypt.hashSync("staff", 10),
    cardId: "STAFF-001",
    name: "Jane Smith",
    walletBalance: 0,
    role: "ROLE_STAFF",
  },
];

const tickets: Ticket[] = [];
const transactions: Transaction[] = [];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- Middleware ---
  const authenticateJWT = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.split(" ")[1];
      jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
          return res.status(403).json({ error: "Invalid token" });
        }
        (req as any).user = user;
        next();
      });
    } else {
      res.status(401).json({ error: "Authorization header missing" });
    }
  };

  const requireRole = (role: Role) => {
    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const user = (req as any).user;
      if (user && user.role === role) {
        next();
      } else {
        res.status(403).json({ error: "Access denied: insufficient permissions" });
      }
    };
  };

  // --- API Routes ---

  // Auth: Login
  app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body;
    const user = users.find((u) => u.username === username);

    if (user && bcrypt.compareSync(password, user.passwordHash)) {
      const token = jwt.sign({ id: user.id, role: user.role, cardId: user.cardId }, JWT_SECRET, {
        expiresIn: "1h",
      });
      res.json({ token, role: user.role, name: user.name, cardId: user.cardId });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  // Auth: Signup
  app.post("/api/auth/signup", (req, res) => {
    const { username, password, name, role } = req.body;
    
    if (users.find((u) => u.username === username)) {
      return res.status(400).json({ error: "Username already exists" });
    }

    const id = "u" + Math.random().toString(36).substring(2, 9);
    const cardId = role === "ROLE_STAFF" ? "STAFF-" + id.toUpperCase() : "CARD-" + id.toUpperCase();
    
    const newUser: User = {
      id,
      username,
      passwordHash: bcrypt.hashSync(password, 10),
      name,
      role,
      cardId,
      walletBalance: 0,
    };
    
    users.push(newUser);

    const token = jwt.sign({ id: newUser.id, role: newUser.role, cardId: newUser.cardId }, JWT_SECRET, {
      expiresIn: "1h",
    });
    
    res.json({ token, role: newUser.role, name: newUser.name, cardId: newUser.cardId });
  });

  // Passenger: Get Profile
  app.get("/api/passenger/profile", authenticateJWT, requireRole("ROLE_PASSENGER"), (req, res) => {
    const userPayload = (req as any).user;
    const user = users.find((u) => u.id === userPayload.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const userTickets = tickets.filter((t) => t.cardId === user.cardId);
    const userTransactions = transactions.filter((t) => t.cardId === user.cardId);

    res.json({
      name: user.name,
      cardId: user.cardId,
      walletBalance: user.walletBalance,
      tickets: userTickets,
      transactions: userTransactions,
    });
  });

  // Passenger: Deposit Amount
  app.post("/api/passenger/deposit", authenticateJWT, requireRole("ROLE_PASSENGER"), (req, res) => {
    const { amount } = req.body;
    if (typeof amount !== "number" || amount <= 0) {
      return res.status(400).json({ error: "Invalid deposit amount" });
    }

    const userPayload = (req as any).user;
    const user = users.find((u) => u.id === userPayload.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.walletBalance += amount;
    transactions.push({
      id: Math.random().toString(36).substring(2, 9),
      cardId: user.cardId,
      type: "DEPOSIT",
      amount,
      timestamp: Date.now(),
    });

    res.json({ message: "Deposit successful", newBalance: user.walletBalance });
  });

  const findUserByIdentifier = (identifier: string) => {
    if (!identifier) return undefined;
    const raw = identifier.trim();
    const lower = raw.toLowerCase();
    const withoutPrefix = lower.startsWith("card-") ? lower.substring(5) : lower;
    const withPrefix = "card-" + withoutPrefix;

    return users.find((u) => {
      const uCard = (u.cardId || "").toLowerCase();
      const uCardNoPrefix = uCard.startsWith("card-") ? uCard.substring(5) : uCard;
      const uUsername = (u.username || "").toLowerCase();
      const uName = (u.name || "").toLowerCase();

      return (
        uCard === lower ||
        uCard === withPrefix ||
        uCardNoPrefix === withoutPrefix ||
        uUsername === lower ||
        uName === lower
      );
    });
  };

  // Staff: Get list of active commuters for quick selection
  app.get("/api/staff/commuters", authenticateJWT, requireRole("ROLE_STAFF"), (req, res) => {
    const passengers = users
      .filter((u) => u.role === "ROLE_PASSENGER")
      .map((u) => ({
        name: u.name || u.username,
        cardId: u.cardId,
        walletBalance: u.walletBalance,
      }));
    res.json(passengers);
  });

  // Staff: Get Wallet info by Card ID
  app.get("/api/staff/wallet/:cardId", authenticateJWT, requireRole("ROLE_STAFF"), (req, res) => {
    const { cardId } = req.params;
    const user = findUserByIdentifier(cardId);
    
    if (!user) {
      return res.status(404).json({ error: "Card ID not found" });
    }

    res.json({
      name: user.name || user.username,
      cardId: user.cardId,
      walletBalance: user.walletBalance,
    });
  });

  // Staff: Issue Ticket (Scan QR or Manual)
  app.post("/api/staff/ticket", authenticateJWT, requireRole("ROLE_STAFF"), (req, res) => {
    const { cardId, route, busNumber, amount } = req.body;
    
    if (!cardId || !route || !busNumber || typeof amount !== "number" || amount <= 0) {
      return res.status(400).json({ error: "Invalid ticket details" });
    }

    const user = findUserByIdentifier(cardId);
    if (!user) {
      return res.status(404).json({ error: "Card ID not found" });
    }

    if (user.walletBalance < amount) {
      return res.status(400).json({ error: "Insufficient wallet balance" });
    }

    // Deduct amount
    user.walletBalance -= amount;

    // Create ticket
    const ticket: Ticket = {
      id: "TKT-" + Math.random().toString(36).substring(2, 9).toUpperCase(),
      cardId: user.cardId,
      timestamp: Date.now(),
      route,
      busNumber,
      amount,
    };
    tickets.push(ticket);

    // Record transaction
    transactions.push({
      id: Math.random().toString(36).substring(2, 9),
      cardId: user.cardId,
      type: "TICKET_PURCHASE",
      amount,
      timestamp: Date.now(),
    });

    res.json({ message: "Ticket issued successfully", ticket });
  });

  // Staff: Get Ticket History
  app.get("/api/staff/tickets", authenticateJWT, requireRole("ROLE_STAFF"), (req, res) => {
    res.json(tickets);
  });


  // Vite middleware for development
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
