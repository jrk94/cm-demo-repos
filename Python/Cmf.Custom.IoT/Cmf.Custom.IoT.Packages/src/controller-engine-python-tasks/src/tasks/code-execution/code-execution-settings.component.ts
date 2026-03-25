import {
    CommonModule
} from "@angular/common";

import {
    NgModule,
    forwardRef,
    Component,
    OnInit,
    OnChanges,
    OnDestroy,
    ViewContainerRef,
    SimpleChanges
} from "@angular/core";

import {
    UtilService,
    HOST_VIEW_COMPONENT,
    ResultMessageType
} from "cmf-core";

import {
    PropertyContainerModule,
    PropertyEditorModule
} from "cmf-core-business-controls";

import {
    TaskSettingsBase,
    TaskSettingsModule,
    TaskSettingsService,
    TaskDefinitionSettings
} from "cmf-core-connect-iot";

import { Utilities } from "@criticalmanufacturing/connect-iot-controller-engine";

import {
    ValidatorModule,
    CodeEditorModule,
    CodeEditorLanguage,
    OnValidateArgs,
    ValidatorModel,
    OnValidate,
    BaseWidgetModule,
    PopOverInfoModule
} from "cmf-core-controls";

import { CodeExecutionSettingsUtil } from "./code-execution-settings-util";

import {
    CodeExecutionSettings as CodeExecutionProperties,
    SETTINGS_DEFAULTS,
    decode,
    encode
} from "./code-execution.task";
/**
 * Bundled dts content
 */
import { TEMPLATE_CONTENT, DEFAULT_FRAMEWORK_ID } from "./execution-engine/v100/code-template";

/** Constants */
export interface CodeExecutionTaskSettings extends CodeExecutionProperties, TaskDefinitionSettings { }

/**
 * Code execution task settings component
 */
@Component({
    selector: "connect-iot-controller-engine-core-tasks-codeExecution-settings",
    templateUrl: "./code-execution-settings.component.html",
    styleUrls: ["./code-execution-settings.component.less"],
    viewProviders: [{ provide: HOST_VIEW_COMPONENT, useExisting: forwardRef(() => CodeExecutionSettings) }]
})
export class CodeExecutionSettings extends TaskSettingsBase implements OnInit, OnChanges, OnDestroy, OnValidate {

    /**
     * Assigns
     */
    public CodeEditorLanguage = CodeEditorLanguage;

    private _codeEditor: monaco.editor.ICodeEditor;
    private _codeEditorModel: monaco.editor.IModel;
    private _tsCode: string;
    private _tsCodeChange: string;
    private _jsCode: string;
    private _mapCode: string;

    /**
     * Task settings
     */
    public override settings: CodeExecutionTaskSettings;

    private async transpile(): Promise<{ success: boolean; diagnostics?: string[] }> {
        let success: boolean = false;
        const diagnostics: string[] = [];
        // skip if already have js code and no changes found in ts code
        if (this.settings.jsCodeBase64 && (this._tsCodeChange == null || this._tsCode === this._tsCodeChange)) {
            success = true;
        } else if (this._codeEditor != null) {
            const uri = this._codeEditor.getModel().uri;
            const worker = await monaco.languages.typescript.getTypeScriptWorker();
            const client = await worker(uri);
            const tsDiagnostics = await client.getSemanticDiagnostics(uri.toString());
            tsDiagnostics.push(...await client.getSyntacticDiagnostics(uri.toString()));

            success = true;
            tsDiagnostics.forEach((diagnostic) => {
                if (diagnostic.category === 1) {
                    success = false;

                    const text = this._codeEditor.getValue().slice(0, diagnostic.start);
                    const line = text.match(/\n/g).length;
                    const row = diagnostic.start - text.lastIndexOf("\n");

                    let message: string;

                    if (typeof diagnostic.messageText === "string") {
                        message = diagnostic.messageText;
                    } else {
                        message = diagnostic.messageText.messageText;
                    }

                    diagnostics.push(`${line}:${row} - error TS${diagnostic.code}: ${message}`);
                }
            });

            if (!success) {
                return { success, diagnostics };
            }

            const emitOutput = await client.getEmitOutput(uri.toString());

            if (!emitOutput.emitSkipped && emitOutput.outputFiles.length > 0) {
                for (const file of emitOutput.outputFiles) {
                    const fileName: string = file.name.toString();
                    if (fileName.toLocaleLowerCase().endsWith(".js")) {
                        this._jsCode = file.text;
                    } else if (fileName.toLocaleLowerCase().endsWith(".js.map")) {
                        this._mapCode = file.text;
                    }
                }
            }
        }

        return { success, diagnostics };
    }

    /**
     * Converts a string with multiple lines to an array of strings where each entry represents a line.
     * Also replaces tabs with spaces.
     * Useful for readability when saving to json.
     */
    private toMultilineArray(value: string): string[] {
        return value?.replace(/\t/g, "    ").split("\n") || [];
    }

    /** Converts an array of strings to a single string with line breaks */
    private fromMultilineArray(value: string[]): string {
        return value?.join("\n") || "";
    }

    /**
     * Constructor
     */
    constructor(
        viewContainerRef: ViewContainerRef,
        service: TaskSettingsService,
        private util: UtilService
    ) {
        super(viewContainerRef, service);

        service.onBeforeSave = this.onBeforeSave.bind(this);
    }

    /** Triggered when the task is created and define the default values */
    public ngOnInit(): void {
        const currentSettings = Object.assign({}, this.settings);
        Object.assign(this.settings, SETTINGS_DEFAULTS, currentSettings);
        this._tsCode = decode(this.settings.tsCodeBase64 || "") || this.fromMultilineArray(this.settings.tsCode) || TEMPLATE_CONTENT;
    }

    /** Triggered when an element from the html page is changed */
    public override ngOnChanges(changes: SimpleChanges): void {
        super.ngOnChanges(changes);
    }

    /**
     * When nested code editor value changes
     */
    public onCodeEditorValueChange(value: string): void {
        this._tsCodeChange = value;
    }

    /**
     * When nested code editor finish loading, add extra libraries for the compiler
     */
    public async onCodeEditorSetupFinish(editor: monaco.editor.ICodeEditor): Promise<void> {
        // Setup
        this._codeEditor = editor;
        const tsDefaults = monaco.languages.typescript.typescriptDefaults;
        tsDefaults.setCompilerOptions({
            module: monaco.languages.typescript.ModuleKind.CommonJS,
            target: monaco.languages.typescript.ScriptTarget.ES2017,
            allowNonTsExtensions: true,
            emitDecoratorMetadata: true,
            experimentalDecorators: true,
            typeRoots: ["node_modules/@types"],
            noEmitOnError: true,
            noImplicitAny: true,
            noImplicitReturns: true,
            noImplicitThis: true,
            ignoreDeprecations: "5.0"
            // sourceMap: true,
            // inlineSourceMap: true,
        });

        let hasDriverConnection: boolean = false;
        if (this.service != null &&
            this.service.container != null &&
            this.service.container.definition != null &&
            this.service.container.definition.driver != null) {
            hasDriverConnection = true;
        }

        tsDefaults.setExtraLibs([{
            content: await CodeExecutionSettingsUtil.getFrameworkTypings(hasDriverConnection, this.service?.container?.library),
            filePath: `file:///node_modules/@types/${DEFAULT_FRAMEWORK_ID}/index.d.ts`
        }]);

        // Renew model
        this._codeEditorModel = monaco.editor.createModel(
            this._tsCode,
            "typescript",
            monaco.Uri.parse(this.util.uniqueId())
        );
        editor.setModel(this._codeEditorModel);
    }

    /**
     * Compile and validate the code
     */
    public async onValidate(context: OnValidateArgs, model: ValidatorModel): Promise<boolean> {
        let result = await model.validate(context);
        // Validate code
        const { success: codeValid, diagnostics } = await this.transpile();
        if (!codeValid) {
            if (diagnostics?.length > 0) {
                diagnostics?.forEach((msg) => {
                    context.resultMessages.push({
                        message: msg,
                        type: ResultMessageType.Error
                    });
                });
            } else {
                context.resultMessages.push({
                    message: $localize`:@@@criticalmanufacturing/connect-iot-controller-engine-core-tasks/code-execution.settings#INVALID_CODE:Code is not valid`,
                    type: ResultMessageType.Error
                });
            }

            result = false;
        }
        return result;
    }

    /**
     * Add changes to settings
     * @param settings Settings
     */
    public async onBeforeSave(settings: CodeExecutionProperties): Promise<CodeExecutionProperties> {
        if (this._tsCodeChange != null && this._tsCode !== this._tsCodeChange) {
            // Save TypeScript code
            settings.tsCode = this.toMultilineArray(this._tsCodeChange);
            delete settings.tsCodeBase64;
        } else if (settings.tsCodeBase64) {
            // Save TypeScript base64 encoded code (legacy) as decoded
            const tsCode = decode(settings.tsCodeBase64);
            settings.tsCode = this.toMultilineArray(tsCode);
            delete settings.tsCodeBase64;
        }
        if (this._jsCode != null) {
            // Save JavaScript code encoded in base64
            settings.jsCodeBase64 = encode(this._jsCode);
        }
        if (this._mapCode != null) {
            // Save TypeScript mappings encoded in base64
            settings.mapCodeBase64 = encode(this._mapCode);
        }

        settings?.inputs?.map(input => {
            if ("defaultValue" in input && typeof input.defaultValue === "object") {
                input.defaultValue = Utilities.stripAutomationEntity(input.defaultValue, ["$type", "Name"]);
            }

            return input;
        });

        return settings;
    }

    public ngOnDestroy(): void {
        if (this._codeEditorModel != null) {
            this._codeEditorModel.dispose();
        }
    }
}

/** Module */
@NgModule({
    imports: [
        CommonModule,
        CodeEditorModule,
        TaskSettingsModule,
        ValidatorModule,
        BaseWidgetModule,
        PopOverInfoModule,
        PropertyContainerModule,
        PropertyEditorModule,
        ValidatorModule
    ],
    declarations: [CodeExecutionSettings]
})
export class CodeExecutionSettingsModule { }
