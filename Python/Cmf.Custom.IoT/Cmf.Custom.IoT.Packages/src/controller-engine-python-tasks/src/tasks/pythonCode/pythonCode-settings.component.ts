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
    HOST_VIEW_COMPONENT
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

import {
    PythonCodeSettings as PythonCodeProperties,
    SETTINGS_DEFAULTS
} from "./pythonCode.task";

import { decode, encode } from "../../utilities/utilities";
import { PYTHON_TEMPLATE_CONTENT } from "./pythonCode-template";

/** Constants */
export interface PythonCodeTaskSettings extends PythonCodeProperties, TaskDefinitionSettings { }

/**
 * Python code task settings component
 */
@Component({
    selector: "connect-iot-controller-engine-python-tasks-pythonCode-settings",
    templateUrl: "./pythonCode-settings.component.html",
    styleUrls: ["./pythonCode-settings.component.less"],
    viewProviders: [{ provide: HOST_VIEW_COMPONENT, useExisting: forwardRef(() => PythonCodeSettingsComponent) }]
})
export class PythonCodeSettingsComponent extends TaskSettingsBase implements OnInit, OnChanges, OnDestroy, OnValidate {

    public CodeEditorLanguage = CodeEditorLanguage;

    private _pyCode: string;
    private _pyCodeChange: string;

    /** Task settings */
    public override settings: PythonCodeTaskSettings;

    /**
     * Converts a string with multiple lines to an array of strings.
     * Also replaces tabs with spaces.
     */
    private toMultilineArray(value: string): string[] {
        return value?.replace(/\t/g, "    ").split("\n") || [];
    }

    /** Converts an array of strings to a single string with line breaks */
    private fromMultilineArray(value: string[]): string {
        return value?.join("\n") || "";
    }

    constructor(
        viewContainerRef: ViewContainerRef,
        service: TaskSettingsService
    ) {
        super(viewContainerRef, service);
        service.onBeforeSave = this.onBeforeSave.bind(this);
    }

    /** Triggered when the task is created — applies default values */
    public ngOnInit(): void {
        const currentSettings = Object.assign({}, this.settings);
        Object.assign(this.settings, SETTINGS_DEFAULTS, currentSettings);
        this._pyCode = decode(this.settings.pyCodeBase64 || "") || this.fromMultilineArray(this.settings.pyCode) || PYTHON_TEMPLATE_CONTENT;
    }

    /** Triggered when an element from the html page is changed */
    public override ngOnChanges(changes: SimpleChanges): void {
        super.ngOnChanges(changes);
    }

    /** When the code editor value changes */
    public onCodeEditorValueChange(value: string): void {
        this._pyCodeChange = value;
    }

    /** Validate the settings (Python has no transpile step) */
    public async onValidate(context: OnValidateArgs, model: ValidatorModel): Promise<boolean> {
        return model.validate(context);
    }

    /** Encode and persist the Python code before saving */
    public async onBeforeSave(settings: PythonCodeProperties): Promise<PythonCodeProperties> {
        if (this._pyCodeChange != null && this._pyCode !== this._pyCodeChange) {
            settings.pyCode = this.toMultilineArray(this._pyCodeChange);
            settings.pyCodeBase64 = encode(this._pyCodeChange);
        } else if (settings.pyCodeBase64) {
            const pyCode = decode(settings.pyCodeBase64);
            settings.pyCode = this.toMultilineArray(pyCode);
        }
        return settings;
    }

    public ngOnDestroy(): void { }
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
    declarations: [PythonCodeSettingsComponent]
})
export class PythonCodeSettingsModule { }
