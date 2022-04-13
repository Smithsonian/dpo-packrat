---
title: "Ingestion: Common Metadata"
summary: Handling Ingestion Metadata Shared by All Objects
weight: 320
---

All ingested objects share a set of common metadata:
![Packrat Ingestion Common Metadata](/dpo-packrat/images/packrat-ingestion-md-common.png "Packrat Ingestion Common Metadata")
1. Either add an identifier by clicking the Add button, and/or
2. Allow the system to create an identifier by leaving the checkbox selected.
3. Specify parent and/or children objects.

Adding parents or children tells the system how to connect the ingested object to objects which already exist in Packrat. Doing so makes use of the repository browser: 
![Packrat Ingestion Common Related](/dpo-packrat/images/packrat-ingestion-md-common-2.png "Packrat Ingestion Common Related")
1. Select one or more objects
2. If needed, make use of search. Note that when ingesting scenes, search will show you results from the entire repository, allowing the selection of diverse parent models -- more than just from the selected Subject. Otherwise, you will only see objects related to the subjects selected for ingestion.
3. Click the carrot to reveal the repository browser filter, if that assists in selecting the desired object.
4. Click "Save" when you are done.