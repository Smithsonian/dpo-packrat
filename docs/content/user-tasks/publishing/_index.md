---
title: "Content Publishing"
weight: 600
---

Packrat includes an integration with the Smithsonian's [EDAN Content Repository](http://edan.si.edu/openaccess/docs/):
* Subject search, during ingestion, makes use of the [EDAN query API](http://edan.si.edu/openaccess/apidocs/)
* [Scene and attachment publishing](#scene-publishing) is accomplished using the [EDAN 3D API](http://dev.3d.api.si.edu/apidocs/) (*this is a private SI link*)
* [Subject creation](#edanmdm-publishing) is also accomplished using the [EDAN 3D API](http://dev.3d.api.si.edu/apidocs/) (*this is a private SI link*)

### Scene Publishing
Packrat Scenes can be published to the EDAN content repository when the following conditions are met:
![Packrat Publish Scene](/dpo-packrat/images/packrat-publish-scene.png "Packrat Publish Scene")   
1. The models have been posed using [Voyager Story](../voyager#pose), launched via the "Edit" at the bottom of the Scene detail page.
2. Thumbnails have been generated using [Voyager Story](../voyager#capture).
3. The scene is marked "Posed and QC'd", on the Details tab. This is available for use once thumbnails are present in the scene.
4. The scene is marked "Approved for Publication", on the Details tab.
5. The scene's license allows for publishing. Change this as needed and appropriate.
6. Use the "Update" button to record changes made on the Details tab or to the license.

Once the scene meets these criteria, the "Publish" and "API Only" buttons will become active.
* **Publish** makes downloads available and makes the scene discoverable via the EDAN search API
* **API Only** makes downloads available but **does not** allow the scene to be discoverable via the EDAN search API.

Click the appropriate button to initiate the publishing process. This involves transmission of data to EDAN's servers; some time is required here before the content will be visible in EDAN.

### EDANMDM Publishing
Replacing the [EDAN 3D Console](http://dev.3d.api.si.edu/prod/console/home)
1. Administration > Subjects, Create
2. 