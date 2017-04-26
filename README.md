# fakenews

Fake News Fitness Extension

More information: 
https://docs.google.com/document/d/1rfZTmfpN1zaCOpR2M1oWxLPP-bbKtyE9vWXCgvA65AM/edit

Extension configuration:

- You will find the configuration file in the extension directory at config.json
- There are 4 main sections to the config file:
	Section 1) "filled_form" controls which fields show up on page 1 of the filled form (specialized fields). Each array as 5 entries:
		0. field id (used in form markup)
		1. field label (what the user will see as the field label in the form)
		2. placeholder for auto-fill. This should always be blank ("")
		3. type of field to build (there are 4 types defined):
			- "a": only used for page links on blank form. This will create variable list that can be added to, but will have undesirable language for anything but the links fields.
			- "v": A variable length list, not an input field.
			- "vl": A variable length list of links, not an input field.
			- "f": fixed text input. Most fields will be "f".
		4. required? 1 for required. 0 for optional. Only page 1 fields can be marked required.
		5. Drupal field name. If you are expecting the field to POST to Drupal, you need to put the field machine name to post to here (see config for examples)
		
	Section 2) "critical_thinking" controls which fields show up on page 2 of both filled and unfilled forms (non-specialized, do not autofill). Each array has 3 entries:
		0. field id (used in form markup)
		1. field label (what the user will see as the field label in the form)
		2. Drupal field name. If you are expecting the field to POST to Drupal, you need to put the field machine name to post to here (see config for examples)
	
	Section 3) "blank_form" controls which fields show up on page 1 of the blank form. Each array has the same 5 entries as filled form above. This section exists to accomodate different input types for a blank form than an autofilled one (for example the links list).
	  In configuration, this can be used for flexibility in which fields you expect students to fill without the auto-fill.
	
	Section 4) "typeAndOG" controls which Drupal content type and which OG to map the content to. Currently, OG is hard coded here. Hopefully that is not always and forever the case.

Modifying the extension fields:

Please do NOT push your config changes up to the git repo :)

Removing fields:

	**WARNING: If you remove "username", the form will throw errors attempting to POST to Drupal**

	1) Find the field you would like to remove in config.json.
	2) Delete the array and trailing comma associated with that field.
	3) Save, reload your extension, reload the page you are testing on.
	5) Test and make sure it still works!
	
Adding fields:

	**WARNING: Currently, we are only set up to add 'basic' fields, by which I mean single-entry, plain text, non-validated (by Drupal) fields, for which Drupal expects the syntax {"field_my_field":"my value"} to POST.
	Currently, all fields on page 2 are set up as textArea fields for critical thinking.**

	1) If you want this field to post to Drupal, create your Drupal field (i.e. Structure>Content Types>*Your content type*>Manage Fields>New Field>Type=Text>Create) and note the machine name (looks like "field_my_new_field")
	2) Create the array for your new field e.g. ["testField","This is a Test Field","",f,0,"field_my_test_field"], (remember the comma at the end!)
	3) Put your array into the config section where you would like to see the field. The form populates in the same order you see in config. (make sure all of your commas are correct!)
	4) Save, reload your extension, reload the page you are testing on.
	5) Test your new field!

Changing Type and OG settings:

	**WARNING: If you want to use a new content type, be sure to use 'existing fields' if you would like to populate the new content type with any of the 'specialized fields'.
	There are field names there as placeholders so it isn't confusing, but for the most part they currently are not used and field machine name for the auto-filled fields is hard coded. Hopefully not forever.**

	You will need to create your content type and/or new OG in Drupal before these changes will work:

	- To change the content type map, replace "page_check" with your desired content type machine name.
	- To change the OG map, replace "1" with the Organic Group ID that you would like to map the content to.
	Save, reload your extension, reload the page you are testing on, and test!

	