import React, { useState } from 'react';
import PageTemplate from './Template'
import { ChromePicker } from 'react-color'

import '../css/Guide.css';

function GuidePage(props) {
    const [color, setColor] = useState(localStorage.getItem('accentColor') || '#00c6fc')
    const handleColorChange = c => {
        setColor(c.hex)
        localStorage.setItem('accentColor', c.hex)
    }
    const clickHandler = async () => {
        let search = document.getElementById('search').value
        if (!search) return
        if (props.setSearch) props.setSearch(search)
        props.history.push(`/search?q=${search}`)
    }

    const handleKeyDown = e => {
        if (e.key === 'Enter') clickHandler()
    }
    return (
        <>
            <PageTemplate highLight='guide' {...props} />
            <div className='GuidePage'><div className='GuideContainer'>
                <h1>Changing Accent Color</h1>
                <p>Choose a color below. You may have to refresh for it to take full effect</p>
                <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                    <ChromePicker color={color} onChangeComplete={e => handleColorChange(e)} />
                </div>
                <hr />
                <h1>Search</h1>
                <p>The search bar allows for Asset ID's/IMEI's/Model Numbers to be searched to get more information about the device and the job code history of the asset, or to view assets under a specific model.</p>
                <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem 0' }}>
                    <div className="SearchBox" style={{ position: 'relative', maxWidth: '400px', left: 0 }}>
                        <input className="searchInput" type="text" id='search' placeholder="Search" onKeyDown={handleKeyDown} />
                        <button className="searchButton" onClick={clickHandler}>
                            <i className="material-icons">search</i>
                        </button>
                    </div>
                </div>
                <hr />
                <h1>Navigation</h1>
                <p>The left bar will populate as your permissions change. Anything you can see you are supposed to have access to. By default you will have "Asset Tracking", "Hourly Tracking", and "Home". See more information about the pages below:</p>
                <hr />
                <h1>Notifiations</h1>
                <p>Notifications are built into the website and no longer operate through teams channels/webhooks. Below is an example notification:</p>
                <img style={{ maxWidth: '80vw' }} src='https://res.cloudinary.com/compter-pros-on-call/image/upload/v1657735813/Guide%20Images/watched_asset_update_b0spiv.png' alt='Watched Asset Notification' />
                <p>The notification bell has 4 seperate icons:</p>
                <ul >
                    <li style={{ listStyle: 'none' }}>
                        <i className="material-icons">notifications_none</i><span>No Notifications</span>
                    </li>
                    <li style={{ listStyle: 'none' }}>
                        <i className="material-icons">notifications</i><span>Read Notifications</span>
                    </li>
                    <li style={{ listStyle: 'none' }}>
                        <i className="material-icons">notifications_active</i><span>Unread Notifications</span>
                    </li>
                    <li style={{ listStyle: 'none' }}>
                        <i className="material-icons">notification_important</i><span>Important Notifications</span>
                    </li>
                </ul>
                <p style={{ padding: '1rem' }}>The notification bell will also have a "Delete All" button. Clicking this will clear all notifications.</p>
                <p style={{ padding: '1rem' }}>The notification itself has two buttons on the top right:</p>
                <ul>
                    <li style={{ listStyle: 'none' }}>
                        <i className="material-icons">delete_outline</i><span>Delete</span>
                    </li>
                    <li style={{ listStyle: 'none' }}>
                        <i className="material-icons">priority_high</i><span>Mark/Un-Mark High Priority</span>
                    </li>
                </ul>
                <hr />
                <h1>Home</h1>
                <p>The home page has 2 sections.</p>
                <img style={{ maxWidth: '80vw' }} src='https://res.cloudinary.com/compter-pros-on-call/image/upload/v1638970834/Guide%20Images/Home_Left_hthksa.png' alt='Left Side of Home Screen' />
                <p>The left side is the To-Do list, the information here is automatically loaded from your Microsoft Planner. This will hide daily tasks, but show any tickets assigned to you.</p>
                <img style={{ maxWidth: '80vw' }} src='https://res.cloudinary.com/compter-pros-on-call/image/upload/v1657727139/Guide%20Images/daily_statistics_mqw6dx.png' alt='Right Side of Home Screen' />
                <p>The right side is your current daily counts. Daily Dollars is only visible to those who can see reporting. The "Check Discrepancy" button will cross reference T-Sheets, Snipe, and C-Track to ensure all numbers and hours line up with eachother. The "Check All Discrepancies" will run the discrepancy check for all employees, if you have access, use this with caution.</p>
                <hr />
                {props.isAdmin || (props.permissions && props.permissions.use_asset_tracker) ? <><h1>Asset Tracking</h1>
                    <p>The Asset Tracking Page, along with the hourly tracking page, is the core of the website. Inside here is where you will keep log of all of your daily assets. In the top left corner you can change the date in order to go back and change anything that may have been messed up. The rest of the page is the asset tracking section.</p>
                    <p style={{ padding: '1rem 0' }}>To begin a new log, you can start anywhere in the last line. The job code field will have a dropdown list that will search for the job code. This field will remain the same after the new line has been added. There are a few rules that must be met when adding a new log:</p>
                    <div style={{ padding: '2rem 0', display: 'flex', justifyContent: 'center', textAlign: 'left' }}><ul style={{ width: 'max-content', maxWidth: '70vw' }}>
                        <li><p>The asset tag field, with limited exception, must align with an asset. If the asset doesn't exist, it will error out.</p></li>
                        <li><p>There is also job code validation. If you attempt to set a thin client laptop to any thick client job code, it will error out.</p></li>
                        <li><p>The comment field is not required, but the comment will be visible on the assets history page.</p></li>
                        <li><p>A red outline means that the field is either missing or invalid. More information about errors will be shown in the console (ctrl + shift + j)</p></li>
                        <li><p>A orangeish outline means that there is likely something wrong with the field (such as duplicate entry), but it was still recorded.</p></li>
                    </ul></div>
                    <p>You know that a log has been added whenever a new line is created without any Asset ID/IMEI in that field.</p>
                    <p>To edit an existing log, simply edit it. If there are any problems with that edit, whatever field was modified will turn red.</p>
                    <hr /></> : <></>}
                {props.isAdmin || (props.permissions && props.permissions.use_hourly_tracker) ? <><h1>Hourly Tracking</h1>
                    <p>The hourly tracking page is where your hourly bill codes will be tracked. The layout is the exact same as the asset tracking page, with the exception of having 2 clocks instead of the Asset ID/IMEI field. No assets can be managed through the hourly tracking page.</p>
                    <p style={{ padding: '1rem 0' }}>To begin a new log, you can start anywhere in the last line. The start time, and the end time both have to be set before the log will be created. If you do the job code last, the field will automatically enter itself. If either one of the times are entered last, simply press the check mark below either clock to save the line. A few rules must be met when adding a new log:</p>
                    <div style={{ padding: '2rem 0', display: 'flex', justifyContent: 'center', textAlign: 'left' }}><ul style={{ width: 'max-content', maxWidth: '70vw' }}>
                        <li>Start time must be earlier than end time.</li>
                        <li>Start Time and End Time have to be entered, use an estimated end time to insert the log if you are not finished yet.</li>
                        <li>Hourly codes that track assets (thick imaging/deploy) must also be entered into the asset tracking page for asset history purposes.</li>
                    </ul></div>
                    <hr /></> : <></>}
                {props.isAdmin || (props.permissions && props.permissions.use_repair_log) ? <><h1>Repair Tracking</h1>
                    <p>The repair tracking page is where your repairs will be tracked. This page is much different than the asset and hourly tracking.</p>
                    <img style={{ maxWidth: '80vw' }} src='https://res.cloudinary.com/compter-pros-on-call/image/upload/v1657734771/Guide%20Images/repair_log_j11p6e.png' alt='Repair Tracking Home' />
                    <p>In the top of the page, there are 2 input boxes. After entering an asset into the asset tag box, all part types for that asset's model will appear under the repair type.</p>
                    <img style={{ maxWidth: '80vw' }} src='https://res.cloudinary.com/compter-pros-on-call/image/upload/v1657734866/Guide%20Images/part_selection_jfcxqc.png' alt='Part Selection' />
                    <p>After choosing a repair type, a list of all parts under that type will appear. If there aren't any visible part ID's on the part, choose a random one as it's just a hidden identifier if not printed.</p>
                    <img style={{ maxWidth: '80vw' }} src='https://res.cloudinary.com/compter-pros-on-call/image/upload/v1657735050/Guide%20Images/no_repairs_known_axz2k9.png' alt='Unknown Repair' />
                    <img style={{ maxWidth: '80vw' }} src='https://res.cloudinary.com/compter-pros-on-call/image/upload/v1657735160/Guide%20Images/failed_to_find_inventory_ssriky.png' alt='No Inventory' />
                    <p>If an error comes up about no inventory being found or no repairs known, then there is no need to log the repair as that part isn't inventoried.</p>
                    <hr /></> : <></>}
                {props.isAdmin || (props.permissions && props.permissions.view_reports) ? <><h1>Reports</h1>
                    <p>The reports page has 2 sections.</p>
                    <img style={{ maxWidth: '80vw' }} src='https://res.cloudinary.com/compter-pros-on-call/image/upload/v1638972138/Guide%20Images/Report_Left_1_uex2db.png' alt='Left Side of Main Report Page' />
                    <p>The left section is holds the daily dollars for everyone with logs for the day. It has the same gradient fill bar as seen on the home page. Each one of these are clickable to see more information. More information below:</p>
                    <img style={{ maxWidth: '80vw' }} src='https://res.cloudinary.com/compter-pros-on-call/image/upload/v1638972245/Guide%20Images/Report_Right_1_vkik5g.png' alt='Right Side of Main Report Page' />
                    <p>The right section is just a placeholder for future functionality. Nothing has been planned for this portion yet.</p>
                    <img style={{ maxWidth: '80vw' }} src='https://res.cloudinary.com/compter-pros-on-call/image/upload/v1638972138/Guide%20Images/Report_Left_2_lhk0co.png' alt='Left Side of User Report Page' />
                    <p>If you click on one of the employees daily dollars you can see a few things. The left section contains a breakdown of everyone's daily counts. The left is the job code, middle is the count, and right is the dollars that it contributes to daily dollars.</p>
                    <img style={{ maxWidth: '80vw' }} src='https://res.cloudinary.com/compter-pros-on-call/image/upload/v1638972138/Guide%20Images/Report_Right_2_kao1cy.png' alt='Right Side of User Report Page' />
                    <p>The right side is a graph of daily dollars over time. By default, it shows the last month, however the date range can be changed to show other times.</p>
                    <img style={{ maxWidth: '80vw' }} src='https://res.cloudinary.com/compter-pros-on-call/image/upload/v1638972368/Guide%20Images/Report_Nav_tixuj3.png' alt='Top Side of User Report Page' />
                    <p> The top section has 4 buttons. The back button will go back to everyone. The date will change the information seen to another date. The right 2 buttons are to view the asset/hourly worksheet of the specified employee. Refreshing the page will go back to your worksheets. If you have the permission "edit_others_worksheets", then you can make changes to the employees worksheet to fix any errors.</p>
                    <hr /></> : <></>}
                {props.isAdmin || (props.permissions && props.permissions.view_assets) ? <><h1>Assets</h1>
                    <p>The Assets page holds information about all assets. The table is sortable, filterable, and has a lot of other techniques to view the assets. Clicking on a row will show more information about that asset including the history of the asset.</p>
                    <hr /></> : <></>}
                {props.isAdmin || (props.permissions && props.permissions.view_models) ? <><h1>Models</h1>
                    <img style={{ maxWidth: '80vw' }} src='https://res.cloudinary.com/compter-pros-on-call/image/upload/v1638972898/Guide%20Images/Model_yezspr.png' alt='Model Input' />
                    <p>The Models page is the place to go to view and edit information about the different models. The top right corner has arrows to navigate to other pages to see more models. 25 models will be shown on each page. Use the left or right arrow to navigate through the different pages. See more information about the columns below:</p>
                    <div style={{ padding: '2rem 0', display: 'flex', justifyContent: 'center', textAlign: 'left' }}><ul style={{ width: 'max-content', maxWidth: '70vw' }}>
                        <li>Model Number
                            <ul>
                                <li style={{ marginLeft: '4rem', listStyle: 'circle' }}>The Model Number is the identifier of each model. It is used when adding new assets, so this is a handy column to view.</li>
                            </ul>
                        </li>
                        <li style={{ padding: '1rem 0' }}>Model Name
                            <ul>
                                <li style={{ marginLeft: '4rem', listStyle: 'circle' }}>The Model Name is the recognizable name of each asset. It is shown on the asset information page so that you can know what type of device the asset is.</li>
                            </ul>
                        </li>
                        <li style={{ padding: '1rem 0' }}>Manufacturer
                            <ul>
                                <li style={{ marginLeft: '4rem', listStyle: 'circle' }}>The manufacturer is just a sorting technique for the models, however, still good information to have.</li>
                            </ul>
                        </li>
                        <li style={{ padding: '1rem 0' }}>Image
                            <ul>
                                <li style={{ marginLeft: '4rem', listStyle: 'circle' }}>The image is a URL link to the asset. Currently, all images are hosted on Cloudinary (an image host). Change the link here to change the image that is shown on the asset information page.</li>
                            </ul>
                        </li>
                        <li style={{ padding: '1rem 0' }}>Category
                            <ul>
                                <li style={{ marginLeft: '4rem', listStyle: 'circle' }}>The category will define what job codes are allowed to be performed on a specific asset. For assets that could be multiple, set it to the most recent category that would define it. For example, Latitude 5580's used to be thick clients, but are now IGEL. You would set that to the IGEL category. For any alternate situation, a second model with similar information (model number would have to be different) could be created.</li>
                                <li style={{ marginLeft: '4rem', listStyle: 'circle' }}>Additionally, multiple categories can be set for a single model. For instance, 5590's are able to be both IGEL and Thick client laptops.</li>
                            </ul>
                        </li>
                    </ul></div>
                    <hr /></> : <></>}
                {props.isAdmin || (props.permissions && props.permissions.use_importer) ? <><h1>Importer</h1>
                    <p>The Importer page is useful for adding assets in bulk. The csv format is specified on the page. Either upload the csv file or copy+paste in the text into the field. Once done, it will pop up a confirmation dialog that will display all of the assets it plans on importing. Double clicking one of these cells will allow you to modify it before sending it to the database.</p>
                    <p style={{ padding: '1rem 0' }}>The default thing to be imported is assets, however, you can switch to model importing with the button at the bottom of the page.</p>
                    <hr /></> : <></>}
                {props.isAdmin || (props.permissions && props.permissions.view_jobcodes) ? <><h1>Job Codes</h1>
                    <img style={{ maxWidth: '80vw' }} src='https://res.cloudinary.com/compter-pros-on-call/image/upload/v1638973191/Guide%20Images/Job_Codes_nxkh5n.png' alt='Job Code Input' />
                    <div style={{ padding: '2rem 0', display: 'flex', justifyContent: 'center', textAlign: 'left' }}><ul style={{ width: 'max-content', maxWidth: '70vw' }}>
                        <li>Job Code
                            <ul>
                                <li style={{ marginLeft: '4rem', listStyle: 'circle' }}>The T-Sheets name of a job code</li>
                            </ul>
                        </li>
                        <li>Job Name
                            <ul>
                                <li style={{ marginLeft: '4rem', listStyle: 'circle' }}>The Full name of a job code</li>
                            </ul>
                        </li>
                        <li>Price
                            <ul>
                                <li style={{ marginLeft: '4rem', listStyle: 'circle' }}>The price per device or hour of a job code</li>
                            </ul>
                        </li>
                        <li>Hourly
                            <ul>
                                <li style={{ marginLeft: '4rem', listStyle: 'circle' }}>Check this box if the job code is an hourly job code.</li>
                                <li style={{ marginLeft: '4rem', listStyle: 'circle' }}>If it is hourly and an asset tracking code. Create 2 job codes, setting the non-hourly code to $0.</li>
                            </ul>
                        </li>
                        <li>Asset
                            <ul>
                                <li style={{ marginLeft: '4rem', listStyle: 'circle' }}>Only shows on non-hourly codes.</li>
                                <li style={{ marginLeft: '4rem', listStyle: 'circle' }}>Default is checked.</li>
                                <li style={{ marginLeft: '4rem', listStyle: 'circle' }}>Un-Check this box if the job code doesn't require an asset to be logged. Example: Terminations, Ticket Creation.</li>
                            </ul>
                        </li>
                        <li>Applies To
                            <ul>
                                <li style={{ marginLeft: '4rem', listStyle: 'circle' }}>Specify what types of devices the job code can be used on.</li>
                                <li style={{ marginLeft: '4rem', listStyle: 'circle' }}>Multiple can be selected.</li>
                                <li style={{ marginLeft: '4rem', listStyle: 'circle' }}>If nothing is specified, it will work on all device types.</li>
                            </ul>
                        </li>
                        <li>Not Usable
                            <ul>
                                <li style={{ marginLeft: '4rem', listStyle: 'circle' }}>The way to archive a job code.</li>
                                <li style={{ marginLeft: '4rem', listStyle: 'circle' }}>Sets the job code to only being able to be used as a status. This will retain the code for assets that have used it before, while also preventing it from being used again.</li>
                            </ul>
                        </li>
                        <li>Prompt Count
                            <ul>
                                <li style={{ marginLeft: '4rem', listStyle: 'circle' }}>Only for PPD Job Codes that don't require assets (i.e. Terminations).</li>
                                <li style={{ marginLeft: '4rem', listStyle: 'circle' }}>When entering the job code once, it will pop up a prompt allowing user to enter in multiple lines at once.</li>
                            </ul>
                        </li>
                        <li>Comments
                            <ul>
                                <li style={{ marginLeft: '4rem', listStyle: 'circle' }}>Turns the open commend field into a selection.</li>
                                <li style={{ marginLeft: '4rem', listStyle: 'circle' }}>Useful for things such as return materials and forcing the selection of Box, Envelope, or Label.</li>
                            </ul>
                        </li>
                        <li>Snipe ID
                            <ul>
                                <li style={{ marginLeft: '4rem', listStyle: 'circle' }}>Only available for asset job codes.</li>
                                <li style={{ marginLeft: '4rem', listStyle: 'circle' }}>Used for discrepancy checking to compare snipe's job codes to C-Track's job code.</li>
                            </ul>
                        </li>
                    </ul></div>
                    <hr /></> : <></>}
                {props.isAdmin || (props.permissions && props.permissions.view_users) ? <><h1>Users</h1>
                    <p>The User page is where permissions can be assigned and taken away. As well as employee email/title can be viewed. See permissions list below:</p>
                    <div style={{ padding: '2rem 0', display: 'flex', justifyContent: 'center', textAlign: 'left' }}><ul style={{ width: 'max-content', maxWidth: '70vw' }}>
                        <li>view_jobcodes<ul><li style={{ marginLeft: '4rem', listStyle: 'circle' }}>Allows vieweing of the Job Codes page</li></ul></li>
                        <li>edit_jobcodes<ul><li style={{ marginLeft: '4rem', listStyle: 'circle' }}>Allows the editing of job codes in the Job Codes page</li></ul></li>
                        <li>view_users<ul><li style={{ marginLeft: '4rem', listStyle: 'circle' }}>Allows viewing of the users page</li></ul></li>
                        <li>edit_users<ul><li style={{ marginLeft: '4rem', listStyle: 'circle' }}>Allows editing of users in the User Page</li></ul></li>
                        <li>use_importer<ul><li style={{ marginLeft: '4rem', listStyle: 'circle' }}>Allows use of asset and model importing</li>
                            <li style={{ marginLeft: '4rem', listStyle: 'circle' }}>Also allows viewing of the Importer page</li></ul></li>
                        <li>view_reports<ul><li style={{ marginLeft: '4rem', listStyle: 'circle' }}>Allows viewing of the Reports Page</li></ul></li>
                        <li>view_models<ul><li style={{ marginLeft: '4rem', listStyle: 'circle' }}>Allows viewing of the Models page</li></ul></li>
                        <li>edit_models<ul><li style={{ marginLeft: '4rem', listStyle: 'circle' }}>Allows editing of models in the Models page</li></ul></li>
                        <li>view_assets<ul><li style={{ marginLeft: '4rem', listStyle: 'circle' }}>Allows viewing of the Assets page</li></ul></li>
                        <li>edit_assets<ul><li style={{ marginLeft: '4rem', listStyle: 'circle' }}>Allows assets to be created and modified</li></ul></li>
                        <li>use_hourly_tracker<ul><li style={{ marginLeft: '4rem', listStyle: 'circle' }}>Default is on</li>
                            <li style={{ marginLeft: '4rem', listStyle: 'circle' }}>Allows use of hourly tracker</li></ul></li>
                        <li>use_asset_tracker<ul><li style={{ marginLeft: '4rem', listStyle: 'circle' }}>Default is on</li>
                            <li style={{ marginLeft: '4rem', listStyle: 'circle' }}>Allows use of asset tracker</li></ul></li>
                        <li>edit_others_worksheets<ul><li style={{ marginLeft: '4rem', listStyle: 'circle' }}>Also requires view_reports</li>
                            <li style={{ marginLeft: '4rem', listStyle: 'circle' }}>Allows user to edit other people's asset/hourly tracker</li></ul></li>
                        <li>view_particles<ul><li style={{ marginLeft: '4rem', listStyle: 'circle' }}>Enables the particle effect in the background.</li></ul></li>
                        <li>watch_assets<ul><li style={{ marginLeft: '4rem', listStyle: 'circle' }}>Allows for enabling notifications on asset change.</li></ul></li>
                        <li>use_repair_log<ul><li style={{ marginLeft: '4rem', listStyle: 'circle' }}>Allows for the usage of the repair log.</li></ul></li>
                        <li>view_parts<ul><li style={{ marginLeft: '4rem', listStyle: 'circle' }}>Allows for the viewing of the Part Management page.</li></ul></li>
                        <li>edit_parts<ul><li style={{ marginLeft: '4rem', listStyle: 'circle' }}>Allows for the editing of Parts under the Part Management page.</li></ul></li>
                        <li>view_part_types<ul><li style={{ marginLeft: '4rem', listStyle: 'circle' }}>Allows for the viewing of the Part Types page.</li></ul></li>
                        <li>edit_part_types<ul><li style={{ marginLeft: '4rem', listStyle: 'circle' }}>Allows for the editing of common part types (screen, keyboard, etc.) under the Part Types page.</li></ul></li>
                        <li>view_part_inventory<ul><li style={{ marginLeft: '4rem', listStyle: 'circle' }}>Allows for the viewing of the Parts Inventory page. This is safe to give to anyone who does repairs.</li></ul></li>
                        <li>use_discrepancy_check<ul><li style={{ marginLeft: '4rem', listStyle: 'circle' }}>Allows a user to check their own discrepancies. Is given to everyone by default.</li></ul></li>
                        <li>use_all_discrepancy_check<ul><li style={{ marginLeft: '4rem', listStyle: 'circle' }}>Allows for use to run discrepancy check for all users. Only give this to Senior Engineers.</li></ul></li>
                    </ul></div>
                    <hr /></> : <></>}
                {props.isAdmin || (props.permissions && props.permissions.edit_assets) ? <><h1>Adding A New Asset</h1>
                    <p>There are 3 methods of adding new assets:</p>
                    <img style={{ maxWidth: '80vw' }} src='https://res.cloudinary.com/compter-pros-on-call/image/upload/v1638973916/Guide%20Images/Importer_etjfwz.png' alt='Importer Method' />
                    <p>First is using the importer. You can do single or multiple assets through here.</p>
                    <img style={{ maxWidth: '80vw' }} src='https://res.cloudinary.com/compter-pros-on-call/image/upload/v1638974009/Guide%20Images/Search_Method_h3razu.png' alt='Search Method' />
                    <p>Second is using the search. If an asset is searched for that doesn't exist, you will be prompted to add the asset if you have the permission level to do so. The Model Number is a selection box.</p>
                    <img style={{ maxWidth: '80vw' }} src='https://res.cloudinary.com/compter-pros-on-call/image/upload/v1638974009/Guide%20Images/Asset_Tracking_Method_i9ofvg.png' alt='Asset Tracking Page Method' />
                    <p>Last is in the Asset Tracking page. If a record is added for an asset that doesn't, and you have the permission level to add it, you will be prompted to add the asset. The Model Number is a selection box.</p>
                    <hr />
                    <h1>Asset Watching</h1>
                    <img style={{ maxWidth: '80vw' }} src='https://res.cloudinary.com/compter-pros-on-call/image/upload/v1638974630/Guide%20Images/Watching_tg31ds.png' alt='Notification Checkbox' />
                    <p>To receive notifications when an asset has changed, search for that asset tag. The field listed as "Watching" has a checkbox that you can select that will enable notifications for that asset.</p>
                    <hr /></> : <></>}
                {props.isAdmin || (props.permissions && props.permissions.view_part_types) ? <><h1>Common Parts</h1>
                    <p>Common Parts are a generic part type like keyboard, screen, or battery.</p>
                    <p>Common Parts are created in the Parts → Types page.</p>
                    <img style={{ maxWidth: '80vw' }} src='https://res.cloudinary.com/compter-pros-on-call/image/upload/v1657732131/Guide%20Images/common_part_alof0l.png' alt='Common Part Page' />
                    <p>Simply provide a part name and what manufacturer it applies to, and it is set.</p>
                    <hr /></> : <></>}
                {props.isAdmin || (props.permissions && props.permissions.view_parts) ? <><h1>Parts</h1>
                    <p>Opposed to Common Parts, the parts are the actual part types with part numbers and models.</p>
                    <p>Each part is associated with a common part and a model. However, each part can associate with multiple models.</p>
                    <img style={{ maxWidth: '80vw' }} src='https://res.cloudinary.com/compter-pros-on-call/image/upload/v1657732898/Guide%20Images/part_management_ghc4m3.png' alt='Part Management' />
                    <p>The first page will show all the different models where part tracking is enabled. To view all of the parts for a model, select the model.</p>
                    <img style={{ maxWidth: '80vw' }} src='https://res.cloudinary.com/compter-pros-on-call/image/upload/v1657732898/Guide%20Images/enable_parts_dai7tj.png' alt='Enable Parts' />
                    <p>To enable parts on a model, search for the model, then add it.</p>
                    <img style={{ maxWidth: '80vw' }} src='https://res.cloudinary.com/compter-pros-on-call/image/upload/v1657732999/Guide%20Images/Parts_sc1xae.png' alt='Parts' />
                    <p>Once a model is selected, all parts will become visible for that model. Inside here, different aspects about the part can be created, modified, or removed.</p>
                    <p>Removal will fail if parts under that type have been created, so the delete is only meant for accidental entries.</p>
                    <hr /></> : <></>}
                {props.isAdmin || (props.permissions && props.permissions.view_part_inventory) ? <><h1>Parts Inventory</h1>
                    <p>The parts inventory is the way to view whether or not parts are in stock or see if the stock is running low.</p>
                    <p>This depends on everyone tracking parts whenever they are put into laptops through the repair log, so there may be discrepancies initially.</p>
                    <img style={{ maxWidth: '80vw' }} src='https://res.cloudinary.com/compter-pros-on-call/image/upload/v1657733596/Guide%20Images/Inventory_home_mxyqev.png' alt='Parts Inventory' />
                    <p>The coloring on laptop models when change when parts get below the threshold for each specific part indicating that it is time to order more. Red is the low stock indicator.</p>
                    <img style={{ maxWidth: '80vw' }} src='https://res.cloudinary.com/compter-pros-on-call/image/upload/v1657733596/Guide%20Images/inventory_model_uj7ujx.png' alt='Parts Inventory Model' />
                    <p>Clicking on the laptop will show all the parts for that model and their stock.</p>
                    <hr /></> : <></>}
            </div></div>
        </>
    )
}

export default GuidePage