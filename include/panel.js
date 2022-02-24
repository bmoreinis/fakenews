var formdata;

// This executes once the frame page has loaded. The background script is notified and in turn notifies the content.js
// to parse the page and send the field config and values back to here to the form builder class.
chrome.runtime.sendMessage( { text: 'frame_loaded' }, response => {
	formdata = response;
	var builder = new FNF_Form( document.getElementById( 'content' ) );
	builder.render( formdata.config, formdata.values );

	// Send separate message to gather WHOIS data after form rendered:
	chrome.runtime.sendMessage( { text: 'whois', domain: formdata.values.dn }, response => {
		builder.setFieldValue( 'whois', response );
	});

});


function FNF_Tooltip( forElement, message, pos ) {
	if ( forElement ) {
		this.el = this.create( forElement, message, pos );
	}
}

FNF_Tooltip.prototype = {
	el: null,
	arrowOffset: 10,

	get: function() {
		return this.el;
	},

	create: function( forElement, message, pos ) {
		pos = pos || 'bottom';
		const tooltip = document.createElement( 'div' );
		tooltip.className = 'tooltip';
		
		if ( message ) {
			this.setMessage( message );
		}

		if ( forElement ) {
			tooltip.style.top = ( this.arrowOffset + forElement.offsetTop + forElement.offsetHeight ) + 'px';
			tooltip.style.left = forElement.offsetLeft + 'px';
			forElement.parentNode.appendChild( tooltip );
		}
		return tooltip;
	},

	setMessage: function( message ) {
		this.el.innerHTML = message;
		return this;
	},

	destroy: function() {
		if ( this.el ) {
			var p = this.el.parentNode;
			if ( p ) {
				p.removeChild( this.el );
			}

			this.el = null;
		}
	},

	animate: function( andDestroy ) {
		if ( this.el ) {
			this.el.setAttribute( 'data-animate', 1 );

			setTimeout( function() {
				this.el.removeAttribute( 'data-animate' );

				if ( andDestroy ) {
					this.destroy();
				}
			}.bind(this), 5000 );
			// Duration should correspond with CSS animation duration.
		}

		return this;
	}
};