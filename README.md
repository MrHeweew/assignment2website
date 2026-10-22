# Abdallah Consultancy Firm — Website

A 3D, multi-page website for a barrister's practice in Mauritius. The 3D balance scale is the site navigator.

**Pages:** Home · Meet the Lawyer · Expertise · Articles · Contact

## Run locally
Open the folder in VS Code, install the **Live Server** extension, right-click `index.html` and choose **Open with Live Server**. An internet connection is needed (fonts, jQuery and three.js load from CDNs). Double-clicking `index.html` also works.

## Publish on GitHub Pages
1. Create a new repository on GitHub and upload **all the files in this folder** (`index.html` must be at the root of the repo).
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to *Deploy from a branch*, choose branch `main` and folder `/ (root)`, then **Save**.
4. After a minute the site is live at `https://<your-username>.github.io/<repo-name>/`.

## Editing content
- Articles: `data/articles.json` (keep the backup list in `js/articles.js` in sync).
- Page text: edit the `.html` files, then run `node build-pages.js` to refresh `js/pages.js`.
- More notes on structure, colours and sound: `NOTES.txt`.

## Credits
3D model "Balance Scale" by Jean-Francois Bonin, licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
