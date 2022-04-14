---
title: "Ingestion, Step 3: Common Metadata"
summary: Handling Ingestion Metadata Shared by All Objects
weight: 320
---

### Common Metadata
All ingested objects share a set of common metadata:
- Identifier(s): every object needs at least one primary identifier, such as a ARK ID or EDAN Record ID. It may be system generated.
- Parents: during ingestion, we can specify any additional parent objects other than the Media Group already selected in [Ingestion, Step 2: Subject & Media Group](../ingestion-subject). For most object types, this is optional, but Scenes require one or more Models as parents. Models often have Capture Data as parents, and sometimes other Models. This parent-child relationship represents the relationship of source data (e.g. Capture Data) to derived data (e.g. Model).
- Children: during ingestion, we can also specify any children objects (i.e. for each such child, we are ingesting **their** parent).

### Adding Identifiers
[![Packrat Ingestion Common Metadata](/dpo-packrat/images/packrat-ingestion-md-common.png "Packrat Ingestion Common Metadata")](/dpo-packrat/images/packrat-ingestion-md-common.png)
1. Either add an identifier by clicking the "Add" button, and/or
2. Allow the system to create an identifier by leaving the checkbox selected.

### Adding Parents and Children
Click the "Add" button under either "Parents" or "Children" (#3 in the picture above). This tells the system how to connect the ingested object to objects which already exist in Packrat. Doing so makes use of the repository browser: 
[![Packrat Ingestion Common Related](/dpo-packrat/images/packrat-ingestion-md-common-2.png "Packrat Ingestion Common Related")](/dpo-packrat/images/packrat-ingestion-md-common-2.png)
1. Select one or more objects
2. If needed, make use of search. Note that when ingesting **Scenes**, search will show you results from the entire repository, allowing the selection of diverse parent Models -- more than just from the selected Subject. **Otherwise**, you will only see objects related to the **Subjects** selected for ingestion.
3. Click the carrot (![Packrat Carrot Down Icon](/dpo-packrat/images/packrat-repocarrotdown.png "Packrat Carrot Down Icon")) icon to reveal the repository browser filter, if that assists in selecting the desired object.
4. Click "Save" when you are done.