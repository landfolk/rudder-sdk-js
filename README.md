<a href="https://www.browserstack.com"><img src="https://ci3.googleusercontent.com/proxy/fRtKCNzBZpi9ih7yLQjPyjk7A9PxqJSiy1dTNOrILhk96t0fWP7SRzPd4Hn5mtbbUBydy4zbFkokhaIAs_i98IYStoc64CUjt6bgJnR3J4lRKrZyT3L7N-M7sWO8eXnpWNTQr0cn6CaZ_euFxzzQ1937Zoef_Y7tJuEN_45xzBCoxzu_418PSbZIAY9XSJDQkI_gkqiGN0G9DXpjg89Hgp7Qg3A8CwK0nw6Tv7LudmtFxNmZffIeus-Av_QQZNdumU4I0mOtrSA7z-xrPtmxlGowDkVKIMkxVk_keFoSPFUUcx8ZrHf9I7YBZB1VQUQaovzwCMfckYgNc8dejLIoUx6f_zhSdOzgFNM=s0-d-e1-ft#https://attachment.freshdesk.com/inline/attachment?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6NDgwMTI3MDkyMjUsImRvbWFpbiI6ImJyb3dzZXJzdGFja2hlbHAuZnJlc2hkZXNrLmNvbSIsImFjY291bnRfaWQiOjExOTkzNjV9.C2upqj448UbAjOSoYmKEHiJ016DthbCU5XIEd-4jFJY" alt="image" title="image"></a>

Tested with Browserstack

# What is Rudder?

**Short answer:** 
Rudder is an open-source Segment alternative written in Go, built for the enterprise. .

**Long answer:** 
Rudder is a platform for collecting, storing and routing customer event data to dozens of tools. Rudder is open-source, can run in your cloud environment (AWS, GCP, Azure or even your data-centre) and provides a powerful transformation framework to process your event data on the fly.

Released under [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0)


# Rudder JS-SDK

This repo contains **builds** and **source-code** to integrate with your web-app and node applications. Use this to send analytics data from your applications to ever evolving destinations such as (HubSpot, Google Analytics and many more...)


# How to get started

Under the **analytics** folder, navigate to **dist** where you can find the minified and unminified versions of the sdk. There are two builds for working with browser based applications and node applications, mainly **browser.js** and **node.js**. There is also a minified **browser.min.js** which is hosted.

Few sample usage of the sdk can be found under **tests** directory for vanilla html, Angular, and node integrations.

**Setup**
```
// Script load start for working in browser env
// Place the below snippet in the <header> section in your html.
<script  type="text/javascript">
	analytics = window.analytics = [];
	/*
	"load"     :  loads analytics.js with your write key.
	"page"     :  to keep track whenever a user visits a page.
	"track"    :  to keep track of user actions, like purchase, signup.
	"identify" :  to associate userId with traits.
	"reset"    :  resets the userId and traits.
	For further reference of these apis, please refer Segment spec https://segment.com/docs/sources/website/analytics.js/
	*/
	var  methods = [
		"load",
		"page",
		"track",
		"identify",
		"reset"
	];

	for (var i=0; i<methods.length; i++) {
		var method = methods[i];
		analytics[method] = function(methodName) {
			return function() {
				analytics.push([methodName, ...arguments]);
			}
		} (method)
	}
	/*
	The below method is to load analytics with your writekey.
	You need to replace "YOUR_WRITE_KEY" with the Writekey in Rudder control plane and "DATA_PLANE_URI" with the uri of the server. 
	The 2nd parameter is optional.
	*/
	analytics.load("YOUR_WRITE_KEY", "DATA_PLANE_URI");

	/*
	The below call is to track the pageview. It auto captures the properties(path, referrer, search, title, url.) If you want to override them, use the call mentioned in section Sample events.
	*/
	analytics.page();
</script>
<script  src="https://unpkg.com/rudder-analytics@1.0.4"></script>

// The above is basically the browser.min.js being serviced by cdn, for localtesting, one can refer the js under dist folder
// This marks the end of loading our script, one can wrap the above in iife if it helps
```
**Sample events**
```
// Sample calls on global analytics object, for more examples, refer the tests folder

<script  type="text/javascript">
	/*
	In the below call, these are the following parameters:
		1. a string - userid, if it is provided, it will override the anonymousId.
		2. a dictionary, to provide user traits, like, address, email etc.
		3. a dictionary that is optional but provides information like, context, integrations, anonymousId etc. You can provide user traits in the context as well and it will set the traits value. 
			3.1. anonymousId is a UUID that is generated to identify the user, if it is provided, it will override the generated one.
			3.2. Context is a dictionary of extra information that provides useful context about a datapoint, for example the user’s ip address.
		4. you can provide callback that will be executed after the successful execution of identify call.
	*/
	analytics.identify(
        "12345",
        { email: "sayan@gmail.com" },
        {
          context: {
            ip: "0.0.0.0"
          },
          page: {
            path: "",
            referrer: "",
            search: "",
            title: "",
            url: ""
          },
          anonymousId: "12345" 
        },
		() => {console.log("in identify call");}
    );
	/*
	In the below call, these are the following parameters:
		1. a string - category of the page
		1. a string - name of the page
		2. a dictionary, to provide properties of the page. The mentioned parameters are auto captured.
		3. a dictionary that is optional but provides information like, context, integrations, anonymousId etc. You can provide user traits in the context as well and it will set the traits value. 
			3.1. anonymousId is a UUID that is generated to identify the user, if it is provided, it will override the generated one.
			3.2. Context is a dictionary of extra information that provides useful context about a datapoint, for example the user’s ip address.
		4. you can provide callback that will be executed after the successful execution of page call.
	*/
	analytics.page(
		"Cart",
		"Cart Viewed",
		{
			path:  "",
			referrer:  "",
			search:  "",
			title:  "",
			url:  ""
		},
		{
			context: {
				ip:  "0.0.0.0"
			},
			anonymousId:  "00000000000000000000000000"
		}, 
		() => {console.log("in page call");}
	);

	/*
	In the below call, these are the following parameters:
		1. a string - event name 
		2. a dictionary, properties of the event that you want to track, like, revenue, currency, value etc.
		3. a dictionary that is optional but provides information like, context, integrations, anonymousId etc. You can provide user traits in the context as well and it will set the traits value. 
			3.1. anonymousId is a UUID that is generated to identify the user, if it is provided, it will override the generated one.
			3.2. Context is a dictionary of extra information that provides useful context about a datapoint, for example the user’s ip address.
		4. you can provide callback that will be executed after the successful execution of track call.
	*/
	analytics.track(
		"test track event GA3",
		{
			revenue:  30,
			currency:  'USD' ,
			user_actual_id:  12345
		},
		{
			context: {
				ip:  "0.0.0.0"
			},
			anonymousId:  "00000000000000000000000000"
		}, 
		() => {console.log("in track call");}
	);
</script>
```


# Code Structure

- The whole code development is under the **analytics** folder.
-  **analytics.js** handles the core functionality for tapping your **identify**, **page** and **track** calls.
-  **integrations** contains the native loading and invocation of different destinations.
-  **HubSpot** and **Google Analytics** integrations have been in development recently.

***We try to support both browser and node versions of these integrations. It may so happen that integrations doesn't have a node sdk, in that case routing data through our **data-plane** is one of the options to send data to these destinations*

- The **dist** folder contains the minified and unminified versions of the sdk.
-  **tests** contains various flavours for how to use the sdk in applications
- We use *rollup* and *babel* for transpiling and generating the specific builds.


# Contribute

One can start adding integrations like *Mixpanel*, *Facebook ads* and others for sending data through their *js* and *node* sdks.

For building the sdk,
- Look for run scripts in the *package.json* file for getting browser and node specific builds.
- For adding or removing integrations, modify the *imports* in *index.js* under **integrations** folder.
