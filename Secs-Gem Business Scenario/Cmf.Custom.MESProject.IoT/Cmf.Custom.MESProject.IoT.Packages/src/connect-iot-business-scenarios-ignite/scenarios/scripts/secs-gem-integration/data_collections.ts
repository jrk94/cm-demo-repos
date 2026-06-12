import { Cmf } from "cmf-lbos";
import { ScriptScopeBase } from "../types/globals";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
class DataCollectionsWrapper extends ScriptScopeBase {
    [key: string]: any;

    private dataCollections() {
        // PackagePacker: Start of Script

        const filterCollection: Cmf.Foundation.BusinessObjects.QueryObject.FilterCollection = new Cmf.Foundation.BusinessObjects.QueryObject.FilterCollection();

        // Filter filter_0
        const filter_0: Cmf.Foundation.BusinessObjects.QueryObject.Filter = new Cmf.Foundation.BusinessObjects.QueryObject.Filter();
        filter_0.Name = 'UniversalState';
        filter_0.ObjectName = 'DataCollection';
        filter_0.ObjectAlias = 'DataCollection_1';
        filter_0.Operator = Cmf.Foundation.Common.FieldOperator.IsEqualTo;
        filter_0.Value = Cmf.Foundation.Common.Base.UniversalState.Effective;
        filter_0.LogicalOperator = Cmf.Foundation.Common.LogicalOperator.Nothing;
        filter_0.FilterType = Cmf.Foundation.BusinessObjects.QueryObject.Enums.FilterType.Normal;

        filterCollection.push(filter_0);

        const fieldCollection: Cmf.Foundation.BusinessObjects.QueryObject.FieldCollection = new Cmf.Foundation.BusinessObjects.QueryObject.FieldCollection();

        // Field field_0
        const field_0: Cmf.Foundation.BusinessObjects.QueryObject.Field = new Cmf.Foundation.BusinessObjects.QueryObject.Field();
        field_0.Alias = 'Id';
        field_0.ObjectName = 'DataCollection';
        field_0.ObjectAlias = 'DataCollection_1';
        field_0.IsUserAttribute = false;
        field_0.Name = 'Id';
        field_0.Position = 0;
        field_0.Sort = Cmf.Foundation.Common.FieldSort.NoSort;

        // Field field_1
        const field_1: Cmf.Foundation.BusinessObjects.QueryObject.Field = new Cmf.Foundation.BusinessObjects.QueryObject.Field();
        field_1.Alias = 'DefinitionId';
        field_1.ObjectName = 'DataCollection';
        field_1.ObjectAlias = 'DataCollection_1';
        field_1.IsUserAttribute = false;
        field_1.Name = 'DefinitionId';
        field_1.Position = 1;
        field_1.Sort = Cmf.Foundation.Common.FieldSort.NoSort;

        // Field field_2
        const field_2: Cmf.Foundation.BusinessObjects.QueryObject.Field = new Cmf.Foundation.BusinessObjects.QueryObject.Field();
        field_2.Alias = 'Revision';
        field_2.ObjectName = 'DataCollection';
        field_2.ObjectAlias = 'DataCollection_1';
        field_2.IsUserAttribute = false;
        field_2.Name = 'Revision';
        field_2.Position = 2;
        field_2.Sort = Cmf.Foundation.Common.FieldSort.NoSort;

        // Field field_3
        const field_3: Cmf.Foundation.BusinessObjects.QueryObject.Field = new Cmf.Foundation.BusinessObjects.QueryObject.Field();
        field_3.Alias = 'Name';
        field_3.ObjectName = 'DataCollection';
        field_3.ObjectAlias = 'DataCollection_1';
        field_3.IsUserAttribute = false;
        field_3.Name = 'Name';
        field_3.Position = 3;
        field_3.Sort = Cmf.Foundation.Common.FieldSort.NoSort;

        fieldCollection.push(field_0);
        fieldCollection.push(field_1);
        fieldCollection.push(field_2);
        fieldCollection.push(field_3);


        const query: Cmf.Foundation.BusinessObjects.QueryObject.QueryObject = new Cmf.Foundation.BusinessObjects.QueryObject.QueryObject();
        query.Description = '';
        query.EntityTypeName = 'DataCollection';
        query.Name = 'GetAllEffectiveDataCollections';
        query.Query = new Cmf.Foundation.BusinessObjects.QueryObject.Query();
        query.Query.Distinct = false;
        query.Query.Filters = filterCollection;
        query.Query.Fields = fieldCollection;

        query;
        // PackagePacker: End of Script
    }
}