import type { IoTATLScriptContextTest } from '../../types';

export function onInit(): IoTATLScriptContextTest {
    return {
        _execute: function () {
            // PackagePacker: Start of Script
            if (
                this.settings.mlModelName != null &&
                this.settings.mlModelName.length > 0 &&
                this.settings.mlModelRevision != null &&
                this.settings.mlModelRevision.length > 0
            ) {
                this.settings.mlModel = {
                    Name: this.settings.mlModelName,
                    Revision: this.settings.mlModelRevision,
                };
            }

            this.reloadTree();
            // PackagePacker: End of Script
        },
    };
}
