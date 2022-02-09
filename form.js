(function(){

	const _helpimage = chrome.runtime.getURL( '/help.png' );

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

		render: function( config, values ) {
			/*
			if ( !this.container ) {
				console.error( 'Could not create form without valid container' );
				return false;
			}
			*/

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
		},

		createButtons: function() {
			this.ui.buttons = _create( 'div', 'button-container', '', this.ui.form );

			var b;

			b = _create( 'button', 'saveReport', '', this.ui.buttons );
			b.textContent = 'Save to Google Drive';
			b.addEventListener( 'click', e => {
				e.preventDefault();
				const data = this.gatherFormValues();
				const report = new FNF_Report( data );
				report.createDriveFile();
			});

			b = _create( 'button', 'copyReport', '', this.ui.buttons );
			b.textContent = 'Copy/Paste';
			b.addEventListener( 'click', e => {
				e.preventDefault();
				const data = this.gatherFormValues();
				console.log( data );
			});

			b = _create( 'button', 'cancelButton', '', this.ui.buttons );
			b.textContent = 'Exit';
			b.addEventListener( 'click', e => {
				e.preventDefault();
				chrome.runtime.sendMessage( { text: 'close_frame' } );
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

				}
			});

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
			var label = _create( 'label', '', 'field-label', el );
			el.setAttribute( 'for', data.id );
			label.textContent = data.label;

			if ( data.contextual_help ) {
				var hlp = data.contextual_help;
				var helplink = _create( 'a', '', 'help-link', label );
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
			var list = _create( 'ul', data.id, 'likert likert-q' + nopt );

			for ( var i=0; i<nopt; i++ ) {
				var li = _create( 'li', '', '', list );
				var value = options[i];
				if ( value.length == 1 ) {
					value.push( value[0] );
				}
				var item_id = data.id + '_' + value[0];
				var input = _input( 'radio', item_id, value[0], data.id );
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
				el.href = data.value;
				el.textContent = data.value;
			} else {
				el = _create( 'span', data.id, 'no-link-field' );
				el.textContent = 'n/a';
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
			link: 'createLinkInput'
		},

		gatherFormValues: function() {
			const f = this.fields;
			const keys = Object.keys( f );
			const data = {};

			keys.forEach( k => {
				data[k] = {
					field: f[k],
					value: this.getFieldValue( f[k], k )
				};
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
					var items = field.input.querySelectorAll( 'li .list-value' );
					value = [];
					items.forEach( el => value.push( el.textContent ) );
					break;

				default:
					console.warn( 'Unhandled field getter for ', id, field.config.type, field.config );
			}

			return value;
		}
	};

	window.FNF_Form = FNF_Form;
})();