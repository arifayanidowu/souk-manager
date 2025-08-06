const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");
const { faker } = require("@faker-js/faker");

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";
const port = process.env.PORT || 3000;

console.log("Environment variables:");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("PORT:", process.env.PORT);
console.log("HOSTNAME:", process.env.HOSTNAME);
console.log("PUBLIC_URL:", process.env.PUBLIC_URL);
console.log("NEXT_PUBLIC_SOCKET_URL:", process.env.NEXT_PUBLIC_SOCKET_URL);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const MAX_EMPLOYEES = 20;
const EMPLOYEES_PER_PAGE = 10;
const UPDATE_INTERVAL = 5000;

let allEmployees = [];
let employeeCounter = 0;
let connectedClients = 0;

function generateEmployeeData() {
  const positions = [
    "Software Engineer",
    "Product Manager",
    "Data Analyst",
    "UX Designer",
    "DevOps Engineer",
    "QA Engineer",
    "Frontend Developer",
    "Backend Developer",
    "Full Stack Developer",
    "Project Manager",
    "Business Analyst",
    "UI Designer",
  ];

  const employmentStatuses = ["Full-time", "Part-time", "Contract", "Intern"];

  return {
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    position: faker.helpers.arrayElement(positions),
    team: faker.number.int({ min: 1, max: 10 }),
    birthday: faker.date
      .birthdate({ min: 18, max: 65, mode: "age" })
      .toISOString()
      .split("T")[0],
    email: faker.internet.email(),
    phoneNumber: faker.phone.number(),
    address: faker.location.streetAddress({ useFullAddress: true }),
    employmentStatus: faker.helpers.arrayElement(employmentStatuses),
    notes: faker.lorem.sentence(),
  };
}

for (let i = 0; i < 10; i++) {
  allEmployees.push(generateEmployeeData());
}

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);

      // Health check endpoint
      if (parsedUrl.pathname === "/health") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            status: "ok",
            timestamp: new Date().toISOString(),
            port: port,
            environment: process.env.NODE_ENV,
          })
        );
        return;
      }

      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  // Add error handling for the server
  server.on("error", (err) => {
    console.error("Server error:", err);
  });

  const corsOrigins =
    process.env.NODE_ENV === "production"
      ? true // Allow all origins in production
      : [
          "http://localhost:3000",
          "http://localhost:3001",
          "http://localhost:3002",
          "http://localhost:3003",
          "https://codesandbox.io",
          process.env.PUBLIC_URL,
          process.env.NEXT_PUBLIC_SOCKET_URL,
        ].filter(Boolean);

  const io = new Server(server, {
    cors: {
      origin: corsOrigins,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Socket.IO event handlers
  io.on("connection", (socket) => {
    console.log("Client connected");
    connectedClients++;

    // Send initial data with pagination info
    const initialData = {
      employees: allEmployees.slice(0, EMPLOYEES_PER_PAGE),
      total: allEmployees.length,
      page: 1,
      totalPages: Math.ceil(allEmployees.length / EMPLOYEES_PER_PAGE),
      hasMore: allEmployees.length > EMPLOYEES_PER_PAGE,
    };
    socket.emit("employeeData", initialData);

    // Also send a sync event to ensure the client has the correct total count
    socket.emit("syncEmployeeCount", {
      total: allEmployees.length,
      totalPages: Math.ceil(allEmployees.length / EMPLOYEES_PER_PAGE),
    });

    // Handle pagination requests
    socket.on("requestPage", (page) => {
      const startIndex = (page - 1) * EMPLOYEES_PER_PAGE;
      const endIndex = startIndex + EMPLOYEES_PER_PAGE;
      const pageData = {
        employees: allEmployees.slice(startIndex, endIndex),
        total: allEmployees.length,
        page: page,
        totalPages: Math.ceil(allEmployees.length / EMPLOYEES_PER_PAGE),
        hasMore: endIndex < allEmployees.length,
      };
      socket.emit("pageData", pageData);
    });

    // Handle refresh/add more employees request
    socket.on("addEmployees", (count = 5) => {
      console.log("addEmployees event received with count:", count);
      const currentCount = allEmployees.length;
      const availableSlots = MAX_EMPLOYEES - currentCount;
      const toAdd = Math.min(count, availableSlots);

      console.log(
        `Current count: ${currentCount}, Available slots: ${availableSlots}, To add: ${toAdd}`
      );

      if (toAdd > 0) {
        for (let i = 0; i < toAdd; i++) {
          const newEmployee = generateEmployeeData();
          allEmployees.unshift(newEmployee);
          employeeCounter++;
        }

        // Broadcast updated data to all clients
        io.emit("employeesAdded", {
          added: toAdd,
          total: allEmployees.length,
          totalPages: Math.ceil(allEmployees.length / EMPLOYEES_PER_PAGE),
          message: `Added ${toAdd} new employees`,
        });

        console.log(
          `Added ${toAdd} new employees (${allEmployees.length}/${MAX_EMPLOYEES})`
        );
      } else {
        socket.emit("employeesAdded", {
          added: 0,
          total: allEmployees.length,
          message: "Maximum employee limit reached",
        });
        console.log("Maximum employee limit reached");
      }
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected");
      connectedClients--;
    });
  });

  setInterval(() => {
    if (connectedClients > 0 && allEmployees.length < MAX_EMPLOYEES) {
      const newEmployee = generateEmployeeData();
      allEmployees.unshift(newEmployee);
      employeeCounter++;

      io.emit("newEmployee", {
        employee: newEmployee,
        total: allEmployees.length,
        totalPages: Math.ceil(allEmployees.length / EMPLOYEES_PER_PAGE),
      });

      console.log(
        `Broadcasting new employee: ${newEmployee.name} (${allEmployees.length}/${MAX_EMPLOYEES})`
      );

      if (allEmployees.length >= MAX_EMPLOYEES) {
        console.log(`Reached maximum employee limit of ${MAX_EMPLOYEES}`);
      }
    }
  }, UPDATE_INTERVAL);

  server.listen(port, "0.0.0.0", () => {
    console.log(`> Ready on http://0.0.0.0:${port}`);
    console.log(`WebSocket server running on port ${port}`);
    console.log(`Public URL: ${process.env.PUBLIC_URL || "Not set"}`);
    console.log(
      `Socket URL: ${process.env.NEXT_PUBLIC_SOCKET_URL || "Not set"}`
    );
    console.log(`Maximum employees: ${MAX_EMPLOYEES}`);
    console.log(`Employees per page: ${EMPLOYEES_PER_PAGE}`);
    console.log(`Update interval: ${UPDATE_INTERVAL}ms`);
  });
});
