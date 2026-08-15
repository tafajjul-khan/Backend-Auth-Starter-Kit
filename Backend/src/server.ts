import { connectDB } from "./config/connecDB.ts";
import { generateOpenApiJson } from "./config/swagger.config.ts";
import { app , PORT} from "./app.ts";

const startServer = async function () {
  await connectDB();
  try {
    app.listen(PORT, () => {
      console.log(`application listning on http://localhost:${PORT}`);
      console.log(`📝 Swagger UI: http://localhost:${PORT}/docs`);
      generateOpenApiJson();
    });
  } catch (error) {
    console.log(error);
  }
};

startServer();
