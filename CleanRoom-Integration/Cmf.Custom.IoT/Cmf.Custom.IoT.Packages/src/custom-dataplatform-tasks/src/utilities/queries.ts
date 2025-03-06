import { System } from "@criticalmanufacturing/connect-iot-controller-engine";
import Cmf from "cmf-lbos";
import QueryObject = System.LBOS.Cmf.Foundation.BusinessObjects.QueryObject;

export class Queries {
    static GetIsa95QueryFromResource(resourceName: string): QueryObject.QueryObject {
        const filterCollection: Cmf.Foundation.BusinessObjects.QueryObject.FilterCollection = new Cmf.Foundation.BusinessObjects.QueryObject.FilterCollection();

        // Filter filter_0
        const filter_0: Cmf.Foundation.BusinessObjects.QueryObject.Filter = new Cmf.Foundation.BusinessObjects.QueryObject.Filter();
        filter_0.Name = "Name";
        filter_0.ObjectName = "Resource";
        filter_0.ObjectAlias = "Resource_1";
        filter_0.Operator = Cmf.Foundation.Common.FieldOperator.IsEqualTo;
        filter_0.Value = resourceName;
        filter_0.LogicalOperator = Cmf.Foundation.Common.LogicalOperator.Nothing;
        filter_0.FilterType = Cmf.Foundation.BusinessObjects.QueryObject.Enums.FilterType.Normal;

        // Filter filter_1
        const filter_1: Cmf.Foundation.BusinessObjects.QueryObject.Filter = new Cmf.Foundation.BusinessObjects.QueryObject.Filter();
        filter_1.ObjectName = "Area";
        filter_1.ObjectAlias = "Resource_Area_2";
        filter_1.Value = null;
        filter_1.LogicalOperator = Cmf.Foundation.Common.LogicalOperator.AND;
        filter_1.FilterType = Cmf.Foundation.BusinessObjects.QueryObject.Enums.FilterType.AlwaysTrue;

        // Filter filter_2
        const filter_2: Cmf.Foundation.BusinessObjects.QueryObject.Filter = new Cmf.Foundation.BusinessObjects.QueryObject.Filter();
        filter_2.ObjectName = "Area";
        filter_2.ObjectAlias = "Resource_Area_2";
        filter_2.Value = null;
        filter_2.LogicalOperator = Cmf.Foundation.Common.LogicalOperator.AND;
        filter_2.FilterType = Cmf.Foundation.BusinessObjects.QueryObject.Enums.FilterType.AlwaysTrue;

        // Filter filter_3
        const filter_3: Cmf.Foundation.BusinessObjects.QueryObject.Filter = new Cmf.Foundation.BusinessObjects.QueryObject.Filter();
        filter_3.ObjectName = "Area";
        filter_3.ObjectAlias = "Resource_Area_2";
        filter_3.Value = null;
        filter_3.LogicalOperator = Cmf.Foundation.Common.LogicalOperator.AND;
        filter_3.FilterType = Cmf.Foundation.BusinessObjects.QueryObject.Enums.FilterType.AlwaysTrue;

        // Filter filter_4
        const filter_4: Cmf.Foundation.BusinessObjects.QueryObject.Filter = new Cmf.Foundation.BusinessObjects.QueryObject.Filter();
        filter_4.ObjectName = "Facility";
        filter_4.ObjectAlias = "Resource_Area_Facility_3";
        filter_4.Value = null;
        filter_4.LogicalOperator = Cmf.Foundation.Common.LogicalOperator.AND;
        filter_4.FilterType = Cmf.Foundation.BusinessObjects.QueryObject.Enums.FilterType.AlwaysTrue;

        // Filter filter_5
        const filter_5: Cmf.Foundation.BusinessObjects.QueryObject.Filter = new Cmf.Foundation.BusinessObjects.QueryObject.Filter();
        filter_5.ObjectName = "Area";
        filter_5.ObjectAlias = "Resource_Area_2";
        filter_5.Value = null;
        filter_5.LogicalOperator = Cmf.Foundation.Common.LogicalOperator.AND;
        filter_5.FilterType = Cmf.Foundation.BusinessObjects.QueryObject.Enums.FilterType.AlwaysTrue;

        // Filter filter_6
        const filter_6: Cmf.Foundation.BusinessObjects.QueryObject.Filter = new Cmf.Foundation.BusinessObjects.QueryObject.Filter();
        filter_6.ObjectName = "Facility";
        filter_6.ObjectAlias = "Resource_Area_Facility_3";
        filter_6.Value = null;
        filter_6.LogicalOperator = Cmf.Foundation.Common.LogicalOperator.AND;
        filter_6.FilterType = Cmf.Foundation.BusinessObjects.QueryObject.Enums.FilterType.AlwaysTrue;

        // Filter filter_7
        const filter_7: Cmf.Foundation.BusinessObjects.QueryObject.Filter = new Cmf.Foundation.BusinessObjects.QueryObject.Filter();
        filter_7.ObjectName = "Area";
        filter_7.ObjectAlias = "Resource_Area_2";
        filter_7.Value = null;
        filter_7.LogicalOperator = Cmf.Foundation.Common.LogicalOperator.AND;
        filter_7.FilterType = Cmf.Foundation.BusinessObjects.QueryObject.Enums.FilterType.AlwaysTrue;

        // Filter filter_8
        const filter_8: Cmf.Foundation.BusinessObjects.QueryObject.Filter = new Cmf.Foundation.BusinessObjects.QueryObject.Filter();
        filter_8.ObjectName = "Facility";
        filter_8.ObjectAlias = "Resource_Area_Facility_3";
        filter_8.Value = null;
        filter_8.LogicalOperator = Cmf.Foundation.Common.LogicalOperator.AND;
        filter_8.FilterType = Cmf.Foundation.BusinessObjects.QueryObject.Enums.FilterType.AlwaysTrue;

        // Filter filter_9
        const filter_9: Cmf.Foundation.BusinessObjects.QueryObject.Filter = new Cmf.Foundation.BusinessObjects.QueryObject.Filter();
        filter_9.ObjectName = "Site";
        filter_9.ObjectAlias = "Resource_Area_Facility_Site_4";
        filter_9.Value = null;
        filter_9.LogicalOperator = Cmf.Foundation.Common.LogicalOperator.AND;
        filter_9.FilterType = Cmf.Foundation.BusinessObjects.QueryObject.Enums.FilterType.AlwaysTrue;

        // Filter filter_10
        const filter_10: Cmf.Foundation.BusinessObjects.QueryObject.Filter = new Cmf.Foundation.BusinessObjects.QueryObject.Filter();
        filter_10.ObjectName = "Area";
        filter_10.ObjectAlias = "Resource_Area_2";
        filter_10.Value = null;
        filter_10.LogicalOperator = Cmf.Foundation.Common.LogicalOperator.AND;
        filter_10.FilterType = Cmf.Foundation.BusinessObjects.QueryObject.Enums.FilterType.AlwaysTrue;

        // Filter filter_11
        const filter_11: Cmf.Foundation.BusinessObjects.QueryObject.Filter = new Cmf.Foundation.BusinessObjects.QueryObject.Filter();
        filter_11.ObjectName = "Facility";
        filter_11.ObjectAlias = "Resource_Area_Facility_3";
        filter_11.Value = null;
        filter_11.LogicalOperator = Cmf.Foundation.Common.LogicalOperator.AND;
        filter_11.FilterType = Cmf.Foundation.BusinessObjects.QueryObject.Enums.FilterType.AlwaysTrue;

        // Filter filter_12
        const filter_12: Cmf.Foundation.BusinessObjects.QueryObject.Filter = new Cmf.Foundation.BusinessObjects.QueryObject.Filter();
        filter_12.ObjectName = "Site";
        filter_12.ObjectAlias = "Resource_Area_Facility_Site_4";
        filter_12.Value = null;
        filter_12.LogicalOperator = Cmf.Foundation.Common.LogicalOperator.AND;
        filter_12.FilterType = Cmf.Foundation.BusinessObjects.QueryObject.Enums.FilterType.AlwaysTrue;

        filterCollection.push(filter_0);
        filterCollection.push(filter_1);
        filterCollection.push(filter_2);
        filterCollection.push(filter_3);
        filterCollection.push(filter_4);
        filterCollection.push(filter_5);
        filterCollection.push(filter_6);
        filterCollection.push(filter_7);
        filterCollection.push(filter_8);
        filterCollection.push(filter_9);
        filterCollection.push(filter_10);
        filterCollection.push(filter_11);
        filterCollection.push(filter_12);

        const fieldCollection: Cmf.Foundation.BusinessObjects.QueryObject.FieldCollection = new Cmf.Foundation.BusinessObjects.QueryObject.FieldCollection();

        // Field field_resource
        const field_resource: Cmf.Foundation.BusinessObjects.QueryObject.Field = new Cmf.Foundation.BusinessObjects.QueryObject.Field();
        field_resource.Alias = "Resource";
        field_resource.ObjectName = "Resource";
        field_resource.ObjectAlias = "Resource_1";
        field_resource.IsUserAttribute = false;
        field_resource.Name = "Name";
        field_resource.Position = 1;
        field_resource.Sort = Cmf.Foundation.Common.FieldSort.NoSort;

        // Field field_3
        const field_3: Cmf.Foundation.BusinessObjects.QueryObject.Field = new Cmf.Foundation.BusinessObjects.QueryObject.Field();
        field_3.Alias = "Area";
        field_3.ObjectName = "Area";
        field_3.ObjectAlias = "Resource_Area_2";
        field_3.IsUserAttribute = false;
        field_3.Name = "Name";
        field_3.Position = 2;
        field_3.Sort = Cmf.Foundation.Common.FieldSort.NoSort;

        // Field field_facility
        const field_facility: Cmf.Foundation.BusinessObjects.QueryObject.Field = new Cmf.Foundation.BusinessObjects.QueryObject.Field();
        field_facility.Alias = "Facility";
        field_facility.ObjectName = "Facility";
        field_facility.ObjectAlias = "Resource_Area_Facility_3";
        field_facility.IsUserAttribute = false;
        field_facility.Name = "Name";
        field_facility.Position = 3;
        field_facility.Sort = Cmf.Foundation.Common.FieldSort.NoSort;

        // Field field_site
        const field_site: Cmf.Foundation.BusinessObjects.QueryObject.Field = new Cmf.Foundation.BusinessObjects.QueryObject.Field();
        field_site.Alias = "Site";
        field_site.ObjectName = "Site";
        field_site.ObjectAlias = "Resource_Area_Facility_Site_4";
        field_site.IsUserAttribute = false;
        field_site.Name = "Name";
        field_site.Position = 4;
        field_site.Sort = Cmf.Foundation.Common.FieldSort.NoSort;

        // Field field_enterprise
        const field_enterprise: Cmf.Foundation.BusinessObjects.QueryObject.Field = new Cmf.Foundation.BusinessObjects.QueryObject.Field();
        field_enterprise.Alias = "Enterprise";
        field_enterprise.ObjectName = "Enterprise";
        field_enterprise.ObjectAlias = "Resource_Area_Facility_Site_Enterprise_5";
        field_enterprise.IsUserAttribute = false;
        field_enterprise.Name = "Name";
        field_enterprise.Position = 5;
        field_enterprise.Sort = Cmf.Foundation.Common.FieldSort.NoSort;

        fieldCollection.push(field_resource);
        fieldCollection.push(field_facility);
        fieldCollection.push(field_site);
        fieldCollection.push(field_enterprise);

        const relationCollection: Cmf.Foundation.BusinessObjects.QueryObject.RelationCollection = new Cmf.Foundation.BusinessObjects.QueryObject.RelationCollection();

        // Relation relation_0
        const relation_0: Cmf.Foundation.BusinessObjects.QueryObject.Relation = new Cmf.Foundation.BusinessObjects.QueryObject.Relation();
        relation_0.Alias = "";
        relation_0.IsRelation = false;
        relation_0.Name = "";
        relation_0.SourceEntity = "Resource";
        relation_0.SourceEntityAlias = "Resource_1",
            relation_0.SourceJoinType = Cmf.Foundation.BusinessObjects.QueryObject.Enums.JoinType.InnerJoin;
        relation_0.SourceProperty = "AreaId";
        relation_0.TargetEntity = "Area";
        relation_0.TargetEntityAlias = "Resource_Area_2";
        relation_0.TargetJoinType = Cmf.Foundation.BusinessObjects.QueryObject.Enums.JoinType.InnerJoin;
        relation_0.TargetProperty = "Id";

        // Relation relation_1
        const relation_1: Cmf.Foundation.BusinessObjects.QueryObject.Relation = new Cmf.Foundation.BusinessObjects.QueryObject.Relation();
        relation_1.Alias = "";
        relation_1.IsRelation = false;
        relation_1.Name = "";
        relation_1.SourceEntity = "Area";
        relation_1.SourceEntityAlias = "Resource_Area_2",
            relation_1.SourceJoinType = Cmf.Foundation.BusinessObjects.QueryObject.Enums.JoinType.LeftJoin;
        relation_1.SourceProperty = "FacilityId";
        relation_1.TargetEntity = "Facility";
        relation_1.TargetEntityAlias = "Resource_Area_Facility_3";
        relation_1.TargetJoinType = Cmf.Foundation.BusinessObjects.QueryObject.Enums.JoinType.InnerJoin;
        relation_1.TargetProperty = "Id";

        // Relation relation_2
        const relation_2: Cmf.Foundation.BusinessObjects.QueryObject.Relation = new Cmf.Foundation.BusinessObjects.QueryObject.Relation();
        relation_2.Alias = "";
        relation_2.IsRelation = false;
        relation_2.Name = "";
        relation_2.SourceEntity = "Facility";
        relation_2.SourceEntityAlias = "Resource_Area_Facility_3",
            relation_2.SourceJoinType = Cmf.Foundation.BusinessObjects.QueryObject.Enums.JoinType.LeftJoin;
        relation_2.SourceProperty = "SiteId";
        relation_2.TargetEntity = "Site";
        relation_2.TargetEntityAlias = "Resource_Area_Facility_Site_4";
        relation_2.TargetJoinType = Cmf.Foundation.BusinessObjects.QueryObject.Enums.JoinType.InnerJoin;
        relation_2.TargetProperty = "Id";

        // Relation relation_3
        const relation_3: Cmf.Foundation.BusinessObjects.QueryObject.Relation = new Cmf.Foundation.BusinessObjects.QueryObject.Relation();
        relation_3.Alias = "";
        relation_3.IsRelation = false;
        relation_3.Name = "";
        relation_3.SourceEntity = "Site";
        relation_3.SourceEntityAlias = "Resource_Area_Facility_Site_4",
            relation_3.SourceJoinType = Cmf.Foundation.BusinessObjects.QueryObject.Enums.JoinType.LeftJoin;
        relation_3.SourceProperty = "EnterpriseId";
        relation_3.TargetEntity = "Enterprise";
        relation_3.TargetEntityAlias = "Resource_Area_Facility_Site_Enterprise_5";
        relation_3.TargetJoinType = Cmf.Foundation.BusinessObjects.QueryObject.Enums.JoinType.InnerJoin;
        relation_3.TargetProperty = "Id";

        relationCollection.push(relation_0);
        relationCollection.push(relation_1);
        relationCollection.push(relation_2);
        relationCollection.push(relation_3);

        const query: Cmf.Foundation.BusinessObjects.QueryObject.QueryObject = new Cmf.Foundation.BusinessObjects.QueryObject.QueryObject();
        query.Description = "";
        query.EntityTypeName = "Resource";
        query.Name = "GetIsa95FromResource";
        query.Query = new Cmf.Foundation.BusinessObjects.QueryObject.Query();
        query.Query.Distinct = false;
        query.Query.Filters = filterCollection;
        query.Query.Fields = fieldCollection;
        query.Query.Relations = relationCollection;
        query.Query.Top = 1;

        return query;
    }

    static GetIsa95QueryFromArea(areaName: string): QueryObject.QueryObject {
        const filterCollection: Cmf.Foundation.BusinessObjects.QueryObject.FilterCollection = new Cmf.Foundation.BusinessObjects.QueryObject.FilterCollection();

        // Filter filter_0
        const filter_0: Cmf.Foundation.BusinessObjects.QueryObject.Filter = new Cmf.Foundation.BusinessObjects.QueryObject.Filter();
        filter_0.Name = "Name";
        filter_0.ObjectName = "Area";
        filter_0.ObjectAlias = "Area_1";
        filter_0.Operator = Cmf.Foundation.Common.FieldOperator.IsEqualTo;
        filter_0.Value = areaName;
        filter_0.LogicalOperator = Cmf.Foundation.Common.LogicalOperator.Nothing;
        filter_0.FilterType = Cmf.Foundation.BusinessObjects.QueryObject.Enums.FilterType.Normal;

        // Filter filter_1
        const filter_1: Cmf.Foundation.BusinessObjects.QueryObject.Filter = new Cmf.Foundation.BusinessObjects.QueryObject.Filter();
        filter_1.ObjectName = "Facility";
        filter_1.ObjectAlias = "Area_Facility_2";
        filter_1.Value = null;
        filter_1.LogicalOperator = Cmf.Foundation.Common.LogicalOperator.AND;
        filter_1.FilterType = Cmf.Foundation.BusinessObjects.QueryObject.Enums.FilterType.AlwaysTrue;

        // Filter filter_2
        const filter_2: Cmf.Foundation.BusinessObjects.QueryObject.Filter = new Cmf.Foundation.BusinessObjects.QueryObject.Filter();
        filter_2.ObjectName = "Facility";
        filter_2.ObjectAlias = "Area_Facility_2";
        filter_2.Value = null;
        filter_2.LogicalOperator = Cmf.Foundation.Common.LogicalOperator.AND;
        filter_2.FilterType = Cmf.Foundation.BusinessObjects.QueryObject.Enums.FilterType.AlwaysTrue;

        // Filter filter_3
        const filter_3: Cmf.Foundation.BusinessObjects.QueryObject.Filter = new Cmf.Foundation.BusinessObjects.QueryObject.Filter();
        filter_3.ObjectName = "Facility";
        filter_3.ObjectAlias = "Area_Facility_2";
        filter_3.Value = null;
        filter_3.LogicalOperator = Cmf.Foundation.Common.LogicalOperator.AND;
        filter_3.FilterType = Cmf.Foundation.BusinessObjects.QueryObject.Enums.FilterType.AlwaysTrue;

        // Filter filter_4
        const filter_4: Cmf.Foundation.BusinessObjects.QueryObject.Filter = new Cmf.Foundation.BusinessObjects.QueryObject.Filter();
        filter_4.ObjectName = "Site";
        filter_4.ObjectAlias = "Area_Facility_Site_3";
        filter_4.Value = null;
        filter_4.LogicalOperator = Cmf.Foundation.Common.LogicalOperator.AND;
        filter_4.FilterType = Cmf.Foundation.BusinessObjects.QueryObject.Enums.FilterType.AlwaysTrue;

        // Filter filter_5
        const filter_5: Cmf.Foundation.BusinessObjects.QueryObject.Filter = new Cmf.Foundation.BusinessObjects.QueryObject.Filter();
        filter_5.ObjectName = "Facility";
        filter_5.ObjectAlias = "Area_Facility_2";
        filter_5.Value = null;
        filter_5.LogicalOperator = Cmf.Foundation.Common.LogicalOperator.AND;
        filter_5.FilterType = Cmf.Foundation.BusinessObjects.QueryObject.Enums.FilterType.AlwaysTrue;

        // Filter filter_6
        const filter_6: Cmf.Foundation.BusinessObjects.QueryObject.Filter = new Cmf.Foundation.BusinessObjects.QueryObject.Filter();
        filter_6.ObjectName = "Site";
        filter_6.ObjectAlias = "Area_Facility_Site_3";
        filter_6.Value = null;
        filter_6.LogicalOperator = Cmf.Foundation.Common.LogicalOperator.AND;
        filter_6.FilterType = Cmf.Foundation.BusinessObjects.QueryObject.Enums.FilterType.AlwaysTrue;

        filterCollection.push(filter_0);
        filterCollection.push(filter_1);
        filterCollection.push(filter_2);
        filterCollection.push(filter_3);
        filterCollection.push(filter_4);
        filterCollection.push(filter_5);
        filterCollection.push(filter_6);

        const fieldCollection: Cmf.Foundation.BusinessObjects.QueryObject.FieldCollection = new Cmf.Foundation.BusinessObjects.QueryObject.FieldCollection();

        // Field field_area
        const field_area: Cmf.Foundation.BusinessObjects.QueryObject.Field = new Cmf.Foundation.BusinessObjects.QueryObject.Field();
        field_area.Alias = "Area";
        field_area.ObjectName = "Area";
        field_area.ObjectAlias = "Area_1";
        field_area.IsUserAttribute = false;
        field_area.Name = "Name";
        field_area.Position = 0;
        field_area.Sort = Cmf.Foundation.Common.FieldSort.NoSort;

        // Field field_facility
        const field_facility: Cmf.Foundation.BusinessObjects.QueryObject.Field = new Cmf.Foundation.BusinessObjects.QueryObject.Field();
        field_facility.Alias = "Facility";
        field_facility.ObjectName = "Facility";
        field_facility.ObjectAlias = "Area_Facility_2";
        field_facility.IsUserAttribute = false;
        field_facility.Name = "Name";
        field_facility.Position = 5;
        field_facility.Sort = Cmf.Foundation.Common.FieldSort.NoSort;

        // Field field_site
        const field_site: Cmf.Foundation.BusinessObjects.QueryObject.Field = new Cmf.Foundation.BusinessObjects.QueryObject.Field();
        field_site.Alias = "Site";
        field_site.ObjectName = "Site";
        field_site.ObjectAlias = "Area_Facility_Site_3";
        field_site.IsUserAttribute = false;
        field_site.Name = "Name";
        field_site.Position = 6;
        field_site.Sort = Cmf.Foundation.Common.FieldSort.NoSort;

        // Field field_enterprise
        const field_enterprise: Cmf.Foundation.BusinessObjects.QueryObject.Field = new Cmf.Foundation.BusinessObjects.QueryObject.Field();
        field_enterprise.Alias = "Enterprise";
        field_enterprise.ObjectName = "Enterprise";
        field_enterprise.ObjectAlias = "Area_Facility_Site_Enterprise_4";
        field_enterprise.IsUserAttribute = false;
        field_enterprise.Name = "Name";
        field_enterprise.Position = 7;
        field_enterprise.Sort = Cmf.Foundation.Common.FieldSort.NoSort;

        fieldCollection.push(field_area);
        fieldCollection.push(field_facility);
        fieldCollection.push(field_site);
        fieldCollection.push(field_enterprise);

        const relationCollection: Cmf.Foundation.BusinessObjects.QueryObject.RelationCollection = new Cmf.Foundation.BusinessObjects.QueryObject.RelationCollection();

        // Relation relation_0
        const relation_0: Cmf.Foundation.BusinessObjects.QueryObject.Relation = new Cmf.Foundation.BusinessObjects.QueryObject.Relation();
        relation_0.Alias = "";
        relation_0.IsRelation = false;
        relation_0.Name = "";
        relation_0.SourceEntity = "Area";
        relation_0.SourceEntityAlias = "Area_1",
            relation_0.SourceJoinType = Cmf.Foundation.BusinessObjects.QueryObject.Enums.JoinType.LeftJoin;
        relation_0.SourceProperty = "FacilityId";
        relation_0.TargetEntity = "Facility";
        relation_0.TargetEntityAlias = "Area_Facility_2";
        relation_0.TargetJoinType = Cmf.Foundation.BusinessObjects.QueryObject.Enums.JoinType.InnerJoin;
        relation_0.TargetProperty = "Id";

        // Relation relation_1
        const relation_1: Cmf.Foundation.BusinessObjects.QueryObject.Relation = new Cmf.Foundation.BusinessObjects.QueryObject.Relation();
        relation_1.Alias = "";
        relation_1.IsRelation = false;
        relation_1.Name = "";
        relation_1.SourceEntity = "Facility";
        relation_1.SourceEntityAlias = "Area_Facility_2",
            relation_1.SourceJoinType = Cmf.Foundation.BusinessObjects.QueryObject.Enums.JoinType.LeftJoin;
        relation_1.SourceProperty = "SiteId";
        relation_1.TargetEntity = "Site";
        relation_1.TargetEntityAlias = "Area_Facility_Site_3";
        relation_1.TargetJoinType = Cmf.Foundation.BusinessObjects.QueryObject.Enums.JoinType.InnerJoin;
        relation_1.TargetProperty = "Id";

        // Relation relation_2
        const relation_2: Cmf.Foundation.BusinessObjects.QueryObject.Relation = new Cmf.Foundation.BusinessObjects.QueryObject.Relation();
        relation_2.Alias = "";
        relation_2.IsRelation = false;
        relation_2.Name = "";
        relation_2.SourceEntity = "Site";
        relation_2.SourceEntityAlias = "Area_Facility_Site_3",
            relation_2.SourceJoinType = Cmf.Foundation.BusinessObjects.QueryObject.Enums.JoinType.InnerJoin;
        relation_2.SourceProperty = "EnterpriseId";
        relation_2.TargetEntity = "Enterprise";
        relation_2.TargetEntityAlias = "Area_Facility_Site_Enterprise_4";
        relation_2.TargetJoinType = Cmf.Foundation.BusinessObjects.QueryObject.Enums.JoinType.InnerJoin;
        relation_2.TargetProperty = "Id";

        relationCollection.push(relation_0);
        relationCollection.push(relation_1);
        relationCollection.push(relation_2);

        const query: Cmf.Foundation.BusinessObjects.QueryObject.QueryObject = new Cmf.Foundation.BusinessObjects.QueryObject.QueryObject();
        query.Description = "";
        query.EntityTypeName = "Area";
        query.Name = "GetIsa95FromArea";
        query.Query = new Cmf.Foundation.BusinessObjects.QueryObject.Query();
        query.Query.Distinct = false;
        query.Query.Filters = filterCollection;
        query.Query.Fields = fieldCollection;
        query.Query.Relations = relationCollection;
        query.Query.Top = 1;

        return query;
    }

    static GetIsa95QueryFromFacility(facilityName: string): QueryObject.QueryObject {
        const filterCollection: Cmf.Foundation.BusinessObjects.QueryObject.FilterCollection = new Cmf.Foundation.BusinessObjects.QueryObject.FilterCollection();

        // Filter filter_0
        const filter_0: Cmf.Foundation.BusinessObjects.QueryObject.Filter = new Cmf.Foundation.BusinessObjects.QueryObject.Filter();
        filter_0.Name = "Name";
        filter_0.ObjectName = "Facility";
        filter_0.ObjectAlias = "Facility_1";
        filter_0.Operator = Cmf.Foundation.Common.FieldOperator.IsEqualTo;
        filter_0.Value = facilityName;
        filter_0.LogicalOperator = Cmf.Foundation.Common.LogicalOperator.Nothing;
        filter_0.FilterType = Cmf.Foundation.BusinessObjects.QueryObject.Enums.FilterType.Normal;

        // Filter filter_1
        const filter_1: Cmf.Foundation.BusinessObjects.QueryObject.Filter = new Cmf.Foundation.BusinessObjects.QueryObject.Filter();
        filter_1.ObjectName = "Site";
        filter_1.ObjectAlias = "Facility_Site_2";
        filter_1.Value = null;
        filter_1.LogicalOperator = Cmf.Foundation.Common.LogicalOperator.AND;
        filter_1.FilterType = Cmf.Foundation.BusinessObjects.QueryObject.Enums.FilterType.AlwaysTrue;

        filterCollection.push(filter_0);
        filterCollection.push(filter_1);

        const fieldCollection: Cmf.Foundation.BusinessObjects.QueryObject.FieldCollection = new Cmf.Foundation.BusinessObjects.QueryObject.FieldCollection();

        // Field field_0
        const field_0: Cmf.Foundation.BusinessObjects.QueryObject.Field = new Cmf.Foundation.BusinessObjects.QueryObject.Field();
        field_0.Alias = "Facility";
        field_0.ObjectName = "Facility";
        field_0.ObjectAlias = "Facility_1";
        field_0.IsUserAttribute = false;
        field_0.Name = "Name";
        field_0.Position = 0;
        field_0.Sort = Cmf.Foundation.Common.FieldSort.NoSort;

        // Field field_1
        const field_1: Cmf.Foundation.BusinessObjects.QueryObject.Field = new Cmf.Foundation.BusinessObjects.QueryObject.Field();
        field_1.Alias = "Site";
        field_1.ObjectName = "Site";
        field_1.ObjectAlias = "Facility_Site_2";
        field_1.IsUserAttribute = false;
        field_1.Name = "Name";
        field_1.Position = 1;
        field_1.Sort = Cmf.Foundation.Common.FieldSort.NoSort;

        // Field field_2
        const field_2: Cmf.Foundation.BusinessObjects.QueryObject.Field = new Cmf.Foundation.BusinessObjects.QueryObject.Field();
        field_2.Alias = "Enterprise";
        field_2.ObjectName = "Enterprise";
        field_2.ObjectAlias = "Facility_Site_Enterprise_3";
        field_2.IsUserAttribute = false;
        field_2.Name = "Name";
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
        relation_0.SourceEntity = "Facility";
        relation_0.SourceEntityAlias = "Facility_1",
            relation_0.SourceJoinType = Cmf.Foundation.BusinessObjects.QueryObject.Enums.JoinType.InnerJoin;
        relation_0.SourceProperty = "SiteId";
        relation_0.TargetEntity = "Site";
        relation_0.TargetEntityAlias = "Facility_Site_2";
        relation_0.TargetJoinType = Cmf.Foundation.BusinessObjects.QueryObject.Enums.JoinType.InnerJoin;
        relation_0.TargetProperty = "Id";

        // Relation relation_1
        const relation_1: Cmf.Foundation.BusinessObjects.QueryObject.Relation = new Cmf.Foundation.BusinessObjects.QueryObject.Relation();
        relation_1.Alias = "";
        relation_1.IsRelation = false;
        relation_1.Name = "";
        relation_1.SourceEntity = "Site";
        relation_1.SourceEntityAlias = "Facility_Site_2",
            relation_1.SourceJoinType = Cmf.Foundation.BusinessObjects.QueryObject.Enums.JoinType.InnerJoin;
        relation_1.SourceProperty = "EnterpriseId";
        relation_1.TargetEntity = "Enterprise";
        relation_1.TargetEntityAlias = "Facility_Site_Enterprise_3";
        relation_1.TargetJoinType = Cmf.Foundation.BusinessObjects.QueryObject.Enums.JoinType.InnerJoin;
        relation_1.TargetProperty = "Id";

        relationCollection.push(relation_0);
        relationCollection.push(relation_1);

        const query: Cmf.Foundation.BusinessObjects.QueryObject.QueryObject = new Cmf.Foundation.BusinessObjects.QueryObject.QueryObject();
        query.Description = "";
        query.EntityTypeName = "Facility";
        query.Name = "GetIsa95FromFacility";
        query.Query = new Cmf.Foundation.BusinessObjects.QueryObject.Query();
        query.Query.Distinct = false;
        query.Query.Filters = filterCollection;
        query.Query.Fields = fieldCollection;
        query.Query.Relations = relationCollection;
        query.Query.Top = 1;

        return query;
    }

    static GetIsa95QueryFromSite(siteName: string): QueryObject.QueryObject {
        const filterCollection: Cmf.Foundation.BusinessObjects.QueryObject.FilterCollection = new Cmf.Foundation.BusinessObjects.QueryObject.FilterCollection();

        // Filter filter_0
        const filter_0: Cmf.Foundation.BusinessObjects.QueryObject.Filter = new Cmf.Foundation.BusinessObjects.QueryObject.Filter();
        filter_0.Name = "Name";
        filter_0.ObjectName = "Site";
        filter_0.ObjectAlias = "Site_1";
        filter_0.Operator = Cmf.Foundation.Common.FieldOperator.IsEqualTo;
        filter_0.Value = siteName;
        filter_0.LogicalOperator = Cmf.Foundation.Common.LogicalOperator.Nothing;
        filter_0.FilterType = Cmf.Foundation.BusinessObjects.QueryObject.Enums.FilterType.Normal;

        filterCollection.push(filter_0);

        const fieldCollection: Cmf.Foundation.BusinessObjects.QueryObject.FieldCollection = new Cmf.Foundation.BusinessObjects.QueryObject.FieldCollection();

        // Field field_0
        const field_0: Cmf.Foundation.BusinessObjects.QueryObject.Field = new Cmf.Foundation.BusinessObjects.QueryObject.Field();
        field_0.Alias = "Site";
        field_0.ObjectName = "Site";
        field_0.ObjectAlias = "Site_1";
        field_0.IsUserAttribute = false;
        field_0.Name = "Name";
        field_0.Position = 0;
        field_0.Sort = Cmf.Foundation.Common.FieldSort.NoSort;

        // Field field_1
        const field_1: Cmf.Foundation.BusinessObjects.QueryObject.Field = new Cmf.Foundation.BusinessObjects.QueryObject.Field();
        field_1.Alias = "Enterprise";
        field_1.ObjectName = "Enterprise";
        field_1.ObjectAlias = "Site_Enterprise_2";
        field_1.IsUserAttribute = false;
        field_1.Name = "Name";
        field_1.Position = 1;
        field_1.Sort = Cmf.Foundation.Common.FieldSort.NoSort;

        fieldCollection.push(field_0);
        fieldCollection.push(field_1);

        const relationCollection: Cmf.Foundation.BusinessObjects.QueryObject.RelationCollection = new Cmf.Foundation.BusinessObjects.QueryObject.RelationCollection();

        // Relation relation_0
        const relation_0: Cmf.Foundation.BusinessObjects.QueryObject.Relation = new Cmf.Foundation.BusinessObjects.QueryObject.Relation();
        relation_0.Alias = "";
        relation_0.IsRelation = false;
        relation_0.Name = "";
        relation_0.SourceEntity = "Site";
        relation_0.SourceEntityAlias = "Site_1",
            relation_0.SourceJoinType = Cmf.Foundation.BusinessObjects.QueryObject.Enums.JoinType.InnerJoin;
        relation_0.SourceProperty = "EnterpriseId";
        relation_0.TargetEntity = "Enterprise";
        relation_0.TargetEntityAlias = "Site_Enterprise_2";
        relation_0.TargetJoinType = Cmf.Foundation.BusinessObjects.QueryObject.Enums.JoinType.InnerJoin;
        relation_0.TargetProperty = "Id";

        relationCollection.push(relation_0);

        const query: Cmf.Foundation.BusinessObjects.QueryObject.QueryObject = new Cmf.Foundation.BusinessObjects.QueryObject.QueryObject();
        query.Description = "";
        query.EntityTypeName = "Site";
        query.Name = "GetIsa95FromSite";
        query.Query = new Cmf.Foundation.BusinessObjects.QueryObject.Query();
        query.Query.Distinct = false;
        query.Query.Filters = filterCollection;
        query.Query.Fields = fieldCollection;
        query.Query.Relations = relationCollection;
        query.Query.Top = 1;

        return query;
    }
}


