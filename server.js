const http = require("http");
const fs = require("fs");
const path = require("path");
const { MongoClient } = require("mongodb");
const querystring = require("querystring");

// MongoDB connection details
const uri = "mongodb://127.0.0.1:27017";
const dbName = "CPTS580";
const collectionName = "commentList";

const client = new MongoClient(uri);

// Function to fetch data from MongoDB
async function fetchData() {
    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection(collectionName);
        return await collection.find({}).toArray();
    } catch (err) {
        console.error("Error fetching data:", err);
        return [];
    } finally {
        await client.close();
    }
}

// Function to add data to MongoDB
async function addData(name) {
    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection(collectionName);
        const date = new Date();
        await collection.insertOne({ name, date});
        console.log("Data added:", { name, date});
    } catch (err) {
        console.error("Error adding data:", err);
    } finally {
        await client.close();
    }
}

// Function to get MIME type based on file extension
const getMimeType = (ext) => {
    const mimeTypes = {
        ".html": "text/html",
        ".css": "text/css",
        ".js": "application/javascript",
        ".png": "image/png",
        ".jpg": "image/jpeg",
    };
    return mimeTypes[ext] || "application/octet-stream";
};

// Create an HTTP server
const server = http.createServer(async (req, res) => {
    if (req.url === "/" && req.method === "GET") {
        // Serve the main HTML page
        fs.readFile("index.html", "utf8", async (err, html) => {
            if (err) {
                res.writeHead(500, { "Content-Type": "text/plain" });
                res.end("Error loading HTML page.");
                return;
            }

            const data = await fetchData();
            const itemsList = data
                .map((item) => `<p>"${item.name}" added on ${item.date}</p>`)
                .join("");

            const renderedHtml = html.replace("{{data}}", itemsList);

            res.writeHead(200, { "Content-Type": "text/html" });
            res.end(renderedHtml);
        });
    } else if (req.url === "/" && req.method === "POST") {
        // Handle form submission to add data
        let body = "";
        req.on("data", (chunk) => {
            body += chunk.toString();
        });
        req.on("end", async () => {
            const parsedData = querystring.parse(body);
            const name = parsedData.name;

            if (name) {
                await addData(name);
                res.writeHead(302, { Location: "/" });
                res.end();
            } else {
                res.writeHead(400, { "Content-Type": "text/plain" });
                res.end("Invalid input.");
            }
        });
    } else {
        // Serve static files (CSS, JS, Images, etc.)
        const filePath = path.join(__dirname, req.url);
        const ext = path.extname(filePath);

        // Check if the file exists
        fs.access(filePath, fs.constants.F_OK, (err) => {
            if (err) {
                res.writeHead(404, { "Content-Type": "text/plain" });
                res.end("Page not found");
                return;
            }

            // Read and serve the file
            fs.readFile(filePath, (err, content) => {
                if (err) {
                    res.writeHead(500, { "Content-Type": "text/plain" });
                    res.end("Server error.");
                    return;
                }

                res.writeHead(200, { "Content-Type": getMimeType(ext) });
                res.end(content);
            });
        });
    }
});

// Start server
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
