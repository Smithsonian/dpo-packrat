---
title: "Bulk Ingestion"
weight: 390
---

Bulk ingestion is a form of ingestion in which a specially crafted zip file is provided. This file contains metadata needed by the ingestion process, as well as file manifests that enable the system to confirm uncorrupted receipt of the correct information.

This zip file is in the bagit format (https://datatracker.ietf.org/doc/html/rfc8493). The Library of Congress has built and shared the [Bagger](https://github.com/LibraryOfCongress/bagger) utility for constructing these files. Bagit zips contain the following contents:
|            Name            |      Purpose     |
| -------------------------- | ---------------- |
| bagit.txt                  | Declaration file |
| bag-info.txt               | Metadata file (unused by Packrat) |
| manifest-sha1.txt          | Data file manifest, with hashes for each data file in the SHA1 format |
| tagmanifest-sha1.txt       | Tag file manifest, with hashes for each metadata file in the SHA1 format |
| data/*                     | Data files, stored in the data subfolder, potentially with additional file path elements |
| **capture_data_photo.csv** | Optional photogrammetry Capture Data metadata |
| **models.csv**             | Optional Model metadata |
| **scenes.csv**             | Optional Scene metadata |

**One of capture_data_photo.csv, models.csv, or scenes.csv must be supplied.** These metadata files contain common data as well as object-specific metadata needed for ingestion. Some of these fields make use of [Controlled Vocabularies](../vocabulary):
|   Metadata Usage  |          Column Header        |       Meaning      |
| ----------------- | ----------------------------- | ------------------ |
| All               | subject_guid                  | Subject Identifier |
| All               | subject_name                  | Subject Name |
| All               | unit_guid                     | Unit Identifier |
| All               | unit_name                     | Unit Name |
| All               | item_guid                     | Media Group Identifier |
| All               | item_name                     | Media Group Name |
| All               | item_subtitle                 | Media Group Subtitle, if any |
| All               | entire_subject                | Is this Media Group the entire Subject or just a portion? |
| All               | name                          | Name of object |
| Capture Data      | date_captured                 | Date of Capture |
| Capture Data      | description                   | Description of Capture |
| Capture Data      | capture_dataset_type          | Dataset Type (Controlled Vocabulary) |
| Capture Data      | capture_dataset_field_id      | Field ID for Capture Data dataset |
| Capture Data      | item_position_type            | Position Type (Controlled Vocabulary) |
| Capture Data      | item_position_field_id        | Field ID for position |
| Capture Data      | item_arrangement_field_id     | Field ID for arrangement |
| Capture Data      | focus_type                    | Focus Type (Controlled Vocabulary) |
| Capture Data      | light_source_type             | Light Source Type (Controlled Vocabulary) |
| Capture Data      | background_removal_method     | Background Removal Method (Controlled Vocabulary) |
| Capture Data      | cluster_type_type             | Cluster Type (Controlled Vocabulary) |
| Capture Data      | cluster_geometry_field_id     | Field ID for Cluster Geometry |
| Models            | model_subtitle                | Model subtitle, if any |
| Models            | date_created                  | Creation Date |
| Models            | creation_method               | Creation Method (Controlled Vocabulary) |
| Models            | modality                      | Model Modality (Controlled Vocabulary) |
| Models            | units                         | Model Units (Controlled Vocabulary) |
| Models            | purpose                       | Model Purpose (Controlled Vocabulary) |
| Scenes            | scene_subtitle                | Scene subtitle, if any |
| Scenes            | posed_and_qcd                 | Set if the Scene has been posed and QC'd |
| Scenes            | approved_for_publication      | Set if the Scene has been approved for publication |
| All               | directory_path                | Relative path to data file(s) starting from the data folder |
