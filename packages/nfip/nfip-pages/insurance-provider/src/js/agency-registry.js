// simulating retrieving the data from the API endpoint using some downloaded JSON files from the API. 
// Endpoint: ar/api/management/agency
// Filter: status=in=(ACTIVE), page size 10, sort DESC (example: filter=status%3Din%3D%28ACTIVE%29&page=0&size=10&sort=id%2CDESC)

// The API provides a link to the Next and Last page, inside the _links object. When you land on the last page, the Next link is missing, so all we need to do is check if there's a Next link, and if there is, fetch the data from that URL. Then, when there's no Next link, the loop can end. Alternatively, there's a URL parameter for the page count (i.e. page=0) that you could iterate over instead.

// Storybook is all Javascript, so PHP won't work. And I also don't have access to the real API endpoint, dev or production. So this is a demo of what to do with the data once it's retrieved and stored in the database

import data from "../json/agency-demo-1.json"; // data from the actual API dev environment. All the names were the same, so for easier testing, I created a new version below with the name values altered.
import dataAlt from "../json/agency-demo-names-altered.json";
const agencyArray = dataAlt._embedded.items;


setTimeout(() => { // storybook needs to load the content before the JS can fire

  const page = document.querySelector('.flsm-find-a-provider--container');

  if(page) {
  const listingContainer = document.getElementsByClassName("agency-listings");

  // use foreach instead, I think
  for ( const agency of agencyArray ) {
    // first, create the HTML/template element for each listing.
    const newAccordion = document.createElement("div");
    newAccordion.innerHTML = `<p>Stuff and things</p>`;
    console.log(newAccordion);
    listingContainer.appendChild(newAccordion);
  };



  /*****************************************************************************/
  // Below is all the stuff to make my version of the filter forms work, since I don't get to work with Drupal forms or databases handling all that for me.
  //

  } // end if page

}, 200);