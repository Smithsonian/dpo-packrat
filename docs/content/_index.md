---
title: "Packrat: System of Record for 3D data"
date: 2022-03-31
---

## Data Repository and Workflow Management for 3D data captures, models, and scenes

Packrat (https://github.com/Smithsonian/dpo-packrat) is the Smithsonian's system of record for 3D data.  It provides:
- A robust data repository for data files and associated metadata, via an implementation of the Oxford Common File Layout (https://ocfl.io/)
- A flexible business process engine for automating common 3D workflows
- An intgration with Smithsonian Cook (https://github.com/Smithsonian/dpo-cook) as our computational engine for 3D tasks
- A web user interface, with real-time search and navigation of the repository
- A variety of integration points allowing for customization and extension

Packrat is written in Typescript and runs on node.js. It includes a relational database for robust transactional record keeping, and employs Apache Solr for search and navigation.