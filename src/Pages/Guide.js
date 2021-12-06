import React, { useState } from 'react';
import PageTemplate from './Template'

import '../css/Guide.css';

function GuidePage(props) {
    return (
        <>
            <PageTemplate disableSearch highLight='6' {...props} />
            <div className='GuidePage'>
                <h1>Changing Accent Color</h1>
                <p>Ctrl + Shift + J (To open the console)</p>
                <p>localStorage.setItem('accentColor', '#FFFFFF')</p>
                <hr />
                <h1>Search</h1>
                <p>Hovering over the search icon in the top middle of most pages will reveal a search bar. The search bar allows for Asset ID's/IMEI's to be searched to get more information about the device and the job code history of the asset.</p>
                <hr />
                <h1>Navigation</h1>
                <p>The left bar will populate as your permissions change. Anything you can see you are supposed to have access to. By default you will have "Asset Tracking", "Hourly Tracking", and "Home". See more information about the pages below:</p>
                <hr />
                <h1>Home</h1>
                <p>The home page has 2 sections.</p>
                <p>The left side is the To-Do list, the information here is automatically loaded from your Microsoft Planner. This will have your daily tasks along with any tickets assigned to you.</p>
                <p>The right side is your current daily counts. The daily dollars bar will fill up as your complete more tasks throughout the day. The goal is 650, so as you get closer to that, the more it will fill up. All hours and counts will also be displayed below the daily dollars as well.</p>
                <hr />
                <h1>Asset Tracking</h1>
                <p>The Asset Tracking Page, along with the hourly tracking page, is the core of the website. Inside here is where you will keep log of all of your daily assets. In the top left corner you can change the date in order to go back and change anything that may have been messed up. The rest of the page is the asset tracking section.</p>
                <p>To begin a new log, you can start anywhere in the last line. The job code field will have a dropdown list that will search for the job code. This field will remain the same after the new line has been added. There are a few rules that must be met when adding a new log:</p>
                <ul>
                    <li>The asset tag field, with limited exception, must align with an asset. If the asset doesn't exist, it will error out.</li>
                    <li>There is also job code validation. If you attempt to set a thin client laptop to any thick client job code, it will error out.</li>
                    <li>The comment field is not required, but the comment will be visible on the assets history page.</li>
                    <li>A red outline means that the field is either missing or invalid. More information about errors will be shown in the console (ctrl + shift + j)</li>
                </ul>
                <p>You know that a log has been added whenever a new line is created without any Asset ID/IMEI in that field.</p>
                <p>To edit an existing log, simply edit it. If there are any problems with that edit, whatever field was modified will turn red.</p>
                <hr />
                <h1>Hourly Tracking</h1>
                <p>The hourly tracking page is where your hourly bill codes will be tracked. The layout is the exact same as the asset tracking page, with the exception of having 2 clocks instead of the Asset ID/IMEI field. No assets can be managed through the hourly tracking page.</p>
                <p>To begin a new log, you can start anywhere in the last line. The start time, and the end time both have to be set before the log will be created. If you do the job code last, the field will automatically enter itself. If either one of the times are entered last, simply press the check mark below either clock to save the line. A few rules must be met when adding a new log:</p>
                <ul>
                    <li>Start time must be earlier than end time.</li>
                    <li>Start Time and End Time have to be entered, use an estimated end time to insert the log if you are not finished yet.</li>
                    <li>Hourly codes that track assets (thick imaging/deploy) must also be entered into the asset tracking page for asset history purposes.</li>
                </ul>
                <hr />
                <h1>Reports</h1>
                <p>The reports page has 2 sections.</p>
                <p>The left section is holds the daily dollars for everyone with logs for the day. It has the same gradient fill bar as seen on the home page. Each one of these are clickable to see more information. More information below:</p>
                <p>The right section is just a placeholder for future functionality. Nothing has been planned for this portion yet.</p>
                <p>If you click on one of the employees daily dollars you can see a few things. The left section contains a breakdown of everyone's daily counts. The left is the job code, middle is the count, and right is the dollars that it contributes to daily dollars. The right side is a graph of daily dollars over time. By default, it shows the last month, however the date range can be changed to show other times. The top section has 4 buttons. The back button will go back to everyone. The date will change the information seen to another date. The right 2 buttons are to view the asset/hourly worksheet of the specified employee. Refreshing the page will go back to your worksheets. If you have the permission "edit_others_worksheets", then you can make changes to the employees worksheet to fix any errors.</p>
                <hr />
                <h1>Assets</h1>
                <p>The Assets page holds information about all assets. The table is sortable, filterable, and has a lot of other techniques to view the assets. Clicking on a row will show more information about that asset including the history of the asset.</p>
                <hr />
                <h1>Models</h1>
                <p>The Models page is the place to go to view and edit information about the different models. The top right corner has arrows to navigate to other pages to see more models. 25 models will be shown on each page. Use the left or right arrow to navigate through the different pages. See more information about the columns below:</p>
                <ul>
                    <li>Model Number: The Model Number is the identifier of each model. It is used when adding new assets, so this is a handy column to view.</li>
                    <li>Model Name: The Model Name is the recognizable name of each asset. It is shown on the asset information page so that you can know what type of device the asset is.</li>
                    <li>Manufacturer: The manufacturer is just a sorting technique for the models, however, still good information to have.</li>
                    <li>Image: The image is a URL link to the asset. Currently, all images are hosted on Cloudinary (an image host). Change the link here to change the image that is shown on the asset information page.</li>
                    <li>Category: The category will define what job codes are allowed to be performed on a specific asset. For assets that could be multiple, set it to the most recent category that would define it. For example, Latitude 5580's used to be thick clients, but are now IGEL. You would set that to the IGEL category. For any alternate situation, a second model with similar information (model number would have to be different) could be created.</li>
                </ul>
                <hr />
                <h1>Importer</h1>
                <p>The Importer page is useful for adding assets in bulk. The csv format is specified on the page. Either upload the csv file or copy+paste in the text into the field. Once done, it will pop up a confirmation dialog that will display all of the assets it plans on importing. Double clicking one of these cells will allow you to modify it before sending it to the database.</p>
                <p>The default thing to be imported is assets, however, you can switch to model importing with the button at the bottom of the page.</p>
                <hr />
                <h1>Job Codes</h1>
                <p>TBI</p>
                <hr />
                <h1>Users</h1>
                <p>The User page is where permissions can be assigned and taken away. As well as employee email/title can be viewed. See permissions list below:</p>
                <p>Roles Coming Soon</p>
                <hr />
                <h1>Adding A New Asset</h1>
                <p>There are 3 methods of adding new assets:</p>
                <p>First is using the importer. You can do single or multiple assets through here.</p>
                <p>Second is using the search. If an asset is searched for that doesn't exist, you will be prompted to add the asset if you have the permission level to do so. The Model Number is case sensitive, so it's best to copy past from the model page.</p>
                <p>Last is in the Asset Tracking page. If a record is added for an asset that doesn't, and you have the permission level to add it, you will be prompted to add the asset. The Model Number is case sensitive, so it's best to copy past from the model page.</p>
                <hr />
                <h1>Getting Notifiations</h1>
                <p>To receive notifications when an asset has changed, search for that asset tag. The field listed as "Watching" has a checkbox that you can select that will enable notifications for that asset. Notifications are sent to the channel under: HERE *link TBI*. To stop getting notifications, simply uncheck the box</p>
                <hr />
            </div>
        </>
    )
}

export default GuidePage