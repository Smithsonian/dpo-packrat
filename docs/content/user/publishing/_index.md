---
title: "Content Publishing"
summary: Publishing Content from Packrat
weight: 600
---

Packrat includes an integration with the Smithsonian's [EDAN Content Repository](http://edan.si.edu/openaccess/docs/)in the following ways:
* Subject search, during ingestion, makes use of the [EDAN query API](http://edan.si.edu/openaccess/apidocs/)
* [Scene and attachment publishing](#scene-publishing) is accomplished using the [EDAN 3D API](http://dev.3d.api.si.edu/apidocs/) (*this is a private SI link*)
* [Subject creation](../../admin#subjects) is also accomplished using the [EDAN 3D API](http://dev.3d.api.si.edu/apidocs/) (*this is a private SI link*)

### Scene Publishing
Scenes in Packrat can be published to the EDAN content repository, resulting in the creation of an EDAN record of type '3d_package'. This can be performed when the following conditions are met:
[![Packrat Publish Scene](/dpo-packrat/images/packrat-publish-scene.png "Packrat Publish Scene")](/dpo-packrat/images/packrat-publish-scene.png)
1. The Models have been posed using [Voyager Story](../voyager#pose), launched via the "Edit" at the bottom of the Scene detail page.
2. Thumbnails have been generated using [Voyager Story](../voyager#capture).
3. The Scene is marked "Posed and QC'd", on the Details tab. This is available for use once thumbnails are present in the Scene.
4. The Scene is marked "Approved for Publication", on the Details tab.
5. The Scene's license allows for publishing.
6. **Note**: use the "Update" button to save changes made on the Details tab or to the license.

Once the Scene meets these criteria, the "Publish" and "API Only" buttons will become active.
* **Publish** makes downloads available and makes the Scene discoverable via the EDAN search API
* **API Only** makes downloads available via the EDAN 3D API but **does not** allow the Scene to be discoverable via the EDAN search API.

Click the appropriate button to initiate the publishing process. This involves transmission of data to EDAN's servers; some time is required here before the content will be visible in EDAN.

### Subject Publishing
Packrat allows for the authoring of novel Subjects and the publishing of these Subjects to EDAN, resulting in the creation & maintenance of EDAN records of type 'edanmdm'.

You can read more about [Subject creation](../../admin#subjects) in the [Administrative Guide](../../admin).
