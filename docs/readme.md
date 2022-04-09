---
title: "Packrat Documentation How To"
---

Packrat's documentation (https://smithsonian.github.io/dpo-packrat/) is produced with the help of [hugo](https://gohugo.io/), making extensive use of [Markdown](https://www.markdownguide.org/).

### Installation
Install Hugo, "extended version" (with SCSS support)
    - Windows via Chocolatey: choco install hugo-extended -confirm
    - MacOS/Linux via Homebrew: brew install hugo

### Configuration
Source for Packrat's documentation is found in /docs. Content is found in /docs/content. Built output is found in /docs/public.

Documentation found at https://smithsonian.github.io/dpo-packrat/ is served up via GitHub pages, from the specially-constructed [gh-pages](https://github.com/Smithsonian/dpo-packrat/tree/gh-pages) branch. This branch has only the output of hugo's build process ... it's not a full copy of the Packrat source.

### Usage
|          Task          |                                Approach                               |
| ---------------------- | --------------------------------------------------------------------- |
| Build site             | Execute 'hugo' in the /docs folder, or 'yarn docs' in the root folder |
| Serve site for testing | Execute 'hugo server' in the /docs folder |
| Clean up               | Execute 'yarn docs:clean' in the root folder |

### Deployment
1. Checkout a distinct, local copy of the Packrat source code from the 'gh-pages' branch.
2. Return to your local copy of Packrat, with the source that you wish to build and publish.
3. Clean up the documentation build output, with 'yarn docs:clean'.
4. Build the site, with 'yarn docs'.
5. Replace the contents of your local copy of the 'gh-pages' branch with the output found in /docs/publish
6. Commit the gh-pages branch
