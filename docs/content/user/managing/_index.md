---
title: "Content Management"
summary: Managing Content in Packrat
weight: 400
---

Within the [Repository Browser](../browse), clicking on a object icon or double-clicking a row will bring you to the detail page for the object in question.

### Common Information
All detail pages have a set of common information at the top of the page and a tabbed UI of information specific to the type of object being viewed:
![Packrat Details Common Info](/dpo-packrat/images/packrat-detail-1.png "Packrat Details Common Info")
1. Object Type: an indication of the type of object being viewed.
2. Object Name: the object name.  In most cases, this field is editable; in some, only the "Subtitle" is editable (when appropriate, found on the "Details" tab).
3. Navigation Breadcrumb: this region contains names and links to the various parent objects in the repository object hierarchy.
4. Identifiers: this region contains identifiers and allows for their editing, creation, and removal. Click the "New Identifier" button to review UI for entering an additional identifier. Note that "Update" needs to be clicked in order to persist edits and new identifiers.
5. Navigation Links: this region contains another representation of the names and links to the various parent objects in the repository object hierarchy.
6. Retired: when checked, the object is retired from view and use within Packrat. This is as close to "deletion" as Packrat allows; it removes the object from search and navigation.
7. License: View the current license applied to this object, or inherited from parent objects. Select a new license from the drop down and then click Update to apply the selected license to this object. Click "Clear Assignment" to clear any assigned license, and again inherit a license from parent objects. See [Licenses](#licenses) below for more details.
8. Update: Use this button to update edits made, such as identifier changes, license changes, or changes to object details (if any).

### Licenses
Packrat licensing controls [publishing](../publishing) behavior as well as [download generation](../workflows#download-generation). Licenses are defined at the object level and then inherited from that object to all subobjects which do not have explicit licenses defined.

If a given object does not have an explicit license defined, Packrat considers all of that object's direct ancestors, moving "up" the repository hierarchy until finding an object with an explicit license assignment. In the event that an object has multiple ancestors, Packrat will use the most restrictive license inherited from all of the considered ancestors.

### Details Tab
Beyond the [common information](#common-information) above, all detail pages have one or more tabs of data, depending on the type of object.

Each object type has a **Details** tab which contains object-specific metadata.  In most cases, this data is editable, depending on the object.

### Related Tab
All object types have a "Related" tab which describes the immediate parents and children of the object in the Packrat object hierarchy:
![Packrat Details Related](/dpo-packrat/images/packrat-detail-related.png "Packrat Details Related")

* Each parent and child name is a link to the details page of the object in question. 
* Click the minus symbol to remove the link between this object and the related object.
* Click the "Add" button to launch the repository browser for selecting an additional parent or child.

### Versions Tab
The versions tab appears for complex objects, including Capture Data, Models, and Scenes.
![Packrat Details Versions](/dpo-packrat/images/packrat-detail-versions.png "Packrat Details Versions")

* Each row represents a version of the object, which in turn is linked to specific versions of one or more assets. 
* The download link prepares a zip file of the corresponding asset versions for the selected object version, and then initiates a download.
* The Rollback action prompts the user for a rollback message, and then allows the user to create a new object version matching the selected version for rollback. In other words, if the user chooses to rollback to the 3rd version of this object, an 8th version is created, matching the configuration of the 3rd version. **Note** that at present, the metadata found on the "Details" tab is not rolled back as part of this operation.

### Metadata Tab
All objects have a Metadata tab, allowing for viewing and editing of generic metadata attached to the object.
![Packrat Details Metadata](/dpo-packrat/images/packrat-detail-metadata.png "Packrat Details Metadata")

This metadata comes in the form of { name, value } pairs. In some cases, a source is defined for a given piece of metadata. You are most likely to encounter metadata in Asset Versions of images -- Packrat extracts and saves this metadata. In addition, Subjects created by Packrat have metadata, allowing for integration with Edan as well as the creation of EdanMDM records. See [Content Publishing](../publishing) for more details.

It's possible to:
* Remove an existing name/value pair via the minus icon on that row
* Add a name/value pair via the "Add Field" button at the bottom of the tab
* Edit a value directly

**Additions and edits are only saved if the Update button is used**.

### Assets Tab
The Assets tab appears for objects that own assets. This includes Capture Data, Models, and Scenes. The tab contains a grid with one row per asset owned by the object. Each object type defines a set of columns that are appropriate for that object type.  You may hide and show columns by clicking on the column selector control: ![Packrat Details Asset Column Selector](/dpo-packrat/images/packrat-detail-asset-col.png "Packrat Details Asset Column Selector"). You can sort the entries by clicking on any column header.

The name of each asset is a link that allows the user to navigate to the appropriate asset detail page -- the Packrat object representing all versions of that file.

Each asset grid has "Download All" and "Add Version" buttons. "Download All" prepares a zip file of all of the assets, respecting the specified asset Paths, and initiates a download. 

"**Add Version**" navigates to the ingestion page, at which a user can select a new version of the object in question. For complex objects, like Capture Data Sets, Models, and Scenes, the user is expected to provide a zip of all content in order to add a new version. Users can also add a new version to an specific asset or asset version, allowing part of a complex object to be updated.

#### Capture Data Assets
![Packrat Details Asset Capture Data](/dpo-packrat/images/packrat-detail-asset-1.png "Packrat Details Asset Capture Data")
|     Column    |                             Purpose                              |
| ------------- | ---------------------------------------------------------------- |
| Link          | Download link for the version of the asset in use by this object |
| Name          | Name of the asset |
| Variant       | Capture data variant type (c.f. VariantType in [Controlled Vocabularies](../vocabulary)) |
| Hash          | SHA256 hash of contents (hover to see full value) |
| Size          | File size |
| Height        | Image height, in pixels |
| Width         | Image width, in pixels |
| ISO           | ISO of image |
| Lens          | Lens used to take image |
| FNumber       | F-number used to take image |
| Version       | Version number of the asset |
| Date Created  | Creation date |

#### Model Assets
![Packrat Details Asset Model](/dpo-packrat/images/packrat-detail-asset-2.png "Packrat Details Asset Model")
|     Column    |                             Purpose                              |
| ------------- | ---------------------------------------------------------------- |
| Link          | Download link for the version of the asset in use by this object |
| Name          | Name of the asset |
| Path          | File path to the asset, as part of the collection of assets|
| Asset Type    | Type of asset (e.g. Model Geometry, Model UV Map) |
| Version       | Version number of the asset |
| Date Created  | Creation date |
| Hash          | SHA256 hash of contents (hover to see full value) |
| Size          | File size |

#### Scene Assets
![Packrat Details Asset Scene](/dpo-packrat/images/packrat-detail-asset-3.png "Packrat Details Asset Scene")
|     Column    |                             Purpose                              |
| ------------- | ---------------------------------------------------------------- |
| Link          | Download link for the version of the asset in use by this object |
| Name          | Name of the asset |
| Path          | File path to the asset, as part of the collection of assets|
| Asset Type    | Type of asset (e.g. Scene, Model Geometry) |
| Version       | Version number of the asset |
| Date Created  | Creation date |
| Hash          | SHA256 hash of contents (hover to see full value) |
| Size          | File size |
| Quality       | Model Quality (e.g. High, Medium, Low, Thumb, AR) |
| UV            | Model UV Map size, in pixels |
| Bounding Box  | Model Bounding Box, in world coordinates |
| Att?          | When checked, indicates that the asset is a Scene attachment (such as for downloads) |
| Type          | Attachment type |
| Cat           | Attachment category |
| Units         | Attachment units |
| Model         | Attachment model file type |
| File          | Attachment file type |
| gLTF Std      | When checked, indicates that the model conforms to the gLTF standards of scale and position |
| Draco Compr   | When checked, indicates that the model is Draco compressed |
| Title         | Attachment title |

The Scene asset tab contains an "**Add Attachment**" button. When pressed, the user is brought to the ingestion upload screen. An asset uploaded and ingested in this manner will be added as an attachment to the Scene.
