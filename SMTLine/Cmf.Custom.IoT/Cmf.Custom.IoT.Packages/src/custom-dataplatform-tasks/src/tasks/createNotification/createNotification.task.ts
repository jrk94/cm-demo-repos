import { System, Task, TaskBase } from "@criticalmanufacturing/connect-iot-controller-engine";
import Cmf from "cmf-lbos";
import moment from "moment";

/** Default values for settings */
export const SETTINGS_DEFAULTS: Pick<
    CreateNotificationSettings,
    "assignmentTo" | "isToSendEmailNotification" | "clearanceMode"
> = {
    assignmentTo: "Everyone",
    isToSendEmailNotification: false,
    clearanceMode: "ManualSingleUser"
};

/**
 * @whatItDoes
 *
 * This task creates a notification on the system with the given settings (Foundation)
 * It mimicks the settings shown on the create notification wizard
 *
 * @howToUse
 *
 * Add the required settings to the task and it will create a notification.
 * Same behaviour as creating the notification throught the create notification wizard
 *
 * ### Inputs
 * * N/A
 *
 * ### Outputs
 * * N/A
 *
 * ### Settings
 * See {@see CreateNotificationSettings}
 */
@Task.Task()
export class CreateNotificationTask extends TaskBase implements CreateNotificationSettings {
    /** **Inputs** */

    /**
     * Title property of Notification entity.
     * Note: Title shown on the notification prompt to the user
     */
    @Task.InputProperty(System.PropertyValueType.String)
    public notificationTitle: string;

    /**
     * Details property of Notification entity. (Opcional)
     * Note: Subtitle shown on the notification prompt to the user
     */
    @Task.InputProperty(System.PropertyValueType.String)
    public notificationDetails?: string;

    /**
     * Notification severity property of Notification entity.
     * Note: value provided by the NotificationSeverity lookup table
     */
    @Task.InputProperty(System.PropertyValueType.String)
    public notificationSeverity: string;

    /**
     * Raw Notification to be used as based
     */
   @Task.InputProperty(System.PropertyValueType.ReferenceType)
   public notification: Cmf.Foundation.BusinessObjects.Notification;

    /** **Outputs** */

    /** Properties Settings */

    /**
     * Name property of Notification entity. (Opcional if name generator is configured)
     */
    public name?: string;

    /**
     * Description property of Notification entity (Opcional)
     */
    public description?: string;

    /**
     * Type property of Notification entity
     * Note: value provided by the NotificationType lookup table
     */
    public type: string;

    /**
     * Notification assign to a specific target.
     * Can be: Everyone, Role or User
     */
    public assignmentTo = SETTINGS_DEFAULTS.assignmentTo;

    /**
     * Role to assign the notification.
     * Note: Only mandatory and applicable if `assignmentTo` is set to `Role`
     */
    public assignmentToRole?: Cmf.Foundation.Security.Role;

    /**
     * User to assign the notification.
     * Note: Only mandatory and applicable if `assignmentTo` is set to `User`
     */
    public assignmentToUser?: Cmf.Foundation.Security.User;

    /**
     * Flag to indicate if is to send an email with the notification data
     */
    public isToSendEmailNotification: boolean = SETTINGS_DEFAULTS.isToSendEmailNotification;

    /**
     * Distribution list to send the notification data.
     * Note: Only mandatory and applicable if `isToSendEmailNotification` is set to `true`
     */
    public distributionList?: string;

    /**
     * Clerance Mode to associate to the notification
     */
    public clearanceMode: keyof typeof Cmf.Foundation.BusinessObjects.ClearanceMode = SETTINGS_DEFAULTS.clearanceMode;

    /**
     * Clearance valid until a certain time
     * Note: Only mandatory and applicable if `clearanceMode` is different than `ManualSingleUser`
     */
    public clearanceValidTo: moment.Moment;

    /**
     * When one or more input values is changed this will be triggered,
     * @param changes Task changes
     */
    public override async onChanges(changes: Task.Changes): Promise<void> {
        if (changes["activate"]) {
            // It is advised to reset the activate to allow being reactivated without the value being different
            this.activate = undefined;

            try {
                const notification = (changes?.["notification"]?.currentValue ?? new Cmf.Foundation.BusinessObjects.Notification()) as
                    Cmf.Foundation.BusinessObjects.Notification;
                notification.Name ??= this.name;
                notification.Description ??= this.description;
                notification.Type ??= this.type;
                notification.Title = changes?.["notificationTitle"]?.currentValue ?? notification.Title ?? this.notificationTitle;
                notification.Details = changes?.["notificationDetails"]?.currentValue ?? notification.Details ?? this.notificationDetails;
                notification.Severity = changes?.["notificationSeverity"]?.currentValue ?? notification.Severity ?? this.notificationSeverity;
                notification.AssignmentType ??= Cmf.Foundation.BusinessObjects.NotificationAssignmentType[this.assignmentTo];

                /**
                 * Handle assignment settings
                 */
                if (notification.AssignmentType === Cmf.Foundation.BusinessObjects.NotificationAssignmentType.Role) {
                    if (notification.AssignedToRole == null && this.assignmentToRole?.Name != null) {
                        const input = new Cmf.Foundation.BusinessOrchestration.SecurityManagement.InputObjects.GetRoleByNameInput();
                        input.Name = this.assignmentToRole.Name;

                        const output = await this._systemAPI.call(input) as
                            Cmf.Foundation.BusinessOrchestration.SecurityManagement.OutputObjects.GetRoleByNameOutput;

                        notification.AssignedToRole = output.Role;
                    }

                    if (this.isNullOrWhiteSpace(notification.AssignedToRole?.Name)) {
                        throw "Missing `Role` since `AssignmentType` is set as `Role`";
                    }
                } else if (
                    notification.AssignmentType === Cmf.Foundation.BusinessObjects.NotificationAssignmentType.User
                ) {
                    if (notification.AssignedToUser == null && this.assignmentToUser.UserAccount != null) {
                        const input = new Cmf.Foundation.BusinessOrchestration.SecurityManagement.InputObjects.GetUserByUserAccountInput();
                        input.UserAccount = this.assignmentToUser.UserAccount;

                        const output = await this._systemAPI.call(input) as
                            Cmf.Foundation.BusinessOrchestration.SecurityManagement.OutputObjects.GetUserByUserAccountOutput;
                        notification.AssignedToUser = output.User;
                    }

                    if (this.isNullOrWhiteSpace(notification.AssignedToUser?.UserName)) {
                        throw "Missing `User` since `AssignmentType` is set as `User`";
                    }
                }

                /**
                 * Handle email settings
                 */
                notification.SendEmailToAssignedParty ??= this.isToSendEmailNotification;

                if (notification.SendEmailToAssignedParty) {
                    notification.EmailDistributionList ??= this.distributionList;

                    if (this.isNullOrWhiteSpace(this.distributionList)) {
                        this._logger.warning(
                            "Is to send email to an assigned party but the `DistributionList` is null or empty"
                        );
                    }
                }

                /**
                 * Handle clearance settings
                 */
                notification.ClearanceMode ??= Cmf.Foundation.BusinessObjects.ClearanceMode[this.clearanceMode];
                notification.ValidTo ??= this.clearanceValidTo;

                if (
                    notification.ClearanceMode !== Cmf.Foundation.BusinessObjects.ClearanceMode.ManualSingleUser &&
                    (notification.ValidTo == null || !notification.ValidTo.isValid())
                ) {
                    throw "Missing `ValidTo` since `ClearanceMode` is only opcional for `ManualSingleUser`";
                }

                const input =
                    new Cmf.Foundation.BusinessOrchestration.GenericServiceManagement.InputObjects.CreateObjectInput();
                input.Object = notification;

                const output = (await this._systemAPI.call(
                    input
                )) as Cmf.Foundation.BusinessOrchestration.GenericServiceManagement.OutputObjects.CreateObjectOutput;

                this._logger.info(`Notification ${output?.Object?.Name} created with success`);
                this.success.emit(true);
            } catch (e) {
                // use error message if is an object with `message` property, otherwise use what was thrown
                this.logAndEmitError(e?.message ?? e);
            }
        }
    }

    /** Right after settings are loaded, create the needed dynamic outputs. */
    public override async onBeforeInit(): Promise<void> {}

    /** Initialize this task, register any event handler, etc */
    public override async onInit(): Promise<void> {
        this.sanitizeSettings(SETTINGS_DEFAULTS);
    }

    /** Cleanup internal data, unregister any event handler, etc */
    public override async onDestroy(): Promise<void> {}

    /**
     * Determines if the supplied string is not null or comprised only by white spaces
     * @param valueType Value type
     * @param value Current value
     */
    private isNullOrWhiteSpace(value: string): any {
        return value == null || value.trim() === "";
    }
}

// Add settings here
/** CreateNotification Settings object */
export interface CreateNotificationSettings {
    // General settings
    name?: string;
    description?: string;
    /** Value provided by the NotificationType lookup table  */
    type: string;
    // Notification settings
    notificationTitle: string;
    notificationDetails?: string;
    /** Value provided by the NotificationSeverity lookup table  */
    notificationSeverity: string;
    // Assignments settings
    assignmentTo: keyof typeof Cmf.Foundation.BusinessObjects.NotificationAssignmentType;
    assignmentToRole?: Partial<Cmf.Foundation.Security.Role>;
    assignmentToUser?: Partial<Cmf.Foundation.Security.User>;
    // Email settings
    isToSendEmailNotification: boolean;
    distributionList?: string;
    // Clearance settings
    clearanceMode: keyof typeof Cmf.Foundation.BusinessObjects.ClearanceMode;
    clearanceValidTo?: moment.Moment;
}
