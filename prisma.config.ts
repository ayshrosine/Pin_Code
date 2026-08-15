import { defineConfig } from "@prisma/config";

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL || "mongodb://localhost:27017/pincode_db",
  },
});
