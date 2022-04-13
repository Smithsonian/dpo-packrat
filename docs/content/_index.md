---
title: "Packrat: System of Record for 3D data"
date: 2022-03-31
---

### 3D Data Repository and Workflow Management for captures, models, and scenes

[Packrat](https://github.com/Smithsonian/dpo-packrat) is the Smithsonian's system of record for 3D data.  It provides:
- A robust data repository for data files and associated metadata, via an implementation of the [Oxford Common File Layout](https://ocfl.io/)
- A flexible business process engine for automating common 3D workflows
- An integration with [Smithsonian Cook](https://github.com/Smithsonian/dpo-cook) as our computational engine for 3D tasks
- An integration with [Smithsonian Voyager](https://github.com/Smithsonian/dpo-voyager) for 3D viewing and authoring
- A web user interface, with real-time search and navigation of the repository
- A variety of integration points allowing for customization and extension

Packrat is written in Typescript and runs on node.js. It includes a relational database for robust transactional record keeping, and employs Apache Solr for search and navigation.

Packrat is a work in progress. [Join us](https://github.com/Smithsonian/dpo-packrat) and help create a tool that can be used by your organization.