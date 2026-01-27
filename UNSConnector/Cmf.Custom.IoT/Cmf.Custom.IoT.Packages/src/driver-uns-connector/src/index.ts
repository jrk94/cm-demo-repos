import { container } from "./inversify.config";
import { DriverBootstrap } from "@criticalmanufacturing/connect-iot-driver";

const bootstrap = new DriverBootstrap(container);

bootstrap.setup({
    name: "UNSConnector",
    driverName: "DriverUNSConnector",
    addons: [
        { name: "better-sqlite3", specific: true, destination: ["build", "release"] }
    ],
});

bootstrap.start();
