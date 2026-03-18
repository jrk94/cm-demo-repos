import Cmf from "cmf-lbos";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
class AgenticControllersWrapper {
    [key: string]: any;

    private AgenticControllers() {
        // PackagePacker: Start of Script
        (async () => {
            const filterCollection: Cmf.Foundation.BusinessObjects.QueryObject.FilterCollection = new Cmf.Foundation.BusinessObjects.QueryObject.FilterCollection();

            // Filter filter_0
            const filter_0: Cmf.Foundation.BusinessObjects.QueryObject.Filter = new Cmf.Foundation.BusinessObjects.QueryObject.Filter();
            filter_0.Name = "Workflow";
            filter_0.ObjectName = "AutomationWorkflow";
            filter_0.ObjectAlias = "AutomationWorkflow_1";
            filter_0.Operator = Cmf.Foundation.Common.FieldOperator.Contains;
            filter_0.Value = "\"aiAgent\"";
            filter_0.LogicalOperator = Cmf.Foundation.Common.LogicalOperator.Nothing;
            filter_0.FilterType = Cmf.Foundation.BusinessObjects.QueryObject.Enums.FilterType.Normal;

            filterCollection.push(filter_0);

            const fieldCollection: Cmf.Foundation.BusinessObjects.QueryObject.FieldCollection = new Cmf.Foundation.BusinessObjects.QueryObject.FieldCollection();

            // Field field_0
            const field_0: Cmf.Foundation.BusinessObjects.QueryObject.Field = new Cmf.Foundation.BusinessObjects.QueryObject.Field();
            field_0.Alias = "Id";
            field_0.ObjectName = "AutomationWorkflow";
            field_0.ObjectAlias = "AutomationWorkflow_1";
            field_0.IsUserAttribute = false;
            field_0.Name = "Id";
            field_0.Position = 0;
            field_0.Sort = Cmf.Foundation.Common.FieldSort.NoSort;

            // Field field_1
            const field_1: Cmf.Foundation.BusinessObjects.QueryObject.Field = new Cmf.Foundation.BusinessObjects.QueryObject.Field();
            field_1.Alias = "Name";
            field_1.ObjectName = "AutomationWorkflow";
            field_1.ObjectAlias = "AutomationWorkflow_1";
            field_1.IsUserAttribute = false;
            field_1.Name = "Name";
            field_1.Position = 1;
            field_1.Sort = Cmf.Foundation.Common.FieldSort.NoSort;

            // Field field_2
            const field_2: Cmf.Foundation.BusinessObjects.QueryObject.Field = new Cmf.Foundation.BusinessObjects.QueryObject.Field();
            field_2.Alias = "AutomationControllerId";
            field_2.ObjectName = "AutomationController";
            field_2.ObjectAlias = "AutomationWorkflow_AutomationController_2";
            field_2.IsUserAttribute = false;
            field_2.Name = "Id";
            field_2.Position = 2;
            field_2.Sort = Cmf.Foundation.Common.FieldSort.NoSort;

            fieldCollection.push(field_0);
            fieldCollection.push(field_1);
            fieldCollection.push(field_2);


            const relationCollection: Cmf.Foundation.BusinessObjects.QueryObject.RelationCollection = new Cmf.Foundation.BusinessObjects.QueryObject.RelationCollection();

            // Relation relation_0
            const relation_0: Cmf.Foundation.BusinessObjects.QueryObject.Relation = new Cmf.Foundation.BusinessObjects.QueryObject.Relation();
            relation_0.Alias = "";
            relation_0.IsRelation = false;
            relation_0.Name = "";
            relation_0.SourceEntity = "AutomationWorkflow";
            relation_0.SourceEntityAlias = "AutomationWorkflow_1",
                relation_0.SourceJoinType = Cmf.Foundation.BusinessObjects.QueryObject.Enums.JoinType.InnerJoin;
            relation_0.SourceProperty = "AutomationControllerId";
            relation_0.TargetEntity = "AutomationController";
            relation_0.TargetEntityAlias = "AutomationWorkflow_AutomationController_2";
            relation_0.TargetJoinType = Cmf.Foundation.BusinessObjects.QueryObject.Enums.JoinType.InnerJoin;
            relation_0.TargetProperty = "Id";

            relationCollection.push(relation_0);

            const query: Cmf.Foundation.BusinessObjects.QueryObject.QueryObject = new Cmf.Foundation.BusinessObjects.QueryObject.QueryObject();
            query.Description = "";
            query.EntityTypeName = "AutomationWorkflow";
            query.Name = "InstancesToTalkWith";
            query.Query = new Cmf.Foundation.BusinessObjects.QueryObject.Query();
            query.Query.Distinct = false;
            query.Query.Filters = filterCollection;
            query.Query.Fields = fieldCollection;
            query.Query.Relations = relationCollection;

            const executeQueryObject =
                new Cmf.Foundation.BusinessOrchestration.QueryManagement.InputObjects.ExecuteQueryInput();
            executeQueryObject.QueryObject = query;

            const results = (await this.System.call(executeQueryObject))?.NgpDataSet?.T_Result ?? [];

            const distinctResults = new Map<string, any>();
            for (const result of results) {
                distinctResults.set(result.AutomationControllerId, result);
            }

            return [...distinctResults.values()];
        })();
        // PackagePacker: End of Script
    }
}
