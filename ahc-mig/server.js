// Minimal static file server for the MIG Legal Aid Society site.
// Only needed if your environment forces you to run through Node.
// If you can just open index.html or use VS Code's Live Server, skip this file.

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serves every .html/.css/.js file sitting in this same folder,
// so /empanelled-lawyers.html, /assets/style.css, etc. all resolve.
app.use(express.static(path.join(__dirname)));

app.listen(PORT, () => {
  console.log(`MIG Legal Aid Society site running at http://localhost:${PORT}`);
});