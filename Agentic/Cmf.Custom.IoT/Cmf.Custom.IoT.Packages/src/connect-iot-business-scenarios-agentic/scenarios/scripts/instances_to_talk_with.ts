import Cmf from "cmf-lbos";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
class InstancesToTalkWithWrapper {
    [key: string]: any;

    private InstancesToTalkWith() {
        // PackagePacker: Start of Script
        const filterCollection: Cmf.Foundation.BusinessObjects.QueryObject.FilterCollection = new Cmf.Foundation.BusinessObjects.QueryObject.FilterCollection();

        for (const controller of this.answers.controllersWithAgenticInstances) {
            let filter_0: Cmf.Foundation.BusinessObjects.QueryObject.Filter = new Cmf.Foundation.BusinessObjects.QueryObject.Filter();
            filter_0.Name = "AutomationControllerId";
            filter_0.ObjectName = "AutomationControllerInstance";
            filter_0.ObjectAlias = "AutomationControllerInstance_1";
            filter_0.Operator = Cmf.Foundation.Common.FieldOperator.IsEqualTo;
            filter_0.Value = controller.AutomationControllerId;
            filter_0.LogicalOperator = Cmf.Foundation.Common.LogicalOperator.OR;
            filter_0.FilterType = Cmf.Foundation.BusinessObjects.QueryObject.Enums.FilterType.Normal;

            filterCollection.push(filter_0);
        }

        const fieldCollection: Cmf.Foundation.BusinessObjects.QueryObject.FieldCollection = new Cmf.Foundation.BusinessObjects.QueryObject.FieldCollection();

        // Field field_0
        const field_0: Cmf.Foundation.BusinessObjects.QueryObject.Field = new Cmf.Foundation.BusinessObjects.QueryObject.Field();
        field_0.Alias = "Id";
        field_0.ObjectName = "AutomationControllerInstance";
        field_0.ObjectAlias = "AutomationControllerInstance_1";
        field_0.IsUserAttribute = false;
        field_0.Name = "Id";
        field_0.Position = 0;
        field_0.Sort = Cmf.Foundation.Common.FieldSort.NoSort;

        // Field field_1
        const field_1: Cmf.Foundation.BusinessObjects.QueryObject.Field = new Cmf.Foundation.BusinessObjects.QueryObject.Field();
        field_1.Alias = "Name";
        field_1.ObjectName = "AutomationControllerInstance";
        field_1.ObjectAlias = "AutomationControllerInstance_1";
        field_1.IsUserAttribute = false;
        field_1.Name = "Name";
        field_1.Position = 1;
        field_1.Sort = Cmf.Foundation.Common.FieldSort.NoSort;

        fieldCollection.push(field_0);
        fieldCollection.push(field_1);


        const query: Cmf.Foundation.BusinessObjects.QueryObject.QueryObject = new Cmf.Foundation.BusinessObjects.QueryObject.QueryObject();
        query.Description = "";
        query.EntityTypeName = "AutomationControllerInstance";
        query.Name = "InstancesToTalkWith";
        query.Query = new Cmf.Foundation.BusinessObjects.QueryObject.Query();
        query.Query.Distinct = false;
        query.Query.Filters = filterCollection;
        query.Query.Fields = fieldCollection;

        query;
        // PackagePacker: End of Script
    }
}
