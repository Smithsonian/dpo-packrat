---
title: "Business Process Management"
summary: Packrat's Workflows
weight: 800
---

In addition to providing a robust data repository and content management system, Packrat provides business process management and automation for common 3D workflows. [Smithsonian Cook](https://github.com/Smithsonian/dpo-cook) is used extensively as our computational engine for 3D tasks.

Visit the "Workflow" page to browse and query the workflows managed by Packrat:
[![Packrat Workflows](/dpo-packrat/images/packrat-workflow.png "Packrat Workflows")](/dpo-packrat/images/packrat-workflow.png)
1. Select "Workflow" from the left navigation.
2. Apply Filters to focus attention on workflows of interest. Click "Search" to apply the selected filters.
3. Individual workflows are gathered into "Sets", allowing for combined reporting for business processes that have multiple steps, such as Upload and Ingestion.
4. A set of reports are available; click on:
    - "R" icon to view the individual workflow's report
    - "S" icon to view the combined workflow set's report
    - "J" icon, when appropriate, to view the workflow job output, typically from Cook
5. Error summaries are displayed in this column, when errors occur

### Download Generation
Packrat makes use of Cook's si-generate-downloads recipe to create versions of Models optimized for download, which are then included with Scene packages that are [published to EDAN](../publishing).

### Other Workflows
Information about additional Packrat workflows will be added here.