import { ApplicationConfig, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideServiceWorker } from '@angular/service-worker';
import { provideMesUI } from 'cmf-mes-ui';
import { provideMetadataRouter } from 'cmf-core';

import { Metadata as CustomPythonTasks } from '@criticalmanufacturing/connect-iot-controller-engine-python-tasks/metadata';

export const appConfig: ApplicationConfig = {
    providers: [provideRouter(routes), provideServiceWorker('ngsw-loader-worker.js', {
        enabled: !isDevMode(),
        registrationStrategy: 'registerWhenStable:30000'
    }), provideMesUI({
        tasks: [
            CustomPythonTasks
        ]
    }), provideMetadataRouter()]
};
