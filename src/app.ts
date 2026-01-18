import { specs, swaggerUi } from './utils/swagger';
import env from './utils/env'
import { createApp } from "./server/server";

const startApp = async () => {
    const port = env.PORT;
    const app = await createApp();

    // Swagger documentation
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs, {
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'API Documentation'
    }));

    app.listen(port, () => {
        console.log(`Listening on port ${port}!`)
    })
}

startApp();
