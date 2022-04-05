---
title: "Content Ingestion"
weight: 300
---

Ingestion is the process of bringing content into Packrat's repository. Click on "Ingestion" in the left navigation to begin and manage this process.

### Upload
The first step of the ingestion process is to select and upload files to Packrat.
![Packrat Ingestion Upload](/dpo-packrat/images/packrat-ingestion-1.png "Packrat Ingestion Upload")
1. **Choose files** for upload: either drag-and-drop files to the highlighted red box, or select them via the "Browse Files" button.
2. **Select Asset Type** for the added file.
3. **Initiate Upload** by clicking the "Upload" icon.

    Packrat validates the uploaded files once upload has completed. If any validations fail, the upload fails, and an error message is shown to the user. Validations include:
    - 3D Model vaidation using Cook's si-packrat-inspect recipe
    - Image file format validation
    - Zip file format validation
    - Bulk Ingestion bagger format and contents validation
    - Voyager document (.svx.json file) validation

    Once upload and validation is complete:
4. **Select upload file(s) for ingestion**
5. **Initiate Ingestion** by clicking "Ingest" to move to the next step of ingestion for the selected file(s)
6. **Discard unwanted uploads** by clicking "Discard" to remove uploaded files from the ingestion queue

### Metadata
After uploading and validating files, the next step of ingestion is to specify the Subject, Media Group, and Project for the to-be-ingested items, followed by specifying object-specific metadata for each to-be-ingested file.