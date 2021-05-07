/**
 * Background script to handle POST data & header
 */

var postData = [];
var header = [];
var headers = [];


// get POST data for each loaded page
browser.webRequest.onBeforeRequest.addListener(
    getPostData,
    { urls: ['<all_urls>'], types: ['main_frame'] }, 
    ['requestBody']
);


// add/modify headers before sending request
browser.webRequest.onBeforeSendHeaders.addListener(
    rewriteHeaders,
    { urls: ["<all_urls>"], types: ["main_frame"] },
    ["blocking", "requestHeaders"]
);


// get header for each page loaded
browser.webRequest.onSendHeaders.addListener(
    getHeader,
    { urls: ["<all_urls>"], types: ["main_frame"] },
    ["requestHeaders"]
);


// listen to messages from devtools panel
browser.runtime.onMessage.addListener( ( message, sender, sendResponse ) => {

    switch( message.action )
    {
        // return POST data to devtools panel
        case 'getPostData':
            getCurrentTab().then( tab => {
                sendResponse({
                    postData: postData[tab.id] ? postData[tab.id] : ''
                });
            });
            break;

        // return header to devtools panel
        case 'getHeader':
            getCurrentTab().then( tab => {
                sendResponse({
                    header: header[tab.id] ? header[tab.id] : ''
                });
            });
            break;

        // add/modify header
        case 'addHeader':
            headers.push({
                name: message.headerName,
                value: message.headerValue
            });
            break;

        default:
            break;
    }

    return true;

});


// get POST data on page load
function getPostData( e )
{
    getCurrentTab().then( tab => {

        if( e.method == 'POST' )
            postData[tab.id] = e.requestBody.formData;

        else
            postData[tab.id] = '';
    });
}


// get header on page load
function getHeader( e )
{
    getCurrentTab().then( tab => {

        let headers = [];
        header[tab.id] = ''

        for( let h of e.requestHeaders )
        {
            
            header[tab.id] += h.name + ":" + h.value + "\n";
            // if( h.name == 'header' )
            // {
            //     header[tab.id] = "asd\n" + h.value;
            //     return;
            // }
        }

        // header[tab.id] = '';
    });
}


// add/modify headers
function rewriteHeaders( e )
{
    if( headers.length == 0 )
        return;
    // push headers to request

    e.requestHeaders = headers;

    // reset headers array
    headers = [];

    // modify headers
    return { 
        requestHeaders: e.requestHeaders 
    };
}


// get current tab
function getCurrentTab()
{
    return new Promise( ( resolve, reject ) => {
        browser.tabs.query({ currentWindow: true, active: true }).then( tabs => {

            if( tabs.length > 0 )
                resolve( tabs[0] );

            else
                reject( 'Can\'t get tab' );
        });
    });
}