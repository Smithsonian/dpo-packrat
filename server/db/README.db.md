When updating the relational DB schema, the following should be done:
1. Update the empty DB creation script in db/sql/scripts/Packrat.sql; apply change to database
2. Update the DB model in db/sql/models/Packrat.mwb, using MySQL Workbench. This helps provide a visual guide to the database schema.  It's also helpful to export a single-page PDF of the schema, and then crop the PDF using your favorite PDF editor, so that the resulting document can be shared and viewed without requiring use of MySQL Workbench.  That being said, that tool is useful in that it allows for an interactive interrogation of the data model to explore relationships between tables.
3. Update the prisma schema & prisma client
    * switch to db/prisma directory
    * yarn prisma introspect
    * yarn prisma generate