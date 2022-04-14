---
title: "Repository Browsing"
summary: Browsing the Packrat Repository
weight: 200
---

### Repository Organization
The Packrat repository is arranged into a tree of objects representing core organizational concepts used by the Smithsonian to group our 3D assets and other content. These object types are listed below and are represented by an icon in the Packrat repository tree:
- ![Packrat Unit Icon](/dpo-packrat/images/packrat-repounit.png "Packrat Unit Icon") Unit: An organizational group that owns or has responsibility for a physical Subject (below) or maintains the authoritative metadata record for a Subject
- ![Packrat Project Icon](/dpo-packrat/images/packrat-repoproject.png "Packrat Project Icon") Project: A group of work representing a digitization initiative; each Media Group (below) belongs to a Project
- ![Packrat Subject Icon](/dpo-packrat/images/packrat-reposubject.png "Packrat Subject Icon") Subject: A physical object (or environment)
- ![Packrat Media Group Icon](/dpo-packrat/images/packrat-repomediagroup.png "Packrat Media Group Icon") Media Group: A particular representation of one or more Subjects which has been digitized. This may include the entire Subject(s) or just part(s) of the Subject(s). Belongs to a Project (above)
- ![Packrat Capture Data Icon](/dpo-packrat/images/packrat-repocapturedata.png "Packrat Capture Data Icon") Capture Data Set: Raw and processed data used as inputs to the 3D model creation process
- ![Packrat Model Icon](/dpo-packrat/images/packrat-repomodel.png "Packrat Model Icon") Model: A 3D model
- ![Packrat Scene Icon](/dpo-packrat/images/packrat-reposcene.png "Packrat Scene Icon") Scene: A [Voyager Scene](https://smithsonian.github.io/dpo-voyager/)
- ![Packrat Unit Icon](/dpo-packrat/images/packrat-repoasset.png "Packrat Asset Icon") Asset: A file belonging to one of our objects (typically a Capture Data set, Model, or Scene). Assets have one or more asset versions.
- ![Packrat Unit Icon](/dpo-packrat/images/packrat-repoasset.png "Packrat Asset Version Icon") Asset Version: The actual bits corresponding to a specific version of an asset.

### Repository Browser
Clicking on "Repository" in the left navigation brings the user to the repository browser:
[![Packrat Repository Browser](/dpo-packrat/images/packrat-repobrowser-1.png "Packrat Repository Browser")](/dpo-packrat/images/packrat-repobrowser-1.png)
1. **Repository Filter**: Use the controls here to filter the results of what is displayed in the Repository Contents section below (item 5). For example, the results here have been filtered to show only things created on or after 3/29/2022. See [Repository Filter](#repository-filter) below for filter element details.

2. **Filter Toggle and Link Icons**
    - The carrot (![Packrat Carrot Icon](/dpo-packrat/images/packrat-repocarrot.png "Packrat Carrot Icon")) icon is used to collapse the filter, providing more screen real estate for the Repository Contents below. 
    - The link (![Packrat Link Icon](/dpo-packrat/images/packrat-repolink.png "Packrat Link Icon")) icon copies a link to the clipboard which can be used to access the same set of filtering options. This is the same URL that is displayed in your web browser. 
    - Share this link with others to focus attention on a custom view of the repository.

3. **Repository Root**: This describes the root of the tree of Packrat objects being viewed. Typically, this tree is rooted at the very base of the hierarchy, allowing everything in the repository to be viewed. When this is not the case, the root of the current repository browser is shown here. At present, this occurs during ingestion, when specifying the parents or children of a to-be-ingested object.

4. **Applied Filters**: These represent filters that have been applied; click on the minus (![Packrat Minus Icon](/dpo-packrat/images/packrat-repominus.png "Packrat Minus Icon")) icon to remove that filter.

5. **Repository Contents**: This region represents the objects in the repository, given the repository root and repository filters selected above.
    - Single-click a row to show/hide children objects.
    - The left-most column is the name of the object. Click on the icon or double-click the name to view the object details page.
    - The remaining columns represent the selected metadata, chosen in the "Metadata To Display" filter above.

6. **Column Size Control**: Each column can be resized by dragging this icon.

7. **Column Position Control**: These arrows appear when you hover over the column headers; click the arrow to move the column in the indicated direction.

8. **Object Icon**: Click on the icon to view the object details page.

9. **Object Name**: Double-click the name to view the object details page. Single-click the row to show/hide children objects.

### Repository Filter
The filter can be used to focus attention on those portions of the repository matching your selections:
| Filter Element | Purpose | Example |
| -------------- | ------- | ------- |
| Top-Level Objects | Choose the top-most items in the tree | [List of Models in the repository](https://packrat.si.edu/repository?metadataToDisplay=5,7,8&repositoryRootType=6) |
| Children Objects | Choose which object types appear as the children of items in the tree, allowing for the construction of very customized views of the repository | [View asset versions belonging to each Scene](https://packrat.si.edu/repository?metadataToDisplay=5,7,8&objectsToDisplay=11&repositoryRootType=7) |
| Metadata To Display | Controls the columns of metadata displayed in the browser | [View Date Created, Identifier, and Model Purpose of Models](https://packrat.si.edu/repository?metadataToDisplay=2,28,3&repositoryRootType=6) |
| Units | Selects which Units to display | [View Models from NMNH](https://packrat.si.edu/repository?metadataToDisplay=5,7,8&repositoryRootType=6&units=17) |
| Projects | Selects which Projects to display | [View Media Groups from Project "Bees"](https://packrat.si.edu/repository?metadataToDisplay=5,7,8&projects=127&repositoryRootType=4) |
| Has | Only display objects that "have" the selected object type as a child | [View Subjects that have Models](https://packrat.si.edu/repository?has=6&metadataToDisplay=5,7,8&repositoryRootType=3) |
| Missing | Only display objects that are missing the selected object type as a child | [View NMNH Subjects that don't have Models](https://packrat.si.edu/repository?metadataToDisplay=5,7,8&missing=6&repositoryRootType=3&units=17) |
| Capture Method | Display objects that have Capture Data Sets with the specified capture method | [View Photogrammetry Capture Data](https://packrat.si.edu/repository?captureMethod=1&metadataToDisplay=5,7,8&repositoryRootType=5) |
| Variant Type | Display objects that have Capture Data Set assets with the specified variant type | [View Raw Capture Data](https://packrat.si.edu/repository?metadataToDisplay=5,7,8&repositoryRootType=5&variantType=28) |
| Model Purpose | Display objects that have Models with the specified purpose | [View Voyager Scene Models](https://packrat.si.edu/repository?metadataToDisplay=5,7,8&modelPurpose=46&repositoryRootType=6) |
| Model File Type | Display objects that have Models with the specified file type | [View OBJ Models](https://packrat.si.edu/repository?metadataToDisplay=5,7,8&modelFileType=49&repositoryRootType=6) |
| Date Created (from) | Display objects created on or after the specified date | [View Scenes created after 1/1/2022](https://packrat.si.edu/repository?dateCreatedFrom=2022-01-01&metadataToDisplay=5,7,8&repositoryRootType=7) |
| Date Created (to) | Display objects created on or before the specified date | [View Scenes created in February 2022](https://packrat.si.edu/repository?dateCreatedFrom=2022-02-01&dateCreatedTo=2022-02-28&metadataToDisplay=5,7,8&repositoryRootType=7) |
