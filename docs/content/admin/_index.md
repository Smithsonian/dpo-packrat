---
title: "Administrator Guide"
weight: 20
---

Packrat administrative users can manage the following types of content by selecting "Admin" in the left navigation. In each case, these users can search for content, edit content, and create new content:
- [Licenses](#licenses)
- [Users](#users)
- [Projects](#projects)
- [Units](#units)
- [Subjects](#subjects)

### Licenses
Packrat licensing controls [publishing](../user/publishing) behavior as well as [download generation](../user/workflows#download-generation). Licenses are defined at the object level and then inherited from that object to all child objects which do not have explicit licenses defined.

If a given object does not have an explicit license defined, Packrat considers all of that object's direct ancestors, moving "up" the repository hierarchy until finding an object with an explicit license assignment. In the event that an object has multiple ancestors, Packrat will use the most restrictive license inherited from all of the considered ancestors.

From least restrictive to most restrictive, Packrat's default licenses include:
| License | Description | Publishable? | Downloads? | Restriction Level |
| ------- | ----------- | ------------ | ---------- | ----------------- |
| CC0, Publishable w/ Downloads | No Rights Reserved. Read more about [Creative Commons CC0](https://creativecommons.org/share-your-work/public-domain/cc0/) | Yes | Yes | 10 |
| SI ToU, Publishable w/ Downloads | Smithsonian's [Terms of Use](https://www.si.edu/termsofuse), Usage Conditions Apply | Yes | Yes | 20 |
| SI ToU, Publishable Only | Smithsonian's [Terms of Use](https://www.si.edu/termsofuse), Usage Conditions Apply | Yes | **No** | 30 |
| Restricted, Not Publishable | Restricted from public use | **No** | **No** | 40 |

Each Packrat license has a "Restriction Level", allowing Packrat to organize and better understand these licenses. Generally speaking, the lower the restriction level, the less restrictive the license is.

### Users
Packrat maintains its own database of users, including the username and user email address. Only active Packrat users are able to login to Packrat. Authentication of login credentials is performed by an integration with the Smithsonian Active Directory.

### Projects
Packrat organizes digitization initiatives into Projects. In turn, a Project owns a set of Media Groups, each of which represents digitization activities for a given set of Subjects. Projects are typically associated with a Unit.

### Units
Units represent an organizational group that owns or has responsibility for a physical Subject or maintains the authoritative metadata record for that Subject. Each Packrat Subject is associated with a Unit.

### Subjects
Subjects are objects in the collection, or environments. Packrat allows for the authoring of novel Subjects and the publishing of these Subjects to EDAN, resulting in the creation & maintenance of EDAN records of type 'edanmdm'.

New Subjects are created by visiting Administration > Subjects, and then clicking "Create".  When appropriate, start your construction of a Subject from an existing Subject:
[![Packrat Publish Subject Existing](/dpo-packrat/images/packrat-publish-subject-1.png "Packrat Publish Subject Existing")](/dpo-packrat/images/packrat-publish-subject-1.png)
1. Enter search text in order to search EDAN for the existing Subject
2. Click the "Search" button
3. Select the correct Subject by clicking the "plus" (![Packrat Plus Icon](/dpo-packrat/images/packrat-repoplus.png "Packrat Plus Icon")) button
4. Verify the Name and Unit for the Subject
5. Verify the identifiers for the Subject, and select one to be the preferred identifier by choosing it via its radio button

Alternatively, you can create a new Subject from scratch:
[![Packrat Publish Subject New](/dpo-packrat/images/packrat-publish-subject-2.png "Packrat Publish Subject New")](/dpo-packrat/images/packrat-publish-subject-2.png)
1. Enter the Subject's name
2. Select the Subject's Unit
3. Supply identifier(s)
4. Provide required metadata, which may involve repeating some information from above:
    | Name | Label | Value | Required? |
    | ---- | ----- | ----- | --------- |
    | Label | N/A | How 'Title' is referred to in EDAN ... typically set to 'Title' | Yes |
    | Title | N/A | Please enter the Title in this field, for example 'Captain Gabriel Archer burial' | Yes |
    | Record ID | N/A | EDAN Record ID. For the DPO 3D Team, prefix this with dpo_3d_, and use the next available incrementing number | Yes |
    | Unit | N/A | Smithsonian Unit responsible for the object or who partnered in scanning the object | Yes |
    | License | N/A | This is the rights of the object metadata, not the 3D Model, and should almost always be CC0 | Yes |
    | License Text | N/A | Additional rights texts for the object, when appropriate, such as "Usage Conditions Apply" | No |
5. Click the "Create" button when ready, to create the Subject and publish it to EDAN

Additional metadata can be provided:
[![Packrat Publish Subject Metadata](/dpo-packrat/images/packrat-publish-subject-3.png "Packrat Publish Subject Metadata")](/dpo-packrat/images/packrat-publish-subject-3.png)
1. Click "Add Field"
2. Select the metadata Name.  Names ending in "(FT)" are free text entries; they can be repeated, and they optionally take a "Label", which provides introductory text for the metadata.
3. Supply a Value (and Label, when appropriate)

These metadata fields will be persisted to Packrat and transmitted to EDAN when "Create" is clicked. 

Below is an additional set of metadata Names that have special meaning for EDAN. This [very thorough list of terms](http://dev.3d.api.si.edu/resources/terms.pdf) may help guide data entry here.

| Name | Sample Field Values | 
| ---- | ------- |
| Object Type | Page 474 of [terms list](http://dev.3d.api.si.edu/resources/terms.pdf#page=474) |
| Date |  |
| Place | Page 738 of [terms list](http://dev.3d.api.si.edu/resources/terms.pdf#page=738) |
| Topic | Page 1 of [terms list](http://dev.3d.api.si.edu/resources/terms.pdf#page=1) |
| Identifier (FT) | Label values found on Page 474 of [terms list](http://dev.3d.api.si.edu/resources/terms.pdf#page=474)  |
| Data Source (FT) |  |
| Date (FT) |  |
| Name (FT) | Page 1164 of [terms list](http://dev.3d.api.si.edu/resources/terms.pdf#page=1164) |
| Object Rights (FT) |  |
| Place (FT) | Page 1174 of [terms list](http://dev.3d.api.si.edu/resources/terms.pdf#page=1174) |
| Taxonomic Name (FT) |  |
| Notes (FT) | Page 1162 of [terms list](http://dev.3d.api.si.edu/resources/terms.pdf#page=1162) |
| Physical Description (FT) |  |
