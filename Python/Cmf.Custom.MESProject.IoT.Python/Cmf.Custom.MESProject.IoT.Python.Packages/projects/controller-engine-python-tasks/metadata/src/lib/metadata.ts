import { ConnectIoTPackageMetadata } from 'cmf-core-connect-iot/extensions';

export const Metadata: ConnectIoTPackageMetadata = {
    name: '@criticalmanufacturing/connect-iot-controller-engine-python-tasks',
    friendlyName: 'Python Tasks',
    version: '0.0.0',
    load: () => import('@criticalmanufacturing/connect-iot-controller-engine-python-tasks'),
    tasks: [
        'pythonCode'
    ],
    converters: [],
    fonts: []
};
