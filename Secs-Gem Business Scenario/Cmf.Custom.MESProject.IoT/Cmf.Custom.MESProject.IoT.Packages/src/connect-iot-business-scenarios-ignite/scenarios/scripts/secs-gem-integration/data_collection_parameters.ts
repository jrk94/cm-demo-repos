import { Cmf } from "cmf-lbos";
import { ScriptScopeBase } from "../types/globals";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
class DataCollectionParametersWrapper extends ScriptScopeBase {
    [key: string]: any;

    private dataCollectionParameters() {
        // PackagePacker: Start of Script

        const filterCollection: Cmf.Foundation.BusinessObjects.QueryObject.FilterCollection = new Cmf.Foundation.BusinessObjects.QueryObject.FilterCollection();

        // Filter filter_1
        const filter_1: Cmf.Foundation.BusinessObjects.QueryObject.Filter = new Cmf.Foundation.BusinessObjects.QueryObject.Filter();
        filter_1.Name = 'Name';
        filter_1.ObjectName = 'DataCollection';
        filter_1.ObjectAlias = 'Parameter_DataCollectionParameter_SourceEntity_3';
        filter_1.Operator = Cmf.Foundation.Common.FieldOperator.Contains;
        filter_1.Value = this.answers.currentDataCollection.Name;
        filter_1.LogicalOperator = Cmf.Foundation.Common.LogicalOperator.AND;
        filter_1.FilterType = Cmf.Foundation.BusinessObjects.QueryObject.Enums.FilterType.Normal;

        // Filter filter_2
        const filter_2: Cmf.Foundation.BusinessObjects.QueryObject.Filter = new Cmf.Foundation.BusinessObjects.QueryObject.Filter();
        filter_2.Name = 'UniversalState';
        filter_2.ObjectName = 'DataCollection';
        filter_2.ObjectAlias = 'Parameter_DataCollectionParameter_SourceEntity_3';
        filter_2.Operator = Cmf.Foundation.Common.FieldOperator.IsEqualTo;
        filter_2.Value = Cmf.Foundation.Common.Base.UniversalState.Effective;
        filter_2.LogicalOperator = Cmf.Foundation.Common.LogicalOperator.Nothing;
        filter_2.FilterType = Cmf.Foundation.BusinessObjects.QueryObject.Enums.FilterType.Normal;

        filterCollection.push(filter_1);
        filterCollection.push(filter_2);

        const fieldCollection: Cmf.Foundation.BusinessObjects.QueryObject.FieldCollection = new Cmf.Foundation.BusinessObjects.QueryObject.FieldCollection();

        // Field field_0
        const field_0: Cmf.Foundation.BusinessObjects.QueryObject.Field = new Cmf.Foundation.BusinessObjects.QueryObject.Field();
        field_0.Alias = 'Id';
        field_0.ObjectName = 'Parameter';
        field_0.ObjectAlias = 'Parameter_1';
        field_0.IsUserAttribute = false;
        field_0.Name = 'Id';
        field_0.Position = 0;
        field_0.Sort = Cmf.Foundation.Common.FieldSort.NoSort;

        // Field field_1
        const field_1: Cmf.Foundation.BusinessObjects.QueryObject.Field = new Cmf.Foundation.BusinessObjects.QueryObject.Field();
        field_1.Alias = 'Name';
        field_1.ObjectName = 'Parameter';
        field_1.ObjectAlias = 'Parameter_1';
        field_1.IsUserAttribute = false;
        field_1.Name = 'Name';
        field_1.Position = 1;
        field_1.Sort = Cmf.Foundation.Common.FieldSort.NoSort;

        fieldCollection.push(field_0);
        fieldCollection.push(field_1);

        const relationCollection: Cmf.Foundation.BusinessObjects.QueryObject.RelationCollection = new Cmf.Foundation.BusinessObjects.QueryObject.RelationCollection();

        // Relation relation_0
        const relation_0: Cmf.Foundation.BusinessObjects.QueryObject.Relation = new Cmf.Foundation.BusinessObjects.QueryObject.Relation();
        relation_0.Alias = 'Parameter_DataCollectionParameter_2';
        relation_0.IsRelation = true;
        relation_0.Name = 'DataCollectionParameter';
        relation_0.SourceEntity = 'DataCollection';
        relation_0.SourceEntityAlias = 'Parameter_DataCollectionParameter_SourceEntity_3';
        relation_0.SourceJoinType = Cmf.Foundation.BusinessObjects.QueryObject.Enums.JoinType.InnerJoin;
        relation_0.SourceProperty = 'Id';
        relation_0.TargetEntity = 'Parameter';
        relation_0.TargetEntityAlias = 'Parameter_1';
        relation_0.TargetJoinType = Cmf.Foundation.BusinessObjects.QueryObject.Enums.JoinType.InnerJoin;
        relation_0.TargetProperty = 'Id';

        relationCollection.push(relation_0);

        const query: Cmf.Foundation.BusinessObjects.QueryObject.QueryObject = new Cmf.Foundation.BusinessObjects.QueryObject.QueryObject();
        query.Description = '';
        query.EntityTypeName = 'Parameter';
        query.Name = 'Parameters of DataCollection';
        query.Query = new Cmf.Foundation.BusinessObjects.QueryObject.Query();
        query.Query.Distinct = true;
        query.Query.Filters = filterCollection;
        query.Query.Fields = fieldCollection;
        query.Query.Relations = relationCollection;

        query;
        // PackagePacker: End of Script
    }
}