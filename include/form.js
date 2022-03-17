(function(){

	const _helpimage = chrome.runtime.getURL( '/img/help.png' );

	function _create( type, id, cls, parent ) {
		const el = document.createElement( type );
		if ( id ) {
			el.id = id;
		}

		if ( cls ) {
			el.className = cls;
		}

		if ( parent ) {
			parent.appendChild( el );
		}

		return el;
	}

	function _input( type, name, value, id ) {
		if ( !id ) {
			id = name;
		}

		const input = _create( 'input', id );
		input.type = type;
		input.name = name;
		input.value = value || '';

		return input;
	}

	function FNF_Form( container ) {
		this.container = container || document.body;
	}


	FNF_Form.prototype = {
		container: null,
		ui: {},
		tabs: {},
		fields: {},
		config: {},

		render: function( config, values ) {

			this.config = config;

			if ( values ) {
				this.values = values;
			}

			this.createPanel();
			this.createForm();
			this.createButtons();

			this.createTabs( config.tabs );
			this.createFields( config.fields );
		},

		createPanel: function() {
			this.ui.panel = _create( 'div', 'FakeNewsForm', '', this.container );
		},

		createForm: function() {
			this.ui.form = _create( 'form', '', '', this.ui.panel );
			this.ui.form.addEventListener( 'submit', e => e.preventDefault() );

			// Disable auto-submission by pressing enter.
			//https://stackoverflow.com/questions/895171/prevent-users-from-submitting-a-form-by-hitting-enter

			var b = _create( 'button', 'doNothingButton', '', this.ui.form );
			b.style.display = 'none';
			b.type = 'submit';
			b.setAttribute( 'aria-hidden', true );
		},

		createButtons: function() {
			this.ui.buttons = _create( 'div', 'button-container', '', this.ui.form );

			var b;

			if ( ! this.config.disable_google_drive ) {
				b = _create( 'button', 'saveReport', '', this.ui.buttons );
				b.textContent = 'Save to Google Drive';
				this.bindGoogleDrive( b );
			}

			b = _create( 'button', 'copyReport', '', this.ui.buttons );
			b.textContent = 'Copy/Paste';
			this.bindCopyPaste( b );

			b = _create( 'button', 'cancelButton', '', this.ui.buttons );
			b.textContent = 'Exit';
			b.addEventListener( 'click', e => {
				e.preventDefault();
				chrome.runtime.sendMessage( { text: 'close_frame' } );
			});

		},

		bindGoogleDrive: function( button ) {
			button.addEventListener( 'click', e => {
				e.preventDefault();
				const data = this.gatherFormValues();
				const report = new FNF_Report( data );
				report.createDriveFile();
			});

		},


		bindCopyPaste: function( button ) {
			button.addEventListener( 'click', e => {
				e.preventDefault();
				const data = this.gatherFormValues();
				const report = new FNF_Report( data );
				var el = report.createCopyPopup();
				if ( ! el.parentNode ) {
					this.ui.panel.appendChild( el );
				}
			});
		},

		createTabs: function( tabs ) {
			if ( ! this.ui.tabSections ) {
				this.createTabSection();
			}

			tabs.forEach( this.createTab, this );
			this.setActiveTab(); // Set first tab active.
		},

		createTabSection: function() {
			this.ui.tabNav = _create( 'nav', 'tab-nav', '', this.ui.form );
			this.ui.tabSections = _create( 'div', 'tab-sections', '', this.ui.form );
		},

		createTab: function( tabdata ) {
			var link = _create( 'a', '', 'tab-link', this.ui.tabNav );
			link.href = '#';
			link.textContent = tabdata.label;
			var tab = _create( 'div', tabdata.id, 'fnf-tab', this.ui.tabSections );
			link.addEventListener( 'click', e => {
				e.preventDefault();
				this.setActiveTab( tabdata.id );
			});

			var content = _create( 'div', '', 'fnf-tab-content', tab );
			this.tabs[tabdata.id] = { link, tab, content };

			this.createTabFooter( tabdata );

			return tab;
		},

		createTabFooter: function( tabdata ) {
			if ( !tabdata.footer_actions ) {
				return;
			}

			var ui = this.tabs[tabdata.id];
			var footer = ui.footer = _create( 'div', '', 'fnf-tab-footer', ui.tab );

			tabdata.footer_actions.forEach( data => {
				switch( data.type ) {
					case 'changetab':
						var b = _create( 'button', '', '', ui.footer );
						b.textContent = data.label;
						b.addEventListener( 'click', e => {
							e.preventDefault();
							this.setActiveTab.apply( this, data.args );
							window.scrollTo( 0, 0 );
						});
						break;

					case 'save_google':
						// Global drive setting overrides footer action.
						if ( this.config.disable_google_drive ) {
							break;

						}

						/* falls through */
					case 'save_copypaste':

						var b = _create( 'button', '', '', ui.footer );
						b.textContent = data.label;
						this.bindClickAction( data.type, b );
						break;
				}
			});

		},

		bindClickAction: function( action, el ) {
			switch( action ) {
				case 'save_google':
					if ( this.config.disable_google_drive ) {
						break;
					}

					this.bindGoogleDrive( el );
					break;

				case 'save_copypaste':
					this.bindCopyPaste( el );
					break;
			}

			return el;
		},

		setActiveTab: function( tabid ) {
			const tabs = this.tabs;
			const ids = Object.keys( tabs );

			if ( !ids.length ) {
				return;
			}

			// Deactivate all
			ids.forEach( id => {
				tabs[id].link.removeAttribute( 'data-tab-active' );
				tabs[id].tab.removeAttribute( 'data-tab-active' );
			});

			// selected tab ID, or first if none specified.
			const active = tabid ? tabs[tabid] : tabs[ids[0]];
			active.tab.setAttribute( 'data-tab-active', 1 );
			active.link.setAttribute( 'data-tab-active', 1 );
			return active;
		},

		createFields: function( fields ) {
			fields.forEach( this.createField, this );
		},

		createField: function( data ) {
			if ( this.values && typeof this.values[data.id] !== 'undefined' ) {
				data.value = this.values[data.id];
			}
			var input = this.createInput( data, el );
			if ( !input ) {
				return;
			}

			var tabui = this.tabs[data.tabid] || null;
			if ( !tabui ) {
				console.warn( 'Unable to find tab ', data.tabid, ' for field ', data.id );
				return false;
			}

			var el = _create( 'div', '', 'form-group', tabui.content );
			el.setAttribute( 'for', data.id );

			// Label is optional now, for HTML type mainly.
			var label = false;

			if ( data.label ) {
				label = _create( 'label', data.id + '_label', 'field-label', el );
				label.textContent = data.label;


				el.setAttribute( 'role', 'group' );
				el.setAttribute( 'aria-labelledby', data.id + '_label' );
			}

			if ( data.contextual_help ) {
				var hlp = data.contextual_help;
				var helplink = _create( 'a', '', 'help-link', label || el );
				helplink.target = '_blank';
				if ( hlp.url ) {
					helplink.href = hlp.url;
				}

				var img = _create( 'img', '', '', helplink );
				img.src = _helpimage;
				img.alt = 'Help';
			}

			el.appendChild( input );

			this.fields[data.id] = { input, label, container: el, config: data, tab: tabui };
			return el;
		},

		createInput: function( data, field ) {
			if ( this.inputBuilders[ data.type ] ) {
				var method = this.inputBuilders[ data.type ];
				return this[method].call( this, data, field );
			}

			console.warn( 'Unhandled input type:', data.type, data );
			return false;
		},

		createTextInput: function( data ) {
			return _input( 'text', data.id, data.value || '' );
		},

		createTextareaInput: function( data ) {
			const el = _create( 'textarea', data.id );
			el.name = data.id;
			el.value = data.value || '';
			return el;
		},

		createListInput: function( data ) {
			const el = _create( 'div', data.id, 'list-input-container' );
			const list = _create( 'ul', '', 'list-items', el );
			const addblock = _create( 'div', '', 'add-list-items', el );

			if ( !data.noAdd ) {
				const input = _input( 'text', 'add_' + data.id, '' );
				input.addEventListener( 'keyup', e => {
					if ( e.code === 'Enter' ) {
						addItem.call( this, e);
					}
				});
				addblock.appendChild( input );
				const addbutton = _create( 'button', '', '', addblock );
				addbutton.textContent = 'Add';
				addbutton.addEventListener( 'click', addItem.bind(this) );

				function addItem(e) {
					e.preventDefault();
					var value = input.value;
					if ( value !== '' ) {
						this.addListItem( list, value, data );
						input.value = '';
					}

				}
			}

			if ( data.value ) {
				var val = Array.isArray( data.value ) ? data.value : [ data.value ];
				val.forEach( v => this.addListItem( list, v, data ) );
			}

			return el;
		},

		addListItem: function( list, value, field ) {
			var item = _create( 'li', '', '', list );
			var span = _create( 'span', '', 'list-value', item );
			span.textContent = value;
			if ( !field.noRemove ) {
				var del = _create( 'button', '', '', item );
				del.innerHTML = '&times;';
				del.addEventListener( 'click', function(e) {
					e.preventDefault();
					list.removeChild( item );
				});
			}
			list.appendChild( item );
			return item;
		},

		createLinkListInput: function( data ) {
			const el = _create( 'div', data.id, 'list-input-container link-list-input-container' );
			const list = _create( 'ul', '', 'list-items link-list-items', el );
			const addblock = _create( 'div', '', 'add-list-items add-link-list-items', el );

			if ( !data.noAdd ) {
				const input = _input( 'text', 'add_' + data.id, '' );
				input.placeholder = 'https://';
				input.addEventListener( 'keyup', e => {
					if ( e.code === 'Enter' ) {
						addItem.call( this, e);
					}
				});
				addblock.appendChild( input );
				const addbutton = _create( 'button', '', '', addblock );
				addbutton.textContent = 'Add';
				addbutton.addEventListener( 'click', addItem.bind(this) );

				function addItem(e) {
					e.preventDefault();
					var value = input.value;
					if ( value !== '' ) {
						this.addLinkListItem( list, value, data );
						input.value = '';
					}

				}
			}

			if ( data.value ) {
				var val = Array.isArray( data.value ) ? data.value : [ data.value ];
				val.forEach( v => this.addLinkListItem( list, v, data ) );
			}

			return el;
		},

		addLinkListItem: function( list, value, field ) {
			var item = _create( 'li', '', '', list );
			var span = _create( 'a', '', 'list-value tooltip-title', item );
			span.textContent = value;
			span.href = value;
			span.target = '_blank';
			span.title = value;
			if ( !field.noRemove ) {
				var del = _create( 'button', '', '', item );
				del.innerHTML = '&times;';
				del.addEventListener( 'click', function(e) {
					e.preventDefault();
					list.removeChild( item );
				});
			}
			list.appendChild( item );
			return item;
		},

		createBooleanInput: function( data ) {
			data.options = [ [ 'Yes' ] ];
			return this.createCheckboxInput( data );
			//return _input( 'checkbox', data.id, 'Yes');
		},

		createCheckboxInput: function( data ) {
			var el = _create( 'div', '', 'checkbox-group' );
			data.options.forEach( opt => {
				// Option is a value or array of [value, label]
				// If label is ommitted, the value will be shown.
				if ( ! Array.isArray( opt ) ) {
					opt = [ opt ];
				}

				if ( opt.length < 2 ) {
					opt.push( opt[0] );
				}

				var id = data.id + '_' + opt[0];
				var chk = _input( 'checkbox', data.id, opt[0], id );
				var label = _create( 'label' );
				label.setAttribute( 'for', id );
				label.textContent = opt[1];
				el.appendChild( chk );
				el.appendChild( label );
			});

			return el;
		},

		createLikertInput: function( data ) {
			var options = data.options;
			var nopt = options.length;
			var list = _create( 'ul', data.id + '_container', 'likert likert-q' + nopt );

			for ( var i=0; i<nopt; i++ ) {
				var li = _create( 'li', '', '', list );
				var value = options[i];
				if ( value.length == 1 ) {
					value.push( value[0] );
				}
				var item_id = data.id + '_' + value[0];
				var input = _input( 'radio', data.id, value[0], item_id );
				var label = _create( 'label' );
				label.textContent = value[1];
				label.setAttribute( 'for', item_id );
				li.appendChild( input );
				li.appendChild( label );
			}

			return list;
		},

		createLinkInput: function( data ) {
			var el = _create( 'div' );
			var link = _input( 'text', data.id, data.value );
			link.placeholder = 'https://';
			link.className = 'link-input';
			el.appendChild( link );
			var go = _create( 'button', '', 'link-go-button', el );
			go.textContent = 'Go';
			go.addEventListener( 'click', function(e){
				e.preventDefault();
				window.open( link.value, '_blank' );
			});

			return el;
		},

		createLink: function( data ) {
			var el;
			if ( data.value ) {
				el = _create( 'a', data.id, 'link-field' );
				el.target = '_blank';
				el.href = data.value;
				el.textContent = data.value;
			} else {
				el = _create( 'span', data.id, 'no-link-field' );
				el.textContent = 'n/a';
			}

			return el;
		},

		createHtmlRegion: function( data ) {
			var el = _create( 'div' );
			if ( data.content ) {
				el.innerHTML = data.content;
			}

			return el;
		},

		createActionButton: function( data ) {
			var el = _create( 'button' );
			if ( data.buttonlabel ) {
				el.innerHTML = data.buttonlabel;
			}

			this.bindClickAction( data.action, el );
			return el;
		},

		createConfigSelector: function( data ) {
			var el = _create( 'div' );
			var sel = _create( 'select', '', 'config-selector', el );
			var button = _create( 'button', '', '', el );
			button.textContent = 'Save/Reload';
			button.addEventListener( 'click', e => {
				chrome.runtime.sendMessage( { text: 'set_config', url: sel.value }, () => {
					chrome.runtime.sendMessage( { text: 'close_frame', noprompt: 1, reopen: 1 } );
				});
			});

			var optDefault = _create( 'option' );
			optDefault.value = '';
			optDefault.text = 'Default';
			sel.options.add( optDefault );

			if ( data.options.length ) {
				for( var i=0,n=data.options.length; i<n; i++ ) {
					var item = data.options[i];
					if ( ! item.url ) {
						continue;
					}

					var opt = _create( 'option' );
					opt.value = item.url;
					opt.text = item.label || item.url;
					sel.options.add( opt );
				}
			}

			return el;
		},

		inputBuilders: {
			text: 'createTextInput',
			textarea: 'createTextareaInput',
			boolean: 'createBooleanInput',
			checkbox: 'createCheckboxInput',
			likert: 'createLikertInput',
			list: 'createListInput',
			whois: 'createListInput',
			linklist: 'createLinkListInput',
			link: 'createLinkInput',
			html: 'createHtmlRegion',
			actionbutton: 'createActionButton',
			configselector: 'createConfigSelector'
		},

		gatherFormValues: function() {
			const f = this.fields;
			const keys = Object.keys( f );
			const data = {};
			//const ignoreTypes = [ 'html', 'actionbutton', 'configselector'];

			keys.forEach( k => {

				// Buttons and HTML areas are for onscreen instruction, not gathering value.
				if ( ignoreTypes.indexOf( f[k].config.type ) !== -1 ) {
					return;
				}

				let value = this.getFieldValue( f[k], k );

				if ( value !== null ) {
					data[k] = {
						field: f[k],
						value
					};
				}
			});

			return data;
		},

		getFieldValue: function( field, id ) {
			const cfg = field.config;
			var value = null;
			
			switch ( cfg.type ) {
				case 'text':
				case 'textarea':
					value = field.input.value;
					break;

				case 'link':
					var el = field.input.querySelector( '.link-input' );
					if ( el ) {
						value = el.value;
					}
					break;

				case 'checkbox':
					var items = field.input.querySelectorAll( 'input[name="' + id + '"]' );
					value = [];
					items.forEach( el => {
						if ( el.checked ) {
							value.push( el.value );
						}
					});
					break;

				// Single value from complex selector. Stop on first.
				case 'boolean':
				case 'likert':
					var items = field.input.querySelectorAll( 'input[name="' + id + '"]' );
					var n = items.length;
					for( var i=0; i<n; i++ ) {
						if ( items[i].checked ) {
							value = items[i].value;
							break;
						}
					}
					break;

				case 'list':
				case 'whois':
				case 'linklist':
					var items = field.input.querySelectorAll( 'li .list-value' );
					value = [];
					items.forEach( el => value.push( el.textContent ) );
					break;

				case 'html':
				case 'actionbutton':
				case 'configselector':
					break;

				default:
					console.warn( 'Unhandled field getter for ', id, field.config.type, field.config );
			}

			return value;
		},

		// @todo: Partially implemented - values aren't populated for all types yet.
		setFieldValue: function( id, value ) {
			var field = this.fields[id] || false;

			if ( !field ) {
				console.warn( 'Field ID not found:', id );
				return;
			}

			var cfg = field.config;

			switch ( cfg.type ) {
				case 'text':
				case 'textarea':
					field.input.value = value;
					break;

				// Array of entries
				case 'list':
				case 'whois':
				case 'linklist':
					var list = field.input.querySelector( '.list-items' );
					value = Array.isArray( value ) ? value : [ value ];
					value.forEach( v => this.addListItem( list, v, field.config ) );
					break;

				default:
					console.warn( 'Unhandled field setter for ', field.id, field.config.type, field.config );


			}

			field.value = value;

		}
	};

	window.FNF_Form = FNF_Form;
})();