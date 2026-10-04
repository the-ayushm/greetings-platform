import http from "node:http";
http.createServer((req, res) => { res.writeHead(200, { "content-type": "application/json" }); res.end('{"ok":true}'); }).listen(4010, "127.0.0.1");
