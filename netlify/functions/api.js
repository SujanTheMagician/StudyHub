// Sujan – Netlify Function that runs the Express API in server/app.js
// netlify.toml sends every /api/* request here.

import serverless from "serverless-http";
import app from "../../server/app.js";

export const handler = serverless(app);
