---
title: "Bulk Ingestion"
weight: 390
---

Bulk ingestion is a form of ingestion in which a specially crafted zip file is provided. This file contains metadata needed by the ingestion process, as well as file manifests that enable the system to confirm uncorrupted receipt of the correct information.

This zip file is in the bagit format (https://datatracker.ietf.org/doc/html/rfc8493) and contains the following contents:
| Name | Function |
| ---- | -------- |
| bagit.txt | Declaration file |
| bag-info.txt | Unused metadata file |
| manifest-sha1.txt | Data file manifest, with hashes for each data file in the SHA1 format |
| tagmanifest-sha1.txt | Tag file manifest, with hashes for each metadata file in the SHA1 format |
| data/* | Data files, stored in the data subfolder, potentially with additional file path elements |
| capture_data_photo.csv | Optional photogrammetry capture data metadata |
| models.csv | Optional model metadata |
| scenes.csv | Optional scene metadata |

**One of capture_data_photo.csv, models.csv, or scenes.csv must be supplied.**  These metadata files contain common data as well as object-specific metadata needed for ingestion:
| Metadata Type | Column Header | Meaning |
| ---- | ------------- | ------- |
| All | subject_guid | Subject Identifier |
| All | subject_name | Subject Name |
| All | unit_guid | Unit Identifier |
| All | unit_name | Unit Name |
| All | item_guid | Media Group Identifier |
| All | item_name | Media Group Name |
| All | item_subtitle | Media Group Subtitle, if any |
| All | entire_subject | Is this media group the entire subject or just a portion? |
| All | name | Name of object |
| Capture Data | date_captured |  |
| Capture Data | description |  |
| Capture Data | capture_dataset_type |  |
| Capture Data | capture_dataset_field_id |  |
| Capture Data | item_position_type |  |
| Capture Data | item_position_field_id |  |
| Capture Data | item_arrangement_field_id |  |
| Capture Data | focus_type |  |
| Capture Data | light_source_type |  |
| Capture Data | background_removal_method |  |
| Capture Data | light_sourccluster_type_type |  |
| Capture Data | cluster_geometry_field_id |  |
| Models | model_subtitle | Model subtitle, if any |
| Models | date_created |  |
| Models | creation_method |  |
| Models | modality |  |
| Models | units |  |
| Models | purpose |  |
| Scenes | scene_subtitle | Scene subtitle, if any |
| Scenes | posed_and_qcd |  |
| Scenes | approved_for_publication |  |
| All | directory_path | Relative path to data file(s) starting from the data folder |
